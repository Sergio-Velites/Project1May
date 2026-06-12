import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import Frame from "./Frame";
import Menu from "./Menu";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import {
  applyTrade,
  selectGameState,
  selectPokemon,
  updateSpecificPokemon,
} from "../state/gameSlice";
import {
  closeLinkRoom,
  selectLinkRoom,
  showEvolution,
} from "../state/uiSlice";
import {
  LinkSession,
  linkAct,
  linkCancel,
  linkPoll,
  secondsLeft,
} from "../app/link-session";
import { getCurrentUserId, saveGameVerified } from "../app/cloud-save";
import { getPokemonMetadata } from "../app/use-pokemon-metadata";
import { genderSymbol } from "../app/gender-helper";
import { BASE_FRIENDSHIP } from "../app/evolution-helper";
import { ItemType } from "../app/use-item-data";
import { PokemonInstance } from "../state/state-types";
import { playCry } from "../app/pokemon-cry";

// ─────────────────────────────────────────────────────────────────────────
// CENTRO DE INTERCAMBIO del Club Cable (Gen II).
//
// Protocolo (1 minuto por fase; si alguien no responde, se cancela):
//   offer   → cada jugador elige un POKéMON de su equipo.
//   confirm → se muestran ambos: "¿X por Y?" SÍ/SÍ → intercambio.
//             NO → se vuelve a la mesa de selección (como en GSC).
//
// El intercambio es simultáneo (nunca te quedas sin equipo) y dispara las
// evoluciones por intercambio de Oro/Plata: Kadabra, Machoke, Graveler y
// Haunter siempre; Poliwhirl/Slowpoke (Roca del Rey), Onix/Scyther
// (Rev. Metálico), Seadra (Escama Dragón) y Porygon (Mejora) si llevan el
// objeto, que se consume. La Piedra Eterna lo bloquea. La amistad del
// recién llegado vuelve a la base (70), como en el original.
// ─────────────────────────────────────────────────────────────────────────

const POLL_MS = 2000;

/** Evoluciones por intercambio sin objeto (Gen I vía cable, vigentes en GSC). */
const TRADE_EVOS: Record<number, number> = {
  64: 65, // Kadabra → Alakazam
  67: 68, // Machoke → Machamp
  75: 76, // Graveler → Golem
  93: 94, // Haunter → Gengar
};

/** Evoluciones por intercambio con objeto equipado (Gen II). */
const TRADE_EVOS_WITH_ITEM: Record<number, { item: ItemType; to: number }> = {
  61: { item: ItemType.KingsRock, to: 186 }, // Poliwhirl → Politoed
  79: { item: ItemType.KingsRock, to: 199 }, // Slowpoke → Slowking
  95: { item: ItemType.MetalCoat, to: 208 }, // Onix → Steelix
  123: { item: ItemType.MetalCoat, to: 212 }, // Scyther → Scizor
  117: { item: ItemType.DragonScale, to: 230 }, // Seadra → Kingdra
  137: { item: ItemType.UpGrade, to: 233 }, // Porygon → Porygon2
};

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--bg);
  z-index: 200;
`;

const TextContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 25%;
  z-index: 100;

  @media (max-width: 1000px) {
    height: 30%;
  }
`;

const TradePanel = styled.div`
  position: absolute;
  top: 6%;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
`;

const MonCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1cqw;
`;

const MonSprite = styled.img`
  width: 18cqw;
  height: 18cqw;
  image-rendering: pixelated;
`;

const MonLabel = styled.div`
  font-family: "PokemonGB";
  font-size: 2.2cqw;
  color: black;
  text-align: center;
`;

const Countdown = styled.div<{ $urgent?: boolean }>`
  position: absolute;
  top: 1cqw;
  right: 2cqw;
  font-family: "PokemonGB";
  font-size: ${(p) => (p.$urgent ? "3cqw" : "2.4cqw")};
  color: ${(p) => (p.$urgent ? "#c02020" : "black")};
