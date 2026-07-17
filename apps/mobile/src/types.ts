export interface DoctorInfo {
  id: string;
  specialization: string;
  crmNumber: string;
  user: { id: string; fullName: string };
}

export interface PatientProfile {
  id: string;
  doctorId: string;
  status: 'active' | 'inactive';
  medicalHistory: string | null;
  allergies: string | null;
  activeConditions: string[];
  doctor: DoctorInfo;
}

export interface MeResponse {
  user: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string;
    role: 'doctor' | 'patient' | 'assistant';
    mustChangePassword: boolean;
    doctor: { id: string; specialization: string } | null;
    patient: PatientProfile | null;
  };
}

export interface ChatMessage {
  id: string;
  senderType: 'doctor' | 'patient' | 'system';
  messageType: string;
  contentText: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface MessagesResponse {
  role: 'doctor' | 'patient';
  messages: ChatMessage[];
}

export interface RecipeRequest {
  id: string;
  medicationNames: string[];
  quantityDays: number | null;
  reason: string | null;
  status: 'pending' | 'responded' | 'expired';
  slaDeadline: string;
  createdAt: string;
}

export interface RecipesResponse {
  recipes: RecipeRequest[];
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  relatedDemandId?: string | null;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

export interface Demand {
  id: string;
  title: string | null;
  description: string | null;
  type:
    | 'recipe_renewal'
    | 'appointment_request'
    | 'exam_result'
    | 'symptom_log'
    | 'general_question'
    | 'second_opinion';
  priority: 'urgent' | 'elective' | 'informational' | 'other' | null;
  status: 'open' | 'responded' | 'closed' | 'pending_action';
  aiConfidenceScore: number | null;
  createdAt: string;
  respondedAt: string | null;
  closedAt: string | null;
  responseNotes?: string | null;
}

export interface DemandsResponse {
  demands: Demand[];
}

// HealthEventLog — anotações de sintomas gerais
export type HealthEventType = 'headache' | 'seizure' | 'sleep' | 'symptom' | 'other';
export type HealthInputType = 'text' | 'audio';

export interface HealthEvent {
  id: string;
  eventType: 'headache' | 'seizure' | 'sleep' | 'symptom' | 'other';
  inputType: 'text' | 'audio';
  descriptionText: string | null;
  audioUrl: string | null;
  transcriptionText: string | null;
  transcriptionConfidence: number | null;
  eventDatetime: string;
  syncStatus: 'pending' | 'synced';
  createdAt: string;
}

export interface HealthEventsResponse {
  events: HealthEvent[];
}

export interface HealthEventTypeCount {
  type: 'headache' | 'seizure' | 'sleep' | 'symptom' | 'other';
  count: number;
  percent: number;
}

export interface HealthEventStats {
  range: { from: string; to: string; days: number };
  totals: { count: number; distinctDays: number; averagePerWeek: number };
  byType: HealthEventTypeCount[];
  weekday: number[];
  topDescriptions: Array<{ text: string; count: number }>;
}

export interface HealthEventStatsResponse {
  stats: HealthEventStats;
}

export interface CreateHealthEventInput {
  eventType: 'headache' | 'seizure' | 'sleep' | 'symptom' | 'other';
  inputType?: 'text' | 'audio';
  descriptionText: string;
  audioUrl?: string;
  eventDatetime: string;
}

export type DocumentKind =
  | 'recipe'
  | 'exam_result'
  | 'prescription'
  | 'report'
  | 'other';

export interface Document {
  id: string;
  documentType: DocumentKind;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedByDoctor: boolean;
  createdAt: string;
}

export interface DocumentsResponse {
  documents: Document[];
}

export interface DocumentDownloadResponse {
  signedUrl: string;
  expiresInSeconds: number;
}
