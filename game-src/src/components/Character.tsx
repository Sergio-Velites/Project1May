import styled from "styled-components";

import frontStill from "../assets/character/front-still.png";
import frontWalk1 from "../assets/character/front-walk-1.png";
import frontWalk2 from "../assets/character/front-walk-2.png";
import frontWalk3 from "../assets/character/front-walk-3.png";
import leftStill from "../assets/character/left-still.png";
import leftWalk1 from "../assets/character/left-walk-1.png";
import leftWalk2 from "../assets/character/left-walk-2.png";
import leftWalk3 from "../assets/character/left-walk-3.png";
import rightStill from "../assets/character/right-still.png";
import rightWalk1 from "../assets/character/right-walk-1.png";
import rightWalk2 from "../assets/character/right-walk-2.png";
import rightWalk3 from "../assets/character/right-walk-3.png";
import backStill from "../assets/character/back-still.png";
import backWalk1 from "../assets/character/back-walk-1.png";
import backWalk2 from "../assets/character/back-walk-2.png";
import backWalk3 from "../assets/character/back-walk-3.png";
// Sprites de bici (set bike-ash-* con animación de pedaleo).
import bikeAshDown from "../assets/walk-sprites/bike-ash-down.png";
import bikeAshDown1 from "../assets/walk-sprites/bike-ash-down-1.png";
import bikeAshDown2 from "../assets/walk-sprites/bike-ash-down-2.png";
import bikeAshUp from "../assets/walk-sprites/bike-ash-up.png";
import bikeAshUp1 from "../assets/walk-sprites/bike-ash-up-1.png";
import bikeAshUp2 from "../assets/walk-sprites/bike-ash-up-2.png";
import bikeAshLeft from "../assets/walk-sprites/bike-ash-left.png";
import bikeAshLeft1 from "../assets/walk-sprites/bike-ash-left-1.png";
import bikeAshRight from "../assets/walk-sprites/bike-ash-right.png";
import bikeAshRight1 from "../assets/walk-sprites/bike-ash-right-1.png";
// Sprites de pesca (jugador con caña, una pose por dirección).
import fishAshDown from "../assets/walk-sprites/fish-ash-down.png";
import fishAshUp from "../assets/walk-sprites/fish-ash-up.png";
import fishAshLeft from "../assets/walk-sprites/fish-ash-left.png";
import fishAshRight from "../assets/walk-sprites/fish-ash-right.png";
// Sprites de surf (reuso del set ac-* ya existente).
import acDown from "../assets/walk-sprites/ac-down.png";
import acDown1 from "../assets/walk-sprites/ac-down-1.png";
import acDown2 from "../assets/walk-sprites/ac-down-2.png";
import acUp from "../assets/walk-sprites/ac-up.png";
import acUp1 from "../assets/walk-sprites/ac-up-1.png";
import acUp2 from "../assets/walk-sprites/ac-up-2.png";
import acLeft from "../assets/walk-sprites/ac-left.png";
import acLeft1 from "../assets/walk-sprites/ac-left-1.png";
import acRight from "../assets/walk-sprites/ac-right.png";
import acRight1 from "../assets/walk-sprites/ac-right-1.png";
import { useDispatch, useSelector } from "react-redux";
import {
  moveDown,
  selectDirection,
  selectJumping,
  selectMap,
  selectMoving,
  selectOnSurfing,
  selectPos,
  setOnSurfing,
  stopJumping,
} from "../state/gameSlice";
import { useEffect, useRef, useState } from "react";
import { WALK_SPEED } from "../app/constants";
import useMoveSpeed from "../app/use-move-speed";
import PixelImage from "../styles/PixelImage";
import { selectFishing, selectFrozen, selectSpinning } from "../state/uiSlice";
import { Direction } from "../state/state-types";
import { isWater } from "../app/map-helper";
import { xToPx } from "../app/position-helper";

const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: ${xToPx(1)};
  transform: translateY(-20%);
  /* Encima de overlays de mundo (rod cuando $dir===Up usa z-index 4).
     El resto de overlays de pesca/knockback usan z-index >= 12 para
     pintarse delante del jugador. */
  z-index: 5;
`;

const JumpContainer = styled.div<{ $moveSpeed: number }>`
  width: 100%;
  transform: translateY(0);

  transition: transform ${(p) => p.$moveSpeed}ms linear;
`;

const StyledCharacter = styled(PixelImage)`
  width: 100%;
