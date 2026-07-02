-- 010_maintenance_allowlist.sql — jugadores con acceso durante el mantenimiento.
-- `allowed_players` guarda los player_id (saves.user_id) que pueden seguir
-- jugando con el modo mantenimiento activo. La edge function `maintenance`
-- calcula el bypass EN SERVIDOR exigiendo prueba de posesión (x-write-token
-- contra saves.write_token) — conocer el UUID de otro invitado no basta.
-- La lista solo se expone con x-admin-secret (panel de admin / map-editor).

alter table app_config
  add column if not exists allowed_players uuid[] not null default '{}';
