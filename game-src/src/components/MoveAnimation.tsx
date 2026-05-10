/**
 * MoveAnimation — animaciones de combate estilo Gen I (Game Boy Rojo/Azul).
 *
 * Cada tipo de movimiento tiene su propio conjunto de formas y keyframes CSS
 * que replican visualmente las animaciones originales: partículas, rayos,
 * ondas, cristales, etc.  Sin assets externos — solo CSS + SVG inline.
 *
 * El componente se remonta (key cambia) cada vez que `active` pasa a true,
 * garantizando que la animación empiece desde cero en cada turno.
 */

import React, { useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import { getMoveAnimType, MoveAnimType } from "../app/move-animations";
import { getMoveMetadata } from "../app/use-move-metadata";

// ── Props ─────────────────────────────────────────────────────────────────────

interface MoveAnimationProps {
  /** ID del movimiento (ej: "thunderbolt"). Null = sin animación. */
  moveId: string | null;
  /** true cuando el movimiento está en curso. */
  active: boolean;
  /** De dónde viene el proyectil/ataque (el lado del atacante). */
  fromDirection?: "left" | "right";
}

// ── Contenedor raíz ───────────────────────────────────────────────────────────

const Root = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 10;
`;

// ══════════════════════════════════════════════════════════════════════════════
//  TACKLE — doble destello blanco (impacto físico genérico)
// ══════════════════════════════════════════════════════════════════════════════

const kfTackle = keyframes`
  0%,100%  { opacity: 0; }
  15%, 55% { opacity: 0.92; }
  35%      { opacity: 0.05; }
`;
const TackleFlash = styled.div`
  position: absolute; inset: 0;
  background: #ffffff;
  animation: ${kfTackle} 320ms ease-out forwards;
`;
const AnimTackle = () => (
  <Root><TackleFlash /></Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  SCRATCH — 3 rayas diagonales blancas que barren el sprite
// ══════════════════════════════════════════════════════════════════════════════

const kfScratch = keyframes`
  0%   { opacity: 0; transform: translateX(-80%) skewX(-20deg); }
  20%  { opacity: 1; transform: translateX(-30%) skewX(-20deg); }
  80%  { opacity: 1; transform: translateX(30%)  skewX(-20deg); }
  100% { opacity: 0; transform: translateX(80%)  skewX(-20deg); }
`;
const ScratchLine = styled.div<{ $n: number }>`
  position: absolute;
  left: 10%; top: ${p => 15 + p.$n * 25}%;
  width: 80%; height: 5px;
  background: white;
  box-shadow: 0 0 8px 3px rgba(255, 255, 255, 0.9);
  transform-origin: left center;
  animation: ${kfScratch} 280ms ${p => p.$n * 65}ms ease-out both;
`;
const AnimScratch = () => (
  <Root>
    <ScratchLine $n={0} />
    <ScratchLine $n={1} />
    <ScratchLine $n={2} />
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  EMBER — 4 bolas de fuego naranjas que caen en arco
// ══════════════════════════════════════════════════════════════════════════════

const kfEmber = keyframes`
  0%   { opacity: 0; transform: translate(0,   0)   scale(0.3); }
  15%  { opacity: 1; transform: translate(0,   0)   scale(1); }
  60%  { opacity: 1; }
  100% { opacity: 0; transform: translate(0,  20%)  scale(0.6); }
`;
const EmberDot = styled.div<{ $n: number }>`
  position: absolute;
  left: ${p => [22, 44, 60, 38][p.$n]}%;
  top:  ${p => [35, 20, 45, 60][p.$n]}%;
  width:  14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle, #ffee44, #ff6600);
  box-shadow: 0 0 10px 4px rgba(255, 100, 0, 0.7);
  animation: ${kfEmber} 400ms ${p => p.$n * 65}ms ease-out both;
`;
const AnimEmber = () => (
  <Root>{[0, 1, 2, 3].map(n => <EmberDot key={n} $n={n} />)}</Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  FLAMETHROWER — chorro de llamas izquierda→derecha
// ══════════════════════════════════════════════════════════════════════════════

const kfFlame = keyframes`
  0%   { opacity: 0; transform: scaleX(0); transform-origin: left center; }
  25%  { opacity: 0.9; transform: scaleX(1); }
  80%  { opacity: 0.7; }
  100% { opacity: 0; }
`;
const FlameStreak = styled.div<{ $n: number }>`
  position: absolute;
  left: 0; top: ${p => 22 + p.$n * 10}%;
  width: ${p => 55 + p.$n * 12}%;
  height: 10px;
  border-radius: 6px;
  background: linear-gradient(90deg, #ff2200, #ff8800, #ffdd00, transparent);
  box-shadow: 0 0 10px rgba(255, 100, 0, 0.6);
  transform-origin: left center;
  animation: ${kfFlame} 480ms ${p => p.$n * 45}ms ease-out both;
`;
const AnimFlamethrower = () => (
  <Root>{[0, 1, 2, 3, 4].map(n => <FlameStreak key={n} $n={n} />)}</Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  FIRE BLAST — estrella de 5 puntas naranja-roja que explota
// ══════════════════════════════════════════════════════════════════════════════

const kfFireBlast = keyframes`
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.05) rotate(0deg); }
  30%  { opacity: 1; transform: translate(-50%, -50%) scale(1)    rotate(18deg); }
  70%  { opacity: 0.9; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2)  rotate(36deg); }
