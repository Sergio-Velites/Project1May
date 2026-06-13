/**
 * ts-codegen.ts — Escritor QUIRÚRGICO de los .ts de mapas del juego.
 *
 * Objetivo: que "Guardar" en el map-editor reescriba game-src/src/maps/<map>.ts
 * SIN que el usuario tenga que copiar/pegar ni arreglar imports a mano.
 *
 * Principios de seguridad (máxima prioridad: NO perder datos):
 *  1. Solo se reescriben los campos que el editor gestiona (lista MANAGED).
 *     Todo lo demás del archivo (encounters vía getEncounterData, comentarios,
 *     campos custom, la imagen, etc.) se conserva intacto.
 *  2. Los imports se RECONCILIAN a partir del USO real en el texto final
 *     (se escanea `npc:`, `Direction.`, `ItemType.`, `MapId.`, `getEncounterData(`).
 *     Así nunca falta un import tras pegar, y no se añade ninguno innecesario.
 *  3. Si algo no encaja con la forma esperada, se devuelve un error claro y NO
 *     se escribe nada (fail-safe).
 *
 * Es un módulo puro (sin React/Next) para poder testearse con
 * `node --experimental-strip-types` y usarse desde la API route.
 */

// ── Tipos del estado que el editor envía ────────────────────────────────────

export type DirectionName = 'down' | 'up' | 'left' | 'right';

export interface TrainerState {
  npcKey: string;
  pokemon: { id: number; level: number }[];
  facing: DirectionName;
  pos: { x: number; y: number };
  intro: string[];
  outtro: string[];
  money: number;
  persistent?: boolean;
  isOnline?: boolean;
  isGymLeader?: boolean;
  hideCondition?: string | null;
  sightRange?: number | null;
  /** Texto crudo del objeto postGame (se conserva tal cual). */
  postGame?: string | null;
}

export interface TextRewardState {
  type: 'pokemon' | 'item';
  pokemonId?: number;
  level?: number;
  itemKey?: string;
  amount?: number;
  questId: string;
}

export interface Pos { x: number; y: number }

/**
 * Estado de un mapa tal y como lo maneja el editor. Todos los campos son
 * opcionales: solo se reescriben los que vengan definidos (`undefined` = no
 * tocar ese campo en el .ts; conserva lo que hubiera).
 */
export interface MapWriteState {
  name?: string;
  start?: Pos | null;
  cave?: boolean;
  dark?: boolean;
  allowBicycle?: boolean;
  flyable?: boolean;
  flySpot?: Pos | null;
  music?: string | null;
  trainers?: TrainerState[];
  walls?: Record<string, number[]>;
  fences?: Record<string, number[]>;
  grass?: Record<string, number[]>;
  water?: Record<string, number[]>;
  texts?: Record<string, Record<string, string[]>>;
  textRewards?: Record<string, Record<string, TextRewardState>>;
  items?: { itemKey: string; pos: Pos; hidden?: boolean }[];
  gifts?: { pokemonId: number; level: number; pos: Pos; questId: string }[];
  staticPokemon?: { pokemonId: number; level: number; sprite: string; pos: Pos; questId: string; intro?: string[] }[];
  cuttableTrees?: { pos: Pos; questId: string }[];
  berryTrees?: { pos: Pos; itemKey: string }[];
  boulders?: { pos: Pos; id: string }[];
  pokemonCenter?: Pos | null;
  pc?: Pos | null;
  store?: Pos | null;
  storeItems?: string[];
  recoverLocation?: Pos | null;
  onlineBattleNpc?: Pos | null;
  spinners?: Record<string, Record<string, DirectionName>>;
  stoppers?: Record<string, number[]>;
  maps?: Record<string, Record<string, string>>;
  teleports?: Record<string, Record<string, { map: string; pos: Pos }>>;
  exits?: Record<string, number[]>;
  exitReturnMap?: string | null;
  exitReturnPos?: Pos | null;
  minimapPos?: Pos | null;
}

// ── Helpers de formato (idénticos al editor para conservar el estilo) ───────

function escapeTSString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function directionToEnum(d: DirectionName): string {
  return `Direction.${d.charAt(0).toUpperCase() + d.slice(1)}`;
}

