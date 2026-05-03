import styled from "styled-components";
import Gameboy from "./components/Gameboy";
import Game from "./components/Game";

import "./App.css";
import Paint from "./components/Paint";
import { PAINT_MODE } from "./app/constants";

const StyledApp = styled.div`
  background: black;
  width: 100vw;
  height: 100dvh;
  display: flex;
  justify-content: center;
  align-items: center;
  /* 5px horizontal + 28px bottom (safe-area) = 33px accounted for in .gameboy width formula */
  padding: 5px 5px 28px;
  overflow: hidden;
`;

const App = () => {
  return (
    <StyledApp>
      <Gameboy>
        <Game />
        {PAINT_MODE && <Paint />}
      </Gameboy>
    </StyledApp>
  );
};

export default App;
