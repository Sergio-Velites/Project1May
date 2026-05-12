import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import Frame from "./Frame";
import Menu, { MenuItemType } from "./Menu";
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

// ---- Styled components ----

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

// ---- Types ----

type Stage =
  | "greeting"
  | "loading"
  | "empty"
  | "select"
  | "loading-battle"
  | "no-pokemon"
  | "error"
  | "done";

// ---- Component ----

const OnlineBattleMenu = () => {
  const dispatch = useDispatch();
  const show = useSelector(selectOnlineBattleMenu);
  const map = useSelector(selectMap);

  const [stage, setStage] = useState<Stage>("greeting");
  const [players, setPlayers] = useState<PlayerEntry[]>([]);
  const [selected, setSelected] = useState<PlayerEntry | null>(null);
  // Ref sincrónico de la selección para evitar race conditions entre el
  // setState y el useEffect que dispara loadFromCloud. Siempre se establece
  // en el mismo tick que setStage("loading-battle").
  const selectedPlayerRef = useRef<PlayerEntry | null>(null);
  // Guard atómico para evitar que dos useEffect/listeners disparen dos
  // veces el combate (doble A o re-render durante loadFromCloud).
  const battleStartedRef = useRef(false);

  // Reset state on open
  useEffect(() => {
    if (show) {
      setStage("greeting");
      setPlayers([]);
      setSelected(null);
      battleStartedRef.current = false;
    }
  }, [show]);


  // Fetch players when entering loading stage, y congelar la lista al pasar a 'select'
  useEffect(() => {
    if (stage !== "loading") return;
    let cancelled = false;
    listPlayers(getCurrentUserId()).then((result) => {
      if (cancelled) return;
      if (result.length === 0) {
        setStage("empty");
      } else {
        // Congelar la lista de jugadores: no actualizar más hasta salir del menú
        setPlayers(result);
        setStage("select");
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // Al cerrar el menú, limpiar la lista congelada
  useEffect(() => {
    if (!show) {
      setPlayers([]);
      setSelected(null);
      battleStartedRef.current = false;
    }
  }, [show]);

  // Load battle data when a player is selected and confirmed
  useEffect(() => {
    if (stage !== "loading-battle") return;
    // Usar ref para evitar race condition: la ref se establece síncronamente
    // en el mismo tick que setStage("loading-battle"), así que siempre tiene
    // el jugador correcto aunque el estado de React aún no haya propagado.
    const playerToLoad = selectedPlayerRef.current;
    if (!playerToLoad) return;
    let cancelled = false;
    loadFromCloud(playerToLoad.playerId).then((gameState) => {
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
      // Guard contra doble inicio de combate.
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
      // Cerrar este menú primero para liberar el control y que
      // PokemonEncounter / TrainerEncounter tomen el relevo limpiamente.
      dispatch(hideOnlineBattleMenu());
      setStage("done");
      // Encadenar en el siguiente tick para que el unmount de este
      // overlay (z-index 150) no se solape con la animación de entrada.
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
  }, [stage, map.onlineBattleNpc, dispatch]);

  // A-button handler for text stages
  useEvent(Event.A, () => {
    if (!show) return;
    if (stage === "greeting") setStage("loading");
    if (stage === "empty") {
      dispatch(hideOnlineBattleMenu());
      setStage("greeting");
    }
    if (stage === "error" || stage === "no-pokemon") {
      dispatch(hideOnlineBattleMenu());
      setStage("greeting");
    }
  });

  // B-button handler — cancel
  useEvent(Event.B, () => {
    if (!show) return;
    if (stage === "greeting" || stage === "empty" || stage === "error" || stage === "no-pokemon") {
      dispatch(hideOnlineBattleMenu());
      setStage("greeting");
    }
    if (stage === "select") {
      dispatch(hideOnlineBattleMenu());
      setStage("greeting");
    }
  });

  if (!show) return null;

  // ---- Player list menu items ----
  const menuItems: MenuItemType[] = players.map((p) => ({
    label: `${p.name} (${p.pokemonCount})`,
    action: () => {
      // Establecer ref síncronamente ANTES de setState para garantizar que
      // el useEffect de loading-battle lea el jugador correcto.
      selectedPlayerRef.current = p;
      setSelected(p);
      setStage("loading-battle");
    },
  }));

  // Texto como string puro para que Frame use su path con <h1 fontFamily="PokemonGB">
  const frameText =
    stage === "greeting"
      ? "¡Hola! ¿Quieres combatir con el equipo Pokémon de otro invitado?"
      : stage === "loading"
      ? "Buscando invitados..."
      : stage === "empty"
      ? "No hay otros invitados en el juego todavía."
      : stage === "loading-battle"
      ? `Cargando datos de ${selected?.name ?? ""}...`
      : stage === "no-pokemon"
      ? `${selected?.name ?? "Este invitado"} aún no tiene equipo Pokémon. ¡Dile que juegue más!`
      : stage === "error"
      ? "No se pudo cargar la partida del invitado. Inténtalo de nuevo."
      : "";

  // ---- Render ----
  return (
    <Overlay>
      {/* Player selection menu */}
      {stage === "select" && (
        <Menu
          show={true}
          menuItems={menuItems}
          close={() => {
            dispatch(hideOnlineBattleMenu());
            setStage("greeting");
          }}
          bottom="20%"
          right="0"
        />
      )}

      {/* Text box */}
      {stage !== "select" && stage !== "done" && (
        <TextContainer>
          <Frame wide tall flashing={["greeting", "empty", "error", "no-pokemon"].includes(stage)}>
            {frameText}
          </Frame>
        </TextContainer>
      )}
    </Overlay>
  );
};

export default OnlineBattleMenu;
