// ⚠️ DATOS AUTOGENERADOS desde game-src/src/app/pokemon-metadata.ts (Gen I+II).
// id → tipos oficiales + BST (suma de las 5 stats Gen I). Estático: la Pokédex
// Gen I+II no cambia. Re-generar con el script del commit si se amplía la dex.
// Alimenta las herramientas de auto-relleno de contenido del map-editor.

export interface PoolEntry {
  types: string[];
  /** Suma de stats base (HP+Atk+Def+Spe+Spc). Proxy de "fuerza" para dificultad. */
  bst: number;
}

export const POKEMON_POOL: Record<number, PoolEntry> = {
  1: { types: ["grass", "poison"], bst: 253 },
  2: { types: ["grass", "poison"], bst: 325 },
  3: { types: ["grass", "poison"], bst: 425 },
  4: { types: ["fire"], bst: 259 },
  5: { types: ["fire"], bst: 340 },
  6: { types: ["fire", "flying"], bst: 449 },
  7: { types: ["water"], bst: 250 },
  8: { types: ["water"], bst: 325 },
  9: { types: ["water"], bst: 425 },
  10: { types: ["bug"], bst: 175 },
  11: { types: ["bug"], bst: 180 },
  12: { types: ["bug", "flying"], bst: 315 },
  13: { types: ["bug", "poison"], bst: 175 },
  14: { types: ["bug", "poison"], bst: 180 },
  15: { types: ["bug", "poison"], bst: 315 },
  16: { types: ["normal", "flying"], bst: 216 },
  17: { types: ["normal", "flying"], bst: 299 },
  18: { types: ["normal", "flying"], bst: 409 },
  19: { types: ["normal"], bst: 218 },
  20: { types: ["normal"], bst: 343 },
  21: { types: ["normal", "flying"], bst: 231 },
  22: { types: ["normal", "flying"], bst: 381 },
  23: { types: ["poison"], bst: 234 },
  24: { types: ["poison"], bst: 369 },
  25: { types: ["electric"], bst: 270 },
  26: { types: ["electric"], bst: 405 },
  27: { types: ["ground"], bst: 270 },
  28: { types: ["ground"], bst: 395 },
  29: { types: ["poison"], bst: 235 },
  30: { types: ["poison"], bst: 310 },
  31: { types: ["poison", "ground"], bst: 420 },
  32: { types: ["poison"], bst: 233 },
  33: { types: ["poison"], bst: 310 },
  34: { types: ["poison", "ground"], bst: 430 },
  35: { types: ["normal"], bst: 258 },
  36: { types: ["normal"], bst: 393 },
  37: { types: ["fire"], bst: 234 },
  38: { types: ["fire"], bst: 405 },
  39: { types: ["normal"], bst: 245 },
  40: { types: ["normal"], bst: 385 },
  41: { types: ["poison", "flying"], bst: 205 },
  42: { types: ["poison", "flying"], bst: 380 },
  43: { types: ["grass", "poison"], bst: 255 },
  44: { types: ["grass", "poison"], bst: 320 },
  45: { types: ["grass", "poison"], bst: 400 },
  46: { types: ["bug", "grass"], bst: 230 },
  47: { types: ["bug", "grass"], bst: 325 },
  48: { types: ["bug", "poison"], bst: 250 },
  49: { types: ["bug", "poison"], bst: 375 },
  50: { types: ["ground"], bst: 220 },
  51: { types: ["ground"], bst: 355 },
  52: { types: ["normal"], bst: 250 },
  53: { types: ["normal"], bst: 375 },
  54: { types: ["water"], bst: 270 },
  55: { types: ["water"], bst: 420 },
  56: { types: ["fighting"], bst: 260 },
  57: { types: ["fighting"], bst: 385 },
  58: { types: ["fire"], bst: 300 },
  59: { types: ["fire"], bst: 475 },
  60: { types: ["water"], bst: 260 },
  61: { types: ["water"], bst: 335 },
  62: { types: ["water", "fighting"], bst: 420 },
  63: { types: ["psychic"], bst: 255 },
  64: { types: ["psychic"], bst: 330 },
  65: { types: ["psychic"], bst: 405 },
  66: { types: ["fighting"], bst: 270 },
  67: { types: ["fighting"], bst: 345 },
  68: { types: ["fighting"], bst: 420 },
  69: { types: ["grass", "poison"], bst: 270 },
  70: { types: ["grass", "poison"], bst: 345 },
  71: { types: ["grass", "poison"], bst: 420 },
  72: { types: ["water", "poison"], bst: 235 },
  73: { types: ["water", "poison"], bst: 395 },
  74: { types: ["rock", "ground"], bst: 270 },
  75: { types: ["rock", "ground"], bst: 345 },
  76: { types: ["rock", "ground"], bst: 430 },
  77: { types: ["fire"], bst: 345 },
  78: { types: ["fire"], bst: 420 },
  79: { types: ["water", "psychic"], bst: 275 },
  80: { types: ["water", "psychic"], bst: 410 },
  81: { types: ["electric"], bst: 270 },
  82: { types: ["electric"], bst: 395 },
  83: { types: ["normal", "flying"], bst: 315 },
  84: { types: ["normal", "flying"], bst: 275 },
  85: { types: ["normal", "flying"], bst: 410 },
  86: { types: ["water"], bst: 255 },
  87: { types: ["water", "ice"], bst: 380 },
  88: { types: ["poison"], bst: 275 },
  89: { types: ["poison"], bst: 400 },
  90: { types: ["water"], bst: 280 },
  91: { types: ["water", "ice"], bst: 480 },
  92: { types: ["ghost", "poison"], bst: 275 },
  93: { types: ["ghost", "poison"], bst: 350 },
  94: { types: ["ghost", "poison"], bst: 425 },
  95: { types: ["rock", "ground"], bst: 340 },
  96: { types: ["psychic"], bst: 238 },
  97: { types: ["psychic"], bst: 368 },
  98: { types: ["water"], bst: 300 },
  99: { types: ["water"], bst: 425 },
  100: { types: ["electric"], bst: 275 },
  101: { types: ["electric"], bst: 410 },
  102: { types: ["grass", "psychic"], bst: 280 },
  103: { types: ["grass", "psychic"], bst: 455 },
  104: { types: ["ground"], bst: 270 },
  105: { types: ["ground"], bst: 345 },
  106: { types: ["fighting"], bst: 345 },
  107: { types: ["fighting"], bst: 345 },
  108: { types: ["normal"], bst: 310 },
  109: { types: ["poison"], bst: 295 },
  110: { types: ["poison"], bst: 420 },
  111: { types: ["ground", "rock"], bst: 315 },
  112: { types: ["ground", "rock"], bst: 440 },
  113: { types: ["normal"], bst: 345 },
  114: { types: ["grass"], bst: 395 },
  115: { types: ["normal"], bst: 410 },
  116: { types: ["water"], bst: 270 },
  117: { types: ["water"], bst: 395 },
  118: { types: ["water"], bst: 270 },
  119: { types: ["water"], bst: 370 },
  120: { types: ["water"], bst: 285 },
  121: { types: ["water", "psychic"], bst: 435 },
  122: { types: ["psychic"], bst: 340 },
  123: { types: ["bug", "flying"], bst: 420 },
  124: { types: ["ice", "psychic"], bst: 360 },
  125: { types: ["electric"], bst: 405 },
  126: { types: ["fire"], bst: 410 },
  127: { types: ["bug"], bst: 430 },
  128: { types: ["normal"], bst: 420 },
  129: { types: ["water"], bst: 180 },
  130: { types: ["water", "flying"], bst: 440 },
  131: { types: ["water", "ice"], bst: 440 },
  132: { types: ["normal"], bst: 240 },
  133: { types: ["normal"], bst: 260 },
  134: { types: ["water"], bst: 430 },
  135: { types: ["electric"], bst: 430 },
  136: { types: ["fire"], bst: 415 },
  137: { types: ["normal"], bst: 320 },
  138: { types: ["rock", "water"], bst: 300 },
  139: { types: ["rock", "water"], bst: 425 },
  140: { types: ["rock", "water"], bst: 310 },
  141: { types: ["rock", "water"], bst: 425 },
  142: { types: ["rock", "flying"], bst: 440 },
  143: { types: ["normal"], bst: 430 },
  144: { types: ["ice", "flying"], bst: 455 },
  145: { types: ["electric", "flying"], bst: 490 },
  146: { types: ["fire", "flying"], bst: 495 },
  147: { types: ["dragon"], bst: 250 },
  148: { types: ["dragon"], bst: 350 },
  149: { types: ["dragon", "flying"], bst: 500 },
  150: { types: ["psychic"], bst: 590 },
  151: { types: ["psychic"], bst: 500 },
  152: { types: ["grass"], bst: 253 },
  153: { types: ["grass"], bst: 325 },
  154: { types: ["grass"], bst: 425 },
  155: { types: ["fire"], bst: 259 },
  156: { types: ["fire"], bst: 340 },
  157: { types: ["fire"], bst: 449 },
  158: { types: ["water"], bst: 266 },
  159: { types: ["water"], bst: 342 },
  160: { types: ["water"], bst: 447 },
  161: { types: ["normal"], bst: 170 },
  162: { types: ["normal"], bst: 360 },
  163: { types: ["normal", "flying"], bst: 206 },
  164: { types: ["normal", "flying"], bst: 346 },
  165: { types: ["bug", "flying"], bst: 185 },
  166: { types: ["bug", "flying"], bst: 280 },
  167: { types: ["bug", "poison"], bst: 210 },
  168: { types: ["bug", "poison"], bst: 330 },
  169: { types: ["poison", "flying"], bst: 455 },
  170: { types: ["water", "electric"], bst: 274 },
  171: { types: ["water", "electric"], bst: 384 },
  172: { types: ["electric"], bst: 170 },
  173: { types: ["normal"], bst: 163 },
  174: { types: ["normal"], bst: 190 },
  175: { types: ["normal"], bst: 180 },
  176: { types: ["normal", "flying"], bst: 300 },
  177: { types: ["psychic", "flying"], bst: 275 },
  178: { types: ["psychic", "flying"], bst: 400 },
  179: { types: ["electric"], bst: 235 },
  180: { types: ["electric"], bst: 305 },
  181: { types: ["electric"], bst: 410 },
  182: { types: ["grass"], bst: 380 },
  183: { types: ["water"], bst: 200 },
  184: { types: ["water"], bst: 330 },
  185: { types: ["rock"], bst: 345 },
  186: { types: ["water"], bst: 400 },
  187: { types: ["grass", "flying"], bst: 195 },
  188: { types: ["grass", "flying"], bst: 275 },
  189: { types: ["grass", "flying"], bst: 365 },
  190: { types: ["normal"], bst: 305 },
  191: { types: ["grass"], bst: 150 },
  192: { types: ["grass"], bst: 340 },
  193: { types: ["bug", "flying"], bst: 345 },
  194: { types: ["water", "ground"], bst: 185 },
  195: { types: ["water", "ground"], bst: 365 },
  196: { types: ["psychic"], bst: 430 },
  197: { types: ["dark"], bst: 395 },
  198: { types: ["dark", "flying"], bst: 363 },
  199: { types: ["water", "psychic"], bst: 380 },
  200: { types: ["ghost"], bst: 350 },
  201: { types: ["psychic"], bst: 288 },
  202: { types: ["psychic"], bst: 347 },
  203: { types: ["normal", "psychic"], bst: 390 },
  204: { types: ["bug"], bst: 255 },
  205: { types: ["bug", "steel"], bst: 405 },
  206: { types: ["normal"], bst: 350 },
  207: { types: ["ground", "flying"], bst: 365 },
  208: { types: ["steel", "ground"], bst: 445 },
  209: { types: ["normal"], bst: 260 },
  210: { types: ["normal"], bst: 390 },
  211: { types: ["water", "poison"], bst: 375 },
  212: { types: ["bug", "steel"], bst: 420 },
  213: { types: ["bug", "rock"], bst: 275 },
  214: { types: ["bug", "fighting"], bst: 405 },
  215: { types: ["dark", "ice"], bst: 355 },
  216: { types: ["normal"], bst: 280 },
  217: { types: ["normal"], bst: 425 },
  218: { types: ["fire"], bst: 210 },
  219: { types: ["fire", "rock"], bst: 330 },
  220: { types: ["ice", "ground"], bst: 220 },
  221: { types: ["ice", "ground"], bst: 390 },
  222: { types: ["water", "rock"], bst: 295 },
  223: { types: ["water"], bst: 265 },
  224: { types: ["water"], bst: 405 },
  225: { types: ["ice", "flying"], bst: 285 },
  226: { types: ["water", "flying"], bst: 325 },
  227: { types: ["steel", "flying"], bst: 395 },
  228: { types: ["dark", "fire"], bst: 280 },
  229: { types: ["dark", "fire"], bst: 420 },
  230: { types: ["water", "dragon"], bst: 445 },
  231: { types: ["ground"], bst: 290 },
  232: { types: ["ground"], bst: 440 },
  233: { types: ["normal"], bst: 420 },
  234: { types: ["normal"], bst: 400 },
  235: { types: ["normal"], bst: 205 },
  236: { types: ["fighting"], bst: 175 },
  237: { types: ["fighting"], bst: 345 },
  238: { types: ["ice", "psychic"], bst: 240 },
  239: { types: ["electric"], bst: 305 },
  240: { types: ["fire"], bst: 310 },
  241: { types: ["normal"], bst: 420 },
  242: { types: ["normal"], bst: 405 },
  243: { types: ["electric"], bst: 480 },
  244: { types: ["fire"], bst: 505 },
  245: { types: ["water"], bst: 465 },
  246: { types: ["rock", "ground"], bst: 250 },
  247: { types: ["rock", "ground"], bst: 340 },
  248: { types: ["rock", "dark"], bst: 500 },
  249: { types: ["psychic", "flying"], bst: 526 },
  250: { types: ["fire", "flying"], bst: 526 },
  251: { types: ["psychic", "grass"], bst: 500 },
};

