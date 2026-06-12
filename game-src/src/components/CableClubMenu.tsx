import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import Frame from "./Frame";
import Menu from "./Menu";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import { selectGameState, selectPokemon } from "../state/gameSlice";
import {
  hideCableClubMenu,
  openLinkRoom,
  selectCableClubMenu,
  showOnlineBattleMenu,
} from "../state/uiSlice";
import {
  getCurrentUserId,
  getWriteToken,
  isImpersonating,
  saveGameVerified,
} from "../app/cloud-save";
import {
  LinkKind,
  LinkSessionError,
  WaitingRoom,
  linkCancel,
  linkCreate,
  linkJoin,
  linkList,
  linkPoll,
} from "../app/link-session";
import Arrow from "./Arrow";

// ─────────────────────────────────────────────────────────────────────────
// Recepcionista del CLUB CABLE (Gen II): la misma científica de los centros
// Pokémon ofrece ahora tres servicios, como en Oro/Plata:
//   · ¡COLISEO!    — combate EN VIVO contra otro invitado conectado.
//   · INTERCAMBIO  — intercambio de Pokémon en tiempo real.
//   · C. OFFLINE   — el combate clásico contra el equipo guardado de un
//                    invitado (controlado por la IA; no requiere que esté
//                    conectado). Es el antiguo "combate online".
//
// Igual que en el original, antes de entrar a una sala SE GUARDA la partida.
// El emparejamiento usa salas: crear una y esperar, o unirse a una abierta.
// ─────────────────────────────────────────────────────────────────────────

const POLL_MS = 2000;
const VISIBLE_ROWS = 7;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 150;
`;

const TextContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 20%;
  z-index: 100;

  @media (max-width: 1000px) {
    height: 30%;
  }
`;

const ListContainer = styled.div`
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  background: var(--bg);
  z-index: 100;
`;

const RowDiv = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  white-space: nowrap;
`;

const ArrowSlot = styled.div`
  width: 4cqw;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ScrollIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 2cqw;
  font-family: "PokemonGB";
  font-size: 2cqw;
  color: black;
