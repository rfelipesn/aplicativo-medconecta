-- ============================================================
-- MEDconecta - Migration 0001: Schema inicial (multi-tenant)
-- Fonte autoritativa do modelo de dados. Região: sa-east-1.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- ENUMS ----------
create type user_role as enum ('doctor', 'patient', 'assistant');
create type patient_status as enum ('active', 'inactive');
create type demand_type as enum (
  'recipe_renewal', 'appointment_request', 'exam_result',
  'symptom_log', 'general_question', 'second_opinion'
);
create type demand_priority as enum ('urgent', 'elective', 'informational', 'other');
create type demand_status as enum ('open', 'responded', 'closed', 'pending_action');
create type sender_type as enum ('patient', 'doctor', 'system');
create type message_type as enum ('text', 'audio', 'image', 'document');
create type health_event_type as enum ('headache', 'seizure', 'sleep', 'symptom', 'other');
create type input_type as enum ('text', 'audio');
create type exam_type as enum ('mri', 'ct', 'eeg', 'xray', 'blood', 'other');
create type recipe_status as enum ('pending', 'responded', 'expired');
create type document_type as enum ('recipe', 'exam_result', 'prescription', 'report', 'other');
create type consent_type as enum (
  'data_processing', 'sensitive_health_data', 'terms',
  'privacy_policy', 'elective_scope_acknowledgment'
);
create type sync_status as enum ('pending', 'synced');

-- ---------- TRIGGER util: updated_at ----------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- USERS (perfil; id = auth.users.id) ----------
create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text unique not null,
  cpf text unique not null,            -- considerar criptografia em coluna (AES-256) na aplicação
  email text unique,
  full_name text not null,
  date_of_birth date,
  role user_role not null,
  profile_photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz                -- soft delete (LGPD): null = ativo
);
create trigger trg_users_updated before update on users
  for each row execute function set_updated_at();

-- ---------- DOCTORS ----------
create table doctors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references users (id) on delete cascade,
  specialization text not null,
  crm_number text not null,
  bio text,
  availability_start_time text,
  availability_end_time text,
  working_days int[] not null default '{1,2,3,4,5}',
  recipe_sla_hours int not null default 72,
  secretary_whatsapp_number text,
  video_call_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_doctors_updated before update on doctors
  for each row execute function set_updated_at();

-- ---------- PATIENTS ----------
create table patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references users (id) on delete cascade,
  doctor_id uuid not null references doctors (id),
  medical_history text,
  allergies text,
  active_conditions jsonb not null default '[]'::jsonb,
  status patient_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_patients_doctor on patients (doctor_id);
create trigger trg_patients_updated before update on patients
  for each row execute function set_updated_at();

-- ---------- DOCTOR ASSISTANTS ----------
create table doctor_assistants (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors (id) on delete cascade,
  assistant_user_id uuid not null references users (id) on delete cascade,
  permissions jsonb not null default '{"can_view":true,"can_respond":false,"can_approve_recipes":false}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references users (id)
);
create index idx_assistants_doctor on doctor_assistants (doctor_id);

-- ---------- DEMANDS ----------
create table demands (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients (id) on delete cascade,
  doctor_id uuid not null references doctors (id),
  title text,
  description text,
  type demand_type not null,
  priority demand_priority,            -- definido pela IA (Fase 2)
  status demand_status not null default 'open',
  ai_confidence_score int,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  closed_at timestamptz
);
create index idx_demands_doctor_priority on demands (doctor_id, priority, status);

-- ---------- CHAT MESSAGES (histórico permanente, sem delete) ----------
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients (id) on delete cascade,
  doctor_id uuid not null references doctors (id),
  sender_type sender_type not null,
  message_type message_type not null,
  content_text text,
  audio_url text,
  transcription_text text,             -- visível APENAS ao médico (RLS de coluna na app)
  transcription_confidence int,
  is_read boolean not null default false,
  read_at timestamptz,
  sync_status sync_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_chat_patient_created on chat_messages (patient_id, created_at);
create trigger trg_chat_updated before update on chat_messages
  for each row execute function set_updated_at();

-- ---------- HEALTH EVENT LOGS (Anotar Sintoma/Crise) ----------
create table health_event_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients (id) on delete cascade,
  event_type health_event_type not null,
  input_type input_type not null,
  description_text text,
  audio_url text,
  transcription_text text,             -- visível APENAS ao médico
  transcription_confidence int,
  event_datetime timestamptz not null,
  sync_status sync_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_health_events_patient on health_event_logs (patient_id, event_datetime);
create trigger trg_health_events_updated before update on health_event_logs
  for each row execute function set_updated_at();

