/**
 * Página admin — Lista de RSVPs y equipos Pokémon.
 * Acceso: /admin?key=ADMIN_SECRET
 * Server Component (Next.js App Router).
 */
import { redirect } from "next/navigation";

const SUPABASE_URL = "https://kplfjrjibjptigvfgdvy.supabase.co";

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

async function fetchRsvps(adminKey: string): Promise<RSVPEntry[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/get-all-rsvp`, {
      headers: {
        "x-admin-key": adminKey,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.entries ?? [];
  } catch {
    return [];
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

  const entries = await fetchRsvps(key);

  const yes = (v: boolean) => (v ? "✓" : "–");
  const busLabel = (v: string) => {
    if (v === "23:00") return "Vuelta 23:00";
    if (v === "1:45") return "Vuelta 1:45";
    return "–";
  };

  // Totals
  const totalAdults = entries.length + entries.filter(e => e.companion).length;
  const totalChildren = entries.reduce((s, e) => s + (e.children ?? 0), 0);
  const totalBusOut = entries.filter(e => e.bus_outbound).length;
  const totalPreboda = entries.filter(e => e.preboda).length;

  return (
    <main style={{ fontFamily: "monospace", padding: "2rem", background: "#f0ede0", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "1.6rem", marginBottom: "1rem" }}>
        💒 Admin — Wedding RSVPs ({entries.length} respuestas)
      </h1>

      <p style={{ marginBottom: "0.5rem", color: "#555" }}>
        Adultos totales: <strong>{totalAdults}</strong> &nbsp;|&nbsp;
        Niños: <strong>{totalChildren}</strong> &nbsp;|&nbsp;
        Bus ida: <strong>{totalBusOut}</strong> &nbsp;|&nbsp;
        Preboda: <strong>{totalPreboda}</strong>
      </p>

      {entries.length === 0 && (
        <p style={{ color: "#888" }}>No hay RSVPs todavía.</p>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{
          borderCollapse: "collapse", width: "100%",
          fontSize: "0.85rem", background: "#fff",
        }}>
          <thead>
            <tr style={{ background: "#2d2d2d", color: "#fff" }}>
              <Th>#</Th>
              <Th>Nombre</Th>
              <Th>Acompañante</Th>
              <Th>Niños</Th>
              <Th>Alergias</Th>
              <Th>Bus ida</Th>
              <Th>Bus vuelta</Th>
              <Th>Preboda</Th>
              <Th>Pokémon (lvl)</Th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #ddd", background: i % 2 === 0 ? "#fafaf7" : "#fff" }}>
                <Td>{i + 1}</Td>
                <Td><strong>{e.player_name}</strong></Td>
                <Td>{e.companion ?? "–"}</Td>
                <Td style={{ textAlign: "center" }}>{e.children}</Td>
                <Td style={{ maxWidth: 180, wordBreak: "break-word" }}>{e.allergies ?? "–"}</Td>
                <Td style={{ textAlign: "center" }}>{yes(e.bus_outbound)}</Td>
                <Td>{busLabel(e.bus_return)}</Td>
                <Td style={{ textAlign: "center" }}>{yes(e.preboda)}</Td>
                <Td>
                  {e.pokemon?.length > 0
                    ? e.pokemon.map((p, pi) => (
                        <span key={pi} style={{ display: "inline-block", marginRight: 4 }}>
                          #{p.id} lv{p.level}{p.nickname ? ` (${p.nickname})` : ""}
                        </span>
                      ))
                    : "–"}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: "1.5rem", color: "#aaa", fontSize: "0.75rem" }}>
        Actualizado en tiempo real. Recarga para refrescar.
      </p>
    </main>
  );
}

function Th({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <th style={{ padding: "8px 12px", textAlign: "left", whiteSpace: "nowrap", ...style }}>
      {children}
    </th>
  );
}

function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <td style={{ padding: "7px 12px", verticalAlign: "top", ...style }}>
      {children}
    </td>
  );
}
