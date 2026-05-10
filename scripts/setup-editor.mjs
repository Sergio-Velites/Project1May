#!/usr/bin/env node
/**
 * setup-editor.mjs
 * Genera public/editor/map-data.json y copia los assets de mapas y sprites
 * para el editor visual de mapas admin.
 *
 * Uso: node scripts/setup-editor.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GAME_SRC = path.join(ROOT, "game-src/src");
const PUBLIC_EDITOR = path.join(ROOT, "public/editor");

// ── Directorios de destino ────────────────────────────────────────────────
const DEST_MAPS = path.join(PUBLIC_EDITOR, "maps");
const DEST_SPRITES = path.join(PUBLIC_EDITOR, "sprites");
const DEST_PORTRAITS = path.join(PUBLIC_EDITOR, "portraits");
const DEST_POKEMON = path.join(PUBLIC_EDITOR, "pokemon");

for (const dir of [PUBLIC_EDITOR, DEST_MAPS, DEST_SPRITES, DEST_PORTRAITS, DEST_POKEMON]) {
  fs.mkdirSync(dir, { recursive: true });
}

// ── Copiar assets ─────────────────────────────────────────────────────────
function copyDir(srcDir, destDir, ext = ".png") {
  if (!fs.existsSync(srcDir)) return;
  const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(ext));
  for (const file of files) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
  }
  console.log(`  ✓ ${files.length} archivos copiados de ${path.relative(ROOT, srcDir)}`);
}

console.log("📂 Copiando assets...");
copyDir(path.join(GAME_SRC, "assets/map"), DEST_MAPS);
copyDir(path.join(GAME_SRC, "assets/walk-sprites"), DEST_SPRITES);
copyDir(path.join(GAME_SRC, "assets/portraits"), DEST_PORTRAITS);
copyDir(path.join(GAME_SRC, "assets/pokemon/front"), DEST_POKEMON);

// ── Mapeo imagen de archivo .ts → nombre de archivo PNG ──────────────────
// La primera línea import del mapa siempre es la imagen.
function extractImageFile(tsText) {
  const m = tsText.match(/import\s+\w+\s+from\s+"[^"]*\/map\/([^"]+\.png)"/);
  return m ? m[1] : null;
}

// ── Parser walls / fences / grass / exits ─────────────────────────────────
// Estos campos tienen estructura `key: { N: [a, b, c], M: [...] }` con claves
// numéricas. Las convertimos a JSON válido normalizando las claves.
function parseRowColMap(tsText, key) {
  const m = tsText.match(new RegExp(`${key}\\s*:\\s*\\{`));
  if (!m) return {};
  const start = tsText.indexOf("{", m.index + m[0].length - 1);
  let depth = 0;
  let end = start;
  for (let i = start; i < tsText.length; i++) {
    if (tsText[i] === "{") depth++;
    else if (tsText[i] === "}") {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  let block = tsText.slice(start, end + 1);
  // Strip comentarios
  block = block.replace(/\/\/[^\n]*/g, "");
  block = block.replace(/\/\*[\s\S]*?\*\//g, "");
  // Normalizar claves numéricas: `  3:` o `,3:` o `{3:` → `"3":`
  block = block.replace(/([\s,{])(-?\d+)\s*:/g, '$1"$2":');
  // Eliminar trailing commas
  block = block.replace(/,(\s*[}\]])/g, "$1");
  try {
    const parsed = JSON.parse(block);
    const result = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (Array.isArray(v) && v.every((n) => typeof n === "number")) {
        result[k] = v;
      }
    }
    return result;
  } catch {
    return {};
  }
}

