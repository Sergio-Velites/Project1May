'use client';

/**
 * Editor de descripciones de la Pokédex (151 Gen I).
 *
 * - Carga base + overrides desde /api/admin/pokedex-flavor.
 * - Edición inline (textarea por entrada).
 * - Botón "Guardar" persiste vía POST → tabla Supabase pokedex_flavor.
 * - Botón "Restaurar base" envía flavor === base → el endpoint borra el override.
 * - El juego lee los overrides al iniciar la Pokédex desde /api/pokedex-flavor.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

interface Entry {
  id: number;
  name: string;
  base: string;
  override: string | null;
}

const spriteUrl = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

export default function PokedexEditorPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'overridden' | 'empty'>('all');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedFlash, setSavedFlash] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/pokedex-flavor', { cache: 'no-store' });
        const data = await res.json();
        setEntries(data.entries ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visible = useMemo(() => {
    if (filter === 'overridden') return entries.filter((e) => e.override !== null);
    if (filter === 'empty')      return entries.filter((e) => effectiveText(e, drafts) === '');
    return entries;
  }, [entries, drafts, filter]);

  function effectiveText(e: Entry, d: Record<number, string>): string {
    if (e.id in d) return d[e.id];
    return e.override !== null ? e.override : e.base;
  }

  async function save(id: number, text: string) {
    setSavingId(id);
    try {
      const res = await fetch('/api/admin/pokedex-flavor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, flavor: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Error al guardar #${id}: ${data.error ?? res.status}`);
        return;
      }
      // Actualizar entry local
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, override: data.removed ? null : text }
            : e
        )
      );
      // Limpiar borrador
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setSavedFlash(id);
      setTimeout(() => setSavedFlash((s) => (s === id ? null : s)), 1200);
    } finally {
      setSavingId(null);
    }
  }

  async function restoreBase(e: Entry) {
    await save(e.id, e.base);
  }

  if (loading) {
    return <div style={{ padding: 16, fontFamily: 'system-ui' }}>Cargando…</div>;
  }

  const counters = {
    total: entries.length,
    overridden: entries.filter((e) => e.override !== null).length,
    empty: entries.filter((e) => effectiveText(e, drafts) === '').length,
  };

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui', maxWidth: 980, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <Link href="/admin/map-editor" style={{ color: '#0077cc' }}>← Editor de mapas</Link>
        <Link href="/admin" style={{ color: '#0077cc' }}>Admin</Link>
      </div>

      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Editor de Pokédex</h1>
      <p style={{ color: '#555', marginBottom: 16, fontSize: 13 }}>
        Edita las descripciones (flavor text) en español de los 151 Pokémon de Gen I.
        Los cambios se guardan en Supabase y el juego los carga al abrir la Pokédex.
        El botón <em>Restaurar base</em> borra el override y vuelve al texto original
        de PokéAPI.
      </p>

      <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: '#666' }}>
          Total: {counters.total} · Editados: {counters.overridden} · Vacíos: {counters.empty}
        </span>
        <span style={{ flex: 1 }} />
        <FilterButton active={filter === 'all'}        onClick={() => setFilter('all')}>Todos</FilterButton>
        <FilterButton active={filter === 'overridden'} onClick={() => setFilter('overridden')}>Editados</FilterButton>
        <FilterButton active={filter === 'empty'}      onClick={() => setFilter('empty')}>Vacíos</FilterButton>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map((e) => {
          const text = effectiveText(e, drafts);
          const dirty = e.id in drafts;
          const isSaving = savingId === e.id;
          const flashing = savedFlash === e.id;
          const empty = text.trim() === '';
          return (
            <div
              key={e.id}
              style={{
                display: 'flex',
                gap: 12,
                padding: 10,
                border: '1px solid #ddd',
                borderRadius: 6,
                background: flashing ? '#e6ffed' : empty ? '#fff8e1' : '#fff',
                transition: 'background 0.3s',
              }}
            >
              <div style={{ width: 64, flexShrink: 0, textAlign: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={spriteUrl(e.id)}
                  alt={e.name}
                  width={56}
                  height={56}
                  style={{ imageRendering: 'pixelated' }}
                />
                <div style={{ fontSize: 11, color: '#666' }}>#{String(e.id).padStart(3, '0')}</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{e.name}</div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <textarea
                  value={text}
                  onChange={(ev) => setDrafts((p) => ({ ...p, [e.id]: ev.target.value }))}
                  rows={3}
                  style={{
                    fontFamily: 'inherit',
                    fontSize: 13,
                    padding: 6,
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    width: '100%',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                  placeholder="(vacío)"
                />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                  {e.override !== null ? (
                    <span style={{ color: '#0077cc' }}>● Editado</span>
                  ) : (
                    <span style={{ color: '#999' }}>○ Texto base</span>
                  )}
                  <span style={{ flex: 1 }} />
                  <button
                    onClick={() => restoreBase(e)}
                    disabled={isSaving || e.override === null}
                    style={btnSecondary}
                  >
                    Restaurar base
                  </button>
                  <button
                    onClick={() => save(e.id, text)}
                    disabled={isSaving || !dirty}
                    style={btnPrimary(dirty)}
                  >
                    {isSaving ? 'Guardando…' : dirty ? 'Guardar' : 'Sin cambios'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        border: '1px solid #ccc',
        background: active ? '#0077cc' : '#fff',
        color: active ? '#fff' : '#333',
        borderRadius: 4,
        cursor: 'pointer',
        fontSize: 12,
      }}
    >
      {children}
    </button>
  );
}

const btnSecondary: React.CSSProperties = {
  padding: '4px 10px',
  border: '1px solid #ccc',
  background: '#fff',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 12,
};

const btnPrimary = (active: boolean): React.CSSProperties => ({
  padding: '4px 12px',
  border: 'none',
  background: active ? '#0077cc' : '#bbb',
  color: '#fff',
  borderRadius: 4,
  cursor: active ? 'pointer' : 'default',
  fontSize: 12,
  fontWeight: 600,
});
