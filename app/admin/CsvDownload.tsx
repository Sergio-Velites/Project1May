"use client";
/**
 * CsvDownload — Botón cliente que genera un CSV con todos los datos del admin.
 * Recibe los datos ya cargados por el Server Component padre.
 */

interface PokemonInst {
  id: number;
  level: number;
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
  pokemon: PokemonInst[];
  map?: string | null;
  pos?: { x: number; y: number } | null;
}

interface Props {
  entries: RSVPEntry[];
  mapNameLookup: Record<string, string>;
}

function busStopLabel(v: string) {
  if (v === "club-tenis") return "Club Tenis 11:00";
  if (v === "pio-xii")    return "Pío XII 11:15";
  if (v === "ardoi")      return "Ardoi 11:30";
  return "No";
}

function busReturnLabel(v: string) {
  if (v === "23:00") return "23:00";
  if (v === "01:30" || v === "1:45") return "01:30";
  return "No";
}

function escapeCsv(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function CsvDownload({ entries, mapNameLookup }: Props) {
  const handleDownload = () => {
    const headers = [
      "Nombre",
      "Asiste",
      "RSVP completado",
      "Acompañante",
      "Niños",
      "Alergias",
      "Bus ida (parada)",
      "Bus vuelta",
      "Preboda",
      "Pokémon en equipo",
      "Equipo (id+nivel)",
      "Mapa actual",
      "Posición",
    ];

    const rows = entries.map((e) => {
      const team = Array.isArray(e.pokemon) ? e.pokemon : [];
      const mapSlug = e.map ?? "";
      const mapName = mapSlug ? (mapNameLookup[mapSlug] ?? mapSlug) : "";
      const posStr = e.pos ? `${e.pos.x},${e.pos.y}` : "";
      return [
        escapeCsv(e.player_name),
        escapeCsv(e.attended === false ? "No" : "Sí"),
        escapeCsv(e.hasRsvp === false ? "No" : "Sí"),
        escapeCsv(e.companion),
        escapeCsv(e.children),
        escapeCsv(e.allergies),
        escapeCsv(busStopLabel(e.bus_outbound)),
        escapeCsv(busReturnLabel(e.bus_return)),
        escapeCsv(e.preboda ? "Sí" : "No"),
        escapeCsv(team.length),
        escapeCsv(team.map((p) => `#${p.id} Lv${p.level}`).join(" | ")),
        escapeCsv(mapName),
        escapeCsv(posStr),
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    // BOM para Excel
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rsvp-boda-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      style={{
        background: "#fff",
        border: "1.5px solid rgba(255,255,255,0.4)",
        color: "#fff",
        borderRadius: "8px",
        padding: "0.4rem 0.85rem",
        fontSize: "0.7rem",
        fontWeight: 700,
        cursor: "pointer",
        flexShrink: 0,
        backgroundColor: "transparent",
      }}
      title="Descargar CSV con todos los datos"
    >
      ↓ CSV
    </button>
  );
}
