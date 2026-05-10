// Parser cliente de archivos .ts de mapas (`game-src/src/maps/*.ts`).
// Port directo de scripts/setup-editor.mjs — extrae walls, fences, grass,
// texts, items, gifts, trainers y spots con expresiones regulares y
// balanceo de llaves/corchetes. NO ejecuta el TS, solo lo parsea.

export interface ParsedTrainer {
  npcKey: string;
  pos: { x: number; y: number };
  facing: 'down' | 'up' | 'left' | 'right';
  money: number;
  persistent: boolean;
  isOnline: boolean;
  hideCondition: string | null;
  sightRange: number | null;
  intro: string[];
  outtro: string[];
  pokemon: { id: number; level: number }[];
  postGame: string | null;
}

export interface ParsedItem {
  itemKey: string;
  pos: { x: number; y: number };
  hidden?: boolean;
}

export interface ParsedGift {
  pokemonId: number;
  level: number;
  pos: { x: number; y: number };
  questId: string;
}

export interface ParsedMap {
  walls: Record<string, number[]>;
  fences: Record<string, number[]>;
  grass: Record<string, number[]>;
  texts: Record<string, Record<string, string[]>>;
  items: ParsedItem[];
  gifts: ParsedGift[];
  trainers: ParsedTrainer[];
  pokemonCenter: { x: number; y: number } | null;
  pc: { x: number; y: number } | null;
  store: { x: number; y: number } | null;
  recoverLocation: { x: number; y: number } | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function findBalancedBlock(
  text: string,
  openIdx: number,
  openChar = '{',
  closeChar = '}',
): { start: number; end: number; text: string } | null {
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    if (text[i] === openChar) depth++;
    else if (text[i] === closeChar) {
      depth--;
      if (depth === 0) return { start: openIdx, end: i, text: text.slice(openIdx, i + 1) };
    }
  }
  return null;
}

function parseRowColMap(tsText: string, key: string): Record<string, number[]> {
  const m = tsText.match(new RegExp(`${key}\\s*:\\s*\\{`));
  if (!m || m.index === undefined) return {};
  const start = tsText.indexOf('{', m.index + m[0].length - 1);
  const blk = findBalancedBlock(tsText, start);
  if (!blk) return {};
  let block = blk.text;
  block = block.replace(/\/\/[^\n]*/g, '');
  block = block.replace(/\/\*[\s\S]*?\*\//g, '');
  block = block.replace(/([\s,{])(-?\d+)\s*:/g, '$1"$2":');
  block = block.replace(/,(\s*[}\]])/g, '$1');
  try {
    const parsed = JSON.parse(block) as Record<string, unknown>;
    const result: Record<string, number[]> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (Array.isArray(v) && v.every((n) => typeof n === 'number')) {
        result[k] = v as number[];
      }
    }
    return result;
  } catch {
    return {};
  }
}

function parsePos(tsText: string, key: string): { x: number; y: number } | null {
  const re = new RegExp(`(?<![\\w])${key}\\s*:\\s*\\{\\s*x\\s*:\\s*(\\d+)\\s*,\\s*y\\s*:\\s*(\\d+)\\s*,?\\s*\\}`);
  const m = tsText.match(re);
  if (!m) return null;
  return { x: parseInt(m[1], 10), y: parseInt(m[2], 10) };
}

