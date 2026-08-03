import { useDispatch, useSelector } from "react-redux";
import Menu from "./Menu";
import {
  hideItemsMenu,
  incrementPlayerTurnTick,
  selectActionOnPokemon,
  selectConfirmationMenu,
  selectItemsMenu,
  selectLearningMove,
  showActionOnPokemon,
  showConfirmationMenu,
  showText,
} from "../state/uiSlice";
import {
  addInventory,
  consumeItem,
  selectInventory,
  selectName,
  selectPokemon,
  selectPokemonEncounter,
  setHeldItem,
} from "../state/gameSlice";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import useItemData, { ItemData } from "../app/use-item-data";
import { InventoryItemType } from "../state/state-types";
import { getPokemonMetadata } from "../app/use-pokemon-metadata";
import {
  getItemDescription,
  BAG_EXIT_DESCRIPTION,
} from "../app/item-descriptions";

// Caja de descripción del objeto resaltado, al estilo de la MOCHILA de
// Oro/Plata (Gen II): la misma caja de diálogo inferior del juego muestra
// qué hace el objeto bajo el cursor. En Rojo/Azul no existían descripciones;
// este es el patrón con el que Game Freak las introdujo en Game Boy.
// Mismo estilo que StyledText (Text.tsx), sin typewriter ni flecha:
// las descripciones aparecen al instante, como en el original.
const DescriptionBox = styled.div`
  position: absolute !important;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 30%;
  background: var(--bg);
  /* Por encima de los menús (100) y por debajo de los diálogos reales (1000),
     que deben taparla cuando aparecen. */
  z-index: 150;

  h1 {
    color: black;
    font-size: 2.4cqw;
    font-family: "PokemonGB";
  }
`;

// Gen II: casi CUALQUIER objeto puede equiparse (aunque solo los de
// held-item-helper.ts tienen efecto en combate — el resto simplemente "lo
// lleva", como en el original). Excluidos: medallas, objetos clave
// (countable: false — Bici, Mapa, cañas…) y MT/MO.
const isGivable = (item: ItemData): boolean =>
  !item.badge &&
  item.countable &&
  !item.type.startsWith("tm") &&
  !item.type.startsWith("hm");

