/**
 * MoveAnimation — animaciones de combate estilo Game Boy Gen I (Pokémon Rojo/Azul).
 *
 * Reglas estéticas obligatorias:
 *  - Sin CSS gradients (colores planos únicamente)
 *  - Sin box-shadow con blur (sin glow ni halo)
 *  - Tamaño de "pixel" base: 6 px — elementos en múltiplos de 6
 *  - Timing steps() para efecto frame-a-frame del Game Boy
 *  - Paleta por tipo: máximo 3 colores, extraídos del juego original
 *  - Sin border-radius salvo en círculos auténticos (burbujas, gotas)
 */

import React, { useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import { getMoveAnimType } from "../app/move-animations";
import { getMoveMetadata } from "../app/use-move-metadata";

// ─── Props ────────────────────────────────────────────────────────────────────
interface MoveAnimationProps {
  moveId: string | null;
  active: boolean;
  fromDirection?: "left" | "right";
}

// ─── Paleta auténtica Game Boy / Gen I ────────────────────────────────────────
// Colores extraídos de los sprites originales (Game Boy Color ROM)
const P = {
  white:   "#F8F8F8",
  lgray:   "#B0B0B0",
  dgray:   "#585858",
  fire1:   "#F07818",  // naranja llama
  fire2:   "#F8C820",  // amarillo llama
  water1:  "#6888F0",  // azul agua
  water2:  "#A8C8F8",  // azul claro
  elec1:   "#F8D030",  // amarillo rayo
  elec2:   "#F8F870",  // amarillo pálido
  grass1:  "#70C040",  // verde hoja
  grass2:  "#307820",  // verde oscuro
  ice1:    "#98D8D8",  // azul hielo
  ice2:    "#C8E8E8",  // blanco-hielo
  psy1:    "#F85888",  // rosa psíquico
  psy2:    "#F83050",  // rojo psíquico
  gnd1:    "#C8A848",  // tierra
  gnd2:    "#907028",  // tierra oscura
  rock1:   "#B8A870",  // roca
  rock2:   "#807048",  // roca oscura
  poi1:    "#A848C0",  // violeta
  poi2:    "#C870D8",  // lila
  sand:    "#D8B878",  // arena
  sand2:   "#A88840",  // arena oscura
};

// ─── Contenedor raíz de cada animación ────────────────────────────────────────
const Root = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 10;
`;

// ══════════════════════════════════════════════════════════════════════════════
//  TACKLE — dos destellos blancos a pasos (impacto físico)
//  Original: el sprite del objetivo parpadea en blanco 2 veces
// ══════════════════════════════════════════════════════════════════════════════
const kfTackle = keyframes`
  0%,100%  { opacity: 0; }
  20%,60%  { opacity: 1; }
  40%,80%  { opacity: 0; }
`;
const TackleFlash = styled.div`
  position: absolute; inset: 0;
  background: ${P.white};
  animation: ${kfTackle} 320ms steps(1) forwards;
`;
const AnimTackle = () => <Root><TackleFlash /></Root>;

// ══════════════════════════════════════════════════════════════════════════════
//  SCRATCH — 3 rayas diagonales blancas (Scratch, Slash, Cut…)
//  Original: 3 líneas de 2px en ~45° barriendo de izquierda a derecha
// ══════════════════════════════════════════════════════════════════════════════
const kfScratchLine = keyframes`
  0%   { opacity: 0; transform: translateX(-80%) rotate(-40deg); }
  20%  { opacity: 1; transform: translateX(-40%) rotate(-40deg); }
  80%  { opacity: 1; transform: translateX(40%)  rotate(-40deg); }
  100% { opacity: 0; transform: translateX(80%)  rotate(-40deg); }
`;
const SLine = styled.div<{ $n: number }>`
  position: absolute;
  left: 15%; top: ${p => 15 + p.$n * 24}%;
  width: 70%; height: 4px;
  background: ${P.white};
  animation: ${kfScratchLine} 260ms steps(2) ${p => p.$n * 55}ms both;
`;
const AnimScratch = () => (
  <Root><SLine $n={0} /><SLine $n={1} /><SLine $n={2} /></Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  EMBER — 4 chispas naranjas parpadeantes
//  Original: 4 tiles cuadrados de ~8px que aparecen en posiciones fijas
//  alrededor del sprite y desaparecen en 2 frames
// ══════════════════════════════════════════════════════════════════════════════
const kfEmberDot = keyframes`
  0%,100%  { opacity: 0; transform: scale(1); }
  20%,60%  { opacity: 1; transform: scale(1); }
  80%      { opacity: 0; transform: scale(1.3); }
`;
const EMBER_POS = [[30,35],[55,20],[65,55],[20,60],[45,45]] as const;
const EDot = styled.div<{ $i: number }>`
  position: absolute;
  left: ${p => EMBER_POS[p.$i][0]}%; top: ${p => EMBER_POS[p.$i][1]}%;
  width: 10px; height: 10px;
  background: ${p => p.$i % 2 === 0 ? P.fire1 : P.fire2};
  animation: ${kfEmberDot} 380ms steps(1) ${p => p.$i * 60}ms both;
`;
const AnimEmber = () => (
  <Root>{[0,1,2,3,4].map(i => <EDot key={i} $i={i} />)}</Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  FLAMETHROWER — bloques naranjas que barren de izquierda a derecha
//  Original: tiles de llama (~16×12) en fila desplazándose hacia el rival
// ══════════════════════════════════════════════════════════════════════════════
const kfFlameTile = keyframes`
  0%   { opacity: 0; transform: translateX(-110%); }
  15%  { opacity: 1; }
  85%  { opacity: 1; }
  100% { opacity: 0; transform: translateX(20%); }
`;
const FTile = styled.div<{ $n: number }>`
  position: absolute;
  left: 0; top: ${p => 25 + p.$n * 10}%;
  width: ${p => 30 + p.$n * 8}%; height: 10px;
  background: ${p => p.$n % 2 === 0 ? P.fire1 : P.fire2};
  animation: ${kfFlameTile} 440ms steps(2) ${p => p.$n * 40}ms both;
`;
const AnimFlamethrower = () => (
  <Root>{[0,1,2,3,4].map(n => <FTile key={n} $n={n} />)}</Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  FIRE BLAST — estrella de 5 puntas hecha de bloques cuadrados
//  Original: cruz central + 4 brazos diagonales, naranja plano, escala→fade
// ══════════════════════════════════════════════════════════════════════════════
const kfStar = keyframes`
  0%   { opacity: 0; transform: translate(-50%,-50%) scale(0.1); }
  30%  { opacity: 1; transform: translate(-50%,-50%) scale(1); }
  75%  { opacity: 1; transform: translate(-50%,-50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%,-50%) scale(1.1); }
`;
const StarBase = styled.div`
  position: absolute; left: 50%; top: 50%;
  animation: ${kfStar} 500ms steps(2) both;
`;
// Cruz horizontal+vertical (5 bloques de 12px)
const SCross = styled.div`
  position: relative; width: 12px; height: 12px;
  background: ${P.fire1};
  &::before {
    content: ''; position: absolute;
    left: -12px; top: 0; width: 12px; height: 12px;
    background: ${P.fire2};
    box-shadow: 24px 0 0 ${P.fire2};
  }
  &::after {
    content: ''; position: absolute;
    left: 0; top: -12px; width: 12px; height: 12px;
    background: ${P.fire1};
    box-shadow: 0 24px 0 ${P.fire1};
  }
`;
const AnimFireBlast = () => (
  <Root>
    <StarBase>
      <SCross />
      {/* Brazos extra: 4 cuadrados diagonales */}
      {([[-18,-18],[18,-18],[-18,18],[18,18]] as [number,number][]).map(([x,y],i) => (
        <div key={i} style={{
          position:'absolute', left: 12+x, top: 12+y,
          width: 8, height: 8,
          background: i % 2 === 0 ? P.fire1 : P.fire2,
        }}/>
      ))}
    </StarBase>
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  WATER GUN — gotas azules en línea
//  Original: ovales azules de ~12×8 px desplazándose en fila
// ══════════════════════════════════════════════════════════════════════════════
const kfWDrop = keyframes`
  0%   { opacity: 0; transform: translateX(-110%); }
  18%  { opacity: 1; }
  82%  { opacity: 1; }
  100% { opacity: 0; transform: translateX(20%); }
`;
const WDrop = styled.div<{ $n: number }>`
  position: absolute;
  left: 0; top: ${p => 28 + p.$n * 14}%;
  width: 18px; height: 12px;
  border-radius: 50%;
  background: ${p => p.$n % 2 === 0 ? P.water1 : P.water2};
  animation: ${kfWDrop} 360ms steps(2) ${p => p.$n * 65}ms both;
`;
const AnimWaterGun = () => (
  <Root>{[0,1,2,3].map(n => <WDrop key={n} $n={n} />)}</Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  BUBBLE — círculos huecos subiendo
//  Original: anillos blancos/azul de ~12px que ascienden y se desvanecen
// ══════════════════════════════════════════════════════════════════════════════
const kfBubble = keyframes`
  0%   { opacity: 0; transform: translateY(5%); }
  25%  { opacity: 1; transform: translateY(0); }
  80%  { opacity: 0.7; transform: translateY(-60%); }
  100% { opacity: 0; transform: translateY(-85%); }
`;
const BBubble = styled.div<{ $n: number }>`
  position: absolute;
  left: ${p => [20,48,34,62][p.$n]}%;
  bottom: 12%;
  width: ${p => [14,18,12,16][p.$n]}px;
  height: ${p => [14,18,12,16][p.$n]}px;
  border-radius: 50%;
  border: 3px solid ${p => p.$n % 2 === 0 ? P.water1 : P.white};
  background: transparent;
  animation: ${kfBubble} 500ms steps(2) ${p => p.$n * 80}ms both;
`;
const AnimBubble = () => (
  <Root>{[0,1,2,3].map(n => <BBubble key={n} $n={n} />)}</Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  SURF — rectángulo azul sólido que barre de lado a lado
//  Original: gran tile de ola (64×40px aprox.) deslizándose
// ══════════════════════════════════════════════════════════════════════════════
const kfSurf = keyframes`
  0%   { opacity: 0; transform: translateX(-110%); }
  20%  { opacity: 1; }
  80%  { opacity: 1; }
  100% { opacity: 0; transform: translateX(110%); }
`;
const SurfBlock = styled.div`
  position: absolute;
  left: 0; top: 18%;
  width: 110%; height: 64%;
  background: ${P.water1};
  animation: ${kfSurf} 480ms steps(3) both;
`;
// Cresta de la ola (franja más clara en la parte superior)
const SurfCrest = styled.div`
  position: absolute;
  left: 0; top: 18%;
  width: 110%; height: 12px;
  background: ${P.water2};
  animation: ${kfSurf} 480ms steps(3) both;
`;
const AnimSurf = () => (
  <Root><SurfBlock /><SurfCrest /></Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  THUNDERBOLT — rayo amarillo zigzag, parpadeo steps
//  Original: polígono pixel-grid en amarillo brillante, parpadea 4 veces
//  Forma: zigzag estricto de segmentos H/V para look pixelado auténtico
// ══════════════════════════════════════════════════════════════════════════════
const kfBolt = keyframes`
  0%,100%              { opacity: 0; }
  10%,30%,50%,70%      { opacity: 1; }
  20%,40%,60%,80%      { opacity: 0; }
`;
const BoltSvg = styled.svg`
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  animation: ${kfBolt} 480ms steps(1) forwards;
`;
// Polígono rayo hecho de segmentos H/V (pixel-aligned)
// viewBox 56×56 ≈ tamaño sprite Gen I
const BOLT_PTS = "58,2 38,2 38,20 20,20 20,38 42,38 42,54 56,54 56,36 36,36 36,22 54,22 54,2";
const AnimThunderbolt = () => (
  <Root>
    <BoltSvg viewBox="0 0 72 72" preserveAspectRatio="xMidYMid meet">
      {/* Sombra oscura (2px offset) */}
      <polygon points={BOLT_PTS} fill={P.elec1}
        transform="translate(2,2)" />
      {/* Rayo principal amarillo */}
      <polygon points={BOLT_PTS} fill={P.elec2} />
      {/* Centro blanco (brillo) */}
      <polygon points={BOLT_PTS} fill={P.white} opacity="0.4" />
    </BoltSvg>
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  THUNDER — rayo vertical cayendo desde arriba
//  Original: igual que Thunderbolt pero orientado de arriba abajo, aparece
//  desde el tope con clip revelado frame a frame
// ══════════════════════════════════════════════════════════════════════════════
const kfThunderReveal = keyframes`
  0%   { clip-path: inset(0 0 100% 0); opacity: 1; }
  40%  { clip-path: inset(0 0 0%   0); opacity: 1; }
  75%  { clip-path: inset(0 0 0%   0); opacity: 1; }
  100% { clip-path: inset(0 0 0%   0); opacity: 0; }
`;
const ThunderSvg = styled.svg`
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  animation: ${kfThunderReveal} 440ms steps(3) both;
`;
const VBOLT = "50,0 38,0 38,22 26,22 26,44 42,44 42,64 56,64 56,42 40,42 40,24 52,24 52,0";
const AnimThunder = () => (
  <Root>
    <ThunderSvg viewBox="0 0 72 72" preserveAspectRatio="xMidYMid meet">
      <polygon points={VBOLT} fill={P.elec1} transform="translate(2,2)" />
      <polygon points={VBOLT} fill={P.elec2} />
    </ThunderSvg>
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  THUNDER WAVE — anillos eléctricos concéntricos
//  Original: pixel-circles amarillas que se expanden desde el centro
// ══════════════════════════════════════════════════════════════════════════════
const kfTWRing = keyframes`
  0%   { opacity: 0; transform: translate(-50%,-50%) scale(0.1); }
  30%  { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%,-50%) scale(2.5); }
