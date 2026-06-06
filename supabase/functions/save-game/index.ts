import { corsHeaders } from "../_shared/cors.ts";
import { db, json } from "../_shared/db.ts";

const UUID_RE  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_RE = /^[0-9a-f]{64}$/;

// ─── Stats máximos teóricos por nivel 100 (Gen I/II) ─────────────────────────
const MAX_HP_STAT = 800;

// ─── Movimientos válidos: string no vacío, PP ≥ 0 ────────────────────────────
function validateMoveState(m: unknown, ctx: string): void {
  if (typeof m !== "object" || m === null) throw new Error(`${ctx}: invalid move entry`);
  const move = m as Record<string, unknown>;
  if (typeof move.id !== "string" || move.id.trim() === "")
    throw new Error(`${ctx}: move id must be a non-empty string`);
  if (typeof move.pp !== "number" || move.pp < 0 || move.pp > 99)
    throw new Error(`${ctx}: move pp out of range (0–99)`);
}

// ─── Validación de un Pokémon individual ─────────────────────────────────────
function validatePokemon(p: unknown, ctx: string): void {
  if (typeof p !== "object" || p === null) throw new Error(`${ctx}: invalid pokemon entry`);
  const pk = p as Record<string, unknown>;

  if (typeof pk.id !== "number" || pk.id < 1 || pk.id > 251)
    throw new Error(`${ctx}: pokemon id out of range (1–251)`);

  if (typeof pk.level !== "number" || pk.level < 1 || pk.level > 100)
    throw new Error(`${ctx}: pokemon level out of range (1–100)`);

  if (typeof pk.xp !== "number" || pk.xp < 0 || pk.xp > 1_300_000)
    throw new Error(`${ctx}: pokemon xp out of range`);

  if (typeof pk.hp !== "number" || pk.hp < 0 || pk.hp > MAX_HP_STAT)
    throw new Error(`${ctx}: pokemon hp out of range (0–${MAX_HP_STAT})`);

  if (!Array.isArray(pk.moves) || pk.moves.length === 0 || pk.moves.length > 4)
    throw new Error(`${ctx}: pokemon must have 1–4 moves`);
  for (const m of pk.moves) validateMoveState(m, `${ctx} move`);

  if (pk.status !== undefined && pk.status !== null) {
    const VALID_STATUS = new Set(["poison","badly-poisoned","burn","paralysis","sleep","freeze"]);
    const s = pk.status as Record<string, unknown>;
    if (!VALID_STATUS.has(s.type as string))
      throw new Error(`${ctx}: invalid status type`);
    // turnos 0–7 en Gen I/II canónico; 10 como margen para edge cases del admin
    if (typeof s.turns !== "number" || s.turns < 0 || s.turns > 10)
      throw new Error(`${ctx}: status turns out of range`);
  }
}

// ─── Validación estructural del gameState ────────────────────────────────────
// Rechaza solo valores imposibles a nivel de estructura (negativos, tipos erróneos,
// arrays absurdamente grandes). NO limita cantidades de ítems ni de dinero: el
// admin puede dar cantidades altas de forma legítima y esas cotas causaban HTTP 500.
function validateGameState(gs: Record<string, unknown>): void {

  // Equipo (máx. 6 Pokémon)
  if (Array.isArray(gs.pokemon)) {
    if (gs.pokemon.length > 6) throw new Error("Invalid gameState: team too large (max 6)");
    for (let i = 0; i < gs.pokemon.length; i++)
      validatePokemon(gs.pokemon[i], `team[${i}]`);
  }

  // PC (máx. 250 Pokémon)
  if (Array.isArray(gs.pc)) {
    if (gs.pc.length > 250) throw new Error("Invalid gameState: pc too large (max 250)");
    for (let i = 0; i < gs.pc.length; i++)
      validatePokemon(gs.pc[i], `pc[${i}]`);
  }

  // Dinero: no puede ser negativo
  const money = gs.money;
  if (typeof money === "number" && money < 0)
    throw new Error("Invalid gameState: money cannot be negative");

  // Inventario: solo verificamos estructura, no límite de cantidad por ítem
  if (Array.isArray(gs.inventory)) {
    if (gs.inventory.length > 50) throw new Error("Invalid gameState: inventory too large (max 50 slots)");
    for (const slot of gs.inventory as Record<string, unknown>[]) {
      if (typeof slot.item !== "string" || slot.item.trim() === "")
        throw new Error("Invalid gameState: inventory slot missing item id");
      if (typeof slot.amount !== "number" || slot.amount < 0)
        throw new Error(`Invalid gameState: inventory[${slot.item}] amount must be >= 0`);
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { userId, gameState, writeToken } = await req.json();
    if (!userId || !gameState) throw new Error("userId and gameState are required");
    if (!UUID_RE.test(userId)) throw new Error("Invalid userId format");

    const token: string | null =
      typeof writeToken === "string" && TOKEN_RE.test(writeToken) ? writeToken : null;

    validateGameState(gameState as Record<string, unknown>);

    const { data: returnedToken, error } = await db.rpc("upsert_save", {
      p_user_id:     userId,
      p_game_state:  gameState,
      p_write_token: token,
    });

    if (error) {
      if (error.message?.includes("INVALID_TOKEN")) {
        return json({ error: "Unauthorized" }, 401, corsHeaders);
      }
      throw error;
    }

    return json({ success: true, writeToken: returnedToken }, 200, corsHeaders);
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    console.error("[save-game] error:", msg);
    return json({ error: msg }, 500, corsHeaders);
  }
});
