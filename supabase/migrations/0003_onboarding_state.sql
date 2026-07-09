-- ============================================================
-- MEDconecta - Migration 0003: Estado de onboarding do paciente
-- Adiciona `must_change_password` em `users` para detectar 1º acesso
-- (senha ainda = data de nascimento temporária) e forçar troca.
-- ============================================================

alter table users
  add column if not exists must_change_password boolean not null default false;

-- Pacientes novos criados pelo médico começam com must_change_password = true.
-- (Não aplicamos retroativamente a quem já existe para não re-forçar troca.)
