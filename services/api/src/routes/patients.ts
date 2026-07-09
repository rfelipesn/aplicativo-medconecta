import type { FastifyInstance } from 'fastify';
import { createPatientInputSchema } from '@medconecta/shared';
import { prisma } from '@medconecta/db';
import { authenticate, getDoctorForRequest } from '../middleware/auth.js';
import { createAuthUser, deleteAuthUser, SupabaseAuthError } from '../lib/supabase.js';
import { auditLog, dobToPassword, cpfToEmail } from '../lib/audit.js';

const LGPD_CONSENT_TYPES = [
  'data_processing',
  'sensitive_health_data',
  'terms',
  'privacy_policy',
  'elective_scope_acknowledgment',
] as const;

/**
 * Pacientes são cadastrados PELO MÉDICO (presencial).
 *
 * Credenciais iniciais geradas automaticamente:
 *  - Login:  CPF (só dígitos)
 *  - Senha:  data de nascimento em DDMMAAAA  (ex: "22111989")
 *
 * O médico informa essas credenciais ao paciente pessoalmente.
 */
export async function registerPatientRoutes(app: FastifyInstance) {
  app.get('/patients', { preHandler: authenticate }, async (request, reply) => {
    const doctor = await getDoctorForRequest(request);
    if (!doctor) return reply.code(403).send({ error: 'not_a_doctor' });

    const patients = await prisma.patient.findMany({
      where: { doctorId: doctor.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { fullName: true, cpf: true, phone: true, email: true, dateOfBirth: true },
        },
      },
    });

    return { patients };
  });

  app.post('/patients', { preHandler: authenticate }, async (request, reply) => {
    const doctor = await getDoctorForRequest(request);
    if (!doctor) return reply.code(403).send({ error: 'not_a_doctor' });

    const parsed = createPatientInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'validation', details: parsed.error.flatten() });
    }
    const input = parsed.data;
    const ip = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? request.ip;

    const cpfDigits = input.cpf.replace(/\D/g, '');

    // Senha inicial = data de nascimento no formato DDMMAAAA
    const initialPassword = dobToPassword(input.dateOfBirth);
    const email = input.email ?? cpfToEmail(cpfDigits);

    let authUserId: string;
    try {
      const authUser = await createAuthUser({
        email,
        password: initialPassword,
        userMetadata: { full_name: input.fullName, role: 'patient' },
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
            email,
            phone: input.phone,
            cpf: cpfDigits,
            fullName: input.fullName,
            dateOfBirth: new Date(input.dateOfBirth),
            role: 'patient',
            mustChangePassword: true,
          },
        });
        const patient = await tx.patient.create({
          data: {
            userId: user.id,
            doctorId: doctor.id,
            medicalHistory: input.medicalHistory ?? null,
            allergies: input.allergies ?? null,
          },
        });

        // LGPD: consents registrados no ato do cadastro (pelo médico, em nome do paciente).
        for (const type of LGPD_CONSENT_TYPES) {
          await tx.consent.create({
            data: {
              userId: user.id,
              consentType: type,
              version: '1.0',
              accepted: true,
              acceptedAt: new Date(),
              ipAddress: ip ?? null,
            },
          });
        }

        return { user, patient };
      });

      await auditLog({
        userId: doctor.userId,
        resourceType: 'patient',
        action: 'create_patient',
        resourceId: result.patient.id,
        ipAddress: ip,
      });

      return reply.code(201).send({
        ok: true,
        patientId: result.patient.id,
        userId: result.user.id,
        credentials: {
          login: cpfDigits,
          password: initialPassword,
          hint: 'CPF (só dígitos) + data de nascimento DDMMAAAA',
        },
      });
    } catch (err) {
      await deleteAuthUser(authUserId).catch(() => undefined);
      const code = (err as { code?: string }).code;
      if (code === 'P2002') {
        return reply
          .code(409)
          .send({ error: 'conflict', message: 'CPF, telefone ou e-mail já cadastrado.' });
      }
      app.log.error({ err }, 'patient creation failed');
      return reply.code(500).send({ error: 'patient_create_failed' });
    }
  });
}
