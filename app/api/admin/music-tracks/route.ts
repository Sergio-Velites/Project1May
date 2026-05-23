import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MUSIC_ROOTS = [
  path.join(process.cwd(), 'public', 'game', 'music', 'maps-original'),
  path.join(process.cwd(), 'game-src', 'public', 'music', 'maps-original'),
];

const LABELS: Record<string, string> = {
  'pallet-town.mp3': 'Pallet Town',
  'pokemon-lab.mp3': 'Pokemon Lab',
  'route-1.mp3': 'Route 1',
  'viridian-city.mp3': 'Viridian City',
  'pokemon-center.mp3': 'Pokemon Center',
  'viridian-forest.mp3': 'Viridian Forest',
  'pokemon-gym.mp3': 'Pokemon Gym',
  'route-3.mp3': 'Route 3',
  'mt-moon.mp3': 'Mt. Moon',
  'cerulean-city.mp3': 'Cerulean City',
  'route-24-welcome.mp3': 'Route 24',
  'vermilion-city.mp3': 'Vermilion City',
  'ss-anne.mp3': 'S.S. Anne',
  'bicycle.mp3': 'Bicycle',
  'route-11.mp3': 'Route 11',
  'lavender-town.mp3': 'Lavender Town',
  'celadon-city.mp3': 'Celadon City',
  'rocket-game-corner.mp3': 'Rocket Game Corner',
  'rocket-hideout.mp3': 'Rocket Hideout',
  'silph-co.mp3': 'Silph Co.',
  'pokemon-tower.mp3': 'Pokemon Tower',
  'poke-flute.mp3': 'Poke Flute',
  'safari-zone.mp3': 'Safari Zone',
  'surf.mp3': 'Surf',
  'cinnabar-island.mp3': 'Cinnabar Island',
  'pokemon-mansion.mp3': 'Pokemon Mansion',
  'victory-road.mp3': 'Victory Road',
  'indigo-plateau.mp3': 'Indigo Plateau / Route 23',
  'hall-of-fame.mp3': 'Hall of Fame',
};

function labelFromFilename(filename: string): string {
  return LABELS[filename] ?? filename
    .replace(/\.mp3$/i, '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function GET() {
  const dir = MUSIC_ROOTS.find((candidate) => fs.existsSync(candidate));
  if (!dir) return NextResponse.json([]);

  const tracks = fs
    .readdirSync(dir)
    .filter((filename) => filename.toLowerCase().endsWith('.mp3'))
    .sort((a, b) => labelFromFilename(a).localeCompare(labelFromFilename(b)))
    .map((filename) => {
      const pathValue = `/game/music/maps-original/${filename}`;
      return {
        filename,
        label: labelFromFilename(filename),
        path: pathValue,
        expression: JSON.stringify(pathValue),
      };
    });

  return NextResponse.json(tracks);
}
