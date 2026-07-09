import { z } from 'zod';
import { USER_ROLES, PATIENT_STATUS } from '../constants.js';
import { uuidSchema, cpfSchema, phoneSchema, isoDateSchema } from './common.js';

export const userSchema = z.object({
  id: uuidSchema,
  phone: phoneSchema,
  cpf: cpfSchema,
  email: z.string().email().nullable().optional(),
  fullName: z.string().min(2).max(120),
  dateOfBirth: isoDateSchema.nullable().optional(),
  role: z.enum(USER_ROLES),
  profilePhotoUrl: z.string().url().nullable().optional(),
});
export type User = z.infer<typeof userSchema>;

export const doctorSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  specialization: z.string().min(2),
  crmNumber: z.string().min(1),
  bio: z.string().nullable().optional(),
  availabilityStartTime: z.string().nullable().optional(),
  availabilityEndTime: z.string().nullable().optional(),
  workingDays: z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]),
  recipeSlaHours: z.number().int().positive().default(72),
  secretaryWhatsappNumber: phoneSchema.nullable().optional(),
  videoCallEnabled: z.boolean().default(false),
});
export type Doctor = z.infer<typeof doctorSchema>;

export const patientSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  doctorId: uuidSchema,
  medicalHistory: z.string().nullable().optional(),
  allergies: z.string().nullable().optional(),
  activeConditions: z.array(z.string()).default([]),
  status: z.enum(PATIENT_STATUS).default('active'),
});
export type Patient = z.infer<typeof patientSchema>;

/**
 * Cadastro presencial de paciente feito pelo médico/secretária.
 * `dateOfBirth` é OBRIGATÓRIO: vira a senha inicial do paciente (DDMMAAAA).
 */
export const createPatientInputSchema = z.object({
  fullName: z.string().min(2).max(120),
  cpf: cpfSchema,
  phone: phoneSchema,
  email: z.string().email().optional(),
  dateOfBirth: isoDateSchema,
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
});
export type CreatePatientInput = z.infer<typeof createPatientInputSchema>;

/** Auto-cadastro de médico (cria conta no Auth + perfil). */
export const registerDoctorInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres').max(72),
  fullName: z.string().min(2).max(120),
  cpf: cpfSchema,
  phone: phoneSchema,
  dateOfBirth: isoDateSchema.optional(),
  specialization: z.string().min(2),
  crmNumber: z.string().min(1),
});
export type RegisterDoctorInput = z.infer<typeof registerDoctorInputSchema>;

/** Login por e-mail + senha (proxy para o Supabase Auth). */
export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

/**
 * Paciente ativa sua própria conta (gerada pelo médico) definindo e-mail e senha.
 * O `inviteToken` é o userId gerado no cadastro — o front recebe via link de convite.
 */
export const activatePatientInputSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});
export type ActivatePatientInput = z.infer<typeof activatePatientInputSchema>;

/**
 * Login de paciente via CPF + data de nascimento.
 * Formato da data: DDMMAAAA (ex: "22111989" para 22/11/1989).
 * Isso é a senha inicial gerada automaticamente no cadastro.
 */
export const loginPatientInputSchema = z.object({
  cpf: cpfSchema,
  birthDate: z
    .string()
    .regex(/^\d{8}$/, 'Data de nascimento deve ter 8 dígitos: DDMMAAAA'),
});
export type LoginPatientInput = z.infer<typeof loginPatientInputSchema>;
