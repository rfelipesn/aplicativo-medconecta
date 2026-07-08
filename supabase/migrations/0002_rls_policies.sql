-- ============================================================
-- MEDconecta - Migration 0002: Row Level Security (RLS)
-- Isolamento multi-tenant: cada paciente vê só os seus dados;
-- cada médico vê só os pacientes vinculados a ele.
-- ============================================================

-- ---------- Helpers (mapeiam auth.uid() -> doctor/patient) ----------
create or replace function current_doctor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select d.id from doctors d where d.user_id = auth.uid();
$$;

create or replace function current_patient_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id from patients p where p.user_id = auth.uid();
$$;

-- ---------- Habilitar RLS ----------
alter table users               enable row level security;
alter table doctors             enable row level security;
alter table patients            enable row level security;
alter table doctor_assistants   enable row level security;
alter table demands             enable row level security;
alter table chat_messages       enable row level security;
alter table health_event_logs   enable row level security;
alter table headache_diary      enable row level security;
alter table seizure_diary       enable row level security;
alter table recipe_requests     enable row level security;
alter table exam_uploads        enable row level security;
alter table documents           enable row level security;
alter table notifications       enable row level security;
alter table consents            enable row level security;
alter table audit_logs          enable row level security;
alter table symptom_types       enable row level security;
alter table trigger_types       enable row level security;
alter table medication_types    enable row level security;
alter table relief_methods      enable row level security;

-- ---------- USERS ----------
create policy users_select_self on users
  for select using (id = auth.uid());
create policy users_update_self on users
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------- DOCTORS (perfil do médico legível pelos seus pacientes) ----------
create policy doctors_select_self on doctors
  for select using (user_id = auth.uid());
create policy doctors_select_by_patient on doctors
  for select using (id = (select doctor_id from patients where user_id = auth.uid()));
create policy doctors_update_self on doctors
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- PATIENTS ----------
create policy patients_select_self on patients
  for select using (user_id = auth.uid());
create policy patients_select_by_doctor on patients
  for select using (doctor_id = current_doctor_id());
create policy patients_update_self on patients
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy patients_doctor_manage on patients
  for all using (doctor_id = current_doctor_id()) with check (doctor_id = current_doctor_id());

-- ---------- DOCTOR ASSISTANTS ----------
create policy assistants_doctor_manage on doctor_assistants
  for all using (doctor_id = current_doctor_id()) with check (doctor_id = current_doctor_id());

-- ---------- Macro de políticas paciente+médico ----------
-- DEMANDS
create policy demands_patient on demands
  for all using (patient_id = current_patient_id()) with check (patient_id = current_patient_id());
create policy demands_doctor on demands
  for all using (doctor_id = current_doctor_id()) with check (doctor_id = current_doctor_id());

-- CHAT MESSAGES (sem DELETE: histórico permanente)
create policy chat_select_patient on chat_messages
  for select using (patient_id = current_patient_id());
create policy chat_insert_patient on chat_messages
  for insert with check (patient_id = current_patient_id() and sender_type = 'patient');
create policy chat_doctor on chat_messages
  for select using (doctor_id = current_doctor_id());
create policy chat_insert_doctor on chat_messages
  for insert with check (doctor_id = current_doctor_id() and sender_type = 'doctor');
create policy chat_update_doctor on chat_messages
  for update using (doctor_id = current_doctor_id());

-- HEALTH EVENT LOGS
create policy health_patient on health_event_logs
  for all using (patient_id = current_patient_id()) with check (patient_id = current_patient_id());
create policy health_doctor_read on health_event_logs
  for select using (patient_id in (select id from patients where doctor_id = current_doctor_id()));

-- HEADACHE DIARY
create policy headache_patient on headache_diary
  for all using (patient_id = current_patient_id()) with check (patient_id = current_patient_id());
create policy headache_doctor_read on headache_diary
  for select using (patient_id in (select id from patients where doctor_id = current_doctor_id()));

-- SEIZURE DIARY
create policy seizure_patient on seizure_diary
  for all using (patient_id = current_patient_id()) with check (patient_id = current_patient_id());
create policy seizure_doctor_read on seizure_diary
  for select using (patient_id in (select id from patients where doctor_id = current_doctor_id()));

-- RECIPE REQUESTS
create policy recipe_patient on recipe_requests
  for all using (patient_id = current_patient_id()) with check (patient_id = current_patient_id());
create policy recipe_doctor on recipe_requests
  for all using (doctor_id = current_doctor_id()) with check (doctor_id = current_doctor_id());

-- EXAM UPLOADS
create policy exam_patient on exam_uploads
  for all using (patient_id = current_patient_id()) with check (patient_id = current_patient_id());
create policy exam_doctor_read on exam_uploads
  for select using (doctor_id = current_doctor_id());

-- DOCUMENTS
create policy documents_patient_read on documents
  for select using (patient_id = current_patient_id());
create policy documents_doctor on documents
  for all using (doctor_id = current_doctor_id()) with check (doctor_id = current_doctor_id());

-- NOTIFICATIONS (cada um vê as suas)
create policy notifications_owner on notifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- CONSENTS (append-only: insert + select próprios; sem update/delete)
create policy consents_select_self on consents
  for select using (user_id = auth.uid());
create policy consents_insert_self on consents
  for insert with check (user_id = auth.uid());

-- AUDIT LOGS (append-only; leitura apenas pelo próprio sujeito)
create policy audit_insert on audit_logs
  for insert with check (true);
create policy audit_select_self on audit_logs
  for select using (user_id = auth.uid());

-- SUB-TABELAS configuráveis (médico gerencia; pacientes leem as do seu médico)
create policy symptom_doctor on symptom_types
  for all using (doctor_id = current_doctor_id()) with check (doctor_id = current_doctor_id());
create policy symptom_patient_read on symptom_types
  for select using (doctor_id = (select doctor_id from patients where user_id = auth.uid()));

create policy trigger_doctor on trigger_types
  for all using (doctor_id = current_doctor_id()) with check (doctor_id = current_doctor_id());
create policy trigger_patient_read on trigger_types
  for select using (doctor_id = (select doctor_id from patients where user_id = auth.uid()));

create policy medication_doctor on medication_types
  for all using (doctor_id = current_doctor_id()) with check (doctor_id = current_doctor_id());
create policy medication_patient_read on medication_types
  for select using (doctor_id = (select doctor_id from patients where user_id = auth.uid()));

create policy relief_doctor on relief_methods
  for all using (doctor_id = current_doctor_id()) with check (doctor_id = current_doctor_id());
create policy relief_patient_read on relief_methods
  for select using (doctor_id = (select doctor_id from patients where user_id = auth.uid()));