function parseTextField(tsText: string): Record<string, Record<string, string[]>> {
  const m = tsText.match(/(?<![\w])text\s*:\s*\{/);
  if (!m || m.index === undefined) return {};
  const blockStart = tsText.indexOf('{', m.index + m[0].length - 1);
  const blk = findBalancedBlock(tsText, blockStart);
  if (!blk) return {};

  const result: Record<string, Record<string, string[]>> = {};
  const inner = blk.text.slice(1, -1);
  let i = 0;
  while (i < inner.length) {
    while (i < inner.length && /\s|,/.test(inner[i])) i++;
    if (i >= inner.length) break;
    const numMatch = inner.slice(i).match(/^(-?\d+)\s*:\s*\{/);
    if (!numMatch) {
      i++;
      continue;
    }
    const rowKey = numMatch[1];
    i += numMatch[0].length - 1;
    const subBlk = findBalancedBlock(inner, i);
    if (!subBlk) break;

    const rowInner = subBlk.text.slice(1, -1);
    const cols: Record<string, string[]> = {};
    let j = 0;
    while (j < rowInner.length) {
      while (j < rowInner.length && /\s|,/.test(rowInner[j])) j++;
      if (j >= rowInner.length) break;
      const colMatch = rowInner.slice(j).match(/^(-?\d+)\s*:\s*\[/);
      if (!colMatch) {
        j++;
        continue;
      }
      const colKey = colMatch[1];
      j += colMatch[0].length - 1;
      const arrBlk = findBalancedBlock(rowInner, j, '[', ']');
      if (!arrBlk) break;
      const arrInner = arrBlk.text.slice(1, -1);
      const strings: string[] = [];
      const reStr = /"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'/g;
      let sm: RegExpExecArray | null;
      while ((sm = reStr.exec(arrInner)) !== null) {
        const raw = sm[1] ?? sm[2] ?? '';
        const decoded = raw
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .replace(/\\\\/g, '\\')
          .replace(/\\n/g, '\n');
        strings.push(decoded);
      }
      cols[colKey] = strings;
      j = arrBlk.end + 1;
    }
    result[rowKey] = cols;
    i = subBlk.end + 1;
  }
  return result;
}

function parseItemsField(tsText: string): ParsedItem[] {
  const m = tsText.match(/(?<![\w])items\s*:\s*\[/);
  if (!m || m.index === undefined) return [];
  const arrStart = tsText.indexOf('[', m.index + m[0].length - 1);
  const arrBlk = findBalancedBlock(tsText, arrStart, '[', ']');
  if (!arrBlk) return [];

  const inner = arrBlk.text.slice(1, -1);
  const result: ParsedItem[] = [];
  let i = 0;
  while (i < inner.length) {
    while (i < inner.length && /\s|,/.test(inner[i])) i++;
    if (i >= inner.length) break;
    if (inner[i] !== '{') {
      i++;
      continue;
    }
    const objBlk = findBalancedBlock(inner, i);
    if (!objBlk) break;
    const objText = objBlk.text;

    const itemM = objText.match(/item\s*:\s*ItemType\.(\w+)/);
    const posStartM = objText.match(/pos\s*:\s*\{/);
    const hidden = /hidden\s*:\s*true/.test(objText);

    let pos: { x: number; y: number } | null = null;
    if (posStartM && posStartM.index !== undefined) {
      const posOpenIdx = objText.indexOf('{', posStartM.index + posStartM[0].length - 1);
      const posBlk = findBalancedBlock(objText, posOpenIdx);
      if (posBlk) {
        const xm = posBlk.text.match(/x\s*:\s*(\d+)/);
        const ym = posBlk.text.match(/y\s*:\s*(\d+)/);
        if (xm && ym) pos = { x: parseInt(xm[1], 10), y: parseInt(ym[1], 10) };
      }
    }

    if (itemM && pos) {
      result.push({
        itemKey: itemM[1],
        pos,
        ...(hidden ? { hidden: true } : {}),
      });
    }
    i = objBlk.end + 1;
  }
  return result;
}

function parseGiftsField(tsText: string): ParsedGift[] {
  const m = tsText.match(/(?<![\w])gifts\s*:\s*\[/);
  if (!m || m.index === undefined) return [];
  const arrStart = tsText.indexOf('[', m.index + m[0].length - 1);
  const arrBlk = findBalancedBlock(tsText, arrStart, '[', ']');
  if (!arrBlk) return [];
  const inner = arrBlk.text.slice(1, -1);
  const result: ParsedGift[] = [];
  let i = 0;
  while (i < inner.length) {
    while (i < inner.length && /\s|,/.test(inner[i])) i++;
    if (i >= inner.length) break;
    if (inner[i] !== '{') {
      i++;
      continue;
    }
    const objBlk = findBalancedBlock(inner, i);
    if (!objBlk) break;
    const t = objBlk.text;
    const pid = t.match(/pokemonId\s*:\s*(\d+)/);
    const lvl = t.match(/level\s*:\s*(\d+)/);
    const qid = t.match(/questId\s*:\s*"([^"]+)"/);

    let pos: { x: number; y: number } | null = null;
    const posStartM = t.match(/pos\s*:\s*\{/);
    if (posStartM && posStartM.index !== undefined) {
      const posOpenIdx = t.indexOf('{', posStartM.index + posStartM[0].length - 1);
      const posBlk = findBalancedBlock(t, posOpenIdx);
      if (posBlk) {
        const xm = posBlk.text.match(/x\s*:\s*(\d+)/);
        const ym = posBlk.text.match(/y\s*:\s*(\d+)/);
        if (xm && ym) pos = { x: parseInt(xm[1], 10), y: parseInt(ym[1], 10) };
      }
    }

    if (pid && lvl && pos && qid) {
      result.push({
        pokemonId: parseInt(pid[1], 10),
        level: parseInt(lvl[1], 10),
        pos,
        questId: qid[1],
      });
    }
    i = objBlk.end + 1;
  }
  return result;
}

function parseStringArray(text: string, key: string): string[] {
  const keyMatch = text.match(new RegExp(`${key}\\s*:\\s*\\[`));
  if (!keyMatch || keyMatch.index === undefined) return [];
  const startIdx = text.indexOf('[', keyMatch.index + keyMatch[0].length - 1);
  const blk = findBalancedBlock(text, startIdx, '[', ']');
  if (!blk) return [];
  const inner = blk.text.slice(1, -1);
  const strings: string[] = [];
  // Soporta " o ' y escapes básicos
  const re = /"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(inner)) !== null) {
    const raw = m[1] ?? m[2] ?? '';
    const decoded = raw
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, '\\')
      .replace(/\\n/g, '\n');
    strings.push(decoded);
  }
  return strings;
}

function parsePokemonArray(text: string): { id: number; level: number }[] {
  // Buscar el array `pokemon: [ ... ]` específicamente para no capturar
  // otros { id, level } que pudieran existir (p.ej. dentro de postGame).
  const keyM = text.match(/(?<![\w])pokemon\s*:\s*\[/);
  if (!keyM || keyM.index === undefined) return [];
  const startIdx = text.indexOf('[', keyM.index + keyM[0].length - 1);
  const blk = findBalancedBlock(text, startIdx, '[', ']');
  if (!blk) return [];
  const re = /\{\s*id\s*:\s*(\d+)\s*,\s*level\s*:\s*(\d+)\s*\}/g;
  const result: { id: number; level: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(blk.text)) !== null) {
    result.push({ id: parseInt(m[1], 10), level: parseInt(m[2], 10) });
  }
  return result;
}

function parseTrainerObject(text: string): ParsedTrainer | null {
  try {
    const npcM = text.match(/(?<![\w])npc\s*:\s*(\w+)/);
    const npcKey = npcM ? npcM[1] : 'youngster';

    const posM = text.match(/(?<![\w])pos\s*:\s*\{\s*x\s*:\s*(\d+)\s*,\s*y\s*:\s*(\d+)\s*\}/);
    const pos = posM ? { x: parseInt(posM[1], 10), y: parseInt(posM[2], 10) } : { x: 0, y: 0 };

    const facingM = text.match(/(?<![\w])facing\s*:\s*Direction\.(\w+)/);
    const facingRaw = facingM ? facingM[1].toLowerCase() : 'down';
    const facing = (['down', 'up', 'left', 'right'] as const).includes(
      facingRaw as 'down' | 'up' | 'left' | 'right',
    )
      ? (facingRaw as 'down' | 'up' | 'left' | 'right')
      : 'down';

    const moneyM = text.match(/(?<![\w])money\s*:\s*(\d+)/);
    const money = moneyM ? parseInt(moneyM[1], 10) : 0;

    const persistent = /(?<![\w])persistent\s*:\s*true/.test(text);
    const isOnline = /(?<![\w])isOnline\s*:\s*true/.test(text);
    const hideM = text.match(/(?<![\w])hideCondition\s*:\s*"([^"]+)"/);
    const hideCondition = hideM ? hideM[1] : null;
    const sightM = text.match(/(?<![\w])sightRange\s*:\s*(\d+)/);
    const sightRange = sightM ? parseInt(sightM[1], 10) : null;

    const intro = parseStringArray(text, 'intro');
    const outtro = parseStringArray(text, 'outtro');
    const pokemon = parsePokemonArray(text);

    let postGame: string | null = null;
    const postGameM = text.match(/(?<![\w])postGame\s*:/);
    if (postGameM && postGameM.index !== undefined) {
      const start = text.indexOf('{', postGameM.index + postGameM[0].length);
      if (start !== -1) {
        const blk = findBalancedBlock(text, start);
        if (blk) postGame = blk.text.trim();
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
      sightRange,
      intro,
      outtro,
      pokemon,
      postGame,
    };
  } catch {
    return null;
  }
}

function parseTrainers(tsText: string): ParsedTrainer[] {
  const trainersMatch = tsText.match(/(?<![\w])trainers\s*:\s*\[/);
  if (!trainersMatch || trainersMatch.index === undefined) return [];
  const startIdx = tsText.indexOf('[', trainersMatch.index + trainersMatch[0].length - 1);
  if (startIdx === -1) return [];
  const blk = findBalancedBlock(tsText, startIdx, '[', ']');
  if (!blk) return [];

  const block = blk.text.slice(1, -1);
  const trainers: ParsedTrainer[] = [];
  let objDepth = 0;
  let objStart = -1;

  for (let i = 0; i < block.length; i++) {
    if (block[i] === '{') {
      if (objDepth === 0) objStart = i;
      objDepth++;
    } else if (block[i] === '}') {
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

// ── API pública ──────────────────────────────────────────────────────────

export function parseMapTS(tsText: string): ParsedMap {
  return {
    walls: parseRowColMap(tsText, 'walls'),
    fences: parseRowColMap(tsText, 'fences'),
    grass: parseRowColMap(tsText, 'grass'),
    texts: parseTextField(tsText),
    items: parseItemsField(tsText),
    gifts: parseGiftsField(tsText),
    trainers: parseTrainers(tsText),
    pokemonCenter: parsePos(tsText, 'pokemonCenter'),
    pc: parsePos(tsText, 'pc'),
    store: parsePos(tsText, 'store'),
    recoverLocation: parsePos(tsText, 'recoverLocation'),
  };
}