`;
const FireStar = styled.div`
  position: absolute; left: 50%; top: 50%;
  width: 75%; height: 75%;
  clip-path: polygon(
    50% 0%, 61% 35%, 98% 35%, 68% 57%,
    79% 91%, 50% 70%, 21% 91%, 32% 57%,
    2% 35%, 39% 35%
  );
  background: radial-gradient(circle, #ffff44 0%, #ff8800 50%, #cc2200 100%);
  box-shadow: 0 0 20px 8px rgba(255, 100, 0, 0.6);
  animation: ${kfFireBlast} 530ms ease-out both;
`;
const AnimFireBlast = () => (
  <Root><FireStar /></Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  WATER GUN — gotas azules en línea
// ══════════════════════════════════════════════════════════════════════════════

const kfWater = keyframes`
  0%   { opacity: 0; transform: translateX(-110%); }
  20%  { opacity: 0.9; }
  80%  { opacity: 0.8; }
  100% { opacity: 0; transform: translateX(20%); }
`;
const WaterDrop = styled.div<{ $n: number }>`
  position: absolute;
  left: 0; top: ${p => 28 + p.$n * 13}%;
  width: 22px; height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #aaddff, #0055cc);
  box-shadow: 0 0 8px rgba(50, 130, 255, 0.7);
  animation: ${kfWater} 380ms ${p => p.$n * 70}ms ease-out both;
`;
const AnimWaterGun = () => (
  <Root>{[0, 1, 2, 3].map(n => <WaterDrop key={n} $n={n} />)}</Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  BUBBLE — burbujas circulares subiendo
// ══════════════════════════════════════════════════════════════════════════════

const kfBubble = keyframes`
  0%   { opacity: 0; transform: translateY(0)   scale(0.4); }
  25%  { opacity: 0.85; transform: translateY(-10%) scale(1); }
  75%  { opacity: 0.65; transform: translateY(-60%) scale(1.05); }
  100% { opacity: 0; transform: translateY(-95%) scale(0.8); }
`;
const BubbleRing = styled.div<{ $n: number }>`
  position: absolute;
  left: ${p => [18, 50, 32, 65][p.$n]}%;
  bottom: 8%;
  width:  ${p => [16, 20, 13, 18][p.$n]}px;
  height: ${p => [16, 20, 13, 18][p.$n]}px;
  border-radius: 50%;
  border: 2px solid #55aaff;
  background: rgba(100, 180, 255, 0.18);
  animation: ${kfBubble} 520ms ${p => p.$n * 85}ms ease-out both;
`;
const AnimBubble = () => (
  <Root>{[0, 1, 2, 3].map(n => <BubbleRing key={n} $n={n} />)}</Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  SURF — ola azul que barre de lado a lado
// ══════════════════════════════════════════════════════════════════════════════

const kfSurf = keyframes`
  0%   { opacity: 0; transform: translateX(-110%); }
  25%  { opacity: 0.9; }
  70%  { opacity: 0.8; }
  100% { opacity: 0; transform: translateX(110%); }
`;
const SurfWave = styled.div`
  position: absolute;
  left: 0; top: 18%;
  width: 110%; height: 64%;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(50, 130, 255, 0.85) 20%,
    rgba(100, 190, 255, 0.75) 60%,
    transparent 100%
  );
  border-radius: 40% 40% 0 0;
  animation: ${kfSurf} 520ms ease-in-out both;
