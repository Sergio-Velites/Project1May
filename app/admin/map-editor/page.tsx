'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { parseMapTS } from './parse-ts';

// ── Tipos ─────────────────────────────────────────────────────────────────

interface Pokemon { id: number; level: number; }

type DirectionName = 'down' | 'up' | 'left' | 'right';

interface Trainer {
  npcKey: string;
  pos: { x: number; y: number };
  facing: 'down' | 'up' | 'left' | 'right';
  money: number;
  persistent: boolean;
  isOnline: boolean;
  hideCondition: string | null;
  /**
   * Distancia de visión (tiles). undefined/null = valor global por defecto (5).
   * 0 = no detecta al jugador, solo combate al hablar.
   */
  sightRange: number | null;
  intro: string[];
  outtro: string[];
  pokemon: Pokemon[];
  // Raw TypeScript text preservado del fuente (ej: ItemType.BoulderBadge).
  // El editor no edita este campo — solo lo preserva y lo re-emite en el export.
  postGame?: string | null;
  isGymLeader?: boolean;
}

interface MapEntry {
  id: string;
  name: string;
  imageFile: string;
  height: number;
  width: number;
  start?: { x: number; y: number } | null;
  cave?: boolean;
  dark?: boolean;
  allowBicycle?: boolean;
  /** Editor-only: prepara futuros destinos de Vuelo. El juego aún no lo consume. */
  flyable?: boolean;
  flySpot?: { x: number; y: number } | null;
  music?: string | null;
  trainers: Trainer[];
  walls: Record<string, number[]>;
  fences?: Record<string, number[]>;
  grass?: Record<string, number[]>;
  water?: Record<string, number[]>;
  encounters?: EncountersOverride | null;
  texts?: Record<string, Record<string, string[]>>;
  textRewards?: Record<string, Record<string, TextRewardEntry>>;
  items?: { itemKey: string; pos: { x: number; y: number }; hidden?: boolean }[];
  gifts?: { pokemonId: number; level: number; pos: { x: number; y: number }; questId: string }[];
  staticPokemon?: StaticPokemonEntry[];
  boulders?: { pos: { x: number; y: number }; id: string }[];
  /** Árboles de bayas (Gen II): itemKey = nombre del enum ItemType (ej. "Berry"). */
  berryTrees?: { pos: { x: number; y: number }; itemKey: string }[];
  pokemonCenter?: { x: number; y: number } | null;
  pc?: { x: number; y: number } | null;
  store?: { x: number; y: number } | null;
  storeItems?: string[];
  recoverLocation?: { x: number; y: number } | null;
  onlineBattleNpc?: { x: number; y: number } | null;
  spinners?: Record<string, Record<string, DirectionName>>;
  stoppers?: Record<string, number[]>;
  // Portales entre mapas
  maps?: Record<string, Record<string, string>>;
  teleports?: Record<string, Record<string, { map: string; pos: { x: number; y: number } }>>;
  exits?: Record<string, number[]>;
  exitReturnMap?: string | null;
  exitReturnPos?: { x: number; y: number } | null;
  minimapPos?: { x: number; y: number } | null;
  sourceFile: string;
}

type MapData = Record<string, MapEntry>;

interface MusicTrack {
  filename: string;
  label: string;
  path: string;
  expression: string;
}

/**
 * Pokémon que aparece en una tabla de encuentros (walk / oldRod /
 * goodRod / superRod). Mantenemos el shape de la API original para que
 * el override sea compatible 1:1 con `EncountersType` del juego.
 */
type EditorTimeSegment = 'morning' | 'day' | 'night';

interface EncounterPokemon {
  id: number;
  chance: number;
  conditionValues: { name: string; url: string }[];
  maxLevel: number;
  minLevel: number;
  /** Tramos horarios (Gen II) en los que aparece. Vacío/undefined = 24 h. */
  timesOfDay?: EditorTimeSegment[];
}

interface EncounterTable {
  rate: number;
  pokemon: EncounterPokemon[];
}

/**
 * Override parcial de encounters — sólo se editan las tablas relevantes
 * para el juego (caminar + 3 cañas). El resto se mantiene del JSON base.
 */
type EncounterTableKey = 'walk' | 'oldRod' | 'goodRod' | 'superRod' | 'surfSpots';
type EncountersOverride = Partial<Record<EncounterTableKey, EncounterTable>>;

const EMPTY_TABLE = (): EncounterTable => ({ rate: 0, pokemon: [] });

type EditMode = 'npc' | 'walls' | 'fences' | 'grass' | 'water' | 'texts' | 'items' | 'gifts' | 'static-pokemon' | 'cuttable-trees' | 'berry-trees' | 'boulders' | 'spots' | 'mechanics' | 'portals' | 'map';

/** Bayas válidas para árboles de bayas (nombres del enum ItemType del juego). */
const BERRY_ITEM_KEYS = [
  'Berry', 'GoldBerry', 'PrzCureBerry', 'PsnCureBerry', 'MintBerry',
  'IceBerry', 'BurntBerry', 'BitterBerry', 'MiracleBerry', 'MysteryBerry',
] as const;

type SpotKey = 'start' | 'pokemonCenter' | 'pc' | 'store' | 'recoverLocation' | 'onlineBattleNpc';

type MechanicTool = 'spinner-up' | 'spinner-down' | 'spinner-left' | 'spinner-right' | 'stopper';

type PortalKind = 'door' | 'teleport' | 'exit';

interface PortalEntry {
  kind: PortalKind;
  pos: { x: number; y: number };
  // Para door y teleport: MapId destino. Para teleport: pos destino. Para exit: nada.
  destMap?: string;
  destPos?: { x: number; y: number };
}

interface ItemEntry { itemKey: string; pos: { x: number; y: number }; hidden?: boolean; }
interface GiftEntry { pokemonId: number; level: number; pos: { x: number; y: number }; questId: string; }
interface StaticPokemonEntry { pokemonId: number; level: number; sprite: string; pos: { x: number; y: number }; questId: string; intro?: string[]; }
interface TextRewardEntry {
  type: 'pokemon' | 'item';
  pokemonId?: number;
  level?: number;
  itemKey?: string;
  amount?: number;
  questId: string;
}

// ── NPC Registry ──────────────────────────────────────────────────────────

const NPC_REGISTRY: Record<string, { label: string; sprite: string; portrait: string }> = {
  ash:             { label: 'Ash',           sprite: 'ash',  portrait: 'ash.png'              },
  oak:             { label: 'Oak',           sprite: 'oak',  portrait: 'oak.png'              },
  rival:           { label: 'Rival',         sprite: 'red',  portrait: 'rival.png'            },
  beauty:          { label: 'Beauty',        sprite: 'ad',   portrait: 'beauty.png'           },
  birdKeeper:      { label: 'Bird Keeper',   sprite: 'g',    portrait: 'bird-keeper.png'      },
  blackBelt:       { label: 'Black Belt',    sprite: 'u',    portrait: 'black-belt.png'       },
  bugCatcher:      { label: 'Bug Catcher',   sprite: 'f',    portrait: 'bug-catcher.png'      },
  burglar:         { label: 'Burglar',       sprite: 'q',    portrait: 'burglar.png'          },
  channeler:       { label: 'Channeler',     sprite: 'al',   portrait: 'channeler.png'        },
  aceTrainerMale:  { label: 'Ace Trainer ♂', sprite: 'g',    portrait: 'ace-trainer-male.png' },
  aceTrainerFemale:{ label: 'Ace Trainer ♀', sprite: 'l',    portrait: 'ace-trainer-female.png'},
  cueBall:         { label: 'Cue Ball',      sprite: 'ao',   portrait: 'cue-ball.png'         },
  engineer:        { label: 'Engineer',      sprite: 'q',    portrait: 'engineer.png'         },
  fisher:          { label: 'Fisher',        sprite: 'd',    portrait: 'fisher.png'           },
  gambler:         { label: 'Gambler',       sprite: 'o',    portrait: 'gambler.png'          },
  gentleman:       { label: 'Gentleman',     sprite: 'h',    portrait: 'gentleman.png'        },
  hiker:           { label: 'Hiker',         sprite: 'u',    portrait: 'hiker.png'            },
  jrTrainerMale:   { label: 'Jr Trainer ♂',  sprite: 'g',    portrait: 'jr-trainer-male.png'  },
  jrTrainerFemale: { label: 'Jr Trainer ♀',  sprite: 'l',    portrait: 'jr-trainer-male.png'  },
  juggler:         { label: 'Juggler',       sprite: 'ai',   portrait: 'juggler.png'          },
  lass:            { label: 'Lass',          sprite: 'l',    portrait: 'lass.png'             },
  pokeManiac:      { label: 'Poke Maniac',   sprite: 'q',    portrait: 'poke-maniac.png'      },
  psychic:         { label: 'Psychic',       sprite: 'f',    portrait: 'psychic.png'          },
  rocker:          { label: 'Rocker',        sprite: 'q',    portrait: 'rocker.png'           },
  teamRocketGrunt: { label: 'Team Rocket',   sprite: 'w',    portrait: 'team-rocket-grunt.png'},
  sailor:          { label: 'Sailor',        sprite: 'ae',   portrait: 'sailor.png'           },
  scientist:       { label: 'Scientist',     sprite: 'e',    portrait: 'scientist.png'        },
  superNerd:       { label: 'Super Nerd',    sprite: 'q',    portrait: 'super-nerd.png'       },
  swimmer:         { label: 'Swimmer',       sprite: 'ac',   portrait: 'swimmer.png'          },
  tamer:           { label: 'Tamer',         sprite: 'ae',   portrait: 'tamer.png'            },
  youngster:       { label: 'Youngster',     sprite: 'f',    portrait: 'youngster.png'        },
  biker:           { label: 'Biker',         sprite: 'ao',   portrait: 'biker.png'            },
  brock:           { label: 'Brock',         sprite: 'q',    portrait: 'brock.png'            },
  misty:           { label: 'Misty',         sprite: 'k',    portrait: 'misty.png'            },
  ltSurge:         { label: 'Lt. Surge',     sprite: 'ai',   portrait: 'lt-surge.png'         },
  erica:           { label: 'Erica',         sprite: 'am',   portrait: 'erica.png'            },
  koga:            { label: 'Koga',          sprite: 'ap',   portrait: 'koga.png'             },
  sabrina:         { label: 'Sabrina',       sprite: 'c',    portrait: 'sabrina.png'          },
  blaine:          { label: 'Blaine',        sprite: 'r',    portrait: 'blaine.png'           },
  giovanni:        { label: 'Giovanni',      sprite: 'an',   portrait: 'giovanni.png'         },
  sergioNpc:       { label: 'Sergio',        sprite: 'g',    portrait: 'sergio.png'           },
  martaNpc:        { label: 'Marta',         sprite: 'l',    portrait: 'marta.png'            },
};

function spriteUrl(npcKey: string, facing: string) {
  const reg = NPC_REGISTRY[npcKey];
  const prefix = reg?.sprite ?? 'f';
  return `/editor/sprites/${prefix}-${facing}.png`;
}

function portraitUrl(npcKey: string) {
  const reg = NPC_REGISTRY[npcKey];
  return reg ? `/editor/portraits/${reg.portrait}` : null;
}

function npcBorderColor(t: Trainer) {
  if (t.persistent) return '#f5c518';       // amarillo — persistent
  if (t.intro.length > 0) return '#ff5555'; // rojo — combat
  return '#5588ff';                          // azul — solo diálogo
}

// ── Helpers de exportación TS ─────────────────────────────────────────────

function exportTrainersArrayTS(trainers: Trainer[]): string {
  const lines = trainers.map((t) => {
    const npc = t.npcKey;
    const pokemon = t.pokemon.map((p) => `{ id: ${p.id}, level: ${p.level} }`).join(', ');
    const intro = t.intro.map((s) => `    "${s.replace(/"/g, '\\"')}"`).join(',\n');
    const outtro = t.outtro.map((s) => `    "${s.replace(/"/g, '\\"')}"`).join(',\n');
    const opts: string[] = [];
    if (t.persistent) opts.push('  persistent: true,');
    if (t.hideCondition) opts.push(`  hideCondition: "${t.hideCondition}",`);
    if (t.isOnline) opts.push('  isOnline: true,');
    if (t.isGymLeader) opts.push('  isGymLeader: true,');
    if (t.sightRange !== null && t.sightRange !== undefined)
      opts.push(`  sightRange: ${t.sightRange},`);
    if (t.postGame) opts.push(`  postGame: ${t.postGame},`);
    return `  {
  npc: ${npc},
  pokemon: [${pokemon}],
  facing: Direction.${t.facing.charAt(0).toUpperCase() + t.facing.slice(1)},
  pos: { x: ${t.pos.x}, y: ${t.pos.y} },
  intro: [
${intro}
  ],
  outtro: [
${outtro}
  ],
  money: ${t.money},
${opts.join('\n')}
}`;
  });
  return `trainers: [\n${lines.join(',\n')}\n],`;
}

function exportTS(trainers: Trainer[], mapId: string): string {
  return `// Trainers para "${mapId}"\n${exportTrainersArrayTS(trainers)}`;
}

// Exporta el bloque walls con formato igual al original .ts.
function exportWallsTS(walls: Record<string, number[]>): string {
  const rows = Object.keys(walls)
    .map((k) => parseInt(k, 10))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  if (rows.length === 0) return 'walls: {},';
  const lines = rows.map((r) => {
    const cols = (walls[String(r)] ?? []).slice().sort((a, b) => a - b);
    return `    ${r}: [${cols.join(', ')}],`;
  });
  return `walls: {\n${lines.join('\n')}\n  },`;
}

// Genérico para fences/grass (mismo formato que walls).
function exportRowColMapTS(
  data: Record<string, number[]>,
  fieldName: string,
): string {
  const rows = Object.keys(data)
    .map((k) => parseInt(k, 10))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  if (rows.length === 0) return `${fieldName}: {},`;
  const lines = rows.map((r) => {
    const cols = (data[String(r)] ?? []).slice().sort((a, b) => a - b);
    return `    ${r}: [${cols.join(', ')}],`;
  });
  return `${fieldName}: {\n${lines.join('\n')}\n  },`;
}

function escapeTSString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function exportTextsTS(texts: Record<string, Record<string, string[]>>): string {
  const rows = Object.keys(texts)
    .map((k) => parseInt(k, 10))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  if (rows.length === 0) return 'text: {},';
  const rowLines = rows.map((r) => {
    const cols = Object.keys(texts[String(r)] ?? {})
      .map((k) => parseInt(k, 10))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b);
    const colLines = cols.map((c) => {
      const arr = texts[String(r)][String(c)] ?? [];
      const items = arr.map((s) => `        "${escapeTSString(s)}"`).join(',\n');
      return `      ${c}: [\n${items}\n      ],`;
    });
    return `    ${r}: {\n${colLines.join('\n')}\n    },`;
  });
  return `text: {\n${rowLines.join('\n')}\n  },`;
}

function exportItemsTS(items: ItemEntry[]): string {
  if (items.length === 0) return 'items: [],';
  const lines = items.map((it) => {
    const lines = [
      `    {`,
      `      item: ItemType.${it.itemKey},`,
      `      pos: { x: ${it.pos.x}, y: ${it.pos.y} },`,
    ];
    if (it.hidden) lines.push(`      hidden: true,`);
    lines.push(`    },`);
    return lines.join('\n');
  });
  return `items: [\n${lines.join('\n')}\n  ],`;
}

function exportGiftsTS(gifts: GiftEntry[]): string {
  if (gifts.length === 0) return 'gifts: [],';
  const lines = gifts.map((g) => [
    `    {`,
    `      pokemonId: ${g.pokemonId},`,
    `      level: ${g.level},`,
    `      pos: { x: ${g.pos.x}, y: ${g.pos.y} },`,
    `      questId: "${escapeTSString(g.questId)}",`,
    `    },`,
  ].join('\n'));
  return `gifts: [\n${lines.join('\n')}\n  ],`;
}

function exportCuttableTreesTS(trees: { pos: { x: number; y: number }; questId: string }[]): string {
  if (trees.length === 0) return 'cuttableTrees: [],';
  const lines = trees.map((t) => [
    `    {`,
    `      pos: { x: ${t.pos.x}, y: ${t.pos.y} },`,
    `      questId: "${escapeTSString(t.questId)}",`,
    `    },`,
  ].join('\n'));
  return `cuttableTrees: [\n${lines.join('\n')}\n  ],`;
}

function exportBouldersTS(boulders: { pos: { x: number; y: number }; id: string }[]): string {
  if (boulders.length === 0) return 'boulders: [],';
  const lines = boulders.map((b) => [
    `    {`,
    `      pos: { x: ${b.pos.x}, y: ${b.pos.y} },`,
    `      id: "${escapeTSString(b.id)}",`,
    `    },`,
  ].join('\n'));
  return `boulders: [\n${lines.join('\n')}\n  ],`;
}

function exportBerryTreesTS(trees: { pos: { x: number; y: number }; itemKey: string }[]): string {
  if (trees.length === 0) return 'berryTrees: [],';
  const lines = trees.map((t) => [
    `    {`,
    `      pos: { x: ${t.pos.x}, y: ${t.pos.y} },`,
    `      item: ItemType.${t.itemKey},`,
    `    },`,
  ].join('\n'));
  return `berryTrees: [\n${lines.join('\n')}\n  ],`;
}

const STATIC_POKEMON_SPRITES = [
  'none','bird-a','bird-b','bug-a','bug-b','cute-a','cute-b',
  'dog-a','dog-b','dragon-a','dragon-b','fish-a','fish-b',
  'fossil-a','fossil-b','grass-a','grass-b','monster-a','monster-b',
  'ball-0','ball-a','ball-b',
];

function exportStaticPokemonTS(staticPokemon: StaticPokemonEntry[]): string {
  if (staticPokemon.length === 0) return 'staticPokemon: [],';
  const lines = staticPokemon.map((sp) => {
    const introLine = sp.intro && sp.intro.length > 0
      ? `      intro: [${sp.intro.map(l => `"${escapeTSString(l)}"`).join(', ')}],\n`
      : '';
    return [
      `    {`,
      `      pokemonId: ${sp.pokemonId},`,
      `      level: ${sp.level},`,
      `      sprite: "${sp.sprite}",`,
      `      pos: { x: ${sp.pos.x}, y: ${sp.pos.y} },`,
      `      questId: "${escapeTSString(sp.questId)}",`,
      ...(introLine ? [introLine.trimEnd()] : []),
      `    },`,
    ].join('\n');
  });
  return `staticPokemon: [\n${lines.join('\n')}\n  ],`;
}

function exportSpotTS(field: string, pos: { x: number; y: number } | null | undefined): string {
  if (!pos) return `${field}: undefined,`;
  return `${field}: { x: ${pos.x}, y: ${pos.y} },`;
}

function exportTextRewardsTS(textRewards: Record<string, Record<string, TextRewardEntry>>): string {
  const rows = Object.keys(textRewards)
    .map((k) => parseInt(k, 10))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  if (rows.length === 0) return '';
  const rowLines = rows.map((r) => {
    const cols = Object.keys(textRewards[String(r)] ?? {})
      .map((k) => parseInt(k, 10))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b);
    const colLines = cols.map((c) => {
      const rw = textRewards[String(r)][String(c)];
      const lines: string[] = [`      ${c}: {`, `        type: "${rw.type}",`];
      if (rw.type === 'pokemon') {
        if (rw.pokemonId !== undefined) lines.push(`        pokemonId: ${rw.pokemonId},`);
        if (rw.level !== undefined) lines.push(`        level: ${rw.level},`);
      } else {
        if (rw.itemKey) lines.push(`        itemKey: ItemType.${rw.itemKey},`);
        if (rw.amount !== undefined && rw.amount !== 1) lines.push(`        amount: ${rw.amount},`);
      }
      lines.push(`        questId: "${escapeTSString(rw.questId)}",`);
      lines.push(`      },`);
      return lines.join('\n');
    });
    return `    ${r}: {\n${colLines.join('\n')}\n    },`;
  });
  return `textRewards: {\n${rowLines.join('\n')}\n  },`;
}


// ── Portales: flatten/nest entre el shape de MapType y un array plano editable ──

function flattenPortals(m: MapEntry): PortalEntry[] {
  const out: PortalEntry[] = [];
  // maps: Record<row, Record<col, MapId>>
  if (m.maps) {
    for (const [r, cols] of Object.entries(m.maps)) {
      for (const [c, dest] of Object.entries(cols ?? {})) {
        out.push({
          kind: 'door',
          pos: { x: parseInt(c, 10), y: parseInt(r, 10) },
          destMap: String(dest),
        });
      }
    }
  }
  // teleports: Record<row, Record<col, { map, pos }>>
  if (m.teleports) {
    for (const [r, cols] of Object.entries(m.teleports)) {
      for (const [c, dest] of Object.entries(cols ?? {})) {
        out.push({
          kind: 'teleport',
          pos: { x: parseInt(c, 10), y: parseInt(r, 10) },
          destMap: dest.map,
          destPos: dest.pos,
        });
      }
    }
  }
  // exits: Record<row, number[]>
  if (m.exits) {
    for (const [r, cols] of Object.entries(m.exits)) {
      for (const c of cols) {
        out.push({ kind: 'exit', pos: { x: c, y: parseInt(r, 10) } });
      }
    }
  }
  return out;
}

function nestPortals(portals: PortalEntry[]): {
  maps: Record<string, Record<string, string>>;
  teleports: Record<string, Record<string, { map: string; pos: { x: number; y: number } }>>;
  exits: Record<string, number[]>;
} {
  const maps: Record<string, Record<string, string>> = {};
  const teleports: Record<string, Record<string, { map: string; pos: { x: number; y: number } }>> = {};
  const exits: Record<string, number[]> = {};
  for (const p of portals) {
    const r = String(p.pos.y);
    const c = String(p.pos.x);
    if (p.kind === 'door' && p.destMap) {
      (maps[r] ??= {})[c] = p.destMap;
    } else if (p.kind === 'teleport' && p.destMap && p.destPos) {
      (teleports[r] ??= {})[c] = { map: p.destMap, pos: p.destPos };
    } else if (p.kind === 'exit') {
      (exits[r] ??= []).push(p.pos.x);
    }
  }
  for (const r of Object.keys(exits)) exits[r].sort((a, b) => a - b);
  return { maps, teleports, exits };
}

function exportPortalsTS(portals: PortalEntry[], exitReturnMap: string | null, exitReturnPos: { x: number; y: number } | null): string {
  const { maps, teleports, exits } = nestPortals(portals);

  const fmtRowColMap = (
    obj: Record<string, Record<string, unknown>>,
    valueFmt: (v: unknown) => string,
    key: string,
  ): string => {
    const rows = Object.keys(obj).map((k) => parseInt(k, 10)).filter((n) => !Number.isNaN(n)).sort((a, b) => a - b);
    if (rows.length === 0) return `${key}: {},`;
    const rowLines = rows.map((r) => {
      const cols = Object.keys(obj[String(r)]).map((k) => parseInt(k, 10)).filter((n) => !Number.isNaN(n)).sort((a, b) => a - b);
      const colLines = cols.map((c) => `      ${c}: ${valueFmt(obj[String(r)][String(c)])},`);
      return `    ${r}: {\n${colLines.join('\n')}\n    },`;
    });
    return `${key}: {\n${rowLines.join('\n')}\n  },`;
  };

  const mapsTS = fmtRowColMap(
    maps as Record<string, Record<string, unknown>>,
    (v) => `MapId.${pascalCaseFromMapId(String(v))}`,
    'maps',
  );
  const teleportsTS = fmtRowColMap(
    teleports as unknown as Record<string, Record<string, unknown>>,
    (v) => {
      const t = v as { map: string; pos: { x: number; y: number } };
      return `{ map: MapId.${pascalCaseFromMapId(t.map)}, pos: { x: ${t.pos.x}, y: ${t.pos.y} } }`;
    },
    'teleports',
  );
  const exitRows = Object.keys(exits).map((k) => parseInt(k, 10)).filter((n) => !Number.isNaN(n)).sort((a, b) => a - b);
  const exitsTS = exitRows.length === 0
    ? 'exits: {},'
    : `exits: {\n${exitRows.map((r) => `    ${r}: [${exits[String(r)].join(', ')}],`).join('\n')}\n  },`;

  const erm = exitReturnMap
    ? `exitReturnMap: MapId.${pascalCaseFromMapId(exitReturnMap)},`
    : `exitReturnMap: undefined,`;
  const erp = exitReturnPos
    ? `exitReturnPos: { x: ${exitReturnPos.x}, y: ${exitReturnPos.y} },`
    : `exitReturnPos: undefined,`;

  return [mapsTS, teleportsTS, exitsTS, erm, erp].join('\n');
}

