// ── Tabla de efectividad de Gen I (Pokémon Rojo/Azul/Amarillo) ─────────────
// Diferencias clave con generaciones posteriores:
//   • No existen los tipos Dark, Steel ni Fairy.
//   • Bug y Poison son super efectivos entre sí (×2 en ambos sentidos).
//   • Ice no es 0.5× contra Fire (es neutro en Gen I; pasó a 0.5× en Gen II).
//   • Ghost no afecta a Psychic (bug famoso: debería haber sido 2× pero quedó en 0).
const typeChart: Record<string, Record<string, number>> = {
  normal: {
    rock: 0.5,
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
  },
  ice: {
    water: 0.5,
    grass: 2,
    ice: 0.5,
    ground: 2,
    flying: 2,
    dragon: 2,
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
  },
  poison: {
    grass: 2,
    poison: 0.5,
    ground: 0.5,
    bug: 2,        // Gen I: Poison es 2× vs Bug
    rock: 0.5,
    ghost: 0.5,
  },
  ground: {
    fire: 2,
    electric: 2,
    grass: 0.5,
    poison: 2,
    flying: 0,
    bug: 0.5,
    rock: 2,
  },
  flying: {
    electric: 0.5,
    grass: 2,
    fighting: 2,
    bug: 2,
    rock: 0.5,
  },
  psychic: {
    fighting: 2,
    poison: 2,
    psychic: 0.5,
  },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 2,     // Gen I: Bug es 2× vs Poison
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
  },
  rock: {
    fire: 2,
    ice: 2,
    fighting: 0.5,
    ground: 0.5,
    flying: 2,
    bug: 2,
  },
  ghost: {
    normal: 0,
    psychic: 0,    // Gen I bug: Ghost no afecta a Psychic
    ghost: 2,
  },
  dragon: {
    dragon: 2,
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