`;
const AnimSurf = () => (
  <Root><SurfWave /></Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  THUNDERBOLT — rayo amarillo zigzag parpadeante (estilo Gen I)
// ══════════════════════════════════════════════════════════════════════════════

const kfBolt = keyframes`
  0%,100%       { opacity: 0; }
  5%, 25%, 45%, 65% { opacity: 1; }
  15%, 35%, 55% { opacity: 0.08; }
`;
const BoltSvg = styled.svg`
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  animation: ${kfBolt} 500ms steps(1) forwards;
`;
const AnimThunderbolt = () => (
  <Root>
    <BoltSvg viewBox="0 0 100 100" preserveAspectRatio="none">
      {/* Rayo principal */}
      <polygon
        points="62,4 38,44 54,44 28,96 52,52 36,52 62,4"
        fill="#ffee00"
      />
      {/* Borde blanco */}
      <polyline
        points="62,4 38,44 54,44 28,96"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </BoltSvg>
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  THUNDER — rayo vertical que cae desde arriba
// ══════════════════════════════════════════════════════════════════════════════

const kfThunder = keyframes`
  0%   { opacity: 0; clip-path: inset(0 0 100% 0); }
  20%  { opacity: 1; clip-path: inset(0 0 0% 0); }
  70%  { opacity: 1; }
  100% { opacity: 0; clip-path: inset(0 0 0% 0); }
`;
const ThunderSvg = styled.svg`
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  animation: ${kfThunder} 460ms ease-out both;
`;
const AnimThunder = () => (
  <Root>
    <ThunderSvg viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon
        points="58,0 42,38 55,38 36,72 50,72 28,100 60,65 46,65 64,32 50,32 58,0"
        fill="#ffee00"
      />
      <polyline
        points="58,0 42,38 55,38 36,72 50,72 28,100"
        fill="none" stroke="white" strokeWidth="1.5"
      />
    </ThunderSvg>
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  THUNDER WAVE — anillos eléctricos que se expanden desde el centro
// ══════════════════════════════════════════════════════════════════════════════

const kfTWave = keyframes`
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.08); }
  25%  { opacity: 0.9; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(2.2); }
`;
const TwRing = styled.div<{ $d: number; $delay: number }>`
  position: absolute; left: 50%; top: 50%;
  width: ${p => p.$d}px; height: ${p => p.$d}px;
  border-radius: 50%;
  border: 3px solid #ffee22;
  box-shadow: 0 0 6px #ffee22;
  animation: ${kfTWave} 520ms ${p => p.$delay}ms ease-out both;
