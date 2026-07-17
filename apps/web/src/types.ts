export interface DoctorProfile {
  id: string;
  specialization: string;
  crmNumber: string;
  recipeSlaHours: number;
}

export interface MeResponse {
  user: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string;
    cpf: string;
    role: 'doctor' | 'patient' | 'assistant';
    doctor: DoctorProfile | null;
    patient: unknown | null;
  };
}

export interface PatientListItem {
  id: string;
  status: 'active' | 'inactive';
  createdAt: string;
  user: {
    fullName: string;
    cpf: string;
    phone: string;
    email: string | null;
    dateOfBirth: string | null;
  };
}

export interface PatientsResponse {
  patients: PatientListItem[];
}

export interface ChatMessage {
  id: string;
  senderType: 'doctor' | 'patient' | 'system';
  messageType: 'text' | 'audio' | 'image' | 'document';
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
  patientId: string;
  doctorId: string;
  medicationNames: string[];
  quantityDays: number | null;
  reason: string | null;
  status: 'pending' | 'responded' | 'expired';
  slaDeadline: string;
  responseDate: string | null;
  createdAt: string;
  patient?: { user: { fullName: string } };
}

export interface RecipesResponse {
  recipes: RecipeRequest[];
}

export interface PatientRecipesResponse {
  recipes: RecipeRequest[];
}

export interface ExamUpload {
  id: string;
  examType: 'mri' | 'ct' | 'eeg' | 'xray' | 'blood' | 'other';
  examDate: string | null;
  fileUrl: string;
  fileMimeType: string;
  fileSize: number;
  userNotes: string | null;
  uploadedAt: string;
}

export interface ExamsResponse {
  exams: ExamUpload[];
}

export interface Document {
  id: string;
  documentType: 'recipe' | 'exam_result' | 'prescription' | 'report' | 'other';
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedByDoctor: boolean;
  createdBy: string | null;
  createdAt: string;
}

export interface DocumentsResponse {
  documents: Document[];
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  relatedDemandId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

export interface HeadacheDiaryEntry {
  id: string;
  diaryDate: string;
  startPeriod: string | null;
  endDateTime: string | null;
  durationMinutes: number | null;
  intensity: number | null;
  intensityLabel: 'Leve' | 'Moderado' | 'Severo' | 'Desconhecido';
  types: string[];
  location: { front?: string[]; back?: string[] };
  symptoms: string[];
  triggers: string[];
  medications: string[];
  reliefMethods: string[];
  impactOnActivities: string[];
  notes: string | null;
  createdAt: string;
}

export interface HeadacheResponse {
  entries: HeadacheDiaryEntry[];
}

export interface HeadacheStats {
  range: { from: string; to: string; days: number };
  totals: {
    count: number;
    daysWithHeadache: number;
    daysWithMedication: number;
    daysWithout: number;
    percentDaysWithHeadache: number;
  };
  severity: {
    leve: number;
    moderado: number;
    severo: number;
    predominant: 'leve' | 'moderado' | 'severo' | null;
  };
  frequencyPerWeek: number;
  duration: {
    avgMinutes: number | null;
    longestMinutes: number | null;
    shortestMinutes: number | null;
    longestDate: string | null;
    shortestDate: string | null;
  };
  triggers: Array<{ name: string; count: number }>;
  medications: Array<{ name: string; count: number }>;
}

export interface HeadacheStatsResponse {
  stats: HeadacheStats;
}

// Tipos de Demandas (CRUD completo)
export interface Demand {
  id: string;
  patientId: string;
  doctorId: string;
  title: string | null;
  description: string | null;
  type: 'recipe_renewal' | 'appointment_request' | 'exam_result' | 'symptom_log' | 'general_question' | 'second_opinion';
  priority: 'urgent' | 'elective' | 'informational' | 'other' | null;
  status: 'open' | 'responded' | 'closed' | 'pending_action';
  aiConfidenceScore: number | null;
  createdAt: string;
  respondedAt: string | null;
  closedAt: string | null;
  patient?: {
    id: string;
    user: {
      fullName: string;
      phone?: string;
    };
  };
  doctor?: {
    id: string;
    user: {
      fullName: string;
    };
  };
}

export interface DemandsResponse {
  demands: Demand[];
  total: number;
}

export interface DemandSearchParams {
  status?: 'open' | 'responded' | 'closed' | 'pending_action';
  type?: Demand['type'];
  priority?: 'urgent' | 'elective' | 'informational' | 'other';
  limit?: number;
  offset?: number;
}

export interface CreateDemandInput {
  patientId: string;
  title?: string;
  description: string;
  type: Demand['type'];
  priority?: 'urgent' | 'elective' | 'informational' | 'other';
}

export interface UpdateDemandStatusInput {
  status: 'responded' | 'closed' | 'pending_action';
  responseNotes?: string;
}

// Tipos de Assistentes (DoctorAssistant)
export interface AssistantPermissions {
  can_view: boolean;
  can_respond: boolean;
  can_approve_recipes: boolean;
}

export interface Assistant {
  id: string;
  doctorId: string;
  assistantUserId: string;
  permissions: AssistantPermissions;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string;
    cpf: string;
  };
}

export interface AssistantsResponse {
  assistants: Assistant[];
}

export interface CreateAssistantInput {
  email: string;
  fullName: string;
  cpf: string;
  phone: string;
  initialPassword: string;
  permissions?: Partial<AssistantPermissions>;
}

export interface CreateAssistantResponse {
  ok: true;
  assistant: Assistant;
  credentials: { email: string; password: string; hint: string };
}

export interface UpdateAssistantPermissionsInput {
  permissions: AssistantPermissions;
}

// HealthEventLog — anotações de sintomas gerais
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

// Tipos de Convulsão (SeizureDiary) — espelham o mobile e a API
export interface SeizureDiaryEntry {
  id: string;
  seizureDate: string;
  seizureTime: string | null;
  lossOfConsciousness: boolean;
  hospitalVisit: boolean;
  hospitalName: string | null;
  durationMinutes: number;
  medicationTakenCorrectly: boolean;
  medicationBrandChanged: boolean;
  newMedicationBrand: string | null;
  additionalNotes: string | null;
  createdAt: string;
}

export interface SeizureResponse {
  entries: SeizureDiaryEntry[];
}

export interface SeizureStats {
  range: { from: string; to: string; days: number };
  totals: { count: number; daysWithSeizure: number; percentDaysWithSeizure: number };
  frequencyPerWeek: number;
  consciousness: { withLoss: number; withoutLoss: number; percentWithLoss: number };
  hospital: {
    visited: number;
    notVisited: number;
    percentVisited: number;
    mostCited: Array<{ name: string; count: number }>;
  };
  medication: {
    takenCorrectly: number;
    notTaken: number;
    percentCorrect: number;
  };
  brandChange: {
    changed: number;
    notChanged: number;
    topBrands: Array<{ name: string; count: number }>;
  };
  duration: {
    avgMinutes: number | null;
    longestMinutes: number | null;
    shortestMinutes: number | null;
    longestDate: string | null;
    shortestDate: string | null;
  };
  weekday: number[];
  triggers: Array<{ name: string; count: number }>;
  auraSymptoms: Array<{ name: string; count: number }>;
}

export interface SeizureStatsResponse {
  stats: SeizureStats;
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