`;
const TWRing = styled.div<{ $sz: number; $delay: number }>`
  position: absolute; left: 50%; top: 50%;
  width: ${p => p.$sz}px; height: ${p => p.$sz}px;
  border-radius: 50%;
  border: 3px solid ${P.elec1};
  background: transparent;
  animation: ${kfTWRing} 480ms steps(2) ${p => p.$delay}ms both;
`;
const AnimThunderWave = () => (
  <Root>
    <TWRing $sz={30} $delay={0}   />
    <TWRing $sz={52} $delay={80}  />
    <TWRing $sz={76} $delay={160} />
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  RAZOR LEAF — diamantes verdes girando y moviéndose
//  Original: tile en forma de rombo (~8×8) verde, gira ~90°/frame, 3 hojas
// ══════════════════════════════════════════════════════════════════════════════
const kfLeaf = keyframes`
  0%   { opacity: 0; transform: translate(-50%,-50%) rotate(0deg)   scale(0.4); }
  15%  { opacity: 1; transform: translate(-50%,-50%) rotate(90deg)  scale(1); }
  80%  { opacity: 1; transform: translate(-50%,-50%) rotate(270deg) scale(1); }
  100% { opacity: 0; transform: translate(-50%,-50%) rotate(360deg) scale(0.7); }