`;

type Stage =
  | "greeting"
  | "menu"
  | "saving"
  | "lobby-loading"
  | "lobby"
  | "joining"
  | "waiting"
  | "message";

type RowItem =
  | { kind: "room"; room: WaitingRoom }
  | { kind: "create" }
  | { kind: "exit" };

const CableClubMenu = () => {
  const dispatch = useDispatch();
  const show = useSelector(selectCableClubMenu);
  const gameState = useSelector(selectGameState);
  const pokemon = useSelector(selectPokemon);

  const [stage, setStage] = useState<Stage>("greeting");
  const [message, setMessage] = useState("");
  const [rooms, setRooms] = useState<WaitingRoom[]>([]);
  const [cursor, setCursor] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  const kindRef = useRef<LinkKind>("battle");
  const sessionIdRef = useRef<string | null>(null);
  const joinIdRef = useRef<string | null>(null);
  const busyRef = useRef(false);
  const selectReadyRef = useRef(false);

  const reset = () => {
    setStage("greeting");
    setMessage("");
    setRooms([]);
    setCursor(0);
    setScrollOffset(0);
    sessionIdRef.current = null;
    joinIdRef.current = null;
    busyRef.current = false;
    selectReadyRef.current = false;
  };

  useEffect(() => {
    if (show) reset();
  }, [show]);

  const exitWithMessage = (text: string) => {
    setMessage(text);
    setStage("message");
  };

  const close = () => {
    dispatch(hideCableClubMenu());
    reset();
  };

  // ── Entrar a un servicio en vivo: validar + guardar partida ─────────────
  const enterService = (kind: LinkKind) => {
    if (isImpersonating()) {
      exitWithMessage(
        "El modo administrador no puede usar el CLUB CABLE en nombre de un invitado."
      );
      return;
    }
    if (!getCurrentUserId() || !getWriteToken()) {
      exitWithMessage(
        "Necesitas una partida guardada en la nube para usar el CLUB CABLE. Guarda primero desde el menú."
      );
      return;
    }
    if (pokemon.length === 0) {
      exitWithMessage("¡Necesitas al menos un POKéMON!");
      return;
    }
    if (kind === "battle" && !pokemon.some((p) => p.hp > 0)) {
      exitWithMessage(
        "¡Tus POKéMON están debilitados! Cúralos antes de combatir."
      );
      return;
    }
    kindRef.current = kind;
    setStage("saving");
  };

  // Guardado previo (regla del Club Cable en Gen II) y carga del lobby.
  useEffect(() => {
    if (stage !== "saving" || !show) return;
    let cancelled = false;
    (async () => {
      const userId = getCurrentUserId();
      if (!userId) return exitWithMessage("Error de identidad. Inténtalo de nuevo.");
      const result = await saveGameVerified(userId, gameState);
      if (cancelled) return;
      if (result.status === "error" || result.status === "local-only") {
        exitWithMessage(
          "No se pudo guardar tu partida en la nube. El CLUB CABLE necesita conexión; inténtalo de nuevo."
        );
        return;
      }
      setStage("lobby-loading");
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, show]);

  // Cargar la lista de salas en espera.
  useEffect(() => {
    if (stage !== "lobby-loading" || !show) return;
    let cancelled = false;
    linkList(kindRef.current)
      .then((result) => {
        if (cancelled) return;
        setRooms(result);
        setCursor(0);
        setScrollOffset(0);
        selectReadyRef.current = false;
        setStage("lobby");
        setTimeout(() => {
          selectReadyRef.current = true;
        }, 600);
      })
      .catch(() => {
        if (!cancelled) exitWithMessage("No se pudo conectar. Inténtalo de nuevo.");
      });
    return () => {
      cancelled = true;
    };
  }, [stage, show]);

  // Unirse a una sala existente.
  useEffect(() => {
    if (stage !== "joining" || !show) return;
    const id = joinIdRef.current;
    if (!id) return exitWithMessage("Error al conectar. Inténtalo de nuevo.");
    let cancelled = false;
    linkJoin(id)
      .then((session) => {
        if (cancelled) return;
        dispatch(hideCableClubMenu());
        dispatch(
          openLinkRoom({
            kind: session.kind,
            sessionId: session.id,
            role: "guest",
            opponentName: session.hostName,
          })
        );
      })
      .catch((e) => {
        if (cancelled) return;
        const code = e instanceof LinkSessionError ? e.code : "";
        exitWithMessage(
          code === "SESSION_GONE"
            ? "Esa sala ya no está disponible. ¡Alguien se adelantó!"
            : code === "ALL_FAINTED"
            ? "¡Tus POKéMON están debilitados!"
            : "No se pudo conectar. Inténtalo de nuevo."
        );
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, show]);

  // Crear sala y esperar rival (con polling y cancelación con B).
  useEffect(() => {
    if (stage !== "waiting" || !show) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      const id = sessionIdRef.current;
      if (!id || cancelled) return;
      try {
        const session = await linkPoll(id);
        if (cancelled) return;
        if (session.status === "active") {
          dispatch(hideCableClubMenu());
          dispatch(
            openLinkRoom({
              kind: session.kind,
              sessionId: session.id,
              role: "host",
              opponentName: session.guestName ?? "Invitado",
            })
          );
          return;
        }
        if (session.status !== "waiting") {
          exitWithMessage("La sala se cerró sin visitas. Inténtalo de nuevo.");
          return;
        }
      } catch {
        // Error puntual de red: seguir intentando.
      }
      timer = setTimeout(tick, POLL_MS);
    };

    (async () => {
      try {
        const session = await linkCreate(kindRef.current);
        if (cancelled) {
          linkCancel(session.id);
          return;
        }
        sessionIdRef.current = session.id;
        timer = setTimeout(tick, POLL_MS);
      } catch (e) {
        if (cancelled) return;
        const code = e instanceof LinkSessionError ? e.code : "";
        exitWithMessage(
          code === "ALL_FAINTED"
            ? "¡Tus POKéMON están debilitados!"
            : "No se pudo crear la sala. Inténtalo de nuevo."
        );
      }
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, show]);

  // ── Filas del lobby ──────────────────────────────────────────────────────
  const rows: RowItem[] =
    stage === "lobby"
      ? [
          ...rooms.map((room): RowItem => ({ kind: "room", room })),
          { kind: "create" },
          { kind: "exit" },
        ]
      : [];
  const totalRows = rows.length;

  useEvent(Event.Up, () => {
    if (!show || stage !== "lobby") return;
    setCursor((c) => {
      if (c === 0) return 0;
      const next = c - 1;
      setScrollOffset((s) => (next < s ? next : s));
      return next;
    });
  });

  useEvent(Event.Down, () => {
    if (!show || stage !== "lobby") return;
    setCursor((c) => {
      if (c >= totalRows - 1) return c;
      const next = c + 1;
      setScrollOffset((s) =>
        next >= s + VISIBLE_ROWS ? next - VISIBLE_ROWS + 1 : s
      );
      return next;
    });
  });

  useEvent(Event.A, () => {
    if (!show) return;
    if (stage === "greeting") {
      setStage("menu");
      return;
    }
    if (stage === "message") {
      close();
      return;
    }
    if (stage === "lobby") {
      if (!selectReadyRef.current || busyRef.current) return;
      const row = rows[cursor];
      if (!row) return;
      if (row.kind === "exit") {
        close();
        return;
      }
      busyRef.current = true;
      if (row.kind === "create") {
        setStage("waiting");
      } else {
        joinIdRef.current = row.room.sessionId;
        setStage("joining");
      }
    }
  });

  useEvent(Event.B, () => {
    if (!show) return;
    if (stage === "waiting") {
      const id = sessionIdRef.current;
      if (id) linkCancel(id);
      close();
      return;
    }
    if (stage !== "saving" && stage !== "joining") close();
  });

  if (!show) return null;

  const kindLabel = kindRef.current === "battle" ? "COLISEO" : "INTERCAMBIO";
  const frameText =
    stage === "greeting"
      ? "¡Bienvenido al CLUB CABLE! Aquí puedes combatir o intercambiar POKéMON con otros invitados."
      : stage === "menu"
      ? "¿Qué deseas hacer?"
      : stage === "saving"
      ? "Antes de entrar hay que guardar la partida... ¡NO APAGUES LA CONSOLA!"
      : stage === "lobby-loading"
      ? "Conectando con el CLUB CABLE..."
      : stage === "lobby"
      ? rooms.length > 0
        ? `Salas de ${kindLabel} abiertas. Elige una o crea la tuya.`
        : `No hay salas de ${kindLabel} abiertas. ¡Crea una y espera a otro invitado!`
      : stage === "joining"
      ? "Conectando con la sala..."
      : stage === "waiting"
      ? `Sala de ${kindLabel} abierta. Esperando a otro invitado... (B para cancelar)`
      : message;

  const visibleRows = rows.slice(scrollOffset, scrollOffset + VISIBLE_ROWS);
  const hasMoreAbove = scrollOffset > 0;
  const hasMoreBelow = scrollOffset + VISIBLE_ROWS < totalRows;

  return (
    <Overlay>
      <Menu
        show={stage === "menu"}
        noExitOption
        close={close}
        menuItems={[
          { label: "¡COLISEO!", action: () => enterService("battle") },
          { label: "INTERCAMBIO", action: () => enterService("trade") },
          {
            label: "C. OFFLINE",
            action: () => {
              // Combate clásico contra el equipo guardado de un invitado
              // (IA local, no requiere que el rival esté conectado).
              dispatch(hideCableClubMenu());
              dispatch(showOnlineBattleMenu());
            },
          },
          { label: "SALIR", action: close },
        ]}
        top="0"
        right="0"
      />

      {stage === "lobby" && (
        <ListContainer>
          <ul
            className="framed buttons"
            style={{ width: "100%", paddingRight: "0", margin: 0 }}
          >
            {hasMoreAbove && (
              <li style={{ listStyle: "none" }}>
                <ScrollIndicator>▲</ScrollIndicator>
              </li>
            )}
            {visibleRows.map((row, visIdx) => {
              const globalIdx = scrollOffset + visIdx;
              const isActive = globalIdx === cursor;
              const label =
                row.kind === "exit"
                  ? "Salir"
                  : row.kind === "create"
                  ? "¡CREAR SALA!"
                  : `Sala de ${row.room.hostName}`;
              return (
                <li
                  key={
                    row.kind === "room"
                      ? row.room.sessionId
                      : `__${row.kind}__`
                  }
                  style={{ position: "relative" }}
                >
                  <RowDiv>
                    <ArrowSlot>
                      <Arrow menu show={isActive} />
                    </ArrowSlot>
                    <span
                      style={{
                        paddingRight: "1cqw",
                        fontFamily: "PokemonGB",
                        fontSize: "2cqw",
                      }}
                    >
                      {label}
                    </span>
                  </RowDiv>
                </li>
              );
            })}
            {hasMoreBelow && (
              <li style={{ listStyle: "none" }}>
                <ScrollIndicator>▼</ScrollIndicator>
              </li>
            )}
          </ul>
        </ListContainer>
      )}

      <TextContainer>
        <Frame
          wide
          tall
          flashing={["greeting", "message"].includes(stage)}
        >
          {frameText}
        </Frame>
      </TextContainer>
    </Overlay>
  );
};

export default CableClubMenu;
