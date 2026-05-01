import { redirect } from 'next/navigation';

// El juego está en /public/game/ - servido como estático en /game/index.html
export default function Home() {
  redirect('/game/index.html');
}