// ── Parsear los trainers del archivo .ts con regex ────────────────────────
// Extrae el bloque trainers: [...] como texto y lo convierte en objetos planos.
function parseTrainers(tsText) {
  // Encontrar el bloque trainers: [ ... ]
  const trainersMatch = tsText.match(/trainers\s*:\s*\[/);
  if (!trainersMatch) return [];

  const startIdx = tsText.indexOf("[", trainersMatch.index + trainersMatch[0].length - 1);
  if (startIdx === -1) return [];

  // Balancear corchetes para encontrar el fin del array
  let depth = 0;
  let endIdx = startIdx;
  for (let i = startIdx; i < tsText.length; i++) {
    if (tsText[i] === "[") depth++;
    else if (tsText[i] === "]") {
      depth--;
      if (depth === 0) { endIdx = i; break; }
    }
  }

  const block = tsText.slice(startIdx + 1, endIdx);

  // Parsear cada NPC object dentro del bloque.
  // Usamos un enfoque de balanceo de llaves para extraer cada objeto.
  const trainers = [];
  let objDepth = 0;
  let objStart = -1;

  for (let i = 0; i < block.length; i++) {
    if (block[i] === "{") {
      if (objDepth === 0) objStart = i;
      objDepth++;
    } else if (block[i] === "}") {
      objDepth--;
      if (objDepth === 0 && objStart !== -1) {
        const objText = block.slice(objStart + 1, i);
        const trainer = parseTrainerObject(objText);
        if (trainer) trainers.push(trainer);
        objStart = -1;
      }
    }
  }

  return trainers;
}

function parseTrainerObject(text) {
  try {
    // npc key
    const npcM = text.match(/npc\s*:\s*(\w+)/);
    const npcKey = npcM ? npcM[1] : "youngster";

    // pos
    const posM = text.match(/pos\s*:\s*\{\s*x\s*:\s*(\d+)\s*,\s*y\s*:\s*(\d+)\s*\}/);
    const pos = posM ? { x: parseInt(posM[1]), y: parseInt(posM[2]) } : { x: 0, y: 0 };

    // facing
    const facingM = text.match(/facing\s*:\s*Direction\.(\w+)/);
    const facing = facingM ? facingM[1].toLowerCase() : "down";

    // money
    const moneyM = text.match(/money\s*:\s*(\d+)/);
    const money = moneyM ? parseInt(moneyM[1]) : 0;

    // persistent
    const persistent = /persistent\s*:\s*true/.test(text);

    // isOnline
    const isOnline = /isOnline\s*:\s*true/.test(text);

    // hideCondition
    const hideM = text.match(/hideCondition\s*:\s*"([^"]+)"/);
    const hideCondition = hideM ? hideM[1] : null;

    // intro — extraer array de strings
    const intro = parseStringArray(text, "intro");

    // outtro
    const outtro = parseStringArray(text, "outtro");

    // pokemon
    const pokemon = parsePokemonArray(text);

    // postGame — extraer como texto raw (puede contener ItemType.xxx)
    const postGameM = text.match(/postGame\s*:/);
    let postGame = null;
    if (postGameM) {
      const start = text.indexOf("{", postGameM.index + postGameM[0].length);
      if (start !== -1) {
        let depth = 0;
        let end = start;
        for (let i = start; i < text.length; i++) {
          if (text[i] === "{") depth++;
          else if (text[i] === "}") {
            depth--;
            if (depth === 0) { end = i; break; }
          }
        }
        postGame = text.slice(start, end + 1).trim();
      }
    }

    return {
      npcKey,
      pos,
      facing,
      money,
      persistent,
      isOnline,
      hideCondition,
      intro,
      outtro,
      pokemon,
      postGame,
    };
  } catch {
    return null;
  }
}

function parseStringArray(text, key) {
  // Encontrar key: [ ... ] con balanceo
  const keyMatch = text.match(new RegExp(`${key}\\s*:\\s*\\[`));
  if (!keyMatch) return [];

  const startIdx = text.indexOf("[", keyMatch.index + keyMatch[0].length - 1);
  let depth = 0;
  let endIdx = startIdx;
  for (let i = startIdx; i < text.length; i++) {
    if (text[i] === "[") depth++;
    else if (text[i] === "]") {
      depth--;
      if (depth === 0) { endIdx = i; break; }
    }
  }

  const inner = text.slice(startIdx + 1, endIdx);
  // Extraer strings entre comillas (simples o dobles, multi-línea no soportado)
  const strings = [];
  const re = /"([^"]*)"|'([^']*)'/g;
  let m;
  while ((m = re.exec(inner)) !== null) {
    strings.push(m[1] ?? m[2]);
  }
  return strings;
}

