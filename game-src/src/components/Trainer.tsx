import styled from "styled-components";
import { TrainerType } from "../maps/map-types";
import PixelImage from "../styles/PixelImage";
import { xToPx, yToPx } from "../app/position-helper";
import { useSelector } from "react-redux";
import { selectTrainerEncounter, selectNpcFacings, selectMapId } from "../state/gameSlice";
import { useEffect, useState } from "react";

import alert from "../assets/ui/alert.png";
import { Direction } from "../state/state-types";

interface TrainerProps {
  x: number;
  y: number;
}

const StyledTrainer = styled.div<TrainerProps>`
  position: absolute;
  top: ${(props) => yToPx(props.y)};
  left: ${(props) => xToPx(props.x)};
  transform: translateY(-20%);
`;

const Sprite = styled(PixelImage)`
  width: ${xToPx(1)};
`;

const Alert = styled(PixelImage)`
  width: ${xToPx(1)};
  position: absolute;
  top: ${yToPx(-1)};
  left: 0;
  transform: translateY(-20%);
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  z-index: 1000;
`;

interface Props {
  trainer: TrainerType;
}

const Trainer = ({ trainer }: Props) => {
  const encounter = useSelector(selectTrainerEncounter);
  const npcFacings = useSelector(selectNpcFacings);
  const mapId = useSelector(selectMapId);

  const [stage, setStage] = useState<number>(0);

  const trainerId = `${mapId}-${trainer.pos.x}-${trainer.pos.y}`;
  const effectiveFacing = npcFacings[trainerId] ?? trainer.facing;

  const isEncountered = !!encounter && encounter.pos.x === trainer.pos.x && encounter.pos.y === trainer.pos.y;

  useEffect(() => {
    if (isEncountered) {
      setTimeout(() => {
        setStage(1);
      }, 200);
    } else {
      setStage(0);
    }
  }, [isEncountered]);

  const sprite = () => {
    if (effectiveFacing === Direction.Left) return trainer.npc.sprites.left;
    if (effectiveFacing === Direction.Right) return trainer.npc.sprites.right;
    if (effectiveFacing === Direction.Up) return trainer.npc.sprites.up;
    if (effectiveFacing === Direction.Down) return trainer.npc.sprites.down;
    throw new Error("Invalid direction");
  };

  return (
    <StyledTrainer x={trainer.pos.x} y={trainer.pos.y}>
      <Alert src={alert} style={{ opacity: stage === 1 ? 1 : 0 }} />
      <Sprite src={sprite()} />
    </StyledTrainer>
  );
};

export default Trainer;
