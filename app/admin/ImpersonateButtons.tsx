"use client";

import { useState } from "react";

interface Props {
  userId: string;
  playerName: string;
}

/**
 * Botones para impersonar la cuenta de un invitado desde el admin.
 *
 * - "Jugar puntualmente" → abre `/?play_as=UUID`. El juego carga la partida
 *   de ese UUID y los autoguardados van a su cuenta cloud, pero NO modifica
 *   el `wedding_user_id` del localStorage del dispositivo. Al recargar
 *   normal, vuelves a tu propia cuenta.
 *
 * - "Recuperar partida" → abre `/?recover=UUID`. Igual que el anterior,
 *   pero en la pantalla de carga aparece la opción "Vincular Face ID/Huella"
 *   que registra una nueva passkey de este dispositivo asociada a ese UUID.
 *   Tras vincular, ese dispositivo queda enlazado permanentemente a esa cuenta.
 */
export default function ImpersonateButtons({ userId, playerName }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const playAsUrl = typeof window !== "undefined"
    ? `${window.location.origin}/?play_as=${encodeURIComponent(userId)}`
    : `/?play_as=${userId}`;
  const recoverUrl = typeof window !== "undefined"
    ? `${window.location.origin}/?recover=${encodeURIComponent(userId)}`
    : `/?recover=${userId}`;

  const copy = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore
    }
  };

  const btnStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    borderRadius: 8,
    fontSize: "0.78rem",
    fontWeight: 700,
    border: "1px solid transparent",
    cursor: "pointer",
    fontFamily: "inherit",
    textDecoration: "none",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        marginTop: "0.95rem",
        borderTop: "1px solid #f5f2ea",
        paddingTop: "0.85rem",
      }}
    >
      <div
        style={{
          fontSize: "0.62rem",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          color: "#bbb",
          fontWeight: 700,
          marginBottom: "0.55rem",
        }}
      >
        Acciones · {playerName}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
        <a
          href={playAsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...btnStyle, background: "#1a3a2a", color: "#fff" }}
          title="Abre el juego con esta cuenta. No vincula credenciales al dispositivo."
        >
          🎮 Jugar puntualmente
        </a>
        <button
          type="button"
          onClick={() => copy(playAsUrl, "play")}
          style={{ ...btnStyle, background: "#f0ede0", color: "#666" }}
          title="Copiar enlace de juego puntual"
        >
          {copied === "play" ? "✓ Copiado" : "📋 Copiar"}
        </button>

        <a
          href={recoverUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...btnStyle, background: "#5050b0", color: "#fff" }}
          title="Abre el juego y permite vincular Face ID/Huella de este dispositivo a la cuenta."
        >
          🔑 Recuperar partida
        </a>
        <button
          type="button"
          onClick={() => copy(recoverUrl, "recover")}
          style={{ ...btnStyle, background: "#f0ede0", color: "#666" }}
          title="Copiar enlace de recuperación"
        >
          {copied === "recover" ? "✓ Copiado" : "📋 Copiar"}
        </button>
      </div>
      <div
        style={{
          marginTop: "0.55rem",
          fontSize: "0.65rem",
          color: "#aaa",
          lineHeight: 1.45,
        }}
      >
        <strong>Jugar puntualmente:</strong> autoguardado en esta cuenta cloud, sin tocar el Face ID del dispositivo.
        <br />
        <strong>Recuperar partida:</strong> incluye opción para vincular Face ID/Huella a esta cuenta.
      </div>
    </div>
  );
}
