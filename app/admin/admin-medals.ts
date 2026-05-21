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

// ── Orden de zonas del juego (cuanto mayor el índice, más lejos llegan) ──
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

export function getCaughtSet(e: RSVPForMedals): Set<number> {
  return new Set<number>([
    ...(e.caughtPokemon ?? []),
    ...(e.pokemon ?? []).map((p) => p.id),
    ...(e.pc ?? []).map((p) => p.id),
  ]);
}

export function getSeenSet(e: RSVPForMedals): Set<number> {
  const caught = getCaughtSet(e);
  return new Set<number>([
    ...(e.seenPokemon ?? []),
    ...caught,
  ]);
}

export function getMaxLevel(e: RSVPForMedals): number {
  const all = [...(e.pokemon ?? []), ...(e.pc ?? [])];
  return all.reduce((max, p) => Math.max(max, p.level ?? 0), 0);
}

export function getTotalItems(e: RSVPForMedals): number {
  return (e.inventory ?? [])
    .filter((it) => !["boulder-badge","cascade-badge","thunder-badge","rainbow-badge","soul-badge","marsh-badge","volcano-badge","earth-badge"].includes(it.item))
    .reduce((s, it) => s + it.amount, 0);
}

export function getBadgeCount(e: RSVPForMedals): number {
  const BADGES = ["boulder-badge","cascade-badge","thunder-badge","rainbow-badge","soul-badge","marsh-badge","volcano-badge","earth-badge"];
  return (e.inventory ?? []).filter((it) => BADGES.includes(it.item)).length;
}

function hasItem(e: RSVPForMedals, slug: string): boolean {
  return (e.inventory ?? []).some((it) => it.item === slug && it.amount > 0);
}

// ── Medallas MILESTONE (cualquiera puede ganarlas) ───────────────────────

