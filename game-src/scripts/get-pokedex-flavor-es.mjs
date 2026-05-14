// Descarga descripciones (flavor text) en español para los 151 Pokémon de
// Gen I desde PokéAPI y las guarda en src/app/pokedex-flavor-es.json.
//
// Uso:
//   node game-src/scripts/get-pokedex-flavor-es.mjs
//
// - Throttle 200 ms entre peticiones para no saturar PokéAPI.
// - Caché en disco (game-src/scripts/.cache-flavor/) → reejecuciones rápidas.
// - Si una especie no tiene entrada en español, se deja "" y se incluye en
//   el listado final de "missing" que se imprime por consola.
// - Prioriza versiones modernas con texto más limpio.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, ".cache-flavor");
const OUT_PATH  = path.join(__dirname, "..", "src", "app", "pokedex-flavor-es.json");

const TOTAL = 151;
const THROTTLE_MS = 200;
const PRIORITY = [
  "omega-ruby", "alpha-sapphire", "y", "x",
  "ultra-sun", "ultra-moon", "sun", "moon",
  "black-2", "white-2", "black", "white",
  "heartgold", "soulsilver", "platinum", "diamond", "pearl",
  "firered", "leafgreen", "emerald", "ruby", "sapphire",
  "crystal", "gold", "silver", "yellow", "blue", "red",
];

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const cleanText = (s) =>
  s
    .replace(/\u000c/g, " ")  // form feed (page break Game Boy)
    .replace(/\u00ad/g, "")   // soft hyphen
    .replace(/[\r\n]+/g, " ") // saltos de línea → espacios
    .replace(/\s+/g, " ")
    .trim();

const pickFlavor = (entries) => {
  const es = entries.filter((e) => e.language?.name === "es");
  if (es.length === 0) return null;

  // Buscar por orden de prioridad de versión
  for (const ver of PRIORITY) {
    const hit = es.find((e) => e.version?.name === ver);
    if (hit) return cleanText(hit.flavor_text);
  }
  // Cualquier otra entrada en español
  return cleanText(es[0].flavor_text);
};

const fetchSpecies = async (id) => {
  const cachePath = path.join(CACHE_DIR, `${id}.json`);
  if (fs.existsSync(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, "utf8"));
  }
  const url = `https://pokeapi.co/api/v2/pokemon-species/${id}/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  const json = await res.json();
  fs.writeFileSync(cachePath, JSON.stringify(json));
  await sleep(THROTTLE_MS);
  return json;
};

const main = async () => {
  const out = {};
  const missing = [];
  for (let id = 1; id <= TOTAL; id++) {
    process.stdout.write(`#${String(id).padStart(3, "0")} `);
    try {
      const species = await fetchSpecies(id);
      const flavor = pickFlavor(species.flavor_text_entries || []);
      if (flavor) {
        out[String(id)] = flavor;
        process.stdout.write("OK\n");
      } else {
        out[String(id)] = "";
        missing.push({ id, name: species.name });
        process.stdout.write("VACÍO (sin ES)\n");
      }
    } catch (e) {
      out[String(id)] = "";
      missing.push({ id, name: `??? (${e.message})` });
      process.stdout.write(`ERROR: ${e.message}\n`);
    }
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`\n✓ Escrito ${OUT_PATH}`);
  console.log(`  Total: ${TOTAL}, con texto ES: ${TOTAL - missing.length}, vacíos: ${missing.length}`);
  if (missing.length > 0) {
    console.log("\nPokémon SIN descripción en español (quedan vacíos):");
    for (const m of missing) console.log(`  #${String(m.id).padStart(3, "0")} ${m.name}`);
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
