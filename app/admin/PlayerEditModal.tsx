"use client";

import { useState, useEffect } from "react";
import { itemLabel } from "./item-names";

// Nivel máximo del juego (ver game-src/src/app/level-helper.ts → MAX_LEVEL).
const MAX_LEVEL = 200;

interface PokemonInst {
  id: number;
  level: number;
  moves?: string[];
  nickname?: string;
  [key: string]: unknown;
}

interface InventoryItem {
  item: string;
  amount: number;
}

type GameState = {
  pokemon?:   PokemonInst[];
  pc?:        PokemonInst[];
  money?:     number;
  inventory?: InventoryItem[];
  [key: string]: unknown;
};

interface Props {
  userId: string;
  playerName: string;
  onClose: () => void;
  onSaved: () => void;
}

function spriteUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export default function PlayerEditModal({ userId, playerName, onClose, onSaved }: Props) {
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [fullState, setFullState] = useState<GameState | null>(null);
  const [team, setTeam]           = useState<PokemonInst[]>([]);
  const [money, setMoney]         = useState(0);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [tab, setTab]             = useState<"team" | "json">("team");
  const [jsonText, setJsonText]   = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/players/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); setLoading(false); return; }
        const gs = data.gameState as GameState;
        setFullState(gs);
        setTeam(Array.isArray(gs.pokemon) ? gs.pokemon : []);
        setMoney(typeof gs.money === "number" ? gs.money : 0);
        setInventory(Array.isArray(gs.inventory) ? gs.inventory : []);
        setJsonText(JSON.stringify(gs, null, 2));
        setLoading(false);
      })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, [userId]);

  const handleSave = async () => {
    if (!fullState) return;
    setSaving(true);
    setError(null);

    let finalState: GameState;

    if (tab === "json") {
      try {
        finalState = JSON.parse(jsonText) as GameState;
      } catch (e) {
        setJsonError("JSON inválido: " + String(e));
        setSaving(false);
        return;
      }
    } else {
      finalState = { ...fullState, pokemon: team, money, inventory };
    }

    try {
      const res = await fetch(`/api/admin/players/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameState: finalState }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setSaving(false); return; }
      onSaved();
    } catch (e) {
      setError(String(e));
      setSaving(false);
    }
  };

  const updateLevel = (idx: number, raw: string) => {
    const level = Math.min(MAX_LEVEL, Math.max(1, parseInt(raw, 10) || 1));
    setTeam((prev) => prev.map((p, i) => (i === idx ? { ...p, level } : p)));
  };

  const removePokemon = (idx: number) => {
    setTeam((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItemAmount = (idx: number, raw: string) => {
    const amount = Math.min(99, Math.max(0, parseInt(raw, 10) || 0));
    setInventory((prev) => prev.map((it, i) => (i === idx ? { ...it, amount } : it)));
  };

  const removeItem = (idx: number) => {
    setInventory((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <>
      <style>{`
        .edit-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.55);
          z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
        }
        .edit-modal-box {
          background: #fff;
          border-radius: 18px;
          width: 100%; max-width: 560px;
          max-height: 88vh; overflow-y: auto;
          padding: 1.5rem;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .edit-modal-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 1.2rem;
        }
        .edit-modal-title {
          font-size: 1.05rem; font-weight: 800; color: #1a3a2a;
        }
        .edit-modal-close {
          background: none; border: none; font-size: 1.5rem;
          cursor: pointer; color: #bbb; line-height: 1; padding: 0;
        }
        .edit-modal-close:hover { color: #555; }
        .edit-tab-bar { display: flex; gap: 0.5rem; margin-bottom: 1.2rem; }
        .edit-tab-btn {
          padding: 5px 16px; border-radius: 8px; font-weight: 700;
          font-size: 0.8rem; cursor: pointer; transition: all 0.12s;
        }
        .edit-tab-btn.active  { background: #1a3a2a; color: #fff; border: 1.5px solid #1a3a2a; }
        .edit-tab-btn.inactive { background: #fff; color: #555; border: 1.5px solid #e5e7eb; }
        .edit-field-label {
          font-size: 0.63rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.05em; color: #aaa; display: block; margin-bottom: 4px;
        }
        .edit-money-input {
          border: 1.5px solid #e5e7eb; border-radius: 8px;
          padding: 6px 12px; font-size: 0.92rem; width: 140px; outline: none;
        }
        .edit-money-input:focus { border-color: #1a3a2a; }
        .edit-pokemon-row {
          display: flex; align-items: center; gap: 0.75rem;
          background: #f8f6f0; border-radius: 12px;
          padding: 0.5rem 0.75rem; margin-bottom: 0.45rem;
        }
        .edit-pokemon-info { flex: 1; }
        .edit-pokemon-sub { font-size: 0.68rem; color: #999; margin-bottom: 3px; }
        .edit-level-row { display: flex; align-items: center; gap: 0.4rem; }
        .edit-level-label { font-size: 0.72rem; color: #666; font-weight: 600; }
        .edit-stepper {
          display: flex; align-items: center;
          border: 1.5px solid #e5e7eb; border-radius: 8px; overflow: hidden;
        }
        .edit-step-btn {
          background: #f3f4f6; border: none; padding: 7px 13px;
          font-size: 0.9rem; cursor: pointer; color: #444; line-height: 1;
          touch-action: manipulation; user-select: none; transition: background 0.1s;
        }
        .edit-step-btn:active { background: #d1fae5; color: #1a3a2a; }
        .edit-step-val {
          min-width: 40px; text-align: center;
          font-size: 0.92rem; font-weight: 700; color: #1a1a1a;
          padding: 0 6px; border-left: 1.5px solid #e5e7eb;
          border-right: 1.5px solid #e5e7eb;
        }
        .edit-remove-btn {
          background: #fee2e2; border: none; border-radius: 8px;
          padding: 5px 10px; color: #b91c1c; font-weight: 700;
          font-size: 0.75rem; cursor: pointer; white-space: nowrap; flex-shrink: 0;
        }
        .edit-remove-btn:hover { background: #fca5a5; }
        .edit-json-area {
          width: 100%; height: 320px; font-family: monospace; font-size: 0.75rem;
          border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 0.75rem;
          resize: vertical; outline: none; color: #1a1a1a; line-height: 1.5;
          box-sizing: border-box;
        }
        .edit-json-area:focus { border-color: #1a3a2a; }
        .edit-actions {
          display: flex; gap: 0.6rem; margin-top: 1.4rem; justify-content: flex-end;
        }
        .edit-btn-cancel {
          padding: 8px 20px; border-radius: 10px;
          border: 1.5px solid #e5e7eb; background: #fff;
          color: #555; font-weight: 600; cursor: pointer; font-size: 0.88rem;
        }
        .edit-btn-cancel:hover { background: #f5f5f5; }
        .edit-btn-save {
          padding: 8px 20px; border-radius: 10px; border: none;
          background: #1a3a2a; color: #fff;
          font-weight: 700; cursor: pointer; font-size: 0.88rem;
        }
        .edit-btn-save:hover:not(:disabled) { background: #2d5c42; }
        .edit-btn-save:disabled { background: #ccc; cursor: default; }
        .edit-error {
          color: #b91c1c; background: #fee2e2; border-radius: 8px;
          padding: 0.55rem 0.85rem; margin-bottom: 1rem; font-size: 0.82rem;
        }
      `}</style>

      <div
        className="edit-modal-overlay"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="edit-modal-box">
          <div className="edit-modal-header">
            <h2 className="edit-modal-title">Editar partida · {playerName}</h2>
            <button className="edit-modal-close" onClick={onClose} aria-label="Cerrar">×</button>
          </div>

          {loading && (
            <p style={{ color: "#999", textAlign: "center", padding: "2rem 0" }}>
              Cargando partida...
            </p>
          )}

          {error && <p className="edit-error">{error}</p>}

          {!loading && fullState && (
            <>
              {/* Selector de pestañas */}
              <div className="edit-tab-bar">
                <button
                  className={`edit-tab-btn ${tab === "team" ? "active" : "inactive"}`}
                  onClick={() => setTab("team")}
                >
                  🎮 Equipo
                </button>
                <button
                  className={`edit-tab-btn ${tab === "json" ? "active" : "inactive"}`}
                  onClick={() => setTab("json")}
                >
                  {"{ }"} JSON
                </button>
              </div>

              {/* ── Pestaña Equipo ── */}
              {tab === "team" && (
                <>
                  <div style={{ marginBottom: "1.2rem" }}>
                    <label className="edit-field-label">Dinero (₽)</label>
                    <input
                      className="edit-money-input"
                      type="number"
                      min={0}
                      max={999999}
                      value={money}
                      onChange={(e) => setMoney(Math.min(999999, Math.max(0, Number(e.target.value))))}
                    />
                  </div>

                  <div>
                    <label className="edit-field-label">
                      Equipo Pokémon ({team.length}/6)
                    </label>
                    {team.length === 0 && (
                      <p style={{ color: "#bbb", fontSize: "0.82rem", padding: "0.5rem 0" }}>
                        Sin Pokémon en el equipo.
                      </p>
                    )}
                    {team.map((p, idx) => (
                      <div className="edit-pokemon-row" key={idx}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={spriteUrl(p.id)}
                          alt={`#${p.id}`}
                          width={48}
                          height={48}
                          style={{ imageRendering: "pixelated", flexShrink: 0 }}
                        />
                        <div className="edit-pokemon-info">
                          <div className="edit-pokemon-sub">
                            #{p.id}{p.nickname ? ` · ${p.nickname}` : ""}
                          </div>
                          <div className="edit-level-row">
                            <span className="edit-level-label">Nv.</span>
                            <div className="edit-stepper">
                              <button
                                className="edit-step-btn"
                                onClick={() => updateLevel(idx, String(p.level - 1))}
                                disabled={p.level <= 1}
                                aria-label="Bajar nivel"
                              >▼</button>
                              <span className="edit-step-val">{p.level}</span>
                              <button
                                className="edit-step-btn"
                                onClick={() => updateLevel(idx, String(p.level + 1))}
                                disabled={p.level >= MAX_LEVEL}
                                aria-label="Subir nivel"
                              >▲</button>
                            </div>
                          </div>
                        </div>
                        <button
                          className="edit-remove-btn"
                          onClick={() => removePokemon(idx)}
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

                {/* Inventario */}
                {inventory.length > 0 && (
                  <div style={{ marginTop: "1.2rem" }}>
                    <label className="edit-field-label">
                      Inventario ({inventory.length} tipos)
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {inventory.map((it, idx) => (
                        <div key={idx} style={{
                          display: "flex", alignItems: "center", gap: "0.6rem",
                          background: "#f8f6f0", borderRadius: 10, padding: "0.4rem 0.7rem",
                        }}>
                          <span style={{ flex: 1, fontSize: "0.82rem", color: "#1a1a1a", fontWeight: 500 }}>
                            {itemLabel(it.item)}
                          </span>
                          <span style={{ fontSize: "0.68rem", color: "#bbb", marginRight: 2 }}>×</span>
                          <input
                            type="number"
                            min={0}
                            max={99}
                            value={it.amount}
                            onChange={(e) => updateItemAmount(idx, e.target.value)}
                            style={{
                              width: 52, border: "1.5px solid #e5e7eb", borderRadius: 6,
                              padding: "2px 6px", fontSize: "0.85rem", fontWeight: 700,
                              textAlign: "center", outline: "none",
                            }}
                          />
                          <button
                            onClick={() => removeItem(idx)}
                            style={{
                              background: "#fee2e2", border: "none", borderRadius: 7,
                              padding: "3px 8px", color: "#b91c1c", fontWeight: 700,
                              fontSize: "0.72rem", cursor: "pointer",
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: "0.67rem", color: "#bbb", marginTop: "0.4rem" }}>
                      Cantidad 0 = el objeto permanece pero sin unidades. Usa × para eliminarlo.
                    </p>
                  </div>
                )}

              {/* ── Pestaña JSON ── */}
              {tab === "json" && (
                <div>
                  <p style={{ fontSize: "0.72rem", color: "#999", marginBottom: "0.6rem" }}>
                    Edita el estado completo del jugador. Guarda solo si sabes lo que haces.
                  </p>
                  <textarea
                    className="edit-json-area"
                    value={jsonText}
                    onChange={(e) => { setJsonText(e.target.value); setJsonError(null); }}
                    spellCheck={false}
                  />
                  {jsonError && (
                    <p style={{ color: "#b91c1c", fontSize: "0.78rem", marginTop: "0.4rem" }}>
                      {jsonError}
                    </p>
                  )}
                </div>
              )}

              <div className="edit-actions">
                <button className="edit-btn-cancel" onClick={onClose}>
                  Cancelar
                </button>
                <button
                  className="edit-btn-save"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
