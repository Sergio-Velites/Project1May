import { PokemonInstance, StatusType } from "../state/state-types";
import { ItemType } from "./use-item-data";

// ─────────────────────────────────────────────────────────────────────────
// Objetos equipados (Gen II) — constantes de combate.
//
// Valores verificados contra el desensamblado oficial de Pokémon Cristal
// (pret/pokecrystal, data/items/attributes.asm):
//   · Objetos de tipo: +10% de daño a movimientos de su tipo (param 10).
//   · Cinta Focus:  30/256 de sobrevivir un golpe letal con 1 PS.
//   · Garra Rápida: 60/256 de atacar primero ignorando velocidad.
//   · Roca del Rey: 30/256 de flinch en moves de daño sin flinch propio.
//   · Polvo Brillo: −20/256 a la precisión de quien ataca al portador.
//   · Restos: cura 1/16 del HP máximo al final de cada turno.
//   · Baya +10 PS · Baya Dorada +30 PS (se consumen con PS ≤ 1/2).
//
// Nota de alcance: los efectos se aplican al equipo del JUGADOR (los rivales
// de este juego no llevan objetos), salvo donde se indique lo contrario.
// ─────────────────────────────────────────────────────────────────────────

export const FOCUS_BAND_CHANCE = 30 / 256;
export const QUICK_CLAW_CHANCE = 60 / 256;
export const KINGS_ROCK_CHANCE = 30 / 256;
/** Puntos porcentuales que Polvo Brillo resta a la precisión rival (20/256). */
export const BRIGHTPOWDER_ACC_DROP = (20 / 256) * 100;
/** Fracción del HP máximo que curan los Restos al final del turno. */
export const LEFTOVERS_FRACTION = 1 / 16;
/** Umbral de PS (fracción del máximo) que dispara las bayas de PS. */
export const HP_BERRY_THRESHOLD = 0.5;

/** Objeto de tipo → tipo de movimiento que potencia ×1.1.
 *  (Colmillo Dragón potencia dragón: comportamiento corregido — en GS el
 *  boost estaba en Escama Dragón por un bug; aquí la Escama es solo
 *  objeto de evolución.) */
export const TYPE_BOOST_ITEMS: Partial<Record<ItemType, string>> = {
  [ItemType.PinkBow]: "normal",
  [ItemType.Charcoal]: "fire",
  [ItemType.MysticWater]: "water",
  [ItemType.Magnet]: "electric",
  [ItemType.MiracleSeed]: "grass",
  [ItemType.NeverMeltIce]: "ice",
  [ItemType.BlackBelt]: "fighting",
  [ItemType.PoisonBarb]: "poison",
  [ItemType.SoftSand]: "ground",
  [ItemType.SharpBeak]: "flying",
  [ItemType.TwistedSpoon]: "psychic",
  [ItemType.SilverPowder]: "bug",
  [ItemType.HardStone]: "rock",
  [ItemType.SpellTag]: "ghost",
  [ItemType.DragonFang]: "dragon",
  [ItemType.BlackGlasses]: "dark",
  [ItemType.MetalCoat]: "steel",
};

/** Multiplicador de daño por objeto de tipo (Gen II: ×1.1). */
export const getTypeBoostMult = (
  heldItem: ItemType | null | undefined,
  moveType: string
): number =>
  heldItem && TYPE_BOOST_ITEMS[heldItem] === moveType ? 1.1 : 1;

/** Stages de crítico extra por objeto (Periscopio +1; Puño Suerte solo
 *  Chansey +2; Palo solo Farfetch'd +2). */
export const getCritItemBonus = (
  heldItem: ItemType | null | undefined,
  speciesId: number
): number => {
  if (!heldItem) return 0;
  if (heldItem === ItemType.ScopeLens) return 1;
  if (heldItem === ItemType.LuckyPunch && speciesId === 113) return 2;
  if (heldItem === ItemType.Stick && speciesId === 83) return 2;
  return 0;
};

