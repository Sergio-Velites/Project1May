/**
 * Índice runtime: Pokémon → mapas donde puede aparecer (por encuentros).
 *
 * Recorre MAP_DATA una sola vez (memoizado) y agrupa por ID de Pokémon todos
 * los mapas cuyo campo `encounters` lo incluye en cualquier método (grass,
 * surf, rods, etc.). Devuelve los nombres de mapa ya en español tal como
 * están definidos en cada archivo de mapa (campo `name`).
 *
 * Usado por la Pokédex para mostrar la sección "ÁREAS:" en la ficha de cada
 * Pokémon.
 */

import mapData from "../maps/map-data";
import { EncountersType, MapType } from "../maps/map-types";

const METHOD_LABELS: Partial<Record<keyof EncountersType, string>> = {
  walk:        "Hierba",
  surf:        "Surf",
  oldRod:      "C. Vieja",
  goodRod:     "C. Buena",
  superRod:    "Supercaña",
  rockSmash:   "Rocas",
  headbutt:    "Cabezazo",
  darkGrass:   "Hierba alta",
  grassSpots:  "Hierba",
  caveSpots:   "Cueva",
  bridgeSpots: "Puente",
  superRodSpots: "Supercaña",
  surfSpots:   "Surf",
  yellowFlowers: "Flores",
  purpleFlowers: "Flores",
  redFlowers:    "Flores",
  roughTerrain:  "Terreno",
  gift:          "Regalo",
  giftEgg:       "Huevo",
  onlyOne:       "Único",
};

export interface PokemonArea {
  mapId: string;
  mapName: string;
  methods: string[];
}

let cache: Record<number, PokemonArea[]> | null = null;

export const buildEncounterIndex = (): Record<number, PokemonArea[]> => {
  if (cache) return cache;
  const out: Record<number, PokemonArea[]> = {};

  for (const [mapId, map] of Object.entries(mapData) as [string, MapType][]) {
    if (!map.encounters) continue;
    // Acumular IDs encontrados en este mapa (con qué métodos)
    const perId: Record<number, Set<string>> = {};
    for (const [methodKey, method] of Object.entries(map.encounters)) {
      if (!method || !method.pokemon) continue;
      const label = METHOD_LABELS[methodKey as keyof EncountersType] ?? methodKey;
      for (const p of method.pokemon) {
        if (!perId[p.id]) perId[p.id] = new Set();
        perId[p.id].add(label);
      }
    }
    for (const [idStr, methodsSet] of Object.entries(perId)) {
      const id = Number(idStr);
      if (!out[id]) out[id] = [];
      out[id].push({
        mapId,
        mapName: map.name,
        methods: Array.from(methodsSet),
      });
    }
  }

  cache = out;
  return out;
};

export const getAreasForPokemon = (id: number): PokemonArea[] => {
  return buildEncounterIndex()[id] ?? [];
};