function isRowColMapEmpty(data: Record<string, number[]>) {
  return Object.values(data).every((cols) => cols.length === 0);
}

function isNestedMapEmpty(data: Record<string, Record<string, unknown>>) {
  return Object.values(data).every((cols) => Object.keys(cols).length === 0);
}

function directionToEnum(direction: DirectionName): string {
  return `Direction.${direction.charAt(0).toUpperCase() + direction.slice(1)}`;
}

function exportStoreItemsTS(storeItems: string[]): string {
  if (storeItems.length === 0) return '';
  return `storeItems: [\n${storeItems.map((item) => `    ItemType.${item},`).join('\n')}\n  ],`;
}

function exportSpinnersTS(spinners: Record<string, Record<string, DirectionName>>): string {
  const rows = Object.keys(spinners)
    .map((k) => parseInt(k, 10))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  if (rows.length === 0) return 'spinners: {},';
  const rowLines = rows.map((r) => {
    const cols = Object.keys(spinners[String(r)] ?? {})
      .map((k) => parseInt(k, 10))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b);
    const colLines = cols.map((c) => `      ${c}: ${directionToEnum(spinners[String(r)][String(c)])},`);
    return `    ${r}: {\n${colLines.join('\n')}\n    },`;
  });
  return `spinners: {\n${rowLines.join('\n')}\n  },`;
}

function exportEncountersBlockTS(encounters: EncountersOverride): string {
  const empty = '{ rate: 0, pokemon: [] }';
  const tableTS = (t?: EncounterTable) => {
    if (!t) return empty;
    const pokemon = t.pokemon
      .map((p) => {
        const tod =
          p.timesOfDay && p.timesOfDay.length
            ? `, timesOfDay: [${p.timesOfDay.map((s) => `"${s}"`).join(', ')}]`
            : '';
        return `      { id: ${p.id}, chance: ${p.chance}, conditionValues: [], minLevel: ${p.minLevel}, maxLevel: ${p.maxLevel}${tod} }`;
      })
      .join(',\n');
    return `{\n    rate: ${t.rate},\n    pokemon: [\n${pokemon}\n    ],\n  }`;
  };
  return (
    `encounters: {\n` +
    `  walk: ${tableTS(encounters.walk)},\n` +
    `  surf: ${empty},\n` +
    `  oldRod: ${tableTS(encounters.oldRod)},\n` +
    `  goodRod: ${tableTS(encounters.goodRod)},\n` +
    `  superRod: ${tableTS(encounters.superRod)},\n` +
    `  rockSmash: ${empty}, headbutt: ${empty}, darkGrass: ${empty},\n` +
    `  grassSpots: ${empty}, caveSpots: ${empty}, bridgeSpots: ${empty},\n` +
    `  superRodSpots: ${empty}, surfSpots: ${tableTS(encounters.surfSpots)},\n` +
    `  yellowFlowers: ${empty}, purpleFlowers: ${empty}, redFlowers: ${empty},\n` +
    `  roughTerrain: ${empty}, gift: ${empty}, giftEgg: ${empty}, onlyOne: ${empty},\n` +
    `},`
  );
}

function hasEncounterTables(encounters: EncountersOverride): boolean {
  return Object.values(encounters).some((table) => {
    if (!table) return false;
    return table.rate !== 0 || table.pokemon.length > 0;
  });
}

function indentTS(block: string, spaces = 2): string {
  const pad = ' '.repeat(spaces);
  return block
    .split('\n')
    .map((line) => (line.length ? `${pad}${line}` : line))
    .join('\n');
}

function exportOptionalPosLine(field: string, pos: { x: number; y: number } | null | undefined): string | null {
  if (!pos) return null;
  return `${field}: { x: ${pos.x}, y: ${pos.y} },`;
}

function exportFullMapTypeTS({
  currentMap,
  start,
  cave,
  dark,
  allowBicycle,
  music,
  trainers,
  walls,
  fences,
  grass,
  water,
  encounters,
  texts,
  textRewards,
  items,
  gifts,
  staticPokemon,
  cuttableTrees,
  berryTrees,
  boulders,
  pokemonCenter,
  pc,
  store,
  storeItems,
  recoverLocation,
  onlineBattleNpc,
  portals,
  exitReturnMap,
  exitReturnPos,
  spinners,
  stoppers,
  minimapPos,
}: {
  currentMap: MapEntry;
  start: { x: number; y: number } | null;
  cave: boolean;
  dark: boolean;
  allowBicycle: boolean;
  music: string | null;
  trainers: Trainer[];
  walls: Record<string, number[]>;
  fences: Record<string, number[]>;
  grass: Record<string, number[]>;
  water: Record<string, number[]>;
  encounters: EncountersOverride;
  texts: Record<string, Record<string, string[]>>;
  textRewards: Record<string, Record<string, TextRewardEntry>>;
  items: ItemEntry[];
  gifts: GiftEntry[];
  staticPokemon: StaticPokemonEntry[];
  cuttableTrees: { pos: { x: number; y: number }; questId: string }[];
  berryTrees: { pos: { x: number; y: number }; itemKey: string }[];
  boulders: { pos: { x: number; y: number }; id: string }[];
  pokemonCenter: { x: number; y: number } | null;
  pc: { x: number; y: number } | null;
  store: { x: number; y: number } | null;
  storeItems: string[];
  recoverLocation: { x: number; y: number } | null;
  onlineBattleNpc: { x: number; y: number } | null;
  portals: PortalEntry[];
  exitReturnMap: string | null;
  exitReturnPos: { x: number; y: number } | null;
  spinners: Record<string, Record<string, DirectionName>>;
  stoppers: Record<string, number[]>;
  minimapPos: { x: number; y: number } | null;
}): string {
  const { maps, teleports, exits } = nestPortals(portals);
  const lines: string[] = [
    `name: "${escapeTSString(currentMap.name)}",`,
  ];
  if (allowBicycle) lines.push('allowBicycle: true,');
  lines.push('image,');
  if (music?.trim()) lines.push(`music: ${music.trim()},`);
  if (cave) lines.push('cave: true,');
  if (dark) lines.push('dark: true,');
  lines.push(`height: ${currentMap.height},`);
  lines.push(`width: ${currentMap.width},`);
  const safeStart = start ?? currentMap.start ?? { x: 0, y: 0 };
  lines.push(`start: { x: ${safeStart.x}, y: ${safeStart.y} },`);
  lines.push(exportWallsTS(walls));
  lines.push(exportRowColMapTS(fences, 'fences'));
  lines.push(exportRowColMapTS(grass, 'grass'));
  if (!isRowColMapEmpty(water)) lines.push(exportRowColMapTS(water, 'water'));
  lines.push(exportTextsTS(texts));
  const rewardsTS = exportTextRewardsTS(textRewards);
  if (rewardsTS) lines.push(rewardsTS);

  lines.push(exportRowColMapTS(exits, 'exits').replace(/^exits/, 'exits'));
  const mapsTS = (() => {
    if (isNestedMapEmpty(maps as Record<string, Record<string, unknown>>)) return 'maps: {},';
    const rows = Object.keys(maps).map((k) => parseInt(k, 10)).filter((n) => !Number.isNaN(n)).sort((a, b) => a - b);
    return `maps: {\n${rows.map((r) => {
      const cols = Object.keys(maps[String(r)]).map((k) => parseInt(k, 10)).filter((n) => !Number.isNaN(n)).sort((a, b) => a - b);
      return `    ${r}: {\n${cols.map((c) => `      ${c}: MapId.${pascalCaseFromMapId(maps[String(r)][String(c)])},`).join('\n')}\n    },`;
    }).join('\n')}\n  },`;
  })();
  const teleportsTS = (() => {
    if (isNestedMapEmpty(teleports as unknown as Record<string, Record<string, unknown>>)) return '';
    const rows = Object.keys(teleports).map((k) => parseInt(k, 10)).filter((n) => !Number.isNaN(n)).sort((a, b) => a - b);
    return `teleports: {\n${rows.map((r) => {
      const cols = Object.keys(teleports[String(r)]).map((k) => parseInt(k, 10)).filter((n) => !Number.isNaN(n)).sort((a, b) => a - b);
      return `    ${r}: {\n${cols.map((c) => {
        const t = teleports[String(r)][String(c)];
        return `      ${c}: { map: MapId.${pascalCaseFromMapId(t.map)}, pos: { x: ${t.pos.x}, y: ${t.pos.y} } },`;
      }).join('\n')}\n    },`;
    }).join('\n')}\n  },`;
  })();
  lines.splice(lines.length - 1, 0, mapsTS);
  if (teleportsTS) lines.splice(lines.length - 1, 0, teleportsTS);
  if (exitReturnMap) lines.push(`exitReturnMap: MapId.${pascalCaseFromMapId(exitReturnMap)},`);
  if (exitReturnPos) lines.push(`exitReturnPos: { x: ${exitReturnPos.x}, y: ${exitReturnPos.y} },`);

  for (const maybeLine of [
    exportOptionalPosLine('pokemonCenter', pokemonCenter),
    exportOptionalPosLine('pc', pc),
    exportOptionalPosLine('store', store),
    exportOptionalPosLine('recoverLocation', recoverLocation),
    exportOptionalPosLine('onlineBattleNpc', onlineBattleNpc),
  ]) {
    if (maybeLine) lines.push(maybeLine);
  }
  const storeItemsTS = exportStoreItemsTS(storeItems);
  if (storeItemsTS) lines.push(storeItemsTS);
  if (!isNestedMapEmpty(spinners as unknown as Record<string, Record<string, unknown>>)) lines.push(exportSpinnersTS(spinners));
  if (!isRowColMapEmpty(stoppers)) lines.push(exportRowColMapTS(stoppers, 'stoppers'));
  if (hasEncounterTables(encounters)) lines.push(exportEncountersBlockTS(encounters));
  if (items.length > 0) lines.push(exportItemsTS(items));
  if (gifts.length > 0) lines.push(exportGiftsTS(gifts));
  if (staticPokemon.length > 0) lines.push(exportStaticPokemonTS(staticPokemon));
  if (cuttableTrees.length > 0) lines.push(exportCuttableTreesTS(cuttableTrees));
  if (berryTrees.length > 0) lines.push(exportBerryTreesTS(berryTrees));
  if (boulders.length > 0) lines.push(exportBouldersTS(boulders));
  if (minimapPos) lines.push(`minimapPos: { x: ${minimapPos.x}, y: ${minimapPos.y} },`);
  lines.push(exportTrainersArrayTS(trainers));

  return `{\n${lines.map((line) => indentTS(line)).join('\n')}\n}`;
}