export const ALL_TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
  "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel",
] as const;
export type PokemonType = (typeof ALL_TYPES)[number];

/** Legendarios/singulares: excluidos por defecto de hierba/pesca y de equipos
 *  salvo dificultad máxima. */
export const LEGENDARY_IDS = new Set<number>([
  144, 145, 146, 150, 151, // Gen I aves + Mewtwo + Mew
  243, 244, 245, 249, 250, 251, // Gen II bestias + Lugia + Ho-Oh + Celebi
]);

export type GenChoice = 1 | 2 | "both";
export type TimeSegment = "morning" | "day" | "night";
export type TerrainKind = "grass" | "cave" | "surf" | "oldRod" | "goodRod" | "superRod";

export function genOf(id: number): 1 | 2 {
  return id <= 151 ? 1 : 2;
}

function inGen(id: number, gen: GenChoice): boolean {
  if (gen === "both") return true;
  return genOf(id) === gen;
}

// Tipos "temáticamente apropiados" por terreno. Es un sesgo, no una regla dura:
// si no hay suficientes candidatos se relaja (ver candidateSpecies).
const TERRAIN_TYPES: Record<TerrainKind, PokemonType[]> = {
  grass: ["normal", "bug", "grass", "poison", "flying", "electric", "ground", "psychic", "fire", "fighting", "dark"],
  cave: ["rock", "ground", "poison", "flying", "fighting", "steel", "dark", "ghost", "dragon", "normal"],
  surf: ["water"],
  oldRod: ["water"],
  goodRod: ["water"],
  superRod: ["water", "dragon"],
};