`;
const LLeaf = styled.div<{ $left: number; $top: number; $delay: number }>`
  position: absolute;
  left: ${p => p.$left}%; top: ${p => p.$top}%;
  width: 18px; height: 12px;
  background: ${P.grass1};
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  animation: ${kfLeaf} 460ms steps(3) ${p => p.$delay}ms both;
`;
const AnimRazorLeaf = () => (
  <Root>
    <LLeaf $left={28} $top={30} $delay={0}   />
    <LLeaf $left={52} $top={52} $delay={75}  />
    <LLeaf $left={68} $top={22} $delay={150} />
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  VINE WHIP — líneas verdes que se extienden desde el borde
//  Original: 2 líneas de pixels verdes que crecen horizontalmente
// ══════════════════════════════════════════════════════════════════════════════
const kfVine = keyframes`
  0%   { transform: scaleX(0); opacity: 0; transform-origin: left center; }
  25%  { transform: scaleX(1); opacity: 1; transform-origin: left center; }
  80%  { opacity: 1; }
  100% { opacity: 0; }
`;
const Vine = styled.div<{ $top: number; $w: number; $delay: number }>`
  position: absolute;
  left: 0; top: ${p => p.$top}%;
  width: ${p => p.$w}%; height: 6px;
  background: ${P.grass2};
  animation: ${kfVine} 420ms steps(2) ${p => p.$delay}ms both;
