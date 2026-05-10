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
}

interface MapEntry {
  id: string;
  name: string;
  imageFile: string;
  height: number;
  width: number;
  trainers: Trainer[];
  sourceFile: string;
}

type MapData = Record<string, MapEntry>;

// ── NPC Registry ──────────────────────────────────────────────────────────

const NPC_REGISTRY: Record<string, { label: string; sprite: string }> = {
  ash:             { label: 'Ash',           sprite: 'ash' },
  oak:             { label: 'Oak',           sprite: 'oak' },
  rival:           { label: 'Rival',         sprite: 'red' },
  beauty:          { label: 'Beauty',        sprite: 'ad'  },
  birdKeeper:      { label: 'Bird Keeper',   sprite: 'g'   },
  blackBelt:       { label: 'Black Belt',    sprite: 'u'   },
  bugCatcher:      { label: 'Bug Catcher',   sprite: 'f'   },
  burglar:         { label: 'Burglar',       sprite: 'q'   },
  channeler:       { label: 'Channeler',     sprite: 'al'  },
  aceTrainerMale:  { label: 'Ace Trainer ♂', sprite: 'g'   },
  aceTrainerFemale:{ label: 'Ace Trainer ♀', sprite: 'l'   },
  cueBall:         { label: 'Cue Ball',      sprite: 'ao'  },
  engineer:        { label: 'Engineer',      sprite: 'q'   },
  fisher:          { label: 'Fisher',        sprite: 'd'   },
  gambler:         { label: 'Gambler',       sprite: 'o'   },
  gentleman:       { label: 'Gentleman',     sprite: 'h'   },
  hiker:           { label: 'Hiker',         sprite: 'u'   },
  jrTrainerMale:   { label: 'Jr Trainer ♂',  sprite: 'g'   },
  jrTrainerFemale: { label: 'Jr Trainer ♀',  sprite: 'l'   },
  juggler:         { label: 'Juggler',       sprite: 'ai'  },
  lass:            { label: 'Lass',          sprite: 'l'   },
  pokeManiac:      { label: 'Poke Maniac',   sprite: 'q'   },
  psychic:         { label: 'Psychic',       sprite: 'f'   },
  rocker:          { label: 'Rocker',        sprite: 'r'   },
  teamRocketGrunt: { label: 'Team Rocket',   sprite: 'at'  },
  sailor:          { label: 'Sailor',        sprite: 'b'   },
  scientist:       { label: 'Scientist',     sprite: 'n'   },
  superNerd:       { label: 'Super Nerd',    sprite: 'q'   },
  swimmer:         { label: 'Swimmer',       sprite: 'av'  },
  tamer:           { label: 'Tamer',         sprite: 'u'   },
  youngster:       { label: 'Youngster',     sprite: 'b'   },
  biker:           { label: 'Biker',         sprite: 'aw'  },
  brock:           { label: 'Brock',         sprite: 'a'   },
  misty:           { label: 'Misty',         sprite: 'aa'  },
  ltSurge:         { label: 'Lt. Surge',     sprite: 'ac'  },
  erica:           { label: 'Erica',         sprite: 'l'   },
  koga:            { label: 'Koga',          sprite: 'h'   },
  sabrina:         { label: 'Sabrina',       sprite: 'l'   },
  blaine:          { label: 'Blaine',        sprite: 'h'   },
  giovanni:        { label: 'Giovanni',      sprite: 'h'   },
  sergioNpc:       { label: 'Sergio',        sprite: 'g'   },
  martaNpc:        { label: 'Marta',         sprite: 'l'   },
};

