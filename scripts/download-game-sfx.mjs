#!/usr/bin/env node
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { pipeline } from "stream/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "game-src", "public", "sfx", "game");
const KHINSIDER_ALBUM = "https://downloads.khinsider.com/game-soundtracks/album/pokemon-red-green-blue-yellow";

const TRACKS = [
  { filename: "01. Opening Movie (Red, Green & Blue Version).mp3",  slug: "opening-movie.mp3" },
  { filename: "02. Opening Movie - Stereo (Red, Green & Blue Version).mp3", slug: "opening-movie-stereo.mp3" },
  { filename: null, slug: "title-screen.mp3" },
  { filename: "04. Pallet Town.mp3", slug: "pallet-town-original.mp3" },
  { filename: null, slug: "professor-oak.mp3" },
  { filename: "06. Hurry Along.mp3", slug: "hurry-along.mp3" },
  { filename: "07. Pokemon Lab.mp3", slug: "pokemon-lab.mp3" },
  { filename: null, slug: "pokemon-obtained.mp3" },
  { filename: "09. Rival Appears!.mp3", slug: "rival-appears.mp3" },
  { filename: "10. Battle! (Trainer Battle).mp3", slug: "battle-trainer.mp3" },
  { filename: "11. Level Up!.mp3", slug: "level-up.mp3" },
  { filename: "12. Victory! (Trainer Battle).mp3", slug: "victory-trainer.mp3" },
  { filename: "13. Route 1.mp3", slug: "route-1-original.mp3" },
  { filename: "14. Battle! (Wild Pokemon).mp3", slug: "battle-wild.mp3" },
  { filename: null, slug: "victory-wild.mp3" },
  { filename: "16. Item Obtained!.mp3", slug: "item-obtained.mp3" },
  { filename: "17. Viridian City.mp3", slug: "viridian-city-original.mp3" },
  { filename: "18. Pokemon Center.mp3", slug: "pokemon-center-original.mp3" },
  { filename: "19. Pokemon Healed.mp3", slug: "pokemon-healed.mp3" },
  { filename: "20. Pokemon Caught!.mp3", slug: "pokemon-caught.mp3" },
  { filename: "21. Traded Pokemon Received!.mp3", slug: "traded-pokemon.mp3" },
  { filename: "22. Viridian Forest.mp3", slug: "viridian-forest.mp3" },
  { filename: "23. A Trainer Appears (Boy Version).mp3", slug: "trainer-appears-boy.mp3" },
  { filename: "24. Jigglypuff's Song.mp3", slug: "jigglypuff-song.mp3" },
  { filename: "25. Professor Oak's Evaluation!.mp3", slug: "oak-evaluation.mp3" },
  { filename: null, slug: "evolution.mp3" },
  { filename: "27. Pokemon Gym.mp3", slug: "pokemon-gym-original.mp3" },
  { filename: "28. Battle! (Gym Leader).mp3", slug: "battle-gym.mp3" },
  { filename: "29. Victory! (Gym Leader).mp3", slug: "victory-gym.mp3" },
  { filename: "30. Route 3.mp3", slug: "route-3-original.mp3" },
  { filename: "31. A Trainer Appears (Girl Version).mp3", slug: "trainer-appears-girl.mp3" },
  { filename: "32. Mt. Moon.mp3", slug: "mt-moon-original.mp3" },
  { filename: "33. A Trainer Appears (Bad Guy Version).mp3", slug: "trainer-appears-rocket.mp3" },
  { filename: "34. Cerulean City.mp3", slug: "cerulean-city.mp3" },
  { filename: "35. Route 24 - Welcome to the World of Pokemon!.mp3", slug: "route-24.mp3" },
  { filename: "36. Vermilion City.mp3", slug: "vermilion-city.mp3" },
  { filename: "37. S.S. Anne.mp3", slug: "ss-anne.mp3" },
  { filename: "38. Bicycle.mp3", slug: "bicycle.mp3" },
  { filename: "39. Route 11.mp3", slug: "route-11.mp3" },
  { filename: "40. Lavender Town.mp3", slug: "lavender-town.mp3" },
  { filename: "41. Celadon City.mp3", slug: "celadon-city.mp3" },
  { filename: "42. Rocket Game Corner.mp3", slug: "rocket-game-corner.mp3" },
  { filename: "43. Rocket Hideout.mp3", slug: "rocket-hideout.mp3" },
  { filename: "44. Sylph Co..mp3", slug: "silph-co.mp3" },
  { filename: "45. Pokemon Tower.mp3", slug: "pokemon-tower.mp3" },
  { filename: "46. Poke Flute.mp3", slug: "poke-flute.mp3" },
  { filename: "47. Surf.mp3", slug: "surf.mp3" },
  { filename: "48. Cinnabar Island.mp3", slug: "cinnabar-island.mp3" },
  { filename: "49. Pokemon Mansion.mp3", slug: "pokemon-mansion.mp3" },
  { filename: "50. Victory Road.mp3", slug: "victory-road.mp3" },
  { filename: "51. Final Battle! (Rival).mp3", slug: "final-battle-rival.mp3" },
  { filename: "52. Hall of Fame.mp3", slug: "hall-of-fame.mp3" },
  { filename: "53. Ending Theme.mp3", slug: "ending-theme.mp3" },
  { filename: "54. Unused Song.mp3", slug: "unused-song.mp3" },
  { filename: "55. Opening Movie (Yellow Version).mp3", slug: "opening-movie-yellow.mp3" },
  { filename: "56. Printer Menu.mp3", slug: "printer-menu.mp3" },
  { filename: "57. A Trainer Appears (Rocket Duo Version).mp3", slug: "trainer-appears-rocket-duo.mp3" },
  { filename: "58. Pikachu's Beach.mp3", slug: "pikachus-beach.mp3" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Referer: "https://downloads.khinsider.com/",
};

async function getDirectUrl(filename) {
  const pageUrl = `${KHINSIDER_ALBUM}/${encodeURIComponent(filename)}`;
  const res = await fetch(pageUrl, { headers: FETCH_HEADERS });
  if (!res.ok) return null;
  const html = await res.text();
  const match = html.match(/https:\/\/[^"']*vgmtreasurechest[^"']*\.mp3/);
  return match ? match[0] : null;
}

async function downloadFile(track) {
  const dest = path.join(OUT_DIR, track.slug);
  if (existsSync(dest)) return { slug: track.slug, status: "skip" };
  if (!track.filename) return { slug: track.slug, status: "skip-no-url" };

  const directUrl = await getDirectUrl(track.filename);
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
  let ok = 0, skip = 0, skipNoUrl = 0;
  const fail = [];

  const downloadable = TRACKS.filter(t => t.filename !== null).length;
  console.log("\nDescargando " + downloadable + " pistas (4 omitidas sin URL)...\n");

  for (const track of TRACKS) {
    if (!track.filename) {
      console.log("  -  " + track.slug + "  (sin URL en khinsider)");
      skipNoUrl++;
      continue;
    }

    const result = await downloadFile(track);

    if (result.status === "ok") {
      console.log("  v  " + track.slug);
      ok++;
    } else if (result.status === "skip") {
      console.log("  .  " + track.slug + "  (ya existe)");
      skip++;
    } else {
      console.log("  X  " + track.slug + "  (" + result.code + ")");
      fail.push(result);
    }

    if (result.status !== "skip" && result.status !== "skip-no-url") {
      await sleep(THROTTLE_MS);
    }
  }

  console.log("\n--- OK:" + ok + "  Skip:" + skip + "  NoUrl:" + skipNoUrl + "  Fail:" + fail.length + " ---");
  if (fail.length > 0) {
    fail.forEach(f => console.log("  FAIL: " + f.slug + " (" + f.code + ")"));
  }
  console.log("\nListo: " + OUT_DIR + "\n");
})();
