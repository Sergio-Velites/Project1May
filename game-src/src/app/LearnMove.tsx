import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { selectLearningMove, stopLearningMove } from "../state/uiSlice";
import Frame from "../components/Frame";
import { useState, useEffect } from "react";
import useEvent from "./use-event";
import { Event } from "./emitter";
import useMoveMetadata, { getMoveMetadata } from "./use-move-metadata";
import PokemonList from "../components/PokemonList";
import {
  consumeItem,
  selectPokemon,
  updateSpecificPokemon,
} from "../state/gameSlice";
import { getPokemonMetadata } from "./use-pokemon-metadata";
import useIsMobile from "./use-is-mobile";
import Menu, { MenuItemType } from "../components/Menu";

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

const LearnMove = () => {
  const dispatch = useDispatch();
  const move = useSelector(selectLearningMove);
  const moveData = useMoveMetadata(move?.move ?? null);
  const pokemon = useSelector(selectPokemon);
  const isMobile = useIsMobile();

  const [stage, setStage] = useState(0);
  const [pokemonIndex, setPokemonIndex] = useState(0);
  // Flag para saber si este flujo fue iniciado por RareCandy (ya hay pokémon preseleccionado)
  const [preselectedHandled, setPreselectedHandled] = useState(false);

  const item = move?.consume ? "MT" : "MO";

  const end = () => {
    setPokemonIndex(0);
    setStage(0);
    setPreselectedHandled(false);
    dispatch(stopLearningMove());
  };

  // Cuando viene de RareCandy (preselectedPokemonIndex definido): saltar directamente al stage correcto
  useEffect(() => {
    if (!move || move.preselectedPokemonIndex === undefined || !moveData || preselectedHandled) return;
    const idx = move.preselectedPokemonIndex;
    setPokemonIndex(idx);
    setPreselectedHandled(true);
    const p = pokemon[idx];
    if (!p) return;
    // Defensa: si ya conoce el movimiento, no añadir duplicado
    if (p.moves.some((m) => m.id === moveData.id)) {
      end();
      return;
    }
    if (p.moves.length === 4) {
      // El pokémon tiene 4 moves: ir al flujo "elige cuál olvidar"
      setStage(3);
    } else {
      // El pokémon tiene hueco: aprender directamente
      dispatch(
        updateSpecificPokemon({
          index: idx,
          pokemon: {
            ...p,
            moves: [...p.moves, { id: moveData.id, pp: moveData.pp || 0 }],
          },
        })
      );
      setStage(7);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [move, moveData, preselectedHandled, pokemon, dispatch]);

  useEvent(Event.A, () => {
    if (!move) return;
    if (stage === 0) setStage(1);
    if (stage === 1) setStage(2);
    if (stage === 3) setStage(4);
    if (stage === 4) setStage(5);
    if (stage === 5) setStage(6);
    if (stage === 7) end();
  });

  if (!move) return null;

  const text = () => {
    if (!moveData) return "";
    if (stage === 0) return `¡${item} cargada!`;
    if (stage === 1) return `¡Contiene ${moveData.name.toUpperCase()}!`;
    if (stage === 3)
      return `${getPokemonMetadata(
        pokemon[pokemonIndex].id
      ).name.toUpperCase()} intenta aprender ${moveData.name.toUpperCase()}.`;
    if (stage === 4) return `¡Pero no puede aprender más de 4 movimientos!`;
    if (stage === 5 || stage === 6)
      return `¿Qué movimiento quieres olvidar?`;
    if (stage === 7)
      return `¡${getPokemonMetadata(
        pokemon[pokemonIndex].id
      ).name.toUpperCase()} aprendió ${moveData.name.toUpperCase()}!`;
  };

  return (
    <>
      <TextContainer>
        <Frame wide tall flashing>
          {text()}
        </Frame>
      </TextContainer>
      {stage === 2 && (
        <PokemonList
          close={() => end()}
          text={`¿En qué Pokémon usar la ${item}?`}
          moveData={moveData ?? undefined}
          clickPokemon={(index: number) => {
            const pokemon_ = pokemon[index];
            const canLearn = moveData?.learnedBy.includes(pokemon_.id);
            if (!canLearn) return;
            if (!moveData) return;
            // Defensa: si ya conoce el movimiento, no añadir duplicado
            if (pokemon_.moves.some((m) => m.id === moveData.id)) {
              end();
              return;
            }
            if (pokemon_.moves.length === 4) {
              setPokemonIndex(index);
              setStage(3);
            } else {
              if (move.consume) {
                dispatch(consumeItem(move.item));
              }
              dispatch(
                updateSpecificPokemon({
                  index: index,
                  pokemon: {
                    ...pokemon[index],
                    moves: [
                      ...pokemon[index].moves,
                      {
                        id: moveData.id,
                        pp: moveData.pp || 0,
                      },
                    ],
                  },
                })
              );
              setStage(7);
            }
          }}
        />
      )}
      <Menu
        noExitOption
        padding={isMobile ? "100px" : "40vw"}
        show={stage === 6}
        menuItems={[
          ...pokemon[pokemonIndex].moves.map((m) => {
            const item: MenuItemType = {
              label: getMoveMetadata(m.id)?.name?.toUpperCase() ?? m.id.toUpperCase(),
              action: () => {
                if (!moveData) return;
                if (move.consume) {
                  dispatch(consumeItem(move.item));
                }
                dispatch(
                  updateSpecificPokemon({
                    index: pokemonIndex,
                    pokemon: {
                      ...pokemon[pokemonIndex],
                      moves: [
                        ...pokemon[pokemonIndex].moves.filter(
                          (move) => move.id !== m.id
                        ),
                        {
                          id: moveData.id,
                          pp: moveData.pp || 0,
                        },
                      ],
                    },
                  })
                );
                setStage(7);
              },
            };
            return item;
          }),
          {
            label: moveData?.name || "Error",
            action: () => end(),
          },
        ]}
        close={() => end()}
        bottom="0"
        right="0"
      />
    </>
  );
};

export default LearnMove;