// Techo de BST por terreno/caña → sesga hacia especies "comunes". La Caña Vieja
// solo da debiluchos; la Súper Caña permite especies fuertes.
const TERRAIN_BST_CEIL: Record<TerrainKind, number> = {
  grass: 460,
  cave: 470,
  surf: 480,
  oldRod: 320,
  goodRod: 420,
  superRod: 540,
};

// Especies marcadamente nocturnas (sesgo de franja horaria automático).
const NOCTURNAL_IDS = new Set<number>([
  41, 42, 169, // Zubat, Golbat, Crobat
  92, 93, 94, // Gastly, Haunter, Gengar
  198, // Murkrow
  163, 164, // Hoothoot, Noctowl
  200, // Misdreavus
  228, 229, // Houndour, Houndoom
  215, // Sneasel
]);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** IDs candidatos para un terreno/generación, filtrando por BST y (opcional)
 *  por tipos. Si el filtro temático deja muy pocos, lo relaja progresivamente. */
export function candidateSpecies(opts: {
  gen: GenChoice;
  terrain: TerrainKind;
  includeLegendary?: boolean;
  bstCeil?: number;
}): number[] {
  const themeTypes = TERRAIN_TYPES[opts.terrain];
  const ceil = opts.bstCeil ?? TERRAIN_BST_CEIL[opts.terrain];
  const base: number[] = [];
  for (let id = 1; id <= 251; id++) {
    const e = POKEMON_POOL[id];
    if (!e) continue;
    if (!inGen(id, opts.gen)) continue;
    if (!opts.includeLegendary && LEGENDARY_IDS.has(id)) continue;
    base.push(id);
  }
  const byTheme = base.filter((id) => POKEMON_POOL[id].types.some((t) => themeTypes.includes(t as PokemonType)));
  const byBst = byTheme.filter((id) => POKEMON_POOL[id].bst <= ceil);
  if (byBst.length >= 4) return byBst;
  if (byTheme.length >= 4) return byTheme;
  // Relajar el techo de BST manteniendo el tema.
  return byTheme.length ? byTheme : base.filter((id) => POKEMON_POOL[id].bst <= ceil + 80);
}

