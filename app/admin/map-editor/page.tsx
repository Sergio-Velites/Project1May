'use client';

import { useEffect, useLayoutEffect, useState, useRef, useCallback, useMemo } from 'react';
import { parseMapTS } from './parse-ts';
import { ITEM_NAMES } from '../item-names';
import {
  ALL_TYPES, buildEncounterTable, buildTrainerTeam,
  type GenChoice, type TimeSegment, type TerrainKind,
} from './pokemon-pool';

// ── Tipos ─────────────────────────────────────────────────────────────────

interface Pokemon { id: number; level: number; }

type DirectionName = 'down' | 'up' | 'left' | 'right';

/** Glifo de flecha por dirección (para overlays y selectores de dirección). */
const DIRECTION_ARROW: Record<DirectionName, string> = {
  down: '▼',
  up: '▲',
  left: '◀',
  right: '▶',
};

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
  // Recompensas tras la derrota: estructurado { message, items } (items =
  // claves de ItemType, incl. medallas/MTs) cuando el editor lo gestiona;
  // string = texto raw legado que solo se preserva.
  postGame?: string | { message: string[]; items: string[] } | null;
  // Logro/quest que se marca en completedQuests al derrotar al entrenador.
  defeatQuestId?: string | null;
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
  /** Destino de la MO Vuelo (el juego lo consume vía fly-helper). */
  flyable?: boolean;
  flySpot?: { x: number; y: number } | null;
  /** Si true, el destino de Vuelo está disponible desde el inicio (sin pisar casillas). */
  flyAlwaysAvailable?: boolean;
  /** Casillas que, al pisarlas, desbloquean este destino de Vuelo ({fila:[cols]}). */
  flyUnlockTiles?: Record<string, number[]>;
  music?: string | null;
  trainers: Trainer[];
  walls: Record<string, number[]>;
  fences?: Record<string, number[]>;
  /** Dirección de salto por tile de saliente. Default Down si falta el tile. */
  fenceDirections?: Record<string, Record<string, DirectionName>>;
  /** Planos de altura por tile (sparse; ausente = nivel 0). */
  elevations?: Record<string, Record<string, number>>;
  /** Rampas/escaleras que conectan planos de altura. */
  ramps?: Record<string, number[]>;
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
  dayCareNpc?: { x: number; y: number } | null;
  spinners?: Record<string, Record<string, DirectionName>>;
  stoppers?: Record<string, number[]>;
  // Portales entre mapas
  maps?: Record<string, Record<string, string>>;
  teleports?: Record<string, Record<string, { map: string; pos: { x: number; y: number } }>>;
  exits?: Record<string, number[]>;
  exitReturnMap?: string | null;
  exitReturnPos?: { x: number; y: number } | null;
  minimapPos?: { x: number; y: number } | null;
  /** Agrupación en el minimapa: undefined/null = auto por nombre; "" = suelto; "<id>" = forzado. */
  minimapParent?: string | null;
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

type EditMode = 'select' | 'npc' | 'walls' | 'fences' | 'elevations' | 'grass' | 'water' | 'fly-unlock' | 'texts' | 'items' | 'gifts' | 'static-pokemon' | 'cuttable-trees' | 'berry-trees' | 'boulders' | 'spots' | 'mechanics' | 'portals' | 'map';

/** Brocha del modo elevaciones: nivel 1-3 o rampa (escalera entre planos). */
type ElevationBrush = 1 | 2 | 3 | 'ramp';

// Nº de tiles clicables ALREDEDOR del mapa. Permite colocar portales/muros fuera
// del borde visible (p.ej. un portal justo fuera → el jugador cambia de mapa al
// intentar salir). Las coordenadas resultantes son negativas o ≥ ancho/alto; se
// serializan bien porque el codegen entrecomilla las claves negativas.
const CANVAS_MARGIN = 4;

/** Bayas válidas para árboles de bayas (nombres del enum ItemType del juego). */
const BERRY_ITEM_KEYS = [
  'Berry', 'GoldBerry', 'PrzCureBerry', 'PsnCureBerry', 'MintBerry',
  'IceBerry', 'BurntBerry', 'BitterBerry', 'MiracleBerry', 'MysteryBerry',
] as const;

type SpotKey = 'start' | 'pokemonCenter' | 'pc' | 'store' | 'recoverLocation' | 'onlineBattleNpc' | 'dayCareNpc';

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

// ── Sistema de pickers visuales ─────────────────────────────────────────────
// Toda la edición que antes usaba window.prompt() ahora pasa por un overlay
// modal con búsqueda y selección por click. El estado `picker` del editor
// describe qué se está eligiendo y los callbacks que aplican el cambio.

type PickerState =
  | null
  | {
      kind: 'item';
      title: string;
      subtitle?: string;
      options: string[];
      current?: string;
      hidden?: boolean;
      labelFor?: (key: string) => string;
      onPick: (itemKey: string) => void;
      onToggleHidden?: () => void;
      onDelete?: () => void;
    }
  | {
      kind: 'pokemon';
      title: string;
      subtitle?: string;
      current?: number;
      onPick: (id: number) => void;
    }
  | {
      kind: 'gift';
      title: string;
      initial: { pokemonId: number; level: number; questId: string };
      onSave: (v: { pokemonId: number; level: number; questId: string }) => void;
      onDelete?: () => void;
    }
  | {
      kind: 'static';
      title: string;
      initial: { pokemonId: number; level: number; sprite: string; questId: string; intro: string };
      onSave: (v: { pokemonId: number; level: number; sprite: string; questId: string; intro?: string[] }) => void;
      onDelete?: () => void;
    }
  | {
      kind: 'text';
      title: string;
      initial: { text: string; reward: TextRewardEntry | null };
      defaultQuestId: string;
      itemOptions: string[];
      onSave: (v: { text: string; reward: TextRewardEntry | null }) => void;
    }
  | {
      kind: 'maptile';
      title: string;
      subtitle?: string;
      requirePos: boolean;
      highlightTrainers?: boolean;
      current?: { mapId: string; pos?: { x: number; y: number } };
      onPick: (v: { mapId: string; pos: { x: number; y: number } | null }) => void;
    };

/** PascalCase del enum ItemType → slug kebab-case usado en ITEM_NAMES. */
function itemKeyToSlug(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/** Nombre legible (ES) de un ItemType; cae al PascalCase espaciado. */
function itemLabel(key: string): string {
  const slug = itemKeyToSlug(key);
  return ITEM_NAMES[slug] ?? key.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
}

const BERRY_LABELS: Record<string, string> = {
  Berry: 'Baya', GoldBerry: 'Baya Dorada', PrzCureBerry: 'Baya Antipar',
  PsnCureBerry: 'Baya Antitóx', MintBerry: 'Baya Menta', IceBerry: 'Baya Hielo',
  BurntBerry: 'Baya Tostada', BitterBerry: 'Baya Amarga', MiracleBerry: 'Baya Milagro',
  MysteryBerry: 'Baya Misterio',
};

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
    if (t.postGame) {
      if (typeof t.postGame === 'string') opts.push(`  postGame: ${t.postGame},`);
      else {
        const msg = t.postGame.message.map((s) => `      "${s.replace(/"/g, '\\"')}",`).join('\n');
        const its = t.postGame.items.length ? `\n    items: [${t.postGame.items.map((k) => `ItemType.${k}`).join(', ')}],` : '';
        opts.push(`  postGame: {\n    message: [\n${msg}\n    ],${its}\n  },`);
      }
    }
    if (t.defeatQuestId) opts.push(`  defeatQuestId: "${t.defeatQuestId.replace(/"/g, '\\"')}",`);
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


// ── Desplazamiento global de elementos (dx, dy en tiles) ────────────────────
// Reubica TODOS los elementos del mapa a la vez, para realinear cuando la
// imagen y los datos quedan descuadrados (p.ej. tras partir/redimensionar un
// mapa). Solo mueve coordenadas de ESTE mapa; NO toca posiciones que viven en
// otro mapa (destino de teleport, exitReturnPos) ni el minimapa de Kanto.

/** Record<fila, col[]> → desplazado (fila+dy, col+dx), deduplicado y ordenado. */
function shiftRowCols(m: Record<string, number[]>, dx: number, dy: number): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const [r, cols] of Object.entries(m)) {
    const nr = String(Number(r) + dy);
    out[nr] = (out[nr] ?? []).concat(cols.map((c) => c + dx));
  }
  for (const k of Object.keys(out)) out[k] = Array.from(new Set(out[k])).sort((a, b) => a - b);
  return out;
}

/** Record<fila, Record<col, V>> → desplazado (fila+dy, col+dx), conserva el valor. */
function shiftRowColMap<V>(m: Record<string, Record<string, V>>, dx: number, dy: number): Record<string, Record<string, V>> {
  const out: Record<string, Record<string, V>> = {};
  for (const [r, cols] of Object.entries(m)) {
    const nr = String(Number(r) + dy);
    out[nr] ??= {};
    for (const [c, v] of Object.entries(cols)) out[nr][String(Number(c) + dx)] = v;
  }
  return out;
}

/** Array de entradas con `.pos` → cada pos desplazada (conserva el resto). */
function shiftPosArray<T extends { pos: { x: number; y: number } }>(arr: T[], dx: number, dy: number): T[] {
  return arr.map((e) => ({ ...e, pos: { x: e.pos.x + dx, y: e.pos.y + dy } }));
}

/** Punto suelto (o null) → desplazado. */
function shiftPoint(p: { x: number; y: number } | null, dx: number, dy: number): { x: number; y: number } | null {
  return p ? { x: p.x + dx, y: p.y + dy } : p;
}

// ── Selección rectangular: cortar / copiar / pegar bloques de contenido ──────
// Un rectángulo en coords de tile (normalizado: x0<=x1, y0<=y1). Las funciones
// EXTRAEN (coords relativas a la esquina sup-izq), ELIMINAN (in-rect) y FUSIONAN
// (pegar con desplazamiento). Solo contenido posicional de ESTE mapa; los
// singletons de config (start/PC/centro/…) y el minimapa quedan fuera a
// propósito. En portales se copia la casilla local; el destino (destMap/destPos)
// viaja tal cual (referencia a otro mapa).

interface SelRect { x0: number; y0: number; x1: number; y1: number }

const inRect = (x: number, y: number, r: SelRect) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;

/** Portapapeles de bloque: todo con coords RELATIVAS a la esquina sup-izq. */
interface MapClipboard {
  w: number;
  h: number;
  walls: Record<string, number[]>;
  fences: Record<string, number[]>;
  fenceDirections: Record<string, Record<string, DirectionName>>;
  elevations: Record<string, Record<string, number>>;
  ramps: Record<string, number[]>;
  grass: Record<string, number[]>;
  water: Record<string, number[]>;
  flyUnlockTiles?: Record<string, number[]>;
  stoppers: Record<string, number[]>;
  spinners: Record<string, Record<string, DirectionName>>;
  texts: Record<string, Record<string, string[]>>;
  textRewards: Record<string, Record<string, TextRewardEntry>>;
  trainers: Trainer[];
  items: ItemEntry[];
  gifts: GiftEntry[];
  staticPokemon: StaticPokemonEntry[];
  cuttableTrees: { pos: { x: number; y: number }; questId: string }[];
  boulders: { pos: { x: number; y: number }; id: string }[];
  berryTrees: { pos: { x: number; y: number }; itemKey: string }[];
  portals: PortalEntry[];
}

// -- Record<fila, col[]> --
function extractRowCols(m: Record<string, number[]>, r: SelRect): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const [row, cols] of Object.entries(m)) {
    const y = Number(row);
    if (y < r.y0 || y > r.y1) continue;
    const kept = cols.filter((x) => x >= r.x0 && x <= r.x1).map((x) => x - r.x0);
    if (kept.length) out[String(y - r.y0)] = kept.sort((a, b) => a - b);
  }
  return out;
}
function removeRowCols(m: Record<string, number[]>, r: SelRect): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const [row, cols] of Object.entries(m)) {
    const y = Number(row);
    const kept = (y < r.y0 || y > r.y1) ? cols.slice() : cols.filter((x) => x < r.x0 || x > r.x1);
    if (kept.length) out[row] = kept.sort((a, b) => a - b);
  }
  return out;
}
function mergeRowCols(a: Record<string, number[]>, b: Record<string, number[]>): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const [row, cols] of Object.entries(a)) out[row] = cols.slice();
  for (const [row, cols] of Object.entries(b)) out[row] = Array.from(new Set([...(out[row] ?? []), ...cols])).sort((x, y) => x - y);
  return out;
}

// -- Record<fila, Record<col, V>> --
function extractRowColMap<V>(m: Record<string, Record<string, V>>, r: SelRect): Record<string, Record<string, V>> {
  const out: Record<string, Record<string, V>> = {};
  for (const [row, cols] of Object.entries(m)) {
    const y = Number(row);
    if (y < r.y0 || y > r.y1) continue;
    for (const [col, v] of Object.entries(cols)) {
      const x = Number(col);
      if (x < r.x0 || x > r.x1) continue;
      (out[String(y - r.y0)] ??= {})[String(x - r.x0)] = v;
    }
  }
  return out;
}
function removeRowColMap<V>(m: Record<string, Record<string, V>>, r: SelRect): Record<string, Record<string, V>> {
  const out: Record<string, Record<string, V>> = {};
  for (const [row, cols] of Object.entries(m)) {
    const y = Number(row);
    for (const [col, v] of Object.entries(cols)) {
      const x = Number(col);
      if (inRect(x, y, r)) continue;
      (out[row] ??= {})[col] = v;
    }
  }
  return out;
}
function mergeRowColMap<V>(a: Record<string, Record<string, V>>, b: Record<string, Record<string, V>>): Record<string, Record<string, V>> {
  const out: Record<string, Record<string, V>> = {};
  for (const [row, cols] of Object.entries(a)) out[row] = { ...cols };
  for (const [row, cols] of Object.entries(b)) out[row] = { ...(out[row] ?? {}), ...cols };
  return out;
}

// -- Arrays con .pos --
function extractPos<T extends { pos: { x: number; y: number } }>(arr: T[], r: SelRect): T[] {
  return arr.filter((e) => inRect(e.pos.x, e.pos.y, r)).map((e) => ({ ...e, pos: { x: e.pos.x - r.x0, y: e.pos.y - r.y0 } }));
}
function removePos<T extends { pos: { x: number; y: number } }>(arr: T[], r: SelRect): T[] {
  return arr.filter((e) => !inRect(e.pos.x, e.pos.y, r));
}

/** Estilo de los botones de la barra de selección (habilitado / activo). */
function selToolBtnStyle(enabled: boolean, active = false): React.CSSProperties {
  return {
    padding: '4px 9px',
    fontSize: 12,
    background: active ? '#2a4a6a' : '#12243a',
    border: `1px solid ${active ? '#5ac8ff' : '#3a5a7a'}`,
    borderRadius: 4,
    color: enabled ? '#aadcff' : '#667',
    cursor: enabled ? 'pointer' : 'default',
    opacity: enabled ? 1 : 0.5,
    whiteSpace: 'nowrap',
  };
}

// ── Portales: flatten/nest entre el shape de MapType y un array plano editable ──

// PORTALES UNIFICADOS: existe UN solo tipo = "salida a mapa+posición" (teleport).
// Al cargar un mapa, las puertas (`maps`) y salidas (`exits`) antiguas se
// convierten a este tipo (conservando el comportamiento: puerta→`start` del
// destino, salida→`exitReturnMap`/`Pos`). Así el editor los muestra y edita
// igual, y al guardar se escriben todos como `teleports`.
function flattenPortals(m: MapEntry, allMaps: MapData): PortalEntry[] {
  const out: PortalEntry[] = [];
  // maps (puertas/conexiones antiguas) → teleport al `start` del destino.
  if (m.maps) {
    for (const [r, cols] of Object.entries(m.maps)) {
      for (const [c, dest] of Object.entries(cols ?? {})) {
        const d = String(dest);
        out.push({
          kind: 'teleport',
          pos: { x: parseInt(c, 10), y: parseInt(r, 10) },
          destMap: d,
          destPos: allMaps[d]?.start ?? { x: 0, y: 0 },
        });
      }
    }
  }
  // teleports: ya son del tipo unificado.
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
  // exits antiguas → teleport a exitReturnMap/exitReturnPos (mismo destino).
  if (m.exits && m.exitReturnMap && m.exitReturnPos) {
    for (const [r, cols] of Object.entries(m.exits)) {
      for (const c of cols) {
        out.push({
          kind: 'teleport',
          pos: { x: c, y: parseInt(r, 10) },
          destMap: m.exitReturnMap,
          destPos: m.exitReturnPos,
        });
      }
    }
  }
  return out;
}

// Serializa SIEMPRE como `teleports` (tipo unificado). `maps` y `exits` se
// dejan vacíos: el mapa queda con un único mecanismo de transición.
function nestPortals(portals: PortalEntry[]): {
  maps: Record<string, Record<string, string>>;
  teleports: Record<string, Record<string, { map: string; pos: { x: number; y: number } }>>;
  exits: Record<string, number[]>;
} {
  const maps: Record<string, Record<string, string>> = {};
  const teleports: Record<string, Record<string, { map: string; pos: { x: number; y: number } }>> = {};
  const exits: Record<string, number[]> = {};
  for (const p of portals) {
    if (!p.destMap || !p.destPos) continue; // portal incompleto → se ignora
    const r = String(p.pos.y);
    const c = String(p.pos.x);
    (teleports[r] ??= {})[c] = { map: p.destMap, pos: p.destPos };
  }
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
  fenceDirections,
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
  minimapParent,
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
  fenceDirections: Record<string, Record<string, DirectionName>>;
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
  minimapParent: string | null;
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
  if (!isNestedMapEmpty(fenceDirections as unknown as Record<string, Record<string, unknown>>)) {
    lines.push(exportSpinnersTS(fenceDirections).replace(/^spinners:/, 'fenceDirections:'));
  }
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
  if (minimapParent !== null) lines.push(`minimapParent: ${JSON.stringify(minimapParent)},`);
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

// Devuelve el nivel de zoom de ZOOM_LEVELS más cercano a `z` (para pinch-zoom).
function nearestZoomLevel(z: number): number {
  let best = ZOOM_LEVELS[0];
  for (const lv of ZOOM_LEVELS) {
    if (Math.abs(lv - z) < Math.abs(best - z)) best = lv;
  }
  return best;
}
const MINIMAP_WIDTH = 237;
const MINIMAP_HEIGHT = 201;
const MINIMAP_DISPLAY_SCALE = 2;
// Límites del pinch-zoom del minimapa (1 = imagen ajustada al ancho del panel).
const MM_MIN_SCALE = 1;
const MM_MAX_SCALE = 6;

// ── Agrupación automática de puntos del minimapa ──────────────────────────
// Los interiores se nombran siempre `<padre>-<sufijo>` (p.ej. `pewter-city-gym`,
// `pallet-town-house-a-1f`), así que el padre se deduce como el mapa-prefijo
// más largo que EXISTA de verdad. Las mazmorras con plantas no tienen un mapa
// raíz sin sufijo (`mt-moon-1f/2f/3f`), por lo que se agrupan bajo una clave
// sintética de esta lista. La resolución es transitiva → todo cae bajo su
// ciudad/mazmorra principal en un único nivel.
const MINIMAP_FLOOR_GROUPS = [
  'mt-moon', 'rock-tunnel', 'pokemon-tower', 'silph-co', 'pokemon-mansion',
  'cerulean-cave', 'seafoam-islands', 'victory-road', 'ss-anne',
  'safari-zone', 'underground-path', 'elite-four',
];

// `parentOf` = override manual por mapa: "" = suelto (su propio grupo);
// "<id>" = forzado a ese grupo; ausente/undefined = automático por nombre.
type MinimapParentOf = Record<string, string | undefined>;

function minimapDirectParent(mapId: string, allIds: readonly string[], parentOf?: MinimapParentOf): string {
  const ov = parentOf?.[mapId];
  if (ov !== undefined) return ov === '' ? mapId : ov;
  let best = '';
  for (const cand of allIds) {
    if (cand !== mapId && mapId.startsWith(cand + '-') && cand.length > best.length) {
      best = cand;
    }
  }
  if (best) return best;
  for (const g of MINIMAP_FLOOR_GROUPS) {
    if (mapId === g || mapId.startsWith(g + '-')) return g;
  }
  return mapId;
}

function minimapGroupKey(mapId: string, allIds: readonly string[], parentOf?: MinimapParentOf): string {
  let cur = mapId;
  for (let i = 0; i < 8; i++) {
    const parent = minimapDirectParent(cur, allIds, parentOf);
    if (parent === cur) break;
    cur = parent;
  }
  return cur;
}

function prettyMapName(id: string): string {
  return id.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

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

const zoomBtnStyle: React.CSSProperties = {
  width: 26,
  height: 24,
  padding: 0,
  fontSize: 13,
  lineHeight: 1,
  cursor: 'pointer',
  borderRadius: 4,
  background: '#1a1a2a',
  border: '1px solid #3a3a5a',
  color: '#bcbce0',
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

// ════════════════════════════════════════════════════════════════════════════
//  MODALES DE SELECCIÓN VISUAL (pickers)
// ════════════════════════════════════════════════════════════════════════════

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#0a0a1e',
  border: '1px solid #3a3a5a',
  color: '#e0e0ff',
  borderRadius: 6,
  padding: '8px 12px',
  fontSize: 14,
  fontFamily: 'monospace',
  outline: 'none',
};

const modalBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: '#1a1a3a',
  border: '1px solid #3a3a5a',
  borderRadius: 6,
  color: '#ccd',
  cursor: 'pointer',
  fontSize: 13,
  fontFamily: 'monospace',
};

const modalPrimaryBtnStyle: React.CSSProperties = {
  ...modalBtnStyle,
  background: '#2a4a2a',
  border: '1px solid #4a7a4a',
  color: '#aaffaa',
  fontWeight: 700,
};

/** Shell común de todos los modales: backdrop, panel centrado, título y ESC. */
function PickerOverlay({
  title, subtitle, onClose, width = 560, children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  width?: number;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(4,4,12,0.78)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          width, maxWidth: '92vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column',
          background: '#12122a', border: '1px solid #3a3a5a', borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)', overflow: 'hidden',
        }}
      >
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #2a2a4a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e0e0ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 11, color: '#8888aa', marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} title="Cerrar (Esc)" style={{ flexShrink: 0, width: 28, height: 28, padding: 0, background: '#1a1a2e', border: '1px solid #3a3a5a', borderRadius: 6, color: '#aaa', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Autofocus en montaje para escribir la búsqueda al instante. */
function useAutofocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return ref;
}

