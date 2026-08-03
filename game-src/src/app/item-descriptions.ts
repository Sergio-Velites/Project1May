import { ItemType } from "./use-item-data";
import { getMoveMetadata } from "./use-move-metadata";

/**
 * Descripciones de objetos para la MOCHILA, al estilo de Pokémon Oro/Plata
 * (en Rojo/Azul no existían descripciones; Game Freak las introdujo en Gen II
 * mostrando el texto del objeto resaltado en la caja de diálogo inferior).
 *
 * Redactadas como las oficiales en español, ajustadas al comportamiento REAL
 * de cada objeto en este motor (p. ej. Éter restaura PP de todos los
 * movimientos, el Vino Monjardín marea en combate, etc.).
 */

// MT/MO → movimiento que enseñan (mismo mapeo que use-item-data.ts).
const TM_MOVES: Partial<Record<ItemType, string>> = {
  [ItemType.Tm01]: "mega-punch",
  [ItemType.Tm02]: "razor-wind",
  [ItemType.Tm03]: "swords-dance",
  [ItemType.Tm04]: "whirlwind",
  [ItemType.Tm05]: "mega-kick",
  [ItemType.Tm06]: "toxic",
  [ItemType.Tm07]: "horn-drill",
  [ItemType.Tm08]: "body-slam",
  [ItemType.Tm09]: "take-down",
  [ItemType.Tm10]: "double-edge",
  [ItemType.Tm11]: "bubble-beam",
  [ItemType.Tm12]: "water-gun",
  [ItemType.Tm13]: "ice-beam",
  [ItemType.Tm14]: "blizzard",
  [ItemType.Tm15]: "hyper-beam",
  [ItemType.Tm16]: "pay-day",
  [ItemType.Tm17]: "submission",
  [ItemType.Tm18]: "counter",
  [ItemType.Tm19]: "seismic-toss",
  [ItemType.Tm20]: "rage",
  [ItemType.Tm21]: "mega-drain",
  [ItemType.Tm22]: "solar-beam",
  [ItemType.Tm23]: "dragon-rage",
  [ItemType.Tm24]: "thunderbolt",
  [ItemType.Tm25]: "thunder",
  [ItemType.Tm26]: "earthquake",
  [ItemType.Tm27]: "fissure",
  [ItemType.Tm28]: "dig",
  [ItemType.Tm29]: "psychic",
  [ItemType.Tm30]: "teleport",
  [ItemType.Tm31]: "mimic",
  [ItemType.Tm32]: "double-team",
  [ItemType.Tm33]: "reflect",
  [ItemType.Tm34]: "bide",
  [ItemType.Tm35]: "metronome",
  [ItemType.Tm36]: "self-destruct",
  [ItemType.Tm37]: "egg-bomb",
  [ItemType.Tm38]: "fire-blast",
  [ItemType.Tm39]: "swift",
  [ItemType.Tm40]: "skull-bash",
  [ItemType.Tm41]: "soft-boiled",
  [ItemType.Tm42]: "dream-eater",
  [ItemType.Tm43]: "sky-attack",
  [ItemType.Tm44]: "rest",
  [ItemType.Tm45]: "thunder-wave",
  [ItemType.Tm46]: "psywave",
  [ItemType.Tm47]: "explosion",
  [ItemType.Tm48]: "rock-slide",
  [ItemType.Tm49]: "tri-attack",
  [ItemType.Tm50]: "substitute",
};

const HM_MOVES: Partial<Record<ItemType, string>> = {
  [ItemType.Hm01]: "cut",
  [ItemType.Hm02]: "fly",
  [ItemType.Hm03]: "surf",
  [ItemType.Hm04]: "strength",
  [ItemType.Hm05]: "flash",
};