`;
const AnimThunderWave = () => (
  <Root>
    <TwRing $d={36}  $delay={0}   />
    <TwRing $d={60}  $delay={80}  />
    <TwRing $d={88}  $delay={160} />
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  RAZOR LEAF — 3 diamantes verdes girando y volando
// ══════════════════════════════════════════════════════════════════════════════

const kfLeaf = keyframes`
  0%   { opacity: 0; transform: translate(-50%, -50%) rotate(0deg)   scale(0.3); }
  15%  { opacity: 1; transform: translate(-50%, -50%) rotate(120deg) scale(1); }
  80%  { opacity: 1; transform: translate(-50%, -50%) rotate(330deg) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) rotate(400deg) scale(0.7); }
`;
const LeafShape = styled.div<{ $left: number; $top: number; $delay: number }>`
  position: absolute;
  left: ${p => p.$left}%; top: ${p => p.$top}%;
  width: 22px; height: 14px;
  background: #33bb33;
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  box-shadow: 0 0 6px rgba(50, 200, 50, 0.8);
  animation: ${kfLeaf} 480ms ${p => p.$delay}ms ease-out both;
`;
const AnimRazorLeaf = () => (
  <Root>
    <LeafShape $left={28} $top={30} $delay={0}   />
    <LeafShape $left={52} $top={50} $delay={80}  />
    <LeafShape $left={68} $top={22} $delay={160} />
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  VINE WHIP — 2 líneas verdes que se extienden desde el lado del atacante
// ══════════════════════════════════════════════════════════════════════════════

const kfVine = keyframes`
  0%   { opacity: 0; transform: scaleX(0); }
  30%  { opacity: 1; transform: scaleX(1); }
  80%  { opacity: 1; }
  100% { opacity: 0; }
