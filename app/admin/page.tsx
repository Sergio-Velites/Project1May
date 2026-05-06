/**
 * Página admin — Lista de RSVPs y equipos Pokémon.
 * Acceso: /admin?key=ADMIN_SECRET
 * Server Component (Next.js App Router).
 */
import { redirect } from "next/navigation";

const SUPABASE_URL = "https://kplfjrjibjptigvfgdvy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwbGZqcmppYmpwdGlndmZnZHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1OTMxNjMsImV4cCI6MjA5MzE2OTE2M30.lOgErwiQHTp98A3a7Z3ZotvYKmdxbwScNFgN_9lOijM";

interface PokemonInst {
  id: number;
  level: number;
  moves: string[];
  nickname?: string;
}

interface RSVPEntry {
  player_name: string;
  companion: string | null;
  children: number;
  allergies: string | null;
  bus_outbound: boolean;
  bus_return: string;
  preboda: boolean;
  pokemon: PokemonInst[];
}

async function fetchRsvps(
  adminKey: string
): Promise<{ entries: RSVPEntry[]; httpStatus: number; errorMsg: string | null }> {
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
    return { entries: data.entries ?? [], httpStatus: 200, errorMsg: data.error ?? null };
  } catch (e) {
    return { entries: [], httpStatus: 0, errorMsg: String(e) };
  }
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const params = await searchParams;
  const key = params.key ?? "";
  const secret = process.env.ADMIN_SECRET ?? "";

  if (!secret || key !== secret) {
    redirect("/");
  }

  const { entries, httpStatus, errorMsg } = await fetchRsvps(key);

  const busLabel = (v: string) => {
    if (v === "23:00") return "23:00 h";
    if (v === "1:45") return "1:45 h";
    return "No";
  };

  const totalAdults = entries.length + entries.filter(e => e.companion).length;
  const totalChildren = entries.reduce((s, e) => s + (e.children ?? 0), 0);
  const totalBusOut = entries.filter(e => e.bus_outbound).length;
  const totalPreboda = entries.filter(e => e.preboda).length;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f2e8; }

        .admin-wrap {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          max-width: 900px;
          margin: 0 auto;
          padding: 1.25rem 1rem 3rem;
          background: #f5f2e8;
          min-height: 100vh;
        }

        /* Header */
        .admin-header {
          background: #1a3a2a;
          color: #fff;
          border-radius: 14px;
          padding: 1.1rem 1.25rem;
          margin-bottom: 1.25rem;
        }
        .admin-header h1 {
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        .admin-header p {
          font-size: 0.8rem;
          opacity: 0.65;
          margin-top: 0.25rem;
        }

        /* Stats grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }
        @media (min-width: 480px) {
          .stats-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .stat-card {
          background: #fff;
          border-radius: 12px;
          padding: 0.9rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.07);
        }
        .stat-card .stat-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #888;
          font-weight: 600;
        }
        .stat-card .stat-value {
          font-size: 1.7rem;
          font-weight: 800;
          color: #1a3a2a;
          line-height: 1;
        }

        /* Section heading */
        .section-title {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #999;
          margin-bottom: 0.6rem;
          padding-left: 0.1rem;
        }

        /* Cards list (mobile) */
        .cards-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        @media (min-width: 720px) {
          .cards-list { display: none; }
        }

        .rsvp-card {
          background: #fff;
          border-radius: 14px;
          padding: 1rem 1.1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.07);
        }
        .rsvp-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }
        .rsvp-card-name {
          font-weight: 700;
          font-size: 1rem;
          color: #1a1a1a;
        }
        .rsvp-card-num {
          font-size: 0.7rem;
          background: #f0ede0;
          color: #999;
          border-radius: 99px;
          padding: 2px 8px;
          font-weight: 600;
        }
        .rsvp-card-body {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.55rem 1rem;
        }
        .rsvp-field {}
        .rsvp-field-label {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #aaa;
          font-weight: 600;
          margin-bottom: 1px;
        }
        .rsvp-field-value {
          font-size: 0.88rem;
          color: #222;
          font-weight: 500;
        }
        .rsvp-field-value.wide {
          grid-column: span 2;
        }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 99px;
          font-size: 0.72rem;
          font-weight: 700;
        }
        .badge-yes { background: #dcfce7; color: #166534; }
        .badge-no  { background: #f1f5f9; color: #94a3b8; }
        .pokemon-chip {
          display: inline-block;
          background: #f0ede0;
          border-radius: 6px;
          padding: 1px 6px;
          font-size: 0.75rem;
          margin: 1px 2px 1px 0;
          color: #555;
        }

        /* Table (desktop) */
        .table-wrap {
          display: none;
          background: #fff;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.07);
        }
        @media (min-width: 720px) {
          .table-wrap { display: block; overflow-x: auto; }
        }
        table {
          border-collapse: collapse;
          width: 100%;
          font-size: 0.82rem;
        }
        thead tr {
          background: #1a3a2a;
          color: #fff;
        }
        thead th {
          padding: 10px 14px;
          text-align: left;
          white-space: nowrap;
          font-weight: 600;
          font-size: 0.76rem;
          letter-spacing: 0.03em;
        }
        tbody tr {
          border-bottom: 1px solid #f0ede0;
        }
        tbody tr:last-child { border-bottom: none; }
        tbody tr:nth-child(even) { background: #faf9f4; }
        tbody td {
          padding: 9px 14px;
          vertical-align: top;
          color: #333;
        }

        .footer-note {
          margin-top: 1.5rem;
          text-align: center;
          color: #bbb;
          font-size: 0.72rem;
        }
      `}</style>

      <div className="admin-wrap">
        {/* Header */}
        <div className="admin-header">
          <h1>💒 Wedding RSVPs</h1>
          <p>{entries.length} {entries.length === 1 ? "respuesta" : "respuestas"} &mdash; Recarga para actualizar</p>
        </div>

        {/* Debug panel — visible only when there's an error */}
        {(httpStatus !== 200 || errorMsg) && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10,
            padding: "0.9rem 1.1rem", marginBottom: "1.25rem",
            fontFamily: "monospace", fontSize: "0.78rem", color: "#b91c1c",
            wordBreak: "break-all",
          }}>
            <strong>⚠ Error al cargar RSVPs</strong><br />
            HTTP {httpStatus || "0 (red error)"}<br />
            {errorMsg}
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Adultos</span>
            <span className="stat-value">{totalAdults}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Niños</span>
            <span className="stat-value">{totalChildren}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Bus ida</span>
            <span className="stat-value">{totalBusOut}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Preboda</span>
            <span className="stat-value">{totalPreboda}</span>
          </div>
        </div>

        {entries.length === 0 ? (
          <p style={{ textAlign: "center", color: "#aaa", padding: "2rem 0" }}>
            No hay RSVPs todavía. ¡Comparte el enlace!
          </p>
        ) : (
          <>
            <p className="section-title">Invitados</p>

            {/* Mobile cards */}
            <div className="cards-list">
              {entries.map((e, i) => (
                <div className="rsvp-card" key={i}>
                  <div className="rsvp-card-header">
                    <span className="rsvp-card-name">{e.player_name}</span>
                    <span className="rsvp-card-num">#{i + 1}</span>
                  </div>
                  <div className="rsvp-card-body">
                    <div className="rsvp-field">
                      <div className="rsvp-field-label">Acompañante</div>
                      <div className="rsvp-field-value">{e.companion ?? "–"}</div>
                    </div>
                    <div className="rsvp-field">
                      <div className="rsvp-field-label">Niños</div>
                      <div className="rsvp-field-value">{e.children}</div>
                    </div>
                    <div className="rsvp-field">
                      <div className="rsvp-field-label">Bus ida</div>
                      <div className="rsvp-field-value">
                        <span className={`badge ${e.bus_outbound ? "badge-yes" : "badge-no"}`}>
                          {e.bus_outbound ? "Sí" : "No"}
                        </span>
                      </div>
                    </div>
                    <div className="rsvp-field">
                      <div className="rsvp-field-label">Bus vuelta</div>
                      <div className="rsvp-field-value">{busLabel(e.bus_return)}</div>
                    </div>
                    <div className="rsvp-field">
                      <div className="rsvp-field-label">Preboda</div>
                      <div className="rsvp-field-value">
                        <span className={`badge ${e.preboda ? "badge-yes" : "badge-no"}`}>
                          {e.preboda ? "Sí" : "No"}
                        </span>
                      </div>
                    </div>
                    <div className="rsvp-field">
                      <div className="rsvp-field-label">Alergias</div>
                      <div className="rsvp-field-value">{e.allergies ?? "–"}</div>
                    </div>
                    {e.pokemon?.length > 0 && (
                      <div className="rsvp-field" style={{ gridColumn: "span 2" }}>
                        <div className="rsvp-field-label">Pokémon</div>
                        <div className="rsvp-field-value">
                          {e.pokemon.map((p, pi) => (
                            <span className="pokemon-chip" key={pi}>
                              #{p.id} lv{p.level}{p.nickname ? ` ${p.nickname}` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Acompañante</th>
                    <th>Niños</th>
                    <th>Alergias</th>
                    <th>Bus ida</th>
                    <th>Bus vuelta</th>
                    <th>Preboda</th>
                    <th>Pokémon</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => (
                    <tr key={i}>
                      <td style={{ color: "#aaa" }}>{i + 1}</td>
                      <td><strong>{e.player_name}</strong></td>
                      <td>{e.companion ?? "–"}</td>
                      <td style={{ textAlign: "center" }}>{e.children}</td>
                      <td style={{ maxWidth: 180, wordBreak: "break-word" }}>{e.allergies ?? "–"}</td>
                      <td style={{ textAlign: "center" }}>
                        <span className={`badge ${e.bus_outbound ? "badge-yes" : "badge-no"}`}>
                          {e.bus_outbound ? "Sí" : "No"}
                        </span>
                      </td>
                      <td>{busLabel(e.bus_return)}</td>
                      <td style={{ textAlign: "center" }}>
                        <span className={`badge ${e.preboda ? "badge-yes" : "badge-no"}`}>
                          {e.preboda ? "Sí" : "No"}
                        </span>
                      </td>
                      <td>
                        {e.pokemon?.length > 0
                          ? e.pokemon.map((p, pi) => (
                              <span className="pokemon-chip" key={pi}>
                                #{p.id} lv{p.level}
                              </span>
                            ))
                          : "–"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <p className="footer-note">
          Última carga: {new Date().toLocaleTimeString("es-ES")}
        </p>
      </div>
    </>
  );
}
