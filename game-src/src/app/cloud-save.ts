// Cloud save utilities — Supabase Edge Functions + WebAuthn passkey
// All API calls go through Supabase Edge Functions hosted in supabase/functions/

const SUPABASE_URL =
  (process.env.REACT_APP_SUPABASE_URL as string | undefined) ||
  "https://kplfjrjibjptigvfgdvy.supabase.co";

const SUPABASE_ANON_KEY =
  (process.env.REACT_APP_SUPABASE_ANON_KEY as string | undefined) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwbGZqcmppYmpwdGlndmZnZHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1OTMxNjMsImV4cCI6MjA5MzE2OTE2M30.lOgErwiQHTp98A3a7Z3ZotvYKmdxbwScNFgN_9lOijM";

// In-memory current user ID (also persisted in localStorage)
// Se inicializa con el valor de localStorage para que persista entre recargas.
let currentUserId: string | null = localStorage.getItem("wedding_user_id");

// Impersonation: cuando se entra al juego con ?play_as=UUID o ?recover=UUID
// desde el admin, este ID toma precedencia sobre el de localStorage SIN sobreescribirlo,
// de forma que la próxima recarga normal vuelve a la cuenta original del dispositivo.
let impersonatedUserId: string | null = null;
let impersonationMode: "none" | "play_as" | "recover" = "none";

export const setImpersonatedUserId = (
  id: string,
  mode: "play_as" | "recover"
) => {
  impersonatedUserId = id;
  impersonationMode = mode;
  // No tocamos localStorage — el dispositivo conserva su identidad original.
};

export const getImpersonationMode = () => impersonationMode;
export const isImpersonating = () => impersonatedUserId !== null;

export const setCurrentUserId = (id: string) => {
  currentUserId = id;
  localStorage.setItem("wedding_user_id", id);
};

export const getCurrentUserId = () => impersonatedUserId ?? currentUserId;

export const isWebAuthnAvailable = (): boolean => {
  if (!SUPABASE_URL || !window.PublicKeyCredential) return false;
  return (
    typeof navigator.credentials?.create === "function" &&
    typeof navigator.credentials?.get === "function"
  );
};

// ---- Low-level helpers ----

const callEdge = (endpoint: string, body: unknown) =>
  fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });

const base64urlToBuffer = (base64url: string): ArrayBuffer => {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
};

const bufferToBase64url = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
};

// ---- Cloud save / load ----

export const saveToCloud = async (
  userId: string,
  gameState: unknown
): Promise<void> => {
  if (!SUPABASE_URL) return;
  try {
    await callEdge("save-game", { userId, gameState });
  } catch {
    // Silently ignore — local save is still intact
  }
};

export const loadFromCloud = async (userId: string): Promise<unknown | null> => {
  if (!SUPABASE_URL) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/load-game?userId=${userId}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (!res.ok) return null;
    const { gameState } = await res.json();
    return gameState ?? null;
  } catch {
    return null;
  }
};

// ---- Lista de jugadores (para batallas online) ----

export interface PlayerEntry {
  playerId: string;
  name: string;
  pokemonCount: number;
}

export const listPlayers = async (): Promise<PlayerEntry[]> => {
  if (!SUPABASE_URL) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/list-players`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) return [];
    const { players } = await res.json();
    return (players ?? []) as PlayerEntry[];
  } catch {
    return [];
  }
};

// ---- Guardar RSVP ----

export interface RSVPPayload {
  playerName: string;
  companion: string | null;
  children: number;
  allergies: string | null;
  busOutbound: "none" | "club-tenis" | "pio-xii" | "ardoi";
  busReturn: "none" | "23:00" | "01:30";
  preboda: boolean;
  attended: boolean;
}

export const saveRsvp = async (
  userId: string,
  rsvp: RSVPPayload
): Promise<void> => {
  if (!SUPABASE_URL || !userId) {
    console.error("[saveRsvp] Skipped: no SUPABASE_URL or userId");
    return;
  }
  try {
    const res = await callEdge("save-rsvp", { userId, rsvp });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[saveRsvp] HTTP ${res.status}:`, body);
    }
  } catch (e) {
    console.error("[saveRsvp] Network error:", e);
  }
};

// ---- User creation (guest UUID) ----

export const createUser = async (): Promise<string | null> => {
  if (!SUPABASE_URL) return null;
  try {
    const res = await callEdge("create-user", {});
    if (!res.ok) return null;
    const { userId } = await res.json();
    localStorage.setItem("wedding_user_id", userId);
    return userId;
  } catch {
    return null;
  }
};

// ---- WebAuthn Registration ----

/**
 * Registra una nueva passkey.
 * - Sin argumentos: crea un nuevo wedding_user anónimo (flujo normal).
 * - Con `existingUserId`: añade la passkey de este dispositivo al user_id dado
 *   (modo "Recuperar partida" desde el admin).
 *
 * En ambos casos, al finalizar OK, persiste `wedding_user_id` y `wedding_credential_id`
 * en localStorage (el dispositivo queda enlazado a esa cuenta).
 */
