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

// Clave localStorage para el write_token de escritura en save-game.
// El servidor lo genera en la primera escritura o lo devuelve al autenticarse.
const WRITE_TOKEN_KEY = "wedding_write_token";

export const getWriteToken = (): string | null => localStorage.getItem(WRITE_TOKEN_KEY);
const setWriteToken = (token: string): void => localStorage.setItem(WRITE_TOKEN_KEY, token);

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

const EDGE_TIMEOUT_MS = 8000;
// save-game lleva el GameState completo (varias decenas de KB). En 3G/4G
// flojo y con cold-start de la edge, 8s se quedaba corto y abortaba con
// AbortError silencioso. Para esa ruta usamos un timeout más generoso.
const SAVE_GAME_TIMEOUT_MS = 15000;

export const callEdge = (
  endpoint: string,
  body: unknown,
  timeoutMs: number = EDGE_TIMEOUT_MS,
) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  return fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
    signal: ctrl.signal,
  }).finally(() => clearTimeout(timer));
};

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
  // No guardar en la nube durante impersonación (modo lectura)
  if (isImpersonating()) return;
  try {
    const writeToken = getWriteToken();
    const res = await callEdge(
      "save-game",
      { userId, gameState, writeToken },
      SAVE_GAME_TIMEOUT_MS,
    );
    // Si el servidor devuelve un writeToken (primera escritura), almacenarlo
    if (res.ok) {
      try {
        const data = await res.json();
        if (typeof data.writeToken === "string") setWriteToken(data.writeToken);
      } catch { /* ignorar error de parseo */ }
    }
  } catch {
    // Silently ignore — local save is still intact
  }
};

// ---- Guardado seguro con verificación ----
//
// Problema: `saveToCloud` es "fire-and-forget"; si la nube fallaba (red,
// cold-start, error de la edge), el juego mostraba igualmente "guardó la
// partida" aunque la copia en la nube NO se hubiera persistido.
//
// Solución: `saveGameVerified` guarda en LOCAL y en la NUBE, y verifica AMBAS:
//   1. Local: reescribe localStorage y lo relee comprobando que existe.
//   2. Nube: tras el save, RELEE la partida y compara una huella (fingerprint)
//      de campos estables. Solo si coincide se considera "verified".
// Devuelve un estado que la UI usa para confirmar o avisar de un problema,
// sin romper la experiencia (el guardado local siempre queda intacto).

export type SaveVerification =
  | { status: "verified" }    // copia en la nube confirmada por relectura
  | { status: "local-only" }  // sin nube / impersonación → solo copia local (no es error)
  | { status: "error"; reason: string }; // se intentó pero no se pudo verificar

interface FingerprintState {
  name?: string;
  map?: string;
  money?: number;
  pos?: { x?: number; y?: number };
  pokemon?: Array<{ id?: number; level?: number; hp?: number }>;
  pc?: unknown[];
  inventory?: Array<{ amount?: number }>;
  completedQuests?: unknown[];
  defeatedTrainers?: unknown[];
  collectedItems?: unknown[];
  caughtPokemon?: unknown[];
}

/**
 * Huella estable de un GameState. Se calcula sobre un subconjunto de campos
 * que viajan sin transformaciones a través de JSONB (números, longitudes,
 * firma del equipo), de modo que la copia releída de la nube produzca la
 * MISMA huella que la que enviamos si —y solo si— se persistió correctamente.
 */
const fingerprintGameState = (raw: unknown): string => {
  const s = (raw ?? {}) as FingerprintState;
  const team = Array.isArray(s.pokemon) ? s.pokemon : [];
  const teamSig = team
    .map((p) => `${p?.id ?? 0}.${p?.level ?? 0}.${p?.hp ?? 0}`)
    .join(",");
  const invTotal = (Array.isArray(s.inventory) ? s.inventory : []).reduce(
    (acc, i) => acc + (i?.amount ?? 0),
    0
  );
  const len = (a: unknown) => (Array.isArray(a) ? a.length : 0);
  return [
    s.name ?? "",
    s.map ?? "",
    s.pos?.x ?? "",
    s.pos?.y ?? "",
    s.money ?? 0,
    team.length,
    teamSig,
    len(s.pc),
    invTotal,
    len(s.completedQuests),
    len(s.defeatedTrainers),
    len(s.collectedItems),
    len(s.caughtPokemon),
  ].join("|");
};

/**
 * Guarda la partida de forma segura y verificada (local + nube).
 * No lanza: cualquier fallo se refleja en el `SaveVerification` devuelto.
 */