/** Reparte `total` (def. 100) en `n` enteros decrecientes que suman exacto. */
export function decreasingChances(n: number, total = 100): number[] {
  if (n <= 0) return [];
  if (n === 1) return [total];
  // Pesos decrecientes suaves (estilo tabla de rarezas Gen I/II).
  const weights = Array.from({ length: n }, (_, i) => Math.pow(0.62, i));
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (w / sum) * total);
  const out = raw.map((v) => Math.max(1, Math.floor(v)));
  let diff = total - out.reduce((a, b) => a + b, 0);
  // Reparte el resto empezando por los más comunes.
  for (let i = 0; diff > 0; i = (i + 1) % n) { out[i]++; diff--; }
  return out;
}

export interface BuiltEncounterPokemon {
  id: number;
  chance: number;
  conditionValues: { name: string; url: string }[];
  minLevel: number;
  maxLevel: number;
  timesOfDay?: TimeSegment[];
}
export interface BuiltEncounterTable {
  rate: number;
  pokemon: BuiltEncounterPokemon[];
}

const DEFAULT_RATE: Record<TerrainKind, number> = {
  grass: 25, cave: 25, surf: 20, oldRod: 40, goodRod: 50, superRod: 60,
};

export function buildEncounterTable(opts: {
  gen: GenChoice;
  terrain: TerrainKind;
  minLevel: number;
  maxLevel: number;
  count: number;
  allowedTimes: TimeSegment[] | null; // null = 24 h
  autoTimeBias: boolean;
  includeLegendary?: boolean;
  rate?: number;
}): BuiltEncounterTable {
  const lo = Math.max(2, Math.min(opts.minLevel, opts.maxLevel));
  const hi = Math.min(100, Math.max(opts.minLevel, opts.maxLevel));
  const pool = candidateSpecies({ gen: opts.gen, terrain: opts.terrain, includeLegendary: opts.includeLegendary });
  const n = Math.max(1, Math.min(opts.count, pool.length));
  // Ordena el pool por BST: los más débiles serán los más comunes.
  const picked = shuffle(pool).slice(0, n).sort((a, b) => POKEMON_POOL[a].bst - POKEMON_POOL[b].bst);
  const chances = decreasingChances(n, 100);
  const allowed = opts.allowedTimes && opts.allowedTimes.length && opts.allowedTimes.length < 3 ? opts.allowedTimes : null;
  return {
    rate: opts.rate ?? DEFAULT_RATE[opts.terrain],
    pokemon: picked.map((id, i) => {
      // Especies raras (menos comunes) tienden a nivel algo más alto.
      const rarityFrac = i / Math.max(1, n - 1);
      const span = hi - lo;
      const base = Math.round(lo + span * (0.25 + 0.6 * rarityFrac));
      const minLevel = Math.max(lo, Math.min(hi, base));
      const maxLevel = Math.max(minLevel, Math.min(hi, minLevel + (span > 4 ? 2 : 1)));
      let timesOfDay: TimeSegment[] | undefined;
      if (allowed) {
        timesOfDay = allowed;
      } else if (opts.autoTimeBias) {
        const e = POKEMON_POOL[id];
        const nocturnal = NOCTURNAL_IDS.has(id) || e.types.includes("ghost") || e.types.includes("dark");
        const diurnal = e.types.includes("bug") || e.types.includes("grass") || e.types.includes("normal");
        if (nocturnal) timesOfDay = ["night"];
        else if (diurnal) timesOfDay = ["morning", "day"];
      }
      return { id, chance: chances[i], conditionValues: [], minLevel, maxLevel, timesOfDay };
    }),
  };
}