// ── Grid de Pokémon con búsqueda (sprite + nombre + nº) ─────────────────────
function PokemonSearchGrid({ value, onPick, autofocus = true }: {
  value?: number;
  onPick: (id: number) => void;
  autofocus?: boolean;
}) {
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (autofocus) inputRef.current?.focus(); }, [autofocus]);
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const ids: number[] = [];
    for (let id = 1; id <= MAX_POKEMON_ID; id++) {
      const name = POKEMON_NAMES_EDITOR[id] ?? '';
      if (!needle || name.toLowerCase().includes(needle) || String(id) === needle || String(id).padStart(3, '0').includes(needle)) {
        ids.push(id);
      }
    }
    return ids;
  }, [q]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <div style={{ padding: '10px 14px 8px' }}>
        <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Buscar Pokémon por nombre o nº…" style={searchInputStyle} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px 12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(74px, 1fr))', gap: 6, alignContent: 'start' }}>
        {results.length === 0 && <div style={{ gridColumn: '1/-1', color: '#666', textAlign: 'center', padding: 20, fontSize: 12 }}>Sin resultados</div>}
        {results.map((id) => {
          const active = value === id;
          return (
            <button
              key={id}
              onClick={() => onPick(id)}
              title={`#${id} ${POKEMON_NAMES_EDITOR[id]}`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '6px 2px 4px', cursor: 'pointer',
                background: active ? '#2a3a5a' : '#0d0d22',
                border: `1px solid ${active ? '#6a8aff' : '#222240'}`,
                borderRadius: 6,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/editor/pokemon/${id}.png`} alt="" style={{ width: 40, height: 40, imageRendering: 'pixelated', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.15'; }} />
              <span style={{ fontSize: 9, color: '#7777aa' }}>#{id}</span>
              <span style={{ fontSize: 10, color: active ? '#cfe' : '#bbc', textAlign: 'center', lineHeight: 1.1, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{POKEMON_NAMES_EDITOR[id]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Lista de objetos con búsqueda ───────────────────────────────────────────
function ItemSearchList({ options, value, onPick, labelFor = itemLabel }: {
  options: string[];
  value?: string;
  onPick: (key: string) => void;
  labelFor?: (key: string) => string;
}) {
  const [q, setQ] = useState('');
  const inputRef = useAutofocus<HTMLInputElement>();
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((k) => k.toLowerCase().includes(needle) || labelFor(k).toLowerCase().includes(needle));
  }, [q, options, labelFor]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <div style={{ padding: '10px 14px 8px' }}>
        <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Buscar objeto…" style={searchInputStyle} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {results.length === 0 && <div style={{ color: '#666', textAlign: 'center', padding: 20, fontSize: 12 }}>Sin resultados</div>}
        {results.map((key) => {
          const active = value === key;
          const label = labelFor(key);
          return (
            <button
              key={key}
              onClick={() => onPick(key)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                padding: '8px 12px', cursor: 'pointer', textAlign: 'left',
                background: active ? '#2a3a5a' : '#0d0d22',
                border: `1px solid ${active ? '#6a8aff' : '#222240'}`,
                borderRadius: 6,
              }}
            >
              <span style={{ fontSize: 13, color: active ? '#cfe' : '#dde' }}>{label}</span>
              <code style={{ fontSize: 10, color: '#7777aa', flexShrink: 0 }}>{key}</code>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Modal: elegir objeto (con toggle oculto + eliminar si edita) ────────────
function ItemPickerModal({ state, onClose }: { state: Extract<NonNullable<PickerState>, { kind: 'item' }>; onClose: () => void }) {
  return (
    <PickerOverlay title={state.title} subtitle={state.subtitle} onClose={onClose} width={480}>
      <ItemSearchList options={state.options} value={state.current} labelFor={state.labelFor} onPick={(k) => { state.onPick(k); onClose(); }} />
      {(state.onToggleHidden || state.onDelete) && (
        <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: '1px solid #2a2a4a' }}>
          {state.onToggleHidden && (
            <button onClick={() => { state.onToggleHidden!(); onClose(); }} style={modalBtnStyle}>
              {state.hidden ? '👁 Hacer visible' : '🙈 Hacer oculto'}
            </button>
          )}
          {state.onDelete && (
            <button onClick={() => { state.onDelete!(); onClose(); }} style={{ ...modalBtnStyle, marginLeft: 'auto', background: '#2a1010', border: '1px solid #5a2a2a', color: '#ff8888' }}>🗑 Eliminar</button>
          )}
        </div>
      )}
    </PickerOverlay>
  );
}

// ── Modal: elegir Pokémon (solo id) ─────────────────────────────────────────
function PokemonPickerModal({ state, onClose }: { state: Extract<NonNullable<PickerState>, { kind: 'pokemon' }>; onClose: () => void }) {
  return (
    <PickerOverlay title={state.title} subtitle={state.subtitle} onClose={onClose} width={560}>
      <div style={{ height: '60vh', display: 'flex' }}>
        <PokemonSearchGrid value={state.current} onPick={(id) => { state.onPick(id); onClose(); }} />
      </div>
    </PickerOverlay>
  );
}

// ── Modal: regalo (Pokémon + nivel + questId) ───────────────────────────────
function GiftFormModal({ state, onClose }: { state: Extract<NonNullable<PickerState>, { kind: 'gift' }>; onClose: () => void }) {
  const [pokemonId, setPokemonId] = useState(state.initial.pokemonId);
  const [level, setLevel] = useState(state.initial.level);
  const [questId, setQuestId] = useState(state.initial.questId);
  const valid = pokemonId >= 1 && pokemonId <= MAX_POKEMON_ID && level >= 1 && level <= MAX_LEVEL && questId.trim().length > 0;
  return (
    <PickerOverlay title={state.title} subtitle="Pokémon que se obtiene al recoger la pokéball" onClose={onClose} width={560}>
      <div style={{ height: '46vh', display: 'flex' }}>
        <PokemonSearchGrid value={pokemonId} onPick={setPokemonId} />
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', padding: '12px 16px', borderTop: '1px solid #2a2a4a', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/editor/pokemon/${pokemonId}.png`} alt="" style={{ width: 36, height: 36, imageRendering: 'pixelated' }} onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.15'; }} />
          <div style={{ fontSize: 13, color: '#cfe' }}>#{pokemonId} {POKEMON_NAMES_EDITOR[pokemonId] ?? ''}</div>
        </div>
        <div>
          <label style={labelStyle}>Nivel</label>
          <input type="number" min={1} max={MAX_LEVEL} value={level} onChange={(e) => setLevel(parseInt(e.target.value, 10) || 1)} style={{ ...inputStyle, width: 70 }} />
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={labelStyle}>questId (único)</label>
          <input value={questId} onChange={(e) => setQuestId(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {state.onDelete && <button onClick={() => { state.onDelete!(); onClose(); }} style={{ ...modalBtnStyle, background: '#2a1010', border: '1px solid #5a2a2a', color: '#ff8888' }}>🗑</button>}
          <button onClick={onClose} style={modalBtnStyle}>Cancelar</button>
          <button disabled={!valid} onClick={() => { state.onSave({ pokemonId, level, questId: questId.trim() }); onClose(); }} style={{ ...modalPrimaryBtnStyle, opacity: valid ? 1 : 0.4, cursor: valid ? 'pointer' : 'not-allowed' }}>Guardar</button>
        </div>
      </div>
    </PickerOverlay>
  );
}

// ── Modal: Pokémon estático (Pokémon + nivel + sprite + questId + intro) ────
function StaticPokemonFormModal({ state, onClose }: { state: Extract<NonNullable<PickerState>, { kind: 'static' }>; onClose: () => void }) {
  const [pokemonId, setPokemonId] = useState(state.initial.pokemonId);
  const [level, setLevel] = useState(state.initial.level);
  const [sprite, setSprite] = useState(state.initial.sprite);
  const [questId, setQuestId] = useState(state.initial.questId);
  const [intro, setIntro] = useState(state.initial.intro);
  const valid = pokemonId >= 1 && pokemonId <= MAX_POKEMON_ID && level >= 1 && level <= MAX_LEVEL && questId.trim().length > 0 && STATIC_POKEMON_SPRITES.includes(sprite);
  return (
    <PickerOverlay title={state.title} subtitle="Pokémon estático tipo Articuno (combate único)" onClose={onClose} width={580}>
      <div style={{ height: '40vh', display: 'flex' }}>
        <PokemonSearchGrid value={pokemonId} onPick={setPokemonId} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '12px 16px', borderTop: '1px solid #2a2a4a' }}>
        <div>
          <label style={labelStyle}>Nivel</label>
          <input type="number" min={1} max={MAX_LEVEL} value={level} onChange={(e) => setLevel(parseInt(e.target.value, 10) || 1)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Sprite overworld</label>
          <select value={sprite} onChange={(e) => setSprite(e.target.value)} style={{ ...inputStyle, height: 32 }}>
            {STATIC_POKEMON_SPRITES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={labelStyle}>questId (único)</label>
          <input value={questId} onChange={(e) => setQuestId(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={labelStyle}>Intro (una línea por diálogo, vacío = sin intro)</label>
          <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '0 16px 14px' }}>
        {state.onDelete && <button onClick={() => { state.onDelete!(); onClose(); }} style={{ ...modalBtnStyle, marginRight: 'auto', background: '#2a1010', border: '1px solid #5a2a2a', color: '#ff8888' }}>🗑 Eliminar</button>}
        <button onClick={onClose} style={modalBtnStyle}>Cancelar</button>
        <button disabled={!valid} onClick={() => {
          const lines = intro.trim() ? intro.split('\n').map((s) => s.trim()).filter(Boolean) : undefined;
          state.onSave({ pokemonId, level, sprite, questId: questId.trim(), intro: lines });
          onClose();
        }} style={{ ...modalPrimaryBtnStyle, opacity: valid ? 1 : 0.4, cursor: valid ? 'pointer' : 'not-allowed' }}>Guardar</button>
      </div>
    </PickerOverlay>
  );
}

// ── Modal: texto de casilla + recompensa opcional ───────────────────────────
function TextEntryModal({ state, onClose }: { state: Extract<NonNullable<PickerState>, { kind: 'text' }>; onClose: () => void }) {
  const [text, setText] = useState(state.initial.text);
  const r = state.initial.reward;
  const [rewardType, setRewardType] = useState<'none' | 'item' | 'pokemon'>(r ? r.type : 'none');
  const [itemKey, setItemKey] = useState(r?.itemKey ?? 'Potion');
  const [amount, setAmount] = useState(r?.amount ?? 1);
  const [pokemonId, setPokemonId] = useState(r?.pokemonId ?? 1);
  const [level, setLevel] = useState(r?.level ?? 5);
  const [questId, setQuestId] = useState(r?.questId ?? state.defaultQuestId);
  const [subPicker, setSubPicker] = useState<'item' | 'pokemon' | null>(null);

  const save = () => {
    const cleanText = text;
    let reward: TextRewardEntry | null = null;
    if (cleanText.trim() !== '') {
      if (rewardType === 'item') reward = { type: 'item', itemKey, amount: amount || 1, questId: questId.trim() || state.defaultQuestId };
      else if (rewardType === 'pokemon') reward = { type: 'pokemon', pokemonId, level: level || 5, questId: questId.trim() || state.defaultQuestId };
    }
    state.onSave({ text: cleanText, reward });
    onClose();
  };

  return (
    <PickerOverlay title={state.title} subtitle="Texto al pulsar A. Vacío = borrar la casilla." onClose={onClose} width={520}>
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
        <div>
          <label style={labelStyle}>Texto (una línea por caja de diálogo)</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} autoFocus style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
        </div>
        <div>
          <label style={labelStyle}>Recompensa al leer</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['none', 'item', 'pokemon'] as const).map((t) => (
              <button key={t} onClick={() => setRewardType(t)} style={{
                flex: 1, padding: '7px 0', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                background: rewardType === t ? '#2a4a2a' : '#0d0d22',
                border: `1px solid ${rewardType === t ? '#4a7a4a' : '#222240'}`,
                color: rewardType === t ? '#aaffaa' : '#99a',
              }}>{t === 'none' ? '— Ninguna' : t === 'item' ? '📦 Objeto' : '⭐ Pokémon'}</button>
            ))}
          </div>
        </div>
        {rewardType === 'item' && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Objeto</label>
              <button onClick={() => setSubPicker('item')} style={{ ...inputStyle, textAlign: 'left', cursor: 'pointer' }}>{itemLabel(itemKey)} <span style={{ color: '#778' }}>· cambiar</span></button>
            </div>
            <div>
              <label style={labelStyle}>Cantidad</label>
              <input type="number" min={1} value={amount} onChange={(e) => setAmount(parseInt(e.target.value, 10) || 1)} style={{ ...inputStyle, width: 70 }} />
            </div>
          </div>
        )}
        {rewardType === 'pokemon' && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <button onClick={() => setSubPicker('pokemon')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0d0d22', border: '1px solid #222240', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/editor/pokemon/${pokemonId}.png`} alt="" style={{ width: 32, height: 32, imageRendering: 'pixelated' }} onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.15'; }} />
              <span style={{ fontSize: 12, color: '#cfe' }}>#{pokemonId} {POKEMON_NAMES_EDITOR[pokemonId] ?? ''} · cambiar</span>
            </button>
            <div>
              <label style={labelStyle}>Nivel</label>
              <input type="number" min={1} max={MAX_LEVEL} value={level} onChange={(e) => setLevel(parseInt(e.target.value, 10) || 1)} style={{ ...inputStyle, width: 70 }} />
            </div>
          </div>
        )}
        {rewardType !== 'none' && (
          <div>
            <label style={labelStyle}>questId (único)</label>
            <input value={questId} onChange={(e) => setQuestId(e.target.value)} style={inputStyle} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 16px', borderTop: '1px solid #2a2a4a' }}>
        <button onClick={onClose} style={modalBtnStyle}>Cancelar</button>
        <button onClick={save} style={modalPrimaryBtnStyle}>Guardar</button>
      </div>

      {subPicker === 'item' && (
        <ItemPickerModal
          state={{ kind: 'item', title: 'Objeto de recompensa', options: state.itemOptions, current: itemKey, onPick: setItemKey }}
          onClose={() => setSubPicker(null)}
        />
      )}
      {subPicker === 'pokemon' && (
        <PokemonPickerModal
          state={{ kind: 'pokemon', title: 'Pokémon de recompensa', current: pokemonId, onPick: setPokemonId }}
          onClose={() => setSubPicker(null)}
        />
      )}
    </PickerOverlay>
  );
}

// ── Modal: elegir mapa destino + (opcional) casilla por click sobre preview ─
function MapTilePickerModal({ state, mapData, onClose, onNavigate }: {
  state: Extract<NonNullable<PickerState>, { kind: 'maptile' }>;
  mapData: MapData;
  onClose: () => void;
  /** Navegar el editor al mapa elegido (sin fijar nada). Cierra el modal. */
  onNavigate?: (mapId: string, pos: { x: number; y: number } | null) => void;
}) {
  const [q, setQ] = useState('');
  const [mapId, setMapId] = useState(state.current?.mapId ?? '');
  const [pos, setPos] = useState<{ x: number; y: number } | null>(state.current?.pos ?? null);
  // Zoom del preview con la rueda (para clicar la casilla exacta sin errores).
  const [zoom, setZoom] = useState(1);
  const searchRef = useAutofocus<HTMLInputElement>();
  const previewScrollRef = useRef<HTMLDivElement>(null);
  // Listener de rueda NO pasivo: hace zoom del mapa destino sin desplazar la página.
  useEffect(() => {
    const el = previewScrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.max(0.5, Math.min(8, z * (e.deltaY < 0 ? 1.15 : 1 / 1.15))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const mapIds = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return Object.keys(mapData).sort().filter((id) => {
      if (!needle) return true;
      return id.toLowerCase().includes(needle) || (mapData[id]?.name ?? '').toLowerCase().includes(needle);
    });
  }, [q, mapData]);

  const map = mapId ? mapData[mapId] : null;
  // Tamaño base para encajar en ~520×420, escalado por el zoom de la rueda.
  const baseTile = map ? Math.max(6, Math.min(28, Math.floor(Math.min(520 / map.width, 420 / map.height)))) : 16;
  const previewTile = Math.max(2, Math.round(baseTile * zoom));
  const canConfirm = !!mapId && (!state.requirePos || !!pos);

  return (
    <PickerOverlay title={state.title} subtitle={state.subtitle} onClose={onClose} width={900}>
      <div style={{ display: 'flex', minHeight: 0, height: '64vh' }}>
        {/* Lista de mapas */}
        <div style={{ width: 260, borderRight: '1px solid #2a2a4a', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '10px 12px 8px' }}>
            <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Buscar mapa…" style={searchInputStyle} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {mapIds.map((id) => {
              const active = mapId === id;
              return (
                <button key={id} onClick={() => { setMapId(id); setPos(null); setZoom(1); }} style={{
                  textAlign: 'left', padding: '6px 10px', borderRadius: 5, cursor: 'pointer',
                  background: active ? '#2a3a5a' : 'transparent',
                  border: `1px solid ${active ? '#6a8aff' : 'transparent'}`,
                  color: active ? '#cfe' : '#bbc', fontSize: 12,
                }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mapData[id]?.name ?? id}</div>
                  <code style={{ fontSize: 9, color: '#778' }}>{id}</code>
                </button>
              );
            })}
            {mapIds.length === 0 && <div style={{ color: '#666', textAlign: 'center', padding: 16, fontSize: 12 }}>Sin resultados</div>}
          </div>
        </div>

        {/* Preview del mapa destino */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div ref={previewScrollRef} style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
            {!map ? (
              <div style={{ color: '#666', fontSize: 13, margin: 'auto', textAlign: 'center' }}>← Elige un mapa destino</div>
            ) : (
              <div>
                {state.requirePos && (
                  <div style={{ fontSize: 11, color: pos ? '#aaffaa' : '#ffcc88', marginBottom: 8 }}>
                    {pos ? `Casilla destino: (${pos.x}, ${pos.y})` : '👆 Click en una casilla; usa la rueda para hacer zoom'}
                    <span style={{ color: '#667', marginLeft: 8 }}>· zoom {zoom.toFixed(1)}×</span>
                  </div>
                )}
                <div
                  onClick={(e) => {
                    if (!state.requirePos) return;
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    const x = Math.floor((e.clientX - rect.left) / previewTile);
                    const y = Math.floor((e.clientY - rect.top) / previewTile);
                    if (x >= 0 && y >= 0 && x < map.width && y < map.height) setPos({ x, y });
                  }}
                  style={{
                    position: 'relative', width: map.width * previewTile, height: map.height * previewTile,
                    backgroundImage: `url(/api/admin/map-image/${map.imageFile})`, backgroundSize: '100% 100%',
                    imageRendering: 'pixelated', cursor: state.requirePos ? 'crosshair' : 'default',
                    border: '1px solid #2a2a4a',
                  }}
                >
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `linear-gradient(to right, rgba(120,120,200,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,120,200,0.18) 1px, transparent 1px)`, backgroundSize: `${previewTile}px ${previewTile}px` }} />
                  {/* Entrenadores (para hide-condition) */}
                  {state.highlightTrainers && map.trainers?.map((t, i) => (
                    <div key={i} title={`${t.npcKey} (${t.pos.x},${t.pos.y})`} style={{ position: 'absolute', left: t.pos.x * previewTile, top: t.pos.y * previewTile, width: previewTile, height: previewTile, background: 'rgba(255,80,80,0.45)', border: '1px solid #ff6666', boxSizing: 'border-box' }} />
                  ))}
                  {pos && (
                    <div style={{ position: 'absolute', left: pos.x * previewTile, top: pos.y * previewTile, width: previewTile, height: previewTile, background: 'rgba(80,255,120,0.5)', border: '2px solid #6effa0', boxSizing: 'border-box' }} />
                  )}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 16px', borderTop: '1px solid #2a2a4a' }}>
            {onNavigate && (
              <button
                disabled={!mapId}
                onClick={() => { onNavigate(mapId, pos); onClose(); }}
                title="Abrir este mapa en el editor para navegarlo (no fija el destino)"
                style={{
                  ...modalBtnStyle,
                  marginRight: 'auto',
                  border: '1px solid #3a6a4a',
                  color: mapId ? '#8fe0a8' : '#556',
                  opacity: mapId ? 1 : 0.5,
                  cursor: mapId ? 'pointer' : 'not-allowed',
                }}
              >
                🧭 Ir al mapa
              </button>
            )}
            <button onClick={onClose} style={{ ...modalBtnStyle, marginLeft: onNavigate ? undefined : 'auto' }}>Cancelar</button>
            <button disabled={!canConfirm} onClick={() => { state.onPick({ mapId, pos }); onClose(); }} style={{ ...modalPrimaryBtnStyle, opacity: canConfirm ? 1 : 0.4, cursor: canConfirm ? 'pointer' : 'not-allowed' }}>
              {state.requirePos ? 'Fijar destino' : 'Elegir mapa'}
            </button>
          </div>
        </div>
      </div>
    </PickerOverlay>
  );
}

/** Despacha el modal correcto según el estado del picker. */
function PickerHost({ picker, mapData, onClose, onNavigate }: {
  picker: PickerState;
  mapData: MapData;
  onClose: () => void;
  onNavigate?: (mapId: string, pos: { x: number; y: number } | null) => void;
}) {
  if (!picker) return null;
  switch (picker.kind) {
    case 'item': return <ItemPickerModal state={picker} onClose={onClose} />;
    case 'pokemon': return <PokemonPickerModal state={picker} onClose={onClose} />;
    case 'gift': return <GiftFormModal state={picker} onClose={onClose} />;
    case 'static': return <StaticPokemonFormModal state={picker} onClose={onClose} />;
    case 'text': return <TextEntryModal state={picker} onClose={onClose} />;
    case 'maptile': return <MapTilePickerModal state={picker} mapData={mapData} onClose={onClose} onNavigate={onNavigate} />;
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  GRAFO DE CONEXIONES ENTRE MAPAS
// ════════════════════════════════════════════════════════════════════════════

interface GraphNode { id: string; name: string; x: number; y: number }
interface GraphEdge { from: string; to: string; kind: 'door' | 'teleport' | 'exit' }

function computeGraph(mapData: MapData): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const ids = Object.keys(mapData).sort();
  const idSet = new Set(ids);
  const edgeKey = new Set<string>();
  const edges: GraphEdge[] = [];
  const addEdge = (from: string, to: string, kind: GraphEdge['kind']) => {
    if (!from || !to || from === to || !idSet.has(to)) return;
    const k = `${from}|${to}|${kind}`;
    if (edgeKey.has(k)) return;
    edgeKey.add(k);
    edges.push({ from, to, kind });
  };
  for (const id of ids) {
    const e = mapData[id];
    // Puertas (maps)
    for (const row of Object.values(e.maps ?? {})) {
      for (const dest of Object.values(row)) addEdge(id, dest as string, 'door');
    }
    // Teleports
    for (const row of Object.values(e.teleports ?? {})) {
      for (const t of Object.values(row)) addEdge(id, (t as { map: string }).map, 'teleport');
    }
    // Salida (exitReturnMap)
    if (e.exitReturnMap) addEdge(id, e.exitReturnMap, 'exit');
  }
  // Posiciones iniciales deterministas (círculo) por índice.
  const n = ids.length || 1;
  const nodes: GraphNode[] = ids.map((id, i) => ({
    id,
    name: mapData[id]?.name ?? id,
    x: Math.cos((2 * Math.PI * i) / n) * 400 + (((i * 97) % 60) - 30),
    y: Math.sin((2 * Math.PI * i) / n) * 400 + (((i * 53) % 60) - 30),
  }));
  return { nodes, edges };
}

/** Simulación de fuerzas (Fruchterman-Reingold simplificado), determinista. */
function layoutGraph(nodes: GraphNode[], edges: GraphEdge[], iterations = 250): GraphNode[] {
  const pos = nodes.map((n) => ({ ...n }));
  const idx = new Map(pos.map((p, i) => [p.id, i]));
  const area = 1_200_000;
  const k = Math.sqrt(area / Math.max(1, pos.length));
  let temp = 220;
  const cool = temp / (iterations + 1);
  for (let it = 0; it < iterations; it++) {
    const disp = pos.map(() => ({ x: 0, y: 0 }));
    // Repulsión entre todos los pares.
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        let dx = pos[i].x - pos[j].x;
        let dy = pos[i].y - pos[j].y;
        const dist = Math.hypot(dx, dy) || 0.01;
        if (dist > 600) continue; // poda lejana
        const rep = (k * k) / dist;
        dx /= dist; dy /= dist;
        disp[i].x += dx * rep; disp[i].y += dy * rep;
        disp[j].x -= dx * rep; disp[j].y -= dy * rep;
      }
    }
    // Atracción por aristas.
    for (const e of edges) {
      const a = idx.get(e.from); const b = idx.get(e.to);
      if (a === undefined || b === undefined) continue;
      let dx = pos[a].x - pos[b].x;
      let dy = pos[a].y - pos[b].y;
      const dist = Math.hypot(dx, dy) || 0.01;
      const att = (dist * dist) / k;
      dx /= dist; dy /= dist;
      disp[a].x -= dx * att; disp[a].y -= dy * att;
      disp[b].x += dx * att; disp[b].y += dy * att;
    }
    // Aplicar con límite de temperatura + leve gravedad al centro.
    for (let i = 0; i < pos.length; i++) {
      const d = Math.hypot(disp[i].x, disp[i].y) || 0.01;
      pos[i].x += (disp[i].x / d) * Math.min(d, temp) - pos[i].x * 0.012;
      pos[i].y += (disp[i].y / d) * Math.min(d, temp) - pos[i].y * 0.012;
    }
    temp = Math.max(2, temp - cool);
  }
  return pos;
}

