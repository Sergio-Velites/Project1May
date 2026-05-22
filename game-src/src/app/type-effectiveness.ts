// ── Tabla de efectividad de Gen II (Pokémon Oro/Plata/Cristal) ──────────────
// Cambios respecto a Gen I:
//   • Se introducen los tipos Steel (acero) y Dark (siniestro).
//   • Bug ya NO es ×2 contra Poison; Poison ya NO es ×2 contra Bug (ambos ×1).
//   • Ice es ×0.5 contra Fire (en Gen I era neutro).
//   • Ghost es ×2 contra Psychic (en Gen I era ×0, por el bug del juego original).
//   • Steel resiste muchísimos tipos; Dark inmune a Psychic; Psychic no afecta a Dark.
//   • Bug es ×2 contra Dark; Fighting/Bug ×0.5 contra Dark; Dark ×2 contra Ghost/Psychic.
//   • Fairy NO existe aún en Gen II.
const typeChart: Record<string, Record<string, number>> = {
  normal: {
    rock: 0.5,
    steel: 0.5,
    ghost: 0,
  },
  fire: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 2,
    bug: 2,
    rock: 0.5,
    dragon: 0.5,
    steel: 2,
  },
  water: {
    fire: 2,
    water: 0.5,
    grass: 0.5,
    ground: 2,
    rock: 2,
    dragon: 0.5,
  },
  electric: {
    water: 2,
    electric: 0.5,
    grass: 0.5,
    ground: 0,
    flying: 2,
    dragon: 0.5,
  },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: {
    fire: 0.5,        // Gen II: Ice resistido por Fire
    water: 0.5,
    grass: 2,
    ice: 0.5,
    ground: 2,
    flying: 2,
    dragon: 2,
    steel: 0.5,
  },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
  },
  poison: {
    grass: 2,
    poison: 0.5,
    ground: 0.5,
    bug: 1,           // Gen II: ya no es ×2 vs Bug
    rock: 0.5,
    ghost: 0.5,
    steel: 0,         // Steel inmune a Poison
  },
  ground: {
    fire: 2,
    electric: 2,
    grass: 0.5,
    poison: 2,
    flying: 0,
    bug: 0.5,
    rock: 2,
    steel: 2,
  },
  flying: {
    electric: 0.5,
    grass: 2,
    fighting: 2,
    bug: 2,
    rock: 0.5,
    steel: 0.5,
  },
  psychic: {
    fighting: 2,
    poison: 2,
    psychic: 0.5,
    dark: 0,          // Gen II: Psychic no afecta a Dark
    steel: 0.5,
  },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 1,        // Gen II: ya no es ×2 vs Poison (queda ×1)
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,          // Bug ×2 vs Dark (introducido en Gen II)
    steel: 0.5,
  },
  rock: {
    fire: 2,
    ice: 2,
    fighting: 0.5,
    ground: 0.5,
    flying: 2,
    bug: 2,
    steel: 0.5,
  },
  ghost: {
    normal: 0,
    psychic: 2,       // Gen II corrige el bug: Ghost ×2 vs Psychic
    ghost: 2,
    dark: 0.5,
    steel: 0.5,
  },
  dragon: {
    dragon: 2,
    steel: 0.5,
  },
  // ── Nuevos en Gen II ─────────────────────────────────────────────────────
  dark: {
    fighting: 0.5,
    psychic: 2,
    ghost: 2,
    dark: 0.5,
    bug: 0.5,
    steel: 0.5,
  },
  steel: {
    fire: 0.5,
    water: 0.5,
    electric: 0.5,
    ice: 2,
    rock: 2,
    steel: 0.5,
  },
};

const getTypeEffectiveness = (
  attackingType: string,
  defendingTypes: string[]
) => {
  let effectiveness = 1;

  defendingTypes.forEach((defendingType) => {
    const chart = typeChart[attackingType];
    if (!chart) return effectiveness;
    const multiplier = chart[defendingType];
    // Usar !== undefined para que las inmunidades (×0) funcionen correctamente
    if (multiplier !== undefined) effectiveness *= multiplier;
  });

  return effectiveness;
};

export default getTypeEffectiveness;