`;

type Phase =
  | "intro"
  | "offer"
  | "waiting-offer"
  | "confirm"
  | "waiting-confirm"
  | "completing"
  | "done";

const LinkTradeRoom = () => {
  const dispatch = useDispatch();
  const room = useSelector(selectLinkRoom);
  const myPokemon = useSelector(selectPokemon);
  const gameState = useSelector(selectGameState);

  const [phase, setPhase] = useState<Phase>("intro");
  const [session, setSession] = useState<LinkSession | null>(null);
  const [text, setText] = useState<string>("");
  const [countdown, setCountdown] = useState<number | null>(null);

  const phaseRef = useRef<Phase>("intro");
  phaseRef.current = phase;
  const appliedRef = useRef(false);
  const exitingRef = useRef(false);
  // Polls consecutivos viendo "trade-finishing" (el servidor está aplicando
  // el swap en los saves): si se eterniza, algo falló de verdad.
  const finishingPollsRef = useRef(0);

  const show = !!room && room.kind === "trade";
  const myRole = room?.role ?? "host";
  const theirRole = myRole === "host" ? "guest" : "host";
  const opponentName = room?.opponentName ?? "Invitado";

  const exit = useCallback(
    (finalText?: string) => {
      if (exitingRef.current) return;
      exitingRef.current = true;
      if (finalText) {
        setText(finalText);
        setPhase("done");
      } else {
        dispatch(closeLinkRoom());
      }
    },
    [dispatch]
  );

  // Reset al abrir.
  useEffect(() => {
    if (show) {
      setPhase("intro");
      setSession(null);
      setText("");
      setCountdown(null);
      appliedRef.current = false;
      exitingRef.current = false;
      setTimeout(() => {
        if (phaseRef.current === "intro") setPhase("offer");
      }, 1800);
    }
  }, [show]);

  // ── Aplicar el intercambio completado ────────────────────────────────────
  const completeTrade = useCallback(
    (s: LinkSession) => {
      if (appliedRef.current) return;
      appliedRef.current = true;
      setPhase("completing");

      const giveIndex = (myRole === "host" ? s.hostOffer : s.guestOffer) ?? 0;
      const theirParty = (theirRole === "host" ? s.hostParty : s.guestParty) ?? [];
      const theirOffer = (theirRole === "host" ? s.hostOffer : s.guestOffer) ?? 0;
      const givenMon = myPokemon[giveIndex];
      const rawReceived = theirParty[theirOffer];
      if (!givenMon || !rawReceived) {
        exit("Algo salió mal con el intercambio. No se ha cambiado nada.");
        return;
      }

      // GSC: la amistad del Pokémon recibido vuelve a la base.
      const received: PokemonInstance = {
        ...rawReceived,
        friendship: BASE_FRIENDSHIP,
      };

      const givenName = getPokemonMetadata(givenMon.id).name.toUpperCase();
      const receivedName = getPokemonMetadata(received.id).name.toUpperCase();

      setText(`¡Adiós, ${givenName}! Buen viaje...`);
      setTimeout(() => {
        dispatch(applyTrade({ giveIndex, received }));
        playCry(received.id);
        setText(`¡${opponentName} te ha enviado a ${receivedName}!`);
        setTimeout(() => {
          // Persistir cuanto antes: el intercambio ya es definitivo.
          const userId = getCurrentUserId();
          if (userId) {
            const newPokemon = [...gameState.pokemon];
            newPokemon[giveIndex] = received;
            saveGameVerified(userId, { ...gameState, pokemon: newPokemon });
          }

          // ── Evolución por intercambio (Oro/Plata) ────────────────────────
          let evolveToId: number | null = null;
          let consumesItem = false;
          if (received.heldItem !== ItemType.Everstone) {
            if (TRADE_EVOS[received.id]) {
              evolveToId = TRADE_EVOS[received.id];
            } else {
              const withItem = TRADE_EVOS_WITH_ITEM[received.id];
              if (withItem && received.heldItem === withItem.item) {
                evolveToId = withItem.to;
                consumesItem = true;
              }
            }
          }

          setText(`¡Cuida mucho a ${receivedName}!`);
          setTimeout(() => {
            dispatch(closeLinkRoom());
            if (evolveToId !== null) {
              if (consumesItem) {
                // El objeto se consume al disparar la evolución (como en GSC).
                dispatch(
                  updateSpecificPokemon({
                    index: giveIndex,
                    pokemon: { ...received, heldItem: null },
                  })
                );
              }
              dispatch(showEvolution({ index: giveIndex, evolveToId }));
            }
          }, 2200);
        }, 2600);
      }, 2200);
    },
    [dispatch, exit, gameState, myPokemon, myRole, opponentName, theirRole]
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
        setSession(s);
        setCountdown(s.status === "active" ? Math.min(60, secondsLeft(s)) : null);

        if (s.status === "finished") {
          if (s.endReason === "trade-completed") {
            completeTrade(s);
            return;
          }
          if (s.endReason === "trade-integrity") {
            exit(
              "El intercambio no superó la verificación y se canceló. No se ha cambiado nada."
            );
            return;
          }
          // "trade-finishing": el servidor está persistiendo el swap en los
          // dos saves; seguir consultando un poco más antes de rendirse.
          finishingPollsRef.current += 1;
          if (finishingPollsRef.current > 8) {
            exit(
              "No se pudo confirmar el intercambio. Revisa tu equipo: si falta algo, avisa a los novios."
            );
            return;
          }
        }
        if (s.status === "cancelled") {
          exit(
            s.endReason === "timeout"
              ? "Se acabó el tiempo (1 min sin respuesta). El intercambio se canceló."
              : `${opponentName} salió del CENTRO DE INTERCAMBIO.`
          );
          return;
        }
        if (s.status === "active") {
          const myOffer = myRole === "host" ? s.hostOffer : s.guestOffer;
          const myConfirm = myRole === "host" ? s.hostConfirm : s.guestConfirm;
          const current = phaseRef.current;
          if (s.phase === "offer") {
            // El rival rechazó en la confirmación → volver a la mesa.
            if (myOffer === null && (current === "waiting-offer" || current === "confirm" || current === "waiting-confirm")) {
              setPhase("offer");
            }
          } else if (s.phase === "confirm") {
            if (!myConfirm && current !== "confirm") setPhase("confirm");
            if (myConfirm && current !== "waiting-confirm") setPhase("waiting-confirm");
          }
        }
      } catch {
        // Error puntual de red: reintentar en el siguiente tick.
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

  // ── Acciones del jugador ─────────────────────────────────────────────────
  const offerPokemon = (index: number) => {
    if (!room) return;
    setPhase("waiting-offer");
    linkAct(room.sessionId, { type: "offer", index }).catch(() => {
      setPhase("offer");
    });
  };

  const confirmTrade = (accept: boolean) => {
    if (!room) return;
    if (accept) {
      setPhase("waiting-confirm");
      linkAct(room.sessionId, { type: "confirm" }).catch(() => setPhase("confirm"));
    } else {
      setPhase("waiting-offer");
      linkAct(room.sessionId, { type: "reject" }).catch(() => setPhase("confirm"));
    }
  };

  useEvent(Event.A, () => {
    if (!show) return;
    if (phase === "done") {
      dispatch(closeLinkRoom());
    }
  });

  useEvent(Event.B, () => {
    if (!show) return;
    if (phase === "offer" || phase === "waiting-offer") {
      if (room) linkCancel(room.sessionId);
      exit();
    }
  });

  if (!show || !room) return null;

  // Datos para el panel de confirmación.
  const myOfferIdx = session
    ? myRole === "host"
      ? session.hostOffer
      : session.guestOffer
    : null;
  const theirOfferIdx = session
    ? theirRole === "host"
      ? session.hostOffer
      : session.guestOffer
    : null;
  const theirParty = session
    ? (theirRole === "host" ? session.hostParty : session.guestParty) ?? []
    : [];
  const myOffered = myOfferIdx !== null ? myPokemon[myOfferIdx] : null;
  const theirOffered = theirOfferIdx !== null ? theirParty[theirOfferIdx] : null;

  const frameText =
    phase === "intro"
      ? `¡Conectado con ${opponentName}! Bienvenidos al CENTRO DE INTERCAMBIO.`
      : phase === "offer"
      ? "Elige el POKéMON que vas a intercambiar. (B para salir)"
      : phase === "waiting-offer"
      ? `Esperando a que ${opponentName} elija su POKéMON...`
      : phase === "confirm" && myOffered && theirOffered
      ? `¿Cambias a ${getPokemonMetadata(myOffered.id).name.toUpperCase()} por ${getPokemonMetadata(theirOffered.id).name.toUpperCase()} de ${opponentName}?`
      : phase === "waiting-confirm"
      ? `Esperando la confirmación de ${opponentName}...`
      : text;

  return (
    <Overlay>
      {countdown !== null &&
        ["offer", "waiting-offer", "confirm", "waiting-confirm"].includes(phase) && (
          <Countdown $urgent={countdown <= 10}>{countdown}s</Countdown>
        )}

      {(phase === "confirm" || phase === "waiting-confirm") &&
        myOffered &&
        theirOffered && (
          <TradePanel>
            <MonCard>
              <MonSprite
                src={getPokemonMetadata(myOffered.id).images.front}
                alt=""
              />
              <MonLabel>
                {getPokemonMetadata(myOffered.id).name.toUpperCase()}
                {genderSymbol(myOffered.gender)} :L{myOffered.level}
                <br />
                (TU EQUIPO)
              </MonLabel>
            </MonCard>
            <MonCard>
              <MonSprite
                src={getPokemonMetadata(theirOffered.id).images.front}
                alt=""
              />
              <MonLabel>
                {getPokemonMetadata(theirOffered.id).name.toUpperCase()}
                {genderSymbol(theirOffered.gender)} :L{theirOffered.level}
                <br />
                (DE {opponentName.toUpperCase()})
              </MonLabel>
            </MonCard>
          </TradePanel>
        )}

      <Menu
        show={phase === "offer"}
        noExitOption
        close={() => {}}
        menuItems={myPokemon.map((p, index) => ({
          label: `${getPokemonMetadata(p.id).name.toUpperCase()} :L${p.level}`,
          action: () => offerPokemon(index),
        }))}
        top="0"
        right="0"
      />

      <Menu
        show={phase === "confirm"}
        noExitOption
        close={() => {}}
        menuItems={[
          { label: "¡TRATO HECHO!", action: () => confirmTrade(true) },
          { label: "CANCELAR", action: () => confirmTrade(false) },
        ]}
        bottom="30%"
        right="0"
      />

      <TextContainer>
        <Frame wide tall flashing={phase === "done"}>
          {frameText}
        </Frame>
      </TextContainer>
    </Overlay>
  );
};

export default LinkTradeRoom;