export function getMilestoneMedals(e: RSVPForMedals): Medal[] {
  const medals: Medal[] = [];
  const caught = getCaughtSet(e);
  const seen   = getSeenSet(e);
  const quests = e.completedQuests ?? [];
  const money  = e.money ?? 0;
  const maxLv  = getMaxLevel(e);
  const badges = getBadgeCount(e);

  // ── Ha jugado ──
  if (caught.size > 0 || (e.pokemon ?? []).length > 0) {
    medals.push({ emoji: "🎮", label: "Entrenador Novel", description: "Capturó su primer Pokémon. ¡La aventura comienza!", rarity: "bronze" });
  }

  // ── Starters ──
  const hasStarters = [1, 4, 7].every((id) => caught.has(id));
  if (hasStarters) {
    medals.push({ emoji: "🌿🔥💧", label: "Coleccionista de Iniciales", description: "Tiene los 3 Pokémon iniciales: Bulbasaur, Charmander y Squirtle. ¡Imposible elegir uno solo!", rarity: "gold" });
  }

  // ── Legendarios ──
  const LEGENDARIES = [144, 145, 146, 150, 151];
  const caughtLegendaries = LEGENDARIES.filter((id) => caught.has(id));
  if (caughtLegendaries.length > 0) {
    medals.push({ emoji: "✨", label: "Cazador de Leyendas", description: `Ha capturado ${caughtLegendaries.length} legendario${caughtLegendaries.length > 1 ? "s" : ""}. ¡No cualquiera puede decir lo mismo!`, rarity: "gold" });
  }
  if (caught.has(150)) {
    medals.push({ emoji: "🧬", label: "Domador de Mewtwo", description: "¡Ha capturado a Mewtwo, el Pokémon más poderoso del mundo! El Proyecto Genome fracasó... por ahora.", rarity: "gold" });
  }
  if (caught.has(151)) {
    medals.push({ emoji: "🌟", label: "El Favorecido por Mew", description: "Mew se dejó capturar por esta persona. El mundo conoce solo 251 personas a las que Mew ha aparecido. ¡Qué privilegio!", rarity: "special" });
  }
  if (caught.has(144)) {
    medals.push({ emoji: "🧊", label: "Maestro del Hielo Eterno", description: "Capturó a Articuno, el pájaro legendario del hielo. Nunca más pasará frío.", rarity: "gold" });
  }
  if (caught.has(145)) {
    medals.push({ emoji: "⚡", label: "Señor de las Tormentas", description: "Capturó a Zapdos, el pájaro legendario del rayo. ¡Cuidado con los enchufes!", rarity: "gold" });
  }
  if (caught.has(146)) {
    medals.push({ emoji: "🔥", label: "Amo del Fuego Sagrado", description: "Capturó a Moltres, el pájaro legendario del fuego. La parrilla nunca ha sido tan fácil.", rarity: "gold" });
  }
  if ([144, 145, 146].every((id) => caught.has(id))) {
    medals.push({ emoji: "🦅", label: "Trío Legendario", description: "¡Ha capturado los 3 pájaros legendarios! Articuno, Zapdos y Moltres. La trinidad alada completa.", rarity: "special" });
  }

  // ── Pokémon especiales ──
  if (caught.has(149)) {
    medals.push({ emoji: "🐉", label: "Domador de Dragones", description: "Capturó a Dragonite, el dragón más legendario de todos. Buen vuelo.", rarity: "gold" });
  }
  if (caught.has(147)) {
    medals.push({ emoji: "🌊", label: "Criador de Dratini", description: "Capturó a Dratini, la pequeña serpiente del lago. ¿Le habrá visto nadie?", rarity: "silver" });
  }
  if (caught.has(130)) {
    medals.push({ emoji: "🌊", label: "Señor de las Profundidades", description: "Capturó a Gyarados. Un Magikarp que jamás se rindió... y él/ella tampoco.", rarity: "silver" });
  }
  if (caught.has(143)) {
    medals.push({ emoji: "💤", label: "El que Despertó al Gigante", description: "Capturó a Snorlax. Para capturarlo hizo falta la Pokéflauta. Ahora se entiende por qué roncaba.", rarity: "silver" });
  }
  if (caught.has(94)) {
    medals.push({ emoji: "👻", label: "Cazafantasmas", description: "Capturó a Gengar. El amigo que siempre estará detrás de ti... literalmente.", rarity: "silver" });
  }
  if (caught.has(65)) {
    medals.push({ emoji: "🔮", label: "El Psíquico", description: "Capturó a Alakazam. Su coeficiente intelectual es 5000. El del entrenador ha subido un poco también.", rarity: "silver" });
  }
  if (caught.has(131)) {
    medals.push({ emoji: "🦕", label: "El Navegante", description: "Capturó a Lapras, el taxista acuático de los mares. Navegar nunca fue tan cómodo.", rarity: "silver" });
  }
  if (caught.has(113)) {
    medals.push({ emoji: "🥚", label: "Guardián del Huevo de Dicha", description: "Capturó a Chansey. Ha encontrado el Pokémon más esquivo de toda la región. Suerte garantizada en la boda.", rarity: "silver" });
  }
  if (caught.has(132)) {
    medals.push({ emoji: "🎭", label: "El Maestro del Disfraz", description: "Capturó a Ditto. Ahora tiene un Pokémon que puede ser cualquier cosa. Un poco como la boda.", rarity: "silver" });
  }
  if (caught.has(54)) {
    medals.push({ emoji: "🦆", label: "El Chiflado del Psyduck", description: "Capturó a Psyduck. Se identifica con él profundamente. Los dolores de cabeza pueden con los dos.", rarity: "bronze" });
  }
  if (caught.has(25)) {
    medals.push({ emoji: "⚡", label: "Pikachu Elegido", description: "¡Capturó a Pikachu! La mascota oficial. Ash estaría orgulloso... o celoso.", rarity: "bronze" });
  }
  if (caught.has(133)) {
    medals.push({ emoji: "💫", label: "El Dilema de Eevee", description: "Capturó a Eevee, el Pokémon de las mil posibilidades. Como este invitado, que tendrá que elegir bando en el partido de sobremesa.", rarity: "bronze" });
  }
  if (caught.has(6)) {
    medals.push({ emoji: "🦎", label: "Señor del Cielo", description: "Capturó a Charizard. El dragón que no es dragón. Técnicamente. Pero que importa, ¡qué pasada!", rarity: "silver" });
  }
  if (caught.has(9)) {
    medals.push({ emoji: "🐢", label: "La Tortuga Cañonera", description: "Capturó a Blastoise. El rival de Charizard. Siempre habrá un debate.", rarity: "silver" });
  }
  if (caught.has(3)) {
    medals.push({ emoji: "🌺", label: "La Jungla Andante", description: "Capturó a Venusaur. El jardín en movimiento. Sí, huele bien.", rarity: "silver" });
  }

  // ── Fósiles ──
  const hasFossilPokemon = [138, 139, 140, 141, 142].some((id) => caught.has(id));
  if (hasFossilPokemon) {
    medals.push({ emoji: "🦴", label: "Arqueólogo Aficionado", description: "Ha revivido un Pokémon fósil. Jurassic Park Pokémon Edition. Sin el caos (esperemos).", rarity: "silver" });
  }
  if (caught.has(142)) {
    medals.push({ emoji: "🦅", label: "El Aerodáctilo Resucitado", description: "Capturó a Aerodactyl, el Pokémon prehistórico del cielo. 65 millones de años esperando a este entrenador.", rarity: "gold" });
  }

  // ── Milestones de cantidad ──
  if (caught.size >= 10) {
    medals.push({ emoji: "🌱", label: "Aprendiz Pokémon", description: "Ha capturado 10 o más Pokémon. ¡Los primeros 10 son los más difíciles!", rarity: "bronze" });
  }
  if (caught.size >= 25) {
    medals.push({ emoji: "⭐", label: "Entrenador Comprometido", description: "Ha capturado 25 o más Pokémon. Casi una cuarta parte de la Pokédex.", rarity: "bronze" });
  }
  if (caught.size >= 50) {
    medals.push({ emoji: "🏅", label: "Maestro en Progreso", description: "¡50 o más Pokémon capturados! La mitad del camino. Que no cunda el pánico.", rarity: "silver" });
  }
  if (caught.size >= 100) {
    medals.push({ emoji: "💎", label: "Coleccionista Élite", description: "100 o más Pokémon capturados. Dos tercios de la Pokédex completa. Impresionante dedicación.", rarity: "gold" });
  }
  if (caught.size >= 151) {
    medals.push({ emoji: "🏆", label: "¡Pokédex Completada!", description: "¡Ha capturado los 151 Pokémon originales! El auténtico Maestro Pokémon. Oak llora de alegría.", rarity: "special" });
  }

  // ── Logros de quests ──
  if (quests.includes("vino-tinto-dado")) {
    medals.push({ emoji: "🍷", label: "Catador de Vino Tinto", description: "Habló con el Maestro del Vino en el Soto Lezkairu y recibió su Vino Tinto. El paladar ya no es el mismo.", rarity: "bronze" });
  }
  if (quests.includes("academy-ditto-taken")) {
    medals.push({ emoji: "🎓", label: "Alumno de la Academia", description: "Adoptó al Ditto de la Academia Pokémon de SOTO LEZKAIRU. ¡El primer alumno en sacar partido!", rarity: "bronze" });
  }
  if (quests.includes("pewter-museum-1f-paid")) {
    medals.push({ emoji: "🦕", label: "Amante de la Cultura", description: "Pagó la entrada del museo de VILLAMAYOR. Invirtió en conocimiento fósil. Inversión muy sabia.", rarity: "bronze" });
  }

  // ── Insignias ──
  if (badges >= 1) {
    medals.push({ emoji: "🍷", label: "Sommelier Oficial", description: "Tiene la Insignia del Vino. Ha demostrado que sabe catar... Pokémon.", rarity: "bronze" });
  }
  if (badges >= 8) {
    medals.push({ emoji: "👑", label: "Campeón de la Región", description: "¡Ha conseguido las 8 insignias! La Liga Pokémon tiembla.", rarity: "special" });
  }

  // ── Ítems especiales ──
  if (hasItem(e, "rare-candy")) {
    medals.push({ emoji: "🍬", label: "El Caramelista", description: "Tiene Caramelo Raro en la mochila. Subir niveles nunca ha sido tan delicioso.", rarity: "bronze" });
  }
  if (hasItem(e, "master-ball")) {
    medals.push({ emoji: "🔵", label: "Poseedor de la Master Ball", description: "Tiene la Master Ball. La pregunta del millón: ¿a quién se la lanza?", rarity: "gold" });
  }
  if (hasItem(e, "bicycle")) {
    medals.push({ emoji: "🚲", label: "El Ciclista", description: "Tiene Bicicleta. Ahorra en gasolina y llega antes a los encuentros. Ecofriendly trainer.", rarity: "bronze" });
  }
  if (hasItem(e, "old-rod") || hasItem(e, "good-rod") || hasItem(e, "super-rod")) {
    medals.push({ emoji: "🎣", label: "Pescador de Pokémon", description: "Tiene al menos una Caña de Pescar. La paciencia del pescador, la emoción del entrenador.", rarity: "bronze" });
  }
  if (hasItem(e, "ss-ticket")) {
    medals.push({ emoji: "🚢", label: "El Viajero del S.S. Anne", description: "Tiene un pase para el S.S. Anne. Las mejores fiestas siempre son en barco.", rarity: "silver" });
  }
  if (hasItem(e, "silph-scope")) {
    medals.push({ emoji: "👓", label: "El Vidente", description: "Tiene el Silphoscopio. Ahora puede ver lo que otros no. Los fantasmas ya no tienen secretos.", rarity: "silver" });
  }
  if (hasItem(e, "moon-stone")) {
    medals.push({ emoji: "🌙", label: "Hijo de la Luna", description: "Tiene una Piedra Lunar. El poder de la luna en el bolsillo. Muy místico.", rarity: "bronze" });
  }

  // ── Dinero ──
  if (money >= 5000) {
    medals.push({ emoji: "💰", label: "El Adinerado", description: `Acumuló ${money.toLocaleString("es-ES")}₽. Con eso se paga el banquete... casi.`, rarity: "bronze" });
  }
  if (money >= 20000) {
    medals.push({ emoji: "💵", label: "El Millonario Pokémon", description: `¡${money.toLocaleString("es-ES")}₽! A este ritmo puede permitirse ser Campeón y contador.`, rarity: "silver" });
  }

  // ── Nivel alto ──
  if (maxLv >= 50) {
    medals.push({ emoji: "💪", label: "Entrenador Veterano", description: `Tiene un Pokémon de nivel ${maxLv}. Años de entrenamiento condensados.`, rarity: "silver" });
  }
  if (maxLv >= 80) {
    medals.push({ emoji: "🔥", label: "Élite Cuatro Material", description: `¡Nivel ${maxLv}! Ya puede postularse a la Liga Pokémon sin ruborizarse.`, rarity: "gold" });
  }
  if (maxLv === 100) {
    medals.push({ emoji: "🌌", label: "El Nivel Máximo", description: "Llegó al nivel 100. El techo de cristal pokémon roto. Definitivamente ha jugado durante la preboda.", rarity: "special" });
  }

  // ── Ubicación avanzada ──
  const progress = mapProgress(e.map);
  if (progress >= mapProgress("viridian-forrest")) {
    medals.push({ emoji: "🌲", label: "Explorador del Bosquecillo", description: "Ha llegado al Bosquecillo. Los bichos no le dan miedo.", rarity: "bronze" });
  }
  if (progress >= mapProgress("pewter-city")) {
    medals.push({ emoji: "🏰", label: "Visitante de Monjardín", description: "Ha llegado a VILLAMAYOR DE MONJARDÍN. La bodega ya está cerca.", rarity: "bronze" });
  }
  if (progress >= mapProgress("mt-moon-1f")) {
    medals.push({ emoji: "🌕", label: "Espeleólogo del Monte Luna", description: "Se adentró en el Monte Luna. No todo el mundo tiene el valor de explorar sus cuevas.", rarity: "silver" });
  }
  if (progress >= mapProgress("mt-moon-3f")) {
    medals.push({ emoji: "🌑", label: "Conquistador del Monte Luna", description: "¡Ha cruzado el Monte Luna completo! Tres plantas de curvas y Clefairy. Chapeau.", rarity: "silver" });
  }

  // ── Pokémon raros ──
  if (caught.has(4) && caught.has(7) && !caught.has(1)) {
    medals.push({ emoji: "🔥💧", label: "La Eterna Rivalidad", description: "Tiene Charmander y Squirtle pero no Bulbasaur. El clásico debate de la boda: ¿fuego o agua?", rarity: "bronze" });
  }

  // ── Equipo completo ──
  const teamCount = (e.pokemon ?? []).length;
  if (teamCount === 6) {
    medals.push({ emoji: "🎯", label: "Equipo Completo", description: "Tiene los 6 Pokémon en el equipo. El equipo perfecto para la boda.", rarity: "silver" });
  }

  // ── Pokémon en PC ──
  const pcCount = (e.pc ?? []).length;
  if (pcCount >= 10) {
    medals.push({ emoji: "💻", label: "El Acumulador", description: `Tiene ${pcCount} Pokémon en el PC. Bill diría que es demasiado... Bill no conoce a este invitado.`, rarity: "bronze" });
  }

  return medals;
}

