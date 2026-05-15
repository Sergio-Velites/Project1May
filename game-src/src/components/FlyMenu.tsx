import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import Frame from "./Frame";
import Menu from "./Menu";
import {
  hideFlyMenu,
  selectFlyMenu,
  showTextThenAction,
  startFlyAnimation,
} from "../state/uiSlice";
import { selectPokemon, selectVisitedMaps } from "../state/gameSlice";
import { MapId } from "../maps/map-types";
import { PosType } from "../state/state-types";
import { getPokemonMetadata } from "../app/use-pokemon-metadata";

const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
`;

const TextContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 20%;
  z-index: 100;

  @media (max-width: 1000px) {
    height: 30%;
  }
`;

/**
 * Destinos disponibles para la MO Vuelo. Cada entrada apunta a un mapa
 * concreto con la posición de aterrizaje (cerca del centro del mapa
 * exterior o el spawn habitual del Centro Pokémon).
 *
 * El orden replica el de Gen I (de sur a norte): Pueblo Paleta primero,
 * luego SOTO LEZKAIRU, después el Centro Pokémon de la Ruta 3 y por
 * último VILLAMAYOR DE MONJARDÍN.
 */
const FLY_DESTINATIONS: Array<{
  label: string;
  map: MapId;
  pos: PosType;
}> = [
  { label: "PUEBLO PALETA", map: MapId.PalletTown, pos: { x: 8, y: 13 } },
  { label: "SOTO LEZKAIRU", map: MapId.ViridianCity, pos: { x: 20, y: 34 } },
  {
    label: "CENTRO RESACA",
    map: MapId.Route3PokemonCenter,
    pos: { x: 4, y: 6 },
  },
  {
    label: "VILLAMAYOR",
    map: MapId.PewterCity,
    pos: { x: 19, y: 34 },
  },
];

const FlyMenu = () => {
  const dispatch = useDispatch();
  const show = useSelector(selectFlyMenu);
  const visited = useSelector(selectVisitedMaps);
  const pokemon = useSelector(selectPokemon);

  if (!show) return null;

  const available = FLY_DESTINATIONS.filter((d) => visited.includes(d.map));

  // Si por algún motivo no hay destinos (no debería ocurrir: la opción
  // "Volar" solo aparece si hay al menos uno), cerramos el menú.
  if (available.length === 0) {
    dispatch(hideFlyMenu());
    return null;
  }

  return (
    <Container>
      <TextContainer>
        <Frame wide tall>
          ¿Adónde quieres volar?
        </Frame>
      </TextContainer>
      <Menu
        show
        bottom="20%"
        right="0"
        close={() => dispatch(hideFlyMenu())}
        menuItems={available.map((d) => ({
          label: d.label,
          action: () => {
            dispatch(hideFlyMenu());
            const flyer = pokemon.find((p) =>
              p.moves.some((m) => m.id === "fly")
            );
            const name = flyer
              ? getPokemonMetadata(flyer.id).name.toUpperCase()
              : "POKÉMON";
            // Mensaje Gen I: el texto se muestra y al pulsar A arranca la
            // animación de vuelo.
            dispatch(
              showTextThenAction({
                text: [`¡${name} usó VUELO!`],
                action: () =>
                  dispatch(startFlyAnimation({ map: d.map, pos: d.pos })),
              })
            );
          },
        }))}
      />
    </Container>
  );
};

export default FlyMenu;
