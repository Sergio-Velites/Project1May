/**
 * Mapa slug → nombre legible (ES) de los ítems del juego.
 * Mantener sincronizado con los `name` de game-src/src/app/use-item-data.ts.
 * Se usa en la página admin para mostrar el inventario de cada jugador.
 */
export const ITEM_NAMES: Record<string, string> = {
  // Pokéballs
  "master-ball": "Master Ball",
  "ultra-ball": "Ultra Ball",
  "great-ball": "Super Ball",
  "poke-ball": "Poké Ball",
  "safari-ball": "Safari Ball",

  // Curativos
  "potion": "Poción",
  "super-potion": "Superpoción",
  "hyper-potion": "Hiperpoción",
  "max-potion": "Poción Máx.",
  "full-restore": "Restau. Todo",
  "full-heal": "Cura Total",
  "antidote": "Antídoto",
  "burn-heal": "Antiquemar",
  "ice-heal": "Antihielo",
  "awakening": "Despertar",
  "parlyz-heal": "Antiparálisis",
  "revive": "Revivir",
  "max-revive": "Máx. Revivir",
  "fresh-water": "Agua Fresca",
  "soda-pop": "Refresco",
  "lemonade": "Limonada",
  "vino-monjardin": "Vino Monjardín",

  // Boosters / batalla
  "x-accuracy": "Precisión X",
  "x-attack": "Ataque X",
  "x-defend": "Defensa X",
  "x-speed": "Velocidad X",
  "x-special": "Especial X",
  "guard-spec": "Esp. Defensa",
  "dire-hit": "Crítico X",

  // Vitaminas
  "hp-up": "Más PS",
  "protein": "Proteína",
  "iron": "Hierro",
  "carbos": "Carburante",
  "calcium": "Calcio",
  "rare-candy": "Caramelo Raro",
  "pp-up": "Más PP",

  // Repel
  "repel": "Repel",
  "super-repel": "Superrepel",
  "max-repel": "Máx. Repel",

  // Piedras evolutivas
  "moon-stone": "Piedra Lunar",
  "fire-stone": "Piedra Fuego",
  "thunder-stone": "Piedra Trueno",
  "water-stone": "Piedra Agua",
  "leaf-stone": "Piedra Hoja",

  // Llaves / herramientas
  "town-map": "Mapa Pueblo",
  "bicycle": "Bicicleta",
  "old-rod": "Caña Vieja",
  "good-rod": "Caña Buena",
  "super-rod": "Súper Caña",
  "escape-rope": "Cuerda Huida",
  "old-amber": "Ámbar Viejo",
  "dome-fossil": "Fósil Domo",
  "helix-fossil": "Fósil Helix",
  "secret-key": "Llave Secreta",
  "bike-voucher": "Bono Bici",
  "card-key": "Tarjeta Mag.",
  "lift-key": "Llave Asc.",
  "ss-ticket": "Pase S.S.",
  "gold-teeth": "Dent. Oro",
  "coin": "Moneda",
  "coin-case": "Estuche Mon.",
  "oaks-parcel": "Paquete Oak",
  "item-finder": "Buscaobjetos",
  "silph-scope": "Sphlphoscopio",
  "poke-flute": "Pokéflauta",
  "exp-all": "Repartexp",
  "nugget": "Pepita",
  "poke-doll": "Muñeco",
  "pokedex": "Pokédex",

  // Insignias (badge)
  "boulder-badge": "Insignia del Vino",
  "cascade-badge": "Insignia Cascada",
  "thunder-badge": "Insignia Trueno",
  "rainbow-badge": "Insignia Arcoíris",
  "soul-badge": "Insignia Alma",
  "marsh-badge": "Insignia Pantano",
  "volcano-badge": "Insignia Volcán",
  "earth-badge": "Insignia Tierra",

  // Ether
  "ether": "Éter",
  "max-ether": "Máx. Éter",
  "elixer": "Elixir",
  "max-elixer": "Máx. Elixir",
};

const SLUG_BADGES = new Set([
  "boulder-badge",
  "cascade-badge",
  "thunder-badge",
  "rainbow-badge",
  "soul-badge",
  "marsh-badge",
  "volcano-badge",
  "earth-badge",
]);

export const isBadgeSlug = (slug: string) => SLUG_BADGES.has(slug);

export const itemLabel = (slug: string) =>
  ITEM_NAMES[slug] ??
  slug
    .split("-")
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join(" ");
