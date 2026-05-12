import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import Frame from "./Frame";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import {
  encounterPokemon,
  encounterTrainer,
  selectMap,
} from "../state/gameSlice";
import {
  hideOnlineBattleMenu,
  selectOnlineBattleMenu,
} from "../state/uiSlice";
import {
  getCurrentUserId,
  listPlayers,
  loadFromCloud,
  PlayerEntry,
} from "../app/cloud-save";
import getPokemonEncounter from "../app/pokemon-encounter-helper";
import { rival } from "../app/npcs";
import { Direction } from "../state/state-types";
import { TrainerType } from "../maps/map-types";
import Arrow from "./Arrow";

// Cuántos jugadores se ven a la vez en la lista (incluyendo "Salir").
// Si hay más, se muestran indicadores de scroll ▲/▼.
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

// Posicionado igual que el menú Start: pegado a la derecha,
// centrado verticalmente.
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
  | "loading"
  | "empty"
  | "select"
  | "loading-battle"
  | "no-pokemon"
  | "error"
  | "done";

type RowItem =
  | { kind: "player"; player: PlayerEntry }
  | { kind: "exit" };

const OnlineBattleMenu = () => {
  const dispatch = useDispatch();
  const show = useSelector(selectOnlineBattleMenu);
  const map = useSelector(selectMap);

  const [stage, setStage] = useState<Stage>("greeting");
  const [players, setPlayers] = useState<PlayerEntry[]>([]);

  // Selección por playerId (no por índice). Inmune a cambios en players[],
  // a re-renders intermedios y a cualquier closure obsoleto. La ref se
  // actualiza síncronamente en el handler de A, antes de cualquier setState.
  const selectedIdRef = useRef<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const battleStartedRef = useRef(false);

  // Cursor (índice global sobre `rows`) y desplazamiento de scroll
  const [cursor, setCursor] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Reset al abrir/cerrar
  useEffect(() => {
    if (show) {
      setStage("greeting");
      setPlayers([]);
      setCursor(0);
      setScrollOffset(0);
      selectedIdRef.current = null;
      setSelectedId(null);
      battleStartedRef.current = false;
    } else {
      setPlayers([]);
      selectedIdRef.current = null;
      setSelectedId(null);
      battleStartedRef.current = false;
    }
  }, [show]);

  // Fetch de la lista al entrar en stage "loading"
  useEffect(() => {
    if (stage !== "loading") return;
    let cancelled = false;
    listPlayers(getCurrentUserId()).then((result) => {
      if (cancelled) return;
      if (result.length === 0) {
        setStage("empty");
      } else {
        setPlayers(result);
        setCursor(0);
        setScrollOffset(0);
        setStage("select");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [stage]);

  // Carga del oponente y arranque del combate
  useEffect(() => {
    if (stage !== "loading-battle") return;
    const idToLoad = selectedIdRef.current;
    if (!idToLoad) {
      setStage("error");
      return;
    }
    // Resolver el jugador por ID — nunca por índice
    const playerToLoad = players.find((p) => p.playerId === idToLoad);
    if (!playerToLoad) {
      setStage("error");
      return;
    }
    let cancelled = false;
    loadFromCloud(idToLoad).then((gameState) => {
      if (cancelled) return;
      if (!gameState) {
        setStage("error");
        return;
      }
      const gs = gameState as { pokemon?: { id: number; level: number }[] };
      const opponentPokemon = (gs.pokemon ?? []).filter(
        (p) =>
          p &&
          typeof p.id === "number" &&
          typeof p.level === "number" &&
          p.level > 0
      );
      if (opponentPokemon.length === 0) {
        setStage("no-pokemon");
        return;
      }
      if (battleStartedRef.current) return;
      battleStartedRef.current = true;

      const fakeTrainer: TrainerType = {
        npc: rival,
        pokemon: opponentPokemon.map((p) => ({ id: p.id, level: p.level })),
        facing: Direction.Down,
        intro: [],
        outtro: [`¡Bien jugado, ${playerToLoad.name}!`],
        money: 0,
        pos: map.onlineBattleNpc ?? { x: 10, y: 2 },
        isOnline: true,
        playerName: playerToLoad.name,
      };
      dispatch(hideOnlineBattleMenu());
      setStage("done");
      setTimeout(() => {
        dispatch(encounterTrainer(fakeTrainer));
        const first = opponentPokemon[0];
        dispatch(
          encounterPokemon(getPokemonEncounter(first.id, first.level))
        );
      }, 50);
    });
    return () => {
      cancelled = true;
    };
  }, [stage, map.onlineBattleNpc, dispatch, players]);

  // Filas: jugadores + opción "Salir"
  const rows: RowItem[] =
    stage === "select"
      ? [
          ...players.map((p): RowItem => ({ kind: "player", player: p })),
          { kind: "exit" } as RowItem,
        ]
      : [];
  const totalRows = rows.length;

  useEvent(Event.Up, () => {
    if (!show || stage !== "select") return;
    setCursor((c) => {
      if (c === 0) return 0;
      const next = c - 1;
      setScrollOffset((s) => (next < s ? next : s));
      return next;
    });
  });

  useEvent(Event.Down, () => {
    if (!show || stage !== "select") return;
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
      setStage("loading");
      return;
    }
    if (stage === "empty" || stage === "error" || stage === "no-pokemon") {
      dispatch(hideOnlineBattleMenu());
      setStage("greeting");
      return;
    }
    if (stage === "select") {
      const row = rows[cursor];
      if (!row) return;
      if (row.kind === "exit") {
        dispatch(hideOnlineBattleMenu());
        setStage("greeting");
        return;
      }
      // Fijar el ID síncronamente ANTES de cualquier setState.
      const id = row.player.playerId;
      selectedIdRef.current = id;
      setSelectedId(id);
      setStage("loading-battle");
    }
  });

  useEvent(Event.B, () => {
    if (!show) return;
    if (
      stage === "greeting" ||
      stage === "empty" ||
      stage === "error" ||
      stage === "no-pokemon" ||
      stage === "select"
    ) {
      dispatch(hideOnlineBattleMenu());
      setStage("greeting");
    }
  });

  if (!show) return null;

  // Resolver el nombre del jugador seleccionado por ID (nunca por índice)
  const selectedPlayer =
    selectedId !== null
      ? players.find((p) => p.playerId === selectedId)
      : null;

  const frameText =
    stage === "greeting"
      ? "¡Hola! ¿Quieres combatir con el equipo Pokémon de otro invitado?"
      : stage === "loading"
      ? "Buscando invitados..."
      : stage === "empty"
      ? "No hay otros invitados en el juego todavía."
      : stage === "loading-battle"
      ? `Cargando datos de ${selectedPlayer?.name ?? "..."}...`
      : stage === "no-pokemon"
      ? `${selectedPlayer?.name ?? "Este invitado"} aún no tiene equipo Pokémon. ¡Dile que juegue más!`
      : stage === "error"
      ? "No se pudo cargar la partida del invitado. Inténtalo de nuevo."
      : "";

  const visibleRows = rows.slice(scrollOffset, scrollOffset + VISIBLE_ROWS);
  const hasMoreAbove = scrollOffset > 0;
  const hasMoreBelow = scrollOffset + VISIBLE_ROWS < totalRows;

  return (
    <Overlay>
      {stage === "select" && (
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
                  : `${row.player.name} (${row.player.pokemonCount})`;
              return (
                <li
                  key={row.kind === "exit" ? "__exit__" : row.player.playerId}
                  style={{ position: "relative" }}
                >
                  <RowDiv>
                    <ArrowSlot>
                      <Arrow menu show={isActive} />
                    </ArrowSlot>
                    <span style={{ paddingRight: "1cqw" }}>{label}</span>
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

      {stage !== "select" && stage !== "done" && (
        <TextContainer>
          <Frame
            wide
            tall
            flashing={["greeting", "empty", "error", "no-pokemon"].includes(stage)}
          >
            {frameText}
          </Frame>
        </TextContainer>
      )}
    </Overlay>
  );
};

export default OnlineBattleMenu;
