import { useSelector } from "react-redux";
import { selectInventory } from "../state/gameSlice";
import { ItemType } from "./use-item-data";

const GYM_BADGES = new Set<ItemType>([
  ItemType.BoulderBadge,
  ItemType.CascadeBadge,
  ItemType.ThunderBadge,
  ItemType.RainbowBadge,
  ItemType.SoulBadge,
  ItemType.MarshBadge,
  ItemType.VolcanoBadge,
  ItemType.EarthBadge,
]);

const useBadges = () => {
  const inventory = useSelector(selectInventory);

  return inventory.filter((item) =>
    GYM_BADGES.has(item.item as ItemType) && item.amount > 0
  );
};

export default useBadges;
