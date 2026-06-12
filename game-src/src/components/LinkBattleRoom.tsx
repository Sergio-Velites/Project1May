import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import Frame from "./Frame";
import Menu from "./Menu";
import HealthBar from "./HealthBar";
import PixelImage from "../styles/PixelImage";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import { closeLinkRoom, selectLinkRoom } from "../state/uiSlice";
import {
  LinkBattleAction,
  LinkBattleEvent,
  LinkResolution,
  LinkRole,
  LinkSession,
  linkAct,
  linkCancel,
  linkPoll,
  linkResolve,
  secondsLeft,
} from "../app/link-session";
import {
  LinkBattleSim,
  createLinkBattleSim,
  resolveLinkTurn,
} from "../app/link-battle-engine";
import { getPokemonMetadata } from "../app/use-pokemon-metadata";
import { getPokemonStats } from "../app/use-pokemon-stats";
import { getMoveMetadata } from "../app/use-move-metadata";
import { getMoveSfxPath } from "../app/move-sfx-map";
import { genderSymbol } from "../app/gender-helper";
import { playCry } from "../app/pokemon-cry";
import { BattleStatus, PokemonInstance } from "../state/state-types";

// ─────────────────────────────────────────────────────────────────────────
// COLISEO del Club Cable (Gen II): combate EN VIVO entre dos invitados.
//
// Arquitectura anti-desincronización: los DOS jugadores eligen acción y el
// ANFITRIÓN resuelve el turno con el motor (link-battle-engine) publicando
// una lista de eventos; ambos clientes REPRODUCEN exactamente los mismos
// eventos y adoptan el snapshot del host. El invitado nunca calcula nada.
//
// Reglas (fieles a Oro/Plata):
//   · Sin objetos de la mochila; los equipados sí actúan.
//   · Huir = rendirse (gana el rival).
//   · Se combate con COPIAS: tu equipo real queda intacto al salir.
//   · 1 minuto por decisión: si no respondes, pierdes el combate.
// ─────────────────────────────────────────────────────────────────────────

const POLL_MS = 2000;
const MSG_MS = 1400;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--bg);
  z-index: 200;
  padding-top: 0.8cqw;
  display: flex;
  flex-direction: column;
`;

const BattleArea = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 70%;
`;

const Row = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  flex: 1;
`;

const LeftInfoSection = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-left: 5%;
`;

const RightInfoSection = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  margin-right: 5%;
  position: relative;
`;

const Name = styled.div`
  font-size: 3.5cqw;
  font-family: "PokemonGB";
  text-transform: uppercase;
`;

const OwnerName = styled.div`
  font-size: 2cqw;
  font-family: "PokemonGB";
  text-transform: uppercase;
  opacity: 0.75;
`;

const Level = styled.div`
  font-size: 3.2cqw;
  margin: 0 7.5cqw;
  font-family: "PressStart2P", sans-serif;
`;

const HealthBarContainer = styled.div`
  margin: 0 2.1cqw;
  margin-top: 0.8cqw;
`;

const Health = styled.div`
  font-family: "PokemonGB";
  font-size: 3.5cqw;
  margin: 0 2.1cqw;
  margin-top: 0.8cqw;
`;

const StatusBadge = styled.span<{ $color: string }>`
  font-family: "PokemonGB";
  font-size: 1.7cqw;
  background: ${(p) => p.$color};
  color: #fff;
  padding: 0.15cqw 0.7cqw;
  letter-spacing: 0.05em;
`;

const ImageContainer = styled.div`
  height: 100%;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
`;

const PlayerImageContainer = styled(ImageContainer)`
  align-items: flex-start;
  overflow: visible;
`;

const SpriteImage = styled(PixelImage)`
  height: 100%;
`;

const TextContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 30%;
  z-index: 100;
`;

const Countdown = styled.div<{ $urgent?: boolean }>`
  position: absolute;
  top: 1cqw;
  left: 2cqw;
  font-family: "PokemonGB";
  font-size: ${(p) => (p.$urgent ? "3cqw" : "2.4cqw")};
  color: ${(p) => (p.$urgent ? "#c02020" : "black")};
  z-index: 110;
`;

