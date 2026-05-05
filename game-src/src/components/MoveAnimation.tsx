import React from "react";
import styled, { css, keyframes } from "styled-components";
import { AnimGroup } from "../app/move-animations";

// ── Duración base ─────────────────────────────────────────────────────────────
const D = 600; // ms — igual que ATTACK_ANIMATION en PokemonEncounter

// ── Keyframes por grupo ───────────────────────────────────────────────────────

/** Fuego: explosión radial naranja que se expande y se desvanece */
const burstFire = keyframes`
  0%   { opacity: 0; transform: scale(0.15); background: #ff6600; }
  25%  { opacity: 0.85; transform: scale(1.05); background: #ff4400; }
  60%  { opacity: 0.65; transform: scale(0.95); background: #ff8800; }
  100% { opacity: 0; transform: scale(1.35); background: #ffcc00; }
`;

/** Agua: ola azul que barre de izquierda a derecha */
const sweepWater = keyframes`
  0%   { opacity: 0;    transform: translateX(-70%); background: #3399ff; }
  30%  { opacity: 0.8;  transform: translateX(0%);   background: #0066cc; }
  70%  { opacity: 0.75; transform: translateX(25%);  background: #55aaff; }
  100% { opacity: 0;    transform: translateX(90%);  background: #aaddff; }
`;

/** Eléctrico: destellos irregulares amarillo/blanco */
const flickerElectric = keyframes`
  0%   { opacity: 0;    background: #ffff44; }
  8%   { opacity: 0.95; background: #ffffff; }
  16%  { opacity: 0.05; background: #ffff44; }
  28%  { opacity: 1;    background: #ffee00; }
  38%  { opacity: 0.05; background: #ffffff; }
  50%  { opacity: 0.9;  background: #ffff88; }
  60%  { opacity: 0.1;  background: #ffff44; }
  75%  { opacity: 0.8;  background: #ffee00; }
  100% { opacity: 0;    background: #ffff44; }
`;

/** Planta/veneno/bicho: pulso verde que irradia hacia afuera */
const pulseGrass = keyframes`
  0%   { opacity: 0;    transform: scale(0.2); background: #44bb44; }
  35%  { opacity: 0.8;  transform: scale(1.0); background: #228822; }
  65%  { opacity: 0.65; transform: scale(0.95); background: #55cc55; }
  100% { opacity: 0;    transform: scale(1.25); background: #88ff88; }
`;

/** Hielo: expansión cristalina azul-blanca */
const crystalIce = keyframes`
  0%   { opacity: 0;    transform: scale(0.15); background: #aaeeff; }
  30%  { opacity: 0.85; transform: scale(1.0);  background: #55ccff; }
  65%  { opacity: 0.75; transform: scale(1.05); background: #ccf4ff; }
  100% { opacity: 0;    transform: scale(1.25); background: #eeffff; }
`;

/** Psíquico/fantasma/siniestro/dragón: anillos rosas que se expanden */
const ringsPsychic = keyframes`
  0%   { opacity: 0;    transform: scale(0.1);  background: #ff44aa; }
  20%  { opacity: 0.9;  transform: scale(0.75); background: #ff44aa; }
  50%  { opacity: 0.7;  transform: scale(1.0);  background: #cc2288; }
  75%  { opacity: 0.5;  transform: scale(1.1);  background: #ff88cc; }
  100% { opacity: 0;    transform: scale(1.35); background: #ffbbdd; }
`;

/**
 * Impacto físico: destello blanco-amarillo en el objetivo.
 * Con delay de 350ms para coincidir con el punto de contacto del sprite (pico del slide).
 * Duración corta de 250ms (350+250=600ms = fin de la animación de ataque).
 */
const impactPhysical = keyframes`
  0%   { opacity: 0;   transform: scale(0.2); background: #ffffff; }
  30%  { opacity: 1;   transform: scale(1.1); background: #ffee44; }
  65%  { opacity: 0.7; transform: scale(0.9); background: #ffffaa; }
  100% { opacity: 0;   transform: scale(1.05); background: #ffffff; }
`;

/** Estado: shimmer blanco suave diagonal (efecto aplicado, no daño) */
const shimmerStatus = keyframes`
  0%   { opacity: 0;   transform: translateX(-110%) skewX(-20deg); background: rgba(255,255,255,0.75); }
  50%  { opacity: 0.85; transform: translateX(0%)    skewX(-20deg); }
  100% { opacity: 0;   transform: translateX(110%)  skewX(-20deg); }
`;

// ── Selector de CSS por grupo ─────────────────────────────────────────────────

function getAnimCss(group: AnimGroup) {
  switch (group) {
    case "fire":
      return css`animation: ${burstFire} ${D}ms ease-out forwards;`;
    case "water":
      return css`animation: ${sweepWater} ${D}ms ease-in-out forwards;`;
    case "electric":
      return css`animation: ${flickerElectric} ${D}ms linear forwards;`;
    case "grass":
      return css`animation: ${pulseGrass} ${D}ms ease-out forwards;`;
    case "ice":
      return css`animation: ${crystalIce} ${D}ms ease-out forwards;`;
    case "psychic":
      return css`animation: ${ringsPsychic} ${D}ms ease-out forwards;`;
    case "physical-impact":
      return css`
        animation: ${impactPhysical} 250ms ease-out forwards;
        animation-delay: 350ms;
      `;
    case "status":
      return css`animation: ${shimmerStatus} ${D}ms ease-in-out forwards;`;
    default:
      return css``;
  }
}

// ── Componente ────────────────────────────────────────────────────────────────

interface OverlayProps {
  $group: AnimGroup | null;
  $active: boolean;
}

/**
 * Overlay absolutamente posicionado dentro de su contenedor (que debe tener
 * position: relative; overflow: hidden).
 * opacity: 0 por defecto — solo se anima cuando $active es true.
 */
const Overlay = styled.div<OverlayProps>`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
  opacity: 0;
  ${(props: OverlayProps) =>
    props.$active && props.$group ? getAnimCss(props.$group) : ""}
`;

interface MoveAnimationProps {
  group: AnimGroup | null;
  active: boolean;
}

const MoveAnimation: React.FC<MoveAnimationProps> = ({ group, active }) => {
  return <Overlay $group={group} $active={active} />;
};

export { MoveAnimation };
