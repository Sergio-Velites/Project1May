"use client";

/**
 * AdminDashboard.tsx
 * Client Component — maneja la ordenación y el render de la lista de invitados.
 * Recibe los datos ya calculados del Server Component.
 */

import { useState, useMemo } from "react";
import { Medal, getMedals, computeGlobalMedals, getCaughtSet, getSeenSet, RSVPForMedals } from "./admin-medals";
import { isBadgeSlug, itemLabel } from "./item-names";
import { questLabel } from "./quest-names";
import ImpersonateButtons from "./ImpersonateButtons";

// ── Tipos que vienen del server ──────────────────────────────────────────

export interface PokemonInst {
  id: number;
  level: number;
  moves?: string[];
  nickname?: string;
}

export interface EntryForDashboard {
  user_id: string;
  player_name: string;
  companion: string | null;
  children: number;
  allergies: string | null;
  bus_outbound: string;
  bus_return: string;
  preboda: boolean;
  attended?: boolean | null;
  hasRsvp?: boolean;
  pokemon: PokemonInst[];
  pc?: PokemonInst[];
  seenPokemon?: number[];
  caughtPokemon?: number[];
  inventory?: { item: string; amount: number }[];
  completedQuests?: string[];
  money?: number;
  map?: string | null;
  pos?: { x: number; y: number } | null;
}

// ── Helpers visuales ────────────────────────────────────────────────────

function spriteUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

function busLabel(v: string) {
  if (v === "23:00") return "23:00 h";
  if (v === "01:30" || v === "1:45") return "01:30 h";
  return "No";
}

function busStopLabel(v: string) {
  if (v === "club-tenis") return "Club Tenis (11:00)";
  if (v === "pio-xii")    return "Pío XII (11:15)";
  if (v === "ardoi")      return "Ardoi (11:30)";
  return "No";
}

const MAP_NAMES: Record<string, string> = {
  "pallet-town":                   "DESTILERÍA DEL PROF. OAK / Pueblo Paleta",
  "pallet-town-house-a-1f":        "Casa del jugador (cocina)",
  "pallet-town-house-a-2f":        "Habitación del jugador",
  "pallet-town-house-b":           "Casa del rival",
  "pallet-town-lab":               "Laboratorio del Prof. Oak",
  "route-1":                       "Ruta 1 · Camino al Soto",
  "viridian-city":                 "SOTO LEZKAIRU",
  "viridian-city-gym":             "Gimnasio de SOTO LEZKAIRU",
  "viridian-city-poke-mart":       "PokeMart de SOTO LEZKAIRU",
  "viridian-city-pokemon-center":  "Centro Pokémon de SOTO LEZKAIRU",
  "viridian-city-pokemon-acadamy": "Academia Pokémon",
  "viridian-city-npc-house":       "Casa NPC de SOTO LEZKAIRU",
  "route-22":                      "Ruta 22",
  "gate-house":                    "Caseta de la Guía",
  "route-2":                       "Ruta 2",
  "route-2-gate":                  "Caseta sur de la Ruta 2",
  "viridian-forrest":              "EL BOSQUECILLO",
  "route-2-gate-north":            "Caseta norte de la Ruta 2",
  "pewter-city":                   "VILLAMAYOR DE MONJARDÍN",
  "pewter-city-poke-mart":         "PokeMart de VILLAMAYOR",
  "pewter-city-pokemon-center":    "Centro Pokémon de VILLAMAYOR",
  "pewter-city-npc-a":             "Casa NPC A de VILLAMAYOR",
  "pewter-city-npc-b":             "Casa NPC B de VILLAMAYOR",
  "pewter-city-gym":               "Bodega CASTILLO DE MONJARDÍN",
  "pewter-city-museum-1f":         "Museo de VILLAMAYOR (1F)",
  "pewter-city-museum-2f":         "Museo de VILLAMAYOR (2F)",
  "route-3":                       "Ruta 3",
  "route-3-pokemon-center":        "Centro Pokémon de la Ruta 3",
  "mt-moon-1f":                    "Monte Luna (1F)",
  "mt-moon-2f":                    "Monte Luna (2F)",
  "mt-moon-3f":                    "Monte Luna (3F)",
};

// ── Tipos de ordenación ──────────────────────────────────────────────────

type SortKey = "index" | "name" | "caught" | "seen" | "quests" | "level";
type SortDir = "asc" | "desc";