export const saveGameVerified = async (
  userId: string | null,
  gameState: unknown
): Promise<SaveVerification> => {
  const s = gameState as { name?: string };

  // 1. Guardado local verificado (relee y comprueba que persistió).
  let localOk = false;
  if (s?.name) {
    try {
      localStorage.setItem(s.name, JSON.stringify(gameState));
      const raw = localStorage.getItem(s.name);
      localOk = !!raw && (JSON.parse(raw) as { name?: string })?.name === s.name;
    } catch {
      localOk = false; // p.ej. cuota llena o modo privado
    }
  }

  // 2. Sin nube disponible (no configurada, sin usuario o impersonación) →
  //    el resultado depende solo del guardado local.
  if (!SUPABASE_URL || !userId || isImpersonating()) {
    return localOk
      ? { status: "local-only" }
      : { status: "error", reason: "local-write-failed" };
  }

  // 3. Guardado en la nube + verificación por relectura de huella.
  const expected = fingerprintGameState(gameState);
  try {
    const writeToken = getWriteToken();
    const res = await callEdge(
      "save-game",
      { userId, gameState, writeToken },
      SAVE_GAME_TIMEOUT_MS
    );
    if (!res.ok) {
      return {
        status: "error",
        reason: localOk ? `cloud-http-${res.status}` : "local+cloud-failed",
      };
    }
    try {
      const data = await res.json();
      if (typeof data.writeToken === "string") setWriteToken(data.writeToken);
    } catch {
      /* respuesta sin writeToken — no crítico */
    }

    const cloud = await loadFromCloud(userId);
    if (!cloud) {
      return { status: "error", reason: localOk ? "cloud-empty-readback" : "local+cloud-failed" };
    }
    if (fingerprintGameState(cloud) !== expected) {
      return { status: "error", reason: localOk ? "cloud-mismatch" : "local+cloud-failed" };
    }
    return { status: "verified" };
  } catch {
    return {
      status: "error",
      reason: localOk ? "cloud-network" : "local+cloud-failed",
    };
  }
};

/**
 * Traduce el resultado de `saveGameVerified` al mensaje que se muestra en la
 * caja de confirmación del juego (mismo estilo Game Boy, sin tecnicismos).
 */
export const describeSaveResult = (
  name: string,
  result: SaveVerification
): string | string[] => {
  switch (result.status) {
    case "verified":
    case "local-only":
      return `¡${name} guardó la partida!`;
    case "error":
      if (result.reason.startsWith("local")) {
        return "¡Error al guardar! Prueba de nuevo.";
      }
      // Local OK, nube falló → 2 páginas para no truncar.
      return [
        `¡${name} guardó la partida!`,
        "No se guardó en la nube. Revisa tu conexión e inténtalo de nuevo.",
      ];
  }
};

export const loadFromCloud = async (userId: string): Promise<unknown | null> => {
  if (!SUPABASE_URL) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), EDGE_TIMEOUT_MS);
  try {
    // El servidor redacta los datos personales (rsvp) salvo que se demuestre
    // posesión de la cuenta con el write_token. Lo enviamos por cabecera (no en
    // la URL, para no filtrarlo en logs): al cargar la PROPIA partida el token
    // coincide y se recibe el estado íntegro; al cargar el equipo de un rival
    // de batalla online no coincide y el rsvp ajeno queda redactado.
    const headers: Record<string, string> = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    };
    const writeToken = getWriteToken();
    if (writeToken) headers["x-write-token"] = writeToken;
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/load-game?userId=${userId}`,
      {
        headers,
        signal: ctrl.signal,
      }
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const { gameState } = await res.json();
    return gameState ?? null;
  } catch {
    clearTimeout(timer);
    return null;
  }
};

// ---- Lista de jugadores (para batallas online) ----

export interface PlayerEntry {
  playerId: string;
  name: string;
  pokemonCount: number;
}

export const listPlayers = async (
  excludeUserId?: string | null
): Promise<PlayerEntry[]> => {
  if (!SUPABASE_URL) return [];
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), EDGE_TIMEOUT_MS);
  try {
    const qs = excludeUserId
      ? `?excludeUserId=${encodeURIComponent(excludeUserId)}`
      : "";
    const res = await fetch(`${SUPABASE_URL}/functions/v1/list-players${qs}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    const { players } = await res.json();
    if (!Array.isArray(players)) return [];
    // Salvaguarda extra en cliente (por si una versión antigua del backend
    // no filtra correctamente).
    return (players as PlayerEntry[]).filter(
      (p) =>
        !!p &&
        typeof p.playerId === "string" &&
        typeof p.name === "string" &&
        (p.pokemonCount ?? 0) > 0 &&
        p.playerId !== excludeUserId
    );
  } catch {
    clearTimeout(timer);
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
        const { userId: confirmedId, writeToken } = await finishRes.json();
        // Almacenar write_token si el servidor ya tenía un save para este usuario
        if (typeof writeToken === "string") setWriteToken(writeToken);
        localStorage.setItem("wedding_user_id", confirmedId);
        return confirmedId;
      }
      // Servidor rechazó el registro — limpiar credencial local para no crear loop
      const errBody = await finishRes.text();
      console.warn("[WebAuthn] register-finish", finishRes.status, errBody);
      localStorage.removeItem("wedding_credential_id");
      // En modo "recover" (existingUserId presente), aunque el servidor falle
      // mantenemos el wedding_user_id apuntando al UUID a recuperar para que
      // el dispositivo quede asociado a esa cuenta (sin passkey, solo localStorage).
      if (existingUserId) {
        localStorage.setItem("wedding_user_id", existingUserId);
        return existingUserId;
      }
      return null;
    } catch (netErr) {
      console.warn("[WebAuthn] register-finish network error:", netErr);
      localStorage.removeItem("wedding_credential_id");
      // Mismo fallback en modo recover ante error de red.
      if (existingUserId) {
        localStorage.setItem("wedding_user_id", existingUserId);
        return existingUserId;
      }
      return null;
    }
  } catch (err) {
    console.warn("[WebAuthn] Registration failed:", err);
    return null;
  }
};

