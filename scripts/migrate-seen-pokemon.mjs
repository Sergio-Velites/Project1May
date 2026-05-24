/**
 * migrate-seen-pokemon.mjs
 *
 * Retroactivamente añade a seenPokemon[] los Pokémon de entrenadores
 * derrotados que no se registraron por el bug (2º+ pokémon de cada trainer).
 *
 * Uso:
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/migrate-seen-pokemon.mjs
 *
 * La URL de Supabase se lee de game-src/.env (REACT_APP_SUPABASE_URL).
 * La service role key se pasa como variable de entorno para no guardarla en disco.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Leer URL de Supabase desde game-src/.env ────────────────────────────────
function readEnvFile(filePath) {
  try {
    const lines = readFileSync(filePath, "utf-8").split("\n");
    const vars = {};
    for (const line of lines) {
      const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
      if (match) vars[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }
    return vars;
  } catch {
    return {};
  }
}

const gameEnv = readEnvFile(resolve(ROOT, "game-src/.env"));
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  gameEnv["REACT_APP_SUPABASE_URL"];
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "❌  Faltan variables:\n" +
    "    SUPABASE_URL (o REACT_APP_SUPABASE_URL en game-src/.env)\n" +
    "    SUPABASE_SERVICE_ROLE_KEY  (pasar como variable de entorno)\n\n" +
    "Ejemplo:\n" +
    "    SUPABASE_SERVICE_ROLE_KEY=eyJhb... node scripts/migrate-seen-pokemon.mjs"
  );
  process.exit(1);
}

// ── Construir mapa trainerId → [pokemonIds] desde map-data.json ─────────────
const mapData = JSON.parse(
  readFileSync(resolve(ROOT, "public/editor/map-data.json"), "utf-8")
);

/** @type {Map<string, number[]>} */
const trainerPokemons = new Map();

for (const [mapId, map] of Object.entries(mapData)) {
  for (const trainer of map.trainers ?? []) {
    if (!trainer.pokemon?.length) continue;
    const key = `${mapId}-${trainer.pos.x}-${trainer.pos.y}`;
    trainerPokemons.set(key, trainer.pokemon.map((p) => p.id));
  }
}

console.log(`✅  ${trainerPokemons.size} trainers cargados desde map-data.json`);

// ── Conectar a Supabase con service role ────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── Leer todas las partidas ─────────────────────────────────────────────────
const { data: saves, error: fetchError } = await supabase
  .from("saves")
  .select("user_id, game_state");

if (fetchError) {
  console.error("❌  Error leyendo la tabla saves:", fetchError.message);
  process.exit(1);
}

console.log(`📦  ${saves.length} partidas encontradas`);

// ── Procesar y actualizar cada partida ─────────────────────────────────────
let updatedCount = 0;
let skippedCount = 0;

for (const row of saves) {
  const state = row.game_state;
  if (!state || !Array.isArray(state.defeatedTrainers)) {
    skippedCount++;
    continue;
  }

  const currentSeen = new Set(state.seenPokemon ?? []);
  const before = currentSeen.size;

  for (const trainerId of state.defeatedTrainers) {
    const pokemons = trainerPokemons.get(trainerId);
    if (pokemons) {
      for (const id of pokemons) currentSeen.add(id);
    }
  }

  // También añadir los propios pokémon del jugador (siempre deberían estar)
  for (const p of state.pokemon ?? []) {
    if (p?.id) currentSeen.add(p.id);
  }
  for (const p of state.pc ?? []) {
    if (p?.id) currentSeen.add(p.id);
  }

  const added = currentSeen.size - before;

  if (added === 0) {
    skippedCount++;
    continue;
  }

  const newState = { ...state, seenPokemon: Array.from(currentSeen).sort((a, b) => a - b) };

  const { error: updateError } = await supabase
    .from("saves")
    .update({ game_state: newState })
      .eq("user_id", row.user_id);
  if (updateError) {
    console.error(`  ❌ Error en ${row.player_id}: ${updateError.message}`);
  } else {
    const name = state.name ?? "Desconocido";
    console.log(`  ✅ ${name} (${row.user_id.slice(0, 8)}…) +${added} vistos → total ${currentSeen.size}`);
    updatedCount++;
  }
}

console.log(
  `\n🏁  Migración completa: ${updatedCount} partidas actualizadas, ${skippedCount} sin cambios.`
);
