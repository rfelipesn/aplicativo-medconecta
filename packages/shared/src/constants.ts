/**
 * Constantes e enums do MEDconecta.
 * Contrato único compartilhado entre mobile, web e api.
 * Reflete o modelo de dados do plano oficial.
 */

export const USER_ROLES = ['doctor', 'patient', 'assistant'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PATIENT_STATUS = ['active', 'inactive'] as const;
export type PatientStatus = (typeof PATIENT_STATUS)[number];

export const DEMAND_TYPES = [
  'recipe_renewal',
  'appointment_request',
  'exam_result',
  'symptom_log',
  'general_question',
  'second_opinion',
] as const;
export type DemandType = (typeof DEMAND_TYPES)[number];

/**
 * Prioridade ordena demandas ELETIVAS. "urgent" = resposta mais rápida
 * dentro do fluxo eletivo, NUNCA emergência médica (essas vão para o PS).
 */
export const DEMAND_PRIORITIES = ['urgent', 'elective', 'informational', 'other'] as const;
export type DemandPriority = (typeof DEMAND_PRIORITIES)[number];

export const DEMAND_STATUS = ['open', 'responded', 'closed', 'pending_action'] as const;
export type DemandStatus = (typeof DEMAND_STATUS)[number];

export const HEALTH_EVENT_TYPES = [
  'headache',
  'seizure',
  'sleep',
  'symptom',
  'other',
] as const;
export type HealthEventType = (typeof HEALTH_EVENT_TYPES)[number];

export const INPUT_TYPES = ['text', 'audio'] as const;
export type InputType = (typeof INPUT_TYPES)[number];

export const MESSAGE_TYPES = ['text', 'audio', 'image', 'document'] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export const SENDER_TYPES = ['patient', 'doctor', 'system'] as const;
export type SenderType = (typeof SENDER_TYPES)[number];

export const HEADACHE_TYPES = ['migraine', 'tension', 'cluster', 'other'] as const;
export type HeadacheType = (typeof HEADACHE_TYPES)[number];

export const EXAM_TYPES = ['mri', 'ct', 'eeg', 'xray', 'blood', 'other'] as const;
export type ExamType = (typeof EXAM_TYPES)[number];

export const RECIPE_STATUS = ['pending', 'responded', 'expired'] as const;
export type RecipeStatus = (typeof RECIPE_STATUS)[number];

export const RECIPE_QUANTITY_DAYS = [30, 60, 90] as const;
export type RecipeQuantityDays = (typeof RECIPE_QUANTITY_DAYS)[number];

export const DOCUMENT_TYPES = [
  'recipe',
  'exam_result',
  'prescription',
  'report',
  'other',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const NOTIFICATION_TYPES = [
  'appointment_reminder',
  'new_message',
  'demand_status_change',
  'recipe_ready',
  'system',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const CONSENT_TYPES = [
  'data_processing',
  'sensitive_health_data',
  'terms',
  'privacy_policy',
  'elective_scope_acknowledgment',
] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];

export const SYNC_STATUS = ['pending', 'synced'] as const;
export type SyncStatus = (typeof SYNC_STATUS)[number];

export const AUDIT_ACTIONS = ['view', 'create', 'update', 'delete', 'download'] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** Regras de negócio (valores travados no plano) */
export const BUSINESS_RULES = {
  /** SLA burocrático EXCLUSIVO da solicitação de receita (não clínico). */
  RECIPE_SLA_HOURS: 72,
  /** Lembrete ao médico se a receita não for respondida neste prazo. */
  RECIPE_REMINDER_HOURS: 48,
  /** Limite de duração de áudio (chat e Anotar Sintoma), em segundos. */
  AUDIO_MAX_DURATION_SECONDS: 120,
  /** Retenção de prontuário (Resolução CFM 1.821/2007), em anos. */
  MEDICAL_RECORD_RETENTION_YEARS: 20,
} as const;

/** Avisos de escopo eletivo exibidos na UI (regra-mãe do produto). */
export const ELECTIVE_SCOPE_NOTICE = {
  short: 'Canal para assuntos eletivos. NÃO é para urgências/emergências.',
  emergency:
    'Em caso agudo, procure atendimento presencial, de preferência um Pronto-Socorro (SAMU 192 / Bombeiros 193).',
  disclaimer: 'Este app é ferramenta auxiliar e não substitui consulta presencial.',
} as const;