function spriteUrl(npcKey: string, facing: string) {
  const reg = NPC_REGISTRY[npcKey];
  const prefix = reg?.sprite ?? 'b';
  return `/editor/sprites/${prefix}-${facing}.png`;
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
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [zoom, setZoom] = useState(32);
  const [showGrid, setShowGrid] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [error, setError] = useState('');

  const dragging = useRef<{ idx: number; startX: number; startY: number } | null>(null);
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
        }
      })
      .catch(() => setError('No se pudo cargar map-data.json. Ejecuta: npm run editor:setup'));
  }, []);

  // ── Cambiar mapa ──────────────────────────────────────────────────────
  function selectMap(id: string) {
    setSelectedMapId(id);
    setTrainers(mapData[id]?.trainers ?? []);
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
        body: JSON.stringify({ mapId: selectedMapId, trainers }),
      });
      setDirty(false);
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 1500);
      // Actualizar cache local
      setMapData((d) => ({ ...d, [selectedMapId]: { ...d[selectedMapId], trainers } }));
    } finally {
      setSaving(false);
    }
  }

  // ── Exportar TS ───────────────────────────────────────────────────────
  function doExport() {
    const ts = exportTS(trainers, selectedMapId);
    navigator.clipboard.writeText(ts).then(() => alert('¡Copiado al clipboard! Pégalo en el archivo .ts del mapa.'));
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

  // ── Actualizar campo del NPC seleccionado ─────────────────────────────
  function updateSelected(patch: Partial<Trainer>) {
    if (selectedIdx === null) return;
    const next = trainers.map((t, i) => (i === selectedIdx ? { ...t, ...patch } : t));
    setTrainers(next);
    setDirty(true);
  }

  // ── Drag & drop ───────────────────────────────────────────────────────
  const onPointerDown = useCallback(
    (e: React.PointerEvent, idx: number) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedIdx(idx);
      dragging.current = { idx, startX: e.clientX, startY: e.clientY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    []
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scrollLeft = canvas.parentElement?.scrollLeft ?? 0;
      const scrollTop = canvas.parentElement?.scrollTop ?? 0;
      const relX = e.clientX - rect.left + scrollLeft;
      const relY = e.clientY - rect.top + scrollTop;
      const tileX = Math.max(0, Math.min(Math.floor(relX / zoom), (currentMap?.width ?? 20) - 1));
      const tileY = Math.max(0, Math.min(Math.floor(relY / zoom), (currentMap?.height ?? 20) - 1));
      const { idx } = dragging.current;
      setTrainers((prev) =>
        prev.map((t, i) => (i === idx ? { ...t, pos: { x: tileX, y: tileY } } : t))
      );
      setDirty(true);
    },
    [zoom, currentMap]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = null;
  }, []);

  // ── Click en canvas vacío → añadir NPC en ese tile ───────────────────
  function onCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scrollLeft = canvas.parentElement?.scrollLeft ?? 0;
    const scrollTop = canvas.parentElement?.scrollTop ?? 0;
    const relX = e.clientX - rect.left + scrollLeft;
    const relY = e.clientY - rect.top + scrollTop;
    const tileX = Math.floor(relX / zoom);
    const tileY = Math.floor(relY / zoom);

    // Verificar si hay un NPC en ese tile
    const hitIdx = trainers.findIndex(
      (t) => t.pos.x === tileX && t.pos.y === tileY
    );
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

        <div style={{ flex: 1 }} />

        {/* Leyenda */}
        <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
          <span><span style={{ color: '#ff5555' }}>●</span> Combat</span>
          <span><span style={{ color: '#5588ff' }}>●</span> Diálogo</span>
          <span><span style={{ color: '#f5c518' }}>●</span> Persistent</span>
        </div>

        {/* Botón añadir */}
        <button onClick={addNpc} style={{ padding: '4px 12px', background: '#2a4a2a', border: '1px solid #4a8a4a', borderRadius: 4, color: '#88ff88', cursor: 'pointer', fontSize: 13 }}>
          + NPC
        </button>

        {/* Guardar */}
        <button onClick={save} disabled={!dirty || saving} style={{ padding: '4px 12px', background: saveFlash ? '#2a6a2a' : (dirty ? '#3a3a7a' : '#1a1a3a'), border: `1px solid ${dirty ? '#6060c0' : '#2a2a4a'}`, borderRadius: 4, color: dirty ? '#fff' : '#555', cursor: dirty ? 'pointer' : 'default', fontSize: 13, transition: 'all 0.3s' }}>
          {saveFlash ? '✓ Guardado' : saving ? 'Guardando...' : '💾 Guardar'}
        </button>

        {/* Exportar TS */}
        <button onClick={doExport} style={{ padding: '4px 12px', background: '#1a2a3a', border: '1px solid #3a5a7a', borderRadius: 4, color: '#88ccff', cursor: 'pointer', fontSize: 13 }}>
          📋 Exportar TS
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
                cursor: 'crosshair',
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
                      cursor: 'grab',
                      zIndex: isSelected ? 100 : 10,
                      border: `2px solid ${isSelected ? '#ffffff' : borderColor}`,
                      borderRadius: 2,
                      boxShadow: isSelected ? `0 0 0 1px #fff, 0 0 8px ${borderColor}` : `0 0 4px ${borderColor}`,
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      background: isSelected ? 'rgba(255,255,255,0.08)' : 'transparent',
                      transition: 'box-shadow 0.1s',
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
              Inspector — {currentMap ? `${currentMap.name} · ${trainers.length} NPCs` : 'sin mapa'}
            </div>
          </div>

          {/* Contenido inspector */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {selected === null ? (
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Avatar + nombre */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sprite} alt="" style={{ width: 48, height: 48, imageRendering: 'pixelated', border: `2px solid ${npcBorderColor(trainer)}`, borderRadius: 4, background: '#0a0a18' }} />
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
