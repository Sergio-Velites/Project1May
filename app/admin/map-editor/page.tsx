'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

// ── Tipos ─────────────────────────────────────────────────────────────────

interface Pokemon { id: number; level: number; }

interface Trainer {
  npcKey: string;
  pos: { x: number; y: number };
  facing: 'down' | 'up' | 'left' | 'right';
  money: number;
  persistent: boolean;
  isOnline: boolean;
  hideCondition: string | null;
  intro: string[];
  outtro: string[];
  pokemon: Pokemon[];
  // Raw TypeScript text preservado del fuente (ej: ItemType.BoulderBadge).
  // El editor no edita este campo — solo lo preserva y lo re-emite en el export.
  postGame?: string | null;
}

interface MapEntry {
  id: string;
  name: string;
  imageFile: string;
  height: number;
  width: number;
  trainers: Trainer[];
  walls: Record<string, number[]>;
  sourceFile: string;
}

type MapData = Record<string, MapEntry>;

type EditMode = 'npc' | 'walls';

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

function exportTS(trainers: Trainer[], mapId: string): string {
  const lines = trainers.map((t) => {
    const npc = t.npcKey;
    const pokemon = t.pokemon.map((p) => `{ id: ${p.id}, level: ${p.level} }`).join(', ');
    const intro = t.intro.map((s) => `    "${s.replace(/"/g, '\\"')}"`).join(',\n');
    const outtro = t.outtro.map((s) => `    "${s.replace(/"/g, '\\"')}"`).join(',\n');
    const opts: string[] = [];
    if (t.persistent) opts.push('  persistent: true,');
    if (t.hideCondition) opts.push(`  hideCondition: "${t.hideCondition}",`);
    if (t.isOnline) opts.push('  isOnline: true,');
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
  return `// Trainers para "${mapId}"\ntrainers: [\n${lines.join(',\n')}\n],`;
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

// ── Constantes UI ─────────────────────────────────────────────────────────

const ZOOM_LEVELS = [16, 24, 32, 48];

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

  const dragging = useRef<{ idx: number; startX: number; startY: number } | null>(null);
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
          setTrainers(data[first].trainers ?? []);
          setWalls(data[first].walls ?? {});
        }
      })
      .catch(() => setError('No se pudo cargar map-data.json. Ejecuta: npm run editor:setup'));
  }, []);

  // ── Cambiar mapa ──────────────────────────────────────────────────────
  function selectMap(id: string) {
    setSelectedMapId(id);
    setTrainers(mapData[id]?.trainers ?? []);
    setWalls(mapData[id]?.walls ?? {});
    setSelectedIdx(null);
    setDirty(false);
  }

  // ── Guardar ───────────────────────────────────────────────────────────
  async function save() {
    setSaving(true);
    try {
      await fetch('/api/admin/map-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapId: selectedMapId, trainers, walls }),
      });
      setDirty(false);
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 1500);
      // Actualizar cache local
      setMapData((d) => ({
        ...d,
        [selectedMapId]: { ...d[selectedMapId], trainers, walls },
      }));
    } finally {
      setSaving(false);
    }
  }

  // ── Exportar TS (trainers) ────────────────────────────────────────────
  function doExport() {
    const ts = exportTS(trainers, selectedMapId);
    navigator.clipboard.writeText(ts).then(() => alert('¡Trainers copiados! Pega el bloque trainers: [...] en el .ts.'));
  }

  // ── Exportar TS (walls) ───────────────────────────────────────────────
  function doExportWalls() {
    const ts = exportWallsTS(walls);
    navigator.clipboard.writeText(ts).then(() => alert('¡Walls copiadas! Pega el bloque walls: { ... } en el .ts (sustituyendo el bloque walls existente).'));
  }

  // ── Añadir NPC ────────────────────────────────────────────────────────
  function addNpc() {
    const newT: Trainer = {
      npcKey: 'youngster',
      pos: { x: 0, y: 0 },
      facing: 'down',
      money: 0,
      persistent: false,
      isOnline: false,
      hideCondition: null,
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

  // ── Walls ──────────────────────────────────────────────────────────────
  // hasWall: helper de lectura. setWallAt: helper de escritura inmutable.
  function setWallAt(
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

  function hasWall(src: Record<string, number[]>, x: number, y: number) {
    return (src[String(y)] ?? []).includes(x);
  }

  // ── Actualizar campo del NPC seleccionado ───────────────────────────────
  function updateSelected(patch: Partial<Trainer>) {
    if (selectedIdx === null) return;
    const next = trainers.map((t, i) => (i === selectedIdx ? { ...t, ...patch } : t));
    setTrainers(next);
    setDirty(true);
  }

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
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scrollLeft = canvas.parentElement?.scrollLeft ?? 0;
      const scrollTop = canvas.parentElement?.scrollTop ?? 0;
      const relX = e.clientX - rect.left + scrollLeft;
      const relY = e.clientY - rect.top + scrollTop;
      const tileX = Math.max(0, Math.min(Math.floor(relX / zoom), (currentMap?.width ?? 20) - 1));
      const tileY = Math.max(0, Math.min(Math.floor(relY / zoom), (currentMap?.height ?? 20) - 1));

      // Walls paint en arrastre
      if (editMode === 'walls' && wallPaint.current?.active) {
        const paint = wallPaint.current;
        const k = `${tileX},${tileY}`;
        if (!paint.visited.has(k)) {
          paint.visited.add(k);
          setWalls((prev) => setWallAt(prev, tileX, tileY, paint.mode === 'add'));
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
    [zoom, currentMap, editMode]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = null;
    wallPaint.current = null;
  }, []);

  // ── Click en canvas ────────────────────────────────────────────────────────
  function tileFromEvent(e: React.MouseEvent | React.PointerEvent): { x: number; y: number } | null {
    if (!canvasRef.current) return null;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scrollLeft = canvas.parentElement?.scrollLeft ?? 0;
    const scrollTop = canvas.parentElement?.scrollTop ?? 0;
    const relX = e.clientX - rect.left + scrollLeft;
    const relY = e.clientY - rect.top + scrollTop;
    return {
      x: Math.floor(relX / zoom),
      y: Math.floor(relY / zoom),
    };
  }

  // En modo walls: pointerdown en canvas inicia pintura.
  function onCanvasPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (editMode !== 'walls') return;
    const tile = tileFromEvent(e);
    if (!tile) return;
    if (
      tile.x < 0 || tile.y < 0 ||
      tile.x >= (currentMap?.width ?? 0) ||
      tile.y >= (currentMap?.height ?? 0)
    ) return;
    const currentlyOn = hasWall(walls, tile.x, tile.y);
    const mode: 'add' | 'remove' = currentlyOn ? 'remove' : 'add';
    wallPaint.current = { active: true, mode, visited: new Set([`${tile.x},${tile.y}`]) };
    setWalls((prev) => setWallAt(prev, tile.x, tile.y, mode === 'add'));
    setDirty(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (editMode !== 'npc') return;
    const tile = tileFromEvent(e);
    if (!tile) return;
    const hitIdx = trainers.findIndex((t) => t.pos.x === tile.x && t.pos.y === tile.y);
    if (hitIdx >= 0) {
      setSelectedIdx(hitIdx);
    } else {
      setSelectedIdx(null);
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', height: 52, background: '#13132a', borderBottom: '1px solid #2a2a4a', flexShrink: 0, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#a0a0ff', marginRight: 4 }}>🗺️ Map Editor</span>

        {/* Selector de mapa */}
        <select
          value={selectedMapId}
          onChange={(e) => selectMap(e.target.value)}
          style={{ ...inputStyle, width: 220, height: 30 }}
        >
          {Object.values(mapData).map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        {/* Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#666', fontSize: 12 }}>Zoom</span>
          {ZOOM_LEVELS.map((z) => (
            <button key={z} onClick={() => setZoom(z)} style={{ padding: '2px 8px', fontSize: 12, background: zoom === z ? '#5050b0' : '#1a1a3a', border: '1px solid #3a3a5a', borderRadius: 4, color: '#e0e0ff', cursor: 'pointer' }}>
              {z}
            </button>
          ))}
        </div>

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

        {/* Modo edición */}
        <div style={{ display: 'flex', gap: 0, border: '1px solid #3a3a5a', borderRadius: 4, overflow: 'hidden' }}>
          {(['npc', 'walls'] as EditMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setEditMode(m)}
              style={{
                padding: '4px 10px',
                background: editMode === m ? (m === 'walls' ? '#7a3030' : '#5050b0') : '#1a1a3a',
                border: 'none',
                color: editMode === m ? '#fff' : '#888',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {m === 'npc' ? 'NPCs' : 'Walls'}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Leyenda */}
        <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
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

        {/* Exportar TS */}
        <button onClick={doExport} style={{ padding: '4px 12px', background: '#1a2a3a', border: '1px solid #3a5a7a', borderRadius: 4, color: '#88ccff', cursor: 'pointer', fontSize: 13 }}>
          📋 Export Trainers
        </button>

        {/* Exportar Walls */}
        <button onClick={doExportWalls} style={{ padding: '4px 12px', background: '#2a1a1a', border: '1px solid #7a3a3a', borderRadius: 4, color: '#ff8888', cursor: 'pointer', fontSize: 13 }}>
          🧱 Export Walls
        </button>

        {/* Logout */}
        <button onClick={() => { document.cookie = 'admin_token=; Max-Age=0; path=/'; window.location.href = '/admin/login'; }} style={{ padding: '4px 8px', background: 'none', border: '1px solid #3a3a5a', borderRadius: 4, color: '#666', cursor: 'pointer', fontSize: 12 }}>
          ×
        </button>
      </div>

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
                      // En modo walls los NPCs no capturan clicks: el canvas
                      // recibe pointerdown directo y se pinta el wall debajo.
                      pointerEvents: editMode === 'walls' ? 'none' : 'auto',
                      opacity: editMode === 'walls' ? 0.6 : 1,
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
        <div style={{ width: 320, background: '#13132a', borderLeft: '1px solid #2a2a4a', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>

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
              <div style={{ color: '#ccc', fontSize: 13, lineHeight: 1.6 }}>
                <div style={{ fontSize: 32, marginBottom: 8, textAlign: 'center' }}>🧱</div>
                <p style={{ color: '#ff8888', fontWeight: 700, marginBottom: 12 }}>Modo Walls activo</p>
                <ul style={{ paddingLeft: 18, color: '#aaa', fontSize: 12 }}>
                  <li>Click izquierdo: añadir/quitar pared</li>
                  <li>Arrastra para pintar varias casillas</li>
                  <li>El primer click decide si añade o quita</li>
                </ul>
                <div style={{ marginTop: 16, padding: 12, background: '#1a1530', border: '1px solid #5a3a3a', borderRadius: 4, fontSize: 11, color: '#ff9999' }}>
                  ⚠️ Al guardar se persisten en Supabase. Para que el juego use estos walls debes pegar el bloque
                  exportado <code>walls: {'{'}...{'}'}</code> en el archivo <code>{currentMap?.sourceFile ?? '*.ts'}</code> del juego.
                </div>
                <div style={{ marginTop: 12, fontSize: 11, color: '#777' }}>
                  Total walls: <span style={{ color: '#ff8888', fontWeight: 700 }}>{Object.values(walls).reduce((a, b) => a + b.length, 0)}</span>
                </div>
              </div>
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
            {p.id > 0 && p.id <= 151 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/editor/pokemon/${p.id}.png`} alt={`#${p.id}`} title={`#${p.id}`}
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
      <div style={sectionStyle}>
        <label style={labelStyle}>Hide Condition</label>
        <select value={trainer.hideCondition ?? ''} onChange={(e) => onChange({ hideCondition: e.target.value || null })} style={{ ...inputStyle, height: 30 }}>
          <option value="">— ninguna —</option>
          <option value="has-pokemon">has-pokemon</option>
        </select>
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
