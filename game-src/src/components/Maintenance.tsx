import styled from "styled-components";

/**
 * Pantalla de mantenimiento. Cubre la pantalla de la Game Boy con el mensaje
 * del Team Rocket cuando el admin activa el modo mantenimiento. El juego no
 * arranca por debajo (App decide entre <Game/> y <Maintenance/>).
 */
const Screen = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5cqw;
  padding: 7cqw;
  text-align: center;
  font-family: "PokemonGB", monospace;
  color: var(--main);
`;

const RocketR = styled.div`
  font-size: 22cqw;
  line-height: 1;
  font-weight: 700;
  color: #c0392b;
  text-shadow: 0.6cqw 0.6cqw 0 rgba(0, 0, 0, 0.35);
`;

const Box = styled.div`
  border: 0.8cqw solid var(--main);
  border-radius: 2cqw;
  background: #fff;
  padding: 5cqw 4cqw;
  max-width: 92%;
  font-size: 4cqw;
  line-height: 1.9;
`;

const Blink = styled.div`
  font-size: 3.2cqw;
  color: #888;
  animation: mnt-blink 1s steps(2, start) infinite;
  @keyframes mnt-blink {
    50% {
      opacity: 0;
    }
  }
`;

const DEFAULT_MSG =
  "Pokémon Wedding está bajo mantenimiento del Team Rocket. Disculpa las molestias.";

const Maintenance = ({ message }: { message?: string }) => (
  <Screen>
    <RocketR>R</RocketR>
    <Box>{message && message.trim() ? message : DEFAULT_MSG}</Box>
    <Blink>· · ·</Blink>
  </Screen>
);

export default Maintenance;
