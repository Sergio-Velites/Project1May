#!/usr/bin/env node
/**
 * Genera un catalogo local de mapas/musicas de Pokemon Red/Blue original
 * a partir de pret/pokered.
 *
 * Salida:
 *   public/editor/original-map-music.json
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_FILE = path.join(ROOT, "public", "editor", "original-map-music.json");

const SOURCES = {
  mapConstants: "https://raw.githubusercontent.com/pret/pokered/master/constants/map_constants.asm",
  mapSongs: "https://raw.githubusercontent.com/pret/pokered/master/data/maps/songs.asm",
  route23Header: "https://raw.githubusercontent.com/pret/pokered/master/data/maps/headers/Route23.asm",
};

const MUSIC_ASSETS = {
  MUSIC_PALLET_TOWN: {
    label: "Pallet Town",
    asset: "/game/music/maps-original/pallet-town.mp3",
  },
  MUSIC_CITIES1: {
    label: "Cities 1 (Viridian/Pewter/Saffron)",
    asset: "/game/music/maps-original/viridian-city.mp3",
  },
  MUSIC_CITIES2: {
    label: "Cities 2 (Cerulean/Fuchsia)",
    asset: "/game/music/maps-original/cerulean-city.mp3",
  },
  MUSIC_LAVENDER: {
    label: "Lavender Town",
    asset: "/game/music/maps-original/lavender-town.mp3",
  },
  MUSIC_VERMILION: {
    label: "Vermilion City",
    asset: "/game/music/maps-original/vermilion-city.mp3",
  },
  MUSIC_CELADON: {
    label: "Celadon City",
    asset: "/game/music/maps-original/celadon-city.mp3",
  },
  MUSIC_CINNABAR: {
    label: "Cinnabar Island",
    asset: "/game/music/maps-original/cinnabar-island.mp3",
  },
  MUSIC_INDIGO_PLATEAU: {
    label: "Indigo Plateau / Route 23",
    asset: "/game/music/maps-original/indigo-plateau.mp3",
  },
  MUSIC_ROUTES1: {
    label: "Routes 1-2",
    asset: "/game/music/maps-original/route-1.mp3",
  },
  MUSIC_ROUTES2: {
    label: "Routes 24-25",
    asset: "/game/music/maps-original/route-24-welcome.mp3",
  },
  MUSIC_ROUTES3: {
    label: "Routes 3-10, 16-22",
    asset: "/game/music/maps-original/route-3.mp3",
  },
  MUSIC_ROUTES4: {
    label: "Routes 11-15",
    asset: "/game/music/maps-original/route-11.mp3",
  },
  MUSIC_OAKS_LAB: {
    label: "Pokemon Lab",
    asset: "/game/music/maps-original/pokemon-lab.mp3",
  },
  MUSIC_POKECENTER: {
    label: "Pokemon Center / Mart",
    asset: "/game/music/maps-original/pokemon-center.mp3",
  },
  MUSIC_GYM: {
    label: "Pokemon Gym",
    asset: "/game/music/maps-original/pokemon-gym.mp3",
  },
  MUSIC_DUNGEON1: {
    label: "Dungeon 1 (Power Plant/Cerulean Cave/Rocket HQ)",
    asset: "/game/music/maps-original/rocket-hideout.mp3",
  },
  MUSIC_DUNGEON2: {
    label: "Dungeon 2 (Viridian Forest/Seafoam Islands)",
    asset: "/game/music/maps-original/viridian-forest.mp3",
  },
  MUSIC_DUNGEON3: {
    label: "Dungeon 3 (Mt. Moon/Rock Tunnel/Victory Road)",
    asset: "/game/music/maps-original/mt-moon.mp3",
  },
  MUSIC_GAME_CORNER: {
    label: "Rocket Game Corner",
    asset: "/game/music/maps-original/rocket-game-corner.mp3",
  },
  MUSIC_SS_ANNE: {
    label: "S.S. Anne",
    asset: "/game/music/maps-original/ss-anne.mp3",
  },
  MUSIC_POKEMON_TOWER: {
    label: "Pokemon Tower",
    asset: "/game/music/maps-original/pokemon-tower.mp3",
  },
  MUSIC_SILPH_CO: {
    label: "Silph Co.",
    asset: "/game/music/maps-original/silph-co.mp3",
  },
  MUSIC_CINNABAR_MANSION: {
    label: "Pokemon Mansion",
    asset: "/game/music/maps-original/pokemon-mansion.mp3",
  },
  MUSIC_SAFARI_ZONE: {
    label: "Safari Zone",
    asset: "/game/music/maps-original/safari-zone.mp3",
  },
};

const titleFromConstant = (constant) =>
  constant
    .replace(/^MUSIC_/, "")
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Project1May-map-music-catalog",
    },
  });
  if (!res.ok) throw new Error(`${url}: ${res.status} ${res.statusText}`);
  return res.text();
}

function parseMapConstants(source) {
  const maps = [];
  const regex = /map_const\s+([A-Z0-9_]+),\s*(\d+),\s*(\d+)\s*;\s*\$([0-9A-F]+)/g;

  for (const match of source.matchAll(regex)) {
    const [, constant, width, height, hex] = match;
    maps.push({
      id: maps.length,
      hex: "$" + hex,
      constant,
      width: Number(width),
      height: Number(height),
      unused: constant.startsWith("UNUSED_MAP_") || width === "0" || height === "0",
    });
  }

  return maps;
}

function parseMapSongs(source) {
  const songs = [];
  const regex = /db\s+(MUSIC_[A-Z0-9_]+),\s*BANK\([^)]*\)\s*;\s*([A-Z0-9_]+)/g;

  for (const match of source.matchAll(regex)) {
    const [, musicConstant, mapConstant] = match;
    songs.push({ musicConstant, mapConstant });
  }

  return songs;
}

async function main() {
  const [mapConstantsSource, mapSongsSource] = await Promise.all([
    fetchText(SOURCES.mapConstants),
    fetchText(SOURCES.mapSongs),
  ]);

  const maps = parseMapConstants(mapConstantsSource);
  const songs = parseMapSongs(mapSongsSource);

  if (maps.length !== songs.length) {
    throw new Error(`Map count mismatch: constants=${maps.length}, songs=${songs.length}`);
  }

  const enrichedMaps = maps.map((map, index) => {
    const song = songs[index];
    if (song.mapConstant !== map.constant) {
      throw new Error(`Map order mismatch at ${index}: ${map.constant} != ${song.mapConstant}`);
    }

    const music = MUSIC_ASSETS[song.musicConstant] ?? {
      label: titleFromConstant(song.musicConstant),
      asset: null,
    };

    return {
      ...map,
      displayName: map.constant
        .split("_")
        .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
        .join(" "),
      musicConstant: song.musicConstant,
      musicLabel: music.label,
      musicAsset: music.asset,
    };
  });

  const concreteMaps = enrichedMaps.filter((map) => !map.unused);
  const uniqueMusicConstants = [...new Set(concreteMaps.map((map) => map.musicConstant))].sort();

  const mapsByMusic = Object.fromEntries(
    uniqueMusicConstants.map((musicConstant) => [
      musicConstant,
      concreteMaps
        .filter((map) => map.musicConstant === musicConstant)
        .map((map) => map.constant),
    ])
  );

  const catalog = {
    sources: SOURCES,
    generatedAt: new Date().toISOString(),
    summary: {
      internalMapIds: enrichedMaps.length,
      unusedMapIds: enrichedMaps.length - concreteMaps.length,
      concreteMapIds: concreteMaps.length,
      uniqueMusicConstants: uniqueMusicConstants.length,
    },
    route23: enrichedMaps.find((map) => map.constant === "ROUTE_23"),
    notes: [
      "Route 23 usa MUSIC_INDIGO_PLATEAU, no MUSIC_DUNGEON3.",
      "Victory Road interior usa MUSIC_DUNGEON3, el mismo tema de Mt. Moon/Rock Tunnel.",
      "Safari Zone usa MUSIC_SAFARI_ZONE; en pokered esa misma musica se reutiliza para la animacion de evolucion.",
    ],
    musicAssets: MUSIC_ASSETS,
    mapsByMusic,
    maps: enrichedMaps,
  };

  const outDir = path.dirname(OUT_FILE);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(catalog, null, 2) + "\n");

  console.log(`Catalogo generado: ${OUT_FILE}`);
  console.log(
    `Mapas internos: ${catalog.summary.internalMapIds}; concretos: ${catalog.summary.concreteMapIds}; musicas: ${catalog.summary.uniqueMusicConstants}`
  );
  console.log(
    `Route 23: ${catalog.route23.constant} ${catalog.route23.width}x${catalog.route23.height} -> ${catalog.route23.musicLabel}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
