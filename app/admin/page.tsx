/**
 * Página admin — Lista de RSVPs y equipos Pokémon.
 * Acceso: /admin (protegido por middleware con cookie ADMIN_PASSWORD).
 * Server Component (Next.js App Router) — sin JS de cliente.
 */
export const dynamic = "force-dynamic"; // siempre server-render, nunca caché estática

import { createHmac } from "node:crypto";
import CsvDownload from "./CsvDownload";
import AdminDashboard from "./AdminDashboard";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Token de recuperación firmado (HMAC-SHA256 de "recover:<uuid>" con ADMIN_SECRET,
 * base64url sin padding). Va en el link `?recover=<uuid>&rt=<token>` y lo valida
 * webauthn-register-start con el MISMO secreto (Vercel y Supabase comparten
 * ADMIN_SECRET — get-all-rsvp ya lo usa). Debe coincidir byte a byte con el HMAC
 * que calcula la edge function en Deno. Se genera en el servidor: el secreto
 * nunca llega al navegador.
 */
function recoverTokenFor(userId: string): string {
  const secret = process.env.ADMIN_SECRET ?? "";
  if (!secret) return "";
  return createHmac("sha256", secret).update(`recover:${userId}`).digest("base64url");
}

interface PokemonInst {
  id: number;
  level: number;
  moves?: string[];
  nickname?: string;
}

