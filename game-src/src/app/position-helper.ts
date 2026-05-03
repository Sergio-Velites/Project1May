import { BLOCK_PIXEL_HEIGHT, BLOCK_PIXEL_WIDTH } from "./constants";

// cqw = 1% of .gameboy container width (set via container-type: inline-size).
// Using cqw instead of vw ensures tile sizes scale proportionally when the
// Game Boy is constrained to less than the full viewport width (landscape,
// desktop), so the number of visible tiles stays constant regardless of
// the screen's aspect ratio.

export const xToPx = (x: number) => {
  return `calc((${BLOCK_PIXEL_WIDTH}cqw / 2.34) * ${x})`;
};

export const yToPx = (y: number) => {
  return `calc((${BLOCK_PIXEL_HEIGHT}cqw / 2.34) * ${y})`;
};