// ── Medallas GLOBALES (top jugadores) ────────────────────────────────────

export interface GlobalMedalEntry {
  index: number;
  player_name: string;
  medal: Medal;
}

export function computeGlobalMedals(entries: RSVPForMedals[]): GlobalMedalEntry[] {
  const results: GlobalMedalEntry[] = [];
  if (entries.length === 0) return results;

  const statsPerEntry = entries.map((e, i) => ({
    i,
    name: e.player_name,
    caught: getCaughtSet(e).size,
    seen: getSeenSet(e).size,
    quests: (e.completedQuests ?? []).length,
    maxLv: getMaxLevel(e),
    money: e.money ?? 0,
    items: getTotalItems(e),
    badges: getBadgeCount(e),
    progress: mapProgress(e.map),
  }));

  const addGlobal = (
    getVal: (s: typeof statsPerEntry[0]) => number,
    minVal: number,
    medal: Medal
  ) => {
    const topEntry = statsPerEntry.reduce((best, cur) =>
      getVal(cur) > getVal(best) ? cur : best
    );
    if (getVal(topEntry) >= minVal) {
      results.push({ index: topEntry.i, player_name: topEntry.name, medal });
    }
  };

  addGlobal((s) => s.caught, 1, {
    emoji: "🥇",
    label: "El Mayor Entrenador",
    description: "Ha capturado más Pokémon que cualquier otro invitado. ¡El rey de la Pokédex!",
    rarity: "gold",
  });

  addGlobal((s) => s.seen, 1, {
    emoji: "👁️",
    label: "El Ojo de la Pokédex",
    description: "Ha visto más Pokémon que nadie. El paparazzi de la región.",
    rarity: "gold",
  });

  addGlobal((s) => s.quests, 1, {
    emoji: "📖",
    label: "El Completista Total",
    description: "Ha completado más logros que nadie. No le escapa una.",
    rarity: "gold",
  });

  addGlobal((s) => s.maxLv, 1, {
    emoji: "🏋️",
    label: "El Más Fuerte",
    description: "Tiene el Pokémon de mayor nivel de todos los invitados. Respeto.",
    rarity: "gold",
  });

  addGlobal((s) => s.money, 1, {
    emoji: "💸",
    label: "El Más Rico",
    description: "Ha acumulado más dinero que ningún otro invitado. ¿Pagará la ronda?",
    rarity: "gold",
  });

  addGlobal((s) => s.items, 1, {
    emoji: "🎒",
    label: "El Acaparador",
    description: "Tiene más objetos en la mochila que nadie. La física del inventario Pokémon es un misterio.",
    rarity: "silver",
  });

  addGlobal((s) => s.progress, 5, {
    emoji: "🗺️",
    label: "El Gran Explorador",
    description: "Ha llegado más lejos en la historia que cualquier otro invitado. La frontera se mueve con él.",
    rarity: "gold",
  });

  addGlobal((s) => s.badges, 1, {
    emoji: "🎖️",
    label: "El más Condecorado",
    description: "Tiene más insignias de combate que nadie. Los líderes de Gimnasio le tienen respeto.",
    rarity: "gold",
  });

  return results;
}

// ── Función principal: devuelve medallas de un jugador (milestone + global) ─
export function getMedals(
  e: RSVPForMedals,
  index: number,
  globalMedals: GlobalMedalEntry[]
): Medal[] {
  const milestone = getMilestoneMedals(e);
  const globals = globalMedals
    .filter((g) => g.index === index)
    .map((g) => g.medal);
  return [...globals, ...milestone];
}
