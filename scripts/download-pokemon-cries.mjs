#!/usr/bin/env node
/**
 * Descarga los gritos de Pokémon de primera y segunda generación, los recorta a
 * 2 segundos con ffmpeg y los guarda como {001..251}.mp3
 * en game-src/public/sfx/pokemon-cries/.
 *
 * Fuentes:
 * - #001-151: álbum "Pokémon Game Boy Sound Complete Set" en khinsider.
 * - #152-251: PokeAPI cries legacy por ID.
 *
 * Mapping de discos para khinsider:
 *   CD1 tracks 46-98  → Pokémon #1  (Bulbasaur) – #53 (Persian)
 *   CD2 tracks  1-98  → Pokémon #54 (Psyduck)   – #151 (Mew)
 *   CD2 track  99     → "Pokémon Techno" (compilación) — ignorar
 */

import { existsSync, mkdirSync, unlinkSync } from "fs";
import { writeFile } from "fs/promises";
import { execFileSync, execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");
const OUT_DIR   = path.join(ROOT, "game-src", "public", "sfx", "pokemon-cries");

const KHINSIDER_ALBUM = "https://downloads.khinsider.com/game-soundtracks/album/pokemon-game-boy-pok-mon-sound-complete-set-play-cd";
const POKEAPI_LEGACY_CRY_BASE = "https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy";
const TRIM_SECS = 2;

// ──────────────────────────────────────────────────────────────────────────────
// Tabla: pokémonId → nombre. Para #001-151 forma el archivo de khinsider; para
// #152-251 solo se usa para logs, porque PokeAPI se descarga por ID.
//
// Khinsider #001-151:
// Construida a partir del índice del álbum:
//   CD1 pistas 46-98 → #1-53  (prefijo "1-46.", "1-47.", ..., "1-98.")
//   CD2 pistas  1-98 → #54-151 (prefijo "2-01.", "2-02.", ..., "2-98.")
// Los nombres con caracteres especiales usan encodeURIComponent en la URL.
// ──────────────────────────────────────────────────────────────────────────────
const POKEMON_NAMES = [
  /*  1 */ "Bulbasaur",
  /*  2 */ "Ivysaur",
  /*  3 */ "Venusaur",
  /*  4 */ "Charmander",
  /*  5 */ "Charmeleon",
  /*  6 */ "Charizard",
  /*  7 */ "Squirtle",
  /*  8 */ "Wartortle",
  /*  9 */ "Blastoise",
  /* 10 */ "Caterpie",
  /* 11 */ "Metapod",
  /* 12 */ "Butterfree",
  /* 13 */ "Weedle",
  /* 14 */ "Kakuna",
  /* 15 */ "Beedrill",
  /* 16 */ "Pidgey",
  /* 17 */ "Pidgeotto",
  /* 18 */ "Pidgeot",
  /* 19 */ "Rattata",
  /* 20 */ "Raticate",
  /* 21 */ "Spearow",
  /* 22 */ "Fearow",
  /* 23 */ "Ekans",
  /* 24 */ "Arbok",
  /* 25 */ "Pikachu",
  /* 26 */ "Raichu",
  /* 27 */ "Sandshrew",
  /* 28 */ "Sandslash",
  /* 29 */ "Nidoran\u2640",
  /* 30 */ "Nidorina",
  /* 31 */ "Nidoqueen",
  /* 32 */ "Nidoran\u2642",
  /* 33 */ "Nidorino",
  /* 34 */ "Nidoking",
  /* 35 */ "Clefairy",
  /* 36 */ "Clefable",
  /* 37 */ "Vulpix",
  /* 38 */ "Ninetales",
  /* 39 */ "Jigglypuff",
  /* 40 */ "Wigglytuff",
  /* 41 */ "Zubat",
  /* 42 */ "Golbat",
  /* 43 */ "Oddish",
  /* 44 */ "Gloom",
  /* 45 */ "Vileplume",
  /* 46 */ "Paras",
  /* 47 */ "Parasect",
  /* 48 */ "Venonat",
  /* 49 */ "Venomoth",
  /* 50 */ "Diglett",
  /* 51 */ "Dugtrio",
  /* 52 */ "Meowth",
  /* 53 */ "Persian",
  /* 54 */ "Psyduck",
  /* 55 */ "Golduck",
  /* 56 */ "Mankey",
  /* 57 */ "Primeape",
  /* 58 */ "Growlithe",
  /* 59 */ "Arcanine",
  /* 60 */ "Poliwag",
  /* 61 */ "Poliwhirl",
  /* 62 */ "Poliwrath",
  /* 63 */ "Abra",
  /* 64 */ "Kadabra",
  /* 65 */ "Alakazam",
  /* 66 */ "Machop",
  /* 67 */ "Machoke",
  /* 68 */ "Machamp",
  /* 69 */ "Bellsprout",
  /* 70 */ "Weepinbell",
  /* 71 */ "Victreebel",
  /* 72 */ "Tentacool",
  /* 73 */ "Tentacruel",
  /* 74 */ "Geodude",
  /* 75 */ "Graveler",
  /* 76 */ "Golem",
  /* 77 */ "Ponyta",
  /* 78 */ "Rapidash",
  /* 79 */ "Slowpoke",
  /* 80 */ "Slowbro",
  /* 81 */ "Magnemite",
  /* 82 */ "Magneton",
  /* 83 */ "Farfetch'd",
  /* 84 */ "Doduo",
  /* 85 */ "Dodrio",
  /* 86 */ "Seel",
  /* 87 */ "Dewgong",
  /* 88 */ "Grimer",
  /* 89 */ "Muk",
  /* 90 */ "Shellder",
  /* 91 */ "Cloyster",
  /* 92 */ "Gastly",
  /* 93 */ "Haunter",
  /* 94 */ "Gengar",
  /* 95 */ "Onix",
  /* 96 */ "Drowzee",
  /* 97 */ "Hypno",
  /* 98 */ "Krabby",
  /* 99 */ "Kingler",
  /* 100 */ "Voltorb",
  /* 101 */ "Electrode",
  /* 102 */ "Exeggcute",
  /* 103 */ "Exeggutor",
  /* 104 */ "Cubone",
  /* 105 */ "Marowak",
  /* 106 */ "Hitmonlee",
  /* 107 */ "Hitmonchan",
  /* 108 */ "Lickitung",
  /* 109 */ "Koffing",
  /* 110 */ "Weezing",
  /* 111 */ "Rhyhorn",
  /* 112 */ "Rhydon",
  /* 113 */ "Chansey",
  /* 114 */ "Tangela",
  /* 115 */ "Kangaskhan",
  /* 116 */ "Horsea",
  /* 117 */ "Seadra",
  /* 118 */ "Goldeen",
  /* 119 */ "Seaking",
  /* 120 */ "Staryu",
  /* 121 */ "Starmie",
  /* 122 */ "Mr. Mime",
  /* 123 */ "Scyther",
  /* 124 */ "Jynx",
  /* 125 */ "Electabuzz",
  /* 126 */ "Magmar",
  /* 127 */ "Pinsir",
  /* 128 */ "Tauros",
  /* 129 */ "Magikarp",
  /* 130 */ "Gyarados",
  /* 131 */ "Lapras",
  /* 132 */ "Ditto",
  /* 133 */ "Eevee",
  /* 134 */ "Vaporeon",
  /* 135 */ "Jolteon",
  /* 136 */ "Flareon",
  /* 137 */ "Porygon",
  /* 138 */ "Omanyte",
  /* 139 */ "Omastar",
  /* 140 */ "Kabuto",
  /* 141 */ "Kabutops",
  /* 142 */ "Aerodactyl",
  /* 143 */ "Snorlax",
  /* 144 */ "Articuno",
  /* 145 */ "Zapdos",
  /* 146 */ "Moltres",
  /* 147 */ "Dratini",
  /* 148 */ "Dragonair",
  /* 149 */ "Dragonite",
  /* 150 */ "Mewtwo",
  /* 151 */ "Mew",
  /* 152 */ "Chikorita",
  /* 153 */ "Bayleef",
  /* 154 */ "Meganium",
  /* 155 */ "Cyndaquil",
  /* 156 */ "Quilava",
  /* 157 */ "Typhlosion",
  /* 158 */ "Totodile",
  /* 159 */ "Croconaw",
  /* 160 */ "Feraligatr",
  /* 161 */ "Sentret",
  /* 162 */ "Furret",
  /* 163 */ "Hoothoot",
  /* 164 */ "Noctowl",
  /* 165 */ "Ledyba",
  /* 166 */ "Ledian",
  /* 167 */ "Spinarak",
  /* 168 */ "Ariados",
  /* 169 */ "Crobat",
  /* 170 */ "Chinchou",
  /* 171 */ "Lanturn",
  /* 172 */ "Pichu",
  /* 173 */ "Cleffa",
  /* 174 */ "Igglybuff",
  /* 175 */ "Togepi",
  /* 176 */ "Togetic",
  /* 177 */ "Natu",
  /* 178 */ "Xatu",
  /* 179 */ "Mareep",
  /* 180 */ "Flaaffy",
  /* 181 */ "Ampharos",
  /* 182 */ "Bellossom",
  /* 183 */ "Marill",
  /* 184 */ "Azumarill",
  /* 185 */ "Sudowoodo",
  /* 186 */ "Politoed",
  /* 187 */ "Hoppip",
  /* 188 */ "Skiploom",
  /* 189 */ "Jumpluff",
  /* 190 */ "Aipom",
  /* 191 */ "Sunkern",
  /* 192 */ "Sunflora",
  /* 193 */ "Yanma",
  /* 194 */ "Wooper",
  /* 195 */ "Quagsire",
  /* 196 */ "Espeon",
  /* 197 */ "Umbreon",
  /* 198 */ "Murkrow",
  /* 199 */ "Slowking",
  /* 200 */ "Misdreavus",
  /* 201 */ "Unown",
  /* 202 */ "Wobbuffet",
  /* 203 */ "Girafarig",
  /* 204 */ "Pineco",
  /* 205 */ "Forretress",
  /* 206 */ "Dunsparce",
  /* 207 */ "Gligar",
  /* 208 */ "Steelix",
  /* 209 */ "Snubbull",
  /* 210 */ "Granbull",
  /* 211 */ "Qwilfish",
  /* 212 */ "Scizor",
  /* 213 */ "Shuckle",
  /* 214 */ "Heracross",
  /* 215 */ "Sneasel",
  /* 216 */ "Teddiursa",
  /* 217 */ "Ursaring",
  /* 218 */ "Slugma",
  /* 219 */ "Magcargo",
  /* 220 */ "Swinub",
  /* 221 */ "Piloswine",
  /* 222 */ "Corsola",
  /* 223 */ "Remoraid",
  /* 224 */ "Octillery",
  /* 225 */ "Delibird",
  /* 226 */ "Mantine",
  /* 227 */ "Skarmory",
  /* 228 */ "Houndour",
  /* 229 */ "Houndoom",
  /* 230 */ "Kingdra",
  /* 231 */ "Phanpy",
  /* 232 */ "Donphan",
  /* 233 */ "Porygon2",
  /* 234 */ "Stantler",
  /* 235 */ "Smeargle",
  /* 236 */ "Tyrogue",
  /* 237 */ "Hitmontop",
  /* 238 */ "Smoochum",
  /* 239 */ "Elekid",
  /* 240 */ "Magby",
  /* 241 */ "Miltank",
  /* 242 */ "Blissey",
  /* 243 */ "Raikou",
  /* 244 */ "Entei",
  /* 245 */ "Suicune",
  /* 246 */ "Larvitar",
  /* 247 */ "Pupitar",
  /* 248 */ "Tyranitar",
  /* 249 */ "Lugia",
  /* 250 */ "Ho-Oh",
  /* 251 */ "Celebi",
];

/** Devuelve el prefijo de pista khinsider para un Pokémon dado su índice 0-based */
function getKhinsiderTrackPrefix(idx) {
  // idx 0-52  → CD1 tracks 46-98  → prefix "1-46", "1-47", ..., "1-98"
  // idx 53-150 → CD2 tracks 1-98  → prefix "2-01", "2-02", ..., "2-98"
  if (idx <= 52) {
    const trackNum = 46 + idx; // 46..98
    return `1-${trackNum}`;
  } else {
    const trackNum = idx - 52; // 1..98
    return `2-${String(trackNum).padStart(2, "0")}`;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Referer: "https://downloads.khinsider.com/",
};

async function getDirectUrl(trackFilename) {
  const pageUrl = `${KHINSIDER_ALBUM}/${encodeURIComponent(trackFilename)}`;
  const res = await fetch(pageUrl, { headers: FETCH_HEADERS });
  if (!res.ok) {
    console.log(`    HTTP ${res.status} al obtener página: ${pageUrl}`);
    return null;
  }
  const html = await res.text();
  const match = html.match(/https:\/\/[^"']*vgmtreasurechest[^"']*\.mp3/);
  return match ? match[0] : null;
}

async function writeDownloadedFile(url, tmp) {
  const response = await fetch(url, { headers: FETCH_HEADERS });
  if (!response.ok) return `fail-${response.status}`;

  const buffer = await response.arrayBuffer();
  await writeFile(tmp, Buffer.from(buffer));
  return "ok";
}

function convertToGameMp3(tmp, dest) {
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-i", tmp,
      "-t", String(TRIM_SECS),
      "-acodec", "libmp3lame",
      "-q:a", "4",
      dest,
    ],
    { stdio: "pipe" }
  );
}

async function downloadAndTrim(pokemonId, name) {
  const dest = path.join(OUT_DIR, String(pokemonId).padStart(3, "0") + ".mp3");
  if (existsSync(dest)) return "skip";

  let sourceUrl;
  let tmp;

  if (pokemonId <= 151) {
    const idx = pokemonId - 1; // 0-based
    const prefix = getKhinsiderTrackPrefix(idx);
    const trackFilename = `${prefix}. ${name}.mp3`;
    sourceUrl = await getDirectUrl(trackFilename);
    tmp = dest + ".tmp.mp3";

    if (!sourceUrl) return "fail-no-url";
  } else {
    sourceUrl = `${POKEAPI_LEGACY_CRY_BASE}/${pokemonId}.ogg`;
    tmp = dest + ".tmp.ogg";
  }

  // Descargar a archivo temporal
  const downloadResult = await writeDownloadedFile(sourceUrl, tmp);
  if (downloadResult !== "ok") return downloadResult;

  // Recortar a TRIM_SECS con ffmpeg
  try {
    convertToGameMp3(tmp, dest);
    unlinkSync(tmp);
  } catch (e) {
    // Evita dejar temporales o salidas incompletas si ffmpeg falla.
    try { unlinkSync(tmp); } catch {}
    try { unlinkSync(dest); } catch {}
    return "fail-ffmpeg";
  }

  return "ok";
}

(async () => {
  // Verificar ffmpeg
  try {
    execSync("ffmpeg -version", { stdio: "pipe" });
  } catch {
    console.error("\nERROR: ffmpeg no está en PATH. Instálalo con: brew install ffmpeg\n");
    process.exit(1);
  }

  if (!existsSync(OUT_DIR)) {
    mkdirSync(OUT_DIR, { recursive: true });
    console.log("Creado: " + OUT_DIR);
  }

  const THROTTLE_MS = 700;
  let ok = 0, skip = 0;
  const fail = [];

  console.log(`\nDescargando ${POKEMON_NAMES.length} gritos de Pokémon (recortados a ${TRIM_SECS}s)...\n`);

  for (let i = 0; i < POKEMON_NAMES.length; i++) {
    const id = i + 1;
    const name = POKEMON_NAMES[i];
    const result = await downloadAndTrim(id, name);

    if (result === "ok") {
      console.log(`  ✓  ${String(id).padStart(3, "0")}.mp3  (${name})`);
      ok++;
      await sleep(THROTTLE_MS);
    } else if (result === "skip") {
      console.log(`  .  ${String(id).padStart(3, "0")}.mp3  (${name}) — ya existe`);
      skip++;
    } else {
      console.log(`  ✗  ${String(id).padStart(3, "0")}.mp3  (${name}) — ${result}`);
      fail.push({ id, name, result });
      await sleep(THROTTLE_MS);
    }
  }

  console.log(`\n--- OK:${ok}  Skip:${skip}  Fail:${fail.length} ---`);
  if (fail.length > 0) {
    console.log("\nFallidos:");
    fail.forEach(f => console.log(`  #${f.id} ${f.name}: ${f.result}`));
  }
  console.log(`\nListo: ${OUT_DIR}\n`);
})();