function MapGraphOverlay({ mapData, currentMapId, onJump, onClose }: {
  mapData: MapData;
  currentMapId: string;
  onJump: (id: string) => void;
  onClose: () => void;
}) {
  const { nodes, edges } = useMemo(() => {
    const g = computeGraph(mapData);
    return { nodes: layoutGraph(g.nodes, g.edges), edges: g.edges };
  }, [mapData]);

  const posById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const [hover, setHover] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // viewBox para pan/zoom
  const bbox = useMemo(() => {
    if (nodes.length === 0) return { x: -500, y: -500, w: 1000, h: 1000 };
    const xs = nodes.map((n) => n.x); const ys = nodes.map((n) => n.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const pad = 80;
    return { x: minX - pad, y: minY - pad, w: (maxX - minX) + pad * 2, h: (maxY - minY) + pad * 2 };
  }, [nodes]);
  // Init perezoso: el overlay se monta de nuevo cada vez que se abre, así que
  // captura el bbox correcto sin necesidad de sincronizar con un efecto.
  const [view, setView] = useState(() => bbox);
  const [grabbing, setGrabbing] = useState(false);

  const drag = useRef<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const matches = (id: string) => query.trim() && (id.toLowerCase().includes(query.toLowerCase()) || (mapData[id]?.name ?? '').toLowerCase().includes(query.toLowerCase()));

  function onWheel(e: React.WheelEvent) {
    const factor = e.deltaY > 0 ? 1.12 : 0.89;
    setView((v) => {
      const nw = v.w * factor, nh = v.h * factor;
      return { x: v.x - (nw - v.w) / 2, y: v.y - (nh - v.h) / 2, w: nw, h: nh };
    });
  }
  function onPointerDown(e: React.PointerEvent) { drag.current = { x: e.clientX, y: e.clientY }; setGrabbing(true); (e.target as Element).setPointerCapture?.(e.pointerId); }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const dx = (e.clientX - drag.current.x) * (view.w / rect.width);
    const dy = (e.clientY - drag.current.y) * (view.h / rect.height);
    drag.current = { x: e.clientX, y: e.clientY };
    setView((v) => ({ ...v, x: v.x - dx, y: v.y - dy }));
  }
  function onPointerUp() { drag.current = null; setGrabbing(false); }

  const KIND_COLOR: Record<GraphEdge['kind'], string> = { door: '#5a8aff', teleport: '#cc88ff', exit: '#88ccff' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(6,6,14,0.92)', display: 'flex', flexDirection: 'column', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid #2a2a4a', flexWrap: 'wrap' }}>
        <strong style={{ color: '#a0c0ff', fontSize: 15 }}>🕸 Grafo de conexiones</strong>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔍 Resaltar mapa…" style={{ ...searchInputStyle, width: 220, padding: '6px 10px', fontSize: 13 }} />
        <span style={{ color: '#888', fontSize: 11 }}>{nodes.length} mapas · {edges.length} conexiones · rueda=zoom · arrastra=mover · click=ir</span>
        <span style={{ display: 'flex', gap: 10, marginLeft: 'auto', fontSize: 11 }}>
          <span style={{ color: KIND_COLOR.door }}>● puerta</span>
          <span style={{ color: KIND_COLOR.teleport }}>● teleport</span>
          <span style={{ color: KIND_COLOR.exit }}>● salida</span>
        </span>
        <button onClick={() => setView(bbox)} style={modalBtnStyle}>Centrar</button>
        <button onClick={onClose} style={{ ...modalBtnStyle, background: '#2a1010', border: '1px solid #5a2a2a', color: '#ff8888' }}>Cerrar ✕</button>
      </div>
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ flex: 1, width: '100%', height: '100%', cursor: grabbing ? 'grabbing' : 'grab', touchAction: 'none' }}
      >
        <defs>
          {(['door', 'teleport', 'exit'] as const).map((kind) => (
            <marker key={kind} id={`arrow-${kind}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={KIND_COLOR[kind]} />
            </marker>
          ))}
        </defs>
        {edges.map((e, i) => {
          const a = posById.get(e.from); const b = posById.get(e.to);
          if (!a || !b) return null;
          const active = hover === e.from || hover === e.to;
          return (
            <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={KIND_COLOR[e.kind]} strokeWidth={active ? 2.4 : 0.8} strokeOpacity={hover && !active ? 0.08 : active ? 0.95 : 0.32}
              markerEnd={`url(#arrow-${e.kind})`} />
          );
        })}
        {nodes.map((n) => {
          const isCurrent = n.id === currentMapId;
          const isHover = hover === n.id;
          const isMatch = matches(n.id);
          const r = isCurrent ? 9 : 6;
          return (
            <g key={n.id} transform={`translate(${n.x},${n.y})`} style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)}
              onClick={() => { onJump(n.id); onClose(); }}>
              <circle r={r}
                fill={isCurrent ? '#ffcc44' : isMatch ? '#66ff99' : '#3a6aff'}
                stroke={isHover ? '#fff' : '#0a0a1a'} strokeWidth={isHover ? 2 : 1}
                fillOpacity={query && !isMatch && !isCurrent ? 0.25 : 1} />
              {(isHover || isCurrent || isMatch || view.w < 1600) && (
                <text x={r + 3} y={3.5} fontSize={view.w < 900 ? 9 : 11} fill={isCurrent ? '#ffd' : '#bcd'} style={{ pointerEvents: 'none', fontFamily: 'monospace' }}>
                  {n.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────

export default function MapEditor() {
  const [mapData, setMapData] = useState<MapData>({});
  const [selectedMapId, setSelectedMapId] = useState<string>('');
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [walls, setWalls] = useState<Record<string, number[]>>({});
  const [fences, setFences] = useState<Record<string, number[]>>({});
  const [elevations, setElevations] = useState<Record<string, Record<string, number>>>({});
  const [ramps, setRamps] = useState<Record<string, number[]>>({});
  const [activeElevation, setActiveElevation] = useState<ElevationBrush>(1);
  // Dirección de salto por tile de saliente ({fila:{col:dir}}). Default Down.
  const [fenceDirections, setFenceDirections] = useState<Record<string, Record<string, DirectionName>>>({});
  // Dirección activa al pintar salientes en el modo "fences".
  const [activeFenceDir, setActiveFenceDir] = useState<DirectionName>('down');
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
  const [dayCareNpc, setDayCareNpc] = useState<{ x: number; y: number } | null>(null);
  const [activeSpot, setActiveSpot] = useState<SpotKey>('start');
  const [spinners, setSpinners] = useState<Record<string, Record<string, DirectionName>>>({});
  const [stoppers, setStoppers] = useState<Record<string, number[]>>({});
  const [activeMechanic, setActiveMechanic] = useState<MechanicTool>('spinner-up');
  const [cave, setCave] = useState(false);
  const [dark, setDark] = useState(false);
  const [allowBicycle, setAllowBicycle] = useState(false);
  const [flyable, setFlyable] = useState(false);
  const [flySpot, setFlySpot] = useState<{ x: number; y: number } | null>(null);
  const [flyAlwaysAvailable, setFlyAlwaysAvailable] = useState(false);
  const [flyUnlockTiles, setFlyUnlockTiles] = useState<Record<string, number[]>>({});
  const [musicField, setMusicField] = useState<string | null>(null);
  // Portales
  const [portals, setPortals] = useState<PortalEntry[]>([]);
  const [exitReturnMap, setExitReturnMap] = useState<string | null>(null);
  const [exitReturnPos, setExitReturnPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedPortalIdx, setSelectedPortalIdx] = useState<number | null>(null);
  const [itemTypeKeys, setItemTypeKeys] = useState<string[]>([]);
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [editMode, setEditMode] = useState<EditMode>('npc');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [picker, setPicker] = useState<PickerState>(null);
  // Auto-relleno de contenido (Pokémon salvajes / equipos de entrenador).
  const [autofillEnc, setAutofillEnc] = useState<{ tables: EncounterTableKey[]; isCave: boolean } | null>(null);
  const [autofillTr, setAutofillTr] = useState<{ scope: 'one' | 'all'; index: number | null } | null>(null);
  const [zoom, setZoom] = useState(32);
  const [showGrid, setShowGrid] = useState(true);
  const [showWalls, setShowWalls] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [commitMsg, setCommitMsg] = useState<{ text: string; tone: 'ok' | 'warn' | 'err' } | null>(null);
  const [building, setBuilding] = useState(false);
  // Subida de PNG de mapa: contador de cache-bust (se añade como ?v= a la URL
  // de la imagen para que el canvas refresque tras reemplazarla).
  const [imgVersion, setImgVersion] = useState(0);
  const [uploadingImg, setUploadingImg] = useState(false);
  // Modo mantenimiento del juego (flag en Supabase; toggle instantáneo).
  const [maintenance, setMaintenance] = useState<boolean | null>(null);
  const [maintBusy, setMaintBusy] = useState(false);
  // Jugadores con acceso durante el mantenimiento (allowlist en app_config,
  // verificada en servidor con player_id + write_token).
  const [maintAllowed, setMaintAllowed] = useState<string[]>([]);
  const [maintPlayers, setMaintPlayers] = useState<{ playerId: string; name: string; pokemonCount: number }[]>([]);
  const [maintPanelOpen, setMaintPanelOpen] = useState(false);
  const [maintSearch, setMaintSearch] = useState('');
  useEffect(() => {
    fetch('/api/admin/maintenance').then((r) => r.json()).then((d) => {
      setMaintenance(!!d.maintenance);
      if (Array.isArray(d.allowedPlayers)) setMaintAllowed(d.allowedPlayers);
    }).catch(() => {});
  }, []);
  const openMaintPanel = async () => {
    setMaintPanelOpen(true);
    try {
      const d = await fetch('/api/admin/maintenance?players=1').then((r) => r.json());
      if (Array.isArray(d.allowedPlayers)) setMaintAllowed(d.allowedPlayers);
      if (Array.isArray(d.players)) setMaintPlayers(d.players);
    } catch {
      setCommitMsg({ text: 'No se pudo cargar la lista de jugadores.', tone: 'err' });
    }
  };
  const toggleAllowedPlayer = async (playerId: string) => {
    const id = playerId.toLowerCase();
    const next = maintAllowed.some((p) => p.toLowerCase() === id)
      ? maintAllowed.filter((p) => p.toLowerCase() !== id)
      : [...maintAllowed, id];
    const prev = maintAllowed;
    setMaintAllowed(next); // optimista; se revierte si el POST falla
    try {
      const r = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowedPlayers: next }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || r.statusText);
      if (Array.isArray(d.allowedPlayers)) setMaintAllowed(d.allowedPlayers);
    } catch (e) {
      setMaintAllowed(prev);
      setCommitMsg({ text: `No se pudo actualizar el acceso: ${String(e)}`, tone: 'err' });
    }
  };
  const toggleMaintenance = async () => {
    if (maintBusy || maintenance === null) return;
    const next = !maintenance;
    if (!confirm(next
      ? '¿Poner el JUEGO en modo mantenimiento? Cualquiera que entre verá el mensaje del Team Rocket (instantáneo).'
      : '¿Quitar el mantenimiento y reabrir el juego?')) return;
    setMaintBusy(true);
    try {
      const r = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maintenance: next,
          message: 'Pokémon Wedding está bajo mantenimiento del Team Rocket. Disculpa las molestias.',
        }),
      });
      if (r.ok) {
        setMaintenance(next);
        setCommitMsg({ text: next ? '🚧 Juego en modo mantenimiento.' : '✅ Juego reabierto.', tone: 'ok' });
      } else {
        setCommitMsg({ text: 'No se pudo cambiar el mantenimiento.', tone: 'err' });
      }
    } catch (e) {
      setCommitMsg({ text: `Error de red al cambiar mantenimiento: ${String(e)}`, tone: 'err' });
    } finally {
      setMaintBusy(false);
    }
  };
  const [showGraph, setShowGraph] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [error, setError] = useState('');
  const [showMinimap, setShowMinimap] = useState(false);
  const [minimapMode, setMinimapMode] = useState<'edit' | 'navigate'>('navigate');
  const [minimapPos, setMinimapPos] = useState<{ x: number; y: number } | null>(null);
  // Agrupación del mapa en el minimapa: null = auto por nombre; "" = suelto; "<id>" = forzado a ese grupo.
  const [minimapParent, setMinimapParent] = useState<string | null>(null);
  // Vista del minimapa de Kanto (pan + pinch-zoom). Las coordenadas de los
  // puntos se siguen expresando en % sobre la imagen, así que el transform
  // del contenedor desplaza/escala imagen y puntos a la vez: nunca se
  // desajustan. El mapeo tap→píxel usa el rect REAL de la imagen (que ya
  // refleja el transform), por lo que también es independiente del zoom.
  const [mmView, setMmView] = useState<{ scale: number; tx: number; ty: number }>({ scale: 1, tx: 0, ty: 0 });
  // Grupo desplegado en modo Navegar (ciudad/mazmorra cuyos sub-mapas se listan).
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const mmViewportRef = useRef<HTMLDivElement>(null);
  const mmImgRef = useRef<HTMLImageElement>(null);
  // Gesto del minimapa: 1 dedo = tocar (editar/navegar), 2 dedos = pan+pinch,
  // ratón = arrastrar para desplazar / clic para tocar, rueda = zoom focal.
  const mmGesture = useRef<{
    pointers: Map<number, { x: number; y: number }>;
    mode: 'none' | 'pinch' | 'mouse-pan';
    startScale: number; startTx: number; startTy: number;
    startDist: number; startCx: number; startCy: number;
    downX: number; downY: number; moved: boolean; downType: string;
  }>({
    pointers: new Map(), mode: 'none',
    startScale: 1, startTx: 0, startTy: 0,
    startDist: 0, startCx: 0, startCy: 0,
    downX: 0, downY: 0, moved: false, downType: '',
  });

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

  // ── Pan / zoom del canvas (desplazar y escalar; imprescindible en móvil) ────
  // Dos modelos que conviven sin estorbarse:
  //  • Táctil (cualquier dispositivo, SIN cambiar de modo): UN dedo edita/pinta;
  //    DOS dedos desplazan el mapa y hacen pinch-zoom. Es el patrón estándar de
  //    editores táctiles (Figma, mapas) y funciona sea cual sea la escala.
  //  • Escritorio / explícito: el botón ✋ Mover activa el arrastre con ratón.
  const [panMode, setPanMode] = useState(false);
  // Panel "Desplazar todo": realinea todos los elementos del mapa a la vez.
  const [shiftPanelOpen, setShiftPanelOpen] = useState(false);
  const [shiftStep, setShiftStep] = useState(1);
  // Selección rectangular (modo 'select'): cortar/copiar/pegar bloques.
  const [selRect, setSelRect] = useState<SelRect | null>(null);
  // Casilla de llegada tras navegar por una puerta (🧭); pulso temporal.
  const [arrivalMark, setArrivalMark] = useState<{ x: number; y: number } | null>(null);
  const arrivalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selDrag = useRef<{ startX: number; startY: number } | null>(null);
  // El portapapeles vive fuera del mapa → sobrevive al cambiar de mapa (pegar en otro).
  const [clipboard, setClipboard] = useState<MapClipboard | null>(null);
  // Al pulsar "Pegar", el siguiente clic en el lienzo fija la esquina sup-izq.
  const [pastePending, setPastePending] = useState(false);

  // ── Maximizar el lienzo (más espacio para pintar agua/paredes, etc.) ──────
  // Dos ejes independientes + un atajo que los combina:
  //  • inspectorOpen → eje HORIZONTAL: colapsar el panel derecho ⇒ el lienzo
  //    ocupa todo el ancho. Una pestaña fina permite reabrirlo sin perder nada.
  //  • toolbarCompact → eje VERTICAL: ocultar los controles secundarios de la
  //    barra (export, grafo, compilar…) para que no haga wrap en varias filas,
  //    ganando alto para el lienzo. Lo esencial (mapa, modos, zoom, guardar)
  //    sigue siempre visible y se puede seguir editando con normalidad.
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [toolbarCompact, setToolbarCompact] = useState(false);
  const maximized = !inspectorOpen && toolbarCompact;
  const toggleMaximize = useCallback(() => {
    // Maximizado ⇒ restaura ambos ejes; si no, maximiza ambos a la vez.
    const isMax = !inspectorOpen && toolbarCompact;
    setInspectorOpen(isMax);
    setToolbarCompact(!isMax);
  }, [inspectorOpen, toolbarCompact]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const panState = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number } | null>(null);

  // Gesto multitáctil de 2 dedos (pan + pinch-zoom). `active` se consulta en los
  // manejadores de edición para que el dibujo de un dedo se cancele en cuanto
  // entra el segundo dedo.
  const gesture = useRef<{
    pointers: Map<number, { x: number; y: number }>;
    active: boolean;
    startCenterX: number;
    startCenterY: number;
    startDist: number;
    startScrollLeft: number;
    startScrollTop: number;
    startZoom: number;
  }>({
    pointers: new Map(),
    active: false,
    startCenterX: 0,
    startCenterY: 0,
    startDist: 0,
    startScrollLeft: 0,
    startScrollTop: 0,
    startZoom: 32,
  });
  // Punto focal del pinch a preservar tras el cambio (discreto) de zoom: el tile
  // bajo los dedos debe seguir bajo los dedos cuando el lienzo se redimensiona.
  const pinchFocus = useRef<{ tileX: number; tileY: number; offsetX: number; offsetY: number } | null>(null);

  // ¿Es un toque secundario (segundo dedo) mientras ya hay otro apoyado? Si lo
  // es, los manejadores de edición lo ignoran para no pintar/colocar al iniciar
  // un gesto de dos dedos.
  const isSecondaryTouch = useCallback((e: React.PointerEvent) => {
    return e.pointerType === 'touch' && gesture.current.pointers.size >= 1;
  }, []);

  // Tras un paso de pinch-zoom, reposiciona el scroll para mantener el punto
  // focal estable y re-basa el gesto en curso para que el pan siga fluido.
  useLayoutEffect(() => {
    const pf = pinchFocus.current;
    const el = scrollRef.current;
    if (!pf || !el) return;
    el.scrollLeft = pf.tileX * zoom - pf.offsetX;
    el.scrollTop = pf.tileY * zoom - pf.offsetY;
    pinchFocus.current = null;
    if (gesture.current.active) {
      gesture.current.startScrollLeft = el.scrollLeft;
      gesture.current.startScrollTop = el.scrollTop;
    }
  }, [zoom]);

  // Rueda del ratón sobre el minimapa = zoom focal (listener nativo no pasivo
  // para poder preventDefault y que no haga scroll de la página).
  useEffect(() => {
    const vp = mmViewportRef.current;
    if (!vp || !showMinimap) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = vp.getBoundingClientRect();
      const fx = e.clientX - rect.left;
      const fy = e.clientY - rect.top;
      setMmView((prev) => {
        const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
        const scale = Math.max(MM_MIN_SCALE, Math.min(MM_MAX_SCALE, prev.scale * factor));
        const cx = (fx - prev.tx) / prev.scale;
        const cy = (fy - prev.ty) / prev.scale;
        const w = vp.clientWidth, h = vp.clientHeight;
        const tx = Math.min(0, Math.max(w - w * scale, fx - cx * scale));
        const ty = Math.min(0, Math.max(h - h * scale, fy - cy * scale));
        return { scale, tx, ty };
      });
    };
    vp.addEventListener('wheel', onWheel, { passive: false });
    return () => vp.removeEventListener('wheel', onWheel);
  }, [showMinimap]);

  const onCanvasScrollPointerDown = useCallback((e: React.PointerEvent) => {
    const el = scrollRef.current;
    // Gesto táctil de 2 dedos: registrar el dedo y, al llegar el segundo,
    // arrancar pan+pinch cancelando cualquier edición en curso.
    if (e.pointerType === 'touch') {
      const g = gesture.current;
      g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (g.pointers.size === 2 && el) {
        wallPaint.current = null;
        dragging.current = null;
        entityDrag.current = null;
        suppressNextClick.current = true;
        const [a, b] = [...g.pointers.values()];
        g.active = true;
        g.startCenterX = (a.x + b.x) / 2;
        g.startCenterY = (a.y + b.y) / 2;
        g.startDist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        g.startScrollLeft = el.scrollLeft;
        g.startScrollTop = el.scrollTop;
        g.startZoom = zoom;
        for (const id of g.pointers.keys()) el.setPointerCapture?.(id);
      }
    }
    // Arrastre con ratón en modo Mover (escritorio / explícito).
    if (panMode && el) {
      panState.current = {
        startX: e.clientX,
        startY: e.clientY,
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
      };
      el.setPointerCapture?.(e.pointerId);
    }
  }, [panMode, zoom]);

  const onCanvasScrollPointerMove = useCallback((e: React.PointerEvent) => {
    const g = gesture.current;
    if (g.pointers.has(e.pointerId)) {
      g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    const el = scrollRef.current;
    if (g.active && g.pointers.size >= 2 && el) {
      e.preventDefault();
      const [a, b] = [...g.pointers.values()];
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      // Pinch-zoom: saltar al nivel de ZOOM_LEVELS más cercano al ratio actual.
      const target = nearestZoomLevel(g.startZoom * (dist / g.startDist));
      if (target !== zoom) {
        const rect = el.getBoundingClientRect();
        const offsetX = cx - rect.left;
        const offsetY = cy - rect.top;
        pinchFocus.current = {
          tileX: (el.scrollLeft + offsetX) / zoom,
          tileY: (el.scrollTop + offsetY) / zoom,
          offsetX,
          offsetY,
        };
        // Re-basar el gesto alrededor del centro/distancia actuales para que el
        // pan posterior sea coherente tras el redimensionado del lienzo.
        g.startDist = dist;
        g.startZoom = target;
        g.startCenterX = cx;
        g.startCenterY = cy;
        setZoom(target);
        return;
      }
      // Pan: desplazar el scroll en sentido opuesto al centro de los dedos.
      el.scrollLeft = g.startScrollLeft - (cx - g.startCenterX);
      el.scrollTop = g.startScrollTop - (cy - g.startCenterY);
      return;
    }
    // Arrastre con ratón en modo Mover.
    const p = panState.current;
    if (!p || !el) return;
    el.scrollLeft = p.scrollLeft - (e.clientX - p.startX);
    el.scrollTop = p.scrollTop - (e.clientY - p.startY);
  }, [zoom]);

  const onCanvasScrollPointerUp = useCallback((e: React.PointerEvent) => {
    const g = gesture.current;
    if (g.pointers.has(e.pointerId)) {
      g.pointers.delete(e.pointerId);
      scrollRef.current?.releasePointerCapture?.(e.pointerId);
    }
    if (g.pointers.size < 2) {
      if (g.active) {
        g.active = false;
        suppressNextClick.current = true; // tragar el click posterior al gesto
      }
      g.startDist = 0;
    }
    panState.current = null;
  }, []);

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
    setElevations(m.elevations ?? {});
    setRamps(m.ramps ?? {});
    setFenceDirections(m.fenceDirections ?? {});
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
    setDayCareNpc(m.dayCareNpc ?? null);
    setSpinners(m.spinners ?? {});
    setStoppers(m.stoppers ?? {});
    setCave(!!m.cave);
    setDark(!!m.dark);
    setAllowBicycle(!!m.allowBicycle);
    setFlyable(!!m.flyable);
    setFlySpot(m.flySpot ?? null);
    setFlyAlwaysAvailable(!!m.flyAlwaysAvailable);
    setFlyUnlockTiles(m.flyUnlockTiles ?? {});
    setMusicField(m.music ?? null);
    setPortals(flattenPortals(m, mapData));
    setExitReturnMap(m.exitReturnMap ?? null);
    setExitReturnPos(m.exitReturnPos ?? null);
    setMinimapPos(m.minimapPos ?? null);
    setMinimapParent(m.minimapParent ?? null);
    setSelectedPortalIdx(null);
  }

  // ── Cambiar mapa ──────────────────────────────────────────────────────
  function selectMap(id: string): boolean {
    if (dirty && id !== selectedMapId) {
      const ok = window.confirm('Hay cambios sin guardar en el mapa actual. ¿Cambiar de mapa y descartarlos en pantalla?');
      if (!ok) return false;
    }
    setSelectedMapId(id);
    if (mapData[id]) loadFromEntry(mapData[id]);
    setSelectedIdx(null);
    // Limpiar la selección al cambiar de mapa; el portapapeles SÍ se conserva
    // (para poder cortar en un mapa y pegar en otro).
    setSelRect(null);
    setArrivalMark(null);
    setPastePending(false);
    setDirty(false);
    return true;
  }

  /**
   * Navegación por puertas: ir a un mapa y (opcional) centrar y marcar la
   * casilla de llegada con un pulso verde (se apaga solo a los 5 s).
   * Respeta el aviso de cambios sin guardar de selectMap.
   */
  function goToMap(id: string, pos?: { x: number; y: number } | null) {
    if (!mapData[id]) return;
    if (!selectMap(id)) return;
    if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
    if (pos) {
      setArrivalMark(pos);
      arrivalTimerRef.current = setTimeout(() => setArrivalMark(null), 5000);
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollLeft = Math.max(0, pos.x * zoom - el.clientWidth / 2 + zoom / 2);
        el.scrollTop = Math.max(0, pos.y * zoom - el.clientHeight / 2 + zoom / 2);
      });
    } else {
      setArrivalMark(null);
    }
  }

  // Estado de escritura para el commit del .ts. Solo campos gestionados.
  // NO incluye `encounters` (se preserva el getEncounterData del .ts).
  function buildMapWriteState() {
    const { maps, teleports, exits } = nestPortals(portals);
    return {
      width: currentMap?.width,
      height: currentMap?.height,
      start: startPos,
      cave, dark, allowBicycle,
      // flyable/flySpot/flyAlwaysAvailable/flyUnlockTiles SÍ se escriben al .ts:
      // los consume la MO Vuelo.
      flyable, flySpot, flyAlwaysAvailable, flyUnlockTiles,
      music: musicField,
      trainers,
      walls, fences, fenceDirections, elevations, ramps, grass, water,
      texts, textRewards,
      items: items.map((it) => ({ itemKey: it.itemKey, pos: it.pos, ...(it.hidden ? { hidden: true } : {}) })),
      gifts, staticPokemon, cuttableTrees, berryTrees, boulders,
      pokemonCenter, pc: pcPos, store: storePos, storeItems,
      recoverLocation, onlineBattleNpc, dayCareNpc,
      spinners, stoppers,
      maps, teleports, exits, exitReturnMap, exitReturnPos,
      minimapPos, minimapParent,
    };
  }

  // ── Dimensiones del mapa (tiles) ─────────────────────────────────────────
  // Se editan DIRECTAMENTE sobre mapData (el canvas y todos los overlays leen
  // currentMap.width/height). Persisten con 💾 Guardar (override Supabase +
  // width/height en el .ts vía commit-map).
  function updateMapDims(patch: { width?: number; height?: number }) {
    setMapData((d) => {
      const cur = d[selectedMapId];
      if (!cur) return d;
      const width = patch.width !== undefined && Number.isInteger(patch.width) && patch.width > 0 ? patch.width : cur.width;
      const height = patch.height !== undefined && Number.isInteger(patch.height) && patch.height > 0 ? patch.height : cur.height;
      if (width === cur.width && height === cur.height) return d;
      return { ...d, [selectedMapId]: { ...cur, width, height } };
    });
    setDirty(true);
  }

  // ── Subir PNG para reemplazar la imagen del mapa ─────────────────────────
  // Los bytes se suben BAJO EL NOMBRE ACTUAL (currentMap.imageFile): así el
  // import del .ts sigue siendo válido sin tocar código. El servidor valida el
  // PNG, lo commitea a GitHub y guarda copia en Supabase (preview instantáneo).
  async function uploadMapImage(f: File) {
    if (!currentMap) return;
    setUploadingImg(true);
    try {
      const arr = new Uint8Array(await f.arrayBuffer());
      let bin = '';
      const CHUNK = 0x8000;
      for (let i = 0; i < arr.length; i += CHUNK) {
        bin += String.fromCharCode(...arr.subarray(i, i + CHUNK));
      }
      const contentBase64 = btoa(bin);

      const res = await fetch('/api/admin/upload-map-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: currentMap.imageFile, contentBase64 }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean; configured?: boolean; previewSaved?: boolean;
        pixelWidth?: number; pixelHeight?: number;
        branch?: string; commitSha?: string; error?: string; warnings?: string[];
      };
      if (!res.ok || !json.ok) {
        setCommitMsg({ text: `Imagen NO subida: ${json.error ?? `HTTP ${res.status}`}`, tone: 'err' });
        return;
      }
      setImgVersion((v) => v + 1);

      const parts: string[] = [];
      if (json.commitSha) parts.push(`✓ Imagen ${currentMap.imageFile} → commit ${json.commitSha.slice(0, 7)} (${json.branch})`);
      else if (json.configured === false) parts.push(`Imagen solo en preview (falta GH_TOKEN, sin commit)`);
      if (json.warnings?.length) parts.push(json.warnings.join(' · '));
      setCommitMsg({ text: parts.join(' · '), tone: json.warnings?.length ? 'warn' : 'ok' });

      // Proponer ajustar las dimensiones en tiles a las del PNG nuevo.
      if (json.pixelWidth && json.pixelHeight) {
        const tw = Math.round(json.pixelWidth / 16);
        const th = Math.round(json.pixelHeight / 16);
        if ((tw !== currentMap.width || th !== currentMap.height) && tw > 0 && th > 0) {
          const ok = window.confirm(
            `El PNG mide ${json.pixelWidth}×${json.pixelHeight}px → ${tw}×${th} tiles.\n` +
            `El mapa está configurado como ${currentMap.width}×${currentMap.height} tiles.\n\n` +
            `¿Ajustar width/height a ${tw}×${th}? (recuerda 💾 Guardar después)`
          );
          if (ok) updateMapDims({ width: tw, height: th });
        }
      }
    } catch (e) {
      setCommitMsg({ text: `Error subiendo imagen: ${String(e)}`, tone: 'err' });
    } finally {
      setUploadingImg(false);
    }
  }

  // ── Compilar el juego (dispara el GitHub Action) ────────────────────────
  async function compileGame() {
    if (dirty && !confirm('Tienes cambios sin guardar. ¿Compilar de todos modos? (se compilará lo ya commiteado)')) return;
    if (!confirm('Esto reconstruye el bundle del juego desde el código (tarda unos minutos en GitHub Actions). ¿Continuar?')) return;
    setBuilding(true);
    try {
      const res = await fetch('/api/admin/build-game', { method: 'POST' });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; configured?: boolean; branch?: string; error?: string };
      if (json.ok) {
        setCommitMsg({ text: `🛠 Compilación lanzada en GitHub Actions (rama ${json.branch}). Tarda unos minutos.`, tone: 'ok' });
      } else if (json.configured === false) {
        setCommitMsg({ text: 'Compilar no configurado (falta GH_TOKEN con permiso actions).', tone: 'warn' });
      } else {
        setCommitMsg({ text: `No se pudo lanzar la compilación: ${json.error ?? 'error'}`, tone: 'err' });
      }
    } catch (e) {
      setCommitMsg({ text: `Error lanzando compilación: ${String(e)}`, tone: 'err' });
    } finally {
      setBuilding(false);
    }
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
            width: currentMap?.width,
            height: currentMap?.height,
            start: startPos,
            cave,
            dark,
            allowBicycle,
            flyable,
            flySpot,
            flyAlwaysAvailable,
            flyUnlockTiles,
            music: musicField,
            fences,
            fenceDirections,
            elevations,
            ramps,
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
            dayCareNpc,
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
            minimapParent,
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

      // ── Commit del .ts al repo (fuente única; sin copiar/pegar) ──────────
      // Aditivo: si falla o no está configurado, el guardado en Supabase ya
      // quedó hecho (preview intacto). Nunca bloquea ni rompe el editor.
      if (currentMap?.sourceFile) {
        try {
          const cres = await fetch('/api/admin/commit-map', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mapId: selectedMapId,
              sourceFile: currentMap.sourceFile,
              state: buildMapWriteState(),
            }),
          });
          const cjson = (await cres.json().catch(() => ({}))) as {
            ok?: boolean; configured?: boolean; unchanged?: boolean;
            error?: string; branch?: string; commitSha?: string;
          };
          if (cjson.ok && cjson.unchanged) {
            setCommitMsg({ text: `✓ Guardado · código sin cambios`, tone: 'ok' });
          } else if (cjson.ok) {
            setCommitMsg({ text: `✓ Commit ${(cjson.commitSha ?? '').slice(0, 7)} → ${cjson.branch}`, tone: 'ok' });
          } else if (cjson.configured === false) {
            setCommitMsg({ text: 'Guardado en nube. Commit a código no configurado (falta GH_TOKEN).', tone: 'warn' });
          } else {
            setCommitMsg({ text: `Guardado en nube. Commit falló: ${cjson.error ?? 'error'}`, tone: 'err' });
          }
        } catch (e) {
          setCommitMsg({ text: `Guardado en nube. Commit no enviado: ${String(e)}`, tone: 'warn' });
        }
      }
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
            fenceDirections,
            elevations,
            ramps,
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
            flyAlwaysAvailable,
            flyUnlockTiles,
            music: musicField,
            pokemonCenter,
            pc: pcPos,
            store: storePos,
            storeItems,
            recoverLocation,
            onlineBattleNpc,
            dayCareNpc,
            spinners,
            stoppers,
            maps,
            teleports,
            exits,
            exitReturnMap,
            exitReturnPos,
            minimapPos,
            minimapParent,
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
    const parts = [exportRowColMapTS(fences, 'fences')];
    // Solo exportar fenceDirections si hay alguna dirección no-Down definida.
    if (Object.keys(fenceDirections).length > 0) {
      parts.push(exportSpinnersTS(fenceDirections).replace(/^spinners:/, 'fenceDirections:'));
    }
    navigator.clipboard.writeText(parts.join('\n')).then(() => alert('¡Fences copiadas!'));
  }

  function doExportGrass() {
    const ts = exportRowColMapTS(grass, 'grass');
    navigator.clipboard.writeText(ts).then(() => alert('¡Grass copiadas!'));
  }

  function doExportFlyUnlock() {
    const ts = exportRowColMapTS(flyUnlockTiles, 'flyUnlockTiles');
    navigator.clipboard.writeText(ts).then(() => alert('¡Casillas de desbloqueo de Vuelo copiadas! Pégalas en el .ts como `flyUnlockTiles: { ... }`'));
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
      fenceDirections,
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
      minimapParent,
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
      setElevations(parsed.elevations ?? {});
      setRamps(parsed.ramps ?? {});
      setFenceDirections((parsed as typeof parsed & { fenceDirections?: Record<string, Record<string, DirectionName>> }).fenceDirections ?? {});
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
      setDayCareNpc(parsed.dayCareNpc);
      setSpinners(parsed.spinners ?? {});
      setStoppers(parsed.stoppers ?? {});
      setCave(!!parsed.cave);
      setDark(!!parsed.dark);
      setAllowBicycle(!!parsed.allowBicycle);
      setFlyable(false);
      setFlySpot(null);
      setFlyAlwaysAvailable(false);
      setFlyUnlockTiles({});
      setMusicField(parsed.music ?? null);
      setPortals(flattenPortals({
        ...currentMap!,
        maps: parsed.maps,
        teleports: parsed.teleports,
        exits: parsed.exits,
        exitReturnMap: parsed.exitReturnMap,
        exitReturnPos: parsed.exitReturnPos,
      } as MapEntry, mapData));
      setExitReturnMap(parsed.exitReturnMap);
      setExitReturnPos(parsed.exitReturnPos);
      setMinimapPos(parsed.minimapPos);
      setMinimapParent(parsed.minimapParent);
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

  // ── Auto-relleno de Pokémon salvajes ──────────────────────────────────
  // Mapea cada tabla a su terreno (la tabla `walk` cambia de pool según el
  // mapa sea cueva o no) y a una ventana de niveles dentro del rango global,
  // para que la Caña Vieja saque debiluchos y la Súper Caña ejemplares fuertes.
  function applyEncounterAutofill(cfg: EncounterAutofillConfig) {
    if (!autofillEnc) return;
    const lo = Math.min(cfg.minLevel, cfg.maxLevel);
    const hi = Math.max(cfg.minLevel, cfg.maxLevel);
    const span = hi - lo;
    const slice = (a: number, b: number): [number, number] => [
      Math.round(lo + span * a),
      Math.round(lo + span * b),
    ];
    const TABLE_TERRAIN: Record<EncounterTableKey, TerrainKind> = {
      walk: autofillEnc.isCave ? 'cave' : 'grass',
      oldRod: 'oldRod', goodRod: 'goodRod', superRod: 'superRod', surfSpots: 'surf',
    };
    const TABLE_LEVELS: Record<EncounterTableKey, [number, number]> = {
      walk: [lo, hi],
      oldRod: slice(0, 0.35),
      goodRod: slice(0.25, 0.7),
      superRod: slice(0.5, 1),
      surfSpots: slice(0.3, 1),
    };
    const TABLE_COUNT: Record<EncounterTableKey, number> = {
      walk: cfg.count, oldRod: 2, goodRod: 3, superRod: 3, surfSpots: 3,
    };
    const patch: EncountersOverride = {};
    for (const key of autofillEnc.tables) {
      const [tlo, thi] = TABLE_LEVELS[key];
      patch[key] = buildEncounterTable({
        gen: cfg.gen,
        terrain: TABLE_TERRAIN[key],
        minLevel: tlo,
        maxLevel: thi,
        count: TABLE_COUNT[key],
        allowedTimes: cfg.allowedTimes,
        autoTimeBias: cfg.autoTimeBias,
        includeLegendary: cfg.includeLegendary,
      });
    }
    setEncounters((e) => ({ ...e, ...patch }));
    setDirty(true);
    setAutofillEnc(null);
  }

  // ── Auto-relleno de equipos de entrenador ─────────────────────────────
  function applyTrainerAutofill(cfg: TrainerAutofillConfig) {
    if (!autofillTr) return;
    // "Conservar tamaño" SOLO aplica en scope 'all' (donde existe el checkbox).
    // Para un entrenador individual el slider de tamaño siempre manda, si no
    // poner "6" en un entrenador con 2 Pokémon no haría nada.
    const useKeepSize = autofillTr.scope === 'all' && cfg.keepSize;
    const makeTeam = (currentSize: number) => buildTrainerTeam({
      gen: cfg.gen,
      types: cfg.types,
      difficulty: cfg.difficulty,
      minLevel: cfg.minLevel,
      maxLevel: cfg.maxLevel,
      size: useKeepSize && currentSize > 0 ? currentSize : cfg.size,
    });
    if (autofillTr.scope === 'one' && autofillTr.index !== null) {
      const idx = autofillTr.index;
      setTrainers((prev) => prev.map((t, i) => i === idx ? { ...t, pokemon: makeTeam(t.pokemon.length) } : t));
    } else if (autofillTr.scope === 'all') {
      setTrainers((prev) => prev.map((t) => ({ ...t, pokemon: makeTeam(t.pokemon.length) })));
    }
    setDirty(true);
    setAutofillTr(null);
  }

  // ── Cambiar el grupo de un mapa (incluir/excluir desde el minimapa) ─────
  // value: null = automático (por nombre); "" = suelto; "<id>" = forzar a ese
  // grupo. Para el mapa cargado se edita el estado local (se guarda al pulsar
  // Guardar). Para CUALQUIER otro mapa se persiste al instante en Supabase
  // re-enviando sus trainers/walls actuales (columnas NOT NULL: no se pueden
  // omitir sin borrarlos), sin tocar el .ts (metadato editor-only).
  async function setMapGroup(mapId: string, value: string | null) {
    if (mapId === selectedMapId) {
      setMinimapParent(value);
      setDirty(true);
      return;
    }
    const m = mapData[mapId];
    if (!m) return;
    setMapData((d) => ({ ...d, [mapId]: { ...d[mapId], minimapParent: value } }));
    try {
      await fetch('/api/admin/map-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapId,
          trainers: m.trainers ?? [],
          walls: m.walls ?? {},
          overrides: { minimapParent: value },
        }),
      });
    } catch {
      // Silencioso: el cambio ya está reflejado localmente; reintenta al volver
      // a tocarlo. No bloquea el flujo de edición.
    }
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

  /** Fija (o borra con null) la elevación de un tile. Nivel 0 = borrar (sparse). */
  function setNumberAt(
    src: Record<string, Record<string, number>>,
    x: number,
    y: number,
    value: number | null,
  ): Record<string, Record<string, number>> {
    const rowKey = String(y);
    const colKey = String(x);
    const next = { ...src };
    const row = { ...(next[rowKey] ?? {}) };
    if (value === null || value === 0) {
      delete row[colKey];
    } else {
      row[colKey] = value;
    }
    if (Object.keys(row).length === 0) delete next[rowKey];
    else next[rowKey] = row;
    return next;
  }

  /** Pinta un tile con la brocha de elevaciones activa (nivel o rampa). */
  function paintElevationAt(x: number, y: number, mode: 'add' | 'remove') {
    if (activeElevation === 'ramp') {
      setRamps((prev) => setMaskAt(prev, x, y, mode === 'add'));
    } else {
      setElevations((prev) => setNumberAt(prev, x, y, mode === 'add' ? activeElevation : null));
    }
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

  // ── Desplazar TODOS los elementos del mapa a la vez (dx, dy en tiles) ─────
  // Realinea el contenido cuando quedó descuadrado respecto a la imagen (p.ej.
  // al partir/redimensionar un mapa). Mueve solo coordenadas de ESTE mapa; NO
  // toca el destino de teleports/puertas (destPos), exitReturnPos ni el
  // minimapa de Kanto (minimapPos), que viven en otro sistema de coordenadas.
  // Mínima coordenada (x, y) de TODO el contenido posicional del mapa. Se usa
  // para CLAMPAR los desplazamientos: nada puede salir por el borde 0, lo que
  // generaría coordenadas negativas (claves negativas = TS inválido al guardar).
  function contentMin(): { x: number; y: number } {
    let minX = Infinity, minY = Infinity;
    const rc = (m: Record<string, number[]>) => {
      for (const [r, cols] of Object.entries(m)) {
        const y = Number(r); if (y < minY) minY = y;
        for (const c of cols) if (c < minX) minX = c;
      }
    };
    const rcm = (m: Record<string, Record<string, unknown>>) => {
      for (const [r, cols] of Object.entries(m)) {
        const y = Number(r); if (y < minY) minY = y;
        for (const c of Object.keys(cols)) { const x = Number(c); if (x < minX) minX = x; }
      }
    };
    const arr = (a: { pos: { x: number; y: number } }[]) => {
      for (const e of a) { if (e.pos.x < minX) minX = e.pos.x; if (e.pos.y < minY) minY = e.pos.y; }
    };
    const pt = (p: { x: number; y: number } | null) => { if (p) { if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y; } };
    rc(walls); rc(fences); rc(ramps); rc(grass); rc(water); rc(stoppers);
    rcm(fenceDirections); rcm(elevations); rcm(spinners); rcm(texts); rcm(textRewards);
    arr(trainers); arr(items); arr(gifts); arr(staticPokemon); arr(cuttableTrees); arr(boulders); arr(berryTrees); arr(portals);
    pt(startPos); pt(pokemonCenter); pt(pcPos); pt(storePos); pt(recoverLocation); pt(onlineBattleNpc); pt(dayCareNpc); pt(flySpot);
    return { x: minX === Infinity ? 0 : minX, y: minY === Infinity ? 0 : minY };
  }

  function shiftAllElements(dx: number, dy: number) {
    // Clamp: no permitir empujar contenido por debajo de la fila/columna 0.
    const { x: minX, y: minY } = contentMin();
    if (dx < 0) dx = Math.max(dx, -minX);
    if (dy < 0) dy = Math.max(dy, -minY);
    if (dx === 0 && dy === 0) return;
    setWalls((m) => shiftRowCols(m, dx, dy));
    setFences((m) => shiftRowCols(m, dx, dy));
    setRamps((m) => shiftRowCols(m, dx, dy));
    setGrass((m) => shiftRowCols(m, dx, dy));
    setWater((m) => shiftRowCols(m, dx, dy));
    setFlyUnlockTiles((m) => shiftRowCols(m, dx, dy));
    setStoppers((m) => shiftRowCols(m, dx, dy));
    setFenceDirections((m) => shiftRowColMap(m, dx, dy));
    setElevations((m) => shiftRowColMap(m, dx, dy));
    setTexts((m) => shiftRowColMap(m, dx, dy));
    setTextRewards((m) => shiftRowColMap(m, dx, dy));
    setSpinners((m) => shiftRowColMap(m, dx, dy));
    setTrainers((a) => shiftPosArray(a, dx, dy));
    setItems((a) => shiftPosArray(a, dx, dy));
    setGifts((a) => shiftPosArray(a, dx, dy));
    setStaticPokemon((a) => shiftPosArray(a, dx, dy));
    setCuttableTrees((a) => shiftPosArray(a, dx, dy));
    setBoulders((a) => shiftPosArray(a, dx, dy));
    setBerryTrees((a) => shiftPosArray(a, dx, dy));
    // Portales: se mueve la casilla del portal en ESTE mapa (pos), nunca el
    // destino (destPos), que es una casilla del mapa al que se viaja.
    setPortals((a) => a.map((p) => ({ ...p, pos: { x: p.pos.x + dx, y: p.pos.y + dy } })));
    setStartPos((p) => shiftPoint(p, dx, dy));
    setPokemonCenter((p) => shiftPoint(p, dx, dy));
    setPcPos((p) => shiftPoint(p, dx, dy));
    setStorePos((p) => shiftPoint(p, dx, dy));
    setRecoverLocation((p) => shiftPoint(p, dx, dy));
    setOnlineBattleNpc((p) => shiftPoint(p, dx, dy));
    setDayCareNpc((p) => shiftPoint(p, dx, dy));
    setFlySpot((p) => shiftPoint(p, dx, dy));
    setDirty(true);
  }

  // ── Selección rectangular: copiar / cortar / pegar / mover bloque ─────────
  // Construye el portapapeles (coords relativas a la esquina sup-izq del rect).
  function buildClip(r: SelRect): MapClipboard {
    return {
      w: r.x1 - r.x0 + 1,
      h: r.y1 - r.y0 + 1,
      walls: extractRowCols(walls, r),
      fences: extractRowCols(fences, r),
      fenceDirections: extractRowColMap(fenceDirections, r),
      elevations: extractRowColMap(elevations, r),
      ramps: extractRowCols(ramps, r),
      grass: extractRowCols(grass, r),
      water: extractRowCols(water, r),
      flyUnlockTiles: extractRowCols(flyUnlockTiles, r),
      stoppers: extractRowCols(stoppers, r),
      spinners: extractRowColMap(spinners, r),
      texts: extractRowColMap(texts, r),
      textRewards: extractRowColMap(textRewards, r),
      trainers: extractPos(trainers, r),
      items: extractPos(items, r),
      gifts: extractPos(gifts, r),
      staticPokemon: extractPos(staticPokemon, r),
      cuttableTrees: extractPos(cuttableTrees, r),
      boulders: extractPos(boulders, r),
      berryTrees: extractPos(berryTrees, r),
      portals: extractPos(portals, r),
    };
  }

  // Elimina TODO el contenido dentro de un rectángulo (in-place).
  function deleteRectContent(r: SelRect) {
    setWalls((m) => removeRowCols(m, r));
    setFences((m) => removeRowCols(m, r));
    setFenceDirections((m) => removeRowColMap(m, r));
    setElevations((m) => removeRowColMap(m, r));
    setRamps((m) => removeRowCols(m, r));
    setGrass((m) => removeRowCols(m, r));
    setWater((m) => removeRowCols(m, r));
    setFlyUnlockTiles((m) => removeRowCols(m, r));
    setStoppers((m) => removeRowCols(m, r));
    setSpinners((m) => removeRowColMap(m, r));
    setTexts((m) => removeRowColMap(m, r));
    setTextRewards((m) => removeRowColMap(m, r));
    setTrainers((a) => removePos(a, r));
    setItems((a) => removePos(a, r));
    setGifts((a) => removePos(a, r));
    setStaticPokemon((a) => removePos(a, r));
    setCuttableTrees((a) => removePos(a, r));
    setBoulders((a) => removePos(a, r));
    setBerryTrees((a) => removePos(a, r));
    setPortals((a) => removePos(a, r));
    setDirty(true);
  }

  // Fusiona un portapapeles en el mapa actual con su esquina sup-izq en (ax, ay).
  function applyPaste(c: MapClipboard, ax: number, ay: number) {
    setWalls((m) => mergeRowCols(m, shiftRowCols(c.walls, ax, ay)));
    setFences((m) => mergeRowCols(m, shiftRowCols(c.fences, ax, ay)));
    setFenceDirections((m) => mergeRowColMap(m, shiftRowColMap(c.fenceDirections, ax, ay)));
    setElevations((m) => mergeRowColMap(m, shiftRowColMap(c.elevations ?? {}, ax, ay)));
    setRamps((m) => mergeRowCols(m, shiftRowCols(c.ramps ?? {}, ax, ay)));
    setGrass((m) => mergeRowCols(m, shiftRowCols(c.grass, ax, ay)));
    setWater((m) => mergeRowCols(m, shiftRowCols(c.water, ax, ay)));
    setFlyUnlockTiles((m) => mergeRowCols(m, shiftRowCols(c.flyUnlockTiles ?? {}, ax, ay)));
    setStoppers((m) => mergeRowCols(m, shiftRowCols(c.stoppers, ax, ay)));
    setSpinners((m) => mergeRowColMap(m, shiftRowColMap(c.spinners, ax, ay)));
    setTexts((m) => mergeRowColMap(m, shiftRowColMap(c.texts, ax, ay)));
    setTextRewards((m) => mergeRowColMap(m, shiftRowColMap(c.textRewards, ax, ay)));
    setTrainers((a) => [...a, ...shiftPosArray(c.trainers, ax, ay)]);
    setItems((a) => [...a, ...shiftPosArray(c.items, ax, ay)]);
    setGifts((a) => [...a, ...shiftPosArray(c.gifts, ax, ay)]);
    setStaticPokemon((a) => [...a, ...shiftPosArray(c.staticPokemon, ax, ay)]);
    setCuttableTrees((a) => [...a, ...shiftPosArray(c.cuttableTrees, ax, ay)]);
    setBoulders((a) => [...a, ...shiftPosArray(c.boulders, ax, ay)]);
    setBerryTrees((a) => [...a, ...shiftPosArray(c.berryTrees, ax, ay)]);
    setPortals((a) => [...a, ...shiftPosArray(c.portals, ax, ay)]);
    setSelRect({ x0: ax, y0: ay, x1: ax + c.w - 1, y1: ay + c.h - 1 });
    setDirty(true);
  }

  function copySelection() {
    if (!selRect) return;
    setClipboard(buildClip(selRect));
  }
  function cutSelection() {
    if (!selRect) return;
    setClipboard(buildClip(selRect));
    deleteRectContent(selRect);
  }
  function pasteClipboardAt(ax: number, ay: number) {
    if (clipboard) applyPaste(clipboard, ax, ay);
  }
  // Mover el bloque seleccionado sin tocar el portapapeles del usuario.
  function moveSelection(dx: number, dy: number) {
    if (!selRect) return;
    const r = selRect;
    // Clamp: la selección no puede salir por el borde 0 (evita coords negativas).
    if (dx < 0) dx = Math.max(dx, -r.x0);
    if (dy < 0) dy = Math.max(dy, -r.y0);
    if (dx === 0 && dy === 0) return;
    const block = buildClip(r);
    deleteRectContent(r);
    applyPaste(block, r.x0 + dx, r.y0 + dy);
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
        // Clamp al rango EXTENDIDO (mapa + margen) para poder pintar fuera del borde.
        x = Math.max(-CANVAS_MARGIN, Math.min(x, currentMap.width - 1 + CANVAS_MARGIN));
        y = Math.max(-CANVAS_MARGIN, Math.min(y, currentMap.height - 1 + CANVAS_MARGIN));
      }
      return { x, y };
    },
    [currentMap],
  );

  // ── Drag & drop NPC ────────────────────────────────────────────────────────
  const onPointerDown = useCallback(
    (e: React.PointerEvent, idx: number) => {
      if (panMode || isSecondaryTouch(e)) return; // dejar que el lienzo haga pan/gesto.
      if (editMode !== 'npc') return;
      e.preventDefault();
      e.stopPropagation();
      setSelectedIdx(idx);
      dragging.current = { idx, startX: e.clientX, startY: e.clientY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [editMode, panMode, isSecondaryTouch]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (panMode || gesture.current.active) return; // gesto/Mover: no editar por arrastre.
      const tile = tileFromClientPoint(e.clientX, e.clientY, true);
      if (!tile) return;
      const tileX = tile.x;
      const tileY = tile.y;

      // Selección rectangular: arrastrar define el rectángulo (clamp al mapa).
      if (editMode === 'select') {
        if (!selDrag.current) return;
        const w = currentMap?.width ?? 1;
        const h = currentMap?.height ?? 1;
        const cx = Math.max(0, Math.min(w - 1, tileX));
        const cy = Math.max(0, Math.min(h - 1, tileY));
        const s = selDrag.current;
        setSelRect({
          x0: Math.min(s.startX, cx), y0: Math.min(s.startY, cy),
          x1: Math.max(s.startX, cx), y1: Math.max(s.startY, cy),
        });
        return;
      }

      // Drag de entidades (texts/items/gifts/portals)
      if (entityDrag.current) {
        moveEntityToTile(tileX, tileY);
        return;
      }

      // Pintado de elevaciones en arrastre (nivel activo o rampa)
      if (editMode === 'elevations' && wallPaint.current?.active) {
        const paint = wallPaint.current;
        const k = `${tileX},${tileY}`;
        if (!paint.visited.has(k)) {
          paint.visited.add(k);
          paintElevationAt(tileX, tileY, paint.mode);
          setDirty(true);
        }
        return;
      }

      // Mask paint en arrastre (walls, fences, grass, water, fly-unlock)
      if (
        (editMode === 'walls' || editMode === 'fences' || editMode === 'grass' || editMode === 'water' || editMode === 'fly-unlock') &&
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
            : editMode === 'fly-unlock' ? setFlyUnlockTiles
            : setWater;
          setter((prev) => setMaskAt(prev, tileX, tileY, paint.mode === 'add'));
          // Salientes: etiquetar el tile con la dirección activa (o quitarla).
          if (editMode === 'fences') {
            setFenceDirections((prev) => setSpinnerAt(prev, tileX, tileY, paint.mode === 'add' ? activeFenceDir : null));
          }
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
    [tileFromClientPoint, editMode, activeFenceDir, activeElevation, panMode, currentMap]
  );

  const onPointerUp = useCallback(() => {
    if (entityDrag.current?.moved) suppressNextClick.current = true;
    if (selDrag.current) suppressNextClick.current = true; // no colocar tras arrastrar la selección
    dragging.current = null;
    entityDrag.current = null;
    wallPaint.current = null;
    selDrag.current = null;
  }, []);

  // Drag handler genérico para entidades (texts/items/gifts/portals)
  const onEntityPointerDown = useCallback(
    (
      e: React.PointerEvent,
      target:
        | { kind: 'text'; row: number; col: number }
        | { kind: 'item' | 'gift' | 'portal'; idx: number },
    ) => {
      if (panMode || isSecondaryTouch(e)) return; // dejar que el lienzo haga pan/gesto.
      e.preventDefault();
      e.stopPropagation();
      entityDrag.current = { ...target, moved: false } as typeof entityDrag.current;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      // Selección inmediata para portales
      if (target.kind === 'portal') setSelectedPortalIdx(target.idx);
    },
    [panMode, isSecondaryTouch]
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
    if (panMode || isSecondaryTouch(e)) return; // gesto/Mover: el lienzo hace pan, no se pinta.
    if (editMode === 'select') {
      const t = tileFromEvent(e);
      if (!t) return;
      const w = currentMap?.width ?? 1;
      const h = currentMap?.height ?? 1;
      const cx = Math.max(0, Math.min(w - 1, t.x));
      const cy = Math.max(0, Math.min(h - 1, t.y));
      // Pegado pendiente: este clic fija la esquina superior-izquierda del bloque.
      if (pastePending && clipboard) {
        pasteClipboardAt(cx, cy);
        setPastePending(false);
        return;
      }
      selDrag.current = { startX: cx, startY: cy };
      setSelRect({ x0: cx, y0: cy, x1: cx, y1: cy });
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      return;
    }
    if (editMode !== 'walls' && editMode !== 'fences' && editMode !== 'grass' && editMode !== 'water' && editMode !== 'elevations' && editMode !== 'fly-unlock') return;
    const tile = tileFromEvent(e);
    if (!tile) return;
    // Rango EXTENDIDO (mapa + margen): permite pintar muros/hierba/etc. fuera del borde.
    if (
      tile.x < -CANVAS_MARGIN || tile.y < -CANVAS_MARGIN ||
      tile.x >= (currentMap?.width ?? 0) + CANVAS_MARGIN ||
      tile.y >= (currentMap?.height ?? 0) + CANVAS_MARGIN
    ) return;
    if (editMode === 'elevations') {
      // Repintar con la MISMA brocha borra (nivel → 0 / quitar rampa).
      const currentlyOn = activeElevation === 'ramp'
        ? hasMask(ramps, tile.x, tile.y)
        : (elevations[String(tile.y)]?.[String(tile.x)] ?? 0) === activeElevation;
      const mode: 'add' | 'remove' = currentlyOn ? 'remove' : 'add';
      wallPaint.current = { active: true, mode, visited: new Set([`${tile.x},${tile.y}`]) };
      paintElevationAt(tile.x, tile.y, mode);
      setDirty(true);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      return;
    }
    const src =
      editMode === 'walls' ? walls
      : editMode === 'fences' ? fences
      : editMode === 'grass' ? grass
      : editMode === 'fly-unlock' ? flyUnlockTiles
      : water;
    const setter =
      editMode === 'walls' ? setWalls
      : editMode === 'fences' ? setFences
      : editMode === 'grass' ? setGrass
      : editMode === 'fly-unlock' ? setFlyUnlockTiles
      : setWater;
    const currentlyOn = hasMask(src, tile.x, tile.y);
    const mode: 'add' | 'remove' = currentlyOn ? 'remove' : 'add';
    wallPaint.current = { active: true, mode, visited: new Set([`${tile.x},${tile.y}`]) };
    setter((prev) => setMaskAt(prev, tile.x, tile.y, mode === 'add'));
    // Salientes: etiquetar el tile con la dirección activa (o quitarla al borrar).
    if (editMode === 'fences') {
      setFenceDirections((prev) => setSpinnerAt(prev, tile.x, tile.y, mode === 'add' ? activeFenceDir : null));
    }
    setDirty(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (panMode) return; // En modo Mover no se colocan entidades.
    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      return;
    }
    const tile = tileFromEvent(e);
    if (!tile) return;
    if (editMode === 'select') return; // la selección se maneja en pointerDown/Move/Up
    if (editMode === 'npc') {
      const hitIdx = trainers.findIndex((t) => t.pos.x === tile.x && t.pos.y === tile.y);
      setSelectedIdx(hitIdx >= 0 ? hitIdx : null);
      return;
    }
    if (editMode === 'texts') {
      const rowKey = String(tile.y);
      const colKey = String(tile.x);
      const existing = texts[rowKey]?.[colKey] ?? [];
      const existingReward = textRewards[rowKey]?.[colKey] ?? null;
      setPicker({
        kind: 'text',
        title: `Casilla (${tile.x}, ${tile.y})`,
        initial: { text: existing.join('\n'), reward: existingReward },
        defaultQuestId: `text-reward-${selectedMapId}-${tile.x}-${tile.y}`,
        itemOptions: itemTypeKeys,
        onSave: ({ text, reward }) => {
          // Texto
          setTexts((prev) => {
            const nextRow = { ...(prev[rowKey] ?? {}) };
            if (text.trim() === '') delete nextRow[colKey];
            else nextRow[colKey] = text.split('\n').map((s) => s.trim()).filter((s) => s.length > 0);
            const next = { ...prev };
            if (Object.keys(nextRow).length === 0) delete next[rowKey];
            else next[rowKey] = nextRow;
            return next;
          });
          // Recompensa (siempre se sincroniza: null borra)
          setTextRewards((pr) => {
            const nr = { ...(pr[rowKey] ?? {}) };
            if (reward && text.trim() !== '') nr[colKey] = reward;
            else delete nr[colKey];
            const n = { ...pr };
            if (Object.keys(nr).length === 0) delete n[rowKey];
            else n[rowKey] = nr;
            return n;
          });
          setDirty(true);
        },
      });
      return;
    }
    if (editMode === 'items') {
      const idx = items.findIndex((it) => it.pos.x === tile.x && it.pos.y === tile.y);
      if (idx >= 0) {
        setPicker({
          kind: 'item',
          title: `Objeto en (${tile.x}, ${tile.y})`,
          subtitle: 'Elige otro objeto, cambia su visibilidad o elimínalo',
          options: itemTypeKeys,
          current: items[idx].itemKey,
          hidden: items[idx].hidden,
          onPick: (key) => { setItems((p) => p.map((it, i) => i === idx ? { ...it, itemKey: key } : it)); setDirty(true); },
          onToggleHidden: () => { setItems((p) => p.map((it, i) => i === idx ? { ...it, hidden: !it.hidden } : it)); setDirty(true); },
          onDelete: () => { setItems((p) => p.filter((_, i) => i !== idx)); setDirty(true); },
        });
      } else {
        setPicker({
          kind: 'item',
          title: `Nuevo objeto en (${tile.x}, ${tile.y})`,
          options: itemTypeKeys,
          onPick: (key) => { setItems((p) => [...p, { itemKey: key, pos: { x: tile.x, y: tile.y } }]); setDirty(true); },
        });
      }
      return;
    }
    if (editMode === 'gifts') {
      const idx = gifts.findIndex((g) => g.pos.x === tile.x && g.pos.y === tile.y);
      if (idx >= 0) {
        const g = gifts[idx];
        setPicker({
          kind: 'gift',
          title: `Regalo en (${tile.x}, ${tile.y})`,
          initial: { pokemonId: g.pokemonId, level: g.level, questId: g.questId },
          onSave: (v) => { setGifts((p) => p.map((it, i) => i === idx ? { ...it, ...v } : it)); setDirty(true); },
          onDelete: () => { setGifts((p) => p.filter((_, i) => i !== idx)); setDirty(true); },
        });
      } else {
        setPicker({
          kind: 'gift',
          title: `Nuevo regalo en (${tile.x}, ${tile.y})`,
          initial: { pokemonId: 1, level: 5, questId: `${selectedMapId}-gift-${tile.x}-${tile.y}` },
          onSave: (v) => { setGifts((p) => [...p, { ...v, pos: { x: tile.x, y: tile.y } }]); setDirty(true); },
        });
      }
      return;
    }
    if (editMode === 'static-pokemon') {
      const idx = staticPokemon.findIndex((sp) => sp.pos.x === tile.x && sp.pos.y === tile.y);
      if (idx >= 0) {
        const sp = staticPokemon[idx];
        setPicker({
          kind: 'static',
          title: `Pokémon estático en (${tile.x}, ${tile.y})`,
          initial: { pokemonId: sp.pokemonId, level: sp.level, sprite: sp.sprite, questId: sp.questId, intro: (sp.intro ?? []).join('\n') },
          onSave: (v) => { setStaticPokemon((p) => p.map((s, i) => i === idx ? { ...s, ...v } : s)); setDirty(true); },
          onDelete: () => { setStaticPokemon((p) => p.filter((_, i) => i !== idx)); setDirty(true); },
        });
      } else {
        setPicker({
          kind: 'static',
          title: `Nuevo Pokémon estático en (${tile.x}, ${tile.y})`,
          initial: { pokemonId: 144, level: 50, sprite: 'bird-a', questId: `${selectedMapId}-static-${tile.x}-${tile.y}`, intro: '' },
          onSave: (v) => { setStaticPokemon((p) => [...p, { ...v, pos: { x: tile.x, y: tile.y } }]); setDirty(true); },
        });
      }
      return;
    }
    if (editMode === 'cuttable-trees') {
      const idx = cuttableTrees.findIndex((t) => t.pos.x === tile.x && t.pos.y === tile.y);
      if (idx >= 0) {
        // Clic en árbol existente → eliminar
        setCuttableTrees((p) => p.filter((_, i) => i !== idx));
      } else {
        // Clic en tile vacío → añadir árbol (questId automático único)
        setCuttableTrees((p) => [...p, { pos: { x: tile.x, y: tile.y }, questId: `cut-tree-${selectedMapId}-${tile.x}-${tile.y}` }]);
      }
      setDirty(true);
      return;
    }
    if (editMode === 'berry-trees') {
      const idx = berryTrees.findIndex((t) => t.pos.x === tile.x && t.pos.y === tile.y);
      if (idx >= 0) {
        // Clic en árbol existente → eliminar
        setBerryTrees((p) => p.filter((_, i) => i !== idx));
        setDirty(true);
      } else {
        // Clic en tile vacío → elegir baya con el picker
        setPicker({
          kind: 'item',
          title: `Árbol de bayas en (${tile.x}, ${tile.y})`,
          subtitle: 'Elige la baya que dará el árbol (1 al día)',
          options: [...BERRY_ITEM_KEYS],
          labelFor: (k) => BERRY_LABELS[k] ?? k,
          onPick: (itemKey) => { setBerryTrees((p) => [...p, { pos: { x: tile.x, y: tile.y }, itemKey }]); setDirty(true); },
        });
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
        // Clic en tile vacío → añadir roca (MO Fuerza), id automático único
        setBoulders((p) => [...p, { pos: { x: tile.x, y: tile.y }, id: `boulder-${selectedMapId}-${tile.x}-${tile.y}` }]);
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
        activeSpot === 'onlineBattleNpc' ? setOnlineBattleNpc :
        setDayCareNpc;
      const current =
        activeSpot === 'start' ? startPos :
        activeSpot === 'pokemonCenter' ? pokemonCenter :
        activeSpot === 'pc' ? pcPos :
        activeSpot === 'store' ? storePos :
        activeSpot === 'recoverLocation' ? recoverLocation :
        activeSpot === 'onlineBattleNpc' ? onlineBattleNpc :
        dayCareNpc;
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
      // Portal unificado: SIEMPRE una salida a un mapa + casilla de llegada.
      setPicker({
        kind: 'maptile',
        title: `🚪 Salida en (${tile.x}, ${tile.y})`,
        subtitle: 'Elige el mapa destino y haz click en la casilla de llegada (usa la rueda para hacer zoom)',
        requirePos: true,
        onPick: ({ mapId, pos }) => { setPortals((p) => [...p, { kind: 'teleport', pos: { x: tile.x, y: tile.y }, destMap: mapId, destPos: pos ?? { x: 0, y: 0 } }]); setDirty(true); },
      });
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
    'pallet-town':        { x: 84,  y: 167 },
    'route-1':            { x: 84,  y: 143 },
    'viridian-city':      { x: 84,  y: 118 },
    'route-22':           { x: 55,  y: 118 },
    'route-2':            { x: 84,  y: 93  },
    'viridian-forrest':   { x: 84,  y: 78  },
    'pewter-city':        { x: 84,  y: 63  },
    'route-3':            { x: 100, y: 63  },
    'mt-moon-1f':         { x: 126, y: 63  },
    'mt-moon-2f':         { x: 126, y: 63  },
    'mt-moon-3f':         { x: 126, y: 63  },
    'route-4':            { x: 148, y: 63  },
    'cerulean-city':      { x: 162, y: 63  },
    'route-5':            { x: 162, y: 81  },
    'route-6':            { x: 162, y: 101 },
    'vermilion-city':     { x: 162, y: 118 },
    'route-9':            { x: 183, y: 63  },
    'route-10':           { x: 183, y: 75  },
    'lavender-town':      { x: 200, y: 75  },
    'route-8':            { x: 183, y: 81  },
    'route-7':            { x: 140, y: 81  },
    'celadon-city':       { x: 118, y: 81  },
    'route-11':           { x: 183, y: 97  },
    'route-12':           { x: 200, y: 88  },
    'route-13':           { x: 200, y: 106 },
    'route-14':           { x: 190, y: 116 },
    'route-15':           { x: 175, y: 118 },
    'route-16':           { x: 105, y: 88  },
    'route-17':           { x: 105, y: 106 },
    'route-18':           { x: 105, y: 128 },
    'fuchsia-city':       { x: 118, y: 128 },
    'safari-zone-center': { x: 118, y: 108 },
    'route-19':           { x: 118, y: 143 },
    'route-20':           { x: 100, y: 153 },
    'cinnabar-island':    { x: 84,  y: 163 },
    'route-21':           { x: 84,  y: 148 },
    'saffron-city':       { x: 162, y: 81  },
    'route-24':           { x: 162, y: 48  },
    'route-25':           { x: 175, y: 43  },
    'route-23':           { x: 84,  y: 43  },
    'indigo-plateau':     { x: 70,  y: 33  },
    'victory-road-1f':    { x: 77,  y: 43  },
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

  // ── Grupos del minimapa (automáticos por nombre) ───────────────────────
  // Un punto por ciudad/mazmorra; los interiores (gimnasio, centro, casas,
  // plantas…) se listan al desplegar su grupo. La coordenada del grupo es la
  // del mapa padre o, si el padre no tiene (mazmorras), la del primer miembro
  // que sí la tenga.
  const allMapIds = Object.keys(mapData);
  // Override manual de agrupación (campo minimapParent). Para el mapa
  // seleccionado se usa el estado LOCAL (refleja la edición en curso); para el
  // resto, lo guardado en mapData.
  const minimapParentOf: MinimapParentOf = {};
  for (const id of allMapIds) {
    const v = mapData[id]?.minimapParent;
    if (v !== undefined && v !== null) minimapParentOf[id] = v;
  }
  if (minimapParent !== null) minimapParentOf[selectedMapId] = minimapParent;
  else delete minimapParentOf[selectedMapId];
  const minimapGroups = (() => {
    const byKey = new Map<string, string[]>();
    for (const id of allMapIds) {
      const k = minimapGroupKey(id, allMapIds, minimapParentOf);
      const arr = byKey.get(k);
      if (arr) arr.push(id); else byKey.set(k, [id]);
    }
    const list: { key: string; name: string; coord: { x: number; y: number }; members: string[] }[] = [];
    for (const [key, members] of byKey.entries()) {
      let coord = getMinimapCoords(key);
      if (!coord) {
        for (const m of members) { const c = getMinimapCoords(m); if (c) { coord = c; break; } }
      }
      if (!coord) continue;
      const name = mapData[key]?.name ?? prettyMapName(key);
      const sorted = [...members].sort((a, b) => {
        if (a === key) return -1;
        if (b === key) return 1;
        return (mapData[a]?.name ?? a).localeCompare(mapData[b]?.name ?? b);
      });
      list.push({ key, name, coord, members: sorted });
    }
    return list;
  })();
  const currentGroupKey = minimapGroupKey(selectedMapId, allMapIds, minimapParentOf);
  const openGroupData = openGroup ? minimapGroups.find((g) => g.key === openGroup) ?? null : null;

  // ── Gesto del minimapa: pan + pinch-zoom (no desajusta los puntos) ──────
  const clampMmView = (v: { scale: number; tx: number; ty: number }) => {
    const vp = mmViewportRef.current;
    const scale = Math.max(MM_MIN_SCALE, Math.min(MM_MAX_SCALE, v.scale));
    if (!vp) return { scale, tx: 0, ty: 0 };
    const w = vp.clientWidth, h = vp.clientHeight;
    return {
      scale,
      tx: Math.min(0, Math.max(w - w * scale, v.tx)),
      ty: Math.min(0, Math.max(h - h * scale, v.ty)),
    };
  };
  const zoomMmAroundCenter = (factor: number) => {
    const vp = mmViewportRef.current;
    setMmView((prev) => {
      const scale = Math.max(MM_MIN_SCALE, Math.min(MM_MAX_SCALE, prev.scale * factor));
      const w = vp?.clientWidth ?? 0, h = vp?.clientHeight ?? 0;
      const fx = w / 2, fy = h / 2;
      const cx = (fx - prev.tx) / prev.scale;
      const cy = (fy - prev.ty) / prev.scale;
      return clampMmView({ scale, tx: fx - cx * scale, ty: fy - cy * scale });
    });
  };
  const MM_TAP_THRESH = 6;
  const performMinimapTap = (clientX: number, clientY: number) => {
    const img = mmImgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const px = Math.max(0, Math.min(MINIMAP_WIDTH, Math.round(((clientX - rect.left) / rect.width) * MINIMAP_WIDTH)));
    const py = Math.max(0, Math.min(MINIMAP_HEIGHT, Math.round(((clientY - rect.top) / rect.height) * MINIMAP_HEIGHT)));
    if (minimapMode === 'edit') {
      setMinimapPos({ x: px, y: py });
      setDirty(true);
      return;
    }
    // Navegar: grupo más cercano. SIEMPRE navega a su mapa principal (el padre
    // si es un mapa real, si no el primer miembro) y, si tiene interiores, abre
    // su lista en el panel para poder entrar a cualquiera.
    let best: typeof minimapGroups[number] | null = null;
    let bestDist = Infinity;
    for (const grp of minimapGroups) {
      const d = Math.hypot(grp.coord.x - px, grp.coord.y - py);
      if (d < bestDist) { bestDist = d; best = grp; }
    }
    if (best && bestDist < 16) {
      setOpenGroup(best.key);
      const target = mapData[best.key] ? best.key : best.members[0];
      selectMap(target);
    }
  };
  const onMmPointerDown = (e: React.PointerEvent) => {
    const vp = mmViewportRef.current;
    if (!vp) return;
    const g = mmGesture.current;
    if (e.pointerType === 'touch') {
      g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (g.pointers.size === 2) {
        const [a, b] = [...g.pointers.values()];
        const rect = vp.getBoundingClientRect();
        g.mode = 'pinch';
        g.startScale = mmView.scale; g.startTx = mmView.tx; g.startTy = mmView.ty;
        g.startDist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        g.startCx = (a.x + b.x) / 2 - rect.left;
        g.startCy = (a.y + b.y) / 2 - rect.top;
        for (const id of g.pointers.keys()) vp.setPointerCapture?.(id);
        e.preventDefault();
      } else if (g.pointers.size === 1) {
        g.mode = 'none';
        g.downX = e.clientX; g.downY = e.clientY; g.moved = false; g.downType = 'touch';
      }
    } else {
      g.mode = 'none';
      g.downX = e.clientX; g.downY = e.clientY; g.moved = false; g.downType = e.pointerType;
      g.startTx = mmView.tx; g.startTy = mmView.ty;
      vp.setPointerCapture?.(e.pointerId);
    }
  };
  const onMmPointerMove = (e: React.PointerEvent) => {
    const vp = mmViewportRef.current;
    if (!vp) return;
    const g = mmGesture.current;
    if (g.pointers.has(e.pointerId)) g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (g.mode === 'pinch' && g.pointers.size >= 2) {
      e.preventDefault();
      const [a, b] = [...g.pointers.values()];
      const rect = vp.getBoundingClientRect();
      const cx = (a.x + b.x) / 2 - rect.left;
      const cy = (a.y + b.y) / 2 - rect.top;
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const scale = Math.max(MM_MIN_SCALE, Math.min(MM_MAX_SCALE, g.startScale * (dist / g.startDist)));
      // Punto focal (contenido) bajo el centro inicial → se mantiene bajo el
      // centro actual: zoom anclado a los dedos + pan siguiendo su movimiento.
      const focalX = (g.startCx - g.startTx) / g.startScale;
      const focalY = (g.startCy - g.startTy) / g.startScale;
      setMmView(clampMmView({ scale, tx: cx - focalX * scale, ty: cy - focalY * scale }));
      return;
    }
    if (g.downType && g.downType !== 'touch') {
      const dx = e.clientX - g.downX, dy = e.clientY - g.downY;
      if (!g.moved && Math.hypot(dx, dy) > MM_TAP_THRESH) g.moved = true;
      if (g.moved) {
        g.mode = 'mouse-pan';
        setMmView(clampMmView({ scale: mmView.scale, tx: g.startTx + dx, ty: g.startTy + dy }));
      }
      return;
    }
    if (g.downType === 'touch' && g.pointers.size === 1) {
      if (Math.hypot(e.clientX - g.downX, e.clientY - g.downY) > MM_TAP_THRESH) g.moved = true;
    }
  };
  const onMmPointerUp = (e: React.PointerEvent) => {
    const vp = mmViewportRef.current;
    const g = mmGesture.current;
    const wasTouch = e.pointerType === 'touch';
    if (g.pointers.has(e.pointerId)) g.pointers.delete(e.pointerId);
    vp?.releasePointerCapture?.(e.pointerId);
    if (g.mode === 'pinch') {
      if (g.pointers.size < 2) {
        g.mode = 'none';
        // Si queda un dedo apoyado, márcalo como "movido" para que al soltarlo
        // no se interprete como un tap accidental.
        if (g.pointers.size === 1) {
          const [p] = [...g.pointers.values()];
          g.downX = p.x; g.downY = p.y; g.moved = true; g.downType = 'touch';
        }
      }
      return;
    }
    if (g.mode === 'mouse-pan') { g.mode = 'none'; return; }
    const moved = g.moved;
    g.mode = 'none';
    if (wasTouch && g.pointers.size > 0) return; // aún hay dedos: no es un tap
    if (moved) return;
    performMinimapTap(e.clientX, e.clientY);
  };

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
      if (isTextInput(e.target) || dragging.current || entityDrag.current || wallPaint.current?.active || picker) return;
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
  }, [mapNavTargets.up, mapNavTargets.down, mapNavTargets.left, mapNavTargets.right, dirty, selectedMapId, picker]);

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
      <div className={`me-toolbar${toolbarCompact ? ' me-compact' : ''}`} style={{ display: 'flex', alignItems: 'center', columnGap: 12, rowGap: 6, padding: '8px 16px', minHeight: 56, background: '#13132a', borderBottom: '1px solid #2a2a4a', flexShrink: 0, flexWrap: 'wrap' }}>
        <style>{`
          /* Elementos prescindibles de la toolbar en pantallas estrechas */
          @media (max-width: 1600px) { .me-legend { display: none !important; } }
          @media (max-width: 1280px) { .me-title { display: none !important; } }
          /* Responsive: en móvil/tablet, canvas arriba e inspector abajo. */
          @media (max-width: 820px) {
            .me-body { flex-direction: column !important; }
            .me-inspector {
              width: 100% !important;
              max-height: 46vh;
              border-left: none !important;
              border-top: 1px solid #2a2a4a;
            }
          }
          /* Objetivos de toque cómodos en pantallas táctiles pequeñas. */
          @media (max-width: 820px) {
            .me-body button { min-height: 30px; }
          }
          /* Barra compacta: oculta los controles secundarios para ganar alto
             de lienzo (el flujo de edición —mapa, modos, zoom, guardar— sigue). */
          .me-toolbar.me-compact .me-tb-secondary { display: none !important; }
          /* Pestaña para reabrir el inspector colapsado (eje horizontal). */
          .me-inspector-reopen {
            flex-shrink: 0;
            width: 26px;
            background: #13132a;
            border: none;
            border-left: 1px solid #2a2a4a;
            color: #8a8aff;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            writing-mode: vertical-rl;
            text-orientation: mixed;
            letter-spacing: 2px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            transition: background 0.15s, color 0.15s;
          }
          .me-inspector-reopen:hover { background: #1c1c3a; color: #aaccff; }
          @media (max-width: 820px) {
            .me-inspector-reopen {
              width: 100% !important;
              writing-mode: horizontal-tb !important;
              border-left: none !important;
              border-top: 1px solid #2a2a4a;
              padding: 6px 0;
              gap: 8px;
            }
          }
        `}</style>
        <span className="me-title" style={{ fontSize: 16, fontWeight: 700, color: '#a0a0ff', marginRight: 4 }}>🗺️ Map Editor</span>

        <a
          className="me-tb-secondary"
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

        {/* Pan / Mover (imprescindible en móvil para desplazar el mapa) */}
        <button
          onClick={() => setPanMode((v) => !v)}
          title={panMode
            ? 'Modo Mover activo: arrastra con el ratón para desplazar el mapa'
            : 'Móvil: arrastra con DOS dedos para desplazar y pellizca para zoom (sin activar nada). Ratón: activa este modo para arrastrar.'}
          style={{
            padding: '2px 8px',
            fontSize: 12,
            background: panMode ? '#2a3a5a' : '#1a1a3a',
            border: `1px solid ${panMode ? '#5a8aff' : '#3a3a5a'}`,
            borderRadius: 4,
            color: panMode ? '#aaccff' : '#e0e0ff',
            cursor: 'pointer',
            fontWeight: panMode ? 700 : 400,
          }}
        >
          ✋ Mover
        </button>

        {/* Desplazar TODOS los elementos a la vez (realinear tras redimensionar) */}
        <button
          onClick={() => setShiftPanelOpen((v) => !v)}
          title="Desplazar TODOS los elementos del mapa (muros, hierba, NPCs, portales, textos…) a la vez, para realinearlos con la imagen. No toca el destino de portales ni el minimapa."
          style={{
            padding: '2px 8px',
            fontSize: 12,
            background: shiftPanelOpen ? '#2a3a5a' : '#1a1a3a',
            border: `1px solid ${shiftPanelOpen ? '#5a8aff' : '#3a3a5a'}`,
            borderRadius: 4,
            color: shiftPanelOpen ? '#aaccff' : '#e0e0ff',
            cursor: 'pointer',
            fontWeight: shiftPanelOpen ? 700 : 400,
          }}
        >
          ✥ Desplazar todo
        </button>
        {shiftPanelOpen && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 6px',
              background: '#141428',
              border: '1px solid #3a3a5a',
              borderRadius: 4,
            }}
            title="Paso en tiles y dirección. Cada flecha mueve TODO el contenido; obsérvalo alinearse sobre la imagen."
          >
            <span style={{ fontSize: 11, color: '#8a8ab0' }}>paso</span>
            <input
              type="number"
              min={1}
              value={shiftStep}
              onChange={(e) => setShiftStep(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
              style={{
                width: 38,
                fontSize: 12,
                textAlign: 'center',
                background: '#0c0c1c',
                border: '1px solid #3a3a5a',
                borderRadius: 3,
                color: '#e0e0ff',
                padding: '1px 2px',
              }}
            />
            {([
              { label: '←', dx: -1, dy: 0 },
              { label: '↑', dx: 0, dy: -1 },
              { label: '↓', dx: 0, dy: 1 },
              { label: '→', dx: 1, dy: 0 },
            ] as const).map((b) => (
              <button
                key={b.label}
                onClick={() => shiftAllElements(b.dx * shiftStep, b.dy * shiftStep)}
                title={`Desplazar todo ${shiftStep} tile(s) ${b.label}`}
                style={{
                  width: 24,
                  height: 22,
                  fontSize: 13,
                  lineHeight: '20px',
                  background: '#1a1a3a',
                  border: '1px solid #4a4a7a',
                  borderRadius: 3,
                  color: '#e0e0ff',
                  cursor: 'pointer',
                }}
              >
                {b.label}
              </button>
            ))}
          </span>
        )}

        {/* Maximizar lienzo (colapsa inspector + compacta barra a la vez) */}
        <button
          onClick={toggleMaximize}
          title={maximized
            ? 'Restaurar la vista normal (mostrar inspector y barra completa)'
            : 'Maximizar el lienzo: oculta el inspector y compacta la barra para ganar espacio (puedes seguir editando)'}
          style={{
            padding: '2px 8px',
            fontSize: 12,
            background: maximized ? '#2a3a5a' : '#1a1a3a',
            border: `1px solid ${maximized ? '#5a8aff' : '#3a3a5a'}`,
            borderRadius: 4,
            color: maximized ? '#aaccff' : '#e0e0ff',
            cursor: 'pointer',
            fontWeight: maximized ? 700 : 400,
          }}
        >
          {maximized ? '🗗 Restaurar' : '⛶ Maximizar'}
        </button>

        {/* Compactar barra (eje vertical, independiente) */}
        <button
          onClick={() => setToolbarCompact((v) => !v)}
          title={toolbarCompact
            ? 'Mostrar todos los controles de la barra'
            : 'Compactar la barra: oculta controles secundarios y gana alto de lienzo'}
          style={{
            padding: '2px 8px',
            fontSize: 12,
            background: toolbarCompact ? '#2a3a5a' : '#1a1a3a',
            border: `1px solid ${toolbarCompact ? '#5a8aff' : '#3a3a5a'}`,
            borderRadius: 4,
            color: toolbarCompact ? '#aaccff' : '#e0e0ff',
            cursor: 'pointer',
          }}
        >
          {toolbarCompact ? '▾ Barra' : '▴ Barra'}
        </button>

        {/* Minimap toggle */}
        <button
          className="me-tb-secondary"
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
          {(['select', 'npc', 'walls', 'fences', 'elevations', 'grass', 'water', 'fly-unlock', 'texts', 'items', 'gifts', 'static-pokemon', 'cuttable-trees', 'berry-trees', 'boulders', 'spots', 'mechanics', 'portals', 'map'] as EditMode[]).map((m) => {
            const colorMap: Record<EditMode, string> = {
              select: '#2a6a8a',
              npc: '#5050b0',
              walls: '#7a3030',
              fences: '#7a5a30',
              elevations: '#8a5a2a',
              grass: '#3a7a3a',
              water: '#3a5aa0',
              'fly-unlock': '#2a7a9a',
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
                {m === 'npc' ? 'NPCs' : m === 'select' ? '⬚ Sel.' : m === 'elevations' ? '⛰ Alturas' : m === 'fly-unlock' ? '🛫 Vuelo' : m}
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
        <button
          className="me-tb-secondary"
          onClick={() => setAutofillTr({ scope: 'all', index: null })}
          disabled={editMode !== 'npc' || trainers.length === 0}
          title="Auto-generar el equipo de TODOS los entrenadores del mapa"
          style={{ padding: '4px 12px', background: editMode === 'npc' && trainers.length ? '#2a2a4a' : '#1a1a2a', border: '1px solid #6a5a9a', borderRadius: 4, color: editMode === 'npc' && trainers.length ? '#c8b0ff' : '#444', cursor: editMode === 'npc' && trainers.length ? 'pointer' : 'not-allowed', fontSize: 12 }}
        >
          ✨ Auto-equipos
        </button>

        {/* Guardar */}
        <button onClick={save} disabled={!dirty || saving} style={{ padding: '4px 12px', background: saveFlash ? '#2a6a2a' : (dirty ? '#3a3a7a' : '#1a1a3a'), border: `1px solid ${dirty ? '#6060c0' : '#2a2a4a'}`, borderRadius: 4, color: dirty ? '#fff' : '#555', cursor: dirty ? 'pointer' : 'default', fontSize: 13, transition: 'all 0.3s' }}>
          {saveFlash ? '✓ Guardado' : saving ? 'Guardando...' : '💾 Guardar'}
        </button>
        {commitMsg && (
          <span
            title={commitMsg.text}
            onClick={() => setCommitMsg(null)}
            style={{
              fontSize: 11, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              cursor: 'pointer', padding: '2px 6px', borderRadius: 4,
              color: commitMsg.tone === 'ok' ? '#88dd99' : commitMsg.tone === 'warn' ? '#ddcc77' : '#ff8888',
              background: '#0f0f1a', border: '1px solid #2a2a4a',
            }}
          >
            {commitMsg.text}
          </span>
        )}

        {/* Grafo de conexiones */}
        <button
          className="me-tb-secondary"
          onClick={() => setShowGraph(true)}
          title="Ver el grafo de conexiones entre mapas (puertas, teleports, salidas)"
          style={{ padding: '4px 12px', background: '#1a1a2e', border: '1px solid #4a4a7a', borderRadius: 4, color: '#a0c0ff', cursor: 'pointer', fontSize: 12 }}
        >
          🕸 Grafo
        </button>

        {/* Compilar juego (GitHub Action) */}
        <button
          className="me-tb-secondary"
          onClick={compileGame}
          disabled={building}
          title="Reconstruye el bundle del juego desde el código (online, vía GitHub Actions)"
          style={{ padding: '4px 12px', background: '#1a2a2a', border: '1px solid #3a6a6a', borderRadius: 4, color: building ? '#666' : '#88dddd', cursor: building ? 'default' : 'pointer', fontSize: 12 }}
        >
          {building ? 'Lanzando…' : '🛠 Compilar juego'}
        </button>

        {/* Modo mantenimiento (flag Supabase, instantáneo) */}
        <button
          className="me-tb-secondary"
          onClick={toggleMaintenance}
          disabled={maintBusy || maintenance === null}
          title="Pone el JUEGO en mantenimiento: cualquiera que entre verá el mensaje del Team Rocket. Cambia al instante (no recompila)."
          style={{
            padding: '4px 12px',
            background: maintenance ? '#3a1a1a' : '#1a1a2a',
            border: `1px solid ${maintenance ? '#c0392b' : '#5a3a3a'}`,
            borderRadius: 4,
            color: maintenance === null ? '#666' : maintenance ? '#ff9988' : '#cca0a0',
            cursor: maintBusy || maintenance === null ? 'default' : 'pointer',
            fontSize: 12,
            fontWeight: maintenance ? 700 : 400,
          }}
        >
          {maintenance === null ? '🚧 …' : maintBusy ? '🚧 …' : maintenance ? '🚧 Mantenimiento: ON' : '🚧 Mantenimiento'}
        </button>

        {/* Acceso durante mantenimiento (allowlist de jugadores) */}
        <button
          className="me-tb-secondary"
          onClick={openMaintPanel}
          title="Elige qué invitados pueden seguir jugando mientras el juego está en mantenimiento (verificado en servidor con su dispositivo)."
          style={{
            padding: '4px 12px',
            background: maintAllowed.length ? '#1a2a1a' : '#1a1a2a',
            border: `1px solid ${maintAllowed.length ? '#3a7a3a' : '#5a3a3a'}`,
            borderRadius: 4,
            color: maintAllowed.length ? '#99e099' : '#cca0a0',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          🎟 Acceso{maintAllowed.length ? `: ${maintAllowed.length}` : ''}
        </button>
        {maintPanelOpen && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => setMaintPanelOpen(false)}
          >
            <div
              style={{
                width: 'min(440px, 92vw)', maxHeight: '80vh', overflow: 'auto',
                background: '#161622', border: '1px solid #4a4a6a', borderRadius: 8,
                padding: 16, color: '#ddd', fontSize: 13,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong>🎟 Acceso durante mantenimiento</strong>
                <button onClick={() => setMaintPanelOpen(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>
              <p style={{ margin: '0 0 10px', color: '#9a9ab0', fontSize: 12 }}>
                Los invitados marcados pueden seguir jugando con el mantenimiento activo
                {maintenance ? ' (AHORA MISMO está activo).' : ' (ahora está desactivado).'}
                {' '}La verificación es en servidor: solo funciona desde el dispositivo del propio invitado.
              </p>
              <input
                placeholder="Buscar invitado…"
                value={maintSearch}
                onChange={(e) => setMaintSearch(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', marginBottom: 8, background: '#0e0e18', border: '1px solid #3a3a5a', borderRadius: 4, color: '#eee' }}
              />
              {maintPlayers.length === 0 && <div style={{ color: '#888' }}>Cargando jugadores…</div>}
              {maintPlayers
                .filter((p) => !maintSearch || p.name.toLowerCase().includes(maintSearch.toLowerCase()))
                .map((p) => {
                  const on = maintAllowed.some((id) => id.toLowerCase() === p.playerId.toLowerCase());
                  return (
                    <label
                      key={p.playerId}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                        borderRadius: 4, cursor: 'pointer',
                        background: on ? '#1a2a1a' : 'transparent',
                        border: `1px solid ${on ? '#3a7a3a' : 'transparent'}`,
                        marginBottom: 2,
                      }}
                    >
                      <input type="checkbox" checked={on} onChange={() => toggleAllowedPlayer(p.playerId)} />
                      <span style={{ flex: 1 }}>
                        {p.name} <span style={{ color: '#777', fontSize: 11 }}>· {p.pokemonCount} PKMN</span>
                      </span>
                      <code style={{ color: '#666', fontSize: 10 }}>{p.playerId.slice(0, 8)}…</code>
                    </label>
                  );
                })}
            </div>
          </div>
        )}

        {/* Importar .ts (sustituye todo el mapa) */}
        <button
          className="me-tb-secondary"
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

        {/* Exportar TS según modo — cluster secundario (oculto en barra compacta;
            el guardado commitea igualmente, así que exportar es opcional). */}
        <div className="me-tb-secondary" style={{ display: 'contents' }}>
        {editMode === 'select' && (
          <>
            <span style={{ fontSize: 11, color: '#8ad0ff', alignSelf: 'center', whiteSpace: 'nowrap' }}>
              {selRect
                ? `sel ${selRect.x1 - selRect.x0 + 1}×${selRect.y1 - selRect.y0 + 1}`
                : 'arrastra un rectángulo'}
            </span>
            <button onClick={copySelection} disabled={!selRect} title="Copiar el bloque seleccionado (muros, hierba, NPCs, portales, textos…) al portapapeles" style={selToolBtnStyle(!!selRect)}>⧉ Copiar</button>
            <button onClick={cutSelection} disabled={!selRect} title="Cortar: copia y borra del mapa el contenido de la selección" style={selToolBtnStyle(!!selRect)}>✂ Cortar</button>
            <button onClick={() => selRect && deleteRectContent(selRect)} disabled={!selRect} title="Borrar el contenido dentro de la selección (sin copiar)" style={selToolBtnStyle(!!selRect)}>🗑 Borrar</button>
            <button
              onClick={() => setPastePending((v) => !v)}
              disabled={!clipboard}
              title="Pegar el bloque del portapapeles (funciona en ESTE u otro mapa): pulsa y luego haz clic donde quieras la esquina superior-izquierda"
              style={selToolBtnStyle(!!clipboard, pastePending)}
            >
              {pastePending ? '📋 clic en el mapa…' : `📋 Pegar${clipboard ? ` ${clipboard.w}×${clipboard.h}` : ''}`}
            </button>
            {([['←', -1, 0], ['↑', 0, -1], ['↓', 0, 1], ['→', 1, 0]] as const).map(([lbl, dx, dy]) => (
              <button key={lbl} onClick={() => moveSelection(dx, dy)} disabled={!selRect} title={`Mover la selección 1 tile ${lbl}`} style={{ ...selToolBtnStyle(!!selRect), padding: '4px 7px' }}>{lbl}</button>
            ))}
            {selRect && (
              <button onClick={() => { setSelRect(null); setPastePending(false); }} title="Quitar la selección" style={selToolBtnStyle(true)}>✕</button>
            )}
          </>
        )}
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
        {editMode === 'fly-unlock' && (
          <>
            <span style={{ fontSize: 11, color: '#8fd3ff', alignSelf: 'center' }}>
              🛫 Pinta/arrastra las casillas que, al pisarlas, desbloquean volar a este mapa (guardado en la partida). Repinta para borrar.
            </span>
            <button onClick={doExportFlyUnlock} style={{ padding: '4px 12px', background: '#0f2530', border: '1px solid #2a7a9a', borderRadius: 4, color: '#8fd3ff', cursor: 'pointer', fontSize: 12 }}>
              🛫 Casillas de Vuelo
            </button>
          </>
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
        </div>

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
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          gap: 16,
          padding: '12px 20px',
        }}>
          {/* Imagen interactiva — viewport con pan + pinch-zoom */}
          <div
            ref={mmViewportRef}
            onPointerDown={onMmPointerDown}
            onPointerMove={onMmPointerMove}
            onPointerUp={onMmPointerUp}
            onPointerCancel={onMmPointerUp}
            style={{
              position: 'relative',
              flexShrink: 0,
              overflow: 'hidden',
              width: MINIMAP_WIDTH * MINIMAP_DISPLAY_SCALE,
              maxWidth: '100%',
              aspectRatio: `${MINIMAP_WIDTH} / ${MINIMAP_HEIGHT}`,
              background: '#000',
              touchAction: 'none',
              cursor: minimapMode === 'edit' ? 'crosshair' : 'grab',
              outline: minimapMode === 'edit' ? '2px solid #ffaa44' : '2px solid #2a2a4a',
              borderRadius: 2,
            }}
          >
            {/* Contenido transformado: imagen + puntos se desplazan/escalan
                juntos, así que los puntos nunca se desajustan. */}
            <div style={{
              position: 'absolute',
              inset: 0,
              transformOrigin: '0 0',
              transform: `translate(${mmView.tx}px, ${mmView.ty}px) scale(${mmView.scale})`,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={mmImgRef}
                src="/api/admin/map-image/kanto_region.png"
                alt="Kanto minimap"
                style={{ width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated' }}
                draggable={false}
              />
              {/* Puntos de grupo (modo navegar) — contra-escalados para que
                  mantengan tamaño constante en pantalla a cualquier zoom. */}
              {minimapMode === 'navigate' && minimapGroups.map((grp) => {
                const isCurrent = grp.key === currentGroupKey;
                const isOpen = grp.key === openGroup;
                const multi = grp.members.length > 1;
                const sz = multi ? 15 : (isCurrent ? 12 : 9);
                return (
                  <div key={grp.key} title={`${grp.name}${multi ? ` · ${grp.members.length} mapas (toca para ir y ver la lista)` : ''} (${grp.coord.x}, ${grp.coord.y})`} style={{
                    position: 'absolute',
                    left: `${(grp.coord.x / MINIMAP_WIDTH) * 100}%`,
                    top: `${(grp.coord.y / MINIMAP_HEIGHT) * 100}%`,
                    transform: `translate(-50%, -50%) scale(${1 / mmView.scale})`,
                    width: sz,
                    height: sz,
                    borderRadius: '50%',
                    background: isCurrent ? '#ff2222' : (multi ? '#ffcc44' : '#4488ff'),
                    border: isOpen ? '2px solid #fff' : (multi ? '1.5px solid rgba(0,0,0,0.55)' : '1px solid rgba(255,255,255,0.5)'),
                    boxShadow: isCurrent ? '0 0 4px 2px rgba(255,60,60,0.7)' : '0 0 3px rgba(0,0,0,0.85)',
                    pointerEvents: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {multi && (
                      <span style={{ fontSize: 8, fontWeight: 800, lineHeight: 1, color: isCurrent ? '#fff' : '#3a2a00' }}>
                        {grp.members.length}
                      </span>
                    )}
                  </div>
                );
              })}
              {/* Modo editar: puntos de referencia (tenues) + punto editable */}
              {minimapMode === 'edit' && minimapGroups.map((grp) => (
                <div key={grp.key} style={{
                  position: 'absolute',
                  left: `${(grp.coord.x / MINIMAP_WIDTH) * 100}%`,
                  top: `${(grp.coord.y / MINIMAP_HEIGHT) * 100}%`,
                  transform: `translate(-50%, -50%) scale(${1 / mmView.scale})`,
                  width: 7, height: 7, borderRadius: '50%',
                  background: grp.key === currentGroupKey ? '#88aaff' : '#445',
                  opacity: 0.5, pointerEvents: 'none',
                }} />
              ))}
              {minimapMode === 'edit' && (() => {
                const dot = minimapPos ?? minimapCoords;
                if (!dot) return null;
                const saved = !!minimapPos;
                return (
                  <div style={{
                    position: 'absolute',
                    left: `${(dot.x / MINIMAP_WIDTH) * 100}%`,
                    top: `${(dot.y / MINIMAP_HEIGHT) * 100}%`,
                    transform: `translate(-50%, -50%) scale(${1 / mmView.scale})`,
                    width: 11, height: 11, borderRadius: '50%',
                    background: saved ? '#ff2222' : '#ff8800',
                    boxShadow: `0 0 4px 2px ${saved ? 'rgba(255,60,60,0.7)' : 'rgba(255,140,0,0.6)'}`,
                    pointerEvents: 'none',
                    border: saved ? 'none' : '1px dashed #fff',
                  }} />
                );
              })()}
            </div>
          </div>

          {/* Panel lateral */}
          <div style={{ fontSize: 12, color: '#888', paddingTop: 4, minWidth: 180, flex: 1 }}>
            <div style={{ color: '#a0a0ff', fontWeight: 700, marginBottom: 8 }}>
              {mapData[selectedMapId]?.name ?? selectedMapId}
            </div>

            {/* Botones de modo */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {(['navigate', 'edit'] as const).map((mode) => (
                <button key={mode} onClick={() => { setMinimapMode(mode); setOpenGroup(null); }} style={{
                  padding: '3px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 4,
                  background: minimapMode === mode ? (mode === 'edit' ? '#3a2a0a' : '#0a1a3a') : '#1a1a2a',
                  border: `1px solid ${minimapMode === mode ? (mode === 'edit' ? '#ffaa44' : '#4488ff') : '#3a3a5a'}`,
                  color: minimapMode === mode ? (mode === 'edit' ? '#ffaa44' : '#88aaff') : '#888',
                }}>
                  {mode === 'navigate' ? '🗺️ Navegar' : '📍 Editar pos'}
                </button>
              ))}
            </div>

            {/* Controles de zoom (pan + pinch con dos dedos en móvil) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <button onClick={() => zoomMmAroundCenter(1 / 1.4)} title="Alejar" style={zoomBtnStyle}>−</button>
              <span style={{ color: '#9090b0', fontSize: 11, minWidth: 34, textAlign: 'center' }}>{mmView.scale.toFixed(1)}×</span>
              <button onClick={() => zoomMmAroundCenter(1.4)} title="Acercar" style={zoomBtnStyle}>＋</button>
              <button onClick={() => setMmView({ scale: 1, tx: 0, ty: 0 })} title="Ajustar a la vista" style={{ ...zoomBtnStyle, width: 'auto', padding: '2px 8px' }}>⤢ Ajustar</button>
            </div>
            <div style={{ color: '#556', fontSize: 10, marginBottom: 8 }}>
              📱 Dos dedos para mover y escalar · un dedo para {minimapMode === 'edit' ? 'fijar la posición' : 'ir a un mapa'}.
            </div>

            {/* Leyenda de colores (siempre visible en Navegar) */}
            {minimapMode === 'navigate' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 10px', fontSize: 10, color: '#889', marginBottom: 8 }}>
                <span><span style={{ color: '#ffcc44' }}>🟡</span> ciudad/zona (con interiores; el nº = cuántos mapas)</span>
                <span><span style={{ color: '#4488ff' }}>🔵</span> mapa suelto</span>
                <span><span style={{ color: '#ff4444' }}>🔴</span> mapa actual</span>
              </div>
            )}

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

                {/* Agrupación: incluir/excluir este mapa de un grupo */}
                <div style={{ marginTop: 14, borderTop: '1px solid #2a2a44', paddingTop: 10 }}>
                  <div style={{ color: '#9090c0', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Grupo en el minimapa</div>
                  <div style={{ color: '#778', fontSize: 10, marginBottom: 6 }}>
                    Ahora pertenece a <b style={{ color: '#cfe' }}>{minimapGroups.find((g) => g.key === currentGroupKey)?.name ?? prettyMapName(currentGroupKey)}</b>.
                  </div>
                  <select
                    value={minimapParent === null ? '__auto__' : (minimapParent === '' ? '__none__' : minimapParent)}
                    onChange={(e) => { const v = e.target.value; setMinimapParent(v === '__auto__' ? null : v === '__none__' ? '' : v); setDirty(true); }}
                    style={{ ...inputStyle, fontSize: 12, height: 28 }}
                  >
                    <option value="__auto__">Automático (por nombre)</option>
                    <option value="__none__">Suelto (excluir de todo grupo)</option>
                    <optgroup label="Incluir en…">
                      {minimapGroups
                        .filter((g) => g.key !== selectedMapId)
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((g) => (
                          <option key={g.key} value={g.key}>{g.name}</option>
                        ))}
                    </optgroup>
                  </select>
                  <div style={{ color: '#667', fontSize: 10, marginTop: 4, lineHeight: 1.5 }}>
                    <b>Automático</b>: agrupa por el nombre. <b>Suelto</b>: punto independiente.
                    <b> Incluir en…</b>: lo mete bajo esa ciudad/zona aunque el nombre no coincida.
                  </div>
                </div>
              </div>
            ) : openGroupData ? (
              /* Grupo abierto: ir a sus mapas + incluir/excluir (móvil-friendly) */
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ color: '#ffd166', fontWeight: 700 }}>{openGroupData.name} · {openGroupData.members.length} {openGroupData.members.length === 1 ? 'mapa' : 'mapas'}</span>
                  <button onClick={() => setOpenGroup(null)} style={{
                    padding: '4px 10px', fontSize: 13, cursor: 'pointer', borderRadius: 6,
                    background: '#1a1a2a', border: '1px solid #3a3a5a', color: '#aaa',
                  }}>✕</button>
                </div>
                <div style={{ color: '#667', fontSize: 10, marginBottom: 6 }}>★ = principal · ● posición propia · ○ hereda · «Sacar» lo deja suelto</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 240, overflowY: 'auto' }}>
                  {openGroupData.members.map((m) => {
                    const isSel = m === selectedMapId;
                    const hasPos = !!mapData[m]?.minimapPos;
                    const isPrincipal = m === openGroupData!.key;
                    return (
                      <div key={m} style={{ display: 'flex', gap: 5, alignItems: 'stretch' }}>
                        <button onClick={() => selectMap(m)} title={`Ir a ${m}`} style={{
                          flex: 1, minWidth: 0, textAlign: 'left', padding: '7px 10px', fontSize: 12, borderRadius: 6, cursor: 'pointer',
                          background: isSel ? '#0a2a4a' : '#141428',
                          border: `1px solid ${isSel ? '#4488ff' : '#2a2a44'}`,
                          color: isSel ? '#bcd8ff' : '#cfcfe8',
                          display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center',
                        }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {isPrincipal ? '★ ' : ''}{mapData[m]?.name ?? m}
                          </span>
                          <span title={hasPos ? 'Con posición propia' : 'Sin posición propia (hereda)'} style={{ color: hasPos ? '#5ad17a' : '#5a5a6a', fontSize: 11, flexShrink: 0 }}>
                            {hasPos ? '●' : '○'}
                          </span>
                        </button>
                        {!isPrincipal && (
                          <button onClick={() => setMapGroup(m, '')} title="Sacar de este grupo (dejar suelto)" style={{
                            flexShrink: 0, padding: '0 10px', fontSize: 11, cursor: 'pointer', borderRadius: 6,
                            background: '#2a1414', border: '1px solid #6a3a3a', color: '#ff9a9a',
                          }}>Sacar</button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Incluir un mapa cualquiera en este grupo (select nativo = cómodo en móvil) */}
                <select
                  value=""
                  onChange={(e) => { if (e.target.value) setMapGroup(e.target.value, openGroupData!.key); }}
                  style={{ ...inputStyle, fontSize: 12, height: 32, marginTop: 8 }}
                >
                  <option value="">➕ Incluir un mapa en este grupo…</option>
                  {allMapIds
                    .filter((id) => !openGroupData!.members.includes(id))
                    .sort((a, b) => (mapData[a]?.name ?? a).localeCompare(mapData[b]?.name ?? b))
                    .map((id) => (
                      <option key={id} value={id}>{mapData[id]?.name ?? id}</option>
                    ))}
                </select>
              </div>
            ) : (
              <div style={{ color: '#555', fontSize: 11, lineHeight: 1.7 }}>
                Toca un punto para ir a ese mapa. Si es una ciudad/zona 🟡, además
                se listan sus interiores aquí, donde puedes <b>sacarlos</b> del grupo o
                <b> incluir</b> otros mapas.
                <br />Las cercanas se solapan: usa el zoom (dos dedos o ＋) para separarlas.
                <br />También puedes usar las flechas del teclado.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Cuerpo principal ─────────────────────────────────────────── */}
      <div className="me-body" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Canvas ───────────────────────────────────────────────── */}
        <div
          ref={scrollRef}
          onPointerDown={onCanvasScrollPointerDown}
          onPointerMove={onCanvasScrollPointerMove}
          onPointerUp={onCanvasScrollPointerUp}
          onPointerCancel={onCanvasScrollPointerUp}
          style={{
            flex: 1,
            overflow: 'auto',
            position: 'relative',
            background: '#0a0a18',
            // En modo Mover capturamos el gesto para desplazar (desactiva el
            // scroll/zoom nativo del navegador para que el arrastre haga pan).
            touchAction: panMode ? 'none' : 'auto',
            cursor: panMode ? 'grab' : 'default',
          }}
        >
          {currentMap && (
            /* Contenedor EXTERIOR: incluye un margen clicable alrededor del mapa
               (para colocar portales/muros fuera del borde) y lleva los handlers.
               tileFromClientPoint mide contra el MAPA (canvasRef interior), así que
               los clicks en el margen dan coords negativas / ≥ ancho de forma natural. */
            <div
              onClick={onCanvasClick}
              onPointerDown={onCanvasPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              style={{
                position: 'relative',
                boxSizing: 'border-box',
                width: (currentMap.width + 2 * CANVAS_MARGIN) * zoom,
                height: (currentMap.height + 2 * CANVAS_MARGIN) * zoom,
                padding: CANVAS_MARGIN * zoom,
                // Tramado diagonal = zona "fuera del mapa".
                background: 'repeating-linear-gradient(45deg, #17172f, #17172f 5px, #0d0d1c 5px, #0d0d1c 10px)',
                cursor: editMode === 'walls' ? 'cell' : 'crosshair',
                touchAction: 'none',
              }}
            >
              {/* Rejilla también sobre el margen (alineada, para colocar con precisión) */}
              {showGrid && (
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  backgroundImage: `linear-gradient(to right, rgba(100,100,200,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(100,100,200,0.14) 1px, transparent 1px)`,
                  backgroundSize: `${zoom}px ${zoom}px`,
                }} />
              )}
              {/* Contenedor INTERIOR = el MAPA. overflow visible (por defecto) →
                  los overlays con coords fuera del borde se pintan en el margen. */}
              <div
                ref={canvasRef}
                style={{
                  position: 'relative',
                  width: currentMap.width * zoom,
                  height: currentMap.height * zoom,
                  backgroundImage: `url(/api/admin/map-image/${currentMap.imageFile}?v=${imgVersion})`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  imageRendering: 'pixelated',
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

              {/* Casilla de llegada tras navegar por una puerta (🧭): pulso verde */}
              {arrivalMark && (
                <div
                  style={{
                    position: 'absolute',
                    left: arrivalMark.x * zoom,
                    top: arrivalMark.y * zoom,
                    width: zoom,
                    height: zoom,
                    border: '3px solid #6effa0',
                    boxShadow: '0 0 0 3px rgba(30,200,90,0.45), 0 0 18px 6px rgba(60,255,140,0.55)',
                    pointerEvents: 'none',
                    boxSizing: 'border-box',
                    zIndex: 60,
                    animation: 'me-arrival-pulse 0.9s ease-in-out infinite alternate',
                  }}
                >
                  <style>{`@keyframes me-arrival-pulse { from { opacity: 1; } to { opacity: 0.35; } }`}</style>
                </div>
              )}

              {/* Selección rectangular (modo select): rectángulo azul con asa */}
              {editMode === 'select' && selRect && (
                <div
                  style={{
                    position: 'absolute',
                    left: selRect.x0 * zoom,
                    top: selRect.y0 * zoom,
                    width: (selRect.x1 - selRect.x0 + 1) * zoom,
                    height: (selRect.y1 - selRect.y0 + 1) * zoom,
                    background: pastePending ? 'rgba(80,180,255,0.10)' : 'rgba(80,180,255,0.22)',
                    border: '2px dashed #5ac8ff',
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.5) inset',
                    pointerEvents: 'none',
                    boxSizing: 'border-box',
                    zIndex: 50,
                  }}
                />
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

              {/* Fences overlay (con flecha de dirección de salto) */}
              {Object.entries(fences).flatMap(([rowKey, cols]) => {
                const y = parseInt(rowKey, 10);
                if (Number.isNaN(y)) return [];
                return cols.map((x) => {
                  const dir = (fenceDirections[String(y)]?.[String(x)] ?? 'down') as DirectionName;
                  return (
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
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#1a1200',
                        fontSize: Math.max(9, zoom * 0.55),
                        fontWeight: 700,
                        lineHeight: 1,
                        textShadow: '0 0 2px rgba(255,230,150,0.9)',
                      }}
                    >
                      {DIRECTION_ARROW[dir]}
                    </div>
                  );
                });
              })}

              {/* Elevations overlay (tinte por nivel + número). Visible con
                  intensidad completa en el modo ⛰; tenue en el resto para no
                  tapar la edición de otros elementos. */}
              {(editMode === 'elevations' || Object.keys(elevations).length > 0) && Object.entries(elevations).flatMap(([rowKey, colsMap]) => {
                const y = parseInt(rowKey, 10);
                if (Number.isNaN(y)) return [];
                const LEVEL_COLORS: Record<number, string> = {
                  1: '210, 140, 60',   // naranja tierra (nivel 1)
                  2: '150, 90, 200',   // púrpura (nivel 2)
                  3: '220, 70, 70',    // rojo (nivel 3)
                };
                return Object.entries(colsMap).map(([colKey, level]) => {
                  const x = parseInt(colKey, 10);
                  if (Number.isNaN(x)) return null;
                  const rgb = LEVEL_COLORS[level] ?? '200, 200, 200';
                  const strong = editMode === 'elevations';
                  return (
                    <div
                      key={`el-${y}-${x}`}
                      style={{
                        position: 'absolute',
                        left: x * zoom,
                        top: y * zoom,
                        width: zoom,
                        height: zoom,
                        background: `rgba(${rgb}, ${strong ? 0.45 : 0.14})`,
                        border: strong ? `1px solid rgba(${rgb}, 0.9)` : 'none',
                        pointerEvents: 'none',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: Math.max(8, zoom * 0.45),
                        fontWeight: 700,
                        lineHeight: 1,
                        textShadow: '0 0 2px rgba(0,0,0,0.9)',
                        opacity: strong ? 1 : 0.7,
                      }}
                    >
                      {strong ? level : ''}
                    </div>
                  );
                });
              })}

              {/* Ramps overlay (escaleras entre planos) */}
              {(editMode === 'elevations' || Object.keys(ramps).length > 0) && Object.entries(ramps).flatMap(([rowKey, cols]) => {
                const y = parseInt(rowKey, 10);
                if (Number.isNaN(y)) return [];
                const strong = editMode === 'elevations';
                return cols.map((x) => (
                  <div
                    key={`rp-${y}-${x}`}
                    style={{
                      position: 'absolute',
                      left: x * zoom,
                      top: y * zoom,
                      width: zoom,
                      height: zoom,
                      background: strong ? 'rgba(80, 220, 160, 0.5)' : 'rgba(80, 220, 160, 0.18)',
                      border: strong ? '1px solid rgba(80, 220, 160, 0.95)' : '1px dashed rgba(80, 220, 160, 0.45)',
                      pointerEvents: 'none',
                      boxSizing: 'border-box',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: Math.max(8, zoom * 0.55),
                      lineHeight: 1,
                    }}
                  >
                    🪜
                  </div>
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

              {/* Fly-unlock overlay: casillas que desbloquean este destino de Vuelo */}
              {Object.entries(flyUnlockTiles).flatMap(([rowKey, cols]) => {
                const y = parseInt(rowKey, 10);
                if (Number.isNaN(y)) return [];
                return cols.map((x) => (
                  <div
                    key={`fu-${y}-${x}`}
                    style={{
                      position: 'absolute',
                      left: x * zoom,
                      top: y * zoom,
                      width: zoom,
                      height: zoom,
                      background: editMode === 'fly-unlock'
                        ? 'rgba(90, 200, 255, 0.5)'
                        : 'rgba(90, 200, 255, 0.16)',
                      border: editMode === 'fly-unlock'
                        ? '1px solid rgba(90, 200, 255, 0.95)'
                        : '1px dashed rgba(90, 200, 255, 0.4)',
                      pointerEvents: 'none',
                      boxSizing: 'border-box',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: Math.max(8, zoom * 0.5),
                      lineHeight: 1,
                    }}
                  >
                    {editMode === 'fly-unlock' ? '🛫' : ''}
                  </div>
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
                { key: 'dayCareNpc' as SpotKey, pos: dayCareNpc, emoji: '🌱', color: '#88dd66' },
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
            </div>
          )}

          {!currentMap && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#444' }}>
              Selecciona un mapa
            </div>
          )}
        </div>

        {/* ── Pestaña para reabrir el inspector colapsado (eje horizontal) ── */}
        {!inspectorOpen && (
          <button
            className="me-inspector-reopen"
            onClick={() => setInspectorOpen(true)}
            title="Mostrar el inspector"
          >
            ‹ Inspector
          </button>
        )}

        {/* ── Inspector ─────────────────────────────────────────────── */}
        <div className="me-inspector" style={{ width: 'clamp(264px, 24vw, 320px)', background: '#13132a', borderLeft: '1px solid #2a2a4a', display: inspectorOpen ? 'flex' : 'none', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>

          {/* Header inspector */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #2a2a4a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0, fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>
              Inspector — {currentMap
                ? `${currentMap.name} · ${trainers.length} NPCs · ${Object.values(walls).reduce((a, b) => a + b.length, 0)} walls`
                : 'sin mapa'}
            </div>
            <button
              onClick={() => setInspectorOpen(false)}
              title="Ocultar el inspector y ampliar el lienzo"
              style={{ flexShrink: 0, padding: '2px 8px', fontSize: 13, lineHeight: 1, background: '#1a1a3a', border: '1px solid #3a3a5a', borderRadius: 4, color: '#8a8aff', cursor: 'pointer' }}
            >
              ⟩
            </button>
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
            ) : editMode === 'elevations' ? (
              <>
                {/* Brocha de planos de altura */}
                <div style={{ padding: '10px 12px', background: '#1a1208', border: '1px solid #8a5a2a', borderRadius: 6, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ffbb77', marginBottom: 6 }}>
                    Brocha de altura
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                    {([1, 2, 3, 'ramp'] as ElevationBrush[]).map((b) => {
                      const active = activeElevation === b;
                      const label = b === 'ramp' ? '🪜 Rampa' : `⛰ Nivel ${b}`;
                      const color = b === 'ramp' ? '#50dca0' : b === 1 ? '#d28c3c' : b === 2 ? '#965ac8' : '#dc4646';
                      return (
                        <button
                          key={String(b)}
                          onClick={() => setActiveElevation(b)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            padding: '8px 6px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            background: active ? color : '#241a10',
                            border: active ? '1px solid #ffe0bb' : '1px solid #4a3a20',
                            borderRadius: 4, color: active ? '#141008' : '#bba',
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 11, color: '#a89878', marginTop: 8, lineHeight: 1.5 }}>
                    Pinta zonas elevadas (meseta marrón = nivel 1+). Los tiles sin
                    pintar están a nivel 0. En el juego SOLO se puede caminar entre
                    tiles del mismo nivel; para cambiar de plano hay que pisar una
                    🪜 rampa (escalera) o saltar un saliente. Repintar con la misma
                    brocha borra. Al cambiar de mapa o teletransportarte, tu plano
                    es el del tile donde caes.
                  </div>
                </div>
                <ModeHelpBlock
                  emoji="⛰"
                  color="#ffbb77"
                  title="Planos de altura"
                  lines={[
                    'Pinta con el nivel activo; arrastra para rellenar',
                    'Repintar la misma casilla la borra (vuelve a nivel 0)',
                    '🪜 Rampa: conecta cualquier par de niveles',
                    'Los NPC y objetos no se ven afectados al colocarse',
                  ]}
                  count={Object.values(elevations).reduce((a, m) => a + Object.keys(m).length, 0) + Object.values(ramps).reduce((a, b) => a + b.length, 0)}
                  countLabel="tiles con altura/rampa"
                  sourceFile={currentMap?.sourceFile}
                />
              </>
            ) : editMode === 'fences' ? (
              <>
                {/* Selector de dirección de salto del saliente */}
                <div style={{ padding: '10px 12px', background: '#1a1408', border: '1px solid #7a5a30', borderRadius: 6, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ffcc88', marginBottom: 6 }}>
                    Dirección del salto
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                    {(['up', 'down', 'left', 'right'] as DirectionName[]).map((d) => {
                      const active = activeFenceDir === d;
                      const label = { up: 'Arriba', down: 'Abajo', left: 'Izquierda', right: 'Derecha' }[d];
                      return (
                        <button
                          key={d}
                          onClick={() => setActiveFenceDir(d)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '8px 6px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            background: active ? '#7a5a30' : '#2a2010',
                            border: active ? '1px solid #ffcc88' : '1px solid #4a3a20',
                            borderRadius: 4, color: active ? '#fff4e0' : '#bba',
                          }}
                        >
                          <span style={{ fontSize: 15 }}>{DIRECTION_ARROW[d]}</span> {label}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 11, color: '#a89878', marginTop: 8, lineHeight: 1.4 }}>
                    La flecha marca hacia dónde se SALTA el saliente. Por el lado
                    contrario actúa como muro. Pinta los tiles con la dirección
                    elegida; cámbiala para colocar salientes en otro sentido.
                    Borrar un tile (volver a pintarlo) también quita su dirección.
                  </div>
                </div>
                <ModeHelpBlock
                  emoji="🚧"
                  title="Modo Fences"
                  color="#ffcc88"
                  lines={[
                    'Click + arrastre: pintar/borrar fences',
                    'Cada tile guarda su dirección de salto',
                    'Lo ya existente salta hacia abajo (▼)',
                  ]}
                  count={Object.values(fences).reduce((a, b) => a + b.length, 0)}
                  countLabel="fences"
                  sourceFile={currentMap?.sourceFile}
                />
              </>
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
                <button
                  onClick={() => setAutofillEnc({ tables: ['walk'], isCave: !!cave })}
                  style={{ width: '100%', padding: '6px 0', fontSize: 12, cursor: 'pointer', borderRadius: 6, background: '#1a2e3a', border: '1px solid #4a7a8a', color: '#a0e0ff', marginBottom: 8 }}
                >
                  ✨ Auto-rellenar {cave ? 'cueva' : 'hierba'} (rango, gen, horario…)
                </button>
                <EncountersTableEditor
                  title="🌿 Pokémon en hierba"
                  tableKey="walk"
                  openPicker={setPicker}
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
                <button
                  onClick={() => setAutofillEnc({ tables: ['oldRod', 'goodRod', 'superRod', 'surfSpots'], isCave: false })}
                  style={{ width: '100%', padding: '6px 0', fontSize: 12, cursor: 'pointer', borderRadius: 6, background: '#1a2e3a', border: '1px solid #4a7a8a', color: '#a0e0ff', marginBottom: 8 }}
                >
                  ✨ Auto-rellenar pesca + surf (3 cañas diferenciadas)
                </button>
                <EncountersTableEditor
                  title="🎣 Caña Vieja"
                  tableKey="oldRod"
                  openPicker={setPicker}
                  table={encounters.oldRod ?? EMPTY_TABLE()}
                  onChange={(t) => {
                    setEncounters((e) => ({ ...e, oldRod: t }));
                    setDirty(true);
                  }}
                />
                <EncountersTableEditor
                  title="🎣 Caña Buena"
                  tableKey="goodRod"
                  openPicker={setPicker}
                  table={encounters.goodRod ?? EMPTY_TABLE()}
                  onChange={(t) => {
                    setEncounters((e) => ({ ...e, goodRod: t }));
                    setDirty(true);
                  }}
                />
                <EncountersTableEditor
                  title="🎣 Súper Caña"
                  tableKey="superRod"
                  openPicker={setPicker}
                  table={encounters.superRod ?? EMPTY_TABLE()}
                  onChange={(t) => {
                    setEncounters((e) => ({ ...e, superRod: t }));
                    setDirty(true);
                  }}
                />
                <EncountersTableEditor
                  title="🏄 Surfeando"
                  tableKey="surfSpots"
                  openPicker={setPicker}
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
                  'Click en una casilla → escribe el texto en el modal',
                  'Recompensa: elige Pokémon ⭐ o objeto 📦 (se bloquea al tomar)',
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
                  'Click vacío: elige el objeto en la lista (con búsqueda)',
                  'Click en item: cambiar tipo, visible/oculto o eliminar',
                  `${itemTypeKeys.length} objetos disponibles`,
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
                  'Click vacío: elige el Pokémon regalo (con búsqueda)',
                  'Click en regalo: editar o eliminar',
                  'questId automático único (editable)',
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
                  'Click vacío: elige el Pokémon (con búsqueda) + sprite',
                  'Click en tile: editar o eliminar',
                  'Una vez combatido (captura/derrota) desaparece',
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
                  'questId automático único · persiste en completedQuests',
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
                  'Click vacío: elige la baya en la lista (con búsqueda)',
                  'Click en árbol existente: eliminar',
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
                dayCareNpc={dayCareNpc}
                onClear={(k) => {
                  if (k === 'start') return;
                  if (k === 'pokemonCenter') setPokemonCenter(null);
                  else if (k === 'pc') setPcPos(null);
                  else if (k === 'store') setStorePos(null);
                  else if (k === 'recoverLocation') setRecoverLocation(null);
                  else if (k === 'onlineBattleNpc') setOnlineBattleNpc(null);
                  else setDayCareNpc(null);
                  setDirty(true);
                }}
                onStoreItemsChange={(next) => {
                  setStoreItems(next);
                  setDirty(true);
                }}
                openPicker={setPicker}
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
                imgVersion={imgVersion}
                uploadingImg={uploadingImg}
                onUploadImage={uploadMapImage}
                onChangeDims={updateMapDims}
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
                flyAlwaysAvailable={flyAlwaysAvailable}
                setFlyAlwaysAvailable={(v) => { setFlyAlwaysAvailable(v); setDirty(true); }}
                flyUnlockCount={Object.values(flyUnlockTiles).reduce((a, b) => a + b.length, 0)}
                onPaintFlyUnlock={() => setEditMode('fly-unlock')}
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
                exitReturnMap={exitReturnMap}
                setExitReturnMap={(v) => { setExitReturnMap(v); setDirty(true); }}
                exitReturnPos={exitReturnPos}
                setExitReturnPos={(v) => { setExitReturnPos(v); setDirty(true); }}
                mapData={mapData}
                openPicker={setPicker}
                onGoTo={goToMap}
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
                openPicker={setPicker}
                onAutofill={() => setAutofillTr({ scope: 'one', index: selectedIdx! })}
                currentMapId={selectedMapId}
                itemOptions={itemTypeKeys}
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

      {/* Modales de selección visual */}
      <PickerHost picker={picker} mapData={mapData} onClose={() => setPicker(null)} onNavigate={goToMap} />

      {/* Grafo de conexiones entre mapas */}
      {showGraph && (
        <MapGraphOverlay
          mapData={mapData}
          currentMapId={selectedMapId}
          onJump={(id) => jumpToMap(id)}
          onClose={() => setShowGraph(false)}
        />
      )}

      {/* Auto-relleno de Pokémon salvajes */}
      {autofillEnc && (
        <AutofillEncountersModal
          tables={autofillEnc.tables}
          isCave={autofillEnc.isCave}
          onApply={applyEncounterAutofill}
          onClose={() => setAutofillEnc(null)}
        />
      )}

      {/* Auto-relleno de equipos de entrenador */}
      {autofillTr && (
        <AutofillTrainersModal
          scope={autofillTr.scope}
          count={autofillTr.scope === 'all' ? trainers.length : 1}
          onApply={applyTrainerAutofill}
          onClose={() => setAutofillTr(null)}
        />
      )}
    </div>
  );
}

// ── Auto-relleno de contenido (Pokémon salvajes / equipos) ─────────────────

export interface EncounterAutofillConfig {
  gen: GenChoice;
  minLevel: number;
  maxLevel: number;
  count: number;
  allowedTimes: TimeSegment[] | null;
  autoTimeBias: boolean;
  includeLegendary: boolean;
}

export interface TrainerAutofillConfig {
  gen: GenChoice;
  types: string[];
  difficulty: number;
  minLevel: number;
  maxLevel: number;
  size: number;       // tamaño objetivo del equipo
  keepSize: boolean;  // (scope all) conservar el tamaño actual de cada equipo
}

const afOverlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.62)', zIndex: 120,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
};
const afCardStyle: React.CSSProperties = {
  background: '#12122a', border: '1px solid #3a3a5a', borderRadius: 8,
  padding: '18px 20px', width: 380, maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto',
  color: '#cfcfe8', fontSize: 13, boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
};
const afLabel: React.CSSProperties = { display: 'block', color: '#9090c0', fontSize: 11, marginBottom: 4, marginTop: 14 };
const afApplyBtn: React.CSSProperties = {
  marginTop: 18, width: '100%', padding: '8px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer',
  borderRadius: 6, background: '#2a5a2a', border: '1px solid #4a8a4a', color: '#bfffbf',
};

function GenPicker({ value, onChange }: { value: GenChoice; onChange: (g: GenChoice) => void }) {
  const opts: { v: GenChoice; l: string }[] = [{ v: 1, l: 'Gen I' }, { v: 2, l: 'Gen II' }, { v: 'both', l: 'Ambas' }];
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {opts.map((o) => (
        <button key={String(o.v)} onClick={() => onChange(o.v)} style={{
          flex: 1, padding: '5px 0', fontSize: 12, cursor: 'pointer', borderRadius: 4,
          background: value === o.v ? '#2a3a6a' : '#1a1a2a',
          border: `1px solid ${value === o.v ? '#5a7aff' : '#3a3a5a'}`,
          color: value === o.v ? '#bcd0ff' : '#888',
        }}>{o.l}</button>
      ))}
    </div>
  );
}

function AfLevelRange({ min, max, setMin, setMax }: { min: number; max: number; setMin: (n: number) => void; setMax: (n: number) => void }) {
  const clamp = (n: number) => Math.max(2, Math.min(MAX_LEVEL, n || 2));
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
      <div style={{ flex: 1 }}>
        <span style={{ color: '#888', fontSize: 10 }}>Nivel mín.</span>
        <input type="number" min={2} max={MAX_LEVEL} value={min} onChange={(e) => setMin(clamp(parseInt(e.target.value, 10)))} style={{ ...inputStyle, fontSize: 12, padding: '3px 6px' }} />
      </div>
      <div style={{ flex: 1 }}>
        <span style={{ color: '#888', fontSize: 10 }}>Nivel máx.</span>
        <input type="number" min={2} max={MAX_LEVEL} value={max} onChange={(e) => setMax(clamp(parseInt(e.target.value, 10)))} style={{ ...inputStyle, fontSize: 12, padding: '3px 6px' }} />
      </div>
    </div>
  );
}

function AutofillEncountersModal({ tables, isCave, onApply, onClose }: {
  tables: EncounterTableKey[];
  isCave: boolean;
  onApply: (cfg: EncounterAutofillConfig) => void;
  onClose: () => void;
}) {
  const isWater = tables.some((t) => t !== 'walk');
  const [gen, setGen] = useState<GenChoice>('both');
  const [minLevel, setMinLevel] = useState(isWater ? 5 : 3);
  const [maxLevel, setMaxLevel] = useState(isWater ? 35 : 7);
  const [count, setCount] = useState(7);
  const segs: TimeSegment[] = ['morning', 'day', 'night'];
  const [times, setTimes] = useState<Record<TimeSegment, boolean>>({ morning: true, day: true, night: true });
  const [autoTimeBias, setAutoTimeBias] = useState(true);
  const [includeLegendary, setIncludeLegendary] = useState(false);
  const segLabel: Record<TimeSegment, string> = { morning: '🌅 Mañana', day: '☀️ Día', night: '🌙 Noche' };

  const apply = () => {
    const selected = segs.filter((s) => times[s]);
    const allowedTimes = selected.length === 0 || selected.length === 3 ? null : selected;
    onApply({ gen, minLevel, maxLevel, count, allowedTimes, autoTimeBias, includeLegendary });
  };

  return (
    <div style={afOverlayStyle} onClick={onClose}>
      <div style={afCardStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: '#a0d0ff', fontSize: 15 }}>
            ✨ Auto-rellenar {isWater ? 'pesca y surf' : isCave ? 'cueva' : 'hierba'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: 18, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ color: '#778', fontSize: 11, marginTop: 4 }}>
          {isWater
            ? 'Rellena Caña Vieja, Buena, Súper y Surf con especies de agua adecuadas a cada nivel.'
            : isCave
              ? 'Especies típicas de cueva (roca, tierra, veneno, murciélagos…).'
              : 'Especies comunes de ruta. Las raras salen a nivel algo más alto.'}
        </div>

        <label style={afLabel}>Generación</label>
        <GenPicker value={gen} onChange={setGen} />

        <label style={afLabel}>Rango de niveles</label>
        <AfLevelRange min={minLevel} max={maxLevel} setMin={setMinLevel} setMax={setMaxLevel} />

        {!isWater && (
          <>
            <label style={afLabel}>Nº de especies: {count}</label>
            <input type="range" min={2} max={10} value={count} onChange={(e) => setCount(parseInt(e.target.value, 10))} style={{ width: '100%' }} />
          </>
        )}

        <label style={afLabel}>Franjas horarias</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {segs.map((s) => (
            <button key={s} onClick={() => setTimes((t) => ({ ...t, [s]: !t[s] }))} style={{
              flex: 1, padding: '5px 0', fontSize: 11, cursor: 'pointer', borderRadius: 4,
              background: times[s] ? '#2a3a5a' : '#1a1a2a',
              border: `1px solid ${times[s] ? '#5a7aaa' : '#3a3a5a'}`,
              color: times[s] ? '#bcd' : '#666',
            }}>{segLabel[s]}</button>
          ))}
        </div>
        <div style={{ color: '#667', fontSize: 10, marginTop: 4 }}>Las tres (o ninguna) = 24 h.</div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer', color: '#bcd' }}>
          <input type="checkbox" checked={autoTimeBias} onChange={(e) => setAutoTimeBias(e.target.checked)} />
          Asignar día/noche según la especie (fantasmas/siniestros de noche…)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, cursor: 'pointer', color: '#bcd' }}>
          <input type="checkbox" checked={includeLegendary} onChange={(e) => setIncludeLegendary(e.target.checked)} />
          Permitir legendarios
        </label>

        <button onClick={apply} style={afApplyBtn}>✨ Generar y rellenar</button>
        <div style={{ color: '#665', fontSize: 10, marginTop: 8, textAlign: 'center' }}>Reemplaza la tabla actual. Puedes ajustar a mano después.</div>
      </div>
    </div>
  );
}

function AutofillTrainersModal({ scope, count, onApply, onClose }: {
  scope: 'one' | 'all';
  count: number;
  onApply: (cfg: TrainerAutofillConfig) => void;
  onClose: () => void;
}) {
  const [gen, setGen] = useState<GenChoice>('both');
  const [types, setTypes] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState(4);
  const [minLevel, setMinLevel] = useState(5);
  const [maxLevel, setMaxLevel] = useState(15);
  const [size, setSize] = useState(scope === 'one' ? 3 : 3);
  const [keepSize, setKeepSize] = useState(true);

  const toggleType = (t: string) => setTypes((cur) => cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]);
  const TYPE_ES: Record<string, string> = {
    normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico', grass: 'Planta',
    ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno', ground: 'Tierra', flying: 'Volador',
    psychic: 'Psíquico', bug: 'Bicho', rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón',
    dark: 'Siniestro', steel: 'Acero',
  };

  return (
    <div style={afOverlayStyle} onClick={onClose}>
      <div style={afCardStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: '#a0d0ff', fontSize: 15 }}>
            ✨ Auto-equipo {scope === 'all' ? `· todos (${count})` : ''}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: 18, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ color: '#778', fontSize: 11, marginTop: 4 }}>
          {scope === 'all'
            ? 'Genera un equipo para CADA entrenador del mapa.'
            : 'Genera el equipo de este entrenador.'}
        </div>

        <label style={afLabel}>Generación</label>
        <GenPicker value={gen} onChange={setGen} />

        <label style={afLabel}>Tipos (vacío = cualquiera)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {ALL_TYPES.map((t) => (
            <button key={t} onClick={() => toggleType(t)} style={{
              padding: '3px 8px', fontSize: 11, cursor: 'pointer', borderRadius: 4,
              background: types.includes(t) ? '#3a2a5a' : '#1a1a2a',
              border: `1px solid ${types.includes(t) ? '#9a7aff' : '#3a3a5a'}`,
              color: types.includes(t) ? '#d8c8ff' : '#888',
            }}>{TYPE_ES[t] ?? t}</button>
          ))}
        </div>

        <label style={afLabel}>Dificultad: {difficulty} / 10</label>
        <input type="range" min={1} max={10} value={difficulty} onChange={(e) => setDifficulty(parseInt(e.target.value, 10))} style={{ width: '100%' }} />
        <div style={{ color: '#667', fontSize: 10 }}>
          ↑ dificultad = especies más fuertes (BST), niveles más altos{difficulty >= 9 ? ' y legendarios' : ''}.
        </div>

        <label style={afLabel}>Rango de niveles</label>
        <AfLevelRange min={minLevel} max={maxLevel} setMin={setMinLevel} setMax={setMaxLevel} />

        {scope === 'all' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer', color: '#bcd' }}>
            <input type="checkbox" checked={keepSize} onChange={(e) => setKeepSize(e.target.checked)} />
            Conservar el tamaño de equipo actual de cada entrenador
          </label>
        )}
        <label style={afLabel}>{scope === 'all' && keepSize ? 'Tamaño si el equipo está vacío' : 'Tamaño del equipo'}: {size}</label>
        <input type="range" min={1} max={6} value={size} onChange={(e) => setSize(parseInt(e.target.value, 10))} style={{ width: '100%' }} />

        <button onClick={() => onApply({ gen, types, difficulty, minLevel, maxLevel, size, keepSize })} style={afApplyBtn}>
          ✨ Generar {scope === 'all' ? 'equipos' : 'equipo'}
        </button>
        <div style={{ color: '#665', fontSize: 10, marginTop: 8, textAlign: 'center' }}>Reemplaza el equipo actual. Ajustable a mano después.</div>
      </div>
    </div>
  );
}

// ── Inspector Panel ────────────────────────────────────────────────────────

function InspectorPanel({ trainer, idx, onChange, onDelete, openPicker, onAutofill, currentMapId, itemOptions }: {
  trainer: Trainer;
  idx: number;
  onChange: (patch: Partial<Trainer>) => void;
  onDelete: () => void;
  openPicker: (s: PickerState) => void;
  onAutofill: () => void;
  currentMapId: string;
  itemOptions: string[];
}) {
  const reg = NPC_REGISTRY[trainer.npcKey];
  const sprite = spriteUrl(trainer.npcKey, trainer.facing);
  const portrait = portraitUrl(trainer.npcKey);
  // postGame: string = bloque raw legado (solo lectura); objeto = editable.
  const pgLegacy = typeof trainer.postGame === 'string' ? trainer.postGame : null;
  const pg = trainer.postGame && typeof trainer.postGame === 'object' ? trainer.postGame : null;

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
        <label style={labelStyle}>Pokémon (click en el sprite para elegir)</label>
        {trainer.pokemon.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
            {/* Sprite del pokémon → abre el picker visual */}
            <button
              onClick={() => openPicker({
                kind: 'pokemon',
                title: `Pokémon #${i + 1} del entrenador`,
                current: p.id,
                onPick: (id) => onChange({ pokemon: trainer.pokemon.map((pk, j) => j === i ? { ...pk, id } : pk) }),
              })}
              title={`#${p.id} ${POKEMON_NAMES_EDITOR[p.id] ?? ''} · cambiar`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, padding: '3px 6px', background: '#0d0d22', border: '1px solid #2a2a4a', borderRadius: 4, cursor: 'pointer' }}
            >
              {p.id > 0 && p.id <= MAX_POKEMON_ID && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/editor/pokemon/${p.id}.png`} alt="" style={{ width: 26, height: 26, imageRendering: 'pixelated', flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
              <span style={{ fontSize: 11, color: '#cdf', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{POKEMON_NAMES_EDITOR[p.id] ?? `#${p.id}`}</span>
            </button>
            <span style={{ color: '#666', fontSize: 12 }}>Lv</span>
            <input type="number" min={1} max={MAX_LEVEL} value={p.level} onChange={(e) => {
              const level = Math.max(1, Math.min(MAX_LEVEL, parseInt(e.target.value, 10) || 1));
              const next = trainer.pokemon.map((pk, j) => j === i ? { ...pk, level } : pk);
              onChange({ pokemon: next });
            }} style={{ ...inputStyle, width: 50 }} />
            <button onClick={() => onChange({ pokemon: trainer.pokemon.filter((_, j) => j !== i) })} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            disabled={trainer.pokemon.length >= 6}
            onClick={() => {
              if (trainer.pokemon.length >= 6) return; // un equipo nunca supera 6
              openPicker({
                kind: 'pokemon',
                title: 'Añadir Pokémon al entrenador',
                onPick: (id) => onChange({ pokemon: [...trainer.pokemon, { id, level: 5 }].slice(0, 6) }),
              });
            }}
            title={trainer.pokemon.length >= 6 ? 'Máximo 6 Pokémon por equipo' : 'Añadir Pokémon'}
            style={{ fontSize: 12, background: '#1a2a1a', border: '1px solid #3a5a3a', borderRadius: 4, color: trainer.pokemon.length >= 6 ? '#4a5a4a' : '#88ff88', cursor: trainer.pokemon.length >= 6 ? 'not-allowed' : 'pointer', padding: '3px 10px', opacity: trainer.pokemon.length >= 6 ? 0.5 : 1 }}>
            + Pokémon {trainer.pokemon.length >= 6 ? '(máx. 6)' : ''}
          </button>
          <button onClick={onAutofill} title="Auto-generar el equipo (tipo, dificultad, niveles…)" style={{ fontSize: 12, background: '#1f1a2e', border: '1px solid #6a5a9a', borderRadius: 4, color: '#c8b0ff', cursor: 'pointer', padding: '3px 10px' }}>
            ✨ Auto-equipo
          </button>
        </div>
      </div>

      {/* Recompensas al derrotar (postGame + defeatQuestId) */}
      {pgLegacy ? (
        <div style={{ ...sectionStyle, background: '#1a1a0a', border: '1px solid #5a5a00', borderRadius: 6, padding: '10px 12px', marginTop: 12 }}>
          <div style={{ color: '#cccc00', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
            ⚠ postGame (solo lectura — formato no estándar)
          </div>
          <div style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>
            Este bloque tiene claves fuera de message/items y se preserva tal cual en el export.
          </div>
          <pre style={{ color: '#aaaa44', fontSize: 10, background: '#0a0a00', padding: 8, borderRadius: 4, overflow: 'auto', maxHeight: 120, margin: 0, fontFamily: 'monospace' }}>
            {pgLegacy}
          </pre>
        </div>
      ) : (
        <div style={{ ...sectionStyle, background: '#101a10', border: '1px solid #2a4a2a', borderRadius: 6, padding: '10px 12px', marginTop: 12 }}>
          <div style={{ color: '#88cc88', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
            🏆 Recompensas al derrotar
          </div>
          <label style={labelStyle}>Mensaje post-combate (1 línea = 1 texto)</label>
          <textarea
            value={(pg?.message ?? []).join('\n')}
            onChange={(e) => {
              const message = e.target.value ? e.target.value.split('\n') : [];
              const items = pg?.items ?? [];
              onChange({ postGame: message.length || items.length ? { message, items } : null });
            }}
            placeholder="Se muestra tras la derrota, antes de entregar los objetos"
            rows={2}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, marginBottom: 8 }}
          />
          <label style={labelStyle}>Objetos / medallas / MTs que entrega</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
            {(pg?.items ?? []).map((key: string, i: number) => (
              <span key={`${key}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#0d0d22', border: '1px solid #2a2a4a', borderRadius: 4, padding: '2px 6px', fontSize: 11, color: '#cdf' }}>
                {key.toLowerCase().includes('badge') ? '🏅 ' : ''}{key}
                <button
                  onClick={() => {
                    const items = (pg?.items ?? []).filter((_: string, j: number) => j !== i);
                    const message = pg?.message ?? [];
                    onChange({ postGame: message.length || items.length ? { message, items } : null });
                  }}
                  style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1 }}
                >×</button>
              </span>
            ))}
            <button
              onClick={() => openPicker({
                kind: 'item',
                title: 'Objeto que entrega al ser derrotado',
                subtitle: 'Medallas (…Badge), MTs/MOs y objetos normales',
                options: itemOptions,
                onPick: (key) => {
                  const items = [...(pg?.items ?? []), key];
                  const message = pg?.message ?? [];
                  onChange({ postGame: { message, items } });
                },
              })}
              style={{ fontSize: 12, background: '#1a2a1a', border: '1px solid #3a5a3a', borderRadius: 4, color: '#88ff88', cursor: 'pointer', padding: '3px 10px' }}
            >+ objeto</button>
          </div>
          <label style={labelStyle}>Logro al derrotar (quest id)</label>
          <input
            type="text"
            value={trainer.defeatQuestId ?? ''}
            onChange={(e) => onChange({ defeatQuestId: e.target.value.trim() || null })}
            placeholder="p.ej. gimnasio-celeste-superado (se añade a completedQuests)"
            style={inputStyle}
          />
          <div style={{ color: '#667', fontSize: 10, marginTop: 4 }}>
            El logro se marca al ganar el combate; visible en el panel admin. Los regalos y
            static Pokémon tienen su propio quest id en sus modos respectivos.
          </div>
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
              <div style={{ marginTop: 4 }}>
                <button
                  onClick={() => openPicker({
                    kind: 'maptile',
                    title: 'Entrenador del que depende',
                    subtitle: 'Elige el mapa y haz click en el entrenador (resaltado en rojo)',
                    requirePos: true,
                    highlightTrainers: true,
                    current: defeatedId ? (() => {
                      const m = defeatedId.match(/^(.*)-(\d+)-(\d+)$/);
                      return m ? { mapId: m[1], pos: { x: parseInt(m[2], 10), y: parseInt(m[3], 10) } } : undefined;
                    })() : { mapId: currentMapId },
                    onPick: ({ mapId, pos }) => { if (pos) onChange({ hideCondition: `trainer-defeated:${mapId}-${pos.x}-${pos.y}` }); },
                  })}
                  style={{ ...inputStyle, textAlign: 'left', cursor: 'pointer', width: '100%' }}
                >
                  {defeatedId ? defeatedId : '👆 Elegir entrenador…'}
                </button>
              </div>
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
// Nivel máximo del juego (ver game-src/src/app/level-helper.ts → MAX_LEVEL).
const MAX_LEVEL = 200;

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
  title, tableKey, table, onChange, openPicker,
}: {
  title: string;
  tableKey: 'walk' | 'oldRod' | 'goodRod' | 'superRod' | 'surfSpots';
  table: { rate: number; pokemon: { id: number; chance: number; minLevel: number; maxLevel: number; conditionValues: { name: string; url: string }[]; timesOfDay?: ('morning' | 'day' | 'night')[] }[] };
  onChange: (
    next: { rate: number; pokemon: { id: number; chance: number; minLevel: number; maxLevel: number; conditionValues: { name: string; url: string }[]; timesOfDay?: ('morning' | 'day' | 'night')[] }[] }
  ) => void;
  openPicker: (s: PickerState) => void;
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
              {/* Sprite → abre el picker visual */}
              <button
                onClick={() => openPicker({ kind: 'pokemon', title: 'Elegir Pokémon del encuentro', current: p.id, onPick: (id) => update(i, { id }) })}
                title="Cambiar Pokémon"
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 52, height: 52, background: '#111130', borderRadius: 5, flexShrink: 0, border: '1px solid #2a2a4a', cursor: 'pointer', padding: 0 }}
              >
                {spriteOk ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/editor/pokemon/${p.id}.png`}
                    alt={name}
                    style={{ width: 44, height: 44, imageRendering: 'pixelated', objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ fontSize: 20, color: '#444' }}>?</span>
                )}
              </button>

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
                    max={MAX_LEVEL}
                    value={p.minLevel}
                    onChange={(e) => {
                      const v = Math.max(1, Math.min(MAX_LEVEL, parseInt(e.target.value, 10) || 1));
                      update(i, { minLevel: v, maxLevel: Math.max(v, p.maxLevel) });
                    }}
                    title="Nivel mínimo"
                    style={{ ...inputBase, width: 44, flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 10, color: '#555', flexShrink: 0 }}>–</span>
                  <input
                    type="number"
                    min={p.minLevel}
                    max={MAX_LEVEL}
                    value={p.maxLevel}
                    onChange={(e) => update(i, { maxLevel: Math.max(p.minLevel, Math.min(MAX_LEVEL, parseInt(e.target.value, 10) || p.minLevel)) })}
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
  startPos, pokemonCenter, pcPos, storePos, storeItems, itemTypeKeys, recoverLocation, onlineBattleNpc, dayCareNpc,
  onClear, onStoreItemsChange, openPicker, sourceFile,
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
  dayCareNpc: { x: number; y: number } | null;
  onClear: (k: SpotKey) => void;
  onStoreItemsChange: (next: string[]) => void;
  openPicker: (s: PickerState) => void;
  sourceFile?: string;
}) {
  const spots: { key: SpotKey; label: string; emoji: string; color: string; pos: { x: number; y: number } | null; required?: boolean }[] = [
    { key: 'start', label: 'Start', emoji: '▶', color: '#ffffff', pos: startPos, required: true },
    { key: 'pokemonCenter', label: 'Pokémon Center', emoji: '🏥', color: '#ff6688', pos: pokemonCenter },
    { key: 'pc', label: 'PC', emoji: '💻', color: '#88ccff', pos: pcPos },
    { key: 'store', label: 'Store', emoji: '🛒', color: '#ffcc66', pos: storePos },
    { key: 'recoverLocation', label: 'Recover Location', emoji: '✨', color: '#ccff88', pos: recoverLocation },
    { key: 'onlineBattleNpc', label: 'Online Battle NPC', emoji: '🌐', color: '#88aaff', pos: onlineBattleNpc },
    { key: 'dayCareNpc', label: 'Guardería (Goñi)', emoji: '🌱', color: '#88dd66', pos: dayCareNpc },
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
                <button
                  onClick={() => openPicker({
                    kind: 'item',
                    title: 'Objeto de la tienda',
                    options: itemTypeKeys,
                    current: item,
                    onPick: (key) => onStoreItemsChange(storeItems.map((it, i) => i === idx ? key : it)),
                  })}
                  style={{ ...inputStyle, height: 28, flex: 1, textAlign: 'left', cursor: 'pointer' }}
                >
                  {itemLabel(item)}
                </button>
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
              onClick={() => openPicker({
                kind: 'item',
                title: 'Añadir objeto a la tienda',
                options: itemTypeKeys,
                onPick: (key) => onStoreItemsChange([...storeItems, key]),
              })}
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
  imgVersion,
  uploadingImg,
  onUploadImage,
  onChangeDims,
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
  flyAlwaysAvailable,
  setFlyAlwaysAvailable,
  flyUnlockCount,
  onPaintFlyUnlock,
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
  imgVersion: number;
  uploadingImg: boolean;
  onUploadImage: (f: File) => void;
  onChangeDims: (patch: { width?: number; height?: number }) => void;
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
  flyAlwaysAvailable: boolean;
  setFlyAlwaysAvailable: (v: boolean) => void;
  flyUnlockCount: number;
  onPaintFlyUnlock: () => void;
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

      {/* ── Imagen del mapa: preview + reemplazo por subida ── */}
      {currentMap && (
        <div style={{ ...sectionStyle, background: '#101a12', border: '1px solid #2d6a3a', borderRadius: 4, padding: 10, marginBottom: 12 }}>
          <label style={labelStyle}>Imagen del mapa</label>
          <div style={{ color: '#789', fontSize: 11, marginBottom: 6 }}>{currentMap.imageFile}</div>
          <img
            src={`/api/admin/map-image/${currentMap.imageFile}?v=${imgVersion}`}
            alt={currentMap.imageFile}
            style={{ width: '100%', imageRendering: 'pixelated', border: '1px solid #333', borderRadius: 3, background: '#000' }}
          />
          <label
            style={{
              display: 'block', textAlign: 'center', marginTop: 8, padding: '6px 8px',
              background: uploadingImg ? '#1a2a1e' : '#12321c', border: '1px solid #2d8a4a',
              color: uploadingImg ? '#6a8a72' : '#8fe8a8', borderRadius: 4,
              cursor: uploadingImg ? 'wait' : 'pointer', fontSize: 12, fontWeight: 700,
            }}
          >
            {uploadingImg ? 'Subiendo…' : '🖼 Reemplazar PNG…'}
            <input
              type="file"
              accept="image/png"
              disabled={uploadingImg}
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = ''; // permitir re-subir el mismo fichero
                if (!f) return;
                if (!window.confirm(`Esto REEMPLAZA ${currentMap.imageFile} en el repo (commit inmediato) y en el editor. ¿Continuar?`)) return;
                onUploadImage(f);
              }}
            />
          </label>
          <div style={{ color: '#789', fontSize: 10, marginTop: 6, lineHeight: 1.5 }}>
            Se sube con el nombre actual (el .ts no cambia). El juego jugable la
            mostrará tras 🛠 Compilar juego. 16 px = 1 tile.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <label style={{ color: '#888', fontSize: 10 }}>
              Width (tiles)
              <input
                type="number"
                min={1}
                value={currentMap.width}
                onChange={(e) => {
                  const w = parseInt(e.target.value, 10);
                  if (!Number.isNaN(w)) onChangeDims({ width: w });
                }}
                style={{ ...inputStyle, fontSize: 11, padding: '2px 6px' }}
              />
            </label>
            <label style={{ color: '#888', fontSize: 10 }}>
              Height (tiles)
              <input
                type="number"
                min={1}
                value={currentMap.height}
                onChange={(e) => {
                  const h = parseInt(e.target.value, 10);
                  if (!Number.isNaN(h)) onChangeDims({ height: h });
                }}
                style={{ ...inputStyle, fontSize: 11, padding: '2px 6px' }}
              />
            </label>
          </div>
          <div style={{ color: '#789', fontSize: 10, marginTop: 6 }}>
            width/height se escriben al .ts con 💾 Guardar. Cuidado: encoger el
            mapa deja fuera contenido con coordenadas mayores.
          </div>
        </div>
      )}

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
          <span>Destino de Vuelo (MO Vuelo)</span>
        </label>
        <div style={{ color: '#789', fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>
          Marca este mapa como destino de Vuelo. Requiere <code>minimapPos</code> (punto en Kanto)
          y el <b>flySpot</b> de abajo (casilla de aterrizaje). El destino solo aparece en el
          juego cuando está <b>disponible</b> (ver abajo).
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

        {/* Disponibilidad del destino de Vuelo */}
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #2d5674' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: flyAlwaysAvailable ? '#8fd3ff' : '#aaa' }}>
            <input type="checkbox" checked={flyAlwaysAvailable} onChange={(e) => setFlyAlwaysAvailable(e.target.checked)} style={{ accentColor: '#58b7ff' }} />
            <span>Siempre disponible (desde el inicio)</span>
          </label>
          <div style={{ color: '#789', fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>
            Si está marcado, se puede volar aquí desde el principio sin pisar ninguna casilla.
            Si NO, el destino se desbloquea cuando el jugador pisa una de las <b>casillas de desbloqueo</b>
            (queda registrado al guardar la partida).
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={onPaintFlyUnlock}
              disabled={flyAlwaysAvailable}
              title={flyAlwaysAvailable ? 'No hace falta: el destino está siempre disponible' : 'Pintar casillas de desbloqueo en el canvas'}
              style={{ padding: '3px 10px', background: '#0f2530', border: '1px solid #2a7a9a', color: flyAlwaysAvailable ? '#456' : '#8fd3ff', borderRadius: 4, cursor: flyAlwaysAvailable ? 'not-allowed' : 'pointer', fontSize: 11, opacity: flyAlwaysAvailable ? 0.5 : 1 }}
            >
              🛫 Pintar casillas de desbloqueo
            </button>
            <span style={{ fontSize: 11, color: '#789' }}>
              {flyUnlockCount} casilla{flyUnlockCount === 1 ? '' : 's'}
            </span>
          </div>
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
  exitReturnMap, setExitReturnMap,
  exitReturnPos, setExitReturnPos,
  mapData, openPicker, onUpdate, onDelete, sourceFile, onGoTo,
}: {
  portals: PortalEntry[];
  selectedIdx: number | null;
  setSelectedIdx: (i: number | null) => void;
  exitReturnMap: string | null;
  setExitReturnMap: (v: string | null) => void;
  exitReturnPos: { x: number; y: number } | null;
  setExitReturnPos: (v: { x: number; y: number } | null) => void;
  mapData: MapData;
  openPicker: (s: PickerState) => void;
  onUpdate: (idx: number, patch: Partial<PortalEntry>) => void;
  onDelete: (idx: number) => void;
  sourceFile?: string;
  /** Navegar el editor al mapa destino de una puerta (centra la casilla de llegada). */
  onGoTo?: (mapId: string, pos?: { x: number; y: number } | null) => void;
}) {
  const sel = selectedIdx !== null ? portals[selectedIdx] : null;
  const COLOR = '#cc88ff';
  return (
    <div style={{ color: '#ccc', fontSize: 13, lineHeight: 1.6 }}>
      <div style={{ fontSize: 32, marginBottom: 8, textAlign: 'center' }}>🚪</div>
      <p style={{ color: '#ffaa88', fontWeight: 700, marginBottom: 8 }}>Modo Portales</p>
      <p style={{ color: '#aaa', fontSize: 11, marginBottom: 12 }}>
        Un único tipo de portal: una <strong>salida</strong> que lleva a otro mapa y a una casilla concreta.
        Click en una casilla vacía para crear (eliges mapa y casilla de llegada; usa la rueda para hacer zoom). Click en un portal para editarlo.
      </p>

      {/* Editor del seleccionado */}
      {sel && (
        <div style={{ padding: 10, background: '#0f0f1a', border: `2px solid ${COLOR}`, borderRadius: 4, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 6 }}>
            <strong style={{ color: COLOR, fontSize: 12 }}>🚪 Salida ({sel.pos.x},{sel.pos.y})</strong>
            <div style={{ display: 'flex', gap: 6 }}>
              {onGoTo && sel.destMap && (
                <button
                  onClick={() => onGoTo(sel.destMap!, sel.destPos)}
                  title={`Abrir ${mapData[sel.destMap]?.name ?? sel.destMap} centrado en la casilla de llegada`}
                  style={{ background: 'transparent', border: '1px solid #3a6a4a', color: '#8fe0a8', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}
                >
                  🧭 Ir al destino
                </button>
              )}
              <button
                onClick={() => onDelete(selectedIdx!)}
                style={{ background: 'transparent', border: '1px solid #7a3a3a', color: '#ff8888', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}
              >
                Eliminar
              </button>
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: '#888' }}>Mapa y casilla de llegada:</label>
            <button
              onClick={() => openPicker({
                kind: 'maptile',
                title: '🚪 Destino de la salida',
                subtitle: 'Elige mapa y casilla de llegada (rueda = zoom)',
                requirePos: true,
                current: sel.destMap ? { mapId: sel.destMap, pos: sel.destPos } : undefined,
                onPick: ({ mapId, pos }) => onUpdate(selectedIdx!, { destMap: mapId, destPos: pos ?? { x: 0, y: 0 } }),
              })}
              style={{ ...inputStyle, width: '100%', marginTop: 4, textAlign: 'left', cursor: 'pointer' }}
            >
              {sel.destMap ? (mapData[sel.destMap]?.name ?? sel.destMap) : '👆 Elegir mapa…'}
              {sel.destPos && <span style={{ color: '#88aaff' }}> → ({sel.destPos.x},{sel.destPos.y})</span>}
            </button>
          </div>
        </div>
      )}

      {/* Lista de portales */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Portales en este mapa ({portals.length}):</div>
        <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {portals.length === 0 && <div style={{ color: '#555', fontSize: 11, textAlign: 'center', padding: 8 }}>Ninguno</div>}
          {portals.map((p, i) => {
            const active = selectedIdx === i;
            return (
              <div
                key={i}
                onClick={() => setSelectedIdx(i)}
                style={{
                  padding: '4px 8px',
                  background: active ? `${COLOR}22` : '#0f0f1a',
                  border: `1px solid ${active ? COLOR : '#2a2a4a'}`,
                  borderRadius: 3,
                  cursor: 'pointer',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>🚪</span>
                <span style={{ color: COLOR, fontWeight: 600 }}>({p.pos.x},{p.pos.y})</span>
                {p.destMap && (
                  <span style={{ color: '#aaa', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    → {mapData[p.destMap]?.name ?? p.destMap}{p.destPos ? ` (${p.destPos.x},${p.destPos.y})` : ''}
                  </span>
                )}
                {onGoTo && p.destMap && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onGoTo(p.destMap!, p.destPos); }}
                    title={`Ir a ${mapData[p.destMap]?.name ?? p.destMap} (casilla de llegada centrada)`}
                    style={{ marginLeft: 'auto', flexShrink: 0, background: 'transparent', border: '1px solid #3a6a4a', color: '#8fe0a8', borderRadius: 3, padding: '1px 7px', cursor: 'pointer', fontSize: 11 }}
                  >
                    🧭
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* exitReturnMap / exitReturnPos — ya NO se usa para transiciones (todo es
          portal unificado). Se conserva porque el juego lo usa como mapa padre
          para la MÚSICA (interiores heredan la del exterior) y para resolver el
          punto de RECUPERACIÓN tras un KO. */}
      <div style={{ padding: 10, background: '#0f0f1a', border: '1px solid #2a2a4a', borderRadius: 4, marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: '#88ccff', fontWeight: 700, marginBottom: 6 }}>
          🎵 Mapa padre (música / recuperación)
        </div>
        <label style={{ fontSize: 11, color: '#888' }}>Mapa exterior de referencia:</label>
        <button
          onClick={() => openPicker({
            kind: 'maptile',
            title: '🎵 Mapa padre (música / recuperación)',
            subtitle: 'Mapa exterior del que este hereda música y punto de recuperación',
            requirePos: true,
            current: exitReturnMap ? { mapId: exitReturnMap, pos: exitReturnPos ?? undefined } : undefined,
            onPick: ({ mapId, pos }) => { setExitReturnMap(mapId); setExitReturnPos(pos); },
          })}
          style={{ ...inputStyle, width: '100%', marginTop: 4, textAlign: 'left', cursor: 'pointer' }}
        >
          {exitReturnMap ? (mapData[exitReturnMap]?.name ?? exitReturnMap) : '👆 Elegir mapa…'}
          {exitReturnPos && <span style={{ color: '#88aaff' }}> → ({exitReturnPos.x},{exitReturnPos.y})</span>}
        </button>
        {(exitReturnMap || exitReturnPos) && (
          <button
            onClick={() => { setExitReturnMap(null); setExitReturnPos(null); }}
            style={{ marginTop: 6, background: 'transparent', border: '1px solid #5a5a7a', color: '#888', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 10 }}
          >
            × Limpiar destino
          </button>
        )}
      </div>

      <div style={{ padding: 10, background: '#1a1530', border: '1px solid #5a3a3a', borderRadius: 4, fontSize: 11, color: '#ff9999' }}>
        ⚠️ Pega el bloque exportado en <code>{sourceFile ?? '*.ts'}</code> dentro del objeto del mapa.
      </div>
    </div>
  );
}
