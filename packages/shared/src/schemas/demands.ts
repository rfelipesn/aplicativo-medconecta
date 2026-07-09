import { z } from 'zod';
import { DEMAND_TYPES, DEMAND_PRIORITIES, DEMAND_STATUS } from '../constants.js';
import { uuidSchema, isoDateTimeSchema } from './common.js';

export const demandSchema = z.object({
  id: uuidSchema,
  patientId: uuidSchema,
  doctorId: uuidSchema,
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  type: z.enum(DEMAND_TYPES),
  priority: z.enum(DEMAND_PRIORITIES).nullable().optional(),
  status: z.enum(DEMAND_STATUS).default('open'),
  aiConfidenceScore: z.number().nullable().optional(),
  createdAt: isoDateTimeSchema,
  respondedAt: isoDateTimeSchema.nullable().optional(),
  closedAt: isoDateTimeSchema.nullable().optional(),
});
export type Demand = z.infer<typeof demandSchema>;

export const createDemandInputSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().min(1).max(2000),
  type: z.enum(DEMAND_TYPES),
  priority: z.enum(DEMAND_PRIORITIES).optional(),
});
export type CreateDemandInput = z.infer<typeof createDemandInputSchema>;

export const updateDemandStatusInputSchema = z.object({
  status: z.enum(['open', 'responded', 'closed', 'pending_action']),
  responseNotes: z.string().max(2000).optional(),
});
export type UpdateDemandStatusInput = z.infer<typeof updateDemandStatusInputSchema>;

export const demandSearchParamsSchema = z.object({
  status: z.enum(DEMAND_STATUS).optional(),
  type: z.enum(DEMAND_TYPES).optional(),
  priority: z.enum(DEMAND_PRIORITIES).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});
export type DemandSearchParams = z.infer<typeof demandSearchParamsSchema>;