const STATUS_LABEL: Record<string, [string, string]> = {
  sleep: ["SLP", "#7070c0"],
  freeze: ["FRZ", "#60a0d0"],
  paralysis: ["PAR", "#c0a000"],
  burn: ["BRN", "#c04020"],
  poison: ["PSN", "#a040a0"],
  "badly-poisoned": ["TOX", "#800080"],
};

type Phase =
  | "loading"
  | "intro"
  | "choosing"
  | "move-select"
  | "switch-select"
  | "forced-switch"
  | "confirm-forfeit"
  | "waiting"
  | "animating"
  | "ended";

interface Mirror {
  hostParty: PokemonInstance[];
  guestParty: PokemonInstance[];
  hostActiveIndex: number;
  guestActiveIndex: number;
  hostStatus: BattleStatus | null;
  guestStatus: BattleStatus | null;
  /** HP "visual" del activo de cada bando (los eventos hp lo van moviendo). */
  hostHp: number;
  guestHp: number;
}

const LinkBattleRoom = () => {
  const dispatch = useDispatch();
  const room = useSelector(selectLinkRoom);

  const show = !!room && room.kind === "battle";
  const myRole: LinkRole = room?.role ?? "host";
  const theirRole: LinkRole = myRole === "host" ? "guest" : "host";
  const opponentName = room?.opponentName ?? "Invitado";

  const [phase, setPhase] = useState<Phase>("loading");
  const [mirror, setMirror] = useState<Mirror | null>(null);
  const [text, setText] = useState("Conectando con el COLISEO...");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [endText, setEndText] = useState<string | null>(null);

  const phaseRef = useRef<Phase>("loading");
  phaseRef.current = phase;
  const mirrorRef = useRef<Mirror | null>(null);
  mirrorRef.current = mirror;
  const simRef = useRef<LinkBattleSim | null>(null);
  const sessionRef = useRef<LinkSession | null>(null);
  const lastPlayedTurnRef = useRef(0);
  const resolvingRef = useRef(false);
  const pendingResolutionRef = useRef<LinkResolution | null>(null);
  const actedTurnRef = useRef(0);
  const namesRef = useRef<{ host: string; guest: string }>({
    host: "Anfitrión",
    guest: "Invitado",
  });

  const exit = useCallback(() => {
    dispatch(closeLinkRoom());
  }, [dispatch]);

  // ── Inicialización ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!show) return;
    setPhase("loading");
    setMirror(null);
    setEndText(null);
    setText("Conectando con el COLISEO...");
    simRef.current = null;
    sessionRef.current = null;
    lastPlayedTurnRef.current = 0;
    resolvingRef.current = false;
    actedTurnRef.current = 0;
  }, [show, room?.sessionId]);

  const initFromSession = useCallback(
    (s: LinkSession) => {
      const hostParty = s.hostParty ?? [];
      const guestParty = s.guestParty ?? [];
      namesRef.current = {
        host: s.hostName,
        guest: s.guestName ?? "Invitado",
      };
      // Reanudación (la app se recargó a mitad de combate): los índices
      // activos vienen del último snapshot del host; en un combate recién
      // empezado no hay resolución y se usa el primer Pokémon vivo.
      const resumed = s.turn > 1 || !!s.resolution;
      const hostActiveIndex =
        s.resolution?.hostActiveIndex ??
        Math.max(0, hostParty.findIndex((p) => p.hp > 0));
      const guestActiveIndex =
        s.resolution?.guestActiveIndex ??
        Math.max(0, guestParty.findIndex((p) => p.hp > 0));
      // No re-reproducir la última resolución ya vista antes de la recarga.
      lastPlayedTurnRef.current = s.resolution?.turn ?? 0;
      setMirror({
        hostParty,
        guestParty,
        hostActiveIndex,
        guestActiveIndex,
        hostStatus: hostParty[hostActiveIndex]?.status ?? null,
        guestStatus: guestParty[guestActiveIndex]?.status ?? null,
        hostHp: hostParty[hostActiveIndex]?.hp ?? 0,
        guestHp: guestParty[guestActiveIndex]?.hp ?? 0,
      });
      if (myRole === "host") {
        // Al reanudar, el host reconstruye la simulación desde el snapshot:
        // los volátiles (stages, confusión, Protect…) se pierden — degradación
        // documentada y preferible a perder el combate por timeout.
        const sim = createLinkBattleSim(hostParty, guestParty, {
          host: s.hostName,
          guest: s.guestName ?? "Invitado",
        });
        sim.host.activeIndex = hostActiveIndex;
        sim.guest.activeIndex = guestActiveIndex;
        simRef.current = sim;
      }
      setPhase("intro");
      setText(
        resumed
          ? `¡De vuelta al combate contra ${opponentName}!`
          : `¡Comienza el combate contra ${s.guestName && myRole === "host" ? s.guestName : s.hostName}!`
      );
      const enemyParty = myRole === "host" ? guestParty : hostParty;
      const enemyActive = enemyParty[myRole === "host" ? guestActiveIndex : hostActiveIndex];
      if (enemyActive) playCry(enemyActive.id);
      // Fase inicial tras la intro: si ya había actuado este turno → esperar;
      // si el último turno me dejó KO pendiente de cambio → cambio forzado.
      const myAction = myRole === "host" ? s.hostAction : s.guestAction;
      const needMySwitch = !!s.resolution?.needSwitch?.[myRole] && !myAction;
      setTimeout(() => {
        if (phaseRef.current !== "intro") return;
        if (s.phase === "resolving" || myAction) {
          if (myAction) actedTurnRef.current = s.turn;
          setPhase("waiting");
          setText(`Esperando a ${opponentName}...`);
        } else if (needMySwitch) {
          setPhase("forced-switch");
          setText("¿A cuál POKéMON mandas?");
        } else {
          setPhase("choosing");
        }
      }, 2000);
    },
    [myRole, opponentName]
  );

  // ── Reproducir los eventos de una resolución ─────────────────────────────
  const playResolution = useCallback(
    (resolution: LinkResolution) => {
      lastPlayedTurnRef.current = resolution.turn;
      setPhase("animating");
      const events: LinkBattleEvent[] = resolution.events ?? [];

      const applyEvent = (e: LinkBattleEvent) => {
        const m = mirrorRef.current;
        if (!m) return;
        if (e.t === "msg") {
          setText(e.text);
        } else if (e.t === "hp") {
          setMirror({
            ...m,
            hostHp: e.side === "host" ? e.hp : m.hostHp,
            guestHp: e.side === "guest" ? e.hp : m.guestHp,
          });
        } else if (e.t === "status") {
          setMirror({
            ...m,
            hostStatus: e.side === "host" ? (e.status as BattleStatus | null) : m.hostStatus,
            guestStatus: e.side === "guest" ? (e.status as BattleStatus | null) : m.guestStatus,
          });
        } else if (e.t === "switch") {
          const party = e.side === "host" ? m.hostParty : m.guestParty;
          const mon = party[e.index];
          if (mon) playCry(mon.id);
          setMirror({
            ...m,
            hostActiveIndex: e.side === "host" ? e.index : m.hostActiveIndex,
            guestActiveIndex: e.side === "guest" ? e.index : m.guestActiveIndex,
            hostHp: e.side === "host" ? mon?.hp ?? 0 : m.hostHp,
            guestHp: e.side === "guest" ? mon?.hp ?? 0 : m.guestHp,
            hostStatus: e.side === "host" ? mon?.status ?? null : m.hostStatus,
            guestStatus: e.side === "guest" ? mon?.status ?? null : m.guestStatus,
          });
        } else if (e.t === "anim") {
          const sfxPath = getMoveSfxPath(e.moveId);
          if (sfxPath) {
            const sfx = new Audio(sfxPath);
            sfx.volume = 0.55;
            sfx.play().catch(() => {});
          }
        } else if (e.t === "faint") {
          const party = e.side === "host" ? m.hostParty : m.guestParty;
          const idx = e.side === "host" ? m.hostActiveIndex : m.guestActiveIndex;
          const mon = party[idx];
          if (mon) playCry(mon.id);
        }
      };

      // Reproducción secuencial: los mensajes marcan el ritmo; el resto de
      // eventos se aplican inmediatamente tras el mensaje anterior.
      let delay = 200;
      for (const e of events) {
        const eventDelay = delay;
        setTimeout(() => applyEvent(e), eventDelay);
        if (e.t === "msg") delay += MSG_MS;
        else if (e.t === "anim") delay += 500;
      }

      // Al terminar: adoptar el snapshot del host y decidir la siguiente fase.
      setTimeout(() => {
        setMirror({
          hostParty: resolution.hostParty,
          guestParty: resolution.guestParty,
          hostActiveIndex: resolution.hostActiveIndex,
          guestActiveIndex: resolution.guestActiveIndex,
          hostStatus:
            resolution.hostParty[resolution.hostActiveIndex]?.status ?? null,
          guestStatus:
            resolution.guestParty[resolution.guestActiveIndex]?.status ?? null,
          hostHp: resolution.hostParty[resolution.hostActiveIndex]?.hp ?? 0,
          guestHp: resolution.guestParty[resolution.guestActiveIndex]?.hp ?? 0,
        });
        if (resolution.winner) {
          finishBattle(resolution.winner, "battle-ended");
          return;
        }
        if (resolution.needSwitch[myRole]) {
          setPhase("forced-switch");
          setText("¿A cuál POKéMON mandas?");
        } else if (resolution.needSwitch[theirRole]) {
          // El rival debe sacar Pokémon; yo "espero" (acción automática).
          setPhase("waiting");
          submitAction({ type: "wait" });
          setText(`Esperando a que ${opponentName} saque un POKéMON...`);
        } else {
          setPhase("choosing");
        }
      }, delay + 400);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [myRole, opponentName, theirRole]
  );

  // ── Fin del combate ──────────────────────────────────────────────────────
  const finishBattle = useCallback(
    (winner: LinkRole | "draw" | null, reason: string | null) => {
      let msg: string;
      if (winner === "draw") {
        msg = "¡Empate! Ambos equipos quedaron fuera de combate.";
      } else if (winner === myRole) {
        msg =
          reason === "forfeit"
            ? `¡${opponentName} se rindió! ¡Has ganado!`
            : reason === "timeout"
            ? `¡${opponentName} no respondió en 1 minuto! ¡Has ganado!`
            : `¡Has ganado el combate contra ${opponentName}!`;
      } else if (winner === theirRole) {
        msg =
          reason === "timeout"
            ? "No respondiste a tiempo (1 min). Has perdido el combate."
            : `Has perdido el combate contra ${opponentName}...`;
      } else {
        msg = "El combate se canceló.";
      }
      setEndText(
        `${msg} Tus POKéMON quedan como estaban antes de entrar (combate de enlace).`
      );
      setPhase("ended");
    },
    [myRole, opponentName, theirRole]
  );

  // ── Enviar acción ────────────────────────────────────────────────────────
  const submitAction = useCallback(
    (action: LinkBattleAction) => {
      if (!room) return;
      const s = sessionRef.current;
      const turn = s?.turn ?? 1;
      if (actedTurnRef.current === turn && action.type !== "forfeit") return;
      actedTurnRef.current = turn;
      if (action.type !== "wait") setPhase("waiting");
      if (action.type !== "wait") setText(`Esperando a ${opponentName}...`);
      linkAct(room.sessionId, action).catch(() => {
        // Reintento manual: devolver el control al jugador.
        actedTurnRef.current = 0;
        if (phaseRef.current === "waiting") setPhase("choosing");
      });
    },
    [opponentName, room]
  );

  // ── Resolver turno (solo host) ───────────────────────────────────────────
  const hostResolve = useCallback(
    async (s: LinkSession) => {
      if (myRole !== "host" || !simRef.current || resolvingRef.current) return;
      if (!s.hostAction || !s.guestAction) return;
      resolvingRef.current = true;
      try {
        // El motor MUTA la simulación: si la publicación falla, en el
        // reintento hay que reenviar la resolución ya calculada, nunca
        // recalcularla (doble daño).
        let resolution = pendingResolutionRef.current;
        if (!resolution || resolution.turn !== s.turn) {
          const outcome = resolveLinkTurn(simRef.current, {
            host: s.hostAction,
            guest: s.guestAction,
          });
          const sim = simRef.current;
          resolution = {
            turn: s.turn,
            events: outcome.events,
            hostParty: sim.host.party,
            guestParty: sim.guest.party,
            hostActiveIndex: sim.host.activeIndex,
            guestActiveIndex: sim.guest.activeIndex,
            needSwitch: outcome.needSwitch,
            winner: outcome.winner,
          };
          pendingResolutionRef.current = resolution;
        }
        await linkResolve(s.id, resolution);
        pendingResolutionRef.current = null;
        playResolution(resolution);
      } catch {
        // Si falla la publicación, el poll volverá a intentarlo (la fase
        // sigue en "resolving" hasta que el servidor acepte la resolución).
      } finally {
        resolvingRef.current = false;
      }
    },
    [myRole, playResolution]
  );

  // ── Bucle de polling ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!show || !room) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (cancelled) return;
      try {
        const s = await linkPoll(room.sessionId);
        if (cancelled) return;
        sessionRef.current = s;
        setCountdown(s.status === "active" ? Math.min(60, secondsLeft(s)) : null);

        const current = phaseRef.current;

        if (current === "loading" && s.status === "active") {
          initFromSession(s);
        } else if (s.status === "finished" || s.status === "cancelled") {
          if (current !== "ended" && current !== "animating") {
            // El final "natural" (battle-ended) ya lo anuncia la resolución;
            // aquí llegan rendiciones, timeouts y cancelaciones.
            if (s.endReason !== "battle-ended") {
              finishBattle(s.winner, s.endReason);
            } else if (
              s.resolution &&
              s.resolution.turn > lastPlayedTurnRef.current
            ) {
              playResolution(s.resolution);
            }
          }
        } else if (s.status === "active" && current !== "animating") {
          if (
            s.resolution &&
            s.resolution.turn > lastPlayedTurnRef.current
          ) {
            // Resolución nueva del host → reproducirla (guest, o host que
            // recarga). El host normal ya la reprodujo localmente.
            playResolution(s.resolution);
          } else if (s.phase === "resolving" && myRole === "host") {
            hostResolve(s);
          }
        }
      } catch {
        // Error de red puntual: reintentar.
      }
      timer = setTimeout(tick, POLL_MS);
    };

    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, room?.sessionId]);

  // Contador local de 1s entre polls.
  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      const s = sessionRef.current;
      if (s && s.status === "active") {
        setCountdown(Math.min(60, secondsLeft(s)));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [show]);

  useEvent(Event.A, () => {
    if (!show) return;
    if (phase === "ended") {
      exit();
    }
  });

  if (!show || !room) return null;

  // ── Datos de render ──────────────────────────────────────────────────────
  const m = mirror;
  const myParty = m ? (myRole === "host" ? m.hostParty : m.guestParty) : [];
  const myActiveIdx = m
    ? myRole === "host"
      ? m.hostActiveIndex
      : m.guestActiveIndex
    : 0;
  const theirParty = m ? (theirRole === "host" ? m.hostParty : m.guestParty) : [];
  const theirActiveIdx = m
    ? theirRole === "host"
      ? m.hostActiveIndex
      : m.guestActiveIndex
    : 0;
  const myActive = myParty[myActiveIdx];
  const theirActive = theirParty[theirActiveIdx];
  const myHp = m ? (myRole === "host" ? m.hostHp : m.guestHp) : 0;
  const theirHp = m ? (theirRole === "host" ? m.hostHp : m.guestHp) : 0;
  const myStatus = m ? (myRole === "host" ? m.hostStatus : m.guestStatus) : null;
  const theirStatus = m
    ? theirRole === "host"
      ? m.hostStatus
      : m.guestStatus
    : null;

  const myMeta = myActive ? getPokemonMetadata(myActive.id) : null;
  const theirMeta = theirActive ? getPokemonMetadata(theirActive.id) : null;
  const myStats = myActive ? getPokemonStats(myActive.id, myActive.level) : null;
  const theirStats = theirActive
    ? getPokemonStats(theirActive.id, theirActive.level)
    : null;

  const renderStatus = (status: BattleStatus | null) => {
    if (!status) return null;
    const [label, color] = STATUS_LABEL[status.type] ?? ["???", "#888"];
    return <StatusBadge $color={color}>{label}</StatusBadge>;
  };

  const showCountdown =
    countdown !== null &&
    [
      "choosing",
      "move-select",
      "switch-select",
      "forced-switch",
      "confirm-forfeit",
      "waiting",
    ].includes(phase);

  return (
    <Overlay>
      {showCountdown && (
        <Countdown $urgent={countdown <= 10}>{countdown}s</Countdown>
      )}

      <BattleArea>
        <Row>
          <LeftInfoSection>
            {theirMeta && theirStats && (
              <>
                <Name>
                  {theirMeta.name}
                  {genderSymbol(theirActive?.gender)}
                </Name>
                <OwnerName>de {opponentName}</OwnerName>
                <Level>{`:L${theirActive?.level ?? "?"}`}</Level>
                <HealthBarContainer>
                  <HealthBar
                    big
                    currentHealth={Math.max(0, theirHp)}
                    maxHealth={theirStats.hp}
                  />
                </HealthBarContainer>
                {renderStatus(theirStatus)}
              </>
            )}
          </LeftInfoSection>
          <ImageContainer>
            {theirMeta && theirHp > 0 && (
              <SpriteImage src={theirMeta.images.front} />
            )}
          </ImageContainer>
        </Row>
        <Row>
          <PlayerImageContainer>
            {myMeta && myHp > 0 && <SpriteImage src={myMeta.images.back} />}
          </PlayerImageContainer>
          <RightInfoSection>
            {myMeta && myStats && (
              <>
                <Name>
                  {myMeta.name}
                  {genderSymbol(myActive?.gender)}
                </Name>
                <Level>{`:L${myActive?.level ?? "?"}`}</Level>
                <HealthBarContainer>
                  <HealthBar
                    big
                    currentHealth={Math.max(0, myHp)}
                    maxHealth={myStats.hp}
                  />
                </HealthBarContainer>
                <Health>{`${Math.max(0, myHp)}/${myStats.hp}`}</Health>
                {renderStatus(myStatus)}
              </>
            )}
          </RightInfoSection>
        </Row>
      </BattleArea>

      <TextContainer>
        <Frame wide tall flashing={phase === "ended"}>
          {phase === "ended"
            ? endText
            : phase === "choosing"
            ? `¿Qué hará ${myMeta?.name.toUpperCase() ?? "tu POKéMON"}?`
            : phase === "confirm-forfeit"
            ? `¿Seguro que quieres rendirte? ${opponentName} ganará el combate.`
            : text}
        </Frame>
      </TextContainer>

      {/* Menú principal: LUCHAR / PKMN / RENDIRSE (sin mochila — regla GSC) */}
      <Menu
        compact
        show={phase === "choosing"}
        menuItems={[
          {
            label: "Luchar",
            action: () => {
              if (!myActive) return;
              if (myActive.moves.every((mv) => mv.pp <= 0)) {
                submitAction({ type: "move", moveId: "struggle" });
              } else {
                setPhase("move-select");
              }
            },
          },
          { pokemon: true, label: "PKMN", action: () => setPhase("switch-select") },
          {
            label: "Rendirse",
            action: () => setPhase("confirm-forfeit"),
          },
          { label: "-", action: () => {} },
        ]}
        noExit
        close={() => {}}
        bottom="0"
        right="0"
      />

      {/* Confirmación de rendición: evita perder por un toque accidental */}
      <Menu
        noExitOption
        show={phase === "confirm-forfeit"}
        menuItems={[
          { label: "NO, ¡SEGUIR!", action: () => setPhase("choosing") },
          { label: "SÍ, RENDIRME", action: () => submitAction({ type: "forfeit" }) },
        ]}
        close={() => setPhase("choosing")}
        bottom="30%"
        right="0"
      />

      {/* Selección de movimiento */}
      <Menu
        tight
        noExitOption
        padd={4}
        show={phase === "move-select"}
        menuItems={(myActive?.moves ?? []).map((mv) => ({
          label: `${getMoveMetadata(mv.id)?.name ?? mv.id} ${mv.pp}PP`,
          action: () => {
            if (mv.pp <= 0) return;
            submitAction({ type: "move", moveId: mv.id });
          },
        }))}
        close={() => setPhase("choosing")}
        bottom="0"
        right="0"
      />

      {/* Cambio de Pokémon (voluntario o forzado tras KO) */}
      <Menu
        noExitOption={phase === "forced-switch"}
        show={phase === "switch-select" || phase === "forced-switch"}
        menuItems={myParty.map((p, index) => ({
          label: `${getPokemonMetadata(p.id).name.toUpperCase()} :L${p.level} ${
            p.hp <= 0 ? "(KO)" : index === myActiveIdx ? "(EN COMBATE)" : ""
          }`,
          action: () => {
            if (p.hp <= 0) return;
            if (index === myActiveIdx && phase === "switch-select") return;
            submitAction({ type: "switch", index });
          },
        }))}
        close={() => {
          if (phase === "switch-select") setPhase("choosing");
        }}
        top="0"
        right="0"
      />
    </Overlay>
  );
};

export default LinkBattleRoom;