function parsePokemonArray(text) {
  const re = /\{\s*id\s*:\s*(\d+)\s*,\s*level\s*:\s*(\d+)\s*\}/g;
  const result = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    result.push({ id: parseInt(m[1]), level: parseInt(m[2]) });
  }
  return result;
}

// ── Leer todos los archivos de mapa ──────────────────────────────────────
const MAP_DIR = path.join(GAME_SRC, "maps");
const MAP_FILES = fs.readdirSync(MAP_DIR).filter(
  (f) => f.endsWith(".ts") && !f.startsWith("map-") && f !== "template.ts" && f !== "get-location-data.ts"
);

// Mapeo de nombres de función/variable NPC → claves del NPC_REGISTRY del editor
// (algunos mapas importan npcs con alias)
const NPC_ALIASES = {
  // variables directas de npcs.ts
  ash: "ash", oak: "oak", rival: "rival", beauty: "beauty",
  birdKeeper: "birdKeeper", blackBelt: "blackBelt", bugCatcher: "bugCatcher",
  burglar: "burglar", channeler: "channeler", aceTrainerMale: "aceTrainerMale",
  aceTrainerFemale: "aceTrainerFemale", cueBall: "cueBall", engineer: "engineer",
  fisher: "fisher", gambler: "gambler", gentleman: "gentleman", hiker: "hiker",
  jrTrainerMale: "jrTrainerMale", jrTrainerFemale: "jrTrainerFemale",
  juggler: "juggler", lass: "lass", pokeManiac: "pokeManiac", psychic: "psychic",
  rocker: "rocker", teamRocketGrunt: "teamRocketGrunt", sailor: "sailor",
  scientist: "scientist", superNerd: "superNerd", swimmer: "swimmer",
  tamer: "tamer", youngster: "youngster", biker: "biker",
  brock: "brock", misty: "misty", ltSurge: "ltSurge", erica: "erica",
  koga: "koga", sabrina: "sabrina", blaine: "blaine", giovanni: "giovanni",
  sergioNpc: "sergioNpc", martaNpc: "martaNpc",
};

// Mapeo MapId string → nombre de archivo PNG del mapa
const MAP_ID_TO_IMAGE = {
  "pallet-town": "pallet-town.png",
  "pallet-town-house-a-1f": "house-a-1f.png",
  "pallet-town-house-a-2f": "house-a-2f.png",
  "pallet-town-house-b": "house-b.png",
  "route-1": "route-1.png",
  "pallet-town-lab": "lab.png",
  "viridian-city": "viridian-city.png",
  "viridian-city-gym": "viridian-city-gym.png",
  "viridian-city-poke-mart": "viridian-city-poke-mart.png",
  "viridian-city-pokemon-center": "viridian-city-pokemon-center.png",
  "viridian-city-pokemon-acadamy": "viridian-city-pokemon-acadamy.png",
  "veridian-city-npc-house": "viridian-city-npc-house.png",
  "route-22": "route-22.png",
  "gate-house": "gate-house.png",
  "route-2": "route-2.png",
  "route-2-gate": "route-2-gate.png",
  "viridian-forrest": "viridian-forrest.png",
  "route-2-gate-north": "route-2-gate.png",
  "pewter-city": "pewter-city.png",
  "pewter-city-poke-mart": "pewter-city-poke-mart.png",
  "pewter-city-pokemon-center": "pewter-city-pokemon-center.png",
  "pewter-city-npc-a": "pewter-city-npc-house.png",
  "pewter-city-npc-b": "pewter-city-npc-house.png",
  "pewter-city-gym": "pewter-city-gym.png",
  "pewter-city-museum-1f": "pewter-museum-1f.png",
  "pewter-city-museum-2f": "pewter-museum-2f.png",
  "route-3": "route-3.png",
  "route-3-pokemon-center": "route-3-pokemon-center.png",
  "mt-moon-1f": "mt-moon-1f.png",
  "mt-moon-2f": "mt-moon-2f.png",
  "mt-moon-3f": "mt-moon-3f.png",
};

