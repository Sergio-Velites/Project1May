/**
 * StaticPokemonNpc — Pokémon estático en el mapa (estilo legendarios Gen I).
 *
 * Lee `currentMap.staticPokemon`, filtra los ya capturados/derrotados
 * (questId en completedQuests) y renderiza su sprite en world-coords.
 * Al pulsar A estando adyacente, lanza un encuentro salvaje.
 * Va DENTRO de BackgroundContainer en Game.tsx.
 */

import { useCallback } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  completeQuest,
  encounterPokemon,
  selectCompletedQuests,
  selectDirection,
  selectMapId,
  selectPos,
} from "../state/gameSlice";
import { selectMenuOpen, showTextThenAction } from "../state/uiSlice";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import { directionModifier } from "../app/map-helper";
import PixelImage from "../styles/PixelImage";
import { xToPx, yToPx } from "../app/position-helper";
import mapData from "../maps/map-data";
import { StaticPokemonType } from "../maps/map-types";
import getPokemonEncounter from "../app/pokemon-encounter-helper";

// Importar todos los sprites de la carpeta simple/
import birdA    from "../assets/pokemon/simple/bird-a.png";
import birdB    from "../assets/pokemon/simple/bird-b.png";
import bugA     from "../assets/pokemon/simple/bug-a.png";
import bugB     from "../assets/pokemon/simple/bug-b.png";
import cuteA    from "../assets/pokemon/simple/cute-a.png";
import cuteB    from "../assets/pokemon/simple/cute-b.png";
import dogA     from "../assets/pokemon/simple/dog-a.png";
import dogB     from "../assets/pokemon/simple/dog-b.png";
import dragonA  from "../assets/pokemon/simple/dragon-a.png";
import dragonB  from "../assets/pokemon/simple/dragon-b.png";
import fishA    from "../assets/pokemon/simple/fish-a.png";
import fishB    from "../assets/pokemon/simple/fish-b.png";
import fossilA  from "../assets/pokemon/simple/fossil-a.png";
import fossilB  from "../assets/pokemon/simple/fossil-b.png";
import grassA   from "../assets/pokemon/simple/grass-a.png";
import grassB   from "../assets/pokemon/simple/grass-b.png";
import monsterA from "../assets/pokemon/simple/monster-a.png";
import monsterB from "../assets/pokemon/simple/monster-b.png";

const SPRITE_MAP: Record<string, string> = {
  "bird-a":    birdA,
  "bird-b":    birdB,
  "bug-a":     bugA,
  "bug-b":     bugB,
  "cute-a":    cuteA,
  "cute-b":    cuteB,
  "dog-a":     dogA,
  "dog-b":     dogB,
  "dragon-a":  dragonA,
  "dragon-b":  dragonB,
  "fish-a":    fishA,
  "fish-b":    fishB,
  "fossil-a":  fossilA,
  "fossil-b":  fossilB,
  "grass-a":   grassA,
  "grass-b":   grassB,
  "monster-a": monsterA,
  "monster-b": monsterB,
};

const StyledNpc = styled.div<{ $x: number; $y: number }>`
  position: absolute;
  top: ${(p) => yToPx(p.$y)};
  left: ${(p) => xToPx(p.$x)};
  z-index: 50;
  transform: translateY(-20%);
`;

const Sprite = styled(PixelImage)`
  width: ${xToPx(1)};
  image-rendering: pixelated;
`;

const StaticPokemonNpc = () => {
  const dispatch = useDispatch();
  const completedQuests = useSelector(selectCompletedQuests);
  const pos = useSelector(selectPos);
  const facing = useSelector(selectDirection);
  const mapId = useSelector(selectMapId);
  const menuOpen = useSelector(selectMenuOpen);

  const currentMap = mapData[mapId];
  const all: StaticPokemonType[] = currentMap?.staticPokemon ?? [];
  const visible = all.filter((sp) => !completedQuests.includes(sp.questId));

  useEvent(
    Event.A,
    useCallback(() => {
      if (menuOpen) return;
      const mod = directionModifier(facing);
      const targetX = pos.x + mod.x;
      const targetY = pos.y + mod.y;
      const target = visible.find(
        (sp) => sp.pos.x === targetX && sp.pos.y === targetY
      );
      if (!target) return;
      const encounter = getPokemonEncounter(target.pokemonId, target.level);
      const launchBattle = () => {
        dispatch(encounterPokemon({ ...encounter, staticQuestId: target.questId }));
      };
      if (target.intro && target.intro.length > 0) {
        dispatch(showTextThenAction({ text: target.intro, action: launchBattle }));
      } else {
        launchBattle();
      }
    }, [menuOpen, pos, facing, visible, dispatch])
  );

  if (visible.length === 0) return null;

  return (
    <>
      {visible.map((sp) => {
        if (sp.sprite === "none") return null;
        const src = SPRITE_MAP[sp.sprite];
        if (!src) return null;
        return (
          <StyledNpc
            key={`${mapId}-static-${sp.pos.x}-${sp.pos.y}`}
            $x={sp.pos.x}
            $y={sp.pos.y}
          >
            <Sprite src={src} />
          </StyledNpc>
        );
      })}
    </>
  );
};

export default StaticPokemonNpc;
