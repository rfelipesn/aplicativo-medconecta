import type { FastifyInstance } from 'fastify';
import { recordConsentInputSchema } from '@medconecta/shared';
import { prisma } from '@medconecta/db';
import { authenticate } from '../middleware/auth.js';
import { auditLog, cpfToEmail } from '../lib/audit.js';
import { signInWithPassword, updateUserPassword } from '../lib/supabase.js';
import { changePasswordInputSchema } from '../schemas/me.js';

/** Resposta da troca de senha obrigatória: inclui nova sessão válida. */
interface ChangePasswordResponse {
  ok: true;
  mustChangePassword: false;
  session: { access_token: string; refresh_token: string };
}

/** Perfil do usuário autenticado (users + doctor/patient). */
export async function registerMeRoutes(app: FastifyInstance) {
  app.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const userId = request.authUser!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        doctor: true,
        patient: {
          select: {
            id: true,
            doctorId: true,
            status: true,
            medicalHistory: true,
            allergies: true,
            activeConditions: true,
            doctor: { include: { user: { select: { id: true, fullName: true } } } },
          },
        },
      },
    });

    if (!user) {
      // Usuário existe no Auth mas ainda não tem perfil em public.users.
      return reply.code(404).send({ error: 'profile_not_found' });
    }

    return { user };
  });

  // ─── Consentimentos LGPD versionados (aceite pelo próprio paciente) ─────────
  app.post('/me/consents', { preHandler: authenticate }, async (request, reply) => {
    const userId = request.authUser!.id;
    const parsed = recordConsentInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'validation', details: parsed.error.flatten() });
    }
    const { consentType, version } = parsed.data;
    const ip = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? request.ip;

    await prisma.consent.create({
      data: {
        userId,
        consentType,
        version,
        accepted: true,
        acceptedAt: new Date(),
        ipAddress: ip ?? null,
      },
    });

    await auditLog({ userId, resourceType: 'consent', action: `consent_${consentType}`, ipAddress: ip });
    return { ok: true };
  });

  // ─── Conclusão do onboarding do paciente (1º acesso) ────────────────────────
  // IMPORTANTE: a credencial do paciente é SEMPRE CPF + data de nascimento.
  // O onboarding NÃO troca a senha do Supabase Auth — apenas marca que o
  // paciente já passou pelas telas de consentimento. O PIN/biometria é um
  // desbloqueio LOCAL do aparelho, guardado no próprio dispositivo, e nunca
  // vira a senha da conta (senão o paciente ficaria trancado, pois a tela de
  // login só usa CPF + data de nascimento).
  app.post('/me/complete-onboarding', { preHandler: authenticate }, async (request, reply) => {
    const userId = request.authUser!.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.code(404).send({ error: 'profile_not_found' });
    if (user.role !== 'patient') {
      return reply.code(403).send({ error: 'forbidden', message: 'Onboarding apenas para pacientes.' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { mustChangePassword: false },
    });

    const ip = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? request.ip;
    await auditLog({ userId, resourceType: 'user', action: 'complete_onboarding', ipAddress: ip });

    return reply.send({ ok: true, mustChangePassword: false });
  });

  // ─── (LEGADO) Troca de senha — mantido por compatibilidade, NÃO usado pelo app.
  //     Trocar a senha aqui invalida o login por CPF + data de nascimento, então
  //     o fluxo de onboarding usa /me/complete-onboarding acima. ─────────────────
  app.post('/me/change-password', { preHandler: authenticate }, async (request, reply) => {
    const userId = request.authUser!.id;
    const parsed = changePasswordInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'validation', details: parsed.error.flatten() });
    }
    const { newPassword } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.code(404).send({ error: 'profile_not_found' });
    if (user.role !== 'patient') {
      return reply.code(403).send({ error: 'forbidden', message: 'Troca obrigatória apenas para pacientes.' });
    }

    // 1) Atualiza a senha no Auth. IMPORTANTE: a alteração via admin invalida
    //    eventuais outras sessões, e dependendo da config do GoTrue pode
    //    invalidar também a sessão atual do paciente. Para evitar que o app
    //    fique com um access_token morto logo após a troca, emitimos uma NOVA
    //    sessão (sign in com a senha recém-definida) e devolvemos ao cliente.
    const email = user.email ?? cpfToEmail(user.cpf ?? '');
    await updateUserPassword(userId, newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { mustChangePassword: false },
    });

    const ip = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? request.ip;
    await auditLog({ userId, resourceType: 'user', action: 'change_password', ipAddress: ip });

    let session: { access_token: string; refresh_token: string };
    try {
      const signed = await signInWithPassword({ email, password: newPassword });
      session = { access_token: signed.access_token, refresh_token: signed.refresh_token };
    } catch {
      // Se o re-login falhar por algum motivo transitório, não abortamos a
      // resposta: o paciente ainda tem a senha atualizada. O app cairá no
      // fluxo de refresh/relLogin e se recuperará.
      return reply.code(500).send({ error: 'session_reissue_failed' });
    }

    return reply.send({
      ok: true,
      mustChangePassword: false,
      session,
    } satisfies ChangePasswordResponse);
  });
}