export function pascalCaseFromMapId(id: string): string {
  return id
    .split(/[-_]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

function sortedNumKeys(obj: Record<string, unknown>): number[] {
  return Object.keys(obj)
    .map((k) => parseInt(k, 10))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
}

// ── Serializadores por campo (devuelven `field: value` SIN coma final) ──────
// La coma y la indentación las añade el ensamblador.

function serRowColMap(data: Record<string, number[]>, field: string): string {
  const rows = sortedNumKeys(data);
  if (rows.length === 0) return `${field}: {}`;
  const lines = rows.map((r) => `    ${r}: [${(data[String(r)] ?? []).slice().sort((a, b) => a - b).join(', ')}],`);
  return `${field}: {\n${lines.join('\n')}\n  }`;
}

function serTexts(texts: Record<string, Record<string, string[]>>): string {
  const rows = sortedNumKeys(texts);
  if (rows.length === 0) return 'text: {}';
  const rowLines = rows.map((r) => {
    const cols = sortedNumKeys(texts[String(r)] ?? {});
    const colLines = cols.map((c) => {
      const arr = texts[String(r)][String(c)] ?? [];
      const items = arr.map((s) => `        "${escapeTSString(s)}"`).join(',\n');
      return `      ${c}: [\n${items}\n      ],`;
    });
    return `    ${r}: {\n${colLines.join('\n')}\n    },`;
  });
  return `text: {\n${rowLines.join('\n')}\n  }`;
}

function serTextRewards(rewards: Record<string, Record<string, TextRewardState>>): string {
  const rows = sortedNumKeys(rewards);
  if (rows.length === 0) return 'textRewards: {}';
  const rowLines = rows.map((r) => {
    const cols = sortedNumKeys(rewards[String(r)] ?? {});
    const colLines = cols.map((c) => {
      const rw = rewards[String(r)][String(c)];
      const inner: string[] = [`        type: "${rw.type}",`];
      if (rw.type === 'pokemon') {
        inner.push(`        pokemonId: ${rw.pokemonId ?? 1},`);
        inner.push(`        level: ${rw.level ?? 5},`);
      } else {
        inner.push(`        itemKey: ItemType.${rw.itemKey ?? 'Potion'},`);
        if (rw.amount && rw.amount !== 1) inner.push(`        amount: ${rw.amount},`);
      }
      inner.push(`        questId: "${escapeTSString(rw.questId)}",`);
      return `      ${c}: {\n${inner.join('\n')}\n      },`;
    });
    return `    ${r}: {\n${colLines.join('\n')}\n    },`;
  });
  return `textRewards: {\n${rowLines.join('\n')}\n  }`;
}

function serItems(items: { itemKey: string; pos: Pos; hidden?: boolean }[]): string {
  if (items.length === 0) return 'items: []';
  const lines = items.map((it) => {
    const l = [`    {`, `      item: ItemType.${it.itemKey},`, `      pos: { x: ${it.pos.x}, y: ${it.pos.y} },`];
    if (it.hidden) l.push(`      hidden: true,`);
    l.push(`    },`);
    return l.join('\n');
  });
  return `items: [\n${lines.join('\n')}\n  ]`;
}

function serGifts(gifts: { pokemonId: number; level: number; pos: Pos; questId: string }[]): string {
  if (gifts.length === 0) return 'gifts: []';
  const lines = gifts.map((g) => [
    `    {`,
    `      pokemonId: ${g.pokemonId},`,
    `      level: ${g.level},`,
    `      pos: { x: ${g.pos.x}, y: ${g.pos.y} },`,
    `      questId: "${escapeTSString(g.questId)}",`,
    `    },`,
  ].join('\n'));
  return `gifts: [\n${lines.join('\n')}\n  ]`;
}

function serStaticPokemon(sp: { pokemonId: number; level: number; sprite: string; pos: Pos; questId: string; intro?: string[] }[]): string {
  if (sp.length === 0) return 'staticPokemon: []';
  const lines = sp.map((s) => {
    const l = [
      `    {`,
      `      pokemonId: ${s.pokemonId},`,
      `      level: ${s.level},`,
      `      sprite: "${escapeTSString(s.sprite)}",`,
      `      pos: { x: ${s.pos.x}, y: ${s.pos.y} },`,
      `      questId: "${escapeTSString(s.questId)}",`,
    ];
    if (s.intro && s.intro.length > 0) {
      const introLines = s.intro.map((line) => `        "${escapeTSString(line)}",`).join('\n');
      l.push(`      intro: [\n${introLines}\n      ],`);
    }
    l.push(`    },`);
    return l.join('\n');
  });
  return `staticPokemon: [\n${lines.join('\n')}\n  ]`;
}

function serCuttableTrees(trees: { pos: Pos; questId: string }[]): string {
  if (trees.length === 0) return 'cuttableTrees: []';
  const lines = trees.map((t) => [
    `    {`,
    `      pos: { x: ${t.pos.x}, y: ${t.pos.y} },`,
    `      questId: "${escapeTSString(t.questId)}",`,
    `    },`,
  ].join('\n'));
  return `cuttableTrees: [\n${lines.join('\n')}\n  ]`;
}

function serBerryTrees(trees: { pos: Pos; itemKey: string }[]): string {
  if (trees.length === 0) return 'berryTrees: []';
  const lines = trees.map((t) => [
    `    {`,
    `      pos: { x: ${t.pos.x}, y: ${t.pos.y} },`,
    `      item: ItemType.${t.itemKey},`,
    `    },`,
  ].join('\n'));
  return `berryTrees: [\n${lines.join('\n')}\n  ]`;
}

function serBoulders(boulders: { pos: Pos; id: string }[]): string {
  if (boulders.length === 0) return 'boulders: []';
  const lines = boulders.map((b) => [
    `    {`,
    `      pos: { x: ${b.pos.x}, y: ${b.pos.y} },`,
    `      id: "${escapeTSString(b.id)}",`,
    `    },`,
  ].join('\n'));
  return `boulders: [\n${lines.join('\n')}\n  ]`;
}

function serStoreItems(items: string[]): string {
  if (items.length === 0) return 'storeItems: []';
  return `storeItems: [\n${items.map((i) => `    ItemType.${i},`).join('\n')}\n  ]`;
}

function serSpinners(spinners: Record<string, Record<string, DirectionName>>): string {
  const rows = sortedNumKeys(spinners);
  if (rows.length === 0) return 'spinners: {}';
  const rowLines = rows.map((r) => {
    const cols = sortedNumKeys(spinners[String(r)] ?? {});
    const colLines = cols.map((c) => `      ${c}: ${directionToEnum(spinners[String(r)][String(c)])},`);
    return `    ${r}: {\n${colLines.join('\n')}\n    },`;
  });
  return `spinners: {\n${rowLines.join('\n')}\n  }`;
}

function serMaps(maps: Record<string, Record<string, string>>): string {
  const rows = sortedNumKeys(maps);
  if (rows.length === 0) return 'maps: {}';
  const rowLines = rows.map((r) => {
    const cols = sortedNumKeys(maps[String(r)] ?? {});
    const colLines = cols.map((c) => `      ${c}: MapId.${pascalCaseFromMapId(maps[String(r)][String(c)])},`);
    return `    ${r}: {\n${colLines.join('\n')}\n    },`;
  });
  return `maps: {\n${rowLines.join('\n')}\n  }`;
}

function serTeleports(teleports: Record<string, Record<string, { map: string; pos: Pos }>>): string {
  const rows = sortedNumKeys(teleports);
  if (rows.length === 0) return 'teleports: {}';
  const rowLines = rows.map((r) => {
    const cols = sortedNumKeys(teleports[String(r)] ?? {});
    const colLines = cols.map((c) => {
      const t = teleports[String(r)][String(c)];
      return `      ${c}: { map: MapId.${pascalCaseFromMapId(t.map)}, pos: { x: ${t.pos.x}, y: ${t.pos.y} } },`;
    });
    return `    ${r}: {\n${colLines.join('\n')}\n    },`;
  });
  return `teleports: {\n${rowLines.join('\n')}\n  }`;
}

function serTrainers(trainers: TrainerState[]): string {
  if (trainers.length === 0) return 'trainers: []';
  const lines = trainers.map((t) => {
    const pokemon = t.pokemon.map((p) => `{ id: ${p.id}, level: ${p.level} }`).join(', ');
    const intro = t.intro.map((s) => `      "${escapeTSString(s)}"`).join(',\n');
    const outtro = t.outtro.map((s) => `      "${escapeTSString(s)}"`).join(',\n');
    const opts: string[] = [];
    if (t.persistent) opts.push('    persistent: true,');
    if (t.hideCondition) opts.push(`    hideCondition: "${escapeTSString(t.hideCondition)}",`);
    if (t.isOnline) opts.push('    isOnline: true,');
    if (t.isGymLeader) opts.push('    isGymLeader: true,');
    if (t.sightRange !== null && t.sightRange !== undefined) opts.push(`    sightRange: ${t.sightRange},`);
    if (t.postGame) opts.push(`    postGame: ${t.postGame},`);
    const body = [
      `    npc: ${t.npcKey},`,
      `    pokemon: [${pokemon}],`,
      `    facing: ${directionToEnum(t.facing)},`,
      `    pos: { x: ${t.pos.x}, y: ${t.pos.y} },`,
      `    intro: [${intro ? `\n${intro}\n    ` : ''}],`,
      `    outtro: [${outtro ? `\n${outtro}\n    ` : ''}],`,
      `    money: ${t.money},`,
      ...opts,
    ].join('\n');
    return `  {\n${body}\n  }`;
  });
  return `trainers: [\n${lines.join(',\n')}\n  ]`;
}

function serPos(field: string, pos: Pos): string {
  return `${field}: { x: ${pos.x}, y: ${pos.y} }`;
}

// ── Construcción del plan de campos a escribir ──────────────────────────────
// Cada entrada: { field, value | null }.  value=null → eliminar el campo si
// existe (para flags false / posiciones borradas).  undefined en el estado →
// no se incluye en el plan (no se toca).

interface FieldOp { field: string; text: string | null }

function buildFieldOps(state: MapWriteState): FieldOp[] {
  const ops: FieldOp[] = [];
  const push = (field: string, text: string | null) => ops.push({ field, text });

  if (state.name !== undefined) push('name', `name: "${escapeTSString(state.name)}"`);
  if (state.allowBicycle !== undefined) push('allowBicycle', state.allowBicycle ? 'allowBicycle: true' : null);
  if (state.cave !== undefined) push('cave', state.cave ? 'cave: true' : null);
  if (state.dark !== undefined) push('dark', state.dark ? 'dark: true' : null);
  // NOTA: `flyable`/`flySpot` son SOLO del editor (no existen en MapType del
  // juego). NO se escriben al .ts o el juego no compilaría.
  if (state.music !== undefined) push('music', state.music && state.music.trim() ? `music: ${state.music.trim()}` : null);
  if (state.start !== undefined && state.start) push('start', serPos('start', state.start));
  if (state.walls !== undefined) push('walls', serRowColMap(state.walls, 'walls'));
  if (state.fences !== undefined) push('fences', serRowColMap(state.fences, 'fences'));
  if (state.grass !== undefined) push('grass', serRowColMap(state.grass, 'grass'));
  if (state.water !== undefined) push('water', Object.keys(state.water).length ? serRowColMap(state.water, 'water') : null);
  if (state.texts !== undefined) push('text', serTexts(state.texts));
  if (state.textRewards !== undefined) push('textRewards', Object.keys(state.textRewards).length ? serTextRewards(state.textRewards) : null);
  if (state.exits !== undefined) push('exits', serRowColMap(state.exits, 'exits'));
  if (state.maps !== undefined) push('maps', serMaps(state.maps));
  if (state.teleports !== undefined) push('teleports', Object.keys(state.teleports).length ? serTeleports(state.teleports) : null);
  if (state.exitReturnMap !== undefined) push('exitReturnMap', state.exitReturnMap ? `exitReturnMap: MapId.${pascalCaseFromMapId(state.exitReturnMap)}` : null);
  if (state.exitReturnPos !== undefined) push('exitReturnPos', state.exitReturnPos ? serPos('exitReturnPos', state.exitReturnPos) : null);
  if (state.pokemonCenter !== undefined) push('pokemonCenter', state.pokemonCenter ? serPos('pokemonCenter', state.pokemonCenter) : null);
  if (state.pc !== undefined) push('pc', state.pc ? serPos('pc', state.pc) : null);
  if (state.store !== undefined) push('store', state.store ? serPos('store', state.store) : null);
  if (state.recoverLocation !== undefined) push('recoverLocation', state.recoverLocation ? serPos('recoverLocation', state.recoverLocation) : null);
  if (state.onlineBattleNpc !== undefined) push('onlineBattleNpc', state.onlineBattleNpc ? serPos('onlineBattleNpc', state.onlineBattleNpc) : null);
  if (state.storeItems !== undefined) push('storeItems', state.storeItems.length ? serStoreItems(state.storeItems) : null);
  if (state.spinners !== undefined) push('spinners', Object.keys(state.spinners).length ? serSpinners(state.spinners) : null);
  if (state.stoppers !== undefined) push('stoppers', Object.keys(state.stoppers).length ? serRowColMap(state.stoppers, 'stoppers') : null);
  if (state.items !== undefined) push('items', state.items.length ? serItems(state.items) : null);
  if (state.gifts !== undefined) push('gifts', state.gifts.length ? serGifts(state.gifts) : null);
  if (state.staticPokemon !== undefined) push('staticPokemon', state.staticPokemon.length ? serStaticPokemon(state.staticPokemon) : null);
  if (state.cuttableTrees !== undefined) push('cuttableTrees', state.cuttableTrees.length ? serCuttableTrees(state.cuttableTrees) : null);
  if (state.berryTrees !== undefined) push('berryTrees', state.berryTrees.length ? serBerryTrees(state.berryTrees) : null);
  if (state.boulders !== undefined) push('boulders', state.boulders.length ? serBoulders(state.boulders) : null);
  if (state.minimapPos !== undefined) push('minimapPos', state.minimapPos ? serPos('minimapPos', state.minimapPos) : null);
  if (state.trainers !== undefined) push('trainers', serTrainers(state.trainers));

  return ops;
}

// ── Localizador del objeto MapType y de sus campos de nivel superior ────────

function findBalanced(text: string, openIdx: number): { start: number; end: number } | null {
  const open = text[openIdx];
  const close = open === '{' ? '}' : open === '[' ? ']' : '';
  if (!close) return null;
  let depth = 0;
  let inStr: string | null = null;
  for (let i = openIdx; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (c === '\\') { i++; continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return { start: openIdx, end: i }; }
  }
  return null;
}

/** Devuelve [start,end] (índices absolutos en `text`) del literal `{...}` del MapType. */
function findMapObject(text: string): { start: number; end: number } | null {
  const m = text.match(/:\s*MapType\s*=\s*\{/);
  if (!m || m.index === undefined) return null;
  const braceIdx = text.indexOf('{', m.index);
  if (braceIdx === -1) return null;
  return findBalanced(text, braceIdx);
}

/**
 * Localiza los campos de primer nivel dentro del cuerpo del objeto.
 * Devuelve, por nombre, el span [start,end] que cubre desde el inicio del
 * nombre hasta (incluida) la coma final, junto con el indentado de su línea.
 */
function locateTopLevelFields(body: string): Map<string, { start: number; end: number }> {
  const result = new Map<string, { start: number; end: number }>();
  let i = 0;
  let depth = 0;
  let inStr: string | null = null;
  while (i < body.length) {
    const c = body[i];
    if (inStr) {
      if (c === '\\') { i += 2; continue; }
      if (c === inStr) inStr = null;
      i++; continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; i++; continue; }
    if (c === '{' || c === '[' || c === '(') { depth++; i++; continue; }
    if (c === '}' || c === ']' || c === ')') { depth--; i++; continue; }
    if (depth === 0) {
      // Posible inicio de campo: identificador seguido de ':' (normal) o de
      // ',' / '}' (propiedad SHORTHAND, p.ej. `music,`). Reconocer el shorthand
      // es CRÍTICO: si no, se insertaría un campo duplicado al guardar.
      const slice = body.slice(i);
      const fm = slice.match(/^([A-Za-z_$][\w$]*)\s*([:,}])/);
      if (fm) {
        const name = fm[1];
        const sep = fm[2];
        const fieldStart = i;
        if (sep !== ':') {
          // Shorthand: el span va del identificador hasta su coma (si la hay).
          const sepAbs = i + fm[0].length - 1;
          const end = sep === ',' ? sepAbs : sepAbs - 1; // si es '}', no incluirla
          result.set(name, { start: fieldStart, end });
          i = end + 1;
          continue;
        }
        // Campo normal: avanzar hasta la coma de nivel 0 que cierra el valor.
        let j = i + fm[0].length;
        let d = 0;
        let s: string | null = null;
        for (; j < body.length; j++) {
          const cc = body[j];
          if (s) { if (cc === '\\') { j++; continue; } if (cc === s) s = null; continue; }
          if (cc === '"' || cc === "'" || cc === '`') { s = cc; continue; }
          if (cc === '{' || cc === '[' || cc === '(') d++;
          else if (cc === '}' || cc === ']' || cc === ')') d--;
          else if (cc === ',' && d === 0) break;
        }
        // Incluir la coma si existe
        const end = j < body.length && body[j] === ',' ? j : j - 1;
        result.set(name, { start: fieldStart, end });
        i = end + 1;
        continue;
      }
    }
    i++;
  }
  return result;
}

// ── Reconciliación de imports basada en USO real del texto final ────────────

const NPC_IMPORT_PATH = '../app/npcs';
const NPC_EXPORTS = new Set([
  'ash', 'oak', 'rival', 'beauty', 'birdKeeper', 'blackBelt', 'bugCatcher', 'burglar',
  'channeler', 'aceTrainerMale', 'aceTrainerFemale', 'cueBall', 'engineer', 'fisher',
  'gambler', 'gentleman', 'hiker', 'jrTrainerMale', 'jrTrainerFemale', 'juggler', 'lass',
  'pokeManiac', 'psychic', 'rocker', 'teamRocketGrunt', 'sailor', 'scientist', 'superNerd',
  'swimmer', 'tamer', 'youngster', 'biker', 'brock', 'misty', 'ltSurge', 'erica', 'koga',
  'sabrina', 'blaine', 'giovanni', 'sergioNpc', 'martaNpc',
]);

/** Escanea los `npc:` usados dentro del bloque trainers del texto. */
function usedNpcKeys(fileText: string): string[] {
  const used = new Set<string>();
  const re = /\bnpc\s*:\s*([A-Za-z_$][\w$]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(fileText)) !== null) {
    if (NPC_EXPORTS.has(m[1])) used.add(m[1]);
  }
  return [...used].sort();
}

function hasImportFrom(fileText: string, path: string): boolean {
  return new RegExp(`from\\s+["']${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(fileText);
}

/**
 * Garantiza el bloque de imports correcto según el uso real. NUNCA elimina
 * imports de cosas que no controla (imagen, música, getEncounterData). Solo:
 *  - Reescribe la línea de import de npcs para que coincida exactamente con los
 *    npc usados (o la elimina si no se usa ninguno).
 *  - Añade Direction / ItemType / MapId+MapType si se usan y faltan.
 */
function reconcileImports(fileText: string): string {
  let text = fileText;

  // 1) npcs: línea derivada del uso.
  const npcs = usedNpcKeys(text);
  const npcImportRe = /^import\s*\{[^}]*\}\s*from\s*["']\.\.\/app\/npcs["'];?\s*$/m;
  const npcLine = npcs.length ? `import { ${npcs.join(', ')} } from "${NPC_IMPORT_PATH}";` : '';
  if (npcImportRe.test(text)) {
    text = text.replace(npcImportRe, npcLine || ' REMOVE ');
    text = text.replace(/ REMOVE \n?/, '');
  } else if (npcLine) {
    text = insertImportAfterFirst(text, npcLine);
  }

  // 2) Direction
  if (/\bDirection\./.test(text) && !hasImportFrom(text, '../state/state-types')) {
    text = insertImportAfterFirst(text, 'import { Direction } from "../state/state-types";');
  }
  // 3) ItemType
  if (/\bItemType\./.test(text) && !hasImportFrom(text, '../app/use-item-data')) {
    text = insertImportAfterFirst(text, 'import { ItemType } from "../app/use-item-data";');
  }
  // 4) MapId / MapType (siempre presentes en un mapa; defensa)
  if (/\bMapId\.|:\s*MapType\b/.test(text) && !hasImportFrom(text, './map-types')) {
    text = insertImportAfterFirst(text, 'import { MapId, MapType } from "./map-types";');
  } else if (/\bMapId\./.test(text)) {
    // Asegurar que MapId está en el named import de ./map-types
    const mtRe = /import\s*\{([^}]*)\}\s*from\s*["']\.\/map-types["'];?/;
    const mm = text.match(mtRe);
    if (mm && !/\bMapId\b/.test(mm[1])) {
      const names = mm[1].split(',').map((s) => s.trim()).filter(Boolean);
      if (!names.includes('MapId')) names.unshift('MapId');
      text = text.replace(mtRe, `import { ${names.join(', ')} } from "./map-types";`);
    }
  }

  return text;
}

/** Inserta una línea de import justo tras el último import existente al principio del archivo. */
function insertImportAfterFirst(text: string, importLine: string): string {
  const importRe = /^import .*$/gm;
  let lastEnd = -1;
  let m: RegExpExecArray | null;
  while ((m = importRe.exec(text)) !== null) {
    // Solo considerar el bloque de imports contiguo del inicio.
    if (m.index > lastEnd + 2 && lastEnd !== -1) break;
    lastEnd = m.index + m[0].length;
  }
  if (lastEnd === -1) return `${importLine}\n${text}`;
  return `${text.slice(0, lastEnd)}\n${importLine}${text.slice(lastEnd)}`;
}

// ── API principal ───────────────────────────────────────────────────────────

export interface WriteResult {
  ok: boolean;
  text?: string;
  error?: string;
  warnings: string[];
}

/**
 * Reescribe `fileText` aplicando `state`. Quirúrgico: solo toca los campos
 * presentes en `state`; conserva el resto del archivo. Reconcilia imports.
 */
export function writeMapTs(fileText: string, state: MapWriteState): WriteResult {
  const warnings: string[] = [];
  const obj = findMapObject(fileText);
  if (!obj) {
    return { ok: false, error: 'No se encontró el literal `: MapType = { ... }` en el archivo.', warnings };
  }
  // Cuerpo del objeto SIN las llaves externas.
  const bodyStart = obj.start + 1;
  const bodyEnd = obj.end; // índice de la '}' de cierre
  const body = fileText.slice(bodyStart, bodyEnd);

  const fields = locateTopLevelFields(body);
  const ops = buildFieldOps(state);

  // Construimos el nuevo cuerpo aplicando reemplazos de mayor a menor índice.
  type Edit = { start: number; end: number; replacement: string };
  const edits: Edit[] = [];
  const inserts: string[] = [];

  for (const op of ops) {
    const span = fields.get(op.field);
    if (op.text === null) {
      // Eliminar campo si existe.
      if (span) edits.push({ start: span.start, end: span.end, replacement: ' DEL ' });
      continue;
    }
    const replacement = `${op.text},`; // coma de campo
    if (span) {
      edits.push({ start: span.start, end: span.end, replacement });
    } else {
      inserts.push(replacement);
    }
  }

  // Aplicar reemplazos (de atrás hacia delante para no descuadrar índices).
  edits.sort((a, b) => b.start - a.start);
  let newBody = body;
  for (const e of edits) {
    newBody = newBody.slice(0, e.start) + e.replacement + newBody.slice(e.end + 1);
  }
  // Limpiar marcadores de borrado dejando indentación/lineas limpias.
  newBody = newBody.replace(/[ \t]* DEL \n?/g, '');

  // Insertar campos nuevos justo antes del cierre del cuerpo (con indentación 2).
  if (inserts.length) {
    const trimmedRight = newBody.replace(/\s*$/, '');
    const block = inserts.map((s) => `  ${s}`).join('\n');
    newBody = `${trimmedRight}\n${block}\n`;
  }

  let result = fileText.slice(0, bodyStart) + newBody + fileText.slice(bodyEnd);

  // Reconciliar imports según el USO real del texto final.
  result = reconcileImports(result);

  // Validación de seguridad: el archivo debe seguir teniendo balance de llaves
  // y un export default.
  if (!/export default /.test(result)) {
    return { ok: false, error: 'El resultado no contiene `export default` — abortado por seguridad.', warnings };
  }
  const reobj = findMapObject(result);
  if (!reobj) {
    return { ok: false, error: 'El objeto MapType quedó malformado tras la escritura — abortado.', warnings };
  }

  return { ok: true, text: result, warnings };
}
