import styled from "styled-components";
import { useEffect, useState } from "react";
import Gameboy from "./components/Gameboy";
import Game from "./components/Game";
import Maintenance from "./components/Maintenance";
import { fetchMaintenance } from "./app/cloud-save";

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
  // Comprobación de mantenimiento al arrancar. Fail-open: si no se puede
  // comprobar (red/Supabase caído), se deja jugar. Mientras se resuelve, la
  // pantalla de la Game Boy queda en negro un instante.
  const [phase, setPhase] = useState<"loading" | "ok" | "maintenance">("loading");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let alive = true;
    fetchMaintenance()
      .then((r) => {
        if (!alive) return;
        if (r.maintenance) {
          setMessage(r.message);
          setPhase("maintenance");
        } else {
          setPhase("ok");
        }
      })
      .catch(() => alive && setPhase("ok"));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <StyledApp>
      <Gameboy>
        {phase === "maintenance" ? (
          <Maintenance message={message} />
        ) : phase === "ok" ? (
          <>
            <Game />
            {PAINT_MODE && <Paint />}
          </>
        ) : null}
      </Gameboy>
    </StyledApp>
  );
};

export default App;
