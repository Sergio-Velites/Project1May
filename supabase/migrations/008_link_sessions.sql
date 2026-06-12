-- ─────────────────────────────────────────────────────────────────────────
-- Club Cable (Gen II): sesiones de enlace para combates EN VIVO e
-- intercambios entre invitados.
--
-- Una fila = una "sala" del Club Cable. El anfitrión (host) la crea y espera;
-- otro invitado (guest) se une. El protocolo por turnos se sincroniza vía
-- la Edge Function `link-session` (polling cada ~2s desde ambos clientes).
--
-- Timeout de respuesta: 1 minuto por fase (deadline_at). Si un jugador no
-- responde a tiempo, en combate gana el otro; en intercambio se cancela.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS link_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('battle', 'trade')),
  -- waiting → active → finished | cancelled
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'active', 'finished', 'cancelled')),
  -- Fase del protocolo:
  --   battle: lobby → choosing → resolving → choosing … → done
  --   trade:  lobby → offer → confirm → done
  phase TEXT NOT NULL DEFAULT 'lobby',
  turn INT NOT NULL DEFAULT 0,

  host_id UUID NOT NULL REFERENCES wedding_users(id),
  guest_id UUID REFERENCES wedding_users(id),
  host_name TEXT NOT NULL DEFAULT 'Invitado',
  guest_name TEXT,

  -- Equipos (snapshot de saves.game_state.pokemon al entrar; en combate el
  -- host los actualiza con cada resolución de turno).
  host_party JSONB NOT NULL DEFAULT '[]'::jsonb,
  guest_party JSONB,

  -- Combate: acción elegida por cada bando este turno + resolución del host.
  host_action JSONB,
  guest_action JSONB,
  resolution JSONB,
  winner TEXT CHECK (winner IN ('host', 'guest', 'draw')),
  end_reason TEXT,

  -- Intercambio: índice ofrecido por cada bando + confirmaciones.
  host_offer INT,
  guest_offer INT,
  host_confirm BOOLEAN NOT NULL DEFAULT FALSE,
  guest_confirm BOOLEAN NOT NULL DEFAULT FALSE,

  -- Límite de la fase actual (1 min por respuesta) y presencia.
  deadline_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '120 seconds',
  host_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  guest_seen_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lobby: listar salas en espera por tipo.
CREATE INDEX IF NOT EXISTS link_sessions_waiting_idx
  ON link_sessions (kind, status, created_at DESC);

-- Limpieza / "una sala en espera por anfitrión".
CREATE INDEX IF NOT EXISTS link_sessions_host_idx
  ON link_sessions (host_id, status);

-- RLS: igual que `saves`, solo la service_role (Edge Functions) accede.
ALTER TABLE link_sessions ENABLE ROW LEVEL SECURITY;
