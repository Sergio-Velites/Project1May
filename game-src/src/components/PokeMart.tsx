import { useState } from "react";
import styled from "styled-components";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import { useDispatch, useSelector } from "react-redux";
import {
  addInventory,
  consumeItem,
  gainMoney,
  selectInventory,
  selectMap,
  selectMoney,
  selectPos,
  takeMoney,
} from "../state/gameSlice";
import {
  hidePokeMartMenu,
  selectPokeMartMenu,
  selectStartMenu,
  showPokeMartMenu,
} from "../state/uiSlice";
import Frame from "./Frame";
import Menu from "./Menu";
import useItemData, { ItemType } from "../app/use-item-data";
import { InventoryItemType } from "../state/state-types";

const StyledPokeMart = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const TextContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 30%;
  z-index: 100;
`;

const MenuContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 100;
  width: 55%;
`;

const MoneyContainer = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  z-index: 100;
  width: 45%;
`;

const MoneyHeader = styled.div`
  padding: 1.3cqw;
  padding-bottom: 0;
  font-size: 2.4cqw;
  font-family: "PokemonGB";
  background: var(--bg);
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
`;

const PokeMart = () => {
  const dispatch = useDispatch();

  const pos = useSelector(selectPos);
  const map = useSelector(selectMap);
  const show = useSelector(selectPokeMartMenu);
  const startMenuOpen = useSelector(selectStartMenu);
  const money = useSelector(selectMoney);
  const itemData = useItemData();
  const inventory = useSelector(selectInventory);

  const [stage, setStage] = useState<number>(0);
  const [lastPurchase, setLastPurchase] = useState<ItemType | null>(null);
  const [sellData, setSellData] = useState<{
    item: string;
    amount: number;
  } | null>(null);

  const exit = () => {
    dispatch(hidePokeMartMenu());
    setStage(0);
  };

  useEvent(Event.A, () => {
    if (startMenuOpen) return;

    if (!show) {
      if (map.store && pos.y === map.store.y && pos.x - 1 === map.store.x) {
        dispatch(showPokeMartMenu());
      }
    } else {
      if (!!lastPurchase) setLastPurchase(null);
      if (!!sellData) setSellData(null);
      if (stage === 4) setStage(2);
    }
  });

  if (!show) return null;

  if (!map.storeItems) throw new Error("No store items");

  const text = () => {
    if (!!sellData)
      return `${sellData.item.toUpperCase()} vendido por $${sellData.amount}`;
    if (!!lastPurchase) return `¡${itemData[lastPurchase].name} comprado!`;
    if (stage === 0) return "¡Hola! ¿En qué puedo ayudarte?";
    if (stage === 2) return "Tómate tu tiempo.";
    if (stage === 4) return "¡No tienes suficiente dinero!";
    if (stage === 3) return "¿Qué quieres vender?";
  };

  const buy = (item: ItemType) => {
    const data = itemData[item];
    if (!data.cost) throw new Error("No cost");
    if (money < data.cost) {
      setStage(4);
      return;
    }
    dispatch(
      addInventory({
        item,
        amount: 1,
      })
    );
    dispatch(takeMoney(data.cost));
    setLastPurchase(item);
  };

  const sell = (item: ItemType) => {
    const data = itemData[item];
    if (!data.sellPrice) throw new Error("No sell price");
    dispatch(consumeItem(item));
    dispatch(gainMoney(data.sellPrice));
    setSellData({ item: data.name, amount: 1 });
  };

  return (
    <StyledPokeMart>
      <TextContainer>
        <Frame
          wide
          tall
          flashing={[4].includes(stage) || !!lastPurchase || !!sellData}
        >
          {text()}
        </Frame>
      </TextContainer>
      <MoneyContainer>
        <Frame rightText wide>{`$${money.toLocaleString()}`}</Frame>
        <MoneyHeader>DINERO</MoneyHeader>
      </MoneyContainer>
      <MenuContainer>
        <Menu
          wide
          show={[0, 2, 4, 3].includes(stage)}
          disabled={startMenuOpen || [2, 4, 3].includes(stage)}
          top="0"
          left="0"
          noExit
          close={() => exit()}
          menuItems={[
            {
              label: "COMPRAR",
              action: () => setStage(2),
            },
            {
              label: "VENDER",
              action: () => setStage(3),
            },
            {
              label: "SALIR",
              action: () => exit(),
            },
          ]}
        />
      </MenuContainer>
      <Menu
        show={[2, 4].includes(stage)}
        close={() => setStage(0)}
        disabled={startMenuOpen || [4].includes(stage) || !!lastPurchase}
        menuItems={map.storeItems.map((item) => {
          const data = itemData[item];
          if (!data.cost) throw new Error("No cost");
          return {
            label: data.name.toUpperCase(),
            action: () => buy(item),
            value: `$${data.cost.toLocaleString()}`,
          };
        })}
      />
      <Menu
        show={[3].includes(stage)}
        close={() => setStage(0)}
        disabled={startMenuOpen || !!sellData}
        menuItems={inventory
          .filter(
            (item: InventoryItemType) =>
              item.amount > 0 &&
              !itemData[item.item].badge &&
              !!itemData[item.item].sellPrice
          )
          .map((item: InventoryItemType) => {
            const data = itemData[item.item];
            return {
              label: data.name.toUpperCase(),
              action: () => sell(item.item),
              value: item.amount,
            };
          })}
      />
    </StyledPokeMart>
  );
};

export default PokeMart;