interface RSVPEntry {
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
  lastSaved?: string | null;
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

// Slug del mapa → nombre legible para mostrar en el panel admin.
// Mantener sincronizado con el enum MapId de game-src/src/maps/map-types.ts
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

async function fetchRsvps(
  adminKey: string
): Promise<{ entries: RSVPEntry[]; httpStatus: number; errorMsg: string | null }> {
  if (!SUPABASE_URL) {
    return { entries: [], httpStatus: 0, errorMsg: "SUPABASE_URL no configurada — añadir en Variables de Entorno de Vercel" };
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/get-all-rsvp`, {
      headers: {
        "x-admin-key": adminKey,
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) {
      return { entries: [], httpStatus: res.status, errorMsg: text };
    }
    const data = JSON.parse(text);
    return {
      entries: data.entries ?? [],
      httpStatus: 200,
      errorMsg: data.error ?? null,
    };
  } catch (e) {
    return { entries: [], httpStatus: 0, errorMsg: String(e) };
  }
}

export default async function AdminPage() {
  const adminSecret = process.env.ADMIN_SECRET ?? "";

  const { entries, httpStatus, errorMsg } = await fetchRsvps(adminSecret);

  // Firma en servidor el token de recuperación de cada cuenta para el link
  // `?recover=<uuid>&rt=<token>` (el secreto nunca llega al cliente).
  for (const e of entries) {
    if (e.user_id) (e as { recoverToken?: string }).recoverToken = recoverTokenFor(e.user_id);
  }

  const rsvpEntries    = entries.filter((e) => e.hasRsvp !== false);
  const savesOnly      = entries.filter((e) => e.hasRsvp === false);
  const totalRsvps     = rsvpEntries.length;
  const attendingEntries = rsvpEntries.filter((e) => e.attended !== false);
  const totalAttended  = attendingEntries.length;
  const totalDeclined  = rsvpEntries.length - totalAttended;
  const totalSavesOnly = savesOnly.length;
  const totalAdults    = attendingEntries.length + attendingEntries.filter((e) => e.companion).length;
  const totalChildren  = attendingEntries.reduce((s, e) => s + (e.children ?? 0), 0);
  const totalAllergies = attendingEntries.filter((e) => e.allergies && e.allergies.trim() !== "").length;
  const totalBusOut    = attendingEntries.filter((e) => e.bus_outbound && e.bus_outbound !== "none").length;
  const totalBusClubTenis = attendingEntries.filter((e) => e.bus_outbound === "club-tenis").length;
  const totalBusPioXii    = attendingEntries.filter((e) => e.bus_outbound === "pio-xii").length;
  const totalBusArdoi     = attendingEntries.filter((e) => e.bus_outbound === "ardoi").length;
  const totalBus2300   = attendingEntries.filter((e) => e.bus_return === "23:00").length;
  const totalBus0130   = attendingEntries.filter((e) => e.bus_return === "01:30" || e.bus_return === "1:45").length;
  const totalPreboda   = attendingEntries.filter((e) => e.preboda).length;
  const totalPokemon   = entries.reduce((s, e) => s + (Array.isArray(e.pokemon) ? e.pokemon.length : 0), 0);
  const totalPlayers   = entries.filter((e) => Array.isArray(e.pokemon) && e.pokemon.length > 0).length;

  const now = new Date().toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0ede2; }

        .admin-wrap {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          max-width: 960px;
          margin: 0 auto;
          padding: 1.25rem 1rem 4rem;
          min-height: 100vh;
        }

        /* ── Header ── */
        .admin-header {
          background: #1a3a2a;
          color: #fff;
          border-radius: 16px;
          padding: 1.1rem 1.4rem;
          margin-bottom: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .admin-header h1 { font-size: 1.1rem; font-weight: 700; }
        .admin-header-meta { font-size: 0.73rem; opacity: 0.5; white-space: nowrap; }

        /* ── Error panel ── */
        .error-panel {
          background: #fef2f2;
          border: 1px solid #fca5a5;
          border-radius: 10px;
          padding: 0.85rem 1.1rem;
          margin-bottom: 1.1rem;
          font-family: monospace;
          font-size: 0.77rem;
          color: #b91c1c;
          word-break: break-all;
          line-height: 1.5;
        }

        /* ── Stats grid ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.6rem;
          margin-bottom: 1.25rem;
        }
        @media (min-width: 480px)  { .stats-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (min-width: 680px)  { .stats-grid { grid-template-columns: repeat(5, 1fr); } }

        .stat-card {
          background: #fff;
          border-radius: 12px;
          padding: 0.8rem 0.9rem;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .stat-card.declined { background: #fff0f0; }
        .stat-card.declined .stat-value { color: #b91c1c; }
        .stat-card.accent { background: #1a3a2a; }
        .stat-card.accent .stat-label { color: rgba(255,255,255,0.45); }
        .stat-card.accent .stat-value { color: #fff; }

        .stat-label { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.055em; color: #aaa; font-weight: 700; }
        .stat-value { font-size: 1.55rem; font-weight: 800; color: #1a3a2a; line-height: 1; }
        .stat-sub   { font-size: 0.6rem; color: #ccc; margin-top: 1px; }
        .section-title {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: #aaa;
          margin-bottom: 0.65rem;
          padding-left: 0.1rem;
        }

        /* ── Cards list ── */
        .cards-list { display: flex; flex-direction: column; gap: 0.65rem; }

        /* ── RSVP card (details/summary) ── */
        .rsvp-card {
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.07);
          overflow: hidden;
        }
        .rsvp-card > summary {
          list-style: none;
          cursor: pointer;
          padding: 0.85rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.55rem;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .rsvp-card > summary::-webkit-details-marker { display: none; }
        .rsvp-card > summary:focus-visible { outline: 2px solid #1a3a2a; outline-offset: -2px; border-radius: 14px; }

        .summary-num {
          font-size: 0.62rem;
          background: #f0ede0;
          color: #bbb;
          border-radius: 99px;
          padding: 2px 7px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .summary-name {
          font-weight: 700;
          font-size: 0.97rem;
          color: #111;
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .summary-chips {
          display: flex;
          align-items: center;
          gap: 0.28rem;
          flex-shrink: 0;
          flex-wrap: wrap;
          justify-content: flex-end;
          max-width: 55%;
        }
        .summary-arrow {
          font-size: 0.85rem;
          color: #ccc;
          flex-shrink: 0;
          transition: transform 0.2s ease;
          display: inline-block;
          line-height: 1;
        }
        .rsvp-card[open] > summary .summary-arrow { transform: rotate(180deg); }
        .rsvp-card[open] > summary { border-bottom: 1px solid #f5f2ea; }

        /* Detail body */
        .rsvp-detail { padding: 0.9rem 1rem 1rem; }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem 1.1rem;
        }
        .detail-full { grid-column: span 2; }

        .detail-label { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.055em; color: #ccc; font-weight: 700; margin-bottom: 3px; }
        .detail-value { font-size: 0.87rem; color: #1a1a1a; font-weight: 500; word-break: break-word; }
        .detail-value.muted { color: #bbb; font-weight: 400; }

        /* ── Pokémon section ── */
        .pokemon-section {
          margin-top: 0.95rem;
          border-top: 1px solid #f5f2ea;
          padding-top: 0.85rem;
        }
        .pokemon-section-title {
          font-size: 0.62rem;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #bbb;
          font-weight: 700;
          margin-bottom: 0.7rem;
        }
        .pokemon-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .pokemon-tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #f8f6f0;
          border-radius: 10px;
          padding: 0.45rem 0.55rem 0.4rem;
          min-width: 68px;
          gap: 0.15rem;
        }
        .pokemon-tile img { width: 56px; height: 56px; image-rendering: pixelated; }
        .pokemon-level { font-size: 0.63rem; font-weight: 700; color: #555; background: #e6e3d6; border-radius: 99px; padding: 1px 6px; }
        .pokemon-nick  { font-size: 0.6rem; color: #999; max-width: 68px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: center; }

        /* ── Chips / badges ── */
        .chip {
          display: inline-block;
          padding: 2px 7px;
          border-radius: 99px;
          font-size: 0.65rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .chip-green  { background: #dcfce7; color: #15803d; }
        .chip-red    { background: #fee2e2; color: #b91c1c; }
        .chip-gray   { background: #f1f5f9; color: #64748b; }
        .chip-amber  { background: #fef3c7; color: #92400e; }
        .chip-blue   { background: #dbeafe; color: #1d4ed8; }
        .chip-purple { background: #ede9fe; color: #6d28d9; }

        /* ── Footer ── */
        .footer-note { margin-top: 2rem; text-align: center; color: #ccc; font-size: 0.68rem; }
      `}</style>

      <div className="admin-wrap">

        {/* ── Header ── */}
        <div className="admin-header">
          <h1>💒 Wedding RSVPs</h1>
          <span className="admin-header-meta" style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <span>{now} · Recarga para actualizar</span>
            <CsvDownload entries={entries} mapNameLookup={MAP_NAMES} />
          </span>
        </div>

        {/* ── Error panel ── */}
        {(httpStatus !== 200 || errorMsg) && (
          <div className="error-panel">
            <strong>⚠ Error al cargar RSVPs</strong><br />
            HTTP {httpStatus || "0 (red error)"}<br />
            {errorMsg}
          </div>
        )}

        {/* ── Stats ── */}
        <div className="stats-grid">
          <div className="stat-card accent">
            <span className="stat-label">Respuestas</span>
            <span className="stat-value">{totalRsvps}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Asistirán</span>
            <span className="stat-value">{totalAttended}</span>
          </div>
          <div className="stat-card declined">
            <span className="stat-label">Rechazados</span>
            <span className="stat-value">{totalDeclined}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Adultos</span>
            <span className="stat-value">{totalAdults}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Niños</span>
            <span className="stat-value">{totalChildren}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Alergias</span>
            <span className="stat-value">{totalAllergies}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Bus ida</span>
            <span className="stat-value">{totalBusOut}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Club Tenis 11:00</span>
            <span className="stat-value">{totalBusClubTenis}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Pío XII 11:15</span>
            <span className="stat-value">{totalBusPioXii}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Ardoi 11:30</span>
            <span className="stat-value">{totalBusArdoi}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Bus 23:00</span>
            <span className="stat-value">{totalBus2300}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Bus 01:30</span>
            <span className="stat-value">{totalBus0130}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Preboda</span>
            <span className="stat-value">{totalPreboda}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Pokémon</span>
            <span className="stat-value">{totalPokemon}</span>
            <span className="stat-sub">capturados en total</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Han jugado</span>
            <span className="stat-value">{totalPlayers}</span>
            <span className="stat-sub">con al menos 1 pokémon</span>
          </div>
          {totalSavesOnly > 0 && (
            <div className="stat-card">
              <span className="stat-label">Sin RSVP</span>
              <span className="stat-value">{totalSavesOnly}</span>
              <span className="stat-sub">han jugado sin responder</span>
            </div>
          )}
        </div>

        {/* ── Cards ── */}
        {entries.length === 0 ? (
          <p style={{ textAlign: "center", color: "#bbb", padding: "2.5rem 0" }}>
            No hay RSVPs todavía. ¡Comparte el enlace!
          </p>
        ) : (
          <>
            <p className="section-title">Invitados · {totalRsvps} con RSVP ({totalAttended} asisten · {totalDeclined} rechazados){totalSavesOnly > 0 ? ` · ${totalSavesOnly} sin RSVP` : ""}</p>
            <AdminDashboard entries={entries} />
          </>
        )}

        <p className="footer-note">Cargado el {now}</p>
      </div>
    </>
  );
}