`;
const AnimVineWhip = () => (
  <Root>
    <Vine $top={28} $w={80} $delay={0}  />
    <Vine $top={52} $w={65} $delay={70} />
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  SOLAR BEAM — flash blanco que se construye y luego explota
//  Original: pantalla se vuelve blanca completa durante 6-8 frames
// ══════════════════════════════════════════════════════════════════════════════
const kfSolar = keyframes`
  0%   { opacity: 0; }
  30%  { opacity: 0.5; background: ${P.elec2}; }
  60%  { opacity: 1;   background: ${P.white}; }
  90%  { opacity: 1; }
  100% { opacity: 0; }
`;
const SolarFlash = styled.div`
  position: absolute; inset: 0;
  background: ${P.white};
  animation: ${kfSolar} 560ms steps(3) both;
`;
const AnimSolarBeam = () => <Root><SolarFlash /></Root>;

// ══════════════════════════════════════════════════════════════════════════════
//  ICE BEAM — barra azul-hielo + rombos de cristal en el impacto
//  Original: barra horizontal azul clara + 4-5 tiles de cristal
// ══════════════════════════════════════════════════════════════════════════════
const kfIceBar = keyframes`
  0%   { transform: scaleX(0); transform-origin: left center; opacity: 0; }
  25%  { transform: scaleX(1); opacity: 1; }
  80%  { opacity: 1; }
  100% { opacity: 0; }