// ---- WebAuthn Authentication ----

// `credentialId` opcional: si se omite (o se pasa null), se inicia una
// autenticación *discoverable* (usernameless) con allowCredentials vacío. El
// sistema operativo ofrece cualquier passkey de este RP (sincronizada vía
// iCloud Keychain / Google Password Manager) aunque localStorage se haya
// borrado. webauthn-auth-finish recupera el user_id buscando por credential_id,
// lo que evita crear una cuenta nueva (y por tanto una partida duplicada).
export const webauthnAuth = async (
  credentialId?: string | null
): Promise<string | null> => {
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
        const { userId, writeToken } = await finishRes.json();
        // Almacenar write_token para escrituras posteriores
        if (typeof writeToken === "string") setWriteToken(writeToken);
        // Re-persistir la credencial usada (importante tras una recuperación
        // discoverable con localStorage borrado: la próxima visita usará la vía
        // rápida sin volver a mostrar el selector de passkeys del sistema).
        localStorage.setItem("wedding_credential_id", assertion.id);
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

// ---- Recovery: subir partida local a la nube si la nube está vacía ----
//
// Caso de uso: usuarios que jugaron mientras existía un bug por el cual el
// RSVP llegaba a Supabase pero la partida no (race condition resuelta en
// migración 006 + secuenciación en OakIntro). Su localStorage del dispositivo
// SÍ contiene la partida (state.name como clave). Este helper la sube en
// silencio la próxima vez que abren el juego, una sola vez por userId.
//
// Reglas defensivas:
//   1. Solo sube si la nube está vacía para ese userId (callback decide).
//   2. Solo escanea claves de localStorage que parsean como GameState válido
//      (evita pisar nada que no sea una partida real).
//   3. Marca un flag `wedding_local_save_uploaded_<userId>` para no repetir
//      el upload en cada arranque (idempotencia, ahorro de cuota).
//   4. No bloquea el flujo: si falla, devuelve null y el usuario sigue.
//   5. NO se ejecuta si el localStorage no tiene una partida válida.

const RECOVER_FLAG_PREFIX = "wedding_local_save_uploaded_";

interface MaybeGameState {
  name?: unknown;
  pos?: { x?: unknown; y?: unknown };
  map?: unknown;
  pokemon?: unknown;
  inventory?: unknown;
}

/**
 * Heurística estricta para detectar una entrada de localStorage que sea un
 * GameState serializado (no un setting random). Comprueba la presencia de los
 * campos críticos con sus tipos esperados.
 */
const looksLikeGameState = (raw: string): unknown | null => {
  if (!raw || raw[0] !== "{") return null;
  try {
    const obj = JSON.parse(raw) as MaybeGameState;
    if (
      obj &&
      typeof obj === "object" &&
      typeof obj.name === "string" &&
      obj.pos &&
      typeof (obj.pos as { x?: unknown }).x === "number" &&
      typeof (obj.pos as { y?: unknown }).y === "number" &&
      typeof obj.map === "string" &&
      Array.isArray(obj.pokemon) &&
      Array.isArray(obj.inventory)
    ) {
      return obj;
    }
  } catch {
    // No es JSON, ignorar.
  }
  return null;
};

export const findLocalGameState = (): unknown | null => {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    // Saltar las claves técnicas del propio sistema.
    if (key.startsWith("wedding_")) continue;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    const candidate = looksLikeGameState(raw);
    if (candidate) return candidate;
  }
  return null;
};

/**
 * Si la nube no tiene partida para `userId` Y el localStorage del dispositivo
 * sí, sube la partida local a la nube (una sola vez por userId).
 *
 * @returns la partida subida si hubo recuperación, o null en caso contrario.
 *          Se devuelve para que el caller pueda usarla como `cloudSave`
 *          inmediatamente sin necesidad de un segundo loadFromCloud.
 */
export const recoverLocalSaveIfNeeded = async (
  userId: string,
): Promise<unknown | null> => {
  if (!userId) return null;
  const flagKey = `${RECOVER_FLAG_PREFIX}${userId}`;
  if (localStorage.getItem(flagKey) === "1") return null;
  const local = findLocalGameState();
  if (!local) return null;
  try {
    await saveToCloud(userId, local);
    // Verificamos releyendo: si después de subir la nube SIGUE vacía algo
    // ha fallado de verdad. No marcamos el flag para reintentar el próximo
    // arranque. Si llegó, marcamos para no repetir.
    const verify = await loadFromCloud(userId);
    if (verify) {
      localStorage.setItem(flagKey, "1");
      return verify;
    }
    return null;
  } catch {
    return null;
  }
};