export const webauthnRegister = async (
  existingUserId?: string
): Promise<string | null> => {
  try {
    const startBody = existingUserId ? { userId: existingUserId } : {};
    const startRes = await callEdge("webauthn-register-start", startBody);
    if (!startRes.ok) return null;
    const { challengeId, userId, options } = await startRes.json();

    const pubKeyOptions: PublicKeyCredentialCreationOptions = {
      ...options,
      challenge: base64urlToBuffer(options.challenge),
      user: {
        ...options.user,
        id: base64urlToBuffer(options.user.id),
      },
      excludeCredentials: (options.excludeCredentials ?? []).map(
        (c: { id: string; type: string }) => ({
          ...c,
          id: base64urlToBuffer(c.id),
        })
      ),
    };

    const credential = await navigator.credentials.create({
      publicKey: pubKeyOptions,
    }) as PublicKeyCredential | null;
    if (!credential) return null;

    // Face ID / huella pasó en el dispositivo.
    // Guardar credencial localmente ANTES de la verificación del servidor.
    // Si el servidor falla (ej. RP_ORIGIN incorrecto), el usuario puede jugar igualmente.
    const localUserId = userId || crypto.randomUUID();
    localStorage.setItem("wedding_user_id", localUserId);
    localStorage.setItem("wedding_credential_id", credential.id);

    const response = credential.response as AuthenticatorAttestationResponse;
    const credentialJSON = {
      id: credential.id,
      rawId: bufferToBase64url(credential.rawId),
      type: credential.type,
      response: {
        attestationObject: bufferToBase64url(response.attestationObject),
        clientDataJSON: bufferToBase64url(response.clientDataJSON),
        transports: response.getTransports?.() ?? [],
      },
      clientExtensionResults: credential.getClientExtensionResults(),
    };

    // Intentar verificación en el servidor
    try {
      const finishRes = await callEdge("webauthn-register-finish", {
        challengeId,
        userId,
        credential: credentialJSON,
      });
      if (finishRes.ok) {
        const { userId: confirmedId } = await finishRes.json();
        localStorage.setItem("wedding_user_id", confirmedId);
        return confirmedId;
      }
      // Servidor rechazó el registro — limpiar credencial local para no crear loop
      const errBody = await finishRes.text();
      console.warn("[WebAuthn] register-finish", finishRes.status, errBody);
      localStorage.removeItem("wedding_credential_id");
      return null;
    } catch (netErr) {
      console.warn("[WebAuthn] register-finish network error:", netErr);
      localStorage.removeItem("wedding_credential_id");
      return null;
    }
  } catch (err) {
    console.warn("[WebAuthn] Registration failed:", err);
    return null;
  }
};

// ---- WebAuthn Authentication ----

export const webauthnAuth = async (credentialId: string): Promise<string | null> => {
  try {
    const startRes = await callEdge("webauthn-auth-start", { credentialId });
    if (!startRes.ok) return null;
    const { challengeId, options } = await startRes.json();

    const pubKeyOptions: PublicKeyCredentialRequestOptions = {
      ...options,
      challenge: base64urlToBuffer(options.challenge),
      allowCredentials: (options.allowCredentials ?? []).map(
        (c: { id: string; type: string }) => ({
          ...c,
          id: base64urlToBuffer(c.id),
        })
      ),
    };

    const assertion = await navigator.credentials.get({
      publicKey: pubKeyOptions,
    }) as PublicKeyCredential | null;
    if (!assertion) return null;

    // Face ID / huella pasó en el dispositivo.
    // Guardar el userId local como fallback antes de verificar con el servidor.
    const localUserId = localStorage.getItem("wedding_user_id");

    const response = assertion.response as AuthenticatorAssertionResponse;
    const assertionJSON = {
      id: assertion.id,
      rawId: bufferToBase64url(assertion.rawId),
      type: assertion.type,
      response: {
        authenticatorData: bufferToBase64url(response.authenticatorData),
        clientDataJSON: bufferToBase64url(response.clientDataJSON),
        signature: bufferToBase64url(response.signature),
        userHandle: response.userHandle
          ? bufferToBase64url(response.userHandle)
          : null,
      },
      clientExtensionResults: assertion.getClientExtensionResults(),
    };

    // Intentar verificación en el servidor
    try {
      const finishRes = await callEdge("webauthn-auth-finish", {
        challengeId,
        credential: assertionJSON,
      });
      if (finishRes.ok) {
        const { userId } = await finishRes.json();
        console.info("[WebAuthn] auth-finish OK →", userId);
        return userId;
      } else {
        const errBody = await finishRes.text();
        console.warn("[WebAuthn] auth-finish", finishRes.status, errBody);
        try {
          const parsed = JSON.parse(errBody);
          if (parsed.error === "Credential not found") {
            // La passkey existe en el dispositivo pero no en el servidor.
            // Limpiar para forzar re-registro en el próximo intento.
            localStorage.removeItem("wedding_credential_id");
            console.info("[WebAuthn] credential_id limpiado — se pedirá re-registro");
            return null;
          }
        } catch { /* no JSON */ }
      }
    } catch (netErr) {
      console.warn("[WebAuthn] auth-finish network error:", netErr);
    }

    // El dispositivo autenticó al usuario → usar userId local
    return localUserId;
  } catch (err) {
    console.warn("[WebAuthn] Auth failed:", err);
    return null;
  }
};
