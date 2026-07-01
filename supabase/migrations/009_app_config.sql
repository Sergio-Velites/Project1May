-- 009_app_config.sql — configuración global del juego (modo mantenimiento).
-- Fila única (id=1). La lee la edge function `maintenance` (GET público) y la
-- escribe el panel de admin (POST con x-admin-secret). RLS activado sin políticas
-- públicas: solo la service_role (edge functions) accede.

create table if not exists app_config (
  id int primary key default 1,
  maintenance boolean not null default false,
  message text not null default '',
  updated_at timestamptz not null default now(),
  constraint app_config_singleton check (id = 1)
);

insert into app_config (id, maintenance, message)
values (1, false, '')
on conflict (id) do nothing;

alter table app_config enable row level security;
