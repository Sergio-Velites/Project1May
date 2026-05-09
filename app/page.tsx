// El middleware reescribe / → /game/index.html sin cambiar la URL.
// Esta página no se llega a renderizar en producción.
export default function Home() {
  return null;
}
