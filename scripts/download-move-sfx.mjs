#!/usr/bin/env node
/**
 * download-move-sfx.mjs
 *
 * Descarga los MP3 de efectos de sonido de movimientos Gen I desde:
 *   https://vgmtreasurechest.com/soundtracks/pokemon-sfx-gen-1-attack-moves-rby/
 *
 * Uso:
 *   node scripts/download-move-sfx.mjs
 *
 * Los archivos se guardan en:
 *   game-src/public/sfx/attacks/{Name}.mp3
 *
 * Desde ahí CRA los copia al build → public/game/sfx/attacks/
 */

import { createWriteStream, existsSync, mkdirSync } from "fs";
import { pipeline } from "stream/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "game-src", "public", "sfx", "attacks");
const KHINSIDER_ALBUM =
  "https://downloads.khinsider.com/game-soundtracks/album/pokemon-sfx-gen-1-attack-moves-rby";

// ─── Lista de archivos a descargar ──────────────────────────────────────────
// Todos los movimientos Gen I que tienen SFX en el pack.
// Usamos el nombre base (sin sufijo numérico) que corresponde a la versión
// completa del sonido del movimiento.
const FILES = [
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
];

// ─── Utilidades ──────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Referer: "https://downloads.khinsider.com/",
};

/**
 * Paso 1: obtiene la URL directa del CDN visitando la página del archivo.
 * khinsider genera un token por-archivo en el href del link de descarga.
 */
async function getDirectUrl(name) {
  const pageUrl = `${KHINSIDER_ALBUM}/${name}.mp3`;
  const res = await fetch(pageUrl, { headers: FETCH_HEADERS });
  if (!res.ok) return null;
  const html = await res.text();
  // Extrae la primera URL mp3 de vgmtreasurechest que aparezca en el HTML
  const match = html.match(/https:\/\/[^"]*vgmtreasurechest[^"]*\.mp3/);
  return match ? match[0] : null;
}

async function downloadFile(name) {
  const dest = path.join(OUT_DIR, `${name}.mp3`);

  if (existsSync(dest)) {
    return { name, status: "skip" };
  }

  // Paso 1: descubrir URL directa
  const directUrl = await getDirectUrl(name);
  if (!directUrl) return { name, status: "fail", code: "no-url" };

  // Paso 2: descargar el binario
  const response = await fetch(directUrl, { headers: FETCH_HEADERS });
  if (!response.ok) {
    return { name, status: "fail", code: response.status };
  }

  const writer = createWriteStream(dest);
  await pipeline(response.body, writer);
  return { name, status: "ok" };
}

// ─── Main ────────────────────────────────────────────────────────────────────

(async () => {
  if (!existsSync(OUT_DIR)) {
    mkdirSync(OUT_DIR, { recursive: true });
    console.log(`📁  Creado: ${OUT_DIR}`);
  }

  const THROTTLE_MS = 500;
  const results = { ok: [], skip: [], fail: [] };

  console.log(`\n⬇️  Descargando ${FILES.length} archivos SFX...\n`);

  for (const name of FILES) {
    const result = await downloadFile(name);
    results[result.status].push(result);

    const icon = result.status === "ok" ? "✓" : result.status === "skip" ? "·" : "✗";
    const extra = result.status === "fail" ? ` (HTTP ${result.code})` : "";
    console.log(`  ${icon}  ${name}${extra}`);

    if (result.status !== "skip") {
      await sleep(THROTTLE_MS);
    }
  }

  console.log(`
────────────────────────────────
  ✓  Descargados : ${results.ok.length}
  ·  Ya existían : ${results.skip.length}
  ✗  Fallidos    : ${results.fail.length}
────────────────────────────────`);

  if (results.fail.length > 0) {
    console.log("\nArchivos fallidos:");
    results.fail.forEach(({ name, code }) =>
      console.log(`  - ${name}.mp3  (HTTP ${code})`)
    );
    console.log(
      "\n⚠️  Para los fallidos, descarga manualmente desde:\n" +
        "   https://downloads.khinsider.com/game-soundtracks/album/pokemon-sfx-gen-1-attack-moves-rby\n" +
        `   y cópialos a: ${OUT_DIR}\n`
    );
  } else {
    console.log("\n✅  Todos los archivos descargados correctamente.\n");
  }
})();