// Heurística: convierte "pewter-city-gym" → "PewterCityGym" para el enum MapId
function pascalCaseFromMapId(id: string): string {
  return id
    .split(/[-_]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

// ── Constantes UI ─────────────────────────────────────────────────────────

const ZOOM_LEVELS = [16, 24, 32, 48];
const MINIMAP_WIDTH = 237;
const MINIMAP_HEIGHT = 213;
const MINIMAP_DISPLAY_SCALE = 2;

// ── Estilos compartidos ───────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: '#0f0f1a',
  border: '1px solid #3a3a5a',
  borderRadius: 4,
  color: '#e0e0ff',
  padding: '4px 8px',
  fontSize: 13,
  fontFamily: 'monospace',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const navBtnStyle: React.CSSProperties = {
  padding: 0,
  minWidth: 24,
  height: '100%',
  background: '#1a1a3a',
  border: '1px solid #3a3a5a',
  borderRadius: 4,
  color: '#c8c8ff',
  cursor: 'pointer',
  fontSize: 11,
  lineHeight: 1,
};

const labelStyle: React.CSSProperties = {
  color: '#888',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 1,
  display: 'block',
  marginBottom: 4,
};

const sectionStyle: React.CSSProperties = {
  borderTop: '1px solid #2a2a4a',
  paddingTop: 12,
  marginTop: 12,
};

// ── Componente principal ───────────────────────────────────────────────────

export default function MapEditor() {
  const [mapData, setMapData] = useState<MapData>({});
  const [selectedMapId, setSelectedMapId] = useState<string>('');
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [walls, setWalls] = useState<Record<string, number[]>>({});
  const [fences, setFences] = useState<Record<string, number[]>>({});
  const [grass, setGrass] = useState<Record<string, number[]>>({});
  const [water, setWater] = useState<Record<string, number[]>>({});
  const [encounters, setEncounters] = useState<EncountersOverride>({});
  const [texts, setTexts] = useState<Record<string, Record<string, string[]>>>({});
  const [textRewards, setTextRewards] = useState<Record<string, Record<string, TextRewardEntry>>>({});
  const [items, setItems] = useState<ItemEntry[]>([]);
  const [gifts, setGifts] = useState<GiftEntry[]>([]);
  const [staticPokemon, setStaticPokemon] = useState<StaticPokemonEntry[]>([]);
  interface CuttableTreeEntry { pos: { x: number; y: number }; questId: string; }
  const [cuttableTrees, setCuttableTrees] = useState<CuttableTreeEntry[]>([]);
  interface BoulderEntry { pos: { x: number; y: number }; id: string; }
  const [boulders, setBoulders] = useState<BoulderEntry[]>([]);
  interface BerryTreeEntry { pos: { x: number; y: number }; itemKey: string; }
  const [berryTrees, setBerryTrees] = useState<BerryTreeEntry[]>([]);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [pokemonCenter, setPokemonCenter] = useState<{ x: number; y: number } | null>(null);
  const [pcPos, setPcPos] = useState<{ x: number; y: number } | null>(null);
  const [storePos, setStorePos] = useState<{ x: number; y: number } | null>(null);
  const [storeItems, setStoreItems] = useState<string[]>([]);
  const [recoverLocation, setRecoverLocation] = useState<{ x: number; y: number } | null>(null);
  const [onlineBattleNpc, setOnlineBattleNpc] = useState<{ x: number; y: number } | null>(null);
  const [activeSpot, setActiveSpot] = useState<SpotKey>('start');
  const [spinners, setSpinners] = useState<Record<string, Record<string, DirectionName>>>({});
  const [stoppers, setStoppers] = useState<Record<string, number[]>>({});
  const [activeMechanic, setActiveMechanic] = useState<MechanicTool>('spinner-up');
  const [cave, setCave] = useState(false);
  const [dark, setDark] = useState(false);
  const [allowBicycle, setAllowBicycle] = useState(false);
  const [flyable, setFlyable] = useState(false);
  const [flySpot, setFlySpot] = useState<{ x: number; y: number } | null>(null);
  const [musicField, setMusicField] = useState<string | null>(null);
  // Portales
  const [portals, setPortals] = useState<PortalEntry[]>([]);
  const [exitReturnMap, setExitReturnMap] = useState<string | null>(null);
  const [exitReturnPos, setExitReturnPos] = useState<{ x: number; y: number } | null>(null);
  const [activePortalKind, setActivePortalKind] = useState<PortalKind>('door');
  const [selectedPortalIdx, setSelectedPortalIdx] = useState<number | null>(null);
  const [itemTypeKeys, setItemTypeKeys] = useState<string[]>([]);
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [editMode, setEditMode] = useState<EditMode>('npc');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [zoom, setZoom] = useState(32);
  const [showGrid, setShowGrid] = useState(true);
  const [showWalls, setShowWalls] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [error, setError] = useState('');
  const [showMinimap, setShowMinimap] = useState(false);
  const [minimapMode, setMinimapMode] = useState<'edit' | 'navigate'>('navigate');
  const [minimapPos, setMinimapPos] = useState<{ x: number; y: number } | null>(null);

  const dragging = useRef<{ idx: number; startX: number; startY: number } | null>(null);
  // Drag genérico para texts/items/gifts/portals
  const entityDrag = useRef<
    | { kind: 'text'; row: number; col: number; moved: boolean }
    | { kind: 'item' | 'gift' | 'portal'; idx: number; moved: boolean }
    | null
  >(null);
  const suppressNextClick = useRef(false);
  // Pintado de walls por arrastre. mode = el efecto a aplicar a los tiles
  // por los que se pase (toggle inicial determina add/remove).
  const wallPaint = useRef<{ active: boolean; mode: 'add' | 'remove'; visited: Set<string> } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const currentMap = mapData[selectedMapId];

  // ── Cargar datos ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/admin/map-data')
      .then((r) => r.json())
      .then((data: MapData) => {
        setMapData(data);
        const first = Object.keys(data)[0];
        if (first) {
          setSelectedMapId(first);
          loadFromEntry(data[first]);
        }
      })
      .catch(() => setError('No se pudo cargar map-data.json. Ejecuta: npm run editor:setup'));
    fetch('/editor/item-types.json')
      .then((r) => r.json())
      .then((arr: string[]) => setItemTypeKeys(arr))
      .catch(() => {});
    fetch('/api/admin/music-tracks')
      .then((r) => r.json())
      .then((arr: MusicTrack[]) => setMusicTracks(arr))
      .catch(() => {});
  }, []);

  function loadFromEntry(m: MapEntry) {
    setTrainers(m.trainers ?? []);
    setWalls(m.walls ?? {});
    setFences(m.fences ?? {});
    setGrass(m.grass ?? {});
    setWater((m as MapEntry & { water?: Record<string, number[]> }).water ?? {});
    // Encounters: copiar SOLO las 4 tablas que nos interesan (walk + 3 cañas)
    // del JSON base. Así el editor muestra los valores de la API y el usuario
    // puede sobrescribirlos en local.
    const baseEnc = m.encounters ?? null;
    if (baseEnc) {
      const picked: EncountersOverride = {};
      const keys: EncounterTableKey[] = ['walk', 'oldRod', 'goodRod', 'superRod', 'surfSpots'];
      for (const k of keys) {
        const t = (baseEnc as Record<string, unknown>)[k] as EncounterTable | undefined;
        if (t && Array.isArray(t.pokemon)) picked[k] = { rate: t.rate ?? 0, pokemon: t.pokemon };
      }
      setEncounters(picked);
    } else {
      setEncounters({});
    }
    setTexts(m.texts ?? {});
    setTextRewards((m as MapEntry & { textRewards?: Record<string, Record<string, TextRewardEntry>> }).textRewards ?? {});
    setItems(m.items ?? []);
    setGifts(m.gifts ?? []);
    setStaticPokemon((m as MapEntry & { staticPokemon?: StaticPokemonEntry[] }).staticPokemon ?? []);
    setCuttableTrees((m as MapEntry & { cuttableTrees?: { pos: { x: number; y: number }; questId: string }[] }).cuttableTrees ?? []);
    setBoulders((m as MapEntry & { boulders?: { pos: { x: number; y: number }; id: string }[] }).boulders ?? []);
    setBerryTrees((m as MapEntry & { berryTrees?: { pos: { x: number; y: number }; itemKey: string }[] }).berryTrees ?? []);
    setStartPos(m.start ?? null);
    setPokemonCenter(m.pokemonCenter ?? null);
    setPcPos(m.pc ?? null);
    setStorePos(m.store ?? null);
    setStoreItems(m.storeItems ?? []);
    setRecoverLocation(m.recoverLocation ?? null);
    setOnlineBattleNpc(m.onlineBattleNpc ?? null);
    setSpinners(m.spinners ?? {});
    setStoppers(m.stoppers ?? {});
    setCave(!!m.cave);
    setDark(!!m.dark);
    setAllowBicycle(!!m.allowBicycle);
    setFlyable(!!m.flyable);
    setFlySpot(m.flySpot ?? null);
    setMusicField(m.music ?? null);
    setPortals(flattenPortals(m));
    setExitReturnMap(m.exitReturnMap ?? null);
    setExitReturnPos(m.exitReturnPos ?? null);
    setMinimapPos(m.minimapPos ?? null);
    setSelectedPortalIdx(null);
  }

  // ── Cambiar mapa ──────────────────────────────────────────────────────
  function selectMap(id: string) {
    if (dirty && id !== selectedMapId) {
      const ok = window.confirm('Hay cambios sin guardar en el mapa actual. ¿Cambiar de mapa y descartarlos en pantalla?');
      if (!ok) return;
    }
    setSelectedMapId(id);
    if (mapData[id]) loadFromEntry(mapData[id]);
    setSelectedIdx(null);
    setDirty(false);
  }

  // ── Guardar ───────────────────────────────────────────────────────────
  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/map-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapId: selectedMapId,
          trainers,
          walls,
          overrides: {
            start: startPos,
            cave,
            dark,
            allowBicycle,
            flyable,
            flySpot,
            music: musicField,
            fences,
            grass,
            water,
            encounters,
            texts,
            textRewards,
            items: items.map((it) => ({
              itemKey: it.itemKey,
              pos: it.pos,
              ...(it.hidden ? { hidden: true } : {}),
            })),
            gifts,
            staticPokemon,
            cuttableTrees,
            berryTrees,
            boulders,
            pokemonCenter,
            pc: pcPos,
            store: storePos,
            storeItems,
            recoverLocation,
            onlineBattleNpc,
            spinners,
            stoppers,
            // Portales (todo en uno: persistimos el shape MapType nativo)
            ...(() => {
              const { maps, teleports, exits } = nestPortals(portals);
              return {
                maps,
                teleports,
                exits,
                exitReturnMap,
                exitReturnPos,
              };
            })(),
            minimapPos,
          },
        }),
      });
      if (!res.ok) {
        let body: { error?: string; hint?: string } = {};
        try {
          body = await res.json();
        } catch {
          /* respuesta no JSON */
        }
        const msg = body.error ?? `HTTP ${res.status}`;
        const hint = body.hint ? `\n\n${body.hint}` : '';
        setError(`Error al guardar: ${msg}${hint}`);
        alert(`Error al guardar: ${msg}${hint}`);
        return;
      }
      const json = (await res.json().catch(() => ({}))) as { warning?: string };
      if (json.warning) {
        alert(`⚠️ ${json.warning}`);
      }
      setError('');
      setDirty(false);
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 1500);
      // Actualizar cache local
      setMapData((d) => {
        const { maps, teleports, exits } = nestPortals(portals);
        return {
          ...d,
          [selectedMapId]: {
            ...d[selectedMapId],
            trainers,
            walls,
            fences,
            grass,
            water,
            encounters,
            texts,
            textRewards,
            items,
            gifts,
            staticPokemon,
            start: startPos,
            cave,
            dark,
            allowBicycle,
            flyable,
            flySpot,
            music: musicField,
            pokemonCenter,
            pc: pcPos,
            store: storePos,
            storeItems,
            recoverLocation,
            onlineBattleNpc,
            spinners,
            stoppers,
            maps,
            teleports,
            exits,
            exitReturnMap,
            exitReturnPos,
            minimapPos,
          },
        };
      });
    } catch (e) {
      setError(`Error de red al guardar: ${String(e)}`);
      alert(`Error de red al guardar: ${String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  // ── Exportar TS (trainers) ────────────────────────────────────────────
  function doExport() {
    const ts = exportTS(trainers, selectedMapId);
    navigator.clipboard.writeText(ts).then(() => alert('¡Trainers copiados!'));
  }

  // ── Exportar TS (walls) ───────────────────────────────────────────────
  function doExportWalls() {
    const ts = exportWallsTS(walls);
    navigator.clipboard.writeText(ts).then(() => alert('¡Walls copiadas!'));
  }

  function doExportFences() {
    const ts = exportRowColMapTS(fences, 'fences');
    navigator.clipboard.writeText(ts).then(() => alert('¡Fences copiadas!'));
  }

  function doExportGrass() {
    const ts = exportRowColMapTS(grass, 'grass');
    navigator.clipboard.writeText(ts).then(() => alert('¡Grass copiadas!'));
  }

  function doExportWater() {
    const ts = exportRowColMapTS(water, 'water');
    navigator.clipboard.writeText(ts).then(() => alert('¡Water copiado! Pégalo en el .ts del mapa como campo `water: { ... }`'));
  }

  function doExportEncounters() {
    const ts = exportEncountersBlockTS(encounters);
    navigator.clipboard.writeText(ts).then(() =>
      alert(
        '¡Encounters copiados!\n\nPega el bloque en el .ts del mapa, reemplazando la línea `encounters: getEncounterData(...)`.'
      )
    );
  }

  function doExportTexts() {
    const ts = exportTextsTS(texts);
    const rewards = exportTextRewardsTS(textRewards);
    const combined = rewards ? `${ts}\n  ${rewards}` : ts;
    navigator.clipboard.writeText(combined).then(() => alert('¡Texts + rewards copiados!'));
  }

  function doExportItems() {
    const ts = exportItemsTS(items);
    navigator.clipboard.writeText(ts).then(() => alert('¡Items copiados!'));
  }

  function doExportGifts() {
    const ts = exportGiftsTS(gifts);
    navigator.clipboard.writeText(ts).then(() => alert('¡Gifts copiados!'));
  }

  function doExportStaticPokemon() {
    const ts = exportStaticPokemonTS(staticPokemon);
    navigator.clipboard.writeText(ts).then(() => alert('¡StaticPokemon copiado!'));
  }

  function doExportBoulders() {
    const ts = exportBouldersTS(boulders);
    navigator.clipboard.writeText(ts).then(() => alert('¡Boulders copiados! Pégalo en el .ts del mapa como campo `boulders: [ ... ]`'));
  }

  function doExportBerryTrees() {
    const ts = exportBerryTreesTS(berryTrees);
    navigator.clipboard.writeText(ts).then(() => alert('¡Árboles de bayas copiados! Pégalo en el .ts del mapa como campo `berryTrees: [ ... ]`'));
  }

  function doExportSpots() {
    const parts = [
      exportSpotTS('start', startPos),
      exportSpotTS('pokemonCenter', pokemonCenter),
      exportSpotTS('pc', pcPos),
      exportSpotTS('store', storePos),
      exportStoreItemsTS(storeItems),
      exportSpotTS('recoverLocation', recoverLocation),
      exportSpotTS('onlineBattleNpc', onlineBattleNpc),
    ];
    navigator.clipboard.writeText(parts.filter(Boolean).join('\n')).then(() => alert('¡Spots copiados!'));
  }

  function doExportPortals() {
    const ts = exportPortalsTS(portals, exitReturnMap, exitReturnPos);
    navigator.clipboard.writeText(ts).then(() => alert('¡Portals copiados!'));
  }

  function doExportMechanics() {
    const ts = [exportSpinnersTS(spinners), exportRowColMapTS(stoppers, 'stoppers')].join('\n');
    navigator.clipboard.writeText(ts).then(() => alert('¡Mechanics copiados!'));
  }

  function doExportMapType() {
    if (!currentMap) return;
    const ts = exportFullMapTypeTS({
      currentMap,
      start: startPos,
      cave,
      dark,
      allowBicycle,
      music: musicField,
      trainers,
      walls,
      fences,
      grass,
      water,
      encounters,
      texts,
      textRewards,
      items,
      gifts,
      staticPokemon,
      cuttableTrees,
      berryTrees,
      boulders,
      pokemonCenter,
      pc: pcPos,
      store: storePos,
      storeItems,
      recoverLocation,
      onlineBattleNpc,
      portals,
      exitReturnMap,
      exitReturnPos,
      spinners,
      stoppers,
      minimapPos,
    });
    navigator.clipboard.writeText(ts).then(() => alert('¡Objeto MapType completo copiado!'));
  }

  // ── Importar .ts ──────────────────────────────────────────────────────
  // Lee un archivo .ts (de game-src/src/maps/*.ts) y reemplaza por completo
  // el estado local del mapa (trainers, walls, fences, grass, texts, items,
  // gifts y spots). Marca dirty para que el usuario pueda guardar.
  const importFileRef = useRef<HTMLInputElement>(null);

  function doImportTs() {
    importFileRef.current?.click();
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permitir reimportar mismo archivo
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseMapTS(text);
      const ok = window.confirm(
        `Importar "${file.name}"?\n\n` +
          `· ${parsed.trainers.length} NPCs\n` +
          `· ${Object.values(parsed.walls).reduce((a, b) => a + b.length, 0)} walls\n` +
          `· ${Object.values(parsed.fences).reduce((a, b) => a + b.length, 0)} fences\n` +
          `· ${Object.values(parsed.grass).reduce((a, b) => a + b.length, 0)} grass\n` +
          `· ${Object.keys(parsed.texts).length} filas de texto\n` +
          `· ${parsed.items.length} items\n` +
          `· ${parsed.gifts.length} gifts\n` +
          `· spots: ${
            ['pokemonCenter', 'pc', 'store', 'recoverLocation']
              .filter((k) => parsed[k as 'pokemonCenter' | 'pc' | 'store' | 'recoverLocation'])
              .join(', ') || '(ninguno)'
          }\n\n` +
          `Esto SUSTITUYE el contenido actual del mapa "${selectedMapId}".`,
      );
      if (!ok) return;
      setTrainers(parsed.trainers);
      setWalls(parsed.walls);
      setFences(parsed.fences);
      setGrass(parsed.grass);
      setWater(parsed.water);
      setTexts(parsed.texts);
      setTextRewards(parsed.textRewards ?? {});
      setItems(parsed.items);
      setGifts(parsed.gifts);
      setStaticPokemon((parsed as typeof parsed & { staticPokemon?: StaticPokemonEntry[] }).staticPokemon ?? []);
      setStartPos(parsed.start);
      setPokemonCenter(parsed.pokemonCenter);
      setPcPos(parsed.pc);
      setStorePos(parsed.store);
      setStoreItems(parsed.storeItems ?? []);
      setRecoverLocation(parsed.recoverLocation);
      setOnlineBattleNpc(parsed.onlineBattleNpc);
      setSpinners(parsed.spinners ?? {});
      setStoppers(parsed.stoppers ?? {});
      setCave(!!parsed.cave);
      setDark(!!parsed.dark);
      setAllowBicycle(!!parsed.allowBicycle);
      setFlyable(false);
      setFlySpot(null);
      setMusicField(parsed.music ?? null);
      setPortals(flattenPortals({
        ...currentMap!,
        maps: parsed.maps,
        teleports: parsed.teleports,
        exits: parsed.exits,
      } as MapEntry));
      setExitReturnMap(parsed.exitReturnMap);
      setExitReturnPos(parsed.exitReturnPos);
      setMinimapPos(parsed.minimapPos);
      setSelectedPortalIdx(null);
      setSelectedIdx(null);
      setDirty(true);
    } catch (err) {
      alert(`Error importando .ts: ${String(err)}`);
    }
  }

  // ── Añadir NPC ────────────────────────────────────────────────────────
  function addNpc() {
    const newT: Trainer = {
      npcKey: 'youngster',
      pos: { x: 0, y: 0 },
      facing: 'down',
      money: 0,
      persistent: true,
      isOnline: false,
      hideCondition: null,
      sightRange: null,
      intro: [],
      outtro: ['...'],
      pokemon: [{ id: 19, level: 2 }],
    };
    const next = [...trainers, newT];
    setTrainers(next);
    setSelectedIdx(next.length - 1);
    setDirty(true);
  }

  // ── Eliminar NPC ──────────────────────────────────────────────────────
  function deleteNpc(idx: number) {
    const next = trainers.filter((_, i) => i !== idx);
    setTrainers(next);
    setSelectedIdx(null);
    setDirty(true);
  }

  // ── Walls / Fences / Grass (mismo formato Record<row, col[]>) ──────────
  function setMaskAt(
    src: Record<string, number[]>,
    x: number,
    y: number,
    on: boolean,
  ): Record<string, number[]> {
    const key = String(y);
    const row = src[key] ? [...src[key]] : [];
    const idx = row.indexOf(x);
    if (on) {
      if (idx === -1) row.push(x);
    } else {
      if (idx !== -1) row.splice(idx, 1);
    }
    const next = { ...src };
    if (row.length === 0) {
      delete next[key];
    } else {
      row.sort((a, b) => a - b);
      next[key] = row;
    }
    return next;
  }

  function hasMask(src: Record<string, number[]>, x: number, y: number) {
    return (src[String(y)] ?? []).includes(x);
  }

  // Wrappers de compatibilidad — siguen usándose en algún punto.
  function setWallAt(
    src: Record<string, number[]>,
    x: number,
    y: number,
    on: boolean,
  ): Record<string, number[]> {
    return setMaskAt(src, x, y, on);
  }

  function hasWall(src: Record<string, number[]>, x: number, y: number) {
    return hasMask(src, x, y);
  }

  function setSpinnerAt(
    src: Record<string, Record<string, DirectionName>>,
    x: number,
    y: number,
    direction: DirectionName | null,
  ): Record<string, Record<string, DirectionName>> {
    const rowKey = String(y);
    const colKey = String(x);
    const next = { ...src };
    const row = { ...(next[rowKey] ?? {}) };
    if (direction === null) {
      delete row[colKey];
    } else {
      row[colKey] = direction;
    }
    if (Object.keys(row).length === 0) delete next[rowKey];
    else next[rowKey] = row;
    return next;
  }

  // ── Actualizar campo del NPC seleccionado ───────────────────────────────
  function updateSelected(patch: Partial<Trainer>) {
    if (selectedIdx === null) return;
    const next = trainers.map((t, i) => (i === selectedIdx ? { ...t, ...patch } : t));
    setTrainers(next);
    setDirty(true);
  }

  const tileFromClientPoint = useCallback(
    (clientX: number, clientY: number, clamp: boolean): { x: number; y: number } | null => {
      if (!canvasRef.current || !currentMap) return null;
      const rect = canvasRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      const tileWidth = rect.width / currentMap.width;
      const tileHeight = rect.height / currentMap.height;
      let x = Math.floor((clientX - rect.left) / tileWidth);
      let y = Math.floor((clientY - rect.top) / tileHeight);
      if (clamp) {
        x = Math.max(0, Math.min(x, currentMap.width - 1));
        y = Math.max(0, Math.min(y, currentMap.height - 1));
      }
      return { x, y };
    },
    [currentMap],
  );

  // ── Drag & drop NPC ────────────────────────────────────────────────────────
  const onPointerDown = useCallback(
    (e: React.PointerEvent, idx: number) => {
      if (editMode !== 'npc') return;
      e.preventDefault();
      e.stopPropagation();
      setSelectedIdx(idx);
      dragging.current = { idx, startX: e.clientX, startY: e.clientY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [editMode]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const tile = tileFromClientPoint(e.clientX, e.clientY, true);
      if (!tile) return;
      const tileX = tile.x;
      const tileY = tile.y;

      // Drag de entidades (texts/items/gifts/portals)
      if (entityDrag.current) {
        moveEntityToTile(tileX, tileY);
        return;
      }

      // Mask paint en arrastre (walls, fences, grass, water)
      if (
        (editMode === 'walls' || editMode === 'fences' || editMode === 'grass' || editMode === 'water') &&
        wallPaint.current?.active
      ) {
        const paint = wallPaint.current;
        const k = `${tileX},${tileY}`;
        if (!paint.visited.has(k)) {
          paint.visited.add(k);
          const setter =
            editMode === 'walls' ? setWalls
            : editMode === 'fences' ? setFences
            : editMode === 'grass' ? setGrass
            : setWater;
          setter((prev) => setMaskAt(prev, tileX, tileY, paint.mode === 'add'));
          setDirty(true);
        }
        return;
      }

      if (editMode !== 'npc' || !dragging.current) return;
      const { idx } = dragging.current;
      setTrainers((prev) =>
        prev.map((t, i) => (i === idx ? { ...t, pos: { x: tileX, y: tileY } } : t))
      );
      setDirty(true);
    },
    [tileFromClientPoint, editMode]
  );

  const onPointerUp = useCallback(() => {
    if (entityDrag.current?.moved) suppressNextClick.current = true;
    dragging.current = null;
    entityDrag.current = null;
    wallPaint.current = null;
  }, []);

  // Drag handler genérico para entidades (texts/items/gifts/portals)
  const onEntityPointerDown = useCallback(
    (
      e: React.PointerEvent,
      target:
        | { kind: 'text'; row: number; col: number }
        | { kind: 'item' | 'gift' | 'portal'; idx: number },
    ) => {
      e.preventDefault();
      e.stopPropagation();
      entityDrag.current = { ...target, moved: false } as typeof entityDrag.current;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      // Selección inmediata para portales
      if (target.kind === 'portal') setSelectedPortalIdx(target.idx);
    },
    []
  );

  // Movimiento de entidades durante drag (se ejecuta dentro del onPointerMove del canvas)
  function moveEntityToTile(tileX: number, tileY: number) {
    const drag = entityDrag.current;
    if (!drag) return;
    if (drag.kind === 'text') {
      const oldRow = String(drag.row);
      const oldCol = String(drag.col);
      const newRow = String(tileY);
      const newCol = String(tileX);
      if (oldRow === newRow && oldCol === newCol) return;
      setTexts((prev) => {
        const lines = prev[oldRow]?.[oldCol];
        if (!lines) return prev;
        // Si el destino ya tiene texto, no pisar.
        if (prev[newRow]?.[newCol]) return prev;
        const next: typeof prev = { ...prev };
        const oldRowObj = { ...(next[oldRow] ?? {}) };
        delete oldRowObj[oldCol];
        if (Object.keys(oldRowObj).length === 0) delete next[oldRow];
        else next[oldRow] = oldRowObj;
        next[newRow] = { ...(next[newRow] ?? {}), [newCol]: lines };
        return next;
      });
      // Arrastrar también la recompensa si la hay
      setTextRewards((prev) => {
        const reward = prev[oldRow]?.[oldCol];
        if (!reward) return prev;
        if (prev[newRow]?.[newCol]) return prev; // destino ocupado
        const next = { ...prev };
        const oldRowObj = { ...(next[oldRow] ?? {}) };
        delete oldRowObj[oldCol];
        if (Object.keys(oldRowObj).length === 0) delete next[oldRow];
        else next[oldRow] = oldRowObj;
        next[newRow] = { ...(next[newRow] ?? {}), [newCol]: reward };
        return next;
      });
      drag.row = tileY;
      drag.col = tileX;
      drag.moved = true;
      setDirty(true);
      return;
    }
    if (drag.kind === 'item') {
      setItems((prev) => prev.map((it, i) => i === drag.idx ? { ...it, pos: { x: tileX, y: tileY } } : it));
    } else if (drag.kind === 'gift') {
      setGifts((prev) => prev.map((g, i) => i === drag.idx ? { ...g, pos: { x: tileX, y: tileY } } : g));
    } else if (drag.kind === 'portal') {
      setPortals((prev) => prev.map((p, i) => i === drag.idx ? { ...p, pos: { x: tileX, y: tileY } } : p));
    }
    drag.moved = true;
    setDirty(true);
  }

  // ── Click en canvas ────────────────────────────────────────────────────────
  function tileFromEvent(e: React.MouseEvent | React.PointerEvent): { x: number; y: number } | null {
    return tileFromClientPoint(e.clientX, e.clientY, false);
  }

  // En modo walls/fences/grass/water: pointerdown en canvas inicia pintura.
  function onCanvasPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (editMode !== 'walls' && editMode !== 'fences' && editMode !== 'grass' && editMode !== 'water') return;
    const tile = tileFromEvent(e);
    if (!tile) return;
    if (
      tile.x < 0 || tile.y < 0 ||
      tile.x >= (currentMap?.width ?? 0) ||
      tile.y >= (currentMap?.height ?? 0)
    ) return;
    const src =
      editMode === 'walls' ? walls
      : editMode === 'fences' ? fences
      : editMode === 'grass' ? grass
      : water;
    const setter =
      editMode === 'walls' ? setWalls
      : editMode === 'fences' ? setFences
      : editMode === 'grass' ? setGrass
      : setWater;
    const currentlyOn = hasMask(src, tile.x, tile.y);
    const mode: 'add' | 'remove' = currentlyOn ? 'remove' : 'add';
    wallPaint.current = { active: true, mode, visited: new Set([`${tile.x},${tile.y}`]) };
    setter((prev) => setMaskAt(prev, tile.x, tile.y, mode === 'add'));
    setDirty(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      return;
    }
    const tile = tileFromEvent(e);
    if (!tile) return;
    if (editMode === 'npc') {
      const hitIdx = trainers.findIndex((t) => t.pos.x === tile.x && t.pos.y === tile.y);
      setSelectedIdx(hitIdx >= 0 ? hitIdx : null);
      return;
    }
    if (editMode === 'texts') {
      const rowKey = String(tile.y);
      const colKey = String(tile.x);
      const existing = texts[rowKey]?.[colKey] ?? [];
      const initial = existing.join('\n');
      const input = window.prompt(
        `Texto en (${tile.x}, ${tile.y}) — una línea por fila. Vacío = borrar.`,
        initial,
      );
      if (input === null) return;
      // ── Actualizar texto ──
      setTexts((prev) => {
        const nextRow = { ...(prev[rowKey] ?? {}) };
        if (input.trim() === '') {
          delete nextRow[colKey];
          // Si se borra el texto, borrar también la recompensa asociada
          setTextRewards((pr) => {
            const nr = { ...(pr[rowKey] ?? {}) };
            delete nr[colKey];
            const n = { ...pr };
            if (Object.keys(nr).length === 0) delete n[rowKey];
            else n[rowKey] = nr;
            return n;
          });
        } else {
          nextRow[colKey] = input.split('\n').map((s) => s.trim()).filter((s) => s.length > 0);
        }
        const next = { ...prev };
        if (Object.keys(nextRow).length === 0) delete next[rowKey];
        else next[rowKey] = nextRow;
        return next;
      });
      setDirty(true);
      // ── Configurar recompensa (solo si hay texto) ──
      if (input.trim() !== '') {
        const existingReward = textRewards[rowKey]?.[colKey];
        const rewardChoice = window.prompt(
          `Recompensa en (${tile.x}, ${tile.y}):\n` +
          `  "pokemon" → dar un Pokémon\n` +
          `  "item"    → dar un objeto\n` +
          `  "-"       → quitar recompensa\n` +
          `  [Cancelar]→ dejar como está\n` +
          `\nActual: ${existingReward ? `${existingReward.type} (${existingReward.questId})` : 'ninguna'}`,
          existingReward ? existingReward.type : '-',
        );
        if (rewardChoice === null) return; // cancelar → no tocar recompensa
        if (rewardChoice.trim() === '-' || rewardChoice.trim() === '') {
          // Quitar recompensa
          setTextRewards((pr) => {
            const nr = { ...(pr[rowKey] ?? {}) };
            delete nr[colKey];
            const n = { ...pr };
            if (Object.keys(nr).length === 0) delete n[rowKey];
            else n[rowKey] = nr;
            return n;
          });
          setDirty(true);
        } else if (rewardChoice.trim() === 'item') {
          const itemKey = window.prompt('ItemType del objeto (ej. Potion, PokeBall, Tm12):', existingReward?.itemKey ?? 'Potion');
          if (!itemKey) return;
          if (!itemTypeKeys.includes(itemKey.trim())) {
            alert(`ItemType inválido: ${itemKey}. Disponibles: ${itemTypeKeys.slice(0, 12).join(', ')}…`);
            return;
          }
          const amountStr = window.prompt('Cantidad (por defecto 1):', String(existingReward?.amount ?? 1));
          const amount = parseInt(amountStr ?? '1', 10) || 1;
          const defaultQuestId = `text-reward-${selectedMapId}-${tile.x}-${tile.y}`;
          const questId = window.prompt('questId único (dejar para usar automático):', existingReward?.questId ?? defaultQuestId);
          if (!questId) return;
          const newReward: TextRewardEntry = { type: 'item', itemKey: itemKey.trim(), amount, questId: questId.trim() };
          setTextRewards((pr) => {
            const nr = { ...(pr[rowKey] ?? {}), [colKey]: newReward };
            return { ...pr, [rowKey]: nr };
          });
          setDirty(true);
        } else if (rewardChoice.trim() === 'pokemon') {
          const pidStr = window.prompt('ID del Pokémon (1-251):', String(existingReward?.pokemonId ?? 1));
          const pokemonId = parseInt(pidStr ?? '1', 10);
          if (!pokemonId || pokemonId < 1 || pokemonId > 251) {
            alert('ID de Pokémon inválido (1-251).');
            return;
          }
          const lvlStr = window.prompt('Nivel:', String(existingReward?.level ?? 5));
          const level = parseInt(lvlStr ?? '5', 10) || 5;
          const defaultQuestId = `text-reward-${selectedMapId}-${tile.x}-${tile.y}`;
          const questId = window.prompt('questId único:', existingReward?.questId ?? defaultQuestId);
          if (!questId) return;
          const newReward: TextRewardEntry = { type: 'pokemon', pokemonId, level, questId: questId.trim() };
          setTextRewards((pr) => {
            const nr = { ...(pr[rowKey] ?? {}), [colKey]: newReward };
            return { ...pr, [rowKey]: nr };
          });
          setDirty(true);
        }
      }
      return;
    }
    if (editMode === 'items') {
      const idx = items.findIndex((it) => it.pos.x === tile.x && it.pos.y === tile.y);
      if (idx >= 0) {
        // Toggle hidden / delete
        const action = window.prompt(
          `Item ${items[idx].itemKey} (${items[idx].hidden ? 'oculto' : 'visible'}). Escribe:\n  toggle  → cambiar visible/oculto\n  delete  → eliminar\n  o un nuevo ItemType`,
          '',
        );
        if (action === null) return;
        if (action.trim() === 'delete') {
          setItems((p) => p.filter((_, i) => i !== idx));
        } else if (action.trim() === 'toggle') {
          setItems((p) => p.map((it, i) => i === idx ? { ...it, hidden: !it.hidden } : it));
        } else {
          const key = action.trim();
          if (!itemTypeKeys.includes(key)) {
            alert(`ItemType inválido. Usa uno de: ${itemTypeKeys.slice(0, 8).join(', ')}…`);
            return;
          }
          setItems((p) => p.map((it, i) => i === idx ? { ...it, itemKey: key } : it));
        }
        setDirty(true);
      } else {
        const key = window.prompt(
          `Nuevo item en (${tile.x}, ${tile.y}). Escribe ItemType (ej. PokeBall, Potion, Tm12).`,
          'PokeBall',
        );
        if (!key) return;
        if (!itemTypeKeys.includes(key.trim())) {
          alert(`ItemType inválido. Disponibles: ${itemTypeKeys.slice(0, 12).join(', ')}…`);
          return;
        }
        setItems((p) => [...p, { itemKey: key.trim(), pos: { x: tile.x, y: tile.y } }]);
        setDirty(true);
      }
      return;
    }
    if (editMode === 'gifts') {
      const idx = gifts.findIndex((g) => g.pos.x === tile.x && g.pos.y === tile.y);
      if (idx >= 0) {
        const action = window.prompt(
          `Regalo: pokemonId=${gifts[idx].pokemonId} level=${gifts[idx].level} questId=${gifts[idx].questId}\n\n  delete\n  edit  → editar valores`,
          'edit',
        );
        if (action === null) return;
        if (action.trim() === 'delete') {
          setGifts((p) => p.filter((_, i) => i !== idx));
          setDirty(true);
          return;
        }
        if (action.trim() === 'edit') {
          const pidStr = window.prompt('pokemonId (1-251):', String(gifts[idx].pokemonId));
          if (pidStr === null) return;
          const lvlStr = window.prompt('level (1-100):', String(gifts[idx].level));
          if (lvlStr === null) return;
          const qid = window.prompt('questId (único):', gifts[idx].questId);
          if (qid === null) return;
          const pid = parseInt(pidStr, 10);
          const lvl = parseInt(lvlStr, 10);
          if (Number.isNaN(pid) || pid < 1 || pid > 251) { alert('pokemonId inválido'); return; }
          if (Number.isNaN(lvl) || lvl < 1 || lvl > 100) { alert('level inválido'); return; }
          if (!qid.trim()) { alert('questId vacío'); return; }
          setGifts((p) => p.map((g, i) => i === idx ? { ...g, pokemonId: pid, level: lvl, questId: qid.trim() } : g));
          setDirty(true);
        }
      } else {
        const pidStr = window.prompt(`Nuevo regalo en (${tile.x}, ${tile.y}). pokemonId (1-251):`, '1');
        if (pidStr === null) return;
        const lvlStr = window.prompt('level (1-100):', '5');
        if (lvlStr === null) return;
        const defaultQid = `${selectedMapId}-gift-${tile.x}-${tile.y}`;
        const qid = window.prompt('questId (único, persiste el regalo recogido):', defaultQid);
        if (qid === null) return;
        const pid = parseInt(pidStr, 10);
        const lvl = parseInt(lvlStr, 10);
        if (Number.isNaN(pid) || pid < 1 || pid > 251) { alert('pokemonId inválido'); return; }
        if (Number.isNaN(lvl) || lvl < 1 || lvl > 100) { alert('level inválido'); return; }
        if (!qid.trim()) { alert('questId vacío'); return; }
        setGifts((p) => [...p, { pokemonId: pid, level: lvl, pos: { x: tile.x, y: tile.y }, questId: qid.trim() }]);
        setDirty(true);
      }
      return;
    }
    if (editMode === 'static-pokemon') {
      const idx = staticPokemon.findIndex((sp) => sp.pos.x === tile.x && sp.pos.y === tile.y);
      if (idx >= 0) {
        const sp = staticPokemon[idx];
        const action = window.prompt(
          `Pokémon estático: #${sp.pokemonId} lv${sp.level} sprite=${sp.sprite}\n  delete\n  edit`,
          'edit',
        );
        if (action === null) return;
        if (action.trim() === 'delete') {
          setStaticPokemon((p) => p.filter((_, i) => i !== idx));
          setDirty(true);
          return;
        }
        if (action.trim() === 'edit') {
          const pidStr = window.prompt('pokemonId (1-251):', String(sp.pokemonId));
          if (pidStr === null) return;
          const lvlStr = window.prompt('level (1-100):', String(sp.level));
          if (lvlStr === null) return;
          const spriteStr = window.prompt(`sprite:\n${STATIC_POKEMON_SPRITES.join(', ')}`, sp.sprite);
          if (spriteStr === null) return;
          const qid = window.prompt('questId:', sp.questId);
          if (qid === null) return;
          const introRaw = window.prompt(
            'Intro (líneas separadas por "|", vacío = sin intro):',
            sp.intro && sp.intro.length > 0 ? sp.intro.join(' | ') : '',
          );
          if (introRaw === null) return;
          const pid = parseInt(pidStr, 10);
          const lvl = parseInt(lvlStr, 10);
          if (Number.isNaN(pid) || pid < 1 || pid > 251) { alert('pokemonId inválido'); return; }
          if (Number.isNaN(lvl) || lvl < 1 || lvl > 100) { alert('level inválido'); return; }
          if (!STATIC_POKEMON_SPRITES.includes(spriteStr.trim())) { alert('sprite inválido'); return; }
          if (!qid.trim()) { alert('questId vacío'); return; }
          const intro = introRaw.trim() ? introRaw.split('|').map(s => s.trim()).filter(Boolean) : undefined;
          setStaticPokemon((p) => p.map((s, i) => i === idx ? { ...s, pokemonId: pid, level: lvl, sprite: spriteStr.trim(), questId: qid.trim(), intro } : s));
          setDirty(true);
        }
      } else {
        const pidStr = window.prompt(`Pokémon estático en (${tile.x}, ${tile.y}). pokemonId (1-251):`, '144');
        if (pidStr === null) return;
        const lvlStr = window.prompt('level (1-100):', '50');
        if (lvlStr === null) return;
        const spriteStr = window.prompt(`sprite:\n${STATIC_POKEMON_SPRITES.join(', ')}`, 'bird-a');
        if (spriteStr === null) return;
        const defaultQid = `${selectedMapId}-static-${tile.x}-${tile.y}`;
        const qid = window.prompt('questId (único):', defaultQid);
        if (qid === null) return;
        const introRaw = window.prompt('Intro (líneas separadas por "|", vacío = sin intro):', '');
        if (introRaw === null) return;
        const pid = parseInt(pidStr, 10);
        const lvl = parseInt(lvlStr, 10);
        if (Number.isNaN(pid) || pid < 1 || pid > 251) { alert('pokemonId inválido'); return; }
        if (Number.isNaN(lvl) || lvl < 1 || lvl > 100) { alert('level inválido'); return; }
        if (!STATIC_POKEMON_SPRITES.includes(spriteStr.trim())) { alert('sprite inválido'); return; }
        if (!qid.trim()) { alert('questId vacío'); return; }
        const intro = introRaw.trim() ? introRaw.split('|').map(s => s.trim()).filter(Boolean) : undefined;
        setStaticPokemon((p) => [...p, { pokemonId: pid, level: lvl, sprite: spriteStr.trim(), pos: { x: tile.x, y: tile.y }, questId: qid.trim(), intro }]);
        setDirty(true);
      }
      return;
    }
    if (editMode === 'cuttable-trees') {
      const idx = cuttableTrees.findIndex((t) => t.pos.x === tile.x && t.pos.y === tile.y);
      if (idx >= 0) {
        // Clic en árbol existente → eliminar
        setCuttableTrees((p) => p.filter((_, i) => i !== idx));
        setDirty(true);
      } else {
        // Clic en tile vacío → añadir árbol
        const defaultQid = `cut-tree-${selectedMapId}-${tile.x}-${tile.y}`;
        const qid = window.prompt('questId (único):', defaultQid);
        if (qid === null) return;
        if (!qid.trim()) { alert('questId vacío'); return; }
        setCuttableTrees((p) => [...p, { pos: { x: tile.x, y: tile.y }, questId: qid.trim() }]);
        setDirty(true);
      }
      return;
    }
    if (editMode === 'berry-trees') {
      const idx = berryTrees.findIndex((t) => t.pos.x === tile.x && t.pos.y === tile.y);
      if (idx >= 0) {
        // Clic en árbol existente → eliminar
        setBerryTrees((p) => p.filter((_, i) => i !== idx));
        setDirty(true);
      } else {
        // Clic en tile vacío → añadir árbol de bayas
        const raw = window.prompt(
          `Baya del árbol (${BERRY_ITEM_KEYS.join(', ')}):`,
          'Berry'
        );
        if (raw === null) return;
        const itemKey = BERRY_ITEM_KEYS.find(
          (k) => k.toLowerCase() === raw.trim().toLowerCase()
        );
        if (!itemKey) { alert(`Baya desconocida: "${raw}"`); return; }
        setBerryTrees((p) => [...p, { pos: { x: tile.x, y: tile.y }, itemKey }]);
        setDirty(true);
      }
      return;
    }
    if (editMode === 'boulders') {
      const idx = boulders.findIndex((b) => b.pos.x === tile.x && b.pos.y === tile.y);
      if (idx >= 0) {
        // Clic en roca existente → eliminar
        setBoulders((p) => p.filter((_, i) => i !== idx));
        setDirty(true);
      } else {
        // Clic en tile vacío → añadir roca (MO Fuerza)
        const defaultId = `boulder-${selectedMapId}-${tile.x}-${tile.y}`;
        const id = window.prompt('id único de la roca:', defaultId);
        if (id === null) return;
        if (!id.trim()) { alert('id vacío'); return; }
        setBoulders((p) => [...p, { pos: { x: tile.x, y: tile.y }, id: id.trim() }]);
        setDirty(true);
      }
      return;
    }
    if (editMode === 'spots') {
      const setter =
        activeSpot === 'start' ? setStartPos :
        activeSpot === 'pokemonCenter' ? setPokemonCenter :
        activeSpot === 'pc' ? setPcPos :
        activeSpot === 'store' ? setStorePos :
        activeSpot === 'recoverLocation' ? setRecoverLocation :
        setOnlineBattleNpc;
      const current =
        activeSpot === 'start' ? startPos :
        activeSpot === 'pokemonCenter' ? pokemonCenter :
        activeSpot === 'pc' ? pcPos :
        activeSpot === 'store' ? storePos :
        activeSpot === 'recoverLocation' ? recoverLocation :
        onlineBattleNpc;
      // start es obligatorio en MapType; el resto se puede borrar con click repetido.
      if (activeSpot !== 'start' && current && current.x === tile.x && current.y === tile.y) {
        setter(null);
      } else {
        setter({ x: tile.x, y: tile.y });
      }
      setDirty(true);
      return;
    }
    if (editMode === 'mechanics') {
      if (activeMechanic === 'stopper') {
        const currentlyOn = hasMask(stoppers, tile.x, tile.y);
        setStoppers((prev) => setMaskAt(prev, tile.x, tile.y, !currentlyOn));
      } else {
        const direction = activeMechanic.replace('spinner-', '') as DirectionName;
        const currentDirection = spinners[String(tile.y)]?.[String(tile.x)] ?? null;
        setSpinners((prev) => setSpinnerAt(prev, tile.x, tile.y, currentDirection === direction ? null : direction));
      }
      setDirty(true);
      return;
    }
    if (editMode === 'map') {
      if (!flyable) return;
      setFlySpot({ x: tile.x, y: tile.y });
      setDirty(true);
      return;
    }
    if (editMode === 'portals') {
      const idx = portals.findIndex((p) => p.pos.x === tile.x && p.pos.y === tile.y);
      if (idx !== -1) {
        // Seleccionar para editar en panel
        setSelectedPortalIdx(idx);
        return;
      }
      // Crear nuevo portal del tipo activo
      const mapIds = Object.keys(mapData).sort();
      if (activePortalKind === 'door') {
        const dest = window.prompt(
          `Crear PUERTA en (${tile.x}, ${tile.y}).\n\nMapId destino:\n\n${mapIds.join('\n')}`,
          mapIds[0] ?? '',
        );
        if (!dest || !mapData[dest]) {
          if (dest) alert(`MapId desconocido: ${dest}`);
          return;
        }
        setPortals((p) => [...p, { kind: 'door', pos: { x: tile.x, y: tile.y }, destMap: dest }]);
        setDirty(true);
      } else if (activePortalKind === 'teleport') {
        const dest = window.prompt(`Crear TELEPORT en (${tile.x}, ${tile.y}).\n\nMapId destino:`, mapIds[0] ?? '');
        if (!dest || !mapData[dest]) {
          if (dest) alert(`MapId desconocido: ${dest}`);
          return;
        }
        const xs = window.prompt('Posición destino X:', '0');
        const ys = window.prompt('Posición destino Y:', '0');
        if (xs === null || ys === null) return;
        const dx = parseInt(xs, 10);
        const dy = parseInt(ys, 10);
        if (Number.isNaN(dx) || Number.isNaN(dy)) { alert('Posición destino inválida'); return; }
        setPortals((p) => [...p, {
          kind: 'teleport',
          pos: { x: tile.x, y: tile.y },
          destMap: dest,
          destPos: { x: dx, y: dy },
        }]);
        setDirty(true);
      } else {
        // exit
        setPortals((p) => [...p, { kind: 'exit', pos: { x: tile.x, y: tile.y } }]);
        setDirty(true);
      }
      return;
    }
  }

  // ── Right click → eliminar NPC ────────────────────────────────────────
  function onNpcRightClick(e: React.MouseEvent, idx: number) {
    e.preventDefault();
    if (confirm(`¿Eliminar NPC "${NPC_REGISTRY[trainers[idx].npcKey]?.label ?? trainers[idx].npcKey}"?`)) {
      deleteNpc(idx);
    }
  }

  const selected = selectedIdx !== null ? trainers[selectedIdx] : null;

  // ── Minimap ───────────────────────────────────────────────────────────
  const BASE_MINIMAP_COORDS: Record<string, { x: number; y: number }> = {
    'pallet-town':        { x: 84,  y: 179 },
    'route-1':            { x: 84,  y: 155 },
    'viridian-city':      { x: 84,  y: 130 },
    'route-22':           { x: 55,  y: 130 },
    'route-2':            { x: 84,  y: 105 },
    'viridian-forrest':   { x: 84,  y: 90  },
    'pewter-city':        { x: 84,  y: 75  },
    'route-3':            { x: 100, y: 75  },
    'mt-moon-1f':         { x: 126, y: 75  },
    'mt-moon-2f':         { x: 126, y: 75  },
    'mt-moon-3f':         { x: 126, y: 75  },
    'route-4':            { x: 148, y: 75  },
    'cerulean-city':      { x: 162, y: 75  },
    'route-5':            { x: 162, y: 93  },
    'route-6':            { x: 162, y: 113 },
    'vermilion-city':     { x: 162, y: 130 },
    'route-9':            { x: 183, y: 75  },
    'route-10':           { x: 183, y: 87  },
    'lavender-town':      { x: 200, y: 87  },
    'route-8':            { x: 183, y: 93  },
    'route-7':            { x: 140, y: 93  },
    'celadon-city':       { x: 118, y: 93  },
    'route-11':           { x: 183, y: 109 },
    'route-12':           { x: 200, y: 100 },
    'route-13':           { x: 200, y: 118 },
    'route-14':           { x: 190, y: 128 },
    'route-15':           { x: 175, y: 130 },
    'route-16':           { x: 105, y: 100 },
    'route-17':           { x: 105, y: 118 },
    'route-18':           { x: 105, y: 140 },
    'fuchsia-city':       { x: 118, y: 140 },
    'safari-zone-center': { x: 118, y: 120 },
    'route-19':           { x: 118, y: 155 },
    'route-20':           { x: 100, y: 165 },
    'cinnabar-island':    { x: 84,  y: 175 },
    'route-21':           { x: 84,  y: 160 },
    'saffron-city':       { x: 162, y: 93  },
    'route-24':           { x: 162, y: 60  },
    'route-25':           { x: 175, y: 55  },
    'route-23':           { x: 84,  y: 55  },
    'indigo-plateau':     { x: 70,  y: 45  },
    'victory-road-1f':    { x: 77,  y: 55  },
  };

  /**
   * Returns pixel coords for the current map on the minimap image (237×213).
   * For interior maps (gyms, pokemon centers, etc.) it strips known suffixes
   * and tries to find coords for the parent location.
   */
  function getMinimapCoords(mapId: string): { x: number; y: number } | null {
    if (mapData[mapId]?.minimapPos) return mapData[mapId].minimapPos ?? null;
    if (BASE_MINIMAP_COORDS[mapId]) return BASE_MINIMAP_COORDS[mapId];
    // Strip interior suffixes and retry
    const suffixes = [
      '-gym', '-pokemon-center', '-pokecenter', '-poke-mart', '-pokemart',
      '-museum-1f', '-museum-2f', '-museum',
      '-npc-house', '-npc-a', '-npc-b', '-npc-c',
      '-1f', '-2f', '-3f', '-4f', '-b1f', '-b2f',
      '-north', '-south', '-east', '-west',
      '-gate', '-house-a', '-house-b', '-house',
      '-lab', '-academy',
    ];
    // Sort longest first so "-pokemon-center" matches before "-center"
    const sorted = [...suffixes].sort((a, b) => b.length - a.length);
    for (const suffix of sorted) {
      if (mapId.endsWith(suffix)) {
        const base = mapId.slice(0, mapId.length - suffix.length);
        if (mapData[base]?.minimapPos) return mapData[base].minimapPos ?? null;
        if (BASE_MINIMAP_COORDS[base]) return BASE_MINIMAP_COORDS[base];
      }
    }
    return null;
  }

  const minimapCoords = minimapPos ?? getMinimapCoords(selectedMapId);
  const minimapEntries = Object.keys(mapData)
    .filter((id) => !!mapData[id]?.minimapPos || !!BASE_MINIMAP_COORDS[id])
    .map((id) => ({ id, coord: mapData[id]?.minimapPos ?? BASE_MINIMAP_COORDS[id], name: mapData[id]?.name ?? id }))
    .filter((entry): entry is { id: string; coord: { x: number; y: number }; name: string } => !!entry.coord);

  const sortedMapIds = Object.keys(mapData).sort((a, b) =>
    (mapData[a]?.name ?? a).localeCompare(mapData[b]?.name ?? b),
  );
  const selectedSortedIdx = sortedMapIds.indexOf(selectedMapId);
  const prevMapId = selectedSortedIdx > 0 ? sortedMapIds[selectedSortedIdx - 1] : null;
  const nextMapId = selectedSortedIdx >= 0 && selectedSortedIdx < sortedMapIds.length - 1
    ? sortedMapIds[selectedSortedIdx + 1]
    : null;

  function directionalMapId(direction: 'up' | 'down' | 'left' | 'right'): string | null {
    const current = minimapCoords;
    if (!current) return null;
    const candidates = minimapEntries
      .filter(({ id }) => id !== selectedMapId)
      .map(({ id, coord }) => {
        const dx = coord.x - current.x;
        const dy = coord.y - current.y;
        const valid =
          direction === 'up' ? dy < -2 :
          direction === 'down' ? dy > 2 :
          direction === 'left' ? dx < -2 :
          dx > 2;
        if (!valid) return null;
        const primary = direction === 'up' || direction === 'down' ? Math.abs(dy) : Math.abs(dx);
        const secondary = direction === 'up' || direction === 'down' ? Math.abs(dx) : Math.abs(dy);
        return { id, score: primary + secondary * 1.75 };
      })
      .filter((v): v is { id: string; score: number } => !!v)
      .sort((a, b) => a.score - b.score);
    return candidates[0]?.id ?? null;
  }

  const mapNavTargets = {
    up: directionalMapId('up'),
    down: directionalMapId('down'),
    left: directionalMapId('left'),
    right: directionalMapId('right'),
  };

  function jumpToMap(id: string | null) {
    if (!id) return;
    selectMap(id);
  }

  useEffect(() => {
    const isTextInput = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTextInput(e.target) || dragging.current || entityDrag.current || wallPaint.current?.active) return;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        jumpToMap(mapNavTargets.up);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        jumpToMap(mapNavTargets.down);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        jumpToMap(mapNavTargets.left);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        jumpToMap(mapNavTargets.right);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mapNavTargets.up, mapNavTargets.down, mapNavTargets.left, mapNavTargets.right, dirty, selectedMapId]);

  // ── Render ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', color: '#ff6b6b', padding: 40, textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f0f1a', fontFamily: 'monospace', color: '#e0e0ff', overflow: 'hidden' }}>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      {/* minHeight (NO height fija): con la altura fija de 84px, en pantallas
          de portátil el wrap generaba una 3ª línea que quedaba RECORTADA por
          el overflow:hidden del raíz (los últimos modos eran invisibles).
          Ahora la barra crece lo que necesite y el lienzo (flex:1) se adapta. */}
      <div style={{ display: 'flex', alignItems: 'center', columnGap: 12, rowGap: 6, padding: '8px 16px', minHeight: 56, background: '#13132a', borderBottom: '1px solid #2a2a4a', flexShrink: 0, flexWrap: 'wrap' }}>
        <style>{`
          /* Elementos prescindibles de la toolbar en pantallas estrechas */
          @media (max-width: 1600px) { .me-legend { display: none !important; } }
          @media (max-width: 1280px) { .me-title { display: none !important; } }
        `}</style>
        <span className="me-title" style={{ fontSize: 16, fontWeight: 700, color: '#a0a0ff', marginRight: 4 }}>🗺️ Map Editor</span>

        <a
          href="/admin/pokedex-editor"
          style={{
            fontSize: 12,
            padding: '4px 8px',
            background: '#1a1a3a',
            border: '1px solid #3a3a5a',
            borderRadius: 4,
            color: '#e0e0ff',
            textDecoration: 'none',
            marginRight: 4,
          }}
        >
          📖 Pokédex
        </a>

        {/* Selector de mapa */}
        <select
          value={selectedMapId}
          onChange={(e) => selectMap(e.target.value)}
          style={{ ...inputStyle, width: 'clamp(150px, 14vw, 220px)', height: 30 }}
        >
          {Object.values(mapData).map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        <div style={{ display: 'grid', gridTemplateColumns: '24px 24px 24px', gridTemplateRows: '22px 22px', gap: 2, alignItems: 'center' }} title="Moverse por mapas usando posiciones del minimapa">
          <button onClick={() => jumpToMap(prevMapId)} disabled={!prevMapId} style={{ ...navBtnStyle, gridColumn: 1, gridRow: '1 / span 2' }}>‹</button>
          <button onClick={() => jumpToMap(mapNavTargets.up)} disabled={!mapNavTargets.up} style={{ ...navBtnStyle, gridColumn: 2, gridRow: 1 }}>▲</button>
          <button onClick={() => jumpToMap(nextMapId)} disabled={!nextMapId} style={{ ...navBtnStyle, gridColumn: 3, gridRow: '1 / span 2' }}>›</button>
          <button onClick={() => jumpToMap(mapNavTargets.left)} disabled={!mapNavTargets.left} style={{ ...navBtnStyle, gridColumn: 1, gridRow: 2 }}>◀</button>
          <button onClick={() => jumpToMap(mapNavTargets.down)} disabled={!mapNavTargets.down} style={{ ...navBtnStyle, gridColumn: 2, gridRow: 2 }}>▼</button>
          <button onClick={() => jumpToMap(mapNavTargets.right)} disabled={!mapNavTargets.right} style={{ ...navBtnStyle, gridColumn: 3, gridRow: 2 }}>▶</button>
        </div>

        {/* Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#666', fontSize: 12 }}>Zoom</span>
          {ZOOM_LEVELS.map((z) => (
            <button key={z} onClick={() => setZoom(z)} style={{ padding: '2px 8px', fontSize: 12, background: zoom === z ? '#5050b0' : '#1a1a3a', border: '1px solid #3a3a5a', borderRadius: 4, color: '#e0e0ff', cursor: 'pointer' }}>
              {z}
            </button>
          ))}
        </div>

        {/* Minimap toggle */}
        <button
          onClick={() => setShowMinimap((v) => !v)}
          title="Ver minimap de Kanto"
          style={{
            padding: '2px 8px',
            fontSize: 12,
            background: showMinimap ? '#2a4a2a' : '#1a1a3a',
            border: `1px solid ${showMinimap ? '#4a8a4a' : '#3a3a5a'}`,
            borderRadius: 4,
            color: showMinimap ? '#88ff88' : '#e0e0ff',
            cursor: 'pointer',
          }}
        >
          🗺️ Kanto
        </button>

        {/* Grid toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: showGrid ? '#a0a0ff' : '#555' }}>
          <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} style={{ accentColor: '#5050b0' }} />
          Grid
        </label>

        {/* Walls toggle visibilidad */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: showWalls ? '#ff8888' : '#555' }}>
          <input type="checkbox" checked={showWalls} onChange={(e) => setShowWalls(e.target.checked)} style={{ accentColor: '#aa3030' }} />
          Walls
        </label>

        {/* Modo edición — flexWrap: el grupo de 16 botones era un bloque
            indivisible de ~1100px que desbordaba en cualquier portátil. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, border: '1px solid #3a3a5a', borderRadius: 4, overflow: 'hidden' }}>
          {(['npc', 'walls', 'fences', 'grass', 'water', 'texts', 'items', 'gifts', 'static-pokemon', 'cuttable-trees', 'berry-trees', 'boulders', 'spots', 'mechanics', 'portals', 'map'] as EditMode[]).map((m) => {
            const colorMap: Record<EditMode, string> = {
              npc: '#5050b0',
              walls: '#7a3030',
              fences: '#7a5a30',
              grass: '#3a7a3a',
              water: '#3a5aa0',
              texts: '#3a5a7a',
              items: '#5a3a7a',
              gifts: '#7a3a5a',
              'static-pokemon': '#3a7a6a',
              'cuttable-trees': '#5a7a3a',
              'berry-trees': '#a04a5a',
              boulders: '#8a6a3a',
              spots: '#5a7a30',
              mechanics: '#6a4a8a',
              portals: '#7a3a3a',
              map: '#4a4a5a',
            };
            return (
              <button
                key={m}
                onClick={() => setEditMode(m)}
                style={{
                  padding: '3px 7px',
                  background: editMode === m ? colorMap[m] : '#1a1a3a',
                  border: 'none',
                  color: editMode === m ? '#fff' : '#888',
                  cursor: 'pointer',
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {m === 'npc' ? 'NPCs' : m}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* Leyenda (oculta en pantallas estrechas — ver media query arriba) */}
        <div className="me-legend" style={{ display: 'flex', gap: 12, fontSize: 11 }}>
          <span><span style={{ color: '#ff5555' }}>●</span> Combat</span>
          <span><span style={{ color: '#5588ff' }}>●</span> Diálogo</span>
          <span><span style={{ color: '#f5c518' }}>●</span> Persistent</span>
        </div>

        {/* Botón añadir */}
        <button onClick={addNpc} disabled={editMode !== 'npc'} style={{ padding: '4px 12px', background: editMode === 'npc' ? '#2a4a2a' : '#1a1a2a', border: '1px solid #4a8a4a', borderRadius: 4, color: editMode === 'npc' ? '#88ff88' : '#444', cursor: editMode === 'npc' ? 'pointer' : 'not-allowed', fontSize: 13 }}>
          + NPC
        </button>

        {/* Guardar */}
        <button onClick={save} disabled={!dirty || saving} style={{ padding: '4px 12px', background: saveFlash ? '#2a6a2a' : (dirty ? '#3a3a7a' : '#1a1a3a'), border: `1px solid ${dirty ? '#6060c0' : '#2a2a4a'}`, borderRadius: 4, color: dirty ? '#fff' : '#555', cursor: dirty ? 'pointer' : 'default', fontSize: 13, transition: 'all 0.3s' }}>
          {saveFlash ? '✓ Guardado' : saving ? 'Guardando...' : '💾 Guardar'}
        </button>

        {/* Importar .ts (sustituye todo el mapa) */}
        <button
          onClick={doImportTs}
          title="Cargar un .ts de game-src/src/maps y sustituir el contenido del mapa actual"
          style={{ padding: '4px 12px', background: '#2a2a1a', border: '1px solid #7a7a3a', borderRadius: 4, color: '#ffff88', cursor: 'pointer', fontSize: 12 }}
        >
          📥 Importar .ts
        </button>
        <input
          ref={importFileRef}
          type="file"
          accept=".ts,text/plain,text/typescript"
          onChange={handleImportFile}
          style={{ display: 'none' }}
        />

        {/* Exportar TS según modo */}
        {editMode === 'npc' && (
          <button onClick={doExport} style={{ padding: '4px 12px', background: '#1a2a3a', border: '1px solid #3a5a7a', borderRadius: 4, color: '#88ccff', cursor: 'pointer', fontSize: 12 }}>
            📋 Trainers
          </button>
        )}
        {editMode === 'walls' && (
          <button onClick={doExportWalls} style={{ padding: '4px 12px', background: '#2a1a1a', border: '1px solid #7a3a3a', borderRadius: 4, color: '#ff8888', cursor: 'pointer', fontSize: 12 }}>
            🧱 Walls
          </button>
        )}
        {editMode === 'fences' && (
          <button onClick={doExportFences} style={{ padding: '4px 12px', background: '#2a2010', border: '1px solid #7a5a30', borderRadius: 4, color: '#ffcc88', cursor: 'pointer', fontSize: 12 }}>
            🚧 Fences
          </button>
        )}
        {editMode === 'grass' && (
          <button onClick={doExportGrass} style={{ padding: '4px 12px', background: '#1a2a1a', border: '1px solid #3a7a3a', borderRadius: 4, color: '#88ff88', cursor: 'pointer', fontSize: 12 }}>
            🌿 Grass
          </button>
        )}
        {editMode === 'water' && (
          <button onClick={doExportWater} style={{ padding: '4px 12px', background: '#0f1e2a', border: '1px solid #2a5a8a', borderRadius: 4, color: '#88ccff', cursor: 'pointer', fontSize: 12 }}>
            💧 Water
          </button>
        )}
        {(editMode === 'grass' || editMode === 'water') && (
          <button onClick={doExportEncounters} style={{ padding: '4px 12px', background: '#10202a', border: '1px solid #3a6a8a', borderRadius: 4, color: '#88ddff', cursor: 'pointer', fontSize: 12 }}>
            🐾 Encounters
          </button>
        )}
        {editMode === 'texts' && (
          <button onClick={doExportTexts} style={{ padding: '4px 12px', background: '#1a1a2a', border: '1px solid #3a5a7a', borderRadius: 4, color: '#88ccff', cursor: 'pointer', fontSize: 12 }}>
            💬 Texts
          </button>
        )}
        {editMode === 'items' && (
          <button onClick={doExportItems} style={{ padding: '4px 12px', background: '#2a1a2a', border: '1px solid #5a3a7a', borderRadius: 4, color: '#cc88ff', cursor: 'pointer', fontSize: 12 }}>
            📦 Items
          </button>
        )}
        {editMode === 'gifts' && (
          <button onClick={doExportGifts} style={{ padding: '4px 12px', background: '#2a1a2a', border: '1px solid #7a3a5a', borderRadius: 4, color: '#ff88cc', cursor: 'pointer', fontSize: 12 }}>
            🎁 Gifts
          </button>
        )}
        {editMode === 'static-pokemon' && (
          <button onClick={doExportStaticPokemon} style={{ padding: '4px 12px', background: '#1a2a2a', border: '1px solid #3a7a6a', borderRadius: 4, color: '#50ddb4', cursor: 'pointer', fontSize: 12 }}>
            🐾 StaticPokémon
          </button>
        )}
        {editMode === 'berry-trees' && (
          <button onClick={doExportBerryTrees} style={{ padding: '4px 12px', background: '#2a1018', border: '1px solid #a04a5a', borderRadius: 4, color: '#e88aa0', cursor: 'pointer', fontSize: 12 }}>
            🍒 Árboles de bayas
          </button>
        )}
        {editMode === 'boulders' && (
          <button onClick={doExportBoulders} style={{ padding: '4px 12px', background: '#2a2010', border: '1px solid #8a6a3a', borderRadius: 4, color: '#d2b482', cursor: 'pointer', fontSize: 12 }}>
            🪨 Boulders
          </button>
        )}
        {editMode === 'spots' && (
          <button onClick={doExportSpots} style={{ padding: '4px 12px', background: '#1a2a1a', border: '1px solid #5a7a30', borderRadius: 4, color: '#ccff88', cursor: 'pointer', fontSize: 12 }}>
            📍 Spots
          </button>
        )}
        {editMode === 'portals' && (
          <button onClick={doExportPortals} style={{ padding: '4px 12px', background: '#2a1a1a', border: '1px solid #7a3a3a', borderRadius: 4, color: '#ffaa88', cursor: 'pointer', fontSize: 12 }}>
            🚪 Portals
          </button>
        )}
        {editMode === 'mechanics' && (
          <button onClick={doExportMechanics} style={{ padding: '4px 12px', background: '#221a2a', border: '1px solid #6a4a8a', borderRadius: 4, color: '#ddb0ff', cursor: 'pointer', fontSize: 12 }}>
            🧭 Mechanics
          </button>
        )}
        <button onClick={doExportMapType} style={{ padding: '4px 12px', background: '#1a2a3a', border: '1px solid #4a6a8a', borderRadius: 4, color: '#aaddff', cursor: 'pointer', fontSize: 12 }}>
          📋 MapType
        </button>

        {/* Logout */}
        <button onClick={() => { document.cookie = 'admin_token=; Max-Age=0; path=/'; window.location.href = '/admin/login'; }} style={{ padding: '4px 8px', background: 'none', border: '1px solid #3a3a5a', borderRadius: 4, color: '#666', cursor: 'pointer', fontSize: 12 }}>
          ×
        </button>
      </div>

      {/* ── Minimap panel ────────────────────────────────────────────── */}
      {showMinimap && (
        <div style={{
          flexShrink: 0,
          background: '#0d0d20',
          borderBottom: '1px solid #2a2a4a',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16,
          padding: '12px 20px',
        }}>
          {/* Imagen interactiva */}
          <div
            style={{
              position: 'relative',
              display: 'inline-block',
              flexShrink: 0,
              cursor: minimapMode === 'edit' ? 'crosshair' : 'pointer',
              outline: minimapMode === 'edit' ? '2px solid #ffaa44' : '2px solid #2a2a4a',
              borderRadius: 2,
            }}
            onClick={(e) => {
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              const px = Math.max(0, Math.min(MINIMAP_WIDTH, Math.round(((e.clientX - rect.left) / rect.width) * MINIMAP_WIDTH)));
              const py = Math.max(0, Math.min(MINIMAP_HEIGHT, Math.round(((e.clientY - rect.top) / rect.height) * MINIMAP_HEIGHT)));
              if (minimapMode === 'edit') {
                setMinimapPos({ x: px, y: py });
                setDirty(true);
              } else {
                // Navegar: buscar el mapa más cercano
                let bestId = '';
                let bestDist = Infinity;
                for (const { id, coord } of minimapEntries) {
                  const d = Math.hypot(coord.x - px, coord.y - py);
                  if (d < bestDist) { bestDist = d; bestId = id; }
                }
                if (bestId && bestDist < 20) selectMap(bestId);
              }
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/editor/maps/kanto_region.png"
              alt="Kanto minimap"
              width={MINIMAP_WIDTH * MINIMAP_DISPLAY_SCALE}
              height={MINIMAP_HEIGHT * MINIMAP_DISPLAY_SCALE}
              style={{ imageRendering: 'pixelated', display: 'block' }}
              draggable={false}
            />
            {/* Todos los puntos conocidos (modo navegar) */}
            {minimapMode === 'navigate' && minimapEntries.map(({ id, coord, name }) => {
              const isCurrent = id === selectedMapId;
              return (
                <div key={id} title={`${name} · ${id} (${coord.x}, ${coord.y})`} style={{
                  position: 'absolute',
                  left: `${(coord.x / MINIMAP_WIDTH) * 100}%`,
                  top: `${(coord.y / MINIMAP_HEIGHT) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  width: isCurrent ? 10 : 6,
                  height: isCurrent ? 10 : 6,
                  borderRadius: '50%',
                  background: isCurrent ? '#ff2222' : (mapData[id]?.minimapPos ? '#4488ff' : '#7788aa'),
                  boxShadow: isCurrent ? '0 0 4px 2px rgba(255,60,60,0.7)' : '0 0 2px rgba(80,140,255,0.6)',
                  pointerEvents: 'none',
                  opacity: isCurrent ? 1 : (mapData[id]?.minimapPos ? 0.78 : 0.48),
                }} />
              );
            })}
            {/* Punto editable del mapa actual (modo editar) */}
            {minimapMode === 'edit' && (() => {
              const dot = minimapPos ?? minimapCoords;
              if (!dot) return null;
              const saved = !!minimapPos;
              return (
                <div style={{
                  position: 'absolute',
                  left: `${(dot.x / MINIMAP_WIDTH) * 100}%`,
                  top: `${(dot.y / MINIMAP_HEIGHT) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: saved ? '#ff2222' : '#ff8800',
                  boxShadow: `0 0 4px 2px ${saved ? 'rgba(255,60,60,0.7)' : 'rgba(255,140,0,0.6)'}`,
                  pointerEvents: 'none',
                  border: saved ? 'none' : '1px dashed #fff',
                }} />
              );
            })()}
          </div>

          {/* Panel lateral */}
          <div style={{ fontSize: 12, color: '#888', paddingTop: 4, minWidth: 180 }}>
            <div style={{ color: '#a0a0ff', fontWeight: 700, marginBottom: 8 }}>
              {mapData[selectedMapId]?.name ?? selectedMapId}
            </div>

            {/* Botones de modo */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {(['navigate', 'edit'] as const).map((mode) => (
                <button key={mode} onClick={() => setMinimapMode(mode)} style={{
                  padding: '3px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 4,
                  background: minimapMode === mode ? (mode === 'edit' ? '#3a2a0a' : '#0a1a3a') : '#1a1a2a',
                  border: `1px solid ${minimapMode === mode ? (mode === 'edit' ? '#ffaa44' : '#4488ff') : '#3a3a5a'}`,
                  color: minimapMode === mode ? (mode === 'edit' ? '#ffaa44' : '#88aaff') : '#888',
                }}>
                  {mode === 'navigate' ? '🗺️ Navegar' : '📍 Editar pos'}
                </button>
              ))}
            </div>

            {minimapMode === 'edit' ? (
              <div style={{ color: '#ccc', lineHeight: 1.7 }}>
                {minimapPos
                  ? <div style={{ color: '#88ff88' }}>✓ Guardado: ({minimapPos.x}, {minimapPos.y})</div>
                  : minimapCoords
                    ? <div style={{ color: '#ff8800' }}>⚠ Auto ({minimapCoords.x}, {minimapCoords.y}) — sin guardar</div>
                    : <div style={{ color: '#666' }}>Sin posición</div>
                }
                <div style={{ color: '#555', fontSize: 11, marginTop: 4 }}>
                  Click en el mapa para fijar la posición
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
                  <label style={{ color: '#888', fontSize: 10 }}>
                    X
                    <input
                      type="number"
                      min={0}
                      max={MINIMAP_WIDTH}
                      value={(minimapPos ?? minimapCoords)?.x ?? ''}
                      onChange={(e) => {
                        const current = minimapPos ?? minimapCoords ?? { x: 0, y: 0 };
                        const x = Math.max(0, Math.min(MINIMAP_WIDTH, parseInt(e.target.value, 10) || 0));
                        setMinimapPos({ ...current, x });
                        setDirty(true);
                      }}
                      style={{ ...inputStyle, fontSize: 11, padding: '2px 6px' }}
                    />
                  </label>
                  <label style={{ color: '#888', fontSize: 10 }}>
                    Y
                    <input
                      type="number"
                      min={0}
                      max={MINIMAP_HEIGHT}
                      value={(minimapPos ?? minimapCoords)?.y ?? ''}
                      onChange={(e) => {
                        const current = minimapPos ?? minimapCoords ?? { x: 0, y: 0 };
                        const y = Math.max(0, Math.min(MINIMAP_HEIGHT, parseInt(e.target.value, 10) || 0));
                        setMinimapPos({ ...current, y });
                        setDirty(true);
                      }}
                      style={{ ...inputStyle, fontSize: 11, padding: '2px 6px' }}
                    />
                  </label>
                </div>
                {!minimapPos && minimapCoords && (
                  <button onClick={() => { setMinimapPos(minimapCoords); setDirty(true); }} style={{
                    marginTop: 8, marginRight: 6, padding: '2px 8px', fontSize: 11, cursor: 'pointer',
                    background: '#2a210a', border: '1px solid #7a5a2a', borderRadius: 4, color: '#ffd188',
                  }}>
                    Guardar auto
                  </button>
                )}
                {minimapPos && (
                  <button onClick={() => { setMinimapPos(null); setDirty(true); }} style={{
                    marginTop: 8, padding: '2px 8px', fontSize: 11, cursor: 'pointer',
                    background: '#2a0a0a', border: '1px solid #6a2a2a', borderRadius: 4, color: '#ff8888',
                  }}>
                    🗑 Borrar posición
                  </button>
                )}
              </div>
            ) : (
              <div style={{ color: '#555', fontSize: 11, lineHeight: 1.7 }}>
                Click cerca de un punto para ir a ese mapa. También puedes usar las flechas del teclado.
                <br />Azul = posición guardada · Gris = fallback · Rojo = mapa actual.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Cuerpo principal ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Canvas ───────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflow: 'auto', position: 'relative', background: '#0a0a18' }}>
          {currentMap && (
            <div
              ref={canvasRef}
              onClick={onCanvasClick}
              onPointerDown={onCanvasPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              style={{
                position: 'relative',
                width: currentMap.width * zoom,
                height: currentMap.height * zoom,
                backgroundImage: `url(/editor/maps/${currentMap.imageFile})`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                imageRendering: 'pixelated',
                cursor: editMode === 'walls' ? 'cell' : 'crosshair',
                touchAction: 'none',
                ...(showGrid ? {
                  backgroundBlendMode: 'normal',
                  outline: 'none',
                } : {}),
              }}
            >
              {/* Grid overlay */}
              {showGrid && (
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  backgroundImage: `
                    linear-gradient(to right, rgba(100,100,200,0.2) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(100,100,200,0.2) 1px, transparent 1px)
                  `,
                  backgroundSize: `${zoom}px ${zoom}px`,
                }} />
              )}

              {/* Walls overlay (puramente visual, no captura clicks) */}
              {showWalls && Object.entries(walls).flatMap(([rowKey, cols]) => {
                const y = parseInt(rowKey, 10);
                if (Number.isNaN(y)) return [];
                return cols.map((x) => (
                  <div
                    key={`w-${y}-${x}`}
                    style={{
                      position: 'absolute',
                      left: x * zoom,
                      top: y * zoom,
                      width: zoom,
                      height: zoom,
                      background: editMode === 'walls'
                        ? 'rgba(255, 60, 60, 0.55)'
                        : 'rgba(255, 60, 60, 0.22)',
                      border: editMode === 'walls'
                        ? '1px solid rgba(255, 80, 80, 0.9)'
                        : '1px solid rgba(255, 80, 80, 0.4)',
                      pointerEvents: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                ));
              })}

              {/* Fences overlay */}
              {Object.entries(fences).flatMap(([rowKey, cols]) => {
                const y = parseInt(rowKey, 10);
                if (Number.isNaN(y)) return [];
                return cols.map((x) => (
                  <div
                    key={`f-${y}-${x}`}
                    style={{
                      position: 'absolute',
                      left: x * zoom,
                      top: y * zoom,
                      width: zoom,
                      height: zoom,
                      background: editMode === 'fences'
                        ? 'rgba(255, 200, 80, 0.55)'
                        : 'rgba(255, 200, 80, 0.18)',
                      border: editMode === 'fences'
                        ? '1px solid rgba(255, 200, 80, 0.9)'
                        : '1px dashed rgba(255, 200, 80, 0.4)',
                      pointerEvents: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                ));
              })}

              {/* Grass overlay */}
              {Object.entries(grass).flatMap(([rowKey, cols]) => {
                const y = parseInt(rowKey, 10);
                if (Number.isNaN(y)) return [];
                return cols.map((x) => (
                  <div
                    key={`g-${y}-${x}`}
                    style={{
                      position: 'absolute',
                      left: x * zoom,
                      top: y * zoom,
                      width: zoom,
                      height: zoom,
                      background: editMode === 'grass'
                        ? 'rgba(80, 220, 80, 0.5)'
                        : 'rgba(80, 220, 80, 0.18)',
                      border: editMode === 'grass'
                        ? '1px solid rgba(80, 220, 80, 0.9)'
                        : '1px dashed rgba(80, 220, 80, 0.4)',
                      pointerEvents: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                ));
              })}

              {/* Water overlay (bloquea paso, permite pescar adyacente) */}
              {Object.entries(water).flatMap(([rowKey, cols]) => {
                const y = parseInt(rowKey, 10);
                if (Number.isNaN(y)) return [];
                return cols.map((x) => (
                  <div
                    key={`w-${y}-${x}`}
                    style={{
                      position: 'absolute',
                      left: x * zoom,
                      top: y * zoom,
                      width: zoom,
                      height: zoom,
                      background: editMode === 'water'
                        ? 'rgba(80, 140, 255, 0.55)'
                        : 'rgba(80, 140, 255, 0.22)',
                      border: editMode === 'water'
                        ? '1px solid rgba(80, 140, 255, 0.9)'
                        : '1px dashed rgba(80, 140, 255, 0.45)',
                      pointerEvents: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                ));
              })}

              {/* Texts overlay (marcador en cada tile con texto) */}
              {Object.entries(texts).flatMap(([rowKey, cols]) =>
                Object.keys(cols).map((colKey) => {
                  const y = parseInt(rowKey, 10);
                  const x = parseInt(colKey, 10);
                  if (Number.isNaN(y) || Number.isNaN(x)) return null;
                  const hasReward = !!textRewards[rowKey]?.[colKey];
                  const rewardEntry = textRewards[rowKey]?.[colKey];
                  const rewardIcon = rewardEntry?.type === 'pokemon' ? '⭐' : rewardEntry?.type === 'item' ? '📦' : '';
                  return (
                    <div
                      key={`t-${y}-${x}`}
                      title={cols[colKey].join('\n') + (rewardEntry ? `\n[Recompensa: ${rewardEntry.type}${rewardEntry.type === 'item' ? ` ${rewardEntry.itemKey}` : ` #${rewardEntry.pokemonId} lv${rewardEntry.level}`}]` : '')}
                      onPointerDown={editMode === 'texts' ? (e) => onEntityPointerDown(e, { kind: 'text', row: y, col: x }) : undefined}
                      style={{
                        position: 'absolute',
                        left: x * zoom,
                        top: y * zoom,
                        width: zoom,
                        height: zoom,
                        background: editMode === 'texts'
                          ? (hasReward ? 'rgba(255, 200, 80, 0.45)' : 'rgba(80, 160, 255, 0.45)')
                          : (hasReward ? 'rgba(255, 200, 80, 0.22)' : 'rgba(80, 160, 255, 0.18)'),
                        border: editMode === 'texts'
                          ? (hasReward ? '1px solid rgba(255, 220, 80, 0.95)' : '1px solid rgba(120, 180, 255, 0.95)')
                          : (hasReward ? '1px dashed rgba(255, 200, 80, 0.5)' : '1px dashed rgba(120, 180, 255, 0.4)'),
                        pointerEvents: editMode === 'texts' ? 'auto' : 'none',
                        cursor: editMode === 'texts' ? 'grab' : 'default',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: Math.max(10, zoom * 0.4),
                        color: hasReward ? '#ffdd88' : '#88ccff',
                        textShadow: '0 0 2px #000',
                        touchAction: 'none',
                      }}
                    >
                      {hasReward ? rewardIcon : '💬'}
                    </div>
                  );
                }).filter(Boolean)
              )}

              {/* Items overlay */}
              {items.map((it, i) => (
                <div
                  key={`i-${i}`}
                  title={`${it.itemKey}${it.hidden ? ' (oculto)' : ''}`}
                  onPointerDown={editMode === 'items' ? (e) => onEntityPointerDown(e, { kind: 'item', idx: i }) : undefined}
                  style={{
                    position: 'absolute',
                    left: it.pos.x * zoom,
                    top: it.pos.y * zoom,
                    width: zoom,
                    height: zoom,
                    background: editMode === 'items'
                      ? 'rgba(200, 120, 255, 0.45)'
                      : 'rgba(200, 120, 255, 0.18)',
                    border: editMode === 'items'
                      ? '1px solid rgba(220, 140, 255, 0.95)'
                      : '1px dashed rgba(220, 140, 255, 0.5)',
                    opacity: it.hidden ? 0.5 : 1,
                    pointerEvents: editMode === 'items' ? 'auto' : 'none',
                    cursor: editMode === 'items' ? 'grab' : 'default',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: Math.max(10, zoom * 0.4),
                    textShadow: '0 0 2px #000',
                    touchAction: 'none',
                  }}
                >
                  📦
                </div>
              ))}

              {/* Gifts overlay */}
              {gifts.map((g, i) => (
                <div
                  key={`gf-${i}`}
                  title={`#${g.pokemonId} lvl ${g.level} · ${g.questId}`}
                  onPointerDown={editMode === 'gifts' ? (e) => onEntityPointerDown(e, { kind: 'gift', idx: i }) : undefined}
                  style={{
                    position: 'absolute',
                    left: g.pos.x * zoom,
                    top: g.pos.y * zoom,
                    width: zoom,
                    height: zoom,
                    background: editMode === 'gifts'
                      ? 'rgba(255, 120, 200, 0.45)'
                      : 'rgba(255, 120, 200, 0.2)',
                    border: editMode === 'gifts'
                      ? '1px solid rgba(255, 140, 220, 0.95)'
                      : '1px dashed rgba(255, 140, 220, 0.5)',
                    pointerEvents: editMode === 'gifts' ? 'auto' : 'none',
                    cursor: editMode === 'gifts' ? 'grab' : 'default',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: Math.max(10, zoom * 0.4),
                    textShadow: '0 0 2px #000',
                    touchAction: 'none',
                  }}
                >
                  🎁
                </div>
              ))}

              {/* StaticPokemon overlay */}
              {staticPokemon.map((sp, i) => (
                <div
                  key={`stp-${i}`}
                  title={`#${sp.pokemonId} lvl ${sp.level} sprite=${sp.sprite} · ${sp.questId}`}
                  style={{
                    position: 'absolute',
                    left: sp.pos.x * zoom,
                    top: sp.pos.y * zoom,
                    width: zoom,
                    height: zoom,
                    background: editMode === 'static-pokemon'
                      ? 'rgba(80, 220, 180, 0.5)'
                      : 'rgba(80, 220, 180, 0.22)',
                    border: editMode === 'static-pokemon'
                      ? '1px solid rgba(80, 230, 180, 0.95)'
                      : '1px dashed rgba(80, 230, 180, 0.5)',
                    pointerEvents: 'none',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: Math.max(10, zoom * 0.4),
                    textShadow: '0 0 2px #000',
                  }}
                >
                  🐾
                </div>
              ))}

              {/* Cuttable Trees overlay */}
              {cuttableTrees.map((t, i) => (
                <div
                  key={`ct-${i}`}
                  title={`Árbol cortable · ${t.questId}`}
                  style={{
                    position: 'absolute',
                    left: t.pos.x * zoom,
                    top: t.pos.y * zoom,
                    width: zoom,
                    height: zoom,
                    background: editMode === 'cuttable-trees'
                      ? 'rgba(100, 200, 80, 0.55)'
                      : 'rgba(100, 200, 80, 0.22)',
                    border: editMode === 'cuttable-trees'
                      ? '1px solid rgba(120, 220, 80, 0.95)'
                      : '1px dashed rgba(120, 220, 80, 0.5)',
                    pointerEvents: 'none',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: Math.max(10, zoom * 0.5),
                  }}
                >
                  🌿
                </div>
              ))}

              {/* Árboles de bayas overlay (Gen II) */}
              {berryTrees.map((t, i) => (
                <div
                  key={`bt-${i}`}
                  title={`Árbol de bayas · ${t.itemKey}`}
                  style={{
                    position: 'absolute',
                    left: t.pos.x * zoom,
                    top: t.pos.y * zoom,
                    width: zoom,
                    height: zoom,
                    background: editMode === 'berry-trees'
                      ? 'rgba(200, 90, 120, 0.6)'
                      : 'rgba(200, 90, 120, 0.25)',
                    border: editMode === 'berry-trees'
                      ? '1px solid rgba(230, 140, 160, 0.95)'
                      : '1px dashed rgba(230, 140, 160, 0.5)',
                    pointerEvents: 'none',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: Math.max(10, zoom * 0.5),
                  }}
                >
                  🍒
                </div>
              ))}

              {/* Boulders overlay (MO Fuerza) */}
              {boulders.map((b, i) => (
                <div
                  key={`bo-${i}`}
                  title={`Roca (Fuerza) · ${b.id}`}
                  style={{
                    position: 'absolute',
                    left: b.pos.x * zoom,
                    top: b.pos.y * zoom,
                    width: zoom,
                    height: zoom,
                    background: editMode === 'boulders'
                      ? 'rgba(180, 150, 110, 0.6)'
                      : 'rgba(180, 150, 110, 0.25)',
                    border: editMode === 'boulders'
                      ? '1px solid rgba(210, 180, 130, 0.95)'
                      : '1px dashed rgba(210, 180, 130, 0.5)',
                    pointerEvents: 'none',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: Math.max(10, zoom * 0.5),
                  }}
                >
                  🪨
                </div>
              ))}

              {/* Spots overlay */}
              {([
                { key: 'start' as SpotKey, pos: startPos, emoji: '▶', color: '#ffffff' },
                { key: 'pokemonCenter' as SpotKey, pos: pokemonCenter, emoji: '🏥', color: '#ff6688' },
                { key: 'pc' as SpotKey, pos: pcPos, emoji: '💻', color: '#88ccff' },
                { key: 'store' as SpotKey, pos: storePos, emoji: '🛒', color: '#ffcc66' },
                { key: 'recoverLocation' as SpotKey, pos: recoverLocation, emoji: '✨', color: '#ccff88' },
                { key: 'onlineBattleNpc' as SpotKey, pos: onlineBattleNpc, emoji: '🌐', color: '#88aaff' },
              ]).map((sp) => sp.pos ? (
                <div
                  key={`sp-${sp.key}`}
                  title={`${sp.key} (${sp.pos.x}, ${sp.pos.y})`}
                  style={{
                    position: 'absolute',
                    left: sp.pos.x * zoom,
                    top: sp.pos.y * zoom,
                    width: zoom,
                    height: zoom,
                    background: editMode === 'spots' && activeSpot === sp.key
                      ? `${sp.color}80`
                      : `${sp.color}33`,
                    border: editMode === 'spots' && activeSpot === sp.key
                      ? `2px solid ${sp.color}`
                      : `1px dashed ${sp.color}`,
                    pointerEvents: 'none',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: Math.max(10, zoom * 0.45),
                    textShadow: '0 0 2px #000',
                  }}
                >
                  {sp.emoji}
                </div>
              ) : null)}

              {/* Future fly destination overlay (editor-only) */}
              {flyable && flySpot && (
                <div
                  title={`flySpot futuro (${flySpot.x}, ${flySpot.y})`}
                  style={{
                    position: 'absolute',
                    left: flySpot.x * zoom,
                    top: flySpot.y * zoom,
                    width: zoom,
                    height: zoom,
                    background: editMode === 'map' ? 'rgba(88, 183, 255, 0.5)' : 'rgba(88, 183, 255, 0.22)',
                    border: editMode === 'map' ? '2px solid #58b7ff' : '1px dashed #58b7ff',
                    pointerEvents: 'none',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: Math.max(10, zoom * 0.45),
                    textShadow: '0 0 2px #000',
                    zIndex: 8,
                  }}
                >
                  ✈
                </div>
              )}

              {/* Mechanics overlay: spinners + stoppers */}
              {Object.entries(spinners).flatMap(([rowKey, cols]) => {
                const y = parseInt(rowKey, 10);
                if (Number.isNaN(y)) return [];
                return Object.entries(cols).map(([colKey, dir]) => {
                  const x = parseInt(colKey, 10);
                  if (Number.isNaN(x)) return null;
                  const arrow = dir === 'up' ? '▲' : dir === 'down' ? '▼' : dir === 'left' ? '◀' : '▶';
                  return (
                    <div
                      key={`spin-${y}-${x}`}
                      title={`spinner ${dir} (${x}, ${y})`}
                      style={{
                        position: 'absolute',
                        left: x * zoom,
                        top: y * zoom,
                        width: zoom,
                        height: zoom,
                        background: editMode === 'mechanics'
                          ? 'rgba(204, 136, 255, 0.45)'
                          : 'rgba(204, 136, 255, 0.18)',
                        border: editMode === 'mechanics'
                          ? '1px solid rgba(204, 136, 255, 0.95)'
                          : '1px dashed rgba(204, 136, 255, 0.45)',
                        pointerEvents: 'none',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: Math.max(10, zoom * 0.45),
                        color: '#f0ccff',
                        textShadow: '0 0 2px #000',
                      }}
                    >
                      {arrow}
                    </div>
                  );
                }).filter(Boolean);
              })}
              {Object.entries(stoppers).flatMap(([rowKey, cols]) => {
                const y = parseInt(rowKey, 10);
                if (Number.isNaN(y)) return [];
                return cols.map((x) => (
                  <div
                    key={`stop-${y}-${x}`}
                    title={`stopper (${x}, ${y})`}
                    style={{
                      position: 'absolute',
                      left: x * zoom,
                      top: y * zoom,
                      width: zoom,
                      height: zoom,
                      background: editMode === 'mechanics'
                        ? 'rgba(255, 230, 100, 0.5)'
                        : 'rgba(255, 230, 100, 0.18)',
                      border: editMode === 'mechanics'
                        ? '1px solid rgba(255, 230, 100, 0.95)'
                        : '1px dashed rgba(255, 230, 100, 0.45)',
                      pointerEvents: 'none',
                      boxSizing: 'border-box',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: Math.max(10, zoom * 0.45),
                      color: '#fff0aa',
                      textShadow: '0 0 2px #000',
                    }}
                  >
                    ■
                  </div>
                ));
              })}

              {/* Portales overlay */}
              {portals.map((p, i) => {
                const colors = { door: '#88ff88', teleport: '#cc88ff', exit: '#88ccff' } as const;
                const emojis = { door: '🚪', teleport: '🌀', exit: '↪️' } as const;
                const isSel = editMode === 'portals' && selectedPortalIdx === i;
                const c = colors[p.kind];
                return (
                  <div
                    key={`pt-${i}`}
                    title={`${p.kind} (${p.pos.x},${p.pos.y})${p.destMap ? ` → ${p.destMap}` : ''}`}
                    onPointerDown={editMode === 'portals' ? (e) => onEntityPointerDown(e, { kind: 'portal', idx: i }) : undefined}
                    style={{
                      position: 'absolute',
                      left: p.pos.x * zoom,
                      top: p.pos.y * zoom,
                      width: zoom,
                      height: zoom,
                      background: isSel ? `${c}aa` : `${c}33`,
                      border: isSel ? `2px solid ${c}` : `1px dashed ${c}`,
                      pointerEvents: editMode === 'portals' ? 'auto' : 'none',
                      cursor: editMode === 'portals' ? 'grab' : 'default',
                      boxSizing: 'border-box',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: Math.max(10, zoom * 0.45),
                      textShadow: '0 0 2px #000',
                      touchAction: 'none',
                    }}
                  >
                    {emojis[p.kind]}
                  </div>
                );
              })}

              {/* NPCs */}
              {trainers.map((t, idx) => {
                const isSelected = idx === selectedIdx;
                const borderColor = npcBorderColor(t);
                return (
                  <div
                    key={idx}
                    onPointerDown={(e) => onPointerDown(e, idx)}
                    onContextMenu={(e) => onNpcRightClick(e, idx)}
                    onMouseEnter={(e) => {
                      const label = NPC_REGISTRY[t.npcKey]?.label ?? t.npcKey;
                      setTooltip({ text: `${label} (${t.pos.x}, ${t.pos.y})`, x: e.clientX + 12, y: e.clientY - 8 });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      position: 'absolute',
                      left: t.pos.x * zoom,
                      top: t.pos.y * zoom,
                      width: zoom,
                      height: zoom,
                      cursor: editMode === 'walls' ? 'cell' : 'grab',
                      zIndex: isSelected ? 100 : 10,
                      border: `2px solid ${isSelected ? '#ffffff' : borderColor}`,
                      borderRadius: 2,
                      boxShadow: isSelected ? `0 0 0 1px #fff, 0 0 8px ${borderColor}` : `0 0 4px ${borderColor}`,
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      background: isSelected ? 'rgba(255,255,255,0.08)' : 'transparent',
                      transition: 'box-shadow 0.1s',
                      // En modos no-NPC los sprites no capturan clicks: el canvas
                      // recibe pointerdown directo y se aplica la herramienta activa.
                      pointerEvents: editMode !== 'npc' ? 'none' : 'auto',
                      opacity: editMode !== 'npc' ? 0.6 : 1,
                    }}
                  >
                    {/* Sprite */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={spriteUrl(t.npcKey, t.facing)}
                      alt=""
                      draggable={false}
                      style={{ width: '100%', height: '100%', imageRendering: 'pixelated', display: 'block', objectFit: 'cover' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                    />
                    {/* Índice mini */}
                    {zoom >= 24 && (
                      <div style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: borderColor, fontSize: 8, padding: '0 2px', lineHeight: '12px', fontWeight: 700 }}>
                        {idx}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!currentMap && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#444' }}>
              Selecciona un mapa
            </div>
          )}
        </div>

        {/* ── Inspector ─────────────────────────────────────────────── */}
        <div style={{ width: 'clamp(264px, 24vw, 320px)', background: '#13132a', borderLeft: '1px solid #2a2a4a', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>

          {/* Header inspector */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #2a2a4a' }}>
            <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>
              Inspector — {currentMap
                ? `${currentMap.name} · ${trainers.length} NPCs · ${Object.values(walls).reduce((a, b) => a + b.length, 0)} walls`
                : 'sin mapa'}
            </div>
          </div>

          {/* Contenido inspector */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {editMode === 'walls' ? (
              <ModeHelpBlock
                emoji="🧱"
                title="Modo Walls"
                color="#ff8888"
                lines={[
                  'Click izquierdo: añadir/quitar pared',
                  'Arrastra para pintar varias casillas',
                  'El primer click decide si añade o quita',
                ]}
                count={Object.values(walls).reduce((a, b) => a + b.length, 0)}
                countLabel="walls"
                sourceFile={currentMap?.sourceFile}
              />
            ) : editMode === 'fences' ? (
              <ModeHelpBlock
                emoji="🚧"
                title="Modo Fences"
                color="#ffcc88"
                lines={[
                  'Click + arrastre: pintar/borrar fences',
                  'Bloquean el paso pero permiten saltar',
                ]}
                count={Object.values(fences).reduce((a, b) => a + b.length, 0)}
                countLabel="fences"
                sourceFile={currentMap?.sourceFile}
              />
            ) : editMode === 'grass' ? (
              <>
                <ModeHelpBlock
                  emoji="🌿"
                  title="Modo Grass"
                  color="#88ff88"
                  lines={[
                    'Click + arrastre: pintar/borrar hierba',
                    'En estos tiles aparecen pokémon salvajes (tabla walk)',
                  ]}
                  count={Object.values(grass).reduce((a, b) => a + b.length, 0)}
                  countLabel="grass"
                  sourceFile={currentMap?.sourceFile}
                />
                <EncountersTableEditor
                  title="🌿 Pokémon en hierba"
                  tableKey="walk"
                  table={encounters.walk ?? EMPTY_TABLE()}
                  onChange={(t) => {
                    setEncounters((e) => ({ ...e, walk: t }));
                    setDirty(true);
                  }}
                />
              </>
            ) : editMode === 'water' ? (
              <>
                <ModeHelpBlock
                  emoji="💧"
                  title="Modo Water"
                  color="#88aaff"
                  lines={[
                    'Click + arrastre: pintar/borrar agua',
                    'Bloquea el paso pero se puede pescar desde un tile adyacente',
                    'Cada caña tiene su propia tabla de aparición',
                  ]}
                  count={Object.values(water).reduce((a, b) => a + b.length, 0)}
                  countLabel="water"
                  sourceFile={currentMap?.sourceFile}
                />
                <EncountersTableEditor
                  title="🎣 Caña Vieja"
                  tableKey="oldRod"
                  table={encounters.oldRod ?? EMPTY_TABLE()}
                  onChange={(t) => {
                    setEncounters((e) => ({ ...e, oldRod: t }));
                    setDirty(true);
                  }}
                />
                <EncountersTableEditor
                  title="🎣 Caña Buena"
                  tableKey="goodRod"
                  table={encounters.goodRod ?? EMPTY_TABLE()}
                  onChange={(t) => {
                    setEncounters((e) => ({ ...e, goodRod: t }));
                    setDirty(true);
                  }}
                />
                <EncountersTableEditor
                  title="🎣 Súper Caña"
                  tableKey="superRod"
                  table={encounters.superRod ?? EMPTY_TABLE()}
                  onChange={(t) => {
                    setEncounters((e) => ({ ...e, superRod: t }));
                    setDirty(true);
                  }}
                />
                <EncountersTableEditor
                  title="🏄 Surfeando"
                  tableKey="surfSpots"
                  table={encounters.surfSpots ?? EMPTY_TABLE()}
                  onChange={(t) => {
                    setEncounters((e) => ({ ...e, surfSpots: t }));
                    setDirty(true);
                  }}
                />
              </>
            ) : editMode === 'texts' ? (
              <ModeHelpBlock
                emoji="💬"
                title="Modo Texts"
                color="#88ccff"
                lines={[
                  'Click en una casilla → texto + recompensa',
                  'Recompensa: pokemon ⭐ o item 📦 (se bloquea al tomar)',
                  'Sin recompensa → texto siempre visible 💬',
                ]}
                count={Object.values(texts).reduce((a, m) => a + Object.keys(m).length, 0)}
                countLabel="textos"
                sourceFile={currentMap?.sourceFile}
              />
            ) : editMode === 'items' ? (
              <ModeHelpBlock
                emoji="📦"
                title="Modo Items"
                color="#cc88ff"
                lines={[
                  'Click vacío: nuevo item (escribe ItemType)',
                  'Click en item: toggle visible/oculto, delete o cambiar tipo',
                  `${itemTypeKeys.length} ItemTypes válidos`,
                ]}
                count={items.length}
                countLabel="items"
                sourceFile={currentMap?.sourceFile}
              />
            ) : editMode === 'gifts' ? (
              <ModeHelpBlock
                emoji="🎁"
                title="Modo Gifts"
                color="#ff88cc"
                lines={[
                  'Click vacío: nueva pokéball-regalo',
                  'Click en regalo: editar o eliminar',
                  'Pokémon (1-251) + nivel + questId único',
                ]}
                count={gifts.length}
                countLabel="regalos"
                sourceFile={currentMap?.sourceFile}
              />
            ) : editMode === 'static-pokemon' ? (
              <ModeHelpBlock
                emoji="🐾"
                title="Pokémon Estático"
                color="#50ddb4"
                lines={[
                  'Click vacío: añadir Pokémon estático (Articuno-style)',
                  'Click en tile: editar o eliminar',
                  'Una vez combatido (captura/derrota) desaparece',
                  `Sprites: ${STATIC_POKEMON_SPRITES.join(', ')}`,
                ]}
                count={staticPokemon.length}
                countLabel="pokémon estáticos"
                sourceFile={currentMap?.sourceFile}
              />
            ) : editMode === 'cuttable-trees' ? (
              <ModeHelpBlock
                emoji="🌿"
                title="Árboles Cortables"
                color="#88cc55"
                lines={[
                  'Click vacío: añadir árbol cortable (bush.png)',
                  'Click en árbol existente: eliminar',
                  'Bloquea el paso hasta usar la MO Corte',
                  'Se persiste via questId en completedQuests',
                ]}
                count={cuttableTrees.length}
                countLabel="árboles cortables"
                sourceFile={currentMap?.sourceFile}
              />
            ) : editMode === 'berry-trees' ? (
              <ModeHelpBlock
                emoji="🍒"
                title="Árboles de bayas (Gen II)"
                color="#e88aa0"
                lines={[
                  'Click vacío: añadir árbol (elige la baya)',
                  'Click en árbol existente: eliminar',
                  `Bayas: ${BERRY_ITEM_KEYS.join(', ')}`,
                  'Da 1 baya al día (pulsar A de frente)',
                  'Rebrota a medianoche (hora del dispositivo)',
                  'Bloquea el paso como un muro',
                ]}
                count={berryTrees.length}
                countLabel="árboles de bayas"
                sourceFile={currentMap?.sourceFile}
              />
            ) : editMode === 'boulders' ? (
              <ModeHelpBlock
                emoji="🪨"
                title="Rocas (MO Fuerza)"
                color="#d2b482"
                lines={[
                  'Click vacío: añadir roca empujable',
                  'Click en roca existente: eliminar',
                  'Bloquea el paso hasta usar FUERZA (strength)',
                  'Se empuja 1 tile si el destino está libre',
                  'No persiste: vuelve a su sitio al recargar el mapa',
                ]}
                count={boulders.length}
                countLabel="rocas"
                sourceFile={currentMap?.sourceFile}
              />
            ) : editMode === 'spots' ? (
              <SpotsInspector
                activeSpot={activeSpot}
                setActiveSpot={setActiveSpot}
                startPos={startPos}
                pokemonCenter={pokemonCenter}
                pcPos={pcPos}
                storePos={storePos}
                storeItems={storeItems}
                itemTypeKeys={itemTypeKeys}
                recoverLocation={recoverLocation}
                onlineBattleNpc={onlineBattleNpc}
                onClear={(k) => {
                  if (k === 'start') return;
                  if (k === 'pokemonCenter') setPokemonCenter(null);
                  else if (k === 'pc') setPcPos(null);
                  else if (k === 'store') setStorePos(null);
                  else if (k === 'recoverLocation') setRecoverLocation(null);
                  else setOnlineBattleNpc(null);
                  setDirty(true);
                }}
                onStoreItemsChange={(next) => {
                  setStoreItems(next);
                  setDirty(true);
                }}
                sourceFile={currentMap?.sourceFile}
              />
            ) : editMode === 'mechanics' ? (
              <MechanicsInspector
                activeMechanic={activeMechanic}
                setActiveMechanic={setActiveMechanic}
                spinners={spinners}
                stoppers={stoppers}
                sourceFile={currentMap?.sourceFile}
              />
            ) : editMode === 'map' ? (
              <MapMetaInspector
                currentMap={currentMap}
                cave={cave}
                setCave={(v) => { setCave(v); setDirty(true); }}
                dark={dark}
                setDark={(v) => { setDark(v); setDirty(true); }}
                allowBicycle={allowBicycle}
                setAllowBicycle={(v) => { setAllowBicycle(v); setDirty(true); }}
                flyable={flyable}
                setFlyable={(v) => { setFlyable(v); setDirty(true); }}
                flySpot={flySpot}
                setFlySpot={(v) => { setFlySpot(v); setDirty(true); }}
                musicField={musicField}
                setMusicField={(v) => { setMusicField(v); setDirty(true); }}
                musicTracks={musicTracks}
                startPos={startPos}
                onlineBattleNpc={onlineBattleNpc}
                spinnersCount={Object.values(spinners).reduce((a, m) => a + Object.keys(m).length, 0)}
                stoppersCount={Object.values(stoppers).reduce((a, b) => a + b.length, 0)}
                storeItemsCount={storeItems.length}
              />
            ) : editMode === 'portals' ? (
              <PortalsInspector
                portals={portals}
                selectedIdx={selectedPortalIdx}
                setSelectedIdx={setSelectedPortalIdx}
                activePortalKind={activePortalKind}
                setActivePortalKind={setActivePortalKind}
                exitReturnMap={exitReturnMap}
                setExitReturnMap={(v) => { setExitReturnMap(v); setDirty(true); }}
                exitReturnPos={exitReturnPos}
                setExitReturnPos={(v) => { setExitReturnPos(v); setDirty(true); }}
                mapIds={Object.keys(mapData).sort()}
                onUpdate={(idx, patch) => {
                  setPortals((ps) => ps.map((p, i) => i === idx ? { ...p, ...patch } : p));
                  setDirty(true);
                }}
                onDelete={(idx) => {
                  setPortals((ps) => ps.filter((_, i) => i !== idx));
                  setSelectedPortalIdx(null);
                  setDirty(true);
                }}
                sourceFile={currentMap?.sourceFile}
              />
            ) : selected === null ? (
              <div style={{ color: '#444', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>👆</div>
                Click en un NPC para editarlo<br />
                Click en el canvas para deseleccionar<br />
                <br />
                <span style={{ fontSize: 11 }}>Clic derecho → eliminar NPC</span>
              </div>
            ) : (
              <InspectorPanel
                trainer={selected}
                idx={selectedIdx!}
                onChange={updateSelected}
                onDelete={() => deleteNpc(selectedIdx!)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{ position: 'fixed', left: tooltip.x, top: tooltip.y, background: 'rgba(0,0,0,0.85)', color: '#fff', fontSize: 12, padding: '4px 8px', borderRadius: 4, pointerEvents: 'none', zIndex: 9999, fontFamily: 'monospace' }}>
          {tooltip.text}
        </div>
      )}
    </div>
  );
}

// ── Inspector Panel ────────────────────────────────────────────────────────

function InspectorPanel({ trainer, idx, onChange, onDelete }: {
  trainer: Trainer;
  idx: number;
  onChange: (patch: Partial<Trainer>) => void;
  onDelete: () => void;
}) {
  const reg = NPC_REGISTRY[trainer.npcKey];
  const sprite = spriteUrl(trainer.npcKey, trainer.facing);
  const portrait = portraitUrl(trainer.npcKey);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Avatar (walk sprite + portrait) + nombre */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sprite} alt="" style={{ width: 32, height: 32, imageRendering: 'pixelated', border: `2px solid ${npcBorderColor(trainer)}`, borderRadius: 4, background: '#0a0a18' }} onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.2'; }} />
          {portrait && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={portrait} alt="" title="Portrait" style={{ width: 32, height: 32, imageRendering: 'pixelated', border: '2px solid #5a5a8a', borderRadius: 4, background: '#0a0a18' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{reg?.label ?? trainer.npcKey}</div>
          <div style={{ color: '#666', fontSize: 11 }}>NPC #{idx} · pos ({trainer.pos.x}, {trainer.pos.y})</div>
        </div>
      </div>

      {/* Tipo NPC */}
      <div>
        <label style={labelStyle}>Tipo de NPC</label>
        <select value={trainer.npcKey} onChange={(e) => onChange({ npcKey: e.target.value })} style={{ ...inputStyle, height: 30 }}>
          {Object.entries(NPC_REGISTRY).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Facing */}
      <div>
        <label style={labelStyle}>Dirección (facing)</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['up', 'down', 'left', 'right'] as const).map((dir) => {
            const icons = { up: '▲', down: '▼', left: '◀', right: '▶' };
            return (
              <button key={dir} onClick={() => onChange({ facing: dir })} style={{ flex: 1, padding: '6px 0', background: trainer.facing === dir ? '#5050b0' : '#1a1a3a', border: '1px solid #3a3a5a', borderRadius: 4, color: trainer.facing === dir ? '#fff' : '#888', cursor: 'pointer', fontSize: 14 }}>
                {icons[dir]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Posición */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>X</label>
          <input type="number" value={trainer.pos.x} onChange={(e) => onChange({ pos: { ...trainer.pos, x: parseInt(e.target.value) || 0 } })} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Y</label>
          <input type="number" value={trainer.pos.y} onChange={(e) => onChange({ pos: { ...trainer.pos, y: parseInt(e.target.value) || 0 } })} style={inputStyle} />
        </div>
      </div>

      {/* Pokémon */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Pokémon</label>
        {trainer.pokemon.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
            {/* Sprite del pokémon */}
            {p.id > 0 && p.id <= MAX_POKEMON_ID && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/editor/pokemon/${p.id}.png`}
                alt={POKEMON_NAMES_EDITOR[p.id] ?? `#${p.id}`}
                title={`#${p.id} ${POKEMON_NAMES_EDITOR[p.id] ?? ''}`}
                style={{ width: 24, height: 24, imageRendering: 'pixelated', flexShrink: 0, background: '#0a0a18', borderRadius: 2 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <input type="number" value={p.id} placeholder="#ID" onChange={(e) => {
              const next = trainer.pokemon.map((pk, j) => j === i ? { ...pk, id: parseInt(e.target.value) || 0 } : pk);
              onChange({ pokemon: next });
            }} style={{ ...inputStyle, width: 60 }} />
            <span style={{ color: '#666', fontSize: 12 }}>Lv</span>
            <input type="number" value={p.level} onChange={(e) => {
              const next = trainer.pokemon.map((pk, j) => j === i ? { ...pk, level: parseInt(e.target.value) || 1 } : pk);
              onChange({ pokemon: next });
            }} style={{ ...inputStyle, width: 50 }} />
            <button onClick={() => onChange({ pokemon: trainer.pokemon.filter((_, j) => j !== i) })} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
          </div>
        ))}
        <button onClick={() => onChange({ pokemon: [...trainer.pokemon, { id: 19, level: 2 }] })} style={{ fontSize: 12, background: '#1a2a1a', border: '1px solid #3a5a3a', borderRadius: 4, color: '#88ff88', cursor: 'pointer', padding: '3px 10px' }}>
          + Pokémon
        </button>
      </div>

      {/* postGame (solo lectura) */}
      {trainer.postGame && (
        <div style={{ ...sectionStyle, background: '#1a1a0a', border: '1px solid #5a5a00', borderRadius: 6, padding: '10px 12px', marginTop: 12 }}>
          <div style={{ color: '#cccc00', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
            ⚠ postGame (solo lectura)
          </div>
          <div style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>
            Este trainer da ítems/insignias tras ganar. Se preserva en el export automáticamente.
          </div>
          <pre style={{ color: '#aaaa44', fontSize: 10, background: '#0a0a00', padding: 8, borderRadius: 4, overflow: 'auto', maxHeight: 120, margin: 0, fontFamily: 'monospace' }}>
            {trainer.postGame}
          </pre>
        </div>
      )}

      {/* Intro */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Intro (combate)</label>
          <span style={{ fontSize: 10, color: trainer.intro.length === 0 ? '#5588ff' : '#ff5555' }}>
            {trainer.intro.length === 0 ? 'Solo diálogo' : 'Combat'}
          </span>
        </div>
        <textarea
          value={trainer.intro.join('\n')}
          onChange={(e) => onChange({ intro: e.target.value ? e.target.value.split('\n') : [] })}
          placeholder="Vacío = sin combate (1 línea = 1 texto)"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
        />
      </div>

      {/* Outtro */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Outtro (post-derrota / sólo diálogo)</label>
        <textarea
          value={trainer.outtro.join('\n')}
          onChange={(e) => onChange({ outtro: e.target.value ? e.target.value.split('\n') : [] })}
          placeholder="1 línea = 1 texto"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
        />
      </div>

      {/* Money */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Dinero</label>
        <input type="number" value={trainer.money} onChange={(e) => onChange({ money: parseInt(e.target.value) || 0 })} style={inputStyle} />
      </div>

      {/* Flags */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Opciones</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={trainer.persistent} onChange={(e) => onChange({ persistent: e.target.checked })} style={{ accentColor: '#f5c518' }} />
            <span>Persistent <span style={{ color: '#555', fontSize: 11 }}>(no desaparece tras derrota)</span></span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={trainer.isOnline} onChange={(e) => onChange({ isOnline: e.target.checked })} style={{ accentColor: '#5588ff' }} />
            <span>isOnline <span style={{ color: '#555', fontSize: 11 }}>(batalla repetible)</span></span>
          </label>
        </div>
      </div>

      {/* Hide condition */}
      {(() => {
        const isDefeated = trainer.hideCondition?.startsWith('trainer-defeated:');
        const hideType = isDefeated ? 'trainer-defeated' : (trainer.hideCondition ?? '');
        const defeatedId = isDefeated ? trainer.hideCondition!.slice('trainer-defeated:'.length) : '';
        return (
          <div style={sectionStyle}>
            <label style={labelStyle}>Hide Condition</label>
            <select
              value={hideType}
              onChange={(e) => {
                const v = e.target.value;
                if (v === 'trainer-defeated') onChange({ hideCondition: 'trainer-defeated:' });
                else onChange({ hideCondition: v || null });
              }}
              style={{ ...inputStyle, height: 30 }}
            >
              <option value="">— ninguna —</option>
              <option value="has-pokemon">has-pokemon</option>
              <option value="trainer-defeated">trainer-defeated: …</option>
            </select>
            {hideType === 'trainer-defeated' && (
              <input
                value={defeatedId}
                placeholder="mapId-x-y  (ej: pewter-city-gym-4-1)"
                onChange={(e) => onChange({ hideCondition: `trainer-defeated:${e.target.value}` })}
                style={{ ...inputStyle, marginTop: 4 }}
              />
            )}
          </div>
        );
      })()}

      {/* Sight range */}
      <div style={sectionStyle}>
        <label style={labelStyle}>
          Distancia de visión <span style={{ color: '#555', fontSize: 11 }}>(0 = solo al hablar)</span>
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="number"
            min={0}
            max={20}
            value={trainer.sightRange ?? ''}
            placeholder="5 (default)"
            onChange={(e) => {
              const v = e.target.value;
              onChange({ sightRange: v === '' ? null : Math.max(0, parseInt(v, 10) || 0) });
            }}
            style={inputStyle}
          />
          {trainer.sightRange !== null && (
            <button
              onClick={() => onChange({ sightRange: null })}
              style={{ padding: '4px 8px', background: '#1a1a2a', border: '1px solid #3a3a5a', borderRadius: 4, color: '#88aacc', cursor: 'pointer', fontSize: 11 }}
              title="Quitar override y usar el valor global (5)"
            >
              default
            </button>
          )}
        </div>
      </div>

      {/* Eliminar */}
      <div style={{ ...sectionStyle, marginTop: 20 }}>
        <button onClick={() => {
          if (confirm('¿Eliminar este NPC?')) onDelete();
        }} style={{ width: '100%', padding: '8px', background: '#2a1a1a', border: '1px solid #5a2a2a', borderRadius: 4, color: '#ff6b6b', cursor: 'pointer', fontSize: 13 }}>
          🗑 Eliminar NPC
        </button>
      </div>
    </div>
  );
}

// ── Editor de tabla de encounters (walk / oldRod / goodRod / superRod) ──

// Total de Pokémon admitidos en el editor (Gen I + Gen II = 251).
const MAX_POKEMON_ID = 251;

// Nombres Pokémon (índice 0 = vacío, 1 = Bulbasaur … 251 = Celebi).
const POKEMON_NAMES_EDITOR = [
  '', 'Bulbasaur', 'Ivysaur', 'Venusaur', 'Charmander', 'Charmeleon', 'Charizard',
  'Squirtle', 'Wartortle', 'Blastoise', 'Caterpie', 'Metapod', 'Butterfree',
  'Weedle', 'Kakuna', 'Beedrill', 'Pidgey', 'Pidgeotto', 'Pidgeot', 'Rattata',
  'Raticate', 'Spearow', 'Fearow', 'Ekans', 'Arbok', 'Pikachu', 'Raichu',
  'Sandshrew', 'Sandslash', 'Nidoran♀', 'Nidorina', 'Nidoqueen', 'Nidoran♂',
  'Nidorino', 'Nidoking', 'Clefairy', 'Clefable', 'Vulpix', 'Ninetales',
  'Jigglypuff', 'Wigglytuff', 'Zubat', 'Golbat', 'Oddish', 'Gloom', 'Vileplume',
  'Paras', 'Parasect', 'Venonat', 'Venomoth', 'Diglett', 'Dugtrio', 'Meowth',
  'Persian', 'Psyduck', 'Golduck', 'Mankey', 'Primeape', 'Growlithe', 'Arcanine',
  'Poliwag', 'Poliwhirl', 'Poliwrath', 'Abra', 'Kadabra', 'Alakazam', 'Machop',
  'Machoke', 'Machamp', 'Bellsprout', 'Weepinbell', 'Victreebel', 'Tentacool',
  'Tentacruel', 'Geodude', 'Graveler', 'Golem', 'Ponyta', 'Rapidash', 'Slowpoke',
  'Slowbro', 'Magnemite', 'Magneton', "Farfetch'd", 'Doduo', 'Dodrio', 'Seel',
  'Dewgong', 'Grimer', 'Muk', 'Shellder', 'Cloyster', 'Gastly', 'Haunter',
  'Gengar', 'Onix', 'Drowzee', 'Hypno', 'Krabby', 'Kingler', 'Voltorb',
  'Electrode', 'Exeggcute', 'Exeggutor', 'Cubone', 'Marowak', 'Hitmonlee',
  'Hitmonchan', 'Lickitung', 'Koffing', 'Weezing', 'Rhyhorn', 'Rhydon', 'Chansey',
  'Tangela', 'Kangaskhan', 'Horsea', 'Seadra', 'Goldeen', 'Seaking', 'Staryu',
  'Starmie', 'Mr. Mime', 'Scyther', 'Jynx', 'Electabuzz', 'Magmar', 'Pinsir',
  'Tauros', 'Magikarp', 'Gyarados', 'Lapras', 'Ditto', 'Eevee', 'Vaporeon',
  'Jolteon', 'Flareon', 'Porygon', 'Omanyte', 'Omastar', 'Kabuto', 'Kabutops',
  'Aerodactyl', 'Snorlax', 'Articuno', 'Zapdos', 'Moltres', 'Dratini',
  'Dragonair', 'Dragonite', 'Mewtwo', 'Mew',
  // Gen II (152-251)
  'Chikorita', 'Bayleef', 'Meganium', 'Cyndaquil', 'Quilava', 'Typhlosion',
  'Totodile', 'Croconaw', 'Feraligatr', 'Sentret', 'Furret', 'Hoothoot',
  'Noctowl', 'Ledyba', 'Ledian', 'Spinarak', 'Ariados', 'Crobat', 'Chinchou',
  'Lanturn', 'Pichu', 'Cleffa', 'Igglybuff', 'Togepi', 'Togetic', 'Natu', 'Xatu',
  'Mareep', 'Flaaffy', 'Ampharos', 'Bellossom', 'Marill', 'Azumarill', 'Sudowoodo',
  'Politoed', 'Hoppip', 'Skiploom', 'Jumpluff', 'Aipom', 'Sunkern', 'Sunflora',
  'Yanma', 'Wooper', 'Quagsire', 'Espeon', 'Umbreon', 'Murkrow', 'Slowking',
  'Misdreavus', 'Unown', 'Wobbuffet', 'Girafarig', 'Pineco', 'Forretress',
  'Dunsparce', 'Gligar', 'Steelix', 'Snubbull', 'Granbull', 'Qwilfish', 'Scizor',
  'Shuckle', 'Heracross', 'Sneasel', 'Teddiursa', 'Ursaring', 'Slugma', 'Magcargo',
  'Swinub', 'Piloswine', 'Corsola', 'Remoraid', 'Octillery', 'Delibird', 'Mantine',
  'Skarmory', 'Houndour', 'Houndoom', 'Kingdra', 'Phanpy', 'Donphan', 'Porygon2',
  'Stantler', 'Smeargle', 'Tyrogue', 'Hitmontop', 'Smoochum', 'Elekid', 'Magby',
  'Miltank', 'Blissey', 'Raikou', 'Entei', 'Suicune', 'Larvitar', 'Pupitar',
  'Tyranitar', 'Lugia', 'Ho-Oh', 'Celebi',
];

// Alias retro-compatible (existían usos antiguos como `GEN1_NAMES[...]`).
const GEN1_NAMES = POKEMON_NAMES_EDITOR;

/**
 * Editor de tabla de encuentros: sprite + ID + nombre + niveles +
 * barra de probabilidad. Diseño de tarjeta compacta por pokémon.
 *
 * - `rate`: 0–255 (Gen I). 0 = sin encuentros.
 * - `chance`: peso relativo. Probabilidad real = chance / sum(chances).
 */
function EncountersTableEditor({
  title, tableKey, table, onChange,
}: {
  title: string;
  tableKey: 'walk' | 'oldRod' | 'goodRod' | 'superRod' | 'surfSpots';
  table: { rate: number; pokemon: { id: number; chance: number; minLevel: number; maxLevel: number; conditionValues: { name: string; url: string }[]; timesOfDay?: ('morning' | 'day' | 'night')[] }[] };
  onChange: (
    next: { rate: number; pokemon: { id: number; chance: number; minLevel: number; maxLevel: number; conditionValues: { name: string; url: string }[]; timesOfDay?: ('morning' | 'day' | 'night')[] }[] }
  ) => void;
}) {
  const totalChance = table.pokemon.reduce((a, b) => a + (b.chance || 0), 0) || 1;

  function update(idx: number, patch: Partial<{ id: number; chance: number; minLevel: number; maxLevel: number }>) {
    onChange({ ...table, pokemon: table.pokemon.map((p, i) => i === idx ? { ...p, ...patch } : p) });
  }

  function remove(idx: number) {
    onChange({ ...table, pokemon: table.pokemon.filter((_, i) => i !== idx) });
  }

  // Alterna un tramo horario (Gen II) en la entrada `idx`. Si tras alternar
  // quedan los 3 tramos o ninguno, se deja `timesOfDay` sin definir (= 24 h).
  const ALL_SEGMENTS: ('morning' | 'day' | 'night')[] = ['morning', 'day', 'night'];
  function toggleTime(idx: number, seg: 'morning' | 'day' | 'night') {
    onChange({
      ...table,
      pokemon: table.pokemon.map((p, i) => {
        if (i !== idx) return p;
        const cur = p.timesOfDay && p.timesOfDay.length ? p.timesOfDay : ALL_SEGMENTS;
        const has = cur.includes(seg);
        const next = has ? cur.filter((s) => s !== seg) : ALL_SEGMENTS.filter((s) => cur.includes(s) || s === seg);
        // 24 h (todos o ninguno) → sin restricción (timesOfDay undefined).
        const restricted = next.length > 0 && next.length < ALL_SEGMENTS.length;
        return { ...p, timesOfDay: restricted ? next : undefined };
      }),
    });
  }

  function add() {
    onChange({
      ...table,
      pokemon: [...table.pokemon, { id: 129, chance: 10, minLevel: 5, maxLevel: 5, conditionValues: [] }],
    });
  }

  function setRate(rate: number) {
    onChange({ ...table, rate: Math.max(0, Math.min(255, Math.round(rate))) });
  }

  const inputBase: React.CSSProperties = {
    background: '#0a0a1e',
    border: '1px solid #3a3a5a',
    color: '#e0e0ff',
    borderRadius: 4,
    padding: '3px 6px',
    fontSize: 12,
    textAlign: 'center' as const,
    width: '100%',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ marginTop: 18, background: '#0d0d22', border: '1px solid #2a2a4a', borderRadius: 8, overflow: 'hidden' }}>
      {/* Cabecera */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #2a2a4a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#12122e' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#e0e0ff' }}>{title}</div>
        <div style={{ fontSize: 10, color: '#555', fontFamily: 'monospace', background: '#1a1a3a', padding: '2px 6px', borderRadius: 3 }}>{tableKey}</div>
      </div>

      {/* Rate */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #1a1a36', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap' }}>Rate (0–255)</span>
        <input
          type="number"
          min={0}
          max={255}
          value={table.rate}
          onChange={(e) => setRate(parseInt(e.target.value, 10) || 0)}
          style={{ ...inputBase, width: 64, flexShrink: 0 }}
        />
        <div style={{ flex: 1, height: 4, background: '#1a1a3a', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(table.rate / 255) * 100}%`, background: table.rate === 0 ? '#333' : '#5588ff', borderRadius: 2, transition: 'width 0.2s' }} />
        </div>
        <span style={{ fontSize: 11, color: table.rate === 0 ? '#555' : '#88aaff', whiteSpace: 'nowrap', minWidth: 90 }}>
          {table.rate === 0 ? 'sin encuentros' : `${((table.rate / 255) * 100).toFixed(1)}% / paso`}
        </span>
      </div>

      {/* Lista pokémon */}
      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {table.pokemon.length === 0 && (
          <div style={{ padding: '12px 4px', fontSize: 11, color: '#555', fontStyle: 'italic', textAlign: 'center' }}>
            Sin pokémon · usa el botón de abajo para añadir
          </div>
        )}
        {table.pokemon.map((p, i) => {
          const pct = ((p.chance / totalChance) * 100).toFixed(1);
          const name = (p.id >= 1 && p.id <= MAX_POKEMON_ID) ? POKEMON_NAMES_EDITOR[p.id] : `#${p.id}`;
          const spriteOk = p.id >= 1 && p.id <= MAX_POKEMON_ID;
          return (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '52px 1fr',
                gap: 8,
                alignItems: 'center',
                background: '#0a0a20',
                border: '1px solid #222240',
                borderRadius: 6,
                padding: '8px',
              }}
            >
              {/* Sprite */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 52, height: 52, background: '#111130', borderRadius: 5, flexShrink: 0, border: '1px solid #2a2a4a' }}>
                {spriteOk ? (
                  <img
                    src={`/editor/pokemon/${p.id}.png`}
                    alt={name}
                    style={{ width: 44, height: 44, imageRendering: 'pixelated', objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ fontSize: 20, color: '#444' }}>?</span>
                )}
              </div>

              {/* Datos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
                {/* Fila 1: ID + nombre + borrar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: '#666', flexShrink: 0 }}>#</span>
                  <input
                    type="number"
                    min={1}
                    max={MAX_POKEMON_ID}
                    value={p.id}
                    onChange={(e) => update(i, { id: Math.max(1, Math.min(MAX_POKEMON_ID, parseInt(e.target.value, 10) || 1)) })}
                    title={`ID Pokémon (1–${MAX_POKEMON_ID})`}
                    style={{ ...inputBase, width: 52, flexShrink: 0, fontWeight: 700, fontSize: 13, color: '#ffffaa' }}
                  />
                  <span style={{ fontSize: 12, color: '#ccccee', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {name}
                  </span>
                  <button
                    onClick={() => remove(i)}
                    title="Eliminar"
                    style={{ flexShrink: 0, width: 22, height: 22, padding: 0, background: '#2a1010', border: '1px solid #5a2a2a', color: '#ff6666', borderRadius: 4, fontSize: 14, cursor: 'pointer', lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>

                {/* Fila 2: Niveles + chance */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 10, color: '#666', flexShrink: 0, minWidth: 14 }}>Lv</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={p.minLevel}
                    onChange={(e) => {
                      const v = Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1));
                      update(i, { minLevel: v, maxLevel: Math.max(v, p.maxLevel) });
                    }}
                    title="Nivel mínimo"
                    style={{ ...inputBase, width: 44, flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 10, color: '#555', flexShrink: 0 }}>–</span>
                  <input
                    type="number"
                    min={p.minLevel}
                    max={100}
                    value={p.maxLevel}
                    onChange={(e) => update(i, { maxLevel: Math.max(p.minLevel, Math.min(100, parseInt(e.target.value, 10) || p.minLevel)) })}
                    title="Nivel máximo"
                    style={{ ...inputBase, width: 44, flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }} />
                  {/* Barra de probabilidad */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <input
                      type="number"
                      min={0}
                      value={p.chance}
                      onChange={(e) => update(i, { chance: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      title={`Peso relativo (${pct}% de aparición)`}
                      style={{ ...inputBase, width: 44, flexShrink: 0 }}
                    />
                    <div style={{ position: 'relative', width: 36, height: 14, background: '#1a1a3a', borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.min(100, parseFloat(pct))}%`, background: parseFloat(pct) > 40 ? '#88ff88' : parseFloat(pct) > 15 ? '#ffcc55' : '#5599ff', transition: 'width 0.2s' }} />
                      <span style={{ position: 'relative', zIndex: 1, fontSize: 8, color: '#fff', width: '100%', display: 'block', textAlign: 'center', lineHeight: '14px', fontWeight: 700, textShadow: '0 0 3px #000' }}>{pct}%</span>
                    </div>
                  </div>
                </div>

                {/* Fila 3: tramos horarios (Gen II). Ninguno marcado = 24 h. */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 10, color: '#666', flexShrink: 0, minWidth: 14 }} title="Tramos horarios en que aparece (Gen II). Vacío = 24 h.">⏰</span>
                  {([
                    ['morning', 'Mañana'],
                    ['day', 'Día'],
                    ['night', 'Noche'],
                  ] as ['morning' | 'day' | 'night', string][]).map(([seg, label]) => {
                    const restricted = !!(p.timesOfDay && p.timesOfDay.length);
                    const on = restricted ? p.timesOfDay!.includes(seg) : true;
                    return (
                      <button
                        key={seg}
                        onClick={() => toggleTime(i, seg)}
                        title={restricted ? '' : '24 h — pulsa para restringir'}
                        style={{
                          flex: 1,
                          padding: '3px 0',
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: 'pointer',
                          borderRadius: 4,
                          border: on ? '1px solid #3a7a3a' : '1px solid #2a2a4a',
                          background: on ? (restricted ? '#16361a' : '#101a28') : '#0a0a20',
                          color: on ? (restricted ? '#88ff88' : '#5577aa') : '#445',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                  <span style={{ fontSize: 9, color: '#555', flexShrink: 0, minWidth: 40, textAlign: 'right' }}>
                    {p.timesOfDay && p.timesOfDay.length ? `${p.timesOfDay.length}/3` : '24 h'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        <button
          onClick={add}
          style={{ marginTop: 2, padding: '7px 0', background: '#0f2a0f', border: '1px dashed #3a7a3a', color: '#88ff88', borderRadius: 5, fontSize: 12, cursor: 'pointer', width: '100%' }}
        >
          + Añadir pokémon
        </button>
      </div>
    </div>
  );
}

// ── Bloque de ayuda genérico para modos masivos (walls, fences, grass, texts, items, gifts) ──

function ModeHelpBlock({
  emoji, title, color, lines, count, countLabel, sourceFile,
}: {
  emoji: string;
  title: string;
  color: string;
  lines: string[];
  count: number;
  countLabel: string;
  sourceFile?: string;
}) {
  return (
    <div style={{ color: '#ccc', fontSize: 13, lineHeight: 1.6 }}>
      <div style={{ fontSize: 32, marginBottom: 8, textAlign: 'center' }}>{emoji}</div>
      <p style={{ color, fontWeight: 700, marginBottom: 12 }}>{title} activo</p>
      <ul style={{ paddingLeft: 18, color: '#aaa', fontSize: 12 }}>
        {lines.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
      <div style={{ marginTop: 16, padding: 12, background: '#1a1530', border: '1px solid #5a3a3a', borderRadius: 4, fontSize: 11, color: '#ff9999' }}>
        ⚠️ Al guardar se persisten en Supabase. Para que el juego use estos cambios pega el bloque exportado en <code>{sourceFile ?? '*.ts'}</code>, o regenera <code>map-data.json</code> con <code>npm run editor:setup</code>.
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: '#777' }}>
        Total {countLabel}: <span style={{ color, fontWeight: 700 }}>{count}</span>
      </div>
    </div>
  );
}

// ── Inspector de Spots (pokemonCenter / pc / store / recoverLocation) ──

function SpotsInspector({
  activeSpot, setActiveSpot,
  startPos, pokemonCenter, pcPos, storePos, storeItems, itemTypeKeys, recoverLocation, onlineBattleNpc,
  onClear, onStoreItemsChange, sourceFile,
}: {
  activeSpot: SpotKey;
  setActiveSpot: (k: SpotKey) => void;
  startPos: { x: number; y: number } | null;
  pokemonCenter: { x: number; y: number } | null;
  pcPos: { x: number; y: number } | null;
  storePos: { x: number; y: number } | null;
  storeItems: string[];
  itemTypeKeys: string[];
  recoverLocation: { x: number; y: number } | null;
  onlineBattleNpc: { x: number; y: number } | null;
  onClear: (k: SpotKey) => void;
  onStoreItemsChange: (next: string[]) => void;
  sourceFile?: string;
}) {
  const spots: { key: SpotKey; label: string; emoji: string; color: string; pos: { x: number; y: number } | null; required?: boolean }[] = [
    { key: 'start', label: 'Start', emoji: '▶', color: '#ffffff', pos: startPos, required: true },
    { key: 'pokemonCenter', label: 'Pokémon Center', emoji: '🏥', color: '#ff6688', pos: pokemonCenter },
    { key: 'pc', label: 'PC', emoji: '💻', color: '#88ccff', pos: pcPos },
    { key: 'store', label: 'Store', emoji: '🛒', color: '#ffcc66', pos: storePos },
    { key: 'recoverLocation', label: 'Recover Location', emoji: '✨', color: '#ccff88', pos: recoverLocation },
    { key: 'onlineBattleNpc', label: 'Online Battle NPC', emoji: '🌐', color: '#88aaff', pos: onlineBattleNpc },
  ];
  return (
    <div style={{ color: '#ccc', fontSize: 13, lineHeight: 1.6 }}>
      <div style={{ fontSize: 32, marginBottom: 8, textAlign: 'center' }}>📍</div>
      <p style={{ color: '#ccff88', fontWeight: 700, marginBottom: 12 }}>Modo Spots activo</p>
      <p style={{ color: '#aaa', fontSize: 12, marginBottom: 16 }}>
        Selecciona qué spot editar y haz click en una casilla del mapa para colocarlo.
        Click sobre el mismo tile lo elimina salvo en Start.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {spots.map((sp) => (
          <div
            key={sp.key}
            onClick={() => setActiveSpot(sp.key)}
            style={{
              padding: 8,
              background: activeSpot === sp.key ? `${sp.color}22` : '#0f0f1a',
              border: `2px solid ${activeSpot === sp.key ? sp.color : '#2a2a4a'}`,
              borderRadius: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 18 }}>{sp.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: sp.color, fontWeight: 700, fontSize: 12 }}>{sp.label}</div>
              <div style={{ color: '#666', fontSize: 11 }}>
                {sp.pos ? `(${sp.pos.x}, ${sp.pos.y})` : (sp.required ? '— requerido —' : '— vacío —')}
              </div>
            </div>
            {sp.pos && !sp.required && (
              <button
                onClick={(e) => { e.stopPropagation(); onClear(sp.key); }}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14 }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      {(activeSpot === 'store' || storePos || storeItems.length > 0) && (
        <div style={{ marginTop: 14, padding: 10, background: '#0f0f1a', border: '1px solid #2a2a4a', borderRadius: 4 }}>
          <div style={{ color: '#ffcc66', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Store Items</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {storeItems.map((item, idx) => (
              <div key={`${item}-${idx}`} style={{ display: 'flex', gap: 6 }}>
                <select
                  value={item}
                  onChange={(e) => onStoreItemsChange(storeItems.map((it, i) => i === idx ? e.target.value : it))}
                  style={{ ...inputStyle, height: 28 }}
                >
                  {itemTypeKeys.map((key) => <option key={key} value={key}>{key}</option>)}
                </select>
                <button
                  onClick={() => onStoreItemsChange(storeItems.filter((_, i) => i !== idx))}
                  style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14 }}
                >
                  ×
                </button>
              </div>
            ))}
            {storeItems.length === 0 && (
              <div style={{ color: '#555', fontSize: 11, textAlign: 'center', padding: 6 }}>Sin storeItems</div>
            )}
            <button
              onClick={() => onStoreItemsChange([...storeItems, itemTypeKeys[0] ?? 'PokeBall'])}
              style={{ fontSize: 12, background: '#1a2a1a', border: '1px solid #3a5a3a', borderRadius: 4, color: '#88ff88', cursor: 'pointer', padding: '3px 10px' }}
            >
              + Item
            </button>
          </div>
        </div>
      )}
      <div style={{ marginTop: 16, padding: 12, background: '#1a1530', border: '1px solid #5a3a3a', borderRadius: 4, fontSize: 11, color: '#ff9999' }}>
        ⚠️ Pega el bloque exportado en <code>{sourceFile ?? '*.ts'}</code> dentro del objeto del mapa.
      </div>
    </div>
  );
}

// ── Inspector de Mechanics (spinners / stoppers) ──

function MechanicsInspector({
  activeMechanic, setActiveMechanic, spinners, stoppers, sourceFile,
}: {
  activeMechanic: MechanicTool;
  setActiveMechanic: (tool: MechanicTool) => void;
  spinners: Record<string, Record<string, DirectionName>>;
  stoppers: Record<string, number[]>;
  sourceFile?: string;
}) {
  const tools: { key: MechanicTool; label: string; icon: string; color: string }[] = [
    { key: 'spinner-up', label: 'Spinner Up', icon: '▲', color: '#cc88ff' },
    { key: 'spinner-down', label: 'Spinner Down', icon: '▼', color: '#cc88ff' },
    { key: 'spinner-left', label: 'Spinner Left', icon: '◀', color: '#cc88ff' },
    { key: 'spinner-right', label: 'Spinner Right', icon: '▶', color: '#cc88ff' },
    { key: 'stopper', label: 'Stopper', icon: '■', color: '#ffe664' },
  ];
  const spinnersCount = Object.values(spinners).reduce((a, m) => a + Object.keys(m).length, 0);
  const stoppersCount = Object.values(stoppers).reduce((a, b) => a + b.length, 0);
  return (
    <div style={{ color: '#ccc', fontSize: 13, lineHeight: 1.6 }}>
      <div style={{ fontSize: 32, marginBottom: 8, textAlign: 'center' }}>🧭</div>
      <p style={{ color: '#ddb0ff', fontWeight: 700, marginBottom: 12 }}>Modo Mechanics activo</p>
      <p style={{ color: '#aaa', fontSize: 12, marginBottom: 14 }}>
        Spinners fuerzan dirección. Stoppers detienen el deslizamiento. Click en el mismo spinner con la misma dirección lo borra.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {tools.map((tool) => {
          const active = activeMechanic === tool.key;
          return (
            <button
              key={tool.key}
              onClick={() => setActiveMechanic(tool.key)}
              style={{
                padding: '6px 4px',
                background: active ? `${tool.color}33` : '#0f0f1a',
                border: `2px solid ${active ? tool.color : '#2a2a4a'}`,
                borderRadius: 4,
                color: active ? tool.color : '#888',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {tool.icon} {tool.label}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 14, fontSize: 11, color: '#777' }}>
        Total spinners: <span style={{ color: '#cc88ff', fontWeight: 700 }}>{spinnersCount}</span><br />
        Total stoppers: <span style={{ color: '#ffe664', fontWeight: 700 }}>{stoppersCount}</span>
      </div>
      <div style={{ marginTop: 16, padding: 12, background: '#1a1530', border: '1px solid #5a3a3a', borderRadius: 4, fontSize: 11, color: '#ff9999' }}>
        ⚠️ Pega el bloque exportado en <code>{sourceFile ?? '*.ts'}</code> dentro del objeto del mapa.
      </div>
    </div>
  );
}

// ── Inspector de metadatos del mapa ──

function MapMetaInspector({
  currentMap,
  cave,
  setCave,
  dark,
  setDark,
  allowBicycle,
  setAllowBicycle,
  flyable,
  setFlyable,
  flySpot,
  setFlySpot,
  musicField,
  setMusicField,
  musicTracks,
  startPos,
  onlineBattleNpc,
  spinnersCount,
  stoppersCount,
  storeItemsCount,
}: {
  currentMap?: MapEntry;
  cave: boolean;
  setCave: (v: boolean) => void;
  dark: boolean;
  setDark: (v: boolean) => void;
  allowBicycle: boolean;
  setAllowBicycle: (v: boolean) => void;
  flyable: boolean;
  setFlyable: (v: boolean) => void;
  flySpot: { x: number; y: number } | null;
  setFlySpot: (v: { x: number; y: number } | null) => void;
  musicField: string | null;
  setMusicField: (v: string | null) => void;
  musicTracks: MusicTrack[];
  startPos: { x: number; y: number } | null;
  onlineBattleNpc: { x: number; y: number } | null;
  spinnersCount: number;
  stoppersCount: number;
  storeItemsCount: number;
}) {
  return (
    <div style={{ color: '#ccc', fontSize: 13, lineHeight: 1.6 }}>
      <div style={{ fontSize: 32, marginBottom: 8, textAlign: 'center' }}>🗺️</div>
      <p style={{ color: '#ccccdd', fontWeight: 700, marginBottom: 12 }}>Mapa</p>
      <div style={{ color: '#888', fontSize: 11, marginBottom: 12 }}>
        {currentMap ? `${currentMap.sourceFile} · ${currentMap.width}×${currentMap.height}` : 'Sin mapa'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
          <input type="checkbox" checked={allowBicycle} onChange={(e) => setAllowBicycle(e.target.checked)} style={{ accentColor: '#88ff88' }} />
          <span>allowBicycle</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
          <input type="checkbox" checked={cave} onChange={(e) => setCave(e.target.checked)} style={{ accentColor: '#cc88ff' }} />
          <span>cave</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
          <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} style={{ accentColor: '#ffcc44' }} />
          <span>dark (oscuro · requiere Destello)</span>
        </label>
      </div>
      <div style={{ ...sectionStyle, background: '#111a24', border: '1px solid #2d5674', borderRadius: 4, padding: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: flyable ? '#8fd3ff' : '#888' }}>
          <input type="checkbox" checked={flyable} onChange={(e) => setFlyable(e.target.checked)} style={{ accentColor: '#58b7ff' }} />
          <span>Disponible para Vuelo (futuro)</span>
        </label>
        <div style={{ color: '#789', fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>
          Editor-only. El juego deberá mostrar este destino solo si <code>visitedMaps.includes(mapId)</code>.
          <br />Documentado en <code>docs/future-fly-map-editor.md</code>.
          <br />Con este modo activo, click en el canvas fija el tile ✈.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          <label style={{ color: '#888', fontSize: 10 }}>
            Fly X
            <input
              type="number"
              value={flySpot?.x ?? ''}
              placeholder={startPos ? String(startPos.x) : '0'}
              onChange={(e) => {
                const x = parseInt(e.target.value, 10);
                if (Number.isNaN(x)) setFlySpot(null);
                else setFlySpot({ x, y: flySpot?.y ?? startPos?.y ?? 0 });
              }}
              style={{ ...inputStyle, fontSize: 11, padding: '2px 6px' }}
            />
          </label>
          <label style={{ color: '#888', fontSize: 10 }}>
            Fly Y
            <input
              type="number"
              value={flySpot?.y ?? ''}
              placeholder={startPos ? String(startPos.y) : '0'}
              onChange={(e) => {
                const y = parseInt(e.target.value, 10);
                if (Number.isNaN(y)) setFlySpot(null);
                else setFlySpot({ x: flySpot?.x ?? startPos?.x ?? 0, y });
              }}
              style={{ ...inputStyle, fontSize: 11, padding: '2px 6px' }}
            />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button
            type="button"
            onClick={() => setFlySpot(startPos ?? { x: 0, y: 0 })}
            style={{ padding: '2px 8px', background: '#102638', border: '1px solid #2d6a94', color: '#9fdcff', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}
          >
            Usar start
          </button>
          <button
            type="button"
            onClick={() => setFlySpot(null)}
            style={{ padding: '2px 8px', background: '#261014', border: '1px solid #6a2a34', color: '#ff9aa8', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}
          >
            Limpiar
          </button>
        </div>
      </div>
      <div style={sectionStyle}>
        <label style={labelStyle}>Música del mapa</label>
        <select
          value={musicTracks.some((track) => track.expression === musicField) ? musicField ?? '' : ''}
          onChange={(e) => setMusicField(e.target.value || null)}
          style={inputStyle}
        >
          <option value="">Sin música propia / expresión manual</option>
          {musicTracks.map((track) => (
            <option key={track.filename} value={track.expression}>
              {track.label}
            </option>
          ))}
        </select>
      </div>
      <div style={sectionStyle}>
        <label style={labelStyle}>Music expression</label>
        <input
          value={musicField ?? ''}
          placeholder={`music o "/game/music/maps-original/route-1.mp3"`}
          onChange={(e) => setMusicField(e.target.value.trim() ? e.target.value : null)}
          style={inputStyle}
        />
        <div style={{ color: '#777', fontSize: 11, marginTop: 6 }}>
          Usa <code>music</code> para conservar un import existente, o una ruta pública entre comillas para mapas nuevos.
        </div>
      </div>
      <div style={sectionStyle}>
        <div style={{ color: '#888', fontSize: 11 }}>Start: {startPos ? `(${startPos.x}, ${startPos.y})` : 'sin definir'}</div>
        <div style={{ color: '#888', fontSize: 11 }}>Online NPC: {onlineBattleNpc ? `(${onlineBattleNpc.x}, ${onlineBattleNpc.y})` : 'sin definir'}</div>
        <div style={{ color: '#888', fontSize: 11 }}>Store items: {storeItemsCount}</div>
        <div style={{ color: '#888', fontSize: 11 }}>Spinners: {spinnersCount} · Stoppers: {stoppersCount}</div>
      </div>
      <div style={{ marginTop: 16, padding: 12, background: '#1a1530', border: '1px solid #5a3a3a', borderRadius: 4, fontSize: 11, color: '#ff9999' }}>
        ⚠️ Usa <code>📋 MapType</code> para copiar el objeto completo listo para sustituir en el .ts.
      </div>
    </div>
  );
}

// ── Portals Inspector ─────────────────────────────────────────────────────

function PortalsInspector({
  portals, selectedIdx, setSelectedIdx,
  activePortalKind, setActivePortalKind,
  exitReturnMap, setExitReturnMap,
  exitReturnPos, setExitReturnPos,
  mapIds, onUpdate, onDelete, sourceFile,
}: {
  portals: PortalEntry[];
  selectedIdx: number | null;
  setSelectedIdx: (i: number | null) => void;
  activePortalKind: PortalKind;
  setActivePortalKind: (k: PortalKind) => void;
  exitReturnMap: string | null;
  setExitReturnMap: (v: string | null) => void;
  exitReturnPos: { x: number; y: number } | null;
  setExitReturnPos: (v: { x: number; y: number } | null) => void;
  mapIds: string[];
  onUpdate: (idx: number, patch: Partial<PortalEntry>) => void;
  onDelete: (idx: number) => void;
  sourceFile?: string;
}) {
  const sel = selectedIdx !== null ? portals[selectedIdx] : null;
  const KIND_INFO: Record<PortalKind, { label: string; emoji: string; color: string; help: string }> = {
    door: { label: 'Puerta (maps)', emoji: '🚪', color: '#88ff88', help: 'Pisar el tile cambia al MapId destino.' },
    teleport: { label: 'Teleport', emoji: '🌀', color: '#cc88ff', help: 'Pisar lleva al mapa+pos exacta indicados.' },
    exit: { label: 'Salida (exits)', emoji: '↪️', color: '#88ccff', help: 'Pisar vuelve al exitReturnMap+exitReturnPos.' },
  };
  return (
    <div style={{ color: '#ccc', fontSize: 13, lineHeight: 1.6 }}>
      <div style={{ fontSize: 32, marginBottom: 8, textAlign: 'center' }}>🚪</div>
      <p style={{ color: '#ffaa88', fontWeight: 700, marginBottom: 8 }}>Modo Portales activo</p>
      <p style={{ color: '#aaa', fontSize: 11, marginBottom: 12 }}>
        Selecciona el tipo activo y haz click en un tile vacío para crear. Click en un portal para editarlo.
      </p>

      {/* Selector tipo activo */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {(['door', 'teleport', 'exit'] as PortalKind[]).map((k) => {
          const info = KIND_INFO[k];
          const active = activePortalKind === k;
          return (
            <button
              key={k}
              onClick={() => setActivePortalKind(k)}
              style={{
                flex: 1,
                padding: '6px 4px',
                background: active ? `${info.color}33` : '#0f0f1a',
                border: `2px solid ${active ? info.color : '#2a2a4a'}`,
                borderRadius: 4,
                color: active ? info.color : '#888',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 700,
              }}
              title={info.help}
            >
              {info.emoji} {info.label.split(' ')[0]}
            </button>
          );
        })}
      </div>

      {/* Editor del seleccionado */}
      {sel && (
        <div style={{ padding: 10, background: '#0f0f1a', border: `2px solid ${KIND_INFO[sel.kind].color}`, borderRadius: 4, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ color: KIND_INFO[sel.kind].color, fontSize: 12 }}>
              {KIND_INFO[sel.kind].emoji} {KIND_INFO[sel.kind].label} ({sel.pos.x},{sel.pos.y})
            </strong>
            <button
              onClick={() => onDelete(selectedIdx!)}
              style={{ background: 'transparent', border: '1px solid #7a3a3a', color: '#ff8888', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}
            >
              Eliminar
            </button>
          </div>
          {(sel.kind === 'door' || sel.kind === 'teleport') && (
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 11, color: '#888' }}>MapId destino:</label>
              <select
                value={sel.destMap ?? ''}
                onChange={(e) => onUpdate(selectedIdx!, { destMap: e.target.value })}
                style={{ ...inputStyle, width: '100%', marginTop: 4 }}
              >
                {mapIds.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}
          {sel.kind === 'teleport' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: '#888' }}>Dest X:</label>
                <input
                  type="number"
                  value={sel.destPos?.x ?? 0}
                  onChange={(e) => onUpdate(selectedIdx!, { destPos: { x: parseInt(e.target.value, 10) || 0, y: sel.destPos?.y ?? 0 } })}
                  style={{ ...inputStyle, width: '100%', marginTop: 4 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: '#888' }}>Dest Y:</label>
                <input
                  type="number"
                  value={sel.destPos?.y ?? 0}
                  onChange={(e) => onUpdate(selectedIdx!, { destPos: { x: sel.destPos?.x ?? 0, y: parseInt(e.target.value, 10) || 0 } })}
                  style={{ ...inputStyle, width: '100%', marginTop: 4 }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lista de portales */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Portales en este mapa ({portals.length}):</div>
        <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {portals.length === 0 && <div style={{ color: '#555', fontSize: 11, textAlign: 'center', padding: 8 }}>Ninguno</div>}
          {portals.map((p, i) => {
            const info = KIND_INFO[p.kind];
            const active = selectedIdx === i;
            return (
              <div
                key={i}
                onClick={() => setSelectedIdx(i)}
                style={{
                  padding: '4px 8px',
                  background: active ? `${info.color}22` : '#0f0f1a',
                  border: `1px solid ${active ? info.color : '#2a2a4a'}`,
                  borderRadius: 3,
                  cursor: 'pointer',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>{info.emoji}</span>
                <span style={{ color: info.color, fontWeight: 600 }}>({p.pos.x},{p.pos.y})</span>
                {p.destMap && <span style={{ color: '#aaa' }}>→ {p.destMap}{p.destPos ? ` (${p.destPos.x},${p.destPos.y})` : ''}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* exitReturnMap / exitReturnPos */}
      <div style={{ padding: 10, background: '#0f0f1a', border: '1px solid #2a2a4a', borderRadius: 4, marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: '#88ccff', fontWeight: 700, marginBottom: 6 }}>
          ↪️ Destino de los <code>exits</code>
        </div>
        <label style={{ fontSize: 11, color: '#888' }}>exitReturnMap:</label>
        <select
          value={exitReturnMap ?? ''}
          onChange={(e) => setExitReturnMap(e.target.value || null)}
          style={{ ...inputStyle, width: '100%', marginTop: 4, marginBottom: 8 }}
        >
          <option value="">— ninguno —</option>
          {mapIds.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: '#888' }}>X:</label>
            <input
              type="number"
              value={exitReturnPos?.x ?? 0}
              onChange={(e) => setExitReturnPos({ x: parseInt(e.target.value, 10) || 0, y: exitReturnPos?.y ?? 0 })}
              style={{ ...inputStyle, width: '100%', marginTop: 4 }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: '#888' }}>Y:</label>
            <input
              type="number"
              value={exitReturnPos?.y ?? 0}
              onChange={(e) => setExitReturnPos({ x: exitReturnPos?.x ?? 0, y: parseInt(e.target.value, 10) || 0 })}
              style={{ ...inputStyle, width: '100%', marginTop: 4 }}
            />
          </div>
          {exitReturnPos && (
            <button
              onClick={() => setExitReturnPos(null)}
              style={{ alignSelf: 'flex-end', background: 'transparent', border: '1px solid #5a5a7a', color: '#888', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontSize: 10 }}
              title="Limpiar"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: 10, background: '#1a1530', border: '1px solid #5a3a3a', borderRadius: 4, fontSize: 11, color: '#ff9999' }}>
        ⚠️ Pega el bloque exportado en <code>{sourceFile ?? '*.ts'}</code> dentro del objeto del mapa.
      </div>
    </div>
  );
}