`;
const Vine = styled.div<{ $top: number; $delay: number }>`
  position: absolute;
  left: 0; top: ${p => p.$top}%;
  width: 85%; height: 5px;
  border-radius: 3px;
  background: linear-gradient(90deg, #116611, #44cc44, transparent);
  box-shadow: 0 0 6px rgba(50, 200, 50, 0.6);
  transform-origin: left center;
  animation: ${kfVine} 420ms ${p => p.$delay}ms ease-out both;
`;
const AnimVineWhip = () => (
  <Root>
    <Vine $top={28} $delay={0}   />
    <Vine $top={52} $delay={70}  />
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  SOLAR BEAM — flash dorado que llena toda la pantalla
// ══════════════════════════════════════════════════════════════════════════════

const kfSolar = keyframes`
  0%   { opacity: 0; background: #ffee88; }
  30%  { opacity: 0.6; background: #ffffcc; }
  60%  { opacity: 1; background: #ffffff; }
  85%  { opacity: 1; }
  100% { opacity: 0; background: #ffffff; }
`;
const SolarFlash = styled.div`
  position: absolute; inset: 0;
  animation: ${kfSolar} 580ms ease-in-out both;
`;
const AnimSolarBeam = () => (
  <Root><SolarFlash /></Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  ICE BEAM — rayo azul claro + cristales de hielo en el impacto
// ══════════════════════════════════════════════════════════════════════════════

const kfBeam = keyframes`
  0%   { opacity: 0; transform: scaleX(0); transform-origin: left center; }
  25%  { opacity: 0.95; transform: scaleX(1); }
  80%  { opacity: 0.75; }
  100% { opacity: 0; }
`;
const IceBeamBar = styled.div`
  position: absolute;
  left: 0; top: 38%;
  width: 100%; height: 24%;
  background: linear-gradient(90deg, #77ddff, #cceeff, #ffffff, transparent);
  border-radius: 4px;
  box-shadow: 0 0 12px rgba(100, 220, 255, 0.6);
  transform-origin: left center;
  animation: ${kfBeam} 460ms ease-out both;
`;
const kfCrystal = keyframes`
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0) rotate(0deg); }
  40%  { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(45deg); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2) rotate(90deg); }
`;
const IceCrystal = styled.div<{ $left: number; $top: number; $size: number; $delay: number }>`
  position: absolute;
  left: ${p => p.$left}%; top: ${p => p.$top}%;
  width: ${p => p.$size}px; height: ${p => p.$size}px;
  background: #aaeeff;
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  box-shadow: 0 0 6px rgba(100, 220, 255, 0.8);
  animation: ${kfCrystal} 420ms ${p => p.$delay}ms ease-out both;
`;
const CRYSTALS = [
  { left: 58, top: 25, size: 14, delay: 150 },
  { left: 72, top: 42, size: 11, delay: 200 },
  { left: 84, top: 30, size: 13, delay: 250 },
  { left: 68, top: 58, size: 10, delay: 300 },
  { left: 80, top: 55, size: 12, delay: 180 },
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
//  BLIZZARD — diamantes de hielo barriendo de derecha a izquierda
// ══════════════════════════════════════════════════════════════════════════════

const kfBliz = keyframes`
  0%   { opacity: 0; transform: translateX(115%); }
  18%  { opacity: 0.9; }
  80%  { opacity: 0.75; }
  100% { opacity: 0; transform: translateX(-15%); }
`;
const BlizPart = styled.div<{ $n: number }>`
  position: absolute;
  right: 0;
  top: ${p => 5 + p.$n * 16}%;
  width:  ${p => [12, 9, 14, 10, 13, 8][p.$n]}px;
  height: ${p => [12, 9, 14, 10, 13, 8][p.$n]}px;
  background: ${p => ["#aaeeff", "#ffffff", "#ccf4ff"][p.$n % 3]};
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  animation: ${kfBliz} 480ms ${p => p.$n * 42}ms ease-in-out both;
`;
const AnimBlizzard = () => (
  <Root>{[0, 1, 2, 3, 4, 5].map(n => <BlizPart key={n} $n={n} />)}</Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  PSYCHIC — anillos rosas concéntricos que se expanden desde el centro
// ══════════════════════════════════════════════════════════════════════════════

const kfPsy = keyframes`
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.06); }
  25%  { opacity: 0.9; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(2.4); }
`;
const PsyRing = styled.div<{ $size: number; $delay: number; $color: string }>`
  position: absolute; left: 50%; top: 50%;
  width: ${p => p.$size}px; height: ${p => p.$size}px;
  border-radius: 50%;
  border: 3px solid ${p => p.$color};
  box-shadow: 0 0 8px ${p => p.$color};
  animation: ${kfPsy} 540ms ${p => p.$delay}ms ease-out both;
`;
const AnimPsychic = () => (
  <Root>
    <PsyRing $size={28}  $delay={0}   $color="#ff44cc" />
    <PsyRing $size={52}  $delay={80}  $color="#cc2299" />
    <PsyRing $size={78}  $delay={160} $color="#ff88dd" />
    <PsyRing $size={104} $delay={240} $color="#ee44bb" />
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  EARTHQUAKE — pantalla se sacude + bloques de tierra caen
// ══════════════════════════════════════════════════════════════════════════════

const kfQuakeBg = keyframes`
  0%,100%              { transform: translateX(0); }
  8%, 24%, 40%, 56%, 72% { transform: translateX(-5px); }
  16%, 32%, 48%, 64%, 80% { transform: translateX(5px); }
`;
const kfRockFall = keyframes`
  0%   { opacity: 0; transform: translateY(-110%) rotate(0deg); }
  15%  { opacity: 1; }
  100% { opacity: 0.5; transform: translateY(110%) rotate(40deg); }
`;
const kfRockFallB = keyframes`
  0%   { opacity: 0; transform: translateY(-110%) rotate(5deg); }
  15%  { opacity: 1; }
  100% { opacity: 0.5; transform: translateY(110%) rotate(-35deg); }
`;
const QuakeWrap = styled.div`
  position: absolute; inset: 0;
  animation: ${kfQuakeBg} 520ms steps(1) forwards;
`;
const EqRock = styled.div<{ $left: number; $size: number; $delay: number; $alt: boolean }>`
  position: absolute;
  left: ${p => p.$left}%; top: -4%;
  width: ${p => p.$size}px; height: ${p => p.$size}px;
  background: ${p => p.$alt ? "#776655" : "#998877"};
  border: 2px solid #554433;
  animation: ${p => p.$alt ? kfRockFallB : kfRockFall} 490ms ${p => p.$delay}ms ease-in both;
`;
const EQ_ROCKS = [
  { left: 10, size: 16, delay: 0,   alt: false },
  { left: 32, size: 12, delay: 60,  alt: true  },
  { left: 58, size: 18, delay: 30,  alt: false },
  { left: 78, size: 14, delay: 90,  alt: true  },
];
const AnimEarthquake = () => (
  <Root>
    <QuakeWrap>
      {EQ_ROCKS.map((r, i) => (
        <EqRock key={i} $left={r.left} $size={r.size} $delay={r.delay} $alt={r.alt} />
      ))}
    </QuakeWrap>
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  ROCK SLIDE — 4 bloques grises cayendo desde arriba
// ══════════════════════════════════════════════════════════════════════════════

const kfRSlA = keyframes`
  0%   { opacity: 0; transform: translate(0, -120%) rotate(-8deg); }
  15%  { opacity: 1; }
  100% { opacity: 0.5; transform: translate(-18%, 110%) rotate(28deg); }
`;
const kfRSlB = keyframes`
  0%   { opacity: 0; transform: translate(0, -120%) rotate(8deg); }
  15%  { opacity: 1; }
  100% { opacity: 0.5; transform: translate(18%, 110%) rotate(-28deg); }
`;
const RSlBlock = styled.div<{ $left: number; $size: number; $delay: number; $alt: boolean }>`
  position: absolute;
  left: ${p => p.$left}%; top: 0;
  width: ${p => p.$size}px; height: ${p => p.$size - 2}px;
  background: ${p => p.$alt ? "#776655" : "#998877"};
  border: 2px solid #554433;
  animation: ${p => p.$alt ? kfRSlB : kfRSlA} 490ms ${p => p.$delay}ms ease-in both;
`;
const RS_ROCKS = [
  { left: 8,  size: 18, delay: 0,   alt: false },
  { left: 28, size: 14, delay: 70,  alt: true  },
  { left: 54, size: 20, delay: 35,  alt: false },
  { left: 74, size: 15, delay: 105, alt: true  },
];
const AnimRockSlide = () => (
  <Root>
    {RS_ROCKS.map((r, i) => (
      <RSlBlock key={i} $left={r.left} $size={r.size} $delay={r.delay} $alt={r.alt} />
    ))}
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  HYPER BEAM — rayo ancho blanco-naranja que barre de izquierda a derecha
// ══════════════════════════════════════════════════════════════════════════════

const kfHyper = keyframes`
  0%   { opacity: 0; transform: scaleX(0); transform-origin: left center; }
  15%  { opacity: 1; transform: scaleX(1); }
  80%  { opacity: 1; }
  100% { opacity: 0; }
`;
const HyperBeamBar = styled.div`
  position: absolute;
  left: 0; top: 28%;
  width: 100%; height: 44%;
  background: linear-gradient(90deg, #ffffff, #ffdd44, #ffaa00, transparent);
  box-shadow: 0 0 24px 8px rgba(255, 200, 0, 0.7);
  transform-origin: left center;
  animation: ${kfHyper} 560ms ease-out both;
`;
const AnimHyperBeam = () => (
  <Root><HyperBeamBar /></Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  TOXIC — burbujas púrpuras subiendo
// ══════════════════════════════════════════════════════════════════════════════

const kfTox = keyframes`
  0%   { opacity: 0; transform: translateY(0)   scale(0.4); }
  25%  { opacity: 0.9; transform: translateY(-12%) scale(1); }
  75%  { opacity: 0.7; transform: translateY(-58%) scale(1.05); }
  100% { opacity: 0; transform: translateY(-95%) scale(0.75); }
`;
const ToxDot = styled.div<{ $n: number }>`
  position: absolute;
  left:   ${p => [22, 48, 36, 62, 42][p.$n]}%;
  bottom: 10%;
  width:  ${p => [15, 19, 12, 17, 14][p.$n]}px;
  height: ${p => [15, 19, 12, 17, 14][p.$n]}px;
  border-radius: 50%;
  background: rgba(180, 50, 220, 0.75);
  border: 2px solid #cc44ff;
  box-shadow: 0 0 8px rgba(180, 50, 220, 0.55);
  animation: ${kfTox} 520ms ${p => p.$n * 80}ms ease-out both;
`;
const AnimToxic = () => (
  <Root>{[0, 1, 2, 3, 4].map(n => <ToxDot key={n} $n={n} />)}</Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  SLEEP POWDER — lluvia de brillantes multicolor cayendo
// ══════════════════════════════════════════════════════════════════════════════

const kfSparkle = keyframes`
  0%   { opacity: 0; transform: translateY(-5%); }
  20%  { opacity: 0.95; }
  100% { opacity: 0; transform: translateY(65%); }
`;
const SPARKLE_COLS = ["#4488ff", "#44cc44", "#cc44ff", "#ffcc00", "#ff6688", "#66ccff", "#ff9944", "#88eebb"];
const SparkDot = styled.div<{ $left: number; $size: number; $delay: number; $col: string }>`
  position: absolute;
  left: ${p => p.$left}%; top: 0;
  width: ${p => p.$size}px; height: ${p => p.$size}px;
  border-radius: 50%;
  background: ${p => p.$col};
  box-shadow: 0 0 5px ${p => p.$col};
  animation: ${kfSparkle} 560ms ${p => p.$delay}ms ease-out both;
`;
const SPARKLES = [
  { left: 12, size: 7, delay: 0   }, { left: 26, size: 6, delay: 35  },
  { left: 40, size: 8, delay: 70  }, { left: 55, size: 6, delay: 15  },
  { left: 68, size: 7, delay: 55  }, { left: 80, size: 6, delay: 90  },
  { left: 20, size: 6, delay: 110 }, { left: 48, size: 7, delay: 130 },
  { left: 72, size: 6, delay: 45  }, { left: 34, size: 5, delay: 80  },
  { left: 60, size: 8, delay: 20  }, { left: 85, size: 6, delay: 100 },
];
const AnimSleepPowder = () => (
  <Root>
    {SPARKLES.map((s, i) => (
      <SparkDot key={i} $left={s.left} $size={s.size} $delay={s.delay} $col={SPARKLE_COLS[i % SPARKLE_COLS.length]} />
    ))}
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  SAND ATTACK — partículas marrones en abanico
// ══════════════════════════════════════════════════════════════════════════════

const kfSand = keyframes`
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.2); }
  20%  { opacity: 0.9; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; }
