/**
 * Mapeo de move IDs (slugs PokeAPI) a archivos MP3 de la coleccion
 * "Pokemon SFX Gen 1 - Attack Moves - RBY".
 *
 * Regla:
 * - Si existe un SFX exacto para el movimiento, se usa.
 * - Si no existe, se usa un fallback por tipo/clase para evitar silencio y 404.
 */

import moveMetadata from "./move-metadata";

const BASE_URL = "/game/sfx/attacks";

const AVAILABLE_SFX = new Set([
  "Absorb",
  "Acid",
  "AcidArmor",
  "Agility",
  "Amnesia",
  "AuroraBeam",
  "Barrage",
  "Barrier",
  "Bide",
  "Bind",
  "Bite",
  "Blizzard",
  "BodySlam",
  "BoneClub",
  "Bonemerang",
  "Bubble",
  "Bubblebeam",
  "Clamp",
  "CometPunch",
  "ConfuseRay",
  "Confusion",
  "Constrict",
  "Conversion",
  "Counter",
  "Crabhammer",
  "Cut",
  "DefenseCurl",
  "Dig",
  "Disable",
  "DizzyPunch",
  "DoubleEdge",
  "DoubleKick",
  "DoubleSlap",
  "DoubleTeam",
  "DragonRage",
  "DreamEater",
  "DrillPeck",
  "Earthquake",
  "EggBomb",
  "Ember",
  "Explosion",
  "FireBlast",
  "FirePunch",
  "FireSpin",
  "Fissure",
  "Flash",
  "FlyHit",
  "FlyUp",
  "FocusEnergy",
  "FuryAttack",
  "FurySwipes",
  "Glare",
  "Growth",
  "Guillotine",
  "Gust",
  "Harden",
  "Haze",
  "Headbutt",
  "HighJumpKick",
  "HornAttack",
  "HornDrill",
  "HydroPump",
  "HyperBeam",
  "HyperFang",
  "Hypnosis",
  "IceBeam",
  "IcePunch",
  "JumpKick",
  "KarateChop",
  "Kinesis",
  "LeechLife",
  "LeechSeed",
  "Leer",
  "Lick",
  "LightScreen",
  "LovelyKiss",
  "LowKick",
  "Meditate",
  "MegaDrain",
  "MegaKick",
  "MegaPunch",
  "Metronome",
  "Mimic1",
  "Minimize",
  "Mist",
  "NightShade",
  "Payday",
  "Peck",
  "PetalDance",
  "PoisonGas",
  "PoisonPowder",
  "PoisonSting",
  "Pound",
  "Psybeam",
  "Psychic",
  "Psywave",
  "QuickAttack",
  "Rage",
  "RazorLeaf",
  "RazorWind",
  "Recover",
  "Reflect",
  "Rest",
  "RockSlide",
  "RockThrow",
  "RollingKick",
  "SandAttack",
  "Scratch",
  "Screech",
  "SeismicToss",
  "SelfDestruct",
  "Sharpen",
  "Sing",
  "SkullBash",
  "SkyAttack",
  "Slam",
  "Slash",
  "SleepPowder",
  "Sludge",
  "Smog",
  "SmokeScreen",
  "Softboiled",
  "SolarBeam",
  "Sonicboom",
  "SpikeCannon",
  "Splash",
  "Spore",
  "Stomp",
  "Strength",
  "StringShot",
  "Struggle",
  "StunSpore",
  "Submission",
  "Substitute",
  "SuperFang",
  "Supersonic",
  "Surf",
  "Swift",
  "SwordsDance",
  "Tackle",
  "TailWhip",
  "TakeDown",
  "Teleport",
  "Thrash",
  "Thunder",
  "Thunderbolt",
  "ThunderPunch",
  "ThunderShock",
  "ThunderWave",
  "Toxic",
  "Transform",
  "TriAttack",
  "TwinNeedle",
  "ViceGrip",
  "VineWhip",
  "Waterfall",
  "WaterGun",
  "Whirlwind",
  "WingAttack",
  "Withdraw",
  "Wrap",
]);

const OVERRIDES: Record<string, string> = {
  "bubble-beam": "Bubblebeam",
  "sonic-boom": "Sonicboom",
  "hi-jump-kick": "HighJumpKick",
  fly: "FlyHit",
  twineedle: "TwinNeedle",
  bonemerang: "Bonemerang",
  "mimic": "Mimic1",
  "pay-day": "Payday",
  "soft-boiled": "Softboiled",
  "smoke-screen": "SmokeScreen",
};

const TYPE_DAMAGE_FALLBACK: Record<string, string> = {
  normal: "Tackle",
  fighting: "KarateChop",
  flying: "Gust",
  poison: "Acid",
  ground: "Earthquake",
  rock: "RockSlide",
  bug: "LeechLife",
  ghost: "NightShade",
  steel: "Strength",
  fire: "Ember",
  water: "WaterGun",
  grass: "RazorLeaf",
  electric: "ThunderShock",
  psychic: "Psybeam",
  ice: "IceBeam",
  dragon: "DragonRage",
  dark: "Bite",
  fairy: "Psychic",
  shadow: "NightShade",
};

const TYPE_STATUS_FALLBACK: Record<string, string> = {
  normal: "TailWhip",
  fighting: "FocusEnergy",
  flying: "Whirlwind",
  poison: "PoisonGas",
  ground: "SandAttack",
  rock: "Harden",
  bug: "StringShot",
  ghost: "ConfuseRay",
  steel: "Harden",
  fire: "SmokeScreen",
  water: "Withdraw",
  grass: "SleepPowder",
  electric: "ThunderWave",
  psychic: "Hypnosis",
  ice: "Mist",
  dragon: "Leer",
  dark: "ConfuseRay",
  fairy: "Sing",
  shadow: "ConfuseRay",
};

export interface MoveSfxInfo {
  path: string;
  filename: string;
  exact: boolean;
  reason: "exact" | "type-fallback" | "class-fallback" | "default-fallback";
}

function toPascalCase(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

function toPath(filename: string): string {
  return `${BASE_URL}/${filename}.mp3`;
}

function getFallbackFilename(moveId: string): Pick<MoveSfxInfo, "filename" | "reason"> {
  const meta = moveMetadata[moveId];
  if (!meta) return { filename: "Tackle", reason: "default-fallback" };

  const type = meta.type?.toLowerCase();
  if (meta.damageClass === "status") {
    const filename = TYPE_STATUS_FALLBACK[type];
    if (filename) return { filename, reason: "type-fallback" };
    return { filename: "Agility", reason: "class-fallback" };
  }

  const filename = TYPE_DAMAGE_FALLBACK[type];
  if (filename) return { filename, reason: "type-fallback" };
  return {
    filename: meta.damageClass === "special" ? "Psybeam" : "Tackle",
    reason: "class-fallback",
  };
}

export function getMoveSfxInfo(moveId: string): MoveSfxInfo {
  if (moveId) {
    const specificFilename = OVERRIDES[moveId] ?? toPascalCase(moveId);
    if (AVAILABLE_SFX.has(specificFilename)) {
      return {
        path: toPath(specificFilename),
        filename: specificFilename,
        exact: true,
        reason: "exact",
      };
    }
  }

  const fallback = getFallbackFilename(moveId);
  return {
    path: toPath(fallback.filename),
    filename: fallback.filename,
    exact: false,
    reason: fallback.reason,
  };
}

export function getMoveSfxPath(moveId: string): string {
  return getMoveSfxInfo(moveId).path;
}
