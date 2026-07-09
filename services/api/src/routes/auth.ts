import type { FastifyInstance } from 'fastify';
import {
  registerDoctorInputSchema,
  loginInputSchema,
  loginPatientInputSchema,
  activatePatientInputSchema,
} from '@medconecta/shared';
import { prisma } from '@medconecta/db';
import {
  createAuthUser,
  deleteAuthUser,
  signInWithPassword,
  SupabaseAuthError,
} from '../lib/supabase.js';
import { auditLog, cpfToEmail } from '../lib/audit.js';

/** Consents LGPD registrados automaticamente no momento do cadastro. */
const LGPD_CONSENT_TYPES = [
  'data_processing',
  'sensitive_health_data',
  'terms',
  'privacy_policy',
  'elective_scope_acknowledgment',
] as const;

async function createLgpdConsents(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], userId: string, ip: string | null) {
  for (const type of LGPD_CONSENT_TYPES) {
    await tx.consent.create({
      data: {
        userId,
        consentType: type,
        version: '1.0',
        accepted: true,
        acceptedAt: new Date(),
        ipAddress: ip,
      },
    });
  }
}

/**
 * Cadastro e login. Como NÃO há trigger criando `public.users` a partir de
 * `auth.users`, o provisionamento é feito aqui: cria o usuário no Supabase Auth
 * e, em seguida, o perfil (`users` + `doctors`) numa transação. Se o perfil
 * falhar, o usuário do Auth é removido para não ficar órfão.
 */
export async function registerAuthRoutes(app: FastifyInstance) {
  // ─── Doctor: auto-cadastro ────────────────────────────────────────────────
  app.post('/auth/register/doctor', async (request, reply) => {
    const parsed = registerDoctorInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'validation', details: parsed.error.flatten() });
    }
    const input = parsed.data;
    const ip = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? request.ip;

    let authUserId: string;
    try {
      const authUser = await createAuthUser({
        email: input.email,
        password: input.password,
        userMetadata: { full_name: input.fullName, role: 'doctor' },
      });
      authUserId = authUser.id;
    } catch (err) {
      if (err instanceof SupabaseAuthError) {
        const status = err.status === 422 ? 409 : err.status;
        return reply.code(status).send({ error: 'auth_create_failed', message: err.message });
      }
      throw err;
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            id: authUserId,
            email: input.email,
            phone: input.phone,
            cpf: input.cpf,
            fullName: input.fullName,
            dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
            role: 'doctor',
          },
        });
        const doctor = await tx.doctor.create({
          data: {
            userId: user.id,
            specialization: input.specialization,
            crmNumber: input.crmNumber,
          },
        });
        await createLgpdConsents(tx, user.id, ip ?? null);
        return { user, doctor };
      });

      await auditLog({ userId: result.user.id, resourceType: 'user', action: 'register_doctor', ipAddress: ip });

      return reply.code(201).send({
        ok: true,
        userId: result.user.id,
        doctorId: result.doctor.id,
      });
    } catch (err) {
      await deleteAuthUser(authUserId).catch(() => undefined);
      const code = (err as { code?: string }).code;
      if (code === 'P2002') {
        return reply
          .code(409)
          .send({ error: 'conflict', message: 'CPF, telefone ou e-mail já cadastrado.' });
      }
      app.log.error({ err }, 'doctor profile creation failed');
      return reply.code(500).send({ error: 'profile_create_failed' });
    }
  });

  // ─── Paciente: login via CPF + data de nascimento (DDMMAAAA) ─────────────
  app.post('/auth/login/patient', async (request, reply) => {
    const parsed = loginPatientInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'validation', details: parsed.error.flatten() });
    }
    const { cpf, birthDate } = parsed.data;

    // Busca o usuário pelo CPF para confirmar que existe e é paciente.
    const cpfDigits = cpf.replace(/\D/g, '');
    const user = await prisma.user.findFirst({
      where: { cpf: cpfDigits, role: 'patient', deletedAt: null },
    });
    if (!user) {
      return reply.code(401).send({ error: 'invalid_credentials' });
    }

    // O e-mail do Supabase Auth é {cpf}@medconecta.local e a senha é o birthDate (DDMMAAAA).
    const email = cpfToEmail(cpfDigits);
    try {
      const session = await signInWithPassword({ email, password: birthDate });

      await auditLog({
        userId: user.id,
        resourceType: 'session',
        action: 'login_patient',
        ipAddress: (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? request.ip,
      });

      return {
        ok: true,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        user: { id: user.id, role: user.role },
      };
    } catch {
      return reply.code(401).send({ error: 'invalid_credentials' });
    }
  });

  // ─── Médico/admin: login via e-mail + senha ───────────────────────────────
  app.post('/auth/login', async (request, reply) => {
    const parsed = loginInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'validation', details: parsed.error.flatten() });
    }
    try {
      const session = await signInWithPassword(parsed.data);
      return {
        ok: true,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        user: session.user ? { id: session.user.id, email: session.user.email } : undefined,
      };
    } catch (err) {
      if (err instanceof SupabaseAuthError) {
        return reply.code(401).send({ error: 'invalid_credentials' });
      }
      throw err;
    }
  });

  // ─── Ativação de conta (fluxo legado de convite por link) ────────────────
  app.post('/auth/activate/patient', async (request, reply) => {
    const parsed = activatePatientInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'validation', details: parsed.error.flatten() });
    }
    const { userId, email, password } = parsed.data;

    const patient = await prisma.patient.findFirst({ where: { userId } });
    if (!patient) return reply.code(404).send({ error: 'patient_not_found' });

    const res = await fetch(
      `${process.env.SUPABASE_URL}/auth/v1/admin/users/${userId}`,
      {
        method: 'PUT',
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, email_confirm: true }),
      },
    );
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      return reply.code(res.status).send({ error: 'auth_update_failed', message: data.msg });
    }

    await prisma.user.update({ where: { id: userId }, data: { email } });
    return { ok: true, message: 'Conta ativada com sucesso.' };
  });
}