`;
const SAND_COLS = ["#ccaa66", "#aa8844", "#ddbb77", "#bb9955"];
const SandPart = styled.div<{ $left: number; $top: number; $size: number; $delay: number; $col: string }>`
  position: absolute;
  left: ${p => p.$left}%; top: ${p => p.$top}%;
  width: ${p => p.$size}px; height: ${p => p.$size}px;
  border-radius: 2px;
  background: ${p => p.$col};
  animation: ${kfSand} 420ms ${p => p.$delay}ms ease-out both;
`;
const SAND_PARTS = [
  { left: 20, top: 40, size: 8, delay: 0  }, { left: 35, top: 25, size: 7, delay: 30 },
  { left: 50, top: 50, size: 9, delay: 0  }, { left: 65, top: 30, size: 7, delay: 50 },
  { left: 30, top: 60, size: 6, delay: 40 }, { left: 55, top: 65, size: 8, delay: 20 },
  { left: 70, top: 45, size: 7, delay: 60 }, { left: 45, top: 35, size: 6, delay: 10 },
];
const AnimSandAttack = () => (
  <Root>
    {SAND_PARTS.map((s, i) => (
      <SandPart key={i} $left={s.left} $top={s.top} $size={s.size} $delay={s.delay} $col={SAND_COLS[i % SAND_COLS.length]} />
    ))}
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  STATUS BUFF — estrellas doradas flotando hacia arriba (en el atacante)
// ══════════════════════════════════════════════════════════════════════════════

const kfBuff = keyframes`
  0%   { opacity: 0; transform: translate(-50%, 0) scale(0.4); }
  20%  { opacity: 0.95; transform: translate(-50%, -10%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -80%) scale(0.8); }
