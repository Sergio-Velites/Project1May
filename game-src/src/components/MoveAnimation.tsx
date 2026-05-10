/**
 * MoveAnimation — animaciones de combate fieles a Pokémon Rojo/Azul (Gen I).
 *
 * Diseño Game Boy DMG:
 *   · Solo 2 tonos visibles: NEGRO (#000) y BLANCO (#fff). Sin colores.
 *     (El Game Boy original tenía 4 tonos verdosos pero las animaciones de
 *      combate eran esencialmente sprites negros sobre fondo claro o flashes
 *      a pantalla completa).
 *   · Sin gradientes, sin radial-gradient, sin box-shadow con glow.
 *   · Frame rate bajo: usamos `steps(N)` para que cada animación avance a
 *     trompicones (≈10–15 fps), igual que el cartucho original.
 *   · Sprites de bloques cuadrados (pixel art chunky), nunca curvas suaves.
 *   · Parpadeos rápidos (alternancia opacidad 0/1) para electricidad y
 *     hyper beam, característica reconocible del juego original.
 *
 * El componente se remonta (key cambia) cada vez que `active` pasa a true,
 * garantizando que la animación empiece desde cero en cada turno.
 */

import React, { useEffect, useRef, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { getMoveAnimType, MoveAnimType } from "../app/move-animations";
import { getMoveMetadata } from "../app/use-move-metadata";

// ── Props ─────────────────────────────────────────────────────────────────────

interface MoveAnimationProps {
  moveId: string | null;
  active: boolean;
  fromDirection?: "left" | "right";
}

// ── Paleta Gen I ──────────────────────────────────────────────────────────────

const GB_INK = "#000";   // tinta — sprites de animación
const GB_PAPER = "#fff"; // papel — flashes a pantalla completa

// Mixins reutilizables: pixel art puro (sin antialiasing en bordes).
const pixelArt = css`
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
`;

// ── Contenedor raíz ───────────────────────────────────────────────────────────

const Root = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 10;
  ${pixelArt}
`;

// ══════════════════════════════════════════════════════════════════════════════
//  TACKLE — flash inverso a pantalla completa (3 destellos B/N)
// ══════════════════════════════════════════════════════════════════════════════
//  En Gen I los ataques físicos provocaban un parpadeo del sprite atacado y
//  un breve flash blanco/negro alternado. Replicamos sólo el flash global.

const kfTackle = keyframes`
  0%   { background: ${GB_INK}; }
  20%  { background: ${GB_PAPER}; }
  40%  { background: ${GB_INK}; }
  60%  { background: ${GB_PAPER}; }
  80%  { background: ${GB_INK}; }
  100% { background: transparent; }
`;
const TackleFlash = styled.div`
  position: absolute; inset: 0;
  animation: ${kfTackle} 320ms steps(1) forwards;
`;
const AnimTackle = () => (<Root><TackleFlash /></Root>);

// ══════════════════════════════════════════════════════════════════════════════
//  SCRATCH — 3 rayas negras diagonales que barren el sprite, frame-stepped
// ══════════════════════════════════════════════════════════════════════════════

const kfScratch = keyframes`
  0%   { transform: translateX(-90%) skewX(-20deg); opacity: 0; }
  20%  { transform: translateX(-30%) skewX(-20deg); opacity: 1; }
  60%  { transform: translateX( 30%) skewX(-20deg); opacity: 1; }
  100% { transform: translateX( 90%) skewX(-20deg); opacity: 0; }
`;
const ScratchLine = styled.div<{ $n: number }>`
  position: absolute;
  left: 10%; top: ${(p) => 18 + p.$n * 24}%;
  width: 80%; height: 6px;
  background: ${GB_INK};
  transform-origin: left center;
  animation: ${kfScratch} 280ms ${(p) => p.$n * 70}ms steps(5) both;
`;
const AnimScratch = () => (
  <Root>
    <ScratchLine $n={0} />
    <ScratchLine $n={1} />
    <ScratchLine $n={2} />
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  EMBER — 4 píxeles negros (bolas de fuego) cayendo en arco
// ══════════════════════════════════════════════════════════════════════════════

const kfEmber = keyframes`
  0%   { opacity: 0; transform: translate(0,   0); }
  20%  { opacity: 1; transform: translate(0,   0); }
  100% { opacity: 1; transform: translate(0,  40%); }
`;
const EmberPx = styled.div<{ $n: number }>`
  position: absolute;
  left: ${(p) => [22, 44, 60, 38][p.$n]}%;
  top:  ${(p) => [30, 18, 42, 55][p.$n]}%;
  width: 12px; height: 12px;
  background: ${GB_INK};
  /* Pixelar bordes (forma de "+" usando box-shadow para silueta de llama) */
  box-shadow:
    -6px 0  0 ${GB_INK},
     6px 0  0 ${GB_INK},
     0 -6px 0 ${GB_INK};
  animation: ${kfEmber} 420ms ${(p) => p.$n * 80}ms steps(4) both;
`;
const AnimEmber = () => (
  <Root>{[0, 1, 2, 3].map((n) => <EmberPx key={n} $n={n} />)}</Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  FLAMETHROWER — chorro de bloques negros izquierda → derecha
// ══════════════════════════════════════════════════════════════════════════════

const kfFlame = keyframes`
  0%   { transform: scaleX(0); opacity: 0; }
  25%  { transform: scaleX(0.4); opacity: 1; }
  50%  { transform: scaleX(0.7); opacity: 1; }
  75%  { transform: scaleX(1);   opacity: 1; }
  100% { transform: scaleX(1);   opacity: 0; }
`;
const FlameStreak = styled.div<{ $n: number }>`
  position: absolute;
  left: 0; top: ${(p) => 22 + p.$n * 11}%;
  width: ${(p) => 60 + p.$n * 8}%;
  height: 8px;
  background: ${GB_INK};
  transform-origin: left center;
  animation: ${kfFlame} 480ms ${(p) => p.$n * 50}ms steps(4) both;
`;
const AnimFlamethrower = () => (
  <Root>{[0, 1, 2, 3, 4].map((n) => <FlameStreak key={n} $n={n} />)}</Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  FIRE BLAST — silueta de explosión en cruz pixel, parpadeante
// ══════════════════════════════════════════════════════════════════════════════

const kfFireBlast = keyframes`
  0%   { transform: translate(-50%, -50%) scale(0.2); opacity: 0; }
  20%  { transform: translate(-50%, -50%) scale(0.6); opacity: 1; }
  40%  { transform: translate(-50%, -50%) scale(0.6); opacity: 0; }
  60%  { transform: translate(-50%, -50%) scale(1.0); opacity: 1; }
  80%  { transform: translate(-50%, -50%) scale(1.0); opacity: 0; }
  100% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
`;
const FireCross = styled.div`
  position: absolute; left: 50%; top: 50%;
  width: 70%; height: 70%;
  /* Cruz pixel art con clip-path */
  clip-path: polygon(
    40% 0%, 60% 0%, 60% 30%, 100% 40%, 100% 60%,
    60% 70%, 60% 100%, 40% 100%, 40% 70%, 0% 60%,
    0% 40%, 40% 30%
  );
  background: ${GB_INK};
  animation: ${kfFireBlast} 540ms steps(1) both;
`;
const AnimFireBlast = () => (<Root><FireCross /></Root>);

// ══════════════════════════════════════════════════════════════════════════════
//  WATER GUN — línea de bloques pixel barriendo de izquierda a derecha
// ══════════════════════════════════════════════════════════════════════════════

const kfWater = keyframes`
  0%   { transform: translateX(-110%); opacity: 0; }
  25%  { opacity: 1; }
  100% { transform: translateX(20%);   opacity: 1; }
`;
const WaterPx = styled.div<{ $n: number }>`
  position: absolute;
  left: 0; top: ${(p) => 28 + p.$n * 13}%;
  width: 24px; height: 8px;
  background: ${GB_INK};
  animation: ${kfWater} 380ms ${(p) => p.$n * 70}ms steps(5) both;
`;
const AnimWaterGun = () => (
  <Root>{[0, 1, 2, 3].map((n) => <WaterPx key={n} $n={n} />)}</Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  BUBBLE — 4 burbujas (cuadradas, pixel) subiendo a saltos
// ══════════════════════════════════════════════════════════════════════════════

const kfBubble = keyframes`
  0%   { opacity: 0; transform: translateY(0); }
  20%  { opacity: 1; transform: translateY(-15%); }
  100% { opacity: 1; transform: translateY(-95%); }
`;
const BubbleBox = styled.div<{ $n: number }>`
  position: absolute;
  left: ${(p) => [18, 50, 32, 65][p.$n]}%;
  bottom: 8%;
  width:  ${(p) => [14, 18, 12, 16][p.$n]}px;
  height: ${(p) => [14, 18, 12, 16][p.$n]}px;
  border: 3px solid ${GB_INK};
  background: transparent;
  animation: ${kfBubble} 520ms ${(p) => p.$n * 90}ms steps(5) both;
`;
const AnimBubble = () => (
  <Root>{[0, 1, 2, 3].map((n) => <BubbleBox key={n} $n={n} />)}</Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  SURF — barra horizontal negra dentada barriendo
// ══════════════════════════════════════════════════════════════════════════════

const kfSurf = keyframes`
  0%   { transform: translateX(-110%); opacity: 0; }
  20%  { opacity: 1; }
  100% { transform: translateX(110%);  opacity: 1; }
`;
const SurfWave = styled.div`
  position: absolute;
  left: 0; top: 22%;
  width: 100%; height: 56%;
  background: ${GB_INK};
  /* Borde superior dentado */
  clip-path: polygon(
    0% 30%,
    8% 0%, 16% 30%, 24% 0%, 32% 30%, 40% 0%, 48% 30%,
    56% 0%, 64% 30%, 72% 0%, 80% 30%, 88% 0%, 96% 30%,
    100% 0%, 100% 100%, 0% 100%
  );
  animation: ${kfSurf} 560ms steps(7) both;
`;
const AnimSurf = () => (<Root><SurfWave /></Root>);

// ══════════════════════════════════════════════════════════════════════════════
//  THUNDERBOLT — zigzag negro parpadeando furiosamente (Gen I clásico)
// ══════════════════════════════════════════════════════════════════════════════

const kfBolt = keyframes`
  0%, 100%               { opacity: 0; }
  10%, 30%, 50%, 70%, 90% { opacity: 1; }
  20%, 40%, 60%, 80%      { opacity: 0; }
`;
const BoltSvg = styled.svg`
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  ${pixelArt}
  animation: ${kfBolt} 520ms steps(1) forwards;
`;
const AnimThunderbolt = () => (
  <Root>
    <BoltSvg viewBox="0 0 100 100" preserveAspectRatio="none">
      {/* Rayo negro pixel-art chunky (sin gradientes) */}
      <polygon
        points="62,4 38,44 54,44 28,96 52,52 36,52 62,4"
        fill={GB_INK}
        stroke={GB_INK}
        strokeWidth="2"
        strokeLinejoin="miter"
      />
    </BoltSvg>
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  THUNDER — rayo vertical descendente (parpadeo + caída a saltos)
// ══════════════════════════════════════════════════════════════════════════════

const kfThunder = keyframes`
  0%   { clip-path: inset(0 0 100% 0); opacity: 0; }
  10%  { clip-path: inset(0 0 75% 0);  opacity: 1; }
  25%  { clip-path: inset(0 0 50% 0);  opacity: 0; }
  40%  { clip-path: inset(0 0 25% 0);  opacity: 1; }
  60%  { clip-path: inset(0 0 0% 0);   opacity: 0; }
  80%  { clip-path: inset(0 0 0% 0);   opacity: 1; }
  100% { clip-path: inset(0 0 0% 0);   opacity: 0; }
`;
const ThunderSvg = styled.svg`
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  ${pixelArt}
  animation: ${kfThunder} 520ms steps(1) both;
`;
const AnimThunder = () => (
  <Root>
    <ThunderSvg viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon
        points="58,0 42,38 55,38 36,72 50,72 28,100 60,65 46,65 64,32 50,32 58,0"
        fill={GB_INK}
      />
    </ThunderSvg>
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  THUNDER WAVE — anillos pixel concéntricos expandiéndose a saltos
// ══════════════════════════════════════════════════════════════════════════════

const kfTWave = keyframes`
  0%   { transform: translate(-50%, -50%) scale(0.1); opacity: 0; }
  20%  { transform: translate(-50%, -50%) scale(0.4); opacity: 1; }
  60%  { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(2.4); opacity: 0; }
`;
const TwRing = styled.div<{ $d: number; $delay: number }>`
  position: absolute; left: 50%; top: 50%;
  width: ${(p) => p.$d}px; height: ${(p) => p.$d}px;
  border: 4px solid ${GB_INK};
  background: transparent;
  animation: ${kfTWave} 540ms ${(p) => p.$delay}ms steps(5) both;
`;
const AnimThunderWave = () => (
  <Root>
    <TwRing $d={36}  $delay={0}   />
    <TwRing $d={60}  $delay={90}  />
    <TwRing $d={88}  $delay={180} />
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  RAZOR LEAF — 3 diamantes pixel girando a saltos
// ══════════════════════════════════════════════════════════════════════════════

const kfLeaf = keyframes`
  0%   { transform: translate(-50%, -50%) rotate(0deg);   opacity: 0; }
  20%  { transform: translate(-50%, -50%) rotate(90deg);  opacity: 1; }
  40%  { transform: translate(-50%, -50%) rotate(180deg); opacity: 1; }
  60%  { transform: translate(-50%, -50%) rotate(270deg); opacity: 1; }
  80%  { transform: translate(-50%, -50%) rotate(360deg); opacity: 1; }
  100% { transform: translate(-50%, -50%) rotate(450deg); opacity: 0; }
`;
const LeafShape = styled.div<{ $left: number; $top: number; $delay: number }>`
  position: absolute;
  left: ${(p) => p.$left}%; top: ${(p) => p.$top}%;
  width: 18px; height: 12px;
  background: ${GB_INK};
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  animation: ${kfLeaf} 480ms ${(p) => p.$delay}ms steps(5) both;
`;
const AnimRazorLeaf = () => (
  <Root>
    <LeafShape $left={28} $top={30} $delay={0}   />
    <LeafShape $left={52} $top={50} $delay={80}  />
    <LeafShape $left={68} $top={22} $delay={160} />
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  VINE WHIP — 2 líneas negras extendiéndose lateralmente
// ══════════════════════════════════════════════════════════════════════════════

const kfVine = keyframes`
  0%   { transform: scaleX(0);   opacity: 0; }
  30%  { transform: scaleX(0.5); opacity: 1; }
  60%  { transform: scaleX(1);   opacity: 1; }
  100% { transform: scaleX(1);   opacity: 0; }
`;
const Vine = styled.div<{ $top: number; $delay: number }>`
  position: absolute;
  left: 0; top: ${(p) => p.$top}%;
  width: 85%; height: 6px;
  background: ${GB_INK};
  transform-origin: left center;
  animation: ${kfVine} 420ms ${(p) => p.$delay}ms steps(4) both;
`;
const AnimVineWhip = () => (
  <Root>
    <Vine $top={32} $delay={0}  />
    <Vine $top={56} $delay={70} />
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  SOLAR BEAM — flash blanco a pantalla completa, 3 destellos
// ══════════════════════════════════════════════════════════════════════════════

const kfSolar = keyframes`
  0%   { background: transparent; }
  15%  { background: ${GB_PAPER}; }
  30%  { background: transparent; }
  45%  { background: ${GB_PAPER}; }
  60%  { background: transparent; }
  75%  { background: ${GB_PAPER}; }
  100% { background: transparent; }
`;
const SolarFlash = styled.div`
  position: absolute; inset: 0;
  animation: ${kfSolar} 600ms steps(1) both;
`;
const AnimSolarBeam = () => (<Root><SolarFlash /></Root>);

// ══════════════════════════════════════════════════════════════════════════════
//  ICE BEAM — barra horizontal a base de cuadraditos B/N alternados
// ══════════════════════════════════════════════════════════════════════════════

const kfBeam = keyframes`
  0%   { transform: scaleX(0);   opacity: 0; }
  25%  { transform: scaleX(0.5); opacity: 1; }
  50%  { transform: scaleX(1);   opacity: 1; }
  75%  { opacity: 1; }
  100% { opacity: 0; }
`;
const IceBeamBar = styled.div`
  position: absolute;
  left: 0; top: 42%;
  width: 100%; height: 16%;
  background: repeating-linear-gradient(
    90deg,
    ${GB_INK} 0,
    ${GB_INK} 8px,
    ${GB_PAPER} 8px,
    ${GB_PAPER} 16px
  );
  border-top: 2px solid ${GB_INK};
  border-bottom: 2px solid ${GB_INK};
  transform-origin: left center;
  animation: ${kfBeam} 460ms steps(4) both;
`;
const kfCrystal = keyframes`
  0%   { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  40%  { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
`;
const IceCrystal = styled.div<{ $left: number; $top: number; $size: number; $delay: number }>`
  position: absolute;
  left: ${(p) => p.$left}%; top: ${(p) => p.$top}%;
  width: ${(p) => p.$size}px; height: ${(p) => p.$size}px;
  background: ${GB_INK};
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  animation: ${kfCrystal} 420ms ${(p) => p.$delay}ms steps(3) both;
`;
const CRYSTALS = [
  { left: 60, top: 25, size: 12, delay: 200 },
  { left: 74, top: 42, size: 10, delay: 250 },
  { left: 84, top: 30, size: 11, delay: 300 },
  { left: 70, top: 58, size: 9,  delay: 230 },
];
const AnimIceBeam = () => (
  <Root>
    <IceBeamBar />
    {CRYSTALS.map((c, i) => (
      <IceCrystal key={i} $left={c.left} $top={c.top} $size={c.size} $delay={c.delay} />
    ))}
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  BLIZZARD — diamantes negros barriendo de derecha a izquierda
// ══════════════════════════════════════════════════════════════════════════════

const kfBliz = keyframes`
  0%   { transform: translateX(115%);  opacity: 0; }
  20%  { opacity: 1; }
  100% { transform: translateX(-115%); opacity: 1; }
`;
const BlizPart = styled.div<{ $n: number }>`
  position: absolute;
  right: 0;
  top: ${(p) => 5 + p.$n * 16}%;
  width:  ${(p) => [12, 9, 14, 10, 13, 8][p.$n]}px;
  height: ${(p) => [12, 9, 14, 10, 13, 8][p.$n]}px;
  background: ${GB_INK};
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  animation: ${kfBliz} 500ms ${(p) => p.$n * 50}ms steps(6) both;
`;
const AnimBlizzard = () => (
  <Root>{[0, 1, 2, 3, 4, 5].map((n) => <BlizPart key={n} $n={n} />)}</Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  PSYCHIC — anillos B/N invertidos parpadeantes
// ══════════════════════════════════════════════════════════════════════════════

const kfPsy = keyframes`
  0%   { transform: translate(-50%, -50%) scale(0.1); opacity: 0; }
  20%  { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
  60%  { transform: translate(-50%, -50%) scale(1.4); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
`;
const PsyRing = styled.div<{ $size: number; $delay: number; $invert: boolean }>`
  position: absolute; left: 50%; top: 50%;
  width: ${(p) => p.$size}px; height: ${(p) => p.$size}px;
  border-radius: 50%;
  border: 4px solid ${(p) => (p.$invert ? GB_PAPER : GB_INK)};
  background: transparent;
  animation: ${kfPsy} 560ms ${(p) => p.$delay}ms steps(5) both;
`;
const AnimPsychic = () => (
  <Root>
    <PsyRing $size={28}  $delay={0}   $invert={false} />
    <PsyRing $size={52}  $delay={80}  $invert={true}  />
    <PsyRing $size={78}  $delay={160} $invert={false} />
    <PsyRing $size={104} $delay={240} $invert={true}  />
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  EARTHQUAKE — sacudida + bloques negros cayendo (sin colores tierra)
// ══════════════════════════════════════════════════════════════════════════════

const kfQuakeBg = keyframes`
  0%, 100%                 { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90%  { transform: translateX(-6px); }
  20%, 40%, 60%, 80%       { transform: translateX( 6px); }
`;
const kfRockFall = keyframes`
  0%   { transform: translateY(-110%) rotate(0deg);  opacity: 0; }
  20%  { opacity: 1; }
  100% { transform: translateY(110%)  rotate(45deg); opacity: 1; }
`;
const QuakeWrap = styled.div`
  position: absolute; inset: 0;
  animation: ${kfQuakeBg} 540ms steps(1) forwards;
`;
const EqRock = styled.div<{ $left: number; $size: number; $delay: number }>`
  position: absolute;
  left: ${(p) => p.$left}%; top: -4%;
  width: ${(p) => p.$size}px; height: ${(p) => p.$size}px;
  background: ${GB_INK};
  animation: ${kfRockFall} 500ms ${(p) => p.$delay}ms steps(5) both;
`;
const EQ_ROCKS = [
  { left: 10, size: 14, delay: 0   },
  { left: 32, size: 10, delay: 60  },
  { left: 58, size: 16, delay: 30  },
  { left: 78, size: 12, delay: 90  },
];
const AnimEarthquake = () => (
  <Root>
    <QuakeWrap>
      {EQ_ROCKS.map((r, i) => (
        <EqRock key={i} $left={r.left} $size={r.size} $delay={r.delay} />
      ))}
    </QuakeWrap>
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  ROCK SLIDE — bloques cuadrados negros cayendo desde arriba
// ══════════════════════════════════════════════════════════════════════════════

const kfRSl = keyframes`
  0%   { transform: translate(0, -120%) rotate(0deg);   opacity: 0; }
  20%  { opacity: 1; }
  100% { transform: translate(0,  110%) rotate(45deg);  opacity: 1; }
`;
const RSlBlock = styled.div<{ $left: number; $size: number; $delay: number }>`
  position: absolute;
  left: ${(p) => p.$left}%; top: 0;
  width: ${(p) => p.$size}px; height: ${(p) => p.$size}px;
  background: ${GB_INK};
  animation: ${kfRSl} 520ms ${(p) => p.$delay}ms steps(5) both;
`;
const RS_ROCKS = [
  { left: 8,  size: 16, delay: 0   },
  { left: 28, size: 12, delay: 80  },
  { left: 54, size: 18, delay: 40  },
  { left: 74, size: 13, delay: 110 },
];
const AnimRockSlide = () => (
  <Root>
    {RS_ROCKS.map((r, i) => (
      <RSlBlock key={i} $left={r.left} $size={r.size} $delay={r.delay} />
    ))}
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  HYPER BEAM — pantalla invertida + barra blanca ancha (efecto característico)
// ══════════════════════════════════════════════════════════════════════════════

const kfHyperBg = keyframes`
  0%   { background: transparent; }
  15%  { background: ${GB_INK}; }
  30%  { background: ${GB_PAPER}; }
  45%  { background: ${GB_INK}; }
  60%  { background: ${GB_PAPER}; }
  80%  { background: ${GB_INK}; }
  100% { background: transparent; }
`;
const kfHyperBar = keyframes`
  0%   { transform: scaleX(0);   opacity: 0; }
  20%  { transform: scaleX(0.4); opacity: 1; }
  50%  { transform: scaleX(0.8); opacity: 1; }
  80%  { transform: scaleX(1);   opacity: 1; }
  100% { transform: scaleX(1);   opacity: 0; }
`;
const HyperBg = styled.div`
  position: absolute; inset: 0;
  animation: ${kfHyperBg} 600ms steps(1) both;
`;
const HyperBeamBar = styled.div`
  position: absolute;
  left: 0; top: 32%;
  width: 100%; height: 36%;
  background: ${GB_PAPER};
  border-top: 4px solid ${GB_INK};
  border-bottom: 4px solid ${GB_INK};
  transform-origin: left center;
  animation: ${kfHyperBar} 600ms steps(5) both;
`;
const AnimHyperBeam = () => (
  <Root>
    <HyperBg />
    <HyperBeamBar />
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  TOXIC — burbujas pequeñas negras subiendo
// ══════════════════════════════════════════════════════════════════════════════

const kfTox = keyframes`
  0%   { opacity: 0; transform: translateY(0); }
  20%  { opacity: 1; transform: translateY(-15%); }
  100% { opacity: 1; transform: translateY(-95%); }
`;
const ToxBox = styled.div<{ $n: number }>`
  position: absolute;
  left:   ${(p) => [22, 48, 36, 62, 42][p.$n]}%;
  bottom: 10%;
  width:  ${(p) => [14, 18, 11, 16, 13][p.$n]}px;
  height: ${(p) => [14, 18, 11, 16, 13][p.$n]}px;
  border: 3px solid ${GB_INK};
  background: ${GB_INK};
  /* Burbuja con hueco interior central → forma de O cuadrada */
  box-shadow: inset 0 0 0 3px ${GB_PAPER};
  animation: ${kfTox} 540ms ${(p) => p.$n * 90}ms steps(5) both;
`;
const AnimToxic = () => (
  <Root>{[0, 1, 2, 3, 4].map((n) => <ToxBox key={n} $n={n} />)}</Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  SLEEP POWDER — píxeles negros cayendo en zigzag (no multicolor)
// ══════════════════════════════════════════════════════════════════════════════

const kfSparkle = keyframes`
  0%   { opacity: 0; transform: translateY(-5%); }
  20%  { opacity: 1; transform: translateY( 5%); }
  100% { opacity: 1; transform: translateY(70%); }
`;
const SparkPx = styled.div<{ $left: number; $size: number; $delay: number }>`
  position: absolute;
  left: ${(p) => p.$left}%; top: 0;
  width: ${(p) => p.$size}px; height: ${(p) => p.$size}px;
  background: ${GB_INK};
  animation: ${kfSparkle} 560ms ${(p) => p.$delay}ms steps(6) both;
`;
const SPARKLES = [
  { left: 12, size: 6, delay: 0   }, { left: 26, size: 5, delay: 35  },
  { left: 40, size: 7, delay: 70  }, { left: 55, size: 5, delay: 15  },
  { left: 68, size: 6, delay: 55  }, { left: 80, size: 5, delay: 90  },
  { left: 20, size: 5, delay: 110 }, { left: 48, size: 6, delay: 130 },
  { left: 72, size: 5, delay: 45  }, { left: 34, size: 4, delay: 80  },
  { left: 60, size: 7, delay: 20  }, { left: 85, size: 5, delay: 100 },
];
const AnimSleepPowder = () => (
  <Root>
    {SPARKLES.map((s, i) => (
      <SparkPx key={i} $left={s.left} $size={s.size} $delay={s.delay} />
    ))}
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  SAND ATTACK — partículas negras dispersas (no marrones)
// ══════════════════════════════════════════════════════════════════════════════

const kfSand = keyframes`
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.2); }
  30%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; }
`;
const SandPart = styled.div<{ $left: number; $top: number; $size: number; $delay: number }>`
  position: absolute;
  left: ${(p) => p.$left}%; top: ${(p) => p.$top}%;
  width: ${(p) => p.$size}px; height: ${(p) => p.$size}px;
  background: ${GB_INK};
  animation: ${kfSand} 420ms ${(p) => p.$delay}ms steps(4) both;
`;
const SAND_PARTS = [
  { left: 20, top: 40, size: 6, delay: 0  }, { left: 35, top: 25, size: 5, delay: 30 },
  { left: 50, top: 50, size: 7, delay: 0  }, { left: 65, top: 30, size: 5, delay: 50 },
  { left: 30, top: 60, size: 4, delay: 40 }, { left: 55, top: 65, size: 6, delay: 20 },
  { left: 70, top: 45, size: 5, delay: 60 }, { left: 45, top: 35, size: 4, delay: 10 },
];
const AnimSandAttack = () => (
  <Root>
    {SAND_PARTS.map((s, i) => (
      <SandPart key={i} $left={s.left} $top={s.top} $size={s.size} $delay={s.delay} />
    ))}
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  STATUS BUFF — estrellas pixel negras subiendo desde el atacante
// ══════════════════════════════════════════════════════════════════════════════

const kfBuff = keyframes`
  0%   { opacity: 0; transform: translate(-50%, 0)    scale(0.4); }
  25%  { opacity: 1; transform: translate(-50%, -15%) scale(1); }
  100% { opacity: 1; transform: translate(-50%, -85%) scale(1); }
`;
const BuffStar = styled.div<{ $left: number; $delay: number; $size: number }>`
  position: absolute;
  left: ${(p) => p.$left}%; bottom: 15%;
  width: ${(p) => p.$size}px; height: ${(p) => p.$size}px;
  /* Estrella pixel art chunky (cruz de 4 brazos) */
  clip-path: polygon(
    40% 0%, 60% 0%, 60% 40%, 100% 40%, 100% 60%,
    60% 60%, 60% 100%, 40% 100%, 40% 60%, 0% 60%,
    0% 40%, 40% 40%
  );
  background: ${GB_INK};
  animation: ${kfBuff} 580ms ${(p) => p.$delay}ms steps(5) both;
`;
const BUFF_STARS = [
  { left: 22, delay: 0,   size: 14 },
  { left: 50, delay: 90,  size: 10 },
  { left: 76, delay: 45,  size: 12 },
  { left: 38, delay: 135, size: 9  },
  { left: 64, delay: 180, size: 11 },
];
const AnimStatusBuff = () => (
  <Root>
    {BUFF_STARS.map((s, i) => (
      <BuffStar key={i} $left={s.left} $delay={s.delay} $size={s.size} />
    ))}
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  STATUS DEBUFF — gotitas pixel negras cayendo sobre el objetivo
// ══════════════════════════════════════════════════════════════════════════════

const kfDebuff = keyframes`
  0%   { opacity: 0; transform: translateY(-8%); }
  20%  { opacity: 1; transform: translateY( 5%); }
  100% { opacity: 1; transform: translateY(70%); }
`;
const DebuffDrop = styled.div<{ $left: number; $delay: number; $size: number }>`
  position: absolute;
  left: ${(p) => p.$left}%; top: 0;
  width: ${(p) => p.$size}px; height: ${(p) => p.$size + 4}px;
  background: ${GB_INK};
  animation: ${kfDebuff} 460ms ${(p) => p.$delay}ms steps(5) both;
`;
const DEBUFF_DROPS = [
  { left: 18, delay: 0,   size: 8  },
  { left: 36, delay: 60,  size: 6  },
  { left: 52, delay: 20,  size: 9  },
  { left: 68, delay: 90,  size: 7  },
  { left: 82, delay: 40,  size: 6  },
  { left: 28, delay: 110, size: 7  },
  { left: 60, delay: 75,  size: 8  },
];
const AnimStatusDebuff = () => (
  <Root>
    {DEBUFF_DROPS.map((d, i) => (
      <DebuffDrop key={i} $left={d.left} $delay={d.delay} $size={d.size} />
    ))}
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  ROUTER
// ══════════════════════════════════════════════════════════════════════════════

function renderAnimType(type: MoveAnimType): React.ReactElement | null {
  switch (type) {
    case "tackle":        return <AnimTackle />;
    case "scratch":       return <AnimScratch />;
    case "ember":         return <AnimEmber />;
    case "flamethrower":  return <AnimFlamethrower />;
    case "fire-blast":    return <AnimFireBlast />;
    case "water-gun":     return <AnimWaterGun />;
    case "bubble":        return <AnimBubble />;
    case "surf":          return <AnimSurf />;
    case "thunderbolt":   return <AnimThunderbolt />;
    case "thunder":       return <AnimThunder />;
    case "thunder-wave":  return <AnimThunderWave />;
    case "razor-leaf":    return <AnimRazorLeaf />;
    case "vine-whip":     return <AnimVineWhip />;
    case "solar-beam":    return <AnimSolarBeam />;
    case "ice-beam":      return <AnimIceBeam />;
    case "blizzard":      return <AnimBlizzard />;
    case "psychic-move":  return <AnimPsychic />;
    case "earthquake":    return <AnimEarthquake />;
    case "rock-slide":    return <AnimRockSlide />;
    case "hyper-beam":    return <AnimHyperBeam />;
    case "toxic-move":    return <AnimToxic />;
    case "sleep-powder":  return <AnimSleepPowder />;
    case "sand-attack":   return <AnimSandAttack />;
    case "status-buff":   return <AnimStatusBuff />;
    case "status-debuff": return <AnimStatusDebuff />;
    default:              return <AnimTackle />;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  COMPONENTE PÚBLICO
// ══════════════════════════════════════════════════════════════════════════════

const MoveAnimation: React.FC<MoveAnimationProps> = ({ moveId, active }) => {
  const [renderKey, setRenderKey] = useState(0);
  const prevActive = useRef(false);

  useEffect(() => {
    if (active && !prevActive.current) {
      setRenderKey((k) => k + 1);
    }
    prevActive.current = active;
  }, [active]);

  if (!active || !moveId) return null;

  const meta = getMoveMetadata(moveId);
  const animType = getMoveAnimType(
    moveId,
    meta?.type ?? "normal",
    meta?.damageClass ?? "physical"
  );

  return (
    <React.Fragment key={renderKey}>
      {renderAnimType(animType)}
    </React.Fragment>
  );
};

export { MoveAnimation };