console.log("\n📋 Procesando archivos de mapa...");

const mapData = {};
let processed = 0;

for (const file of MAP_FILES) {
  const tsText = fs.readFileSync(path.join(MAP_DIR, file), "utf-8");

  // Extraer nombre legible
  const nameM = tsText.match(/name\s*:\s*"([^"]+)"/);
  const name = nameM ? nameM[1] : file.replace(".ts", "");

  // Extraer dimensiones
  const heightM = tsText.match(/height\s*:\s*(\d+)/);
  const widthM = tsText.match(/width\s*:\s*(\d+)/);
  const height = heightM ? parseInt(heightM[1]) : 20;
  const width = widthM ? parseInt(widthM[1]) : 20;

  // Extraer imagen
  const imageFile = extractImageFile(tsText) ?? `${file.replace(".ts", ".png")}`;

  // Extraer trainers
  const trainers = parseTrainers(tsText);

  // Extraer walls (campo obligatorio en MapType)
  const walls = parseRowColMap(tsText, "walls");

  // Inferir MapId desde el nombre de archivo .ts
  const mapId = file
    .replace(".ts", "")
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "");

  // Mapear el ID a la imagen conocida
  // Intentamos buscar qué MapId corresponde a este archivo
  // (buscamos el valor del enum que coincida con el nombre del archivo)
  const mapIdM = tsText.match(/MapId\.(\w+)\s*=\s*"([^"]+)"/g);
  let resolvedMapId = null;
  
  // Buscar en el texto si referencia su propio MapId
  // Alternativa: buscar en map-types.ts
  const mapTypesText = fs.readFileSync(path.join(MAP_DIR, "map-types.ts"), "utf-8");
  const enumMatches = [...mapTypesText.matchAll(/(\w+)\s*=\s*"([^"]+)"/g)];

  // Intentar mapear por nombre de imagen
  for (const [, , val] of enumMatches) {
    if (MAP_ID_TO_IMAGE[val] === imageFile) {
      resolvedMapId = val;
      break;
    }
  }

  // Si no encontramos por imagen, usar el nombre del archivo .ts como MapId heurístico
  if (!resolvedMapId) {
    const slug = file.replace(".ts", "");
    // Buscar un MapId cuyo valor contenga el slug
    for (const [, , val] of enumMatches) {
      if (val.replace(/-/g, "") === slug.replace(/-/g, "")) {
        resolvedMapId = val;
        break;
      }
    }
    if (!resolvedMapId) resolvedMapId = slug;
  }

  mapData[resolvedMapId] = {
    id: resolvedMapId,
    name,
    imageFile,
    height,
    width,
    trainers,
    walls,
    sourceFile: file,
  };

  processed++;
  console.log(`  ✓ ${name} (${resolvedMapId}) — ${trainers.length} NPCs, ${Object.values(walls).reduce((a, b) => a + b.length, 0)} walls`);
}

// ── Escribir JSON ─────────────────────────────────────────────────────────
const outputPath = path.join(PUBLIC_EDITOR, "map-data.json");
fs.writeFileSync(outputPath, JSON.stringify(mapData, null, 2), "utf-8");

console.log(`\n✅ Listo — ${processed} mapas procesados`);
console.log(`   JSON: ${path.relative(ROOT, outputPath)}`);
console.log(`   Maps: public/editor/maps/`);
console.log(`   Sprites: public/editor/sprites/`);
console.log(`   Portraits: public/editor/portraits/`);
