import { useDispatch, useSelector } from "react-redux";
import { MapId } from "../maps/map-types";
import useBadges from "./use-badges";
import {
  addInventory,
  completeQuest,
  moveLeft,
  selectCompletedQuests,
  selectName,
  selectPos,
  selectPokemon,
  setPos,
  takeMoney,
} from "../state/gameSlice";
import { ItemType } from "./use-item-data";
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
        2: [10, 11],
      },
      active: () => pokemon.length === 0,
      text: [
        "Viva el vino!",
        "Hip! ¡Aquí no pasa nadie sin un POKEMON!",
        "Hip! Habla con el borracho Oak y ",
        "que te de uno, hip!",
        "antes de que se los beba todos, hip!",
      ],
      action: () => {
        dispatch(setPos({ x: pos.x, y: 3 }));
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
        "¡Ey, tú!",
        "¿Buscas la Bodega de MONJARDÍN?",
        "¡Sígueme, que te la enseño!",
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
      text: ["El acceso a la Bodega tiene un precio...", "¡50 pokedólares!"],
      action: () => {
        dispatch(
          showConfirmationMenu({
            preMessage: "¿Deseas ver la colección de vinos?",
            postMessage: "¡Gracias! ¡Buen provecho!",
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
    // Soto Lezkairu — Maestro del Vino da SodaPop ("Vino Tinto") una sola vez
    {
      trigger: "walk",
      map: MapId.ViridianCity,
      positions: {
        23: [8],
      },
      active: () => !completedQuests.includes("vino-tinto-dado"),
      text: [
        "El MAESTRO DEL VINO te da una botella de VINO TINTO.",
        "¡Úsala cuando más lo necesites!",
      ],
      action: () => {
        dispatch(addInventory({ item: ItemType.SodaPop, amount: 1 }));
        dispatch(completeQuest("vino-tinto-dado"));
      },
    },
  ];

  return quests;
};

export default useQuests;
