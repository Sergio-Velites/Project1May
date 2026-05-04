import { useDispatch, useSelector } from "react-redux";
import { MapId } from "../maps/map-types";
import useBadges from "./use-badges";
import {
  completeQuest,
  moveLeft,
  selectCompletedQuests,
  selectName,
  selectPos,
  selectPokemon,
  setPos,
  takeMoney,
} from "../state/gameSlice";
import { setBlackScreen, showConfirmationMenu } from "../state/uiSlice";

export interface QuestType {
  trigger: "talk" | "walk";
  map: MapId;
  positions: Record<number, number[]>;
  active: () => boolean;
  text: string[];
  action: () => void;
}

export const useActiveMapQuests = (map: MapId) => {
  const quests = useQuests();
  return quests.filter((quest) => quest.map === map && quest.active());
};

const useQuests = () => {
  const dispatch = useDispatch();
  const badges = useBadges();
  const completedQuests = useSelector(selectCompletedQuests);
  const pos = useSelector(selectPos);
  const pokemon = useSelector(selectPokemon);
  const playerName = useSelector(selectName);

  const quests: QuestType[] = [
    // ── House A 1F: madre bronca nada más bajar las escaleras ─────────────────
    {
      trigger: "walk",
      map: MapId.PalletTownHouseA1F,
      positions: {
        2: [6],
        3: [2, 3, 4, 5],
        4: [1, 2, 5, 6],
        5: [1, 2, 5, 6],
      },
      active: () => !completedQuests.includes("madre-bronca-done"),
      text: [
        `¡${playerName.toUpperCase()}! ¡Qué coño haces!`,
        "¿Te has quedado otra vez jugando?",
        "¡Ya te lo dije! ¡Es un día importante!",
        "¡El Profesor Oak te está esperando!",
        "¡Debe llevar ya 8 vinos!",
        "¡Date prisa y no te entretengas más!",
        "¡Yo ya me voy a comprar mucho anís!",
      ],
      action: () => {
        dispatch(completeQuest("madre-bronca-done"));
      },
    },
    {
      trigger: "walk",
      map: MapId.PalletTown,
      positions: {
        0: [10, 11],
        1: [10, 11],
      },
      active: () => pokemon.length === 0,
      text: [
        "¡Viva el vino!... hip!",
        "¡Aquí no pasa nadie sin su POKEMON!",
        "¡Ve al laboratorio primero!",
      ],
      action: () => {
        dispatch(setPos({ x: pos.x, y: 2 }));
      },
    },
    // Pewter City
    {
      trigger: "walk",
      map: MapId.PewterCity,
      positions: {
        17: [35],
        18: [35],
        19: [35],
      },
      active: () => badges.length === 0,
      text: [
        "You're a Trainer, right?",
        "Brock's looking for new challengers.",
        "Follow me!",
      ],
      action: () => {
        dispatch(moveLeft());
        dispatch(setBlackScreen(true));
        setTimeout(() => {
          dispatch(setPos({ x: 14, y: 19 }));
        }, 300);
        setTimeout(() => {
          dispatch(setBlackScreen(false));
        }, 600);
      },
    },
    {
      trigger: "walk",
      map: MapId.PewterCityMuseum1f,
      positions: {
        4: [9, 10],
      },
      active: () => !completedQuests.includes("pewter-museum-1f-paid"),
      text: ["It's $50 for a child's ticket."],
      action: () => {
        dispatch(
          showConfirmationMenu({
            preMessage: "Would you like to come in?",
            postMessage: "Right $50! Thank you!",
            confirm: () => {
              dispatch(completeQuest("pewter-museum-1f-paid"));
              dispatch(takeMoney(50));
            },
            cancel: () => {
              dispatch(setPos({ x: pos.x, y: pos.y + 1 }));
            },
          })
        );
      },
    },
  ];

  return quests;
};

export default useQuests;
