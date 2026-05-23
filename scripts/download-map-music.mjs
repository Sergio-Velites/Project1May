#!/usr/bin/env node
/**
 * Descarga las músicas de mapa/localización de Pokémon Red/Green/Blue/Yellow
 * desde khinsider y las guarda como MP3 con nombres estables.
 *
 * Salida:
 *   game-src/public/music/maps-original/*.mp3
 *
 * Esos archivos se sirven en el build del juego como:
 *   /game/music/maps-original/<slug>.mp3
 */

import { createWriteStream, existsSync, mkdirSync } from "fs";
import { pipeline } from "stream/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "game-src", "public", "music", "maps-original");
const ALBUMS = {
  official: "https://downloads.khinsider.com/game-soundtracks/album/pokemon-red-green-blue-yellow",
  dmg: "https://downloads.khinsider.com/game-soundtracks/album/pokemon-red-green-blue-yellow-dmg-sound-gb-gamerip-1996",
};

const MAP_TRACKS = [
  { filename: "04 Pallet Town.mp3", slug: "pallet-town.mp3" },
  { filename: "07 Pokémon Lab.mp3", slug: "pokemon-lab.mp3" },
  { filename: "13 Route 1.mp3", slug: "route-1.mp3" },
  { filename: "17 Viridian City.mp3", slug: "viridian-city.mp3" },
  { filename: "18 Pokémon Center.mp3", slug: "pokemon-center.mp3" },
  { filename: "22 Viridian Forest.mp3", slug: "viridian-forest.mp3" },
  { filename: "27 Pokémon Gym.mp3", slug: "pokemon-gym.mp3" },
  { filename: "30 Route 3.mp3", slug: "route-3.mp3" },
  { filename: "32 Mt. Moon.mp3", slug: "mt-moon.mp3" },
  { filename: "34 Cerulean City.mp3", slug: "cerulean-city.mp3" },
  { filename: "35 Route 24 - Welcome to the World of Pokémon!.mp3", slug: "route-24-welcome.mp3" },
  { filename: "36 Vermilion City.mp3", slug: "vermilion-city.mp3" },
  { filename: "37 S.S. Anne.mp3", slug: "ss-anne.mp3" },
  { filename: "38 Bicycle.mp3", slug: "bicycle.mp3" },
  { filename: "39 Route 11.mp3", slug: "route-11.mp3" },
  { filename: "40 Lavender Town.mp3", slug: "lavender-town.mp3" },
  { filename: "41 Celadon City.mp3", slug: "celadon-city.mp3" },
  { filename: "42 Rocket Game Corner.mp3", slug: "rocket-game-corner.mp3" },
  { filename: "43 Rocket Hideout.mp3", slug: "rocket-hideout.mp3" },
  { filename: "44 Sylph Co..mp3", slug: "silph-co.mp3" },
  { filename: "45 Pokémon Tower.mp3", slug: "pokemon-tower.mp3" },
  { filename: "46 Poké Flute.mp3", slug: "poke-flute.mp3" },
  // El juego usa Music_SafariZone también para la animación de evolución.
  { album: "dmg", filename: "47. Evolution.mp3", slug: "safari-zone.mp3" },
  { filename: "47 Surf.mp3", slug: "surf.mp3" },
  { filename: "48 Cinnabar Island.mp3", slug: "cinnabar-island.mp3" },
  { filename: "49 Pokémon Mansion.mp3", slug: "pokemon-mansion.mp3" },
  { filename: "50 Victory Road.mp3", slug: "victory-road.mp3" },
  { album: "dmg", filename: "49. Indigo Plateau.mp3", slug: "indigo-plateau.mp3" },
  { filename: "52 Hall of Fame.mp3", slug: "hall-of-fame.mp3" },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Referer: "https://downloads.khinsider.com/",
};

async function getDirectUrl(track) {
  const albumUrl = ALBUMS[track.album ?? "official"];
  const pageUrl = `${albumUrl}/${encodeURIComponent(track.filename)}`;
  const res = await fetch(pageUrl, { headers: FETCH_HEADERS });
  if (!res.ok) return null;

  const html = await res.text();
  const match = html.match(/https:\/\/[^"']*vgmtreasurechest[^"']*\.mp3/);
  return match ? match[0] : null;
}

async function downloadFile(track) {
  const dest = path.join(OUT_DIR, track.slug);
  if (existsSync(dest)) return { slug: track.slug, status: "skip" };

  const directUrl = await getDirectUrl(track);
  if (!directUrl) return { slug: track.slug, status: "fail", code: "no-url" };

  const response = await fetch(directUrl, { headers: FETCH_HEADERS });
  if (!response.ok) return { slug: track.slug, status: "fail", code: response.status };

  const writer = createWriteStream(dest);
  await pipeline(response.body, writer);
  return { slug: track.slug, status: "ok" };
}

(async () => {
  if (!existsSync(OUT_DIR)) {
    mkdirSync(OUT_DIR, { recursive: true });
    console.log("Creado: " + OUT_DIR);
  }

  const THROTTLE_MS = 700;
  let ok = 0;
  let skip = 0;
  const fail = [];

  console.log(`\nDescargando ${MAP_TRACKS.length} músicas de mapa...\n`);

  for (const track of MAP_TRACKS) {
    const result = await downloadFile(track);

    if (result.status === "ok") {
      console.log("  v  " + track.slug);
      ok++;
      await sleep(THROTTLE_MS);
    } else if (result.status === "skip") {
      console.log("  .  " + track.slug + "  (ya existe)");
      skip++;
    } else {
      console.log("  X  " + track.slug + "  (" + result.code + ")");
      fail.push(result);
      await sleep(THROTTLE_MS);
    }
  }

  console.log("\n--- OK:" + ok + "  Skip:" + skip + "  Fail:" + fail.length + " ---");
  if (fail.length > 0) {
    fail.forEach((f) => console.log("  FAIL: " + f.slug + " (" + f.code + ")"));
    process.exitCode = 1;
  }
  console.log("\nListo: " + OUT_DIR + "\n");
})();
