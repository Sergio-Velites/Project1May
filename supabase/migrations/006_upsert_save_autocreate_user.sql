-- ============================================================
-- 006 — upsert_save crea el wedding_user si no existe
-- ============================================================
-- Motivación: la edge function save-game llamaba a upsert_save sin garantizar
-- que el usuario existiera en wedding_users. Si save-rsvp aún no había llegado
-- (race condition con Promise.all en el cliente, o si se llama save-game antes
-- de completar el RSVP), la INSERT en saves fallaba por FK violation y el catch
-- silencioso de saveToCloud descartaba el error → RSVP guardado pero sin save.
--
-- Solución: igual patrón que save-rsvp — INSERT ... ON CONFLICT DO NOTHING
-- en wedding_users como primera operación de la función. Es atómico y barato.
-- ============================================================

CREATE OR REPLACE FUNCTION upsert_save(
  p_user_id    UUID,
  p_game_state JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Asegurar que el usuario existe (idempotente).
  -- Ignora el conflicto si ya estaba creado por save-rsvp / create-user.
  INSERT INTO wedding_users (id) VALUES (p_user_id)
  ON CONFLICT (id) DO NOTHING;

  -- Upsert habitual.
  INSERT INTO saves (user_id, game_state, updated_at)
  VALUES (p_user_id, p_game_state, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    game_state = EXCLUDED.game_state,
    updated_at = NOW();
END;
$$;