const DESCRIPTIONS: Partial<Record<ItemType, string>> = {
  // ── Balls ────────────────────────────────────────────────────────────────
  [ItemType.PokeBall]: "Una BALL para atrapar POKéMON salvajes.",
  [ItemType.GreatBall]: "Una buena BALL con más puntería que la POKé BALL.",
  [ItemType.UltraBall]: "Una BALL con mejores resultados que la SUPER BALL.",
  [ItemType.MasterBall]: "La mejor BALL. Atrapa al POKéMON sin fallar.",
  [ItemType.FastBall]: "Una BALL para atrapar POKéMON rápidos.",
  [ItemType.LevelBall]: "Una BALL para POKéMON de nivel inferior al tuyo.",
  [ItemType.LoveBall]: "Atrapa mejor a POKéMON del sexo opuesto al tuyo.",
  [ItemType.LureBall]: "Una BALL para atrapar POKéMON pescados.",
  [ItemType.MoonBall]: "Para POKéMON que evolucionan con PIEDRA LUNAR.",
  [ItemType.HeavyBall]: "Una BALL para atrapar POKéMON pesados.",
  [ItemType.FriendBall]: "El POKéMON atrapado se hace tu amigo enseguida.",
  // ── Curación y tónicos ───────────────────────────────────────────────────
  [ItemType.Potion]: "Restaura 20 PS de un POKéMON.",
  [ItemType.SuperPotion]: "Restaura 50 PS de un POKéMON.",
  [ItemType.HyperPotion]: "Restaura 200 PS de un POKéMON.",
  [ItemType.MaxPotion]: "Restaura todos los PS de un POKéMON.",
  [ItemType.Antidote]: "Cura a un POKéMON envenenado.",
  [ItemType.Revive]:
    "Reanima a un POKéMON debilitado con la mitad de sus PS.",
  [ItemType.MaxRevive]:
    "Reanima a un POKéMON debilitado con todos sus PS.",
  [ItemType.FreshWater]: "Agua mineral. Restaura 50 PS.",
  [ItemType.SodaPop]: "Bebida con burbujas. Restaura 60 PS.",
  [ItemType.Lemondade]: "Bebida muy dulce. Restaura 80 PS.",
  [ItemType.Ether]: "Restaura 10 PP de los movimientos de un POKéMON.",
  [ItemType.MaxEther]:
    "Restaura todos los PP de los movimientos de un POKéMON.",
  [ItemType.Elixer]: "Restaura 10 PP de los movimientos de un POKéMON.",
  [ItemType.MaxElixer]:
    "Restaura todos los PP de los movimientos de un POKéMON.",
  [ItemType.PpUp]: "Restaura parte de los PP de los movimientos.",
  [ItemType.RareCandy]: "Sube 1 nivel a un POKéMON.",
  [ItemType.VinoMonjardin]:
    "Vino de MONJARDÍN. Restaura 40 PS, pero marea si se bebe en combate.",
  [ItemType.Nugget]: "Pepita de oro puro. Se vende a buen precio.",
  // ── Piedras y objetos de evolución ───────────────────────────────────────
  [ItemType.MoonStone]: "Hace evolucionar a ciertos POKéMON.",
  [ItemType.FireStone]: "Hace evolucionar a ciertos POKéMON.",
  [ItemType.ThunderStone]: "Hace evolucionar a ciertos POKéMON.",
  [ItemType.WaterStone]: "Hace evolucionar a ciertos POKéMON.",
  [ItemType.LeafStone]: "Hace evolucionar a ciertos POKéMON.",
  [ItemType.SunStone]: "Hace evolucionar a ciertos POKéMON.",
  [ItemType.MetalCoat]:
    "Revestimiento metálico. Hace evolucionar a ciertos POKéMON.",
  [ItemType.DragonScale]:
    "Escama dura de dragón. Hace evolucionar a ciertos POKéMON.",
  [ItemType.UpGrade]:
    "Aparato transparente. Hace evolucionar a PORYGON.",
  [ItemType.KingsRock]:
    "Puede amedrentar al rival al atacar. Hace evolucionar a ciertos POKéMON.",
  [ItemType.LinkCable]:
    "Hace evolucionar a los POKéMON que evolucionan al ser intercambiados.",
  [ItemType.Everstone]: "El POKéMON que la lleva no evoluciona.",
  // ── Objetos equipables: potenciadores de tipo ────────────────────────────
  [ItemType.PinkBow]: "Potencia los movimientos de tipo NORMAL.",
  [ItemType.Charcoal]: "Potencia los movimientos de tipo FUEGO.",
  [ItemType.MysticWater]: "Potencia los movimientos de tipo AGUA.",
  [ItemType.Magnet]: "Potencia los movimientos de tipo ELÉCTRICO.",
  [ItemType.MiracleSeed]: "Potencia los movimientos de tipo PLANTA.",
  [ItemType.NeverMeltIce]: "Potencia los movimientos de tipo HIELO.",
  [ItemType.BlackBelt]: "Potencia los movimientos de tipo LUCHA.",
  [ItemType.PoisonBarb]: "Potencia los movimientos de tipo VENENO.",
  [ItemType.SoftSand]: "Potencia los movimientos de tipo TIERRA.",
  [ItemType.SharpBeak]: "Potencia los movimientos de tipo VOLADOR.",
  [ItemType.TwistedSpoon]: "Potencia los movimientos de tipo PSÍQUICO.",
  [ItemType.SilverPowder]: "Potencia los movimientos de tipo BICHO.",
  [ItemType.HardStone]: "Potencia los movimientos de tipo ROCA.",
  [ItemType.SpellTag]: "Potencia los movimientos de tipo FANTASMA.",
  [ItemType.DragonFang]: "Potencia los movimientos de tipo DRAGÓN.",
  [ItemType.BlackGlasses]: "Potencia los movimientos de tipo SINIESTRO.",
  // ── Objetos equipables: efectos de combate ───────────────────────────────
  [ItemType.Leftovers]:
    "El POKéMON que los lleva recupera PS en cada turno.",
  [ItemType.ScopeLens]: "Aumenta la probabilidad de golpe crítico.",
  [ItemType.FocusBand]:
    "El POKéMON que la lleva puede resistir un golpe de KO.",
  [ItemType.QuickClaw]:
    "El POKéMON que la lleva puede atacar primero a veces.",
  [ItemType.BrightPowder]: "Reduce la puntería del rival.",
  [ItemType.AmuletCoin]: "Duplica el dinero ganado en combate.",
  [ItemType.LuckyEgg]:
    "El POKéMON que lo lleva gana puntos de experiencia extra.",
  [ItemType.LightBall]: "Duplica el ATAQUE ESPECIAL de PIKACHU.",
  [ItemType.ThickClub]: "Duplica el ATAQUE de CUBONE o MAROWAK.",
  [ItemType.LuckyPunch]: "Aumenta los golpes críticos de CHANSEY.",
  [ItemType.Stick]: "Aumenta los golpes críticos de FARFETCH'D.",
  [ItemType.MetalPowder]: "Aumenta la DEFENSA de DITTO.",
  // ── Bayas ────────────────────────────────────────────────────────────────
  [ItemType.Berry]: "Restaura 10 PS. El POKéMON que la lleva la usa solo.",
  [ItemType.GoldBerry]:
    "Restaura 30 PS. El POKéMON que la lleva la usa solo.",
  [ItemType.PrzCureBerry]: "Cura la parálisis de un POKéMON.",
  [ItemType.PsnCureBerry]: "Cura a un POKéMON envenenado.",
  [ItemType.MintBerry]: "Despierta a un POKéMON dormido.",
  [ItemType.IceBerry]: "Cura las quemaduras de un POKéMON.",
  [ItemType.BurntBerry]: "Descongela a un POKéMON congelado.",
  [ItemType.BitterBerry]:
    "Cura la confusión del POKéMON que la lleva.",
  [ItemType.MiracleBerry]: "Cura cualquier problema de estado.",
  [ItemType.MysteryBerry]:
    "Restaura 5 PP de los movimientos de un POKéMON.",
  // ── Objetos clave ────────────────────────────────────────────────────────
  [ItemType.OldRod]: "Una caña vieja. Sirve para pescar en el agua.",
  [ItemType.GoodRod]: "Una caña nueva y buena. Pesca mejores POKéMON.",
  [ItemType.SuperRod]: "La mejor caña. Pesca los mejores POKéMON.",
  [ItemType.Bicycle]: "Una bici plegable. Permite ir mucho más rápido.",
};

/**
 * Devuelve la descripción de un objeto para la caja de texto de la MOCHILA.
 * Nunca lanza: si el objeto no tiene descripción, devuelve cadena vacía
 * (la caja simplemente no se muestra).
 */
export const getItemDescription = (item: ItemType): string => {
  const tmMove = TM_MOVES[item];
  if (tmMove) {
    const move = getMoveMetadata(tmMove);
    const moveName = move?.name ? move.name.toUpperCase() : "";
    return moveName
      ? `Enseña ${moveName} a un POKéMON compatible. Un solo uso.`
      : "Enseña un movimiento a un POKéMON compatible.";
  }
  const hmMove = HM_MOVES[item];
  if (hmMove) {
    const move = getMoveMetadata(hmMove);
    const moveName = move?.name ? move.name.toUpperCase() : "";
    return moveName
      ? `Enseña ${moveName}. También se usa fuera de combate.`
      : "Enseña un movimiento que se usa fuera de combate.";
  }
  return DESCRIPTIONS[item] ?? "";
};

/** Descripción de la fila "Salir" de la MOCHILA (como CANCELAR en Oro/Plata). */
export const BAG_EXIT_DESCRIPTION = "Cierra la MOCHILA.";
