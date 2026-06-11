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
import useItemData, { ItemData } from "../app/use-item-data";
import { InventoryItemType } from "../state/state-types";
import { HOLDABLE_ITEMS } from "../app/held-item-helper";
import { getPokemonMetadata } from "../app/use-pokemon-metadata";

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

  return (
    <>
      <Menu
        disabled={!!selected || usingItem || learningMove}
        show={show}
        close={() => dispatch(hideItemsMenu())}
        menuItems={inventory
          .filter(
            (item: InventoryItemType) =>
              item.amount > 0 && !itemData[item.item].badge
          )
          .map((item: InventoryItemType) => {
            return {
              label: itemData[item.item].name,
              value: item.amount,
              action: () => setSelected(itemData[item.item]),
            };
          })}
      />
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
            ...(HOLDABLE_ITEMS.has(selected.type) && !inBattle
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