const ItemsMenu = () => {
  const dispatch = useDispatch();
  const show = useSelector(selectItemsMenu);
  const inventory = useSelector(selectInventory);
  const name = useSelector(selectName);
  const inBattle = !!useSelector(selectPokemonEncounter);
  const pokemon = useSelector(selectPokemon);
  const itemData = useItemData();
  const usingItem = !!useSelector(selectActionOnPokemon);
  const learningMove = !!useSelector(selectLearningMove);
  const tossing = !!useSelector(selectConfirmationMenu);

  const [selected, setSelected] = useState<ItemData | null>(null);
  // Índice global del elemento resaltado en la lista de la mochila
  // (incluye la fila "Salir" al final, índice === bagItems.length).
  const [hovered, setHovered] = useState(0);

  // Tracking de uso de objeto en combate. Cuando el jugador pulsa "Usar"
  // sobre un objeto usable en combate, marcamos `pendingBattleConsume`. Al
  // detectar la transición de actionOnPokemon de no-null → null (= el
  // jugador eligió el Pokémon objetivo y la acción se completó), cerramos
  // la mochila y consumimos el turno (rival ataca).
  const pendingBattleConsumeRef = useRef(false);
  const previousActionRef = useRef(usingItem);

  useEffect(() => {
    const prev = previousActionRef.current;
    previousActionRef.current = usingItem;
    if (prev && !usingItem && pendingBattleConsumeRef.current) {
      pendingBattleConsumeRef.current = false;
      dispatch(hideItemsMenu());
      // Consumir turno → PokemonEncounter ejecutará el ataque del rival
      dispatch(incrementPlayerTurnTick());
    }
  }, [usingItem, dispatch]);

  // Lista visible de la mochila: fuente ÚNICA tanto para el menú como para
  // la descripción del elemento resaltado (mismo filtro, mismo orden).
  const bagItems = inventory.filter(
    (item: InventoryItemType) => item.amount > 0 && !itemData[item.item].badge
  );

  // Descripción del objeto bajo el cursor. La fila extra "Salir" (índice
  // bagItems.length) muestra su propio texto, como CANCELAR en Oro/Plata.
  // Si el índice quedara fuera de rango (p. ej. la lista encogió al agotarse
  // un objeto), no se muestra nada.
  const hoveredDescription =
    hovered < bagItems.length
      ? getItemDescription(bagItems[hovered].item)
      : hovered === bagItems.length
      ? BAG_EXIT_DESCRIPTION
      : "";

  return (
    <>
      <Menu
        disabled={!!selected || usingItem || learningMove}
        show={show}
        close={() => dispatch(hideItemsMenu())}
        setHovered={setHovered}
        // Como la MOCHILA de Oro/Plata: lista anclada arriba con menos filas
        // visibles, para que la caja de descripción inferior (30%) no tape
        // los últimos objetos ni la fila "Salir". El scroll funciona igual.
        top="0"
        maxVisible={6}
        menuItems={bagItems.map((item: InventoryItemType) => {
          return {
            label: itemData[item.item].name,
            value: item.amount,
            action: () => setSelected(itemData[item.item]),
          };
        })}
      />
      {show && !usingItem && !learningMove && !tossing && hoveredDescription && (
        <DescriptionBox className="framed no-hd">
          <h1>{hoveredDescription}</h1>
        </DescriptionBox>
      )}
      {selected && (
        <Menu
          disabled={tossing || usingItem}
          show={!!selected}
          close={() => setSelected(null)}
          menuItems={[
            {
              label: "Usar",
              action: () => {
                // Can't use
                if (
                  (inBattle && !selected.usableInBattle) ||
                  (!selected.consumable && !selected.usableOutOfBattle) ||
                  (selected.pokeball && !inBattle)
                ) {
                  dispatch(
                    showText([
                      `OAK: ¡${name}! ¡Éste no es`,
                      "el momento de usarlo!",
                    ])
                  );
                }

                // Can use
                else {
                  // En combate, los objetos NO-pokéball consumen el turno tras
                  // que el jugador elija el Pokémon objetivo. Las pokéballs
                  // tienen su propio flujo (lanzamiento + posible huida →
                  // PokemonEncounter gestiona el turno tras un fallo).
                  if (inBattle && !selected.pokeball) {
                    pendingBattleConsumeRef.current = true;
                  }
                  selected.action();
                  setSelected(null);
                }
              },
            },
            // Dar (Gen II): equipar el objeto a un Pokémon del equipo. Si ya
            // llevaba otro, vuelve a la mochila (intercambio, como el original).
            ...(isGivable(selected) && !inBattle
              ? [
                  {
                    label: "Dar",
                    action: () => {
                      const itemToGive = selected.type;
                      const itemName = selected.name;
                      dispatch(
                        showActionOnPokemon((index: number) => {
                          const target = pokemon[index];
                          if (!target) return;
                          const prev = target.heldItem ?? null;
                          dispatch(setHeldItem({ index, item: itemToGive }));
                          dispatch(consumeItem(itemToGive));
                          if (prev) {
                            dispatch(addInventory({ item: prev, amount: 1 }));
                          }
                          const pkName = getPokemonMetadata(target.id).name.toUpperCase();
                          dispatch(
                            showText(
                              prev
                                ? [
                                    `Le quitaste ${itemData[prev].name} a ${pkName}`,
                                    `y le diste ${itemName}.`,
                                  ]
                                : [`¡${pkName} ahora lleva ${itemName}!`]
                            )
                          );
                        })
                      );
                      setSelected(null);
                    },
                  },
                ]
              : []),
            {
              label: "Tirar",
              action: () => {
                dispatch(
                  showConfirmationMenu({
                    preMessage: `¿Tirar ${selected.name}?`,
                    postMessage: `${name} tiró ${selected.name}`,
                    confirm: () => {
                      dispatch(consumeItem(selected.type));
                    },
                  })
                );
              },
            },
          ]}
        />
      )}
    </>
  );
};

export default ItemsMenu;
