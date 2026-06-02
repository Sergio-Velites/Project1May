import { corsHeaders } from "../_shared/cors.ts";
import { db, json } from "../_shared/db.ts";

const UUID_RE  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_RE = /^[0-9a-f]{64}$/;

// Validación básica del gameState — rechaza valores imposibles en gameplay normal.
// No sustituye la autenticación, pero reduce el daño si alguien tiene un token
// válido y quiere hacer trampas en su propio save.
//
// Límites generosos: el objetivo es bloquear valores imposibles (niveles >100,
// IDs fuera de la Pokédex Gen I+II, cantidades absurdas de ítems, cajas con
// cientos de pokémon), no afinar el balance del juego.
const MAX_PC = 600;           // Cajas del PC: holgado pero acotado (Gen I ~ 240)
const MAX_INVENTORY = 100;    // Tipos de ítem distintos
const MAX_ITEM_AMOUNT = 999;  // Cantidad por ítem (stack Gen I real = 99)

function validatePokemonEntry(p: Record<string, unknown>, where: string): void {
  const level = (p as { level?: unknown }).level;
  const id    = (p as { id?: unknown }).id;
  if (typeof level === "number" && (level < 1 || level > 100))
    throw new Error(`Invalid gameState: ${where} pokemon level out of range`);
  if (typeof id === "number" && (id < 1 || id > 251))
    throw new Error(`Invalid gameState: ${where} pokemon id out of range`);
}

function validateGameState(gs: Record<string, unknown>): void {
  // Equipo (máx 6)
  if (Array.isArray(gs.pokemon)) {
    if (gs.pokemon.length > 6) throw new Error("Invalid gameState: too many pokemon");
    for (const p of gs.pokemon as Record<string, unknown>[]) validatePokemonEntry(p, "team");
  }

  // PC / cajas: antes no se validaba → permitía acumular cientos de pokémon
  // y/o IDs y niveles imposibles editando el save propio.
  if (Array.isArray(gs.pc)) {
    if (gs.pc.length > MAX_PC) throw new Error("Invalid gameState: too many pc pokemon");
    for (const p of gs.pc as Record<string, unknown>[]) validatePokemonEntry(p, "pc");
  }

  // Inventario: antes no se validaba → permitía cantidades ilimitadas de ítems.
  if (Array.isArray(gs.inventory)) {
    if (gs.inventory.length > MAX_INVENTORY)
      throw new Error("Invalid gameState: too many inventory entries");
    for (const it of gs.inventory as Record<string, unknown>[]) {
      const amount = (it as { amount?: unknown }).amount;
      if (typeof amount === "number" && (amount < 0 || amount > MAX_ITEM_AMOUNT))
        throw new Error("Invalid gameState: item amount out of range");
    }
  }

  const money = (gs as { money?: unknown }).money;
  if (typeof money === "number" && (money < 0 || money > 999999))
    throw new Error("Invalid gameState: money out of range");
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
