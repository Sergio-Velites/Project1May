import { corsHeaders } from "../_shared/cors.ts";
import { db, json } from "../_shared/db.ts";

const UUID_RE  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_RE = /^[0-9a-f]{64}$/;

// ─── Límites de inventario por ítem ──────────────────────────────────────────
// Consumibles normales: máx. 99 unidades (límite canónico Gen I/II).
// Ítems únicos (HMs, llaves, insignias, clave de bicicleta, etc.): máx. 1.
// Si un ítem no está en ninguna lista se acepta con máx. 99 (caso por defecto).
const UNIQUE_ITEMS = new Set([
  "hm01","hm02","hm03","hm04","hm05","hm06","hm07",
  "bicycle","old-rod","good-rod","super-rod","ss-ticket",
  "gold-teeth","item-finder","silph-scope","poke-flute",
  "secret-key","card-key","lift-key","town-map",
  "oak-parcel","oak-pokedex",
]);
const MAX_STACK = 99;

// ─── Stats máximos teóricos por nivel 100 (Gen I/II) ─────────────────────────
// HP: base 255 (Chansey) → 704 aprox. con IVs/EVs máximos.
// Stats ofensivos/defensivos: base 190 (Mewtwo) → ~614. Redondeamos a 700.
// La comprobación es muy laxa a propósito: solo bloquea valores claramente
// imposibles (p.ej. hp: 9999 inyectado a mano), no hace recalculo completo.
const MAX_HP_STAT  = 800;  // margen generoso sobre el máximo teórico real (~704)
const MAX_OTHER_STAT = 700;

// ─── Movimientos válidos: string no vacío, PP entre 0 y 64 ───────────────────
function validateMoveState(m: unknown, ctx: string): void {
  if (typeof m !== "object" || m === null) throw new Error(`${ctx}: invalid move entry`);
  const move = m as Record<string, unknown>;
  if (typeof move.id !== "string" || move.id.trim() === "")
    throw new Error(`${ctx}: move id must be a non-empty string`);
  if (typeof move.pp !== "number" || move.pp < 0 || move.pp > 64)
    throw new Error(`${ctx}: move pp out of range (0–64)`);
}

// ─── Validación de un Pokémon individual ─────────────────────────────────────
function validatePokemon(p: unknown, ctx: string): void {
  if (typeof p !== "object" || p === null) throw new Error(`${ctx}: invalid pokemon entry`);
  const pk = p as Record<string, unknown>;

  // ID (1–251)
  if (typeof pk.id !== "number" || pk.id < 1 || pk.id > 251)
    throw new Error(`${ctx}: pokemon id out of range (1–251)`);

  // Nivel (1–100)
  if (typeof pk.level !== "number" || pk.level < 1 || pk.level > 100)
    throw new Error(`${ctx}: pokemon level out of range (1–100)`);

  // XP — no puede ser negativo; el máximo teórico para Slow a nivel 100 es 1.250.000
  if (typeof pk.xp !== "number" || pk.xp < 0 || pk.xp > 1_300_000)
    throw new Error(`${ctx}: pokemon xp out of range`);

  // HP actual — debe ser ≥ 0 y ≤ el máximo teórico (no recalculamos aquí, solo cota alta)
  if (typeof pk.hp !== "number" || pk.hp < 0 || pk.hp > MAX_HP_STAT)
    throw new Error(`${ctx}: pokemon hp out of range (0–${MAX_HP_STAT})`);

  // Movimientos — array de 1 a 4
  if (!Array.isArray(pk.moves) || pk.moves.length === 0 || pk.moves.length > 4)
    throw new Error(`${ctx}: pokemon must have 1–4 moves`);
  for (const m of pk.moves) validateMoveState(m, `${ctx} move`);

  // Status opcional — si existe, validar tipo y turnos
  if (pk.status !== undefined && pk.status !== null) {
    const VALID_STATUS = new Set(["poison","badly-poisoned","burn","paralysis","sleep","freeze"]);
    const s = pk.status as Record<string, unknown>;
    if (!VALID_STATUS.has(s.type as string))
      throw new Error(`${ctx}: invalid status type`);
    if (typeof s.turns !== "number" || s.turns < 0 || s.turns > 7)
      throw new Error(`${ctx}: status turns out of range`);
  }
}

// ─── Validación completa del gameState ───────────────────────────────────────
// Rechaza valores imposibles en gameplay normal.
// No sustituye la autenticación, pero bloquea trampas manuales (hp:9999,
// inventario inflado, PP alterados, etc.) incluso para el propio jugador.
function validateGameState(gs: Record<string, unknown>): void {

  // ── Equipo (máx. 6) ──────────────────────────────────────────────────────
  if (Array.isArray(gs.pokemon)) {
    if (gs.pokemon.length > 6) throw new Error("Invalid gameState: team too large (max 6)");
    for (let i = 0; i < gs.pokemon.length; i++)
      validatePokemon(gs.pokemon[i], `team[${i}]`);
  }

  // ── PC (máx. 250 slots, mismo formato) ───────────────────────────────────
  if (Array.isArray(gs.pc)) {
    if (gs.pc.length > 250) throw new Error("Invalid gameState: pc too large (max 250)");
    for (let i = 0; i < gs.pc.length; i++)
      validatePokemon(gs.pc[i], `pc[${i}]`);
  }

  // ── Dinero (0 – 999 999) ─────────────────────────────────────────────────
  const money = gs.money;
  if (typeof money === "number" && (money < 0 || money > 999_999))
    throw new Error("Invalid gameState: money out of range (0–999999)");

  // ── Inventario ───────────────────────────────────────────────────────────
  if (Array.isArray(gs.inventory)) {
    if (gs.inventory.length > 20) throw new Error("Invalid gameState: inventory too large (max 20 slots)");
    for (const slot of gs.inventory as Record<string, unknown>[]) {
      if (typeof slot.item !== "string" || slot.item.trim() === "")
        throw new Error("Invalid gameState: inventory slot has no item id");
      const maxAmount = UNIQUE_ITEMS.has(slot.item) ? 1 : MAX_STACK;
      if (typeof slot.amount !== "number" || slot.amount < 0 || slot.amount > maxAmount)
        throw new Error(
          `Invalid gameState: inventory[${slot.item}] amount out of range (0–${maxAmount})`
        );
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { userId, gameState, writeToken } = await req.json();
    if (!userId || !gameState) throw new Error("userId and gameState are required");
    if (!UUID_RE.test(userId)) throw new Error("Invalid userId format");

    // Normalizar write_token: null si no viene o tiene formato incorrecto
    const token: string | null =
      typeof writeToken === "string" && TOKEN_RE.test(writeToken) ? writeToken : null;

    // Validación estructural del estado
    validateGameState(gameState as Record<string, unknown>);

    const { data: returnedToken, error } = await db.rpc("upsert_save", {
      p_user_id:     userId,
      p_game_state:  gameState,
      p_write_token: token,
    });

    if (error) {
      // INVALID_TOKEN lo devuelve como error de PostgreSQL con ese mensaje
      if (error.message?.includes("INVALID_TOKEN")) {
        return json({ error: "Unauthorized" }, 401, corsHeaders);
      }
      throw error;
    }

    // Devolver el token al cliente para que lo almacene en localStorage
    // (especialmente importante en la primera escritura, cuando el servidor lo genera)
    return json({ success: true, writeToken: returnedToken }, 200, corsHeaders);
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    return json({ error: msg }, 500, corsHeaders);
  }
});
