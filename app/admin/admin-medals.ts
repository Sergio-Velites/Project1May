/**
 * admin-medals.ts
 * Sistema de medallas/premios para el panel admin.
 *
 * REGLA: cada medalla la puede ganar como máximo UN jugador.
 * Si hay empate en la primera posición, NADIE recibe la medalla.
 *
 * Todas las medallas son globales (ranking entre invitados).
 */

export interface RSVPForMedals {
  player_name: string;
  pokemon: { id: number; level: number }[];
  pc?: { id: number; level: number }[];
  seenPokemon?: number[];
  caughtPokemon?: number[];
  inventory?: { item: string; amount: number }[];
  completedQuests?: string[];
  money?: number;
  map?: string | null;
}

export interface Medal {
  emoji: string;
  label: string;
  description: string;
  rarity: "gold" | "silver" | "bronze" | "special";
}

// ── Orden de zonas del juego ──────────────────────────────────────────────
const MAP_PROGRESS_ORDER = [
  "pallet-town-house-a-2f",
  "pallet-town-house-a-1f",
  "pallet-town",
  "pallet-town-lab",
  "pallet-town-house-b",
  "route-1",
  "viridian-city",
  "viridian-city-poke-mart",
  "viridian-city-pokemon-center",
  "viridian-city-gym",
  "viridian-city-pokemon-acadamy",
  "viridian-city-npc-house",
  "route-22",
  "gate-house",
  "route-2",
  "route-2-gate",
  "viridian-forrest",
  "route-2-gate-north",
  "pewter-city",
  "pewter-city-poke-mart",
  "pewter-city-pokemon-center",
  "pewter-city-npc-a",
  "pewter-city-npc-b",
  "pewter-city-museum-1f",
  "pewter-city-museum-2f",
  "pewter-city-gym",
  "route-3",
  "route-3-pokemon-center",
  "mt-moon-1f",
  "mt-moon-2f",
  "mt-moon-3f",
];

function mapProgress(map: string | null | undefined): number {
  if (!map) return -1;
  const idx = MAP_PROGRESS_ORDER.indexOf(map);
  return idx === -1 ? 0 : idx;
}

// ── Helpers ──────────────────────────────────────────────────────────────

const BADGE_SLUGS = [
  "boulder-badge","cascade-badge","thunder-badge","rainbow-badge",
  "soul-badge","marsh-badge","volcano-badge","earth-badge",
];

export function getCaughtSet(e: RSVPForMedals): Set<number> {
  return new Set<number>([
    ...(e.caughtPokemon ?? []),
    ...(e.pokemon ?? []).map((p) => p.id),
    ...(e.pc ?? []).map((p) => p.id),
  ]);
}

export function getSeenSet(e: RSVPForMedals): Set<number> {
  const caught = getCaughtSet(e);
  return new Set<number>([...(e.seenPokemon ?? []), ...caught]);
}

export function getMaxLevel(e: RSVPForMedals): number {
  const all = [...(e.pokemon ?? []), ...(e.pc ?? [])];
  return all.reduce((max, p) => Math.max(max, p.level ?? 0), 0);
}

export function getTotalItems(e: RSVPForMedals): number {
  return (e.inventory ?? [])
    .filter((it) => !BADGE_SLUGS.includes(it.item))
    .reduce((s, it) => s + it.amount, 0);
}

export function getBadgeCount(e: RSVPForMedals): number {
  return (e.inventory ?? []).filter((it) => BADGE_SLUGS.includes(it.item)).length;
}

// ── Definición de categorías ──────────────────────────────────────────────

interface CategoryDef {
  getValue: (e: RSVPForMedals) => number;
  /** Valor mínimo para que el primer puesto sea válido */
  minValue: number;
  medal: Medal;
}

