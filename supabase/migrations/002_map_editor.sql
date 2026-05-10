-- ============================================================
-- WeddingBoy — Map Editor data persistence
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS map_editor_data (
  map_id     TEXT        PRIMARY KEY,
  trainers   JSONB       NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE map_editor_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open_map_editor" ON map_editor_data FOR ALL USING (true);
