import { useDispatch, useSelector } from "react-redux";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import {
  addPokemon,
  claimDayCareGift,
  selectDayCareLastGift,
  selectDirection,
  selectMap,
  selectName,
  selectPos,
} from "../state/gameSlice";
import {
  selectMenuOpen,
  showConfirmationMenu,
  showText,
} from "../state/uiSlice";
import { Direction, MoveState } from "../state/state-types";
import { getPokemonMetadata } from "../app/use-pokemon-metadata";
import { getPokemonStats } from "../app/use-pokemon-stats";
import { getMoveMetadata } from "../app/use-move-metadata";
import {
  DAY_CARE_LEVEL,
  dailyBabyId,
  getDayCareSeed,
  todayLocalDateString,
} from "../app/day-care-helper";

// Últimos 4 moves aprendidos con levelLearnedAt <= level (igual que MapGiftModal).
const computeInitialMoves = (id: number, level: number): MoveState[] => {
  const meta = getPokemonMetadata(id);
  return meta.moves
    .filter((m) => m.levelLearnedAt <= level)
    .sort((a, b) => a.levelLearnedAt - b.levelLearnedAt)
    .slice(-4)
    .map((m) => ({ id: m.name, pp: getMoveMetadata(m.name).pp || 0 }));
};

/**
 * DayCareNpc — Goñi, en la guardería (La Huerta de Goñi). Detecta A frente al
 * tile `map.dayCareNpc` (desde abajo, mirando arriba, igual que OnlineBattleNpc)
 * y regala UN Pokémon bebé al día (determinista por jugador/fecha). Tras cogerlo,
 * el diálogo es estático hasta el día siguiente. No renderiza nada; el sprite de
 * Goñi es un NPC/entrenador normal del mapa colocado en ese tile.
 */
const DayCareNpc = () => {
  const dispatch = useDispatch();
  const pos = useSelector(selectPos);
  const direction = useSelector(selectDirection);
  const map = useSelector(selectMap);
  const menuOpen = useSelector(selectMenuOpen);
  const name = useSelector(selectName);
  const lastGift = useSelector(selectDayCareLastGift);

  useEvent(Event.A, () => {
    if (menuOpen) return;
    if (!map.dayCareNpc) return;
    if (direction !== Direction.Up) return;
    if (pos.x !== map.dayCareNpc.x) return;
    if (pos.y - 1 !== map.dayCareNpc.y) return;

    const today = todayLocalDateString();

    // Ya recogido hoy → diálogo estático hasta mañana.
    if (lastGift === today) {
      dispatch(
        showText([
          "GOÑI: Ya te llevaste la cosecha de hoy.",
          "Vuelve mañana, que hay otro madurando.",
        ])
      );
      return;
    }

    const babyId = dailyBabyId(getDayCareSeed(name), today);
    const babyName = getPokemonMetadata(babyId).name.toUpperCase();

    dispatch(
      showConfirmationMenu({
        preMessage: `GOÑI: ¡Hoy ha brotado un ${babyName}! ¿Te lo llevas?`,
        confirm: async () => {
          const stats = getPokemonStats(babyId, DAY_CARE_LEVEL);
          dispatch(
            addPokemon({
              id: babyId,
              level: DAY_CARE_LEVEL,
              xp: 0,
              hp: stats.hp,
              moves: computeInitialMoves(babyId, DAY_CARE_LEVEL),
            })
          );
          dispatch(claimDayCareGift(today));
          return [
            `¡${babyName} es tuyo!`,
            "GOÑI: Cuídalo como a un buen tomate, ¿eh?",
          ];
        },
        postMessage: "",
        cancel: () => {
          dispatch(showText(["GOÑI: Aquí seguirá, madurando."]));
        },
      })
    );
  });

  return null;
};

export default DayCareNpc;