const CATEGORIES: CategoryDef[] = [
  {
    getValue: (e) => getCaughtSet(e).size,
    minValue: 1,
    medal: {
      emoji: "🏆",
      label: "El Mayor Entrenador",
      description: "Ha capturado más Pokémon únicos que cualquier otro invitado. El rey indiscutible de la Pokédex.",
      rarity: "gold",
    },
  },
  {
    getValue: (e) => getSeenSet(e).size - getCaughtSet(e).size,
    minValue: 1,
    medal: {
      emoji: "🔭",
      label: "El Gran Observador",
      description: "Más Pokémon vistos sin capturar que nadie. El mejor fotógrafo de la región. Ojo avizor.",
      rarity: "silver",
    },
  },
  {
    getValue: (e) => (e.completedQuests ?? []).length,
    minValue: 1,
    medal: {
      emoji: "📜",
      label: "El Completista",
      description: "Ha completado más logros y misiones que ningún otro invitado. No le escapa una.",
      rarity: "gold",
    },
  },
  {
    getValue: (e) => getMaxLevel(e),
    minValue: 1,
    medal: {
      emoji: "💪",
      label: "El Más Fuerte",
      description: "Tiene el Pokémon de mayor nivel de todos los invitados. Los rivales ya no se atreven.",
      rarity: "gold",
    },
  },
  {
    getValue: (e) => e.money ?? 0,
    minValue: 1,
    medal: {
      emoji: "💰",
      label: "El Más Rico",
      description: "Ha acumulado más dinero que ningún otro invitado. La pregunta es: ¿invita a la próxima ronda?",
      rarity: "gold",
    },
  },
  {
    getValue: (e) => getTotalItems(e),
    minValue: 1,
    medal: {
      emoji: "🎒",
      label: "El Acaparador",
      description: "Más objetos en la mochila que cualquier otro invitado. La física del inventario Pokémon es un misterio.",
      rarity: "silver",
    },
  },
  {
    getValue: (e) => mapProgress(e.map),
    minValue: 5,
    medal: {
      emoji: "🗺️",
      label: "El Gran Explorador",
      description: "Ha llegado más lejos en la historia que cualquier otro invitado. La frontera se mueve con él.",
      rarity: "gold",
    },
  },
  {
    getValue: (e) => getBadgeCount(e),
    minValue: 1,
    medal: {
      emoji: "🎖️",
      label: "El más Condecorado",
      description: "Tiene más insignias que ningún otro invitado. Los líderes de Bodega le tienen respeto.",
      rarity: "gold",
    },
  },
  {
    getValue: (e) => (e.pc ?? []).length,
    minValue: 1,
    medal: {
      emoji: "💻",
      label: "El Archivero",
      description: "Más Pokémon guardados en el PC que nadie. Bill personalmente le ha llamado para darle las gracias.",
      rarity: "silver",
    },
  },
  {
    getValue: (e) => {
      // Pokémon de tipo raro: legendarios capturados (IDs 144-146, 150, 151)
      const caught = getCaughtSet(e);
      return [144, 145, 146, 150, 151].filter((id) => caught.has(id)).length;
    },
    minValue: 1,
    medal: {
      emoji: "✨",
      label: "Cazador de Leyendas",
      description: "Ha capturado más Pokémon legendarios que ningún otro invitado. ¡Solo los elegidos consiguen esto!",
      rarity: "special",
    },
  },
  {
    getValue: (e) => {
      // Ratio de exploración: Pokémon vistos / progreso de mapa (quién explora más por zona)
      const seen = getSeenSet(e).size;
      const progress = mapProgress(e.map) + 1; // evitar div/0
      return Math.round((seen / progress) * 100);
    },
    minValue: 100,
    medal: {
      emoji: "🧭",
      label: "El Explorador Metódico",
      description: "La mejor relación Pokémon vistos / zona alcanzada. No se le escapa nada en cada ruta.",
      rarity: "silver",
    },
  },
  {
    getValue: (e) => {
      // Pokémon en equipo con nivel más bajo (dedicación al más débil)
      const team = e.pokemon ?? [];
      if (team.length === 0) return 0;
      return Math.min(...team.map((p) => p.level));
    },
    minValue: 1,
    medal: {
      emoji: "🌱",
      label: "El Mentor",
      description: "El Pokémon más débil de su equipo es el de mayor nivel mínimo entre todos. Ninguno se queda atrás.",
      rarity: "bronze",
    },
  },
];

// ── Cálculo principal ─────────────────────────────────────────────────────

export interface GlobalMedalEntry {
  index: number;
  player_name: string;
  medal: Medal;
}

/**
 * Calcula qué medalla corresponde a qué jugador.
 * Si hay empate en el primer puesto → nadie recibe esa medalla.
 */
export function computeGlobalMedals(entries: RSVPForMedals[]): GlobalMedalEntry[] {
  if (entries.length === 0) return [];

  const results: GlobalMedalEntry[] = [];

  for (const cat of CATEGORIES) {
    const values = entries.map((e, i) => ({ i, val: cat.getValue(e) }));
    const topVal = Math.max(...values.map((v) => v.val));

    // Descarta si no alcanza el mínimo
    if (topVal < cat.minValue) continue;

    const winners = values.filter((v) => v.val === topVal);

    // Empate → nadie recibe la medalla
    if (winners.length !== 1) continue;

    results.push({
      index: winners[0].i,
      player_name: entries[winners[0].i].player_name,
      medal: cat.medal,
    });
  }

  return results;
}

// ── Función principal: devuelve medallas de un jugador ────────────────────
export function getMedals(
  _e: RSVPForMedals,
  index: number,
  globalMedals: GlobalMedalEntry[]
): Medal[] {
  return globalMedals.filter((g) => g.index === index).map((g) => g.medal);
}

