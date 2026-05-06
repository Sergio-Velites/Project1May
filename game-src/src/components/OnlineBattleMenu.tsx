import { useEffect, useState } from "react";
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
import { listPlayers, loadFromCloud, PlayerEntry } from "../app/cloud-save";
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

  // Reset state on open
  useEffect(() => {
    if (show) {
      setStage("greeting");
      setPlayers([]);
      setSelected(null);
    }
  }, [show]);

  // Fetch players when entering loading stage
  useEffect(() => {
    if (stage !== "loading") return;
    listPlayers().then((result) => {
      if (result.length === 0) {
        setStage("empty");
      } else {
        setPlayers(result);
        setStage("select");
      }
    });
  }, [stage]);

  // Load battle data when a player is selected and confirmed
  useEffect(() => {
    if (stage !== "loading-battle" || !selected) return;
    loadFromCloud(selected.playerId).then((gameState) => {
      if (!gameState) {
        setStage("error");
        return;
      }
      const gs = gameState as { pokemon?: { id: number; level: number }[] };
      const opponentPokemon = gs.pokemon ?? [];
      if (opponentPokemon.length === 0) {
        setStage("error");
        return;
      }
      const fakeTrainer: TrainerType = {
        npc: rival,
        pokemon: opponentPokemon.map((p) => ({ id: p.id, level: p.level })),
        facing: Direction.Down,
        intro: [],
        outtro: [`¡Bien jugado, ${selected.name}!`],
        money: 0,
        pos: map.onlineBattleNpc ?? { x: 10, y: 2 },
        isOnline: true,
      };
      dispatch(hideOnlineBattleMenu());
      dispatch(encounterTrainer(fakeTrainer));
      setTimeout(() => {
        const first = opponentPokemon[0];
        dispatch(
          encounterPokemon(getPokemonEncounter(first.id, first.level))
        );
      }, 300);
      setStage("done");
    });
  }, [stage, selected, map.onlineBattleNpc, dispatch]);

  // A-button handler for text stages
  useEvent(Event.A, () => {
    if (!show) return;
    if (stage === "greeting") setStage("loading");
    if (stage === "empty") {
      dispatch(hideOnlineBattleMenu());
      setStage("greeting");
    }
    if (stage === "error") {
      dispatch(hideOnlineBattleMenu());
      setStage("greeting");
    }
  });

  // B-button handler — cancel
  useEvent(Event.B, () => {
    if (!show) return;
    if (stage === "greeting" || stage === "empty" || stage === "error") {
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
      setSelected(p);
      setStage("loading-battle");
    },
  }));

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
          <Frame wide tall flashing={["greeting", "empty", "error"].includes(stage)}>
            {stage === "greeting" &&
              "¡Hola! ¿Quieres combatir con el equipo Pokémon de otro invitado?"}
            {stage === "loading" && "Buscando invitados..."}
            {stage === "empty" &&
              "No hay otros jugadores conectados ahora. ¡Inténtalo más tarde!"}
            {stage === "loading-battle" &&
              `Cargando datos de ${selected?.name ?? ""}...`}
            {stage === "error" &&
              "No se pudo cargar la partida del invitado. Inténtalo de nuevo."}
          </Frame>
        </TextContainer>
      )}
    </Overlay>
  );
};

export default OnlineBattleMenu;