/** Equipo de entrenador. `difficulty` 1-10 escala BST objetivo, niveles y
 *  (si no se fija `size`) el tamaño del equipo. `types` vacío = cualquiera. */
export function buildTrainerTeam(opts: {
  gen: GenChoice;
  types: string[];
  difficulty: number;
  minLevel: number;
  maxLevel: number;
  size?: number;
}): { id: number; level: number }[] {
  const diff = Math.max(1, Math.min(10, Math.round(opts.difficulty)));
  const lo = Math.max(2, Math.min(opts.minLevel, opts.maxLevel));
  const hi = Math.min(100, Math.max(opts.minLevel, opts.maxLevel));
  const size = Math.max(1, Math.min(6, opts.size ?? Math.max(1, Math.round(1 + (diff - 1) * 5 / 9))));
  const allowLegendary = diff >= 9;
  // BST objetivo: dif 1 ≈ 250, dif 10 ≈ 600.
  const targetBst = Math.round(250 + (diff - 1) * (600 - 250) / 9);
  const wantedTypes = opts.types.map((t) => t.toLowerCase());

  const candidates: number[] = [];
  for (let id = 1; id <= 251; id++) {
    const e = POKEMON_POOL[id];
    if (!e) continue;
    if (!inGen(id, opts.gen)) continue;
    if (!allowLegendary && LEGENDARY_IDS.has(id)) continue;
    if (wantedTypes.length && !e.types.some((t) => wantedTypes.includes(t))) continue;
    candidates.push(id);
  }
  if (!candidates.length) {
    // Relajar el filtro de tipos si no hay nada.
    for (let id = 1; id <= 251; id++) {
      if (!POKEMON_POOL[id]) continue;
      if (!inGen(id, opts.gen)) continue;
      if (!allowLegendary && LEGENDARY_IDS.has(id)) continue;
      candidates.push(id);
    }
  }
  // Ordena por cercanía al BST objetivo y toma una ventana de los mejores
  // ajustes; luego elige al azar dentro de ella (variedad sin perder el tono).
  const ranked = candidates
    .map((id) => ({ id, d: Math.abs(POKEMON_POOL[id].bst - targetBst) }))
    .sort((a, b) => a.d - b.d);
  const windowSize = Math.min(ranked.length, Math.max(size * 3, 12));
  const window = ranked.slice(0, windowSize).map((r) => r.id);
  const chosen = shuffle(window).slice(0, size);

  // Niveles crecientes; el "ace" (último) al máximo del rango.
  const team = chosen.map((id, i) => {
    const frac = size === 1 ? 1 : i / (size - 1);
    const level = Math.round(lo + (hi - lo) * (0.5 + 0.5 * frac));
    return { id, level: Math.max(lo, Math.min(hi, level)) };
  });
  team.sort((a, b) => a.level - b.level);
  return team;
}