`;
const IceBar = styled.div`
  position: absolute;
  left: 0; top: 38%;
  width: 100%; height: 18px;
  background: ${P.ice1};
  transform-origin: left center;
  animation: ${kfIceBar} 440ms steps(2) both;
`;
const kfCrystal = keyframes`
  0%   { opacity: 0; transform: translate(-50%,-50%) scale(0) rotate(0deg); }
  40%  { opacity: 1; transform: translate(-50%,-50%) scale(1) rotate(45deg); }
  100% { opacity: 0; transform: translate(-50%,-50%) scale(1) rotate(90deg); }
`;
const Crystal = styled.div<{$l:number;$t:number;$s:number;$d:number}>`
  position: absolute;
  left: ${p=>p.$l}%; top: ${p=>p.$t}%;
  width: ${p=>p.$s}px; height: ${p=>p.$s}px;
  background: ${P.ice2};
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  animation: ${kfCrystal} 380ms steps(2) ${p=>p.$d}ms both;
`;
const ICE_CRYSTALS = [{l:58,t:26,s:12,d:160},{l:72,t:44,s:10,d:210},{l:84,t:32,s:11,d:250},{l:68,t:58,s:9,d:190},{l:80,t:54,s:10,d:170}];
const AnimIceBeam = () => (
  <Root>
    <IceBar />
    {ICE_CRYSTALS.map((c,i) => <Crystal key={i} $l={c.l} $t={c.t} $s={c.s} $d={c.d} />)}
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  BLIZZARD — rombos de hielo barriendo de derecha a izquierda
//  Original: ~6 tiles de nieve/hielo que barren toda la pantalla
// ══════════════════════════════════════════════════════════════════════════════
const kfBlizz = keyframes`
  0%   { opacity: 0; transform: translateX(115%); }
  15%  { opacity: 1; }
  85%  { opacity: 1; }
  100% { opacity: 0; transform: translateX(-15%); }
`;
const BlizzTile = styled.div<{$n:number}>`
  position: absolute;
  right: 0; top: ${p=>5+p.$n*16}%;
  width:  ${p=>[10,8,12,9,11,8][p.$n]}px;
  height: ${p=>[10,8,12,9,11,8][p.$n]}px;
  background: ${p=>p.$n%2===0?P.ice1:P.white};
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  animation: ${kfBlizz} 460ms steps(2) ${p=>p.$n*38}ms both;
`;
const AnimBlizzard = () => (
  <Root>{[0,1,2,3,4,5].map(n=><BlizzTile key={n} $n={n}/>)}</Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  PSYCHIC — bandas horizontales rosas que ripplean por la pantalla
//  Original: MUY característico — el fondo se vuelve rojo/rosa y bandas
//  horizontales se desplazan de izquierda a derecha, efecto de distorsión
// ══════════════════════════════════════════════════════════════════════════════
const kfPsyBand = keyframes`
  0%   { transform: translateX(-100%); opacity: 0; }
  15%  { opacity: 1; }
  85%  { opacity: 1; }
  100% { transform: translateX(100%); opacity: 0; }