interface SortOption {
  key: SortKey;
  label: string;
}
const SORT_OPTIONS: SortOption[] = [
  { key: "index",  label: "Posición" },
  { key: "name",   label: "Nombre" },
  { key: "caught", label: "Capturados" },
  { key: "seen",   label: "Vistos" },
  { key: "quests", label: "Logros" },
  { key: "level",  label: "Nivel máx." },
];

// ── Colores de rareza de medalla ─────────────────────────────────────────
const RARITY_COLORS: Record<Medal["rarity"], { bg: string; border: string; text: string }> = {
  special: { bg: "#ede9fe", border: "#a78bfa", text: "#5b21b6" },
  gold:    { bg: "#fef9c3", border: "#f59e0b", text: "#92400e" },
  silver:  { bg: "#f1f5f9", border: "#94a3b8", text: "#334155" },
  bronze:  { bg: "#fdf4e7", border: "#d97706", text: "#78350f" },
};

// ── Componente de medalla con tooltip ───────────────────────────────────

function MedalBadge({ medal }: { medal: Medal }) {
  const colors = RARITY_COLORS[medal.rarity];
  return (
    <span
      title={`${medal.label}: ${medal.description}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        background: colors.bg,
        border: `1.5px solid ${colors.border}`,
        color: colors.text,
        borderRadius: "99px",
        padding: "2px 8px 2px 5px",
        fontSize: "0.68rem",
        fontWeight: 700,
        cursor: "default",
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
    >
      <span style={{ fontSize: "0.85rem" }}>{medal.emoji}</span>
      {medal.label}
    </span>
  );
}

// ── Componente principal ─────────────────────────────────────────────────

interface Props {
  entries: EntryForDashboard[];
}

export default function AdminDashboard({ entries }: Props) {
  const [sortKey, setSortKey]   = useState<SortKey>("index");
  const [sortDir, setSortDir]   = useState<SortDir>("desc");

  // Pre-calcular medallas globales (una sola vez)
  const globalMedals = useMemo(() => computeGlobalMedals(entries as RSVPForMedals[]), [entries]);

  // Ordenar entradas
  const sorted = useMemo(() => {
    const indexed = entries.map((e, i) => ({ e, i }));
    const key = sortKey;
    indexed.sort((a, b) => {
      let va = 0, vb = 0;
      let sa = "", sb = "";
      if (key === "index") {
        va = a.i; vb = b.i;
      } else if (key === "name") {
        sa = a.e.player_name.toLowerCase();
        sb = b.e.player_name.toLowerCase();
      } else if (key === "caught") {
        va = getCaughtSet(a.e as RSVPForMedals).size;
        vb = getCaughtSet(b.e as RSVPForMedals).size;
      } else if (key === "seen") {
        va = getSeenSet(a.e as RSVPForMedals).size;
        vb = getSeenSet(b.e as RSVPForMedals).size;
      } else if (key === "quests") {
        va = (a.e.completedQuests ?? []).length;
        vb = (b.e.completedQuests ?? []).length;
      } else if (key === "level") {
        const allA = [...(a.e.pokemon ?? []), ...(a.e.pc ?? [])];
        const allB = [...(b.e.pokemon ?? []), ...(b.e.pc ?? [])];
        va = allA.reduce((m, p) => Math.max(m, p.level), 0);
        vb = allB.reduce((m, p) => Math.max(m, p.level), 0);
      }
      const cmp = sa !== "" || sb !== "" ? sa.localeCompare(sb) : va - vb;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return indexed;
  }, [entries, sortKey, sortDir]);

  const toggleDir = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));

  return (
    <>
      {/* ── CSS de medallas + sort controls ── */}
      <style>{`
        /* Tooltip nativo del title — complementado por el borde en hover */
        [title]:hover { opacity: 0.85; }
        .sort-bar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 0.75rem;
        }
        .sort-bar label {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #aaa;
        }
        .sort-select {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 4px 10px;
          font-size: 0.82rem;
          background: #fff;
          color: #111;
          cursor: pointer;
          outline: none;
        }
        .sort-dir-btn {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 4px 10px;
          font-size: 0.82rem;
          background: #fff;
          cursor: pointer;
          color: #555;
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 600;
          transition: background 0.12s;
        }
        .sort-dir-btn:hover { background: #f5f5f5; }
        .medals-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
          margin-top: 0.65rem;
          padding-top: 0.65rem;
          border-top: 1px solid #f0ede2;
        }
      `}</style>

      {/* ── Barra de ordenación ── */}
      <div className="sort-bar">
        <label>Ordenar por</label>
        <select
          className="sort-select"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
        <button className="sort-dir-btn" onClick={toggleDir} type="button">
          {sortDir === "asc" ? "▲ Asc" : "▼ Desc"}
        </button>
      </div>

      {/* ── Lista de tarjetas ── */}
      <div className="cards-list">
        {sorted.map(({ e, i }) => {
          const team   = Array.isArray(e.pokemon) ? e.pokemon : [];
          const caught = getCaughtSet(e as RSVPForMedals);
          const seen   = getSeenSet(e as RSVPForMedals);
          const medals = getMedals(e as RSVPForMedals, i, globalMedals);
          const hasAllergy = !!(e.allergies && e.allergies.trim() !== "");
          const isDeclined = e.attended === false;
          const noRsvp     = e.hasRsvp === false;

          return (
            <details className="rsvp-card" key={i}>
              <summary>
                <span className="summary-num">#{i + 1}</span>
                <span className="summary-name">{e.player_name}</span>
                <span className="summary-chips">
                  {noRsvp && <span className="chip chip-gray">Sin RSVP</span>}
                  {isDeclined && <span className="chip chip-red">✗ No asiste</span>}
                  {!isDeclined && e.companion && (
                    <span className="chip chip-gray">+{e.companion}</span>
                  )}
                  {!isDeclined && (e.children ?? 0) > 0 && (
                    <span className="chip chip-blue">{e.children} niño{e.children !== 1 ? "s" : ""}</span>
                  )}
                  {!isDeclined && hasAllergy && (
                    <span className="chip chip-red">⚠ alergia</span>
                  )}
                  {!isDeclined && e.preboda && (
                    <span className="chip chip-amber">Preboda</span>
                  )}
                  {/* Capturados en vez de equipo */}
                  {caught.size > 0 && (
                    <span className="chip chip-purple" title={`${caught.size} capturados · ${seen.size} vistos`}>
                      🎮 {caught.size}
                    </span>
                  )}
                </span>
                <span className="summary-arrow">▾</span>
              </summary>

              <div className="rsvp-detail">
                {noRsvp && (
                  <div style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0.6rem 0.9rem", marginBottom: "0.75rem", color: "#475569", fontWeight: 600, fontSize: "0.82rem" }}>
                    ℹ Este invitado ha jugado pero todavía no ha respondido el RSVP.
                  </div>
                )}
                {isDeclined && (
                  <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "0.6rem 0.9rem", marginBottom: "0.75rem", color: "#b91c1c", fontWeight: 700, fontSize: "0.85rem" }}>
                    ✗ Ha indicado que NO asistirá a la boda.
                  </div>
                )}

                <div className="detail-grid">
                  <div>
                    <div className="detail-label">Acompañante</div>
                    <div className={`detail-value${e.companion ? "" : " muted"}`}>{e.companion ?? "–"}</div>
                  </div>
                  <div>
                    <div className="detail-label">Niños</div>
                    <div className="detail-value">{e.children ?? 0}</div>
                  </div>
                  <div>
                    <div className="detail-label">Bus ida</div>
                    <div className="detail-value">
                      <span className={`chip ${e.bus_outbound && e.bus_outbound !== "none" ? "chip-green" : "chip-gray"}`}>
                        {busStopLabel(e.bus_outbound)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="detail-label">Bus vuelta</div>
                    <div className="detail-value">
                      <span className={`chip ${e.bus_return !== "none" ? "chip-green" : "chip-gray"}`}>
                        {busLabel(e.bus_return)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="detail-label">Preboda</div>
                    <div className="detail-value">
                      <span className={`chip ${e.preboda ? "chip-amber" : "chip-gray"}`}>
                        {e.preboda ? "Sí" : "No"}
                      </span>
                    </div>
                  </div>
                  <div className={hasAllergy ? "detail-full" : ""}>
                    <div className="detail-label">Alergias / restricciones</div>
                    <div className={`detail-value${hasAllergy ? "" : " muted"}`}>{hasAllergy ? e.allergies : "–"}</div>
                  </div>
                  <div className="detail-full">
                    <div className="detail-label">Ubicación actual</div>
                    <div className={`detail-value${e.map ? "" : " muted"}`}>
                      {e.map ? (
                        <>
                          {MAP_NAMES[e.map] ?? e.map}
                          {e.pos && (
                            <span style={{ color: "#999", fontWeight: 400, marginLeft: "0.4rem", fontSize: "0.78rem" }}>
                              ({e.pos.x}, {e.pos.y})
                            </span>
                          )}
                        </>
                      ) : "Aún no ha empezado a jugar"}
                    </div>
                  </div>
                </div>

                {/* ── Medallas ── */}
                {medals.length > 0 && (
                  <div className="medals-row">
                    {medals.map((m, mi) => (
                      <MedalBadge key={mi} medal={m} />
                    ))}
                  </div>
                )}

                {/* ── Equipo Pokémon ── */}
                {team.length > 0 && (
                  <div className="pokemon-section">
                    <div className="pokemon-section-title">
                      Equipo · {team.length} en combate
                    </div>
                    <div className="pokemon-grid">
                      {team.map((p, pi) => (
                        <div className="pokemon-tile" key={pi}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={spriteUrl(p.id)} alt={`Pokémon #${p.id}`} width={56} height={56} />
                          <span className="pokemon-level">Lv. {p.level}</span>
                          {p.nickname && <span className="pokemon-nick">{p.nickname}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Pokédex ── */}
                {(() => {
                  const ownedIds = [...team.map((p) => p.id), ...((e.pc ?? []).map((p) => p.id))];
                  const caughtSet = new Set<number>([...(e.caughtPokemon ?? []), ...ownedIds]);
                  const seenSet   = new Set<number>([...(e.seenPokemon ?? []), ...caughtSet]);
                  if (seenSet.size === 0) return null;
                  const allSorted = Array.from(seenSet).sort((a, b) => a - b);
                  return (
                    <div className="pokemon-section">
                      <div className="pokemon-section-title">
                        Pokédex · {seenSet.size} visto{seenSet.size !== 1 ? "s" : ""} · {caughtSet.size} capturado{caughtSet.size !== 1 ? "s" : ""}
                      </div>
                      <div className="pokemon-grid">
                        {allSorted.map((id) => {
                          const isCaught = caughtSet.has(id);
                          return (
                            <div className="pokemon-tile" key={id} style={isCaught ? undefined : { opacity: 0.5 }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={spriteUrl(id)}
                                alt={`Pokémon #${id}`}
                                width={56}
                                height={56}
                                style={isCaught ? undefined : { filter: "grayscale(1)" }}
                              />
                              <span className="pokemon-level">#{id}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* ── Inventario / mochila ── */}
                {(() => {
                  const inv    = (e.inventory ?? []).filter((it) => it.amount > 0);
                  if (inv.length === 0 && (!e.money || e.money === 0)) return null;
                  const items  = inv.filter((it) => !isBadgeSlug(it.item));
                  const badges = inv.filter((it) => isBadgeSlug(it.item));
                  return (
                    <div className="pokemon-section">
                      <div className="pokemon-section-title">
                        Mochila{typeof e.money === "number" ? ` · ₽${e.money}` : ""}
                      </div>
                      {items.length > 0 ? (
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.3rem 0.7rem" }}>
                          {items.map((it) => (
                            <li key={it.item} style={{ fontSize: "0.78rem", color: "#1a1a1a", display: "flex", justifyContent: "space-between", padding: "0.18rem 0.5rem", background: "#f8f6f0", borderRadius: 6 }}>
                              <span>{itemLabel(it.item)}</span>
                              <span style={{ color: "#888", fontWeight: 600 }}>×{it.amount}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="detail-value muted" style={{ fontSize: "0.75rem" }}>Sin objetos</div>
                      )}
                      {badges.length > 0 && (
                        <div style={{ marginTop: "0.55rem", display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                          {badges.map((b) => (
                            <span key={b.item} className="chip chip-amber">🏅 {itemLabel(b.item)}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── Logros ── */}
                {(() => {
                  const quests = e.completedQuests ?? [];
                  if (quests.length === 0) return null;
                  return (
                    <div className="pokemon-section">
                      <div className="pokemon-section-title">
                        Logros · {quests.length} completado{quests.length !== 1 ? "s" : ""}
                      </div>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.3rem 0.7rem" }}>
                        {quests.map((q) => (
                          <li key={q} style={{ fontSize: "0.76rem", color: "#1a1a1a", padding: "0.2rem 0.55rem", background: "#f0f7f2", borderRadius: 6, lineHeight: 1.35 }}>
                            ✓ {questLabel(q)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}

                {/* ── Acciones de impersonación ── */}
                {e.user_id && (
                  <ImpersonateButtons userId={e.user_id} playerName={e.player_name} />
                )}
              </div>
            </details>
          );
        })}
      </div>
    </>
  );
}
