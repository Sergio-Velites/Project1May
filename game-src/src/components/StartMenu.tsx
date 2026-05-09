import { useDispatch, useSelector } from "react-redux";
import Menu from "./Menu";
import {
  hideStartMenu,
  selectConfirmationMenu,
  selectStartMenu,
  selectStartMenuSubOpen,
  selectText,
  selectTextThenAction,
  showConfirmationMenu,
  showItemsMenu,
  showPlayerMenu,
  showStartMenu,
  showPokedex,
} from "../state/uiSlice";
import useEvent from "../app/use-event";
import emitter, { Event } from "../app/emitter";
import { useState } from "react";
import {
  save,
  selectName,
  selectPokemon,
  selectGameState,
  selectPokemonEncounter,
  selectTrainerEncounter,
  updateSpecificPokemon,
} from "../state/gameSlice";
import { saveToCloud, getCurrentUserId } from "../app/cloud-save";
import PokemonList from "./PokemonList";
import { DEBUG_MODE } from "../app/constants";
import { getPokemonStats } from "../app/use-pokemon-stats";

const StartMenu = () => {
  const dispatch = useDispatch();
  const show = useSelector(selectStartMenu);
  const disabled = useSelector(selectStartMenuSubOpen);
  const name = useSelector(selectName);
  const gameState = useSelector(selectGameState);
  const saving = !!useSelector(selectConfirmationMenu);
  const allPokemon = useSelector(selectPokemon);

  // Bloquear apertura del menú Start durante combate, diálogo o encuentro con entrenador
  const pokemonEncounter = useSelector(selectPokemonEncounter);
  const trainerEncounter = useSelector(selectTrainerEncounter);
  const activeText = useSelector(selectText);
  const activeTextThenAction = useSelector(selectTextThenAction);
  const isBlocked = !!pokemonEncounter || !!trainerEncounter || !!activeText || !!activeTextThenAction;

  const [pokemon, setPokemon] = useState(false);

  useEvent(Event.Start, () => {
    if (isBlocked) return;
    dispatch(showStartMenu());
    emitter.emit(Event.StopMoving);
  });

  return (
    <>
      <Menu
        disabled={disabled || saving || pokemon}
        show={show}
        close={() => dispatch(hideStartMenu())}
        menuItems={[
          {
            label: "Pokédex",
            action: () => {
              dispatch(showPokedex());
              dispatch(hideStartMenu());
            },
          },
          {
            label: "Pokémon",
            action: () => {
              if (allPokemon.length === 0) return;
              setPokemon(true);
            },
          },
          {
            label: "Mochila",
            action: () => dispatch(showItemsMenu()),
          },
          {
            label: "Jugador",
            action: () => dispatch(showPlayerMenu()),
          },
          {
            label: "Guardar",
            action: () => {
              dispatch(
                showConfirmationMenu({
                  preMessage: "¿Quieres GUARDAR la partida?",
                  postMessage: `¡${name} guardó la partida!`,
                  confirm: () => {
                    dispatch(save());
                    const userId = getCurrentUserId();
                    if (userId) saveToCloud(userId, gameState);
                  },
                })
              );
            },
          },
          ...(DEBUG_MODE
            ? [
                {
                  label: "Magic",
                  action: () => {
                    dispatch(
                      updateSpecificPokemon({
                        index: 0,
                        pokemon: {
                          id: 1,
                          level: 15,
                          xp: 0,
                          hp: getPokemonStats(3, 100).hp,
                          moves: [
                            { id: "scratch", pp: 35 },
                            { id: "growl", pp: 40 },
                          ],
                        },
                      })
                    );
                  },
                },
              ]
            : []),
          // {
          //   label: "Option",
          //   action: () => console.log("TODO"),
          // },
        ]}
      />
      {pokemon && <PokemonList close={() => setPokemon(false)} />}
    </>
  );
};

export default StartMenu;
