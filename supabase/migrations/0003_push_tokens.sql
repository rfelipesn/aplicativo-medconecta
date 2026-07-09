-- ============================================================
-- MEDconecta - Migration 0003: push_tokens (Expo Push)
-- Tokens de push notification por device, vinculados ao user.
-- Política: o próprio usuário pode ler/criar/editar/remover os
-- seus tokens. Limpeza pode ser feita por app (DeviceNotRegistered).
-- ============================================================

create table push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  token text not null,
  device_id text not null,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, device_id)
);
create index idx_push_tokens_user on push_tokens (user_id);

create trigger trg_push_tokens_updated before update on push_tokens
  for each row execute function set_updated_at();

-- RLS
alter table push_tokens enable row level security;

-- Usuário só enxerga/edita os próprios tokens.
create policy "push_tokens_user_own"
  on push_tokens
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
