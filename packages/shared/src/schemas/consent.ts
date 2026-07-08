import { z } from 'zod';
import { CONSENT_TYPES } from '../constants.js';
import { uuidSchema, isoDateTimeSchema } from './common.js';

/** Consentimentos LGPD (base legal de dado sensível), versionados. */
export const consentSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  consentType: z.enum(CONSENT_TYPES),
  version: z.string().min(1),
  accepted: z.boolean(),
  acceptedAt: isoDateTimeSchema,
  ipAddress: z.string().nullable().optional(),
  revokedAt: isoDateTimeSchema.nullable().optional(),
});
export type Consent = z.infer<typeof consentSchema>;

export const recordConsentInputSchema = z.object({
  consentType: z.enum(CONSENT_TYPES),
  version: z.string().min(1),
  accepted: z.literal(true),
});
export type RecordConsentInput = z.infer<typeof recordConsentInputSchema>;
