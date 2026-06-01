-- ============================================================
-- 007 — write_token en saves: prueba de posesión para escritura
-- ============================================================
-- Problema: save-game aceptaba userId + gameState sin ninguna prueba
-- de que el solicitante era el propietario. Cualquier persona podía
-- fabricar un gameState con Pokémon nivel 99 enviándolo directamente
-- desde DevTools con su propio UUID (o el de otro invitado obtenido
-- de list-players).
--
-- Solución: cada fila de saves tiene un write_token de 64 chars
-- (32 bytes hex) generado por el servidor. El cliente lo recibe al
-- autenticarse (webauthn-auth-finish / webauthn-register-finish) o
-- en la respuesta de la primera escritura, y lo almacena en
-- localStorage como "wedding_write_token". save-game exige que el
-- token coincida para actualizar una fila ya existente.
--
-- Compatibilidad: las filas existentes reciben un token aleatorio en
-- el backfill (paso 2). Los usuarios con WebAuthn activo obtienen su
-- token al autenticarse en la próxima visita. Los usuarios "sin
-- guardar" que tenían partida en la nube perderán escritura cloud
-- (comportamiento correcto para "sin guardar") pero podrán leer.
-- ============================================================

-- 1. Añadir columna (nullable para que no falle con filas existentes)
ALTER TABLE saves ADD COLUMN IF NOT EXISTS write_token TEXT;

-- 2. Backfill inmediato: todas las filas existentes reciben token único
UPDATE saves
SET write_token = encode(gen_random_bytes(32), 'hex')
WHERE write_token IS NULL;

-- 3. Restricción NOT NULL y UNIQUE tras el backfill
ALTER TABLE saves ALTER COLUMN write_token SET NOT NULL;
ALTER TABLE saves ADD CONSTRAINT saves_write_token_unique UNIQUE (write_token);

-- 4. Nueva versión de upsert_save con verificación de token
--    Firma: upsert_save(userId, gameState, writeToken) → TEXT (el token)
--
--    Lógica:
--      · Sin fila existente → INSERT con token dado (o genera uno nuevo),
--        RETURN token (primera escritura: cliente lo guarda en localStorage)
--      · Fila existente + token correcto → UPDATE, RETURN token
--      · Fila existente + token incorrecto/nulo → RAISE EXCEPTION 'INVALID_TOKEN'
CREATE OR REPLACE FUNCTION upsert_save(
  p_user_id     UUID,
  p_game_state  JSONB,
  p_write_token TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_token TEXT;
  v_token          TEXT;
BEGIN
  -- Asegurar que el usuario existe (idempotente, igual que la versión anterior)
  INSERT INTO wedding_users (id) VALUES (p_user_id)
  ON CONFLICT (id) DO NOTHING;

  SELECT write_token INTO v_existing_token
  FROM saves
  WHERE user_id = p_user_id;

  IF v_existing_token IS NULL THEN
    -- Primera escritura: usar token proporcionado o generar uno nuevo
    v_token := COALESCE(
      CASE WHEN p_write_token ~ '^[0-9a-f]{64}$' THEN p_write_token END,
      encode(gen_random_bytes(32), 'hex')
    );
    INSERT INTO saves (user_id, game_state, updated_at, write_token)
    VALUES (p_user_id, p_game_state, NOW(), v_token);
    RETURN v_token;

  ELSIF v_existing_token = p_write_token THEN
    -- Token válido: actualizar
    UPDATE saves
    SET game_state = p_game_state,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    RETURN v_existing_token;

  ELSE
    -- Token inválido o no proporcionado para una fila existente
    RAISE EXCEPTION 'INVALID_TOKEN';
  END IF;
END;
$$;