`;
const kfPsyBg = keyframes`
  0%,100%  { opacity: 0; }
  20%,80%  { opacity: 0.35; }
`;
const PsyBg = styled.div`
  position: absolute; inset: 0;
  background: ${P.psy2};
  animation: ${kfPsyBg} 520ms steps(1) both;
`;
const PsyBand = styled.div<{$top:number;$h:number;$delay:number}>`
  position: absolute;
  left: -100%; top: ${p=>p.$top}%;
  width: 100%; height: ${p=>p.$h}px;
  background: ${p=>p.$top%20===0?P.psy2:P.psy1};
  animation: ${kfPsyBand} 500ms steps(2) ${p=>p.$delay}ms both;
`;
const PSY_BANDS = [
  {top:8, h:8, delay:0},{top:18,h:6,delay:30},{top:30,h:10,delay:60},
  {top:42,h:6,delay:20},{top:54,h:8,delay:50},{top:66,h:6,delay:10},
  {top:78,h:8,delay:40},{top:88,h:6,delay:70},
];
const AnimPsychic = () => (
  <Root>
    <PsyBg />
    {PSY_BANDS.map((b,i)=><PsyBand key={i} $top={b.top} $h={b.h} $delay={b.delay}/>)}
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  EARTHQUAKE — bloques de tierra volando + pantalla sacudiéndose
//  Original: tiles marrones/gris que salen del suelo, pantalla vibra
// ══════════════════════════════════════════════════════════════════════════════
const kfShake = keyframes`
  0%,100%  { transform: translateX(0); }
  10%,30%,50%,70%,90% { transform: translateX(-4px); }
  20%,40%,60%,80%     { transform: translateX(4px); }
`;
const kfEqChunk = keyframes`
  0%   { opacity: 0; transform: translateY(0); }
  15%  { opacity: 1; transform: translateY(-15%); }
  80%  { opacity: 1; transform: translateY(-90%); }
  100% { opacity: 0; transform: translateY(-110%); }
`;
const ShakeWrap = styled.div`
  position: absolute; inset: 0;
  animation: ${kfShake} 480ms steps(1) forwards;
`;
const EqChunk = styled.div<{$l:number;$s:number;$delay:number;$col:string}>`
  position: absolute;
  left: ${p=>p.$l}%; bottom: 5%;
  width: ${p=>p.$s}px; height: ${p=>p.$s}px;
  background: ${p=>p.$col};
  animation: ${kfEqChunk} 460ms steps(3) ${p=>p.$delay}ms both;
`;
const EQ = [
  {l:8, s:14,delay:0,  col:P.gnd1},{l:26,s:10,delay:55, col:P.gnd2},
  {l:50,s:16,delay:25, col:P.gnd1},{l:70,s:12,delay:80, col:P.gnd2},
  {l:85,s:10,delay:40, col:P.gnd1},
];
const AnimEarthquake = () => (
  <Root>
    <ShakeWrap>
      {EQ.map((e,i)=><EqChunk key={i} $l={e.l} $s={e.s} $delay={e.delay} $col={e.col}/>)}
    </ShakeWrap>
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  ROCK SLIDE — bloques grises cayendo desde arriba
//  Original: 3-4 tiles cuadrados de roca cayendo verticalmente
// ══════════════════════════════════════════════════════════════════════════════
const kfRockA = keyframes`
  0%   { opacity: 0; transform: translate(0,-120%) rotate(-8deg); }
  15%  { opacity: 1; }
  100% { opacity: 0.5; transform: translate(-16%,110%) rotate(28deg); }
`;
const kfRockB = keyframes`
  0%   { opacity: 0; transform: translate(0,-120%) rotate(8deg); }
  15%  { opacity: 1; }
  100% { opacity: 0.5; transform: translate(16%,110%) rotate(-28deg); }
`;
const RockBlock = styled.div<{$l:number;$s:number;$delay:number;$alt:boolean}>`
  position: absolute;
  left: ${p=>p.$l}%; top: 0;
  width: ${p=>p.$s}px; height: ${p=>p.$s-2}px;
  background: ${p=>p.$alt?P.rock2:P.rock1};
  animation: ${p=>p.$alt?kfRockB:kfRockA} 470ms steps(3) ${p=>p.$delay}ms both;