/** Multiplicador de ataque por objeto de especie:
 *  Bola Luminosa (Pikachu): ×2 en moves especiales.
 *  Hueso Grueso (Cubone/Marowak): ×2 en moves físicos. */
export const getSpeciesAttackMult = (
  heldItem: ItemType | null | undefined,
  speciesId: number,
  isPhysical: boolean
): number => {
  if (!heldItem) return 1;
  if (heldItem === ItemType.LightBall && speciesId === 25 && !isPhysical) return 2;
  if (
    heldItem === ItemType.ThickClub &&
    (speciesId === 104 || speciesId === 105) &&
    isPhysical
  )
    return 2;
  return 1;
};

/** Multiplicador de defensa por objeto de especie:
 *  Polvo Metálico (Ditto sin transformar también aplica aquí): ×1.5. */
export const getSpeciesDefenseMult = (
  heldItem: ItemType | null | undefined,
  speciesId: number
): number =>
  heldItem === ItemType.MetalPowder && speciesId === 132 ? 1.5 : 1;

/** Bayas que curan PS al caer a la mitad: cantidad restaurada. */
export const HP_BERRIES: Partial<Record<ItemType, number>> = {
  [ItemType.Berry]: 10,
  [ItemType.GoldBerry]: 30,
};

/** Bayas que curan estados persistentes en cuanto el portador lo sufre.
 *  Fieles a Gen II: Baya Hielo cura QUEMADURA y Baya Tostada cura
 *  CONGELACIÓN (verificado en pokecrystal — es contraintuitivo a propósito). */
export const STATUS_CURE_BERRIES: Partial<Record<ItemType, StatusType[]>> = {
  [ItemType.PrzCureBerry]: ["paralysis"],
  [ItemType.PsnCureBerry]: ["poison", "badly-poisoned"],
  [ItemType.MintBerry]: ["sleep"],
  [ItemType.IceBerry]: ["burn"],
  [ItemType.BurntBerry]: ["freeze"],
  [ItemType.MiracleBerry]: [
    "poison",
    "badly-poisoned",
    "burn",
    "paralysis",
    "sleep",
    "freeze",
  ],
};

/** ¿Esta baya cura confusión? (Baya Amarga; la Milagro también en Gen II). */
export const curesConfusion = (item: ItemType | null | undefined): boolean =>
  item === ItemType.BitterBerry || item === ItemType.MiracleBerry;

/** ¿El objeto del portador cura este estado? Devuelve true si debe
 *  consumirse la baya y limpiarse el estado. */
export const berryCuresStatus = (
  item: ItemType | null | undefined,
  status: StatusType
): boolean => !!item && !!STATUS_CURE_BERRIES[item]?.includes(status);

/** Conjunto de todos los objetos equipables (para la opción "Dar"). */
export const HOLDABLE_ITEMS: ReadonlySet<ItemType> = new Set([
  ...Object.keys(TYPE_BOOST_ITEMS),
  ...Object.keys(HP_BERRIES),
  ...Object.keys(STATUS_CURE_BERRIES),
  ItemType.BitterBerry,
  ItemType.MysteryBerry,
  ItemType.Leftovers,
  ItemType.FocusBand,
  ItemType.QuickClaw,
  ItemType.KingsRock,
  ItemType.ScopeLens,
  ItemType.BrightPowder,
  ItemType.AmuletCoin,
  ItemType.LuckyEgg,
  ItemType.Everstone,
  ItemType.LightBall,
  ItemType.ThickClub,
  ItemType.LuckyPunch,
  ItemType.Stick,
  ItemType.MetalPowder,
  ItemType.DragonScale,
  ItemType.UpGrade,
] as ItemType[]);

/** ¿El Pokémon lleva este objeto? (azúcar sintáctico con null-safety). */
export const holds = (
  p: PokemonInstance | undefined,
  item: ItemType
): boolean => !!p && p.heldItem === item;
