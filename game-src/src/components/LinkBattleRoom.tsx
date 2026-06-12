import { useCallback, useEffect, useRef, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import Frame from "./Frame";
import Menu from "./Menu";
import MoveSelect from "./MoveSelect";
import PokemonList from "./PokemonList";
import HealthBar from "./HealthBar";
import PixelImage from "../styles/PixelImage";
import corner from "../assets/ui/corner.png";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import { closeLinkRoom, selectLinkRoom } from "../state/uiSlice";
import {
  consumeItem,
  selectInventory,
  selectName,
} from "../state/gameSlice";
import useItemData, { ItemType } from "../app/use-item-data";
import { InventoryItemType } from "../state/state-types";
import {
  LinkBattleAction,
  LinkBattleEvent,
  LinkResolution,
  LinkRole,
  LinkSession,
  LinkSideHints,
  linkAct,
  linkPoll,
  linkResolve,
  secondsLeft,
} from "../app/link-session";
import {
  LinkBattleSim,
  createLinkBattleSim,
  formatLinkText,
  getSideHints,
  linkItemTargetError,
  linkItemUsable,
  resolveLinkTurn,
} from "../app/link-battle-engine";
import { getPokemonMetadata } from "../app/use-pokemon-metadata";
import { getPokemonStats } from "../app/use-pokemon-stats";
import { getMoveMetadata } from "../app/use-move-metadata";
import { getMoveSfxPath } from "../app/move-sfx-map";
import { isSelfTargetingStatusMove } from "../app/move-helper";
import { MoveAnimation } from "./MoveAnimation";
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
// La interfaz replica el combate normal contra un NPC: mismo menú
// (LUCHAR / PKMN / OBJETO) con RENDIRSE en lugar de HUIR (y doble
// confirmación), las mismas animaciones de movimientos (MoveAnimation +
// flash + embestida) y los mismos componentes de selección (MoveSelect,
// PokemonList). Las pokéballs están bloqueadas, como contra un entrenador.
//
// Reglas:
//   · Objetos de mochila permitidos (consumen el turno y se gastan de
//     verdad); los equipados actúan en ambos bandos.
//   · Rendirse otorga la victoria al rival.
//   · Se combate con COPIAS (el equipo real queda intacto, sin XP).
//   · 1 minuto por decisión: si no respondes, pierdes el combate.
// ─────────────────────────────────────────────────────────────────────────

const POLL_MS = 2000;
const MSG_MS = 1400;
const ANIM_MS = 800;
const ATTACK_ANIMATION = 600;

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

const GenderGlyph = styled.span`
  font-family: "PokemonGB", sans-serif;
  font-size: 3.1cqw;
  line-height: 0;
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

const StatusBadge = styled.div<{ $color: string }>`
  font-family: "PokemonGB";
  font-size: 1.7cqw;
  background: ${(p) => p.$color};
  color: #fff;
  padding: 0.15cqw 0.7cqw;
  letter-spacing: 0.05em;
  position: absolute;
  bottom: 1.2cqw;
  left: 0;
  z-index: 2;
`;

const StatusBadgeWrap = styled.div`
  height: 0;
  overflow: visible;
  position: relative;
`;

const Corner = styled(PixelImage)`
  transform: translateY(-50%);
  height: 5.1cqw;
`;

const CornerContainer = styled.div`
  height: 2.7cqw;
`;

const CornerRight = styled(PixelImage)`
  height: 5.1cqw;
  transform: translateY(-70%) scaleX(-1);
`;

const flashing = keyframes`
  0% { opacity: 1; }
  10% { opacity: 0; }
  20% { opacity: 1; }
  30% { opacity: 0; }
  40% { opacity: 1; }
  50% { opacity: 0; }
  60% { opacity: 1; }
  70% { opacity: 0; }
  80% { opacity: 1; }
  90% { opacity: 0; }
  100% { opacity: 1; }
`;

interface FlashingProps {
  $flashing: boolean;
}

const ImageContainer = styled.div<FlashingProps>`
  height: 100%;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  ${(props: FlashingProps) =>
    props.$flashing &&
    css`
      animation: ${flashing} 500ms linear forwards;
    `};
`;

const PlayerImageContainer = styled(ImageContainer)`
  align-items: flex-start;
  overflow: visible;
`;

const attackRight = keyframes`
  0% { transform: translateX(0%); }
  50% { transform: translateX(50%); }
  100% { transform: translateX(0%); }
`;

const attackLeft = keyframes`
  0% { transform: translateX(0%); }
  50% { transform: translateX(-50%); }
  100% { transform: translateX(0%); }
`;

interface AttackingProps {
  $attacking: boolean;
}

const AttackRight = styled.div<AttackingProps>`
  height: 100%;
  transform: translateX(0%);
  ${(props: AttackingProps) =>
    props.$attacking &&
    css`
      animation: ${attackRight} ${ATTACK_ANIMATION}ms linear forwards;
    `};
`;

const AttackLeft = styled.div<AttackingProps>`
  height: 100%;
  transform: translateX(0%);
  ${(props: AttackingProps) =>
    props.$attacking &&
    css`
      animation: ${attackLeft} ${ATTACK_ANIMATION}ms linear forwards;
    `};
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
  | "item-select"
  | "item-target"
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

/** Animación de movimiento en curso (evento `anim` del host). */
interface AnimState {
  moveId: string;
  /** Bando que ATACA (el del evento). */
  attackerSide: LinkRole;
}

const LinkBattleRoom = () => {
  const dispatch = useDispatch();
  const room = useSelector(selectLinkRoom);
  const inventory = useSelector(selectInventory);
  const playerName = useSelector(selectName);
  const itemData = useItemData();

  const show = !!room && room.kind === "battle";
  const myRole: LinkRole = room?.role ?? "host";
  const theirRole: LinkRole = myRole === "host" ? "guest" : "host";
  const opponentName = room?.opponentName ?? "Invitado";

  const [phase, setPhase] = useState<Phase>("loading");
  const [mirror, setMirror] = useState<Mirror | null>(null);
  const [text, setText] = useState("Conectando con el COLISEO...");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [endText, setEndText] = useState<string | null>(null);
  const [anim, setAnim] = useState<AnimState | null>(null);
  /** Aviso transitorio en el frame (pokéball bloqueada, no puede luchar...). */
  const [notice, setNotice] = useState<string | null>(null);
  /** Objeto seleccionado en la mochila, pendiente de elegir objetivo. */
  const [pendingItem, setPendingItem] = useState<string | null>(null);

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
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Pistas del último snapshot del host para MI bando (Mal de Ojo, Bis...). */
  const myHintsRef = useRef<LinkSideHints | null>(null);

  const exit = useCallback(() => {
    dispatch(closeLinkRoom());
  }, [dispatch]);

  /** Tokens [[side|NOMBRE]] → "NOMBRE" (míos) / "NOMBRE rival" (suyos). */
  const fmt = useCallback(
    (raw: string) => formatLinkText(raw, myRole),
    [myRole]
  );

  const showNotice = useCallback((msg: string) => {
    setNotice(msg);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setNotice(null), 1600);
  }, []);

  // ── Inicialización ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!show) return;
    setPhase("loading");
    setMirror(null);
    setEndText(null);
    setAnim(null);
    setNotice(null);
    setPendingItem(null);
    setText("Conectando con el COLISEO...");
    simRef.current = null;
    sessionRef.current = null;
    lastPlayedTurnRef.current = 0;
    resolvingRef.current = false;
    actedTurnRef.current = 0;
    myHintsRef.current = null;
  }, [show, room?.sessionId]);

  const initFromSession = useCallback(
    (s: LinkSession) => {
      const hostParty = s.hostParty ?? [];
      const guestParty = s.guestParty ?? [];
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
      myHintsRef.current = s.resolution?.sideHints?.[myRole] ?? null;
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
      myHintsRef.current = resolution.sideHints?.[myRole] ?? null;
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
          // Animación visual (la misma del combate normal) + SFX del move.
          setAnim({ moveId: e.moveId, attackerSide: e.side });
          if (animTimerRef.current) clearTimeout(animTimerRef.current);
          animTimerRef.current = setTimeout(() => setAnim(null), ANIM_MS);
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
        else if (e.t === "anim") delay += ANIM_MS;
      }

      // Al terminar: adoptar el snapshot del host y decidir la siguiente fase.
      setTimeout(() => {
        setAnim(null);
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
      linkAct(room.sessionId, action)
        .then(() => {
          // El objeto se gasta DE VERDAD (a diferencia del equipo, que es
          // una copia): se consume solo cuando el servidor acepta la acción.
          if (action.type === "item") {
            dispatch(consumeItem(action.item as ItemType));
          }
        })
        .catch(() => {
          // Reintento manual: devolver el control al jugador.
          actedTurnRef.current = 0;
          if (phaseRef.current === "waiting") setPhase("choosing");
        });
    },
    [dispatch, opponentName, room]
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
            sideHints: getSideHints(sim),
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

  // ── Animación en curso: bando objetivo, clase de daño ────────────────────
  const animMeta = anim ? getMoveMetadata(anim.moveId) : null;
  // Los moves de buff propio (Agilidad, Amnesia...) animan sobre el usuario.
  const animTargetSide: LinkRole | null = anim
    ? isSelfTargetingStatusMove(anim.moveId)
      ? anim.attackerSide
      : anim.attackerSide === "host"
      ? "guest"
      : "host"
    : null;
  const animOnMe = animTargetSide === myRole;
  const animOnThem = animTargetSide === theirRole;
  const animIsStatus = animMeta?.damageClass === "status";
  const animIsPhysical = animMeta?.damageClass === "physical";
  const iAmAttacking = anim?.attackerSide === myRole;

  const renderStatus = (status: BattleStatus | null) => {
    if (!status) return null;
    const [label, color] = STATUS_LABEL[status.type] ?? ["???", "#888"];
    return (
      <StatusBadgeWrap>
        <StatusBadge $color={color}>{label}</StatusBadge>
      </StatusBadgeWrap>
    );
  };

  const showCountdown =
    countdown !== null &&
    [
      "choosing",
      "move-select",
      "switch-select",
      "forced-switch",
      "item-select",
      "item-target",
      "confirm-forfeit",
      "waiting",
    ].includes(phase);

  const frameText = notice
    ? notice
    : phase === "ended"
    ? endText
    : phase === "choosing"
    ? `¿Qué hará ${myMeta?.name.toUpperCase() ?? "tu POKéMON"}?`
    : phase === "confirm-forfeit"
    ? `¿Seguro que quieres rendirte? ${opponentName} ganará el combate.`
    : phase === "item-select"
    ? "¿Qué objeto usar?"
    : fmt(text);

  // La pantalla PKMN (PokemonList) y la mochila tapan toda la escena, como
  // en el combate normal.
  const fullScreenList =
    phase === "switch-select" || phase === "forced-switch" || phase === "item-target";

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
                  <GenderGlyph>{genderSymbol(theirActive?.gender)}</GenderGlyph>
                </Name>
                <Level>{`:L${theirActive?.level ?? "?"}`}</Level>
                <HealthBarContainer>
                  <HealthBar
                    big
                    currentHealth={Math.max(0, theirHp)}
                    maxHealth={theirStats.hp}
                  />
                </HealthBarContainer>
                {renderStatus(theirStatus)}
                <Corner src={corner} />
              </>
            )}
          </LeftInfoSection>
          <ImageContainer $flashing={!!anim && animOnThem && !animIsStatus}>
            <AttackRight $attacking={!!anim && !iAmAttacking && animIsPhysical}>
              {theirMeta && theirHp > 0 && (
                <SpriteImage src={theirMeta.images.front} />
              )}
            </AttackRight>
            <MoveAnimation
              moveId={anim?.moveId ?? null}
              active={!!anim && animOnThem}
              fromDirection="left"
            />
          </ImageContainer>
        </Row>
        <Row>
          <PlayerImageContainer $flashing={!!anim && animOnMe && !animIsStatus}>
            <AttackLeft $attacking={!!anim && iAmAttacking && animIsPhysical}>
              {myMeta && myHp > 0 && <SpriteImage src={myMeta.images.back} />}
            </AttackLeft>
            <MoveAnimation
              moveId={anim?.moveId ?? null}
              active={!!anim && animOnMe}
              fromDirection="right"
            />
          </PlayerImageContainer>
          <RightInfoSection>
            {myMeta && myStats && (
              <>
                <Name>
                  {myMeta.name}
                  <GenderGlyph>{genderSymbol(myActive?.gender)}</GenderGlyph>
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
                <CornerContainer>
                  <CornerRight src={corner} />
                </CornerContainer>
              </>
            )}
          </RightInfoSection>
        </Row>
      </BattleArea>

      {!fullScreenList && (
        <TextContainer>
          <Frame wide tall flashing={phase === "ended" || !!notice}>
            {frameText}
          </Frame>
        </TextContainer>
      )}

      {/* Menú principal — el mismo del combate normal contra un NPC, con
          RENDIRSE en el lugar de HUIR (doble confirmación) */}
      <Menu
        compact
        width="50cqw"
        show={phase === "choosing" && !notice}
        menuItems={[
          {
            label: "Luchar",
            action: () => {
              if (!myActive) return;
              // Gen I: si todos los PP son 0, usar Forcejeo automáticamente
              if (myActive.moves.every((mv) => mv.pp <= 0)) {
                submitAction({ type: "move", moveId: "struggle" });
              } else {
                setPhase("move-select");
              }
            },
          },
          {
            pokemon: true,
            label: "PKMN",
            action: () => {
              if (myHintsRef.current?.trapped) {
                showNotice(`¡${myMeta?.name.toUpperCase() ?? "Tu POKéMON"} no puede escapar!`);
                return;
              }
              setPhase("switch-select");
            },
          },
          {
            label: "Objeto",
            action: () => setPhase("item-select"),
          },
          {
            label: "Rendirse",
            action: () => setPhase("confirm-forfeit"),
          },
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

      {/* Selección de movimiento — el mismo componente del combate normal
          (caja de tipo/PP incluida) */}
      <MoveSelect
        show={phase === "move-select"}
        overrideMoves={myActive?.moves ?? []}
        select={(move: string) => {
          if (myHintsRef.current?.disabledMove === move) {
            showNotice("¡Ese movimiento está inhabilitado!");
            setPhase("choosing");
            return;
          }
          submitAction({ type: "move", moveId: move });
        }}
        close={() => setPhase("choosing")}
      />

      {/* Pantalla PKMN — la misma lista del combate normal, sobre las COPIAS
          del Coliseo (cambio voluntario o forzado tras KO) */}
      {(phase === "switch-select" || phase === "forced-switch") && (
        <PokemonList
          mode="battle"
          customPokemon={myParty}
          text={phase === "forced-switch" ? "¿A cuál POKéMON mandas?" : undefined}
          close={() => {
            if (phase === "switch-select") setPhase("choosing");
          }}
          switchAction={(index) => {
            if (index === myActiveIdx && phase === "switch-select") {
              showNotice("¡Ya está en combate!");
              setPhase("choosing");
              return;
            }
            if (!myParty[index] || myParty[index].hp <= 0) {
              showNotice("¡No puede luchar!");
              if (phase === "switch-select") setPhase("choosing");
              return;
            }
            submitAction({ type: "switch", index });
          }}
        />
      )}

      {/* Mochila — objetos del inventario REAL; las pokéballs están
          bloqueadas, como contra cualquier entrenador */}
      <Menu
        show={phase === "item-select"}
        menuItems={inventory
          .filter(
            (item: InventoryItemType) =>
              item.amount > 0 && !itemData[item.item]?.badge
          )
          .map((item: InventoryItemType) => ({
            label: itemData[item.item]?.name ?? item.item,
            value: item.amount,
            action: () => {
              const data = itemData[item.item];
              if (data?.pokeball) {
                showNotice("¡No puedes capturar el POKéMON de otro entrenador!");
                return;
              }
              if (!data?.usableInBattle || !linkItemUsable(item.item)) {
                showNotice(`OAK: ¡${playerName}! ¡Éste no es el momento de usarlo!`);
                return;
              }
              setPendingItem(item.item);
              setPhase("item-target");
            },
          }))}
        close={() => setPhase("choosing")}
      />

      {/* Elegir el Pokémon objetivo del objeto */}
      {phase === "item-target" && pendingItem && (
        <PokemonList
          customPokemon={myParty}
          text="¿Sobre qué POKéMON?"
          close={() => {
            setPendingItem(null);
            setPhase("item-select");
          }}
          clickPokemon={(index) => {
            const target = myParty[index];
            if (!target) return;
            const error = linkItemTargetError(pendingItem, target);
            if (error) {
              showNotice(error);
              setPendingItem(null);
              setPhase("item-select");
              return;
            }
            const item = pendingItem;
            setPendingItem(null);
            submitAction({ type: "item", item, targetIndex: index });
          }}
        />
      )}
    </Overlay>
  );
};

export default LinkBattleRoom;