`;
const ROCKS=[{l:8,s:16,delay:0,alt:false},{l:28,s:12,delay:65,alt:true},{l:55,s:18,delay:30,alt:false},{l:76,s:13,delay:95,alt:true}];
const AnimRockSlide = () => (
  <Root>{ROCKS.map((r,i)=><RockBlock key={i} $l={r.l} $s={r.s} $delay={r.delay} $alt={r.alt}/>)}</Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  HYPER BEAM — barra ancha que barre de izquierda a derecha
//  Original: barra blanca-naranja de ~1/3 de pantalla de alto, rápida
// ══════════════════════════════════════════════════════════════════════════════
const kfHyper = keyframes`
  0%   { opacity: 0; transform: scaleX(0); transform-origin: left center; }
  15%  { opacity: 1; transform: scaleX(1); }
  80%  { opacity: 1; }
  100% { opacity: 0; }
`;
const HBeamOrange = styled.div`
  position: absolute;
  left: 0; top: 30%;
  width: 100%; height: 40%;
  background: ${P.fire1};
  transform-origin: left center;
  animation: ${kfHyper} 520ms steps(2) both;
`;
const HBeamWhite = styled.div`
  position: absolute;
  left: 0; top: 38%;
  width: 100%; height: 24%;
  background: ${P.white};
  transform-origin: left center;
  animation: ${kfHyper} 520ms steps(2) both;
`;
const AnimHyperBeam = () => (
  <Root><HBeamOrange /><HBeamWhite /></Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  TOXIC — burbujas violetas subiendo
//  Original: ~4-5 círculos morados de ~8-10px que ascienden steps
// ══════════════════════════════════════════════════════════════════════════════
const kfToxic = keyframes`
  0%   { opacity: 0; transform: translateY(0); }
  20%  { opacity: 1; transform: translateY(-10%); }
  80%  { opacity: 0.8; transform: translateY(-70%); }
  100% { opacity: 0; transform: translateY(-90%); }
`;
const ToxBubble = styled.div<{$n:number}>`
  position: absolute;
  left: ${p=>[22,46,34,60,40][p.$n]}%;
  bottom: 10%;
  width:  ${p=>[12,16,10,14,11][p.$n]}px;
  height: ${p=>[12,16,10,14,11][p.$n]}px;
  border-radius: 50%;
  background: ${p=>p.$n%2===0?P.poi1:P.poi2};
  animation: ${kfToxic} 500ms steps(3) ${p=>p.$n*75}ms both;
`;
const AnimToxic = () => (
  <Root>{[0,1,2,3,4].map(n=><ToxBubble key={n} $n={n}/>)}</Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  SLEEP POWDER — puntos de colores cayendo (azul, verde, lila)
//  Original: pequeñas partículas de ~4px en 3-4 colores, caen lento
// ══════════════════════════════════════════════════════════════════════════════
const kfSpore = keyframes`
  0%   { opacity: 0; transform: translateY(-5%); }
  20%  { opacity: 1; }
  100% { opacity: 0; transform: translateY(70%); }
`;
// Solo 3 colores (igual que en Gen I: azul, verde y lila)
const SPORE_COLS = [P.water1, P.grass1, P.poi1, P.elec1, P.water2, P.grass2];
const SPORES = [
  {l:10,d:0},{l:22,d:45},{l:38,d:15},{l:52,d:80},{l:65,d:30},
  {l:78,d:60},{l:18,d:110},{l:46,d:90},{l:70,d:20},{l:85,d:50},
  {l:32,d:70},{l:58,d:5},
];
const SDot = styled.div<{$l:number;$d:number;$c:string}>`
  position: absolute;
  left: ${p=>p.$l}%; top: 0;
  width: 6px; height: 6px;
  background: ${p=>p.$c};
  animation: ${kfSpore} 560ms steps(3) ${p=>p.$d}ms both;
`;
const AnimSleepPowder = () => (
  <Root>
    {SPORES.map((s,i)=><SDot key={i} $l={s.l} $d={s.d} $c={SPORE_COLS[i%SPORE_COLS.length]}/>)}
  </Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  SAND ATTACK — píxeles marrones dispersándose desde el centro
//  Original: partículas de tierra/arena de ~4-6px en abanico
// ══════════════════════════════════════════════════════════════════════════════
const kfSandP = keyframes`
  0%   { opacity: 0; transform: translate(-50%,-50%) scale(0.2); }
  20%  { opacity: 1; transform: translate(-50%,-50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%,-50%) scale(1); }
