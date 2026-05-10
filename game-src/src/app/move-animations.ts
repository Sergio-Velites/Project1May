/**
 * Per-move Gen I battle animation types.
 * 25 visual classes — cada uno tiene un aspecto claramente diferente.
 */
export type MoveAnimType =
  | "tackle"        // double white screen flash
  | "scratch"       // 3 diagonal white streaks across sprite
  | "ember"         // 4 orange fireballs arcing
  | "flamethrower"  // flame particle stream left→right
  | "fire-blast"    // 5-point orange star explosion
  | "water-gun"     // blue teardrop stream
  | "bubble"        // rising blue bubble rings
  | "surf"          // blue wave sweep
  | "thunderbolt"   // yellow zigzag SVG bolt (flicker)
  | "thunder"       // vertical yellow bolt from top
  | "thunder-wave"  // expanding yellow electric rings
  | "razor-leaf"    // 3 spinning green diamonds
  | "vine-whip"     // 2 green lines extending from side
  | "solar-beam"    // golden full-screen flash
  | "ice-beam"      // light-blue horizontal beam + crystals
  | "blizzard"      // ice diamond particles sweeping
  | "psychic-move"  // expanding pink/magenta rings
  | "earthquake"    // shake + falling brown rock chunks
  | "rock-slide"    // 4 gray blocks falling from top
  | "hyper-beam"    // wide white-orange horizontal beam
  | "toxic-move"    // purple bubbles rising
  | "sleep-powder"  // multicolor sparkle rain
  | "sand-attack"   // brown particle spray
  | "status-buff"   // golden stars floating upward
  | "status-debuff";// dark droplets falling on target

// ─── Move ID → animation type ────────────────────────────────────────────────

const ID_MAP: Record<string, MoveAnimType> = {
  // Normal / physical impact
  tackle: "tackle", pound: "tackle", slam: "tackle", "body-slam": "tackle",
  strength: "tackle", stomp: "tackle", "take-down": "tackle",
  "double-edge": "tackle", "mega-punch": "tackle", "mega-kick": "tackle",
  submission: "tackle", struggle: "tackle", bind: "tackle",
  wrap: "tackle", constrict: "tackle",

  // Hyper Beam / special beam
  "hyper-beam": "hyper-beam", "skull-bash": "hyper-beam",
  "self-destruct": "hyper-beam", explosion: "hyper-beam",

  // Slash / physical streak
  scratch: "scratch", slash: "scratch", cut: "scratch",
  "fury-swipes": "scratch", "fury-attack": "scratch",
  "karate-chop": "scratch", "vice-grip": "scratch",
  peck: "scratch", "drill-peck": "scratch", "wing-attack": "scratch",
  "comet-punch": "scratch", "low-kick": "scratch",
  "seismic-toss": "scratch", counter: "scratch",
  bite: "scratch", crunch: "scratch", "hi-jump-kick": "scratch",
  "jump-kick": "scratch", "double-kick": "scratch",

  // Fire
  ember: "ember", "fire-punch": "ember",
  flamethrower: "flamethrower", "fire-spin": "flamethrower",
  "fire-blast": "fire-blast",

  // Water
  "water-gun": "water-gun", "hydro-pump": "water-gun",
  crabhammer: "water-gun", waterfall: "water-gun",
  clamp: "water-gun", "water-sport": "water-gun",
  bubble: "bubble", "bubble-beam": "bubble",
  surf: "surf", whirlpool: "surf",

  // Electric
  thunderbolt: "thunderbolt", "thunder-punch": "thunderbolt",
  spark: "thunderbolt", "pin-missile": "thunderbolt",
  thunder: "thunder",
  "thunder-wave": "thunder-wave", "zap-cannon": "thunder-wave",

  // Grass
  "razor-leaf": "razor-leaf", "petal-dance": "razor-leaf",
  "leaf-blade": "razor-leaf",
  "vine-whip": "vine-whip", absorb: "vine-whip",
  "mega-drain": "vine-whip", "leech-seed": "vine-whip",
  "solar-beam": "solar-beam",

  // Ice
  "ice-beam": "ice-beam", "aurora-beam": "ice-beam", "ice-punch": "ice-beam",
  blizzard: "blizzard", hail: "blizzard",

  // Psychic / Ghost / Dark
  psychic: "psychic-move", psybeam: "psychic-move",
  confusion: "psychic-move", hypnosis: "psychic-move",
  "dream-eater": "psychic-move", "night-shade": "psychic-move",
  "shadow-ball": "psychic-move", lick: "psychic-move",
  "mean-look": "psychic-move", "destiny-bond": "psychic-move",

  // Ground
  earthquake: "earthquake", fissure: "earthquake",
  dig: "earthquake", "sand-tomb": "earthquake",
  "bone-club": "earthquake", bonemerang: "earthquake",
  "mud-slap": "sand-attack",

  // Rock
  "rock-slide": "rock-slide", "rock-throw": "rock-slide",
  rollout: "rock-slide", "rock-blast": "rock-slide",
  "ancient-power": "rock-slide",

  // Poison / Toxic
  toxic: "toxic-move", "poison-powder": "toxic-move",
  "poison-sting": "toxic-move", sludge: "toxic-move",
  smog: "toxic-move", twineedle: "toxic-move",
  acid: "toxic-move", "sludge-bomb": "toxic-move",

  // Sleep / spore
  "sleep-powder": "sleep-powder", spore: "sleep-powder",
  "stun-spore": "sleep-powder", "cotton-spore": "sleep-powder",

  // Sand / smoke
  "sand-attack": "sand-attack", smokescreen: "sand-attack",
  flash: "sand-attack",

  // Status: buffs (self)
  "swords-dance": "status-buff", agility: "status-buff",
  growth: "status-buff", harden: "status-buff",
  withdraw: "status-buff", "defense-curl": "status-buff",
  amnesia: "status-buff", barrier: "status-buff",
  "focus-energy": "status-buff", "acid-armor": "status-buff",
  "double-team": "status-buff", minimize: "status-buff",
  recover: "status-buff", softboiled: "status-buff",
  rest: "status-buff", sharpen: "status-buff",
  meditate: "status-buff",

  // Status: debuffs (enemy)
  growl: "status-debuff", "tail-whip": "status-debuff",
  screech: "status-debuff", "string-shot": "status-debuff",
  "confuse-ray": "status-debuff", supersonic: "status-debuff",
  disable: "status-debuff", kinesis: "status-debuff",
  leer: "status-debuff", roar: "status-debuff",
  "sweet-scent": "status-debuff",
};

// ─── Type fallback (when move ID not in map) ─────────────────────────────────

const TYPE_FALLBACK: Record<string, MoveAnimType> = {
  fire: "ember",
  water: "water-gun",
  electric: "thunderbolt",
  grass: "razor-leaf",
  ice: "ice-beam",
  psychic: "psychic-move",
  rock: "rock-slide",
  ground: "earthquake",
  poison: "toxic-move",
  ghost: "psychic-move",
  dark: "psychic-move",
  dragon: "psychic-move",
  normal: "tackle",
  fighting: "scratch",
  flying: "razor-leaf",
  bug: "razor-leaf",
  steel: "tackle",
};

export function getMoveAnimType(
  moveId: string,
  moveType: string,
  damageClass: string
): MoveAnimType {
  const direct = ID_MAP[moveId];
  if (direct) return direct;
  if (damageClass === "status") return "status-debuff";
  return TYPE_FALLBACK[moveType?.toLowerCase()] ?? "tackle";
}
