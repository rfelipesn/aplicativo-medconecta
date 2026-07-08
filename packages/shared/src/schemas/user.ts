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

/** Cadastro presencial de paciente feito pelo médico/secretária. */
export const createPatientInputSchema = z.object({
  fullName: z.string().min(2).max(120),
  cpf: cpfSchema,
  phone: phoneSchema,
  email: z.string().email().optional(),
  dateOfBirth: isoDateSchema.optional(),
});
export type CreatePatientInput = z.infer<typeof createPatientInputSchema>;