`;
const SAND = [
  {l:20,t:40},{l:35,t:25},{l:50,t:50},{l:65,t:30},{l:80,t:45},
  {l:28,t:60},{l:55,t:65},{l:72,t:40},{l:42,t:35},{l:60,t:55},
];
const SPix = styled.div<{$l:number;$t:number;$n:number}>`
  position: absolute;
  left: ${p=>p.$l}%; top: ${p=>p.$t}%;
  width: 6px; height: 6px;
  background: ${p=>p.$n%2===0?P.sand:P.sand2};
  animation: ${kfSandP} 400ms steps(2) ${p=>p.$n*28}ms both;
`;
const AnimSandAttack = () => (
  <Root>{SAND.map((s,i)=><SPix key={i} $l={s.l} $t={s.t} $n={i}/>)}</Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  STATUS BUFF — estrellas/cruces blancas flotando hacia arriba
//  Original: tiles de estrella blanca/amarilla que ascienden 2-3 veces
// ══════════════════════════════════════════════════════════════════════════════
const kfBuff = keyframes`
  0%   { opacity: 0; transform: translate(-50%, 10%) scale(0.5); }
  20%  { opacity: 1; transform: translate(-50%, 0)   scale(1); }
  100% { opacity: 0; transform: translate(-50%,-80%) scale(0.9); }
`;
// Estrella como clip-path (5 puntas simplificada)
const BStar = styled.div<{$l:number;$d:number;$s:number}>`
  position: absolute;
  left: ${p=>p.$l}%; bottom: 15%;
  width: ${p=>p.$s}px; height: ${p=>p.$s}px;
  background: ${P.elec2};
  clip-path: polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);
  animation: ${kfBuff} 540ms steps(3) ${p=>p.$d}ms both;
`;
const BSTARS=[{l:20,d:0,s:14},{l:48,d:90,s:11},{l:74,d:45,s:13},{l:36,d:130,s:10},{l:62,d:175,s:12}];
const AnimStatusBuff = () => (
  <Root>{BSTARS.map((b,i)=><BStar key={i} $l={b.l} $d={b.d} $s={b.s}/>)}</Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  STATUS DEBUFF — puntos oscuros cayendo sobre el objetivo
//  Original: pequeños tiles oscuros/violeta que llueven sobre el rival
// ══════════════════════════════════════════════════════════════════════════════
const kfDebuff = keyframes`
  0%   { opacity: 0; transform: translateY(-8%); }
  18%  { opacity: 1; }
  100% { opacity: 0; transform: translateY(70%); }
`;
const DPix = styled.div<{$l:number;$d:number;$s:number}>`
  position: absolute;
  left: ${p=>p.$l}%; top: 0;
  width: ${p=>p.$s}px; height: ${p=>p.$s+2}px;
  background: ${P.poi1};
  animation: ${kfDebuff} 440ms steps(2) ${p=>p.$d}ms both;
`;
const DEBS=[{l:15,d:0,s:8},{l:32,d:55,s:6},{l:50,d:18,s:9},{l:68,d:85,s:7},{l:82,d:38,s:6},{l:25,d:105,s:7},{l:58,d:70,s:8}];
const AnimStatusDebuff = () => (
  <Root>{DEBS.map((d,i)=><DPix key={i} $l={d.l} $d={d.d} $s={d.s}/>)}</Root>
);

// ══════════════════════════════════════════════════════════════════════════════
//  ROUTER
// ══════════════════════════════════════════════════════════════════════════════
function renderAnimType(type: ReturnType<typeof getMoveAnimType>): React.ReactElement | null {
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
    if (active && !prevActive.current) setRenderKey(k => k + 1);
    prevActive.current = active;
  }, [active]);

  if (!active || !moveId) return null;

  const meta     = getMoveMetadata(moveId);
  const animType = getMoveAnimType(moveId, meta?.type ?? "normal", meta?.damageClass ?? "physical");

  return (
    <React.Fragment key={renderKey}>
      {renderAnimType(animType)}
    </React.Fragment>
  );
};

export { MoveAnimation };