-- ---------- HEADACHE DIARY ----------
create table headache_diary (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients (id) on delete cascade,
  diary_date date not null,
  start_time text,
  end_time timestamptz,
  duration_minutes int,
  intensity int check (intensity between 1 and 10),
  types jsonb not null default '[]'::jsonb,
  location jsonb not null default '{}'::jsonb,
  symptoms jsonb not null default '[]'::jsonb,
  triggers jsonb not null default '[]'::jsonb,
  medications_taken jsonb not null default '[]'::jsonb,
  relief_methods jsonb not null default '[]'::jsonb,
  impact_on_activities jsonb not null default '[]'::jsonb,
  notes text,
  sync_status sync_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_headache_patient_date on headache_diary (patient_id, diary_date);
create trigger trg_headache_updated before update on headache_diary
  for each row execute function set_updated_at();

-- ---------- SEIZURE DIARY ----------
create table seizure_diary (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients (id) on delete cascade,
  seizure_date date not null,
  seizure_time text,
  loss_of_consciousness boolean not null,
  hospital_visit boolean not null,
  hospital_name text,
  duration_minutes int not null,
  medication_taken_correctly boolean not null,
  medication_brand_changed boolean not null,
  new_medication_brand text,
  additional_notes text,
  sync_status sync_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_seizure_patient_date on seizure_diary (patient_id, seizure_date);
create trigger trg_seizure_updated before update on seizure_diary
  for each row execute function set_updated_at();

-- ---------- RECIPE REQUESTS (SLA burocrático 72h) ----------
create table recipe_requests (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients (id) on delete cascade,
  doctor_id uuid not null references doctors (id),
  medication_names jsonb not null default '[]'::jsonb,
  quantity_days int,
  reason text,
  status recipe_status not null default 'pending',
  response_date timestamptz,
  sla_deadline timestamptz not null,
  response_document_id uuid,           -- PDF anexado pelo médico (sem terceiros no MVP)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_recipe_doctor_status on recipe_requests (doctor_id, status);
create trigger trg_recipe_updated before update on recipe_requests
  for each row execute function set_updated_at();

-- ---------- EXAM UPLOADS ----------
create table exam_uploads (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients (id) on delete cascade,
  doctor_id uuid not null references doctors (id),
  exam_type exam_type not null,
  exam_date date,
  file_url text not null,
  file_mime_type text not null,
  file_size int not null,
  user_notes text,
  sync_status sync_status not null default 'pending',
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index idx_exams_patient on exam_uploads (patient_id);

-- ---------- DOCUMENTS (receitas em PDF, laudos) ----------
create table documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients (id) on delete cascade,
  doctor_id uuid not null references doctors (id),
  document_type document_type not null,
  file_url text not null,
  file_name text not null,
  file_size int not null,
  mime_type text not null,
  uploaded_by_doctor boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references users (id)
);
create index idx_documents_patient on documents (patient_id);

-- recipe_requests.response_document_id -> documents.id (após a tabela existir)
alter table recipe_requests
  add constraint fk_recipe_response_document
  foreign key (response_document_id) references documents (id);

-- ---------- NOTIFICATIONS ----------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  type text not null,
  title text not null,                 -- NUNCA expor diagnóstico no corpo
  body text not null,
  related_demand_id uuid references demands (id),
  channels_sent jsonb not null default '[]'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on notifications (user_id, created_at);

-- ---------- CONSENTS (LGPD, versionado, append-only) ----------
create table consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  consent_type consent_type not null,
  version text not null,
  accepted boolean not null,
  accepted_at timestamptz not null default now(),
  ip_address text,
  revoked_at timestamptz
);
create index idx_consents_user on consents (user_id, consent_type);

-- ---------- AUDIT LOGS (LGPD, append-only) ----------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users (id),
  resource_type text not null,
  resource_id text,
  action text not null,
  ip_address text,
  timestamp timestamptz not null default now()
);
create index idx_audit_resource on audit_logs (resource_type, resource_id);

-- ---------- SUB-TABELAS configuráveis pelo médico ----------
create table symptom_types (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors (id) on delete cascade,
  symptom_name text not null,
  icon text,
  is_common boolean not null default false
);

create table trigger_types (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors (id) on delete cascade,
  trigger_name text not null,
  category text,
  is_common boolean not null default false
);

create table medication_types (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors (id) on delete cascade,
  medication_name text not null,
  is_prescribed boolean not null default false,
  effectiveness_rating int
);

create table relief_methods (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors (id) on delete cascade,
  method_name text not null,
  icon text,
  is_common boolean not null default false
);