`;
const BuffStar = styled.div<{ $left: number; $delay: number; $size: number }>`
  position: absolute;
  left: ${p => p.$left}%; bottom: 15%;
  width: ${p => p.$size}px; height: ${p => p.$size}px;
  clip-path: polygon(
    50% 0%, 61% 35%, 98% 35%, 68% 57%,
    79% 91%, 50% 70%, 21% 91%, 32% 57%,
    2% 35%, 39% 35%
  );
  background: #ffdd22;
  box-shadow: 0 0 8px rgba(255, 220, 0, 0.8);
  animation: ${kfBuff} 560ms ${p => p.$delay}ms ease-out both;
`;
const BUFF_STARS = [
  { left: 22, delay: 0,   size: 16 },
  { left: 50, delay: 90,  size: 12 },
  { left: 76, delay: 45,  size: 14 },
  { left: 38, delay: 135, size: 11 },
  { left: 64, delay: 180, size: 13 },
];
const AnimStatusBuff = () => (
  <Root>
    {BUFF_STARS.map((s, i) => (
      <BuffStar key={i} $left={s.left} $delay={s.delay} $size={s.size} />
    ))}
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  STATUS DEBUFF — destellos oscuros cayendo sobre el objetivo
// ══════════════════════════════════════════════════════════════════════════════

const kfDebuff = keyframes`
  0%   { opacity: 0; transform: translateY(-8%); }
  18%  { opacity: 0.9; }
  100% { opacity: 0; transform: translateY(70%); }