`;

// Óvalo azul translúcido bajo el personaje cuando surfea: simula la base
// del Pokémon de agua sobre la que va montado, sin requerir un sprite extra.
const SurfRaft = styled.div`
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 92%;
  height: 38%;
  transform: translateX(-50%);
  background: radial-gradient(
    ellipse at center,
    rgba(120, 200, 240, 0.85) 0%,
    rgba(60, 140, 220, 0.55) 70%,
    rgba(60, 140, 220, 0) 100%
  );
  border-radius: 50%;
  pointer-events: none;
  z-index: -1;
`;

const Character = () => {
  const dispatch = useDispatch();

  const direction = useSelector(selectDirection);
  const moving = useSelector(selectMoving);
  const jumping = useSelector(selectJumping);
  const spinning = useSelector(selectSpinning);
  const frozen = useSelector(selectFrozen);
  const onSurfing = useSelector(selectOnSurfing);
  const fishing = useSelector(selectFishing);
  const pos = useSelector(selectPos);
  const map = useSelector(selectMap);
  const { moveSpeed, onBicycle } = useMoveSpeed();

  const [image, setImage] = useState(frontStill);
  const [animateJumping, setAnimateJumping] = useState(false);
  const [surfFrame, setSurfFrame] = useState(0);
  const [bikeFrame, setBikeFrame] = useState(0);
  // Para detectar transición agua→tierra al surfear: guardamos si la
  // posición previa estaba en agua. Si pasamos de agua a tierra estando
  // surfeando, animamos un pequeño salto y desmontamos.
  const wasOnWaterRef = useRef(false);

  useEffect(() => {
    if (jumping) {
      setAnimateJumping(true);
      setTimeout(() => {
        dispatch(moveDown());
        setAnimateJumping(false);
      }, moveSpeed * 0.9);
      setTimeout(() => {
        dispatch(stopJumping());
      }, moveSpeed * 2);
    }
  }, [jumping, dispatch, moveSpeed]);

  // Salida del agua: cuando estabas en water y has pasado a un tile de
  // tierra (no-water) estando surfeando, anima un pequeño salto y desmonta.
  useEffect(() => {
    const onWaterNow = isWater(map.water, pos.x, pos.y);
    if (onSurfing && wasOnWaterRef.current && !onWaterNow) {
      setAnimateJumping(true);
      const t1 = setTimeout(() => setAnimateJumping(false), moveSpeed * 0.9);
      const t2 = setTimeout(() => dispatch(setOnSurfing(false)), moveSpeed * 1.2);
      wasOnWaterRef.current = false;
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    wasOnWaterRef.current = onWaterNow;
  }, [pos.x, pos.y, map.water, onSurfing, moveSpeed, dispatch]);

  // Animación de remo: alterna entre 2 frames mientras te mueves.
  useEffect(() => {
    if (!onSurfing || !moving || frozen) return;
    const t = setTimeout(() => setSurfFrame((f) => (f + 1) % 2), WALK_SPEED);
    return () => clearTimeout(t);
  }, [onSurfing, moving, frozen, surfFrame]);

  // Animación de pedaleo: alterna entre 3 frames (down/up) o 2 frames
  // (left/right) mientras te mueves en bici.
  useEffect(() => {
    if (!onBicycle || !moving || frozen) return;
    const t = setTimeout(() => setBikeFrame((f) => (f + 1) % 3), WALK_SPEED);
    return () => clearTimeout(t);
  }, [onBicycle, moving, frozen, bikeFrame]);

  useEffect(() => {
    if (spinning) {
      if (image === frontStill) {
        setTimeout(() => {
          setImage(leftStill);
        }, WALK_SPEED);
      } else if (image === leftStill) {
        setTimeout(() => {
          setImage(backStill);
        }, WALK_SPEED);
      } else if (image === backStill) {
        setTimeout(() => {
          setImage(rightStill);
        }, WALK_SPEED);
      } else if (image === rightStill) {
        setTimeout(() => {
          setImage(frontStill);
        }, WALK_SPEED);
      } else {
        setImage(frontStill);
      }
      return;
    }

    if (!moving || frozen) {
      if (direction === Direction.Down) {
        setImage(frontStill);
      } else if (direction === Direction.Left) {
        setImage(leftStill);
      } else if (direction === Direction.Right) {
        setImage(rightStill);
      } else if (direction === Direction.Up) {
        setImage(backStill);
      } else {
        throw new Error("Invalid last direction");
      }
      return;
    }

    if (direction === Direction.Down) {
      if (image === frontWalk1) {
        setTimeout(() => {
          setImage(frontWalk2);
        }, WALK_SPEED);
      } else if (image === frontWalk2) {
        setTimeout(() => {
          setImage(frontWalk3);
        }, WALK_SPEED);
      } else if (image === frontWalk3) {
        setTimeout(() => {
          setImage(frontWalk1);
        }, WALK_SPEED);
      } else {
        setImage(frontWalk1);
      }
    }

    if (direction === Direction.Up) {
      if (image === backWalk1) {
        setTimeout(() => {
          setImage(backWalk2);
        }, WALK_SPEED);
      } else if (image === backWalk2) {
        setTimeout(() => {
          setImage(backWalk3);
        }, WALK_SPEED);
      } else if (image === backWalk3) {
        setTimeout(() => {
          setImage(backWalk1);
        }, WALK_SPEED);
      } else {
        setImage(backWalk1);
      }
    }

    if (direction === Direction.Left) {
      if (image === leftWalk1) {
        setTimeout(() => {
          setImage(leftWalk2);
        }, WALK_SPEED);
      } else if (image === leftWalk2) {
        setTimeout(() => {
          setImage(leftWalk3);
        }, WALK_SPEED);
      } else if (image === leftWalk3) {
        setTimeout(() => {
          setImage(leftWalk1);
        }, WALK_SPEED);
      } else {
        setImage(leftWalk1);
      }
    }

    if (direction === Direction.Right) {
      if (image === rightWalk1) {
        setTimeout(() => {
          setImage(rightWalk2);
        }, WALK_SPEED);
      } else if (image === rightWalk2) {
        setTimeout(() => {
          setImage(rightWalk3);
        }, WALK_SPEED);
      } else if (image === rightWalk3) {
        setTimeout(() => {
          setImage(rightWalk1);
        }, WALK_SPEED);
      } else {
        setImage(rightWalk1);
      }
    }
  }, [image, moving, direction, spinning, frozen]);

  return (
    <Container>
      <JumpContainer
        $moveSpeed={moveSpeed}
        style={{
          transform: animateJumping ? "translateY(-80%)" : "translateY(0)",
        }}
      >
        {onSurfing && <SurfRaft />}
        <StyledCharacter
          src={
            fishing
              ? fishSpriteForDirection(fishing.direction)
              : onSurfing
              ? surfSpriteForDirection(direction, moving && !frozen, surfFrame)
              : onBicycle
              ? bikeAshSpriteForDirection(direction, moving && !frozen, bikeFrame)
              : image
          }
          alt="Character"
        />
      </JumpContainer>
    </Container>
  );
};

/**
 * Sprite de bici (set bike-ash-*) con animación de pedaleo.
 *  - Quieto: bike-ash-{dir}.png
 *  - Up/Down moviéndose: ciclo entre still, -1, -2 (3 frames).
 *  - Left/Right moviéndose: alterna entre still y -1 (2 frames).
 */
function bikeAshSpriteForDirection(d: Direction, moving: boolean, frame: number) {
  if (!moving) {
    switch (d) {
      case Direction.Up: return bikeAshUp;
      case Direction.Down: return bikeAshDown;
      case Direction.Left: return bikeAshLeft;
      case Direction.Right: return bikeAshRight;
    }
  }
  switch (d) {
    case Direction.Up:
      return [bikeAshUp, bikeAshUp1, bikeAshUp2][frame % 3];
    case Direction.Down:
      return [bikeAshDown, bikeAshDown1, bikeAshDown2][frame % 3];
    case Direction.Left:
      return frame % 2 === 0 ? bikeAshLeft : bikeAshLeft1;
    case Direction.Right:
      return frame % 2 === 0 ? bikeAshRight : bikeAshRight1;
  }
}

/**
 * Sprite de pesca: una pose fija por dirección (jugador sosteniendo la caña).
 */
function fishSpriteForDirection(d: Direction) {
  switch (d) {
    case Direction.Up: return fishAshUp;
    case Direction.Down: return fishAshDown;
    case Direction.Left: return fishAshLeft;
    case Direction.Right: return fishAshRight;
  }
}

/**
 * Sprite del personaje surfeando. Reusa los assets `ac-*` (set heredado).
 * - Quieto: ac-{dir}.png
 * - Moviéndose: alterna entre los 2 frames disponibles. Para left/right solo
 *   hay un frame extra (-1) → animamos entre still y -1. Para up/down hay
 *   dos (-1, -2) → ciclamos entre los dos.
 */
function surfSpriteForDirection(d: Direction, moving: boolean, frame: number) {
  if (!moving) {
    switch (d) {
      case Direction.Up: return acUp;
      case Direction.Down: return acDown;
      case Direction.Left: return acLeft;
      case Direction.Right: return acRight;
    }
  }
  switch (d) {
    case Direction.Up: return frame === 0 ? acUp1 : acUp2;
    case Direction.Down: return frame === 0 ? acDown1 : acDown2;
    case Direction.Left: return frame === 0 ? acLeft : acLeft1;
    case Direction.Right: return frame === 0 ? acRight : acRight1;
  }
}

export default Character;
