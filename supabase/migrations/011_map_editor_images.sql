-- ============================================================
-- WeddingBoy — Map Editor: imágenes de mapa subidas desde el editor
--
-- El PNG "de verdad" vive en el repo (game-src/src/assets/map/) y se
-- commitea vía GitHub API al subirlo. Esta tabla guarda una COPIA en
-- base64 para que /api/admin/map-image/<file> pueda servir la imagen
-- nueva AL INSTANTE (el filesystem del lambda de Vercel no refleja el
-- commit hasta el siguiente deploy). Mismo patrón preview que
-- map_editor_data.overrides.
--
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS map_editor_images (
  file        TEXT        PRIMARY KEY,
  -- PNG en base64 (sin prefijo data:). Cap 6 MB de base64 (~4.5 MB binario)
  -- como defensa frente a abuso: la política RLS es abierta (el control de
  -- acceso real es el middleware admin de Next, igual que map_editor_data).
  content_b64 TEXT        NOT NULL CHECK (length(content_b64) <= 6291456),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE map_editor_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open_map_editor_images" ON map_editor_images FOR ALL USING (true);