`;
const DebuffDrop = styled.div<{ $left: number; $delay: number; $size: number }>`
  position: absolute;
  left: ${p => p.$left}%; top: 0;
  width: ${p => p.$size}px; height: ${p => p.$size + 4}px;
  border-radius: 50% 50% 40% 40%;
  background: rgba(80, 20, 120, 0.8);
  box-shadow: 0 0 6px rgba(120, 40, 180, 0.6);
  animation: ${kfDebuff} 450ms ${p => p.$delay}ms ease-in both;
`;
const DEBUFF_DROPS = [
  { left: 18, delay: 0,   size: 9  },
  { left: 36, delay: 60,  size: 7  },
  { left: 52, delay: 20,  size: 10 },
  { left: 68, delay: 90,  size: 8  },
  { left: 82, delay: 40,  size: 7  },
  { left: 28, delay: 110, size: 8  },
  { left: 60, delay: 75,  size: 9  },
];
const AnimStatusDebuff = () => (
  <Root>
    {DEBUFF_DROPS.map((d, i) => (
      <DebuffDrop key={i} $left={d.left} $delay={d.delay} $size={d.size} />
    ))}
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  ROUTER — selecciona el componente según el tipo de animación
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
  // Contador que se incrementa cada vez que active pasa a true,
  // forzando un remount y por tanto una animación fresca.
  const [renderKey, setRenderKey] = useState(0);
  const prevActive = useRef(false);

  useEffect(() => {
    if (active && !prevActive.current) {
      setRenderKey(k => k + 1);
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
