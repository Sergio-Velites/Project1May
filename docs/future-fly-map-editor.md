# MO Vuelo — configuración desde el Map Editor

El juego SÍ consume estos campos (ver `game-src/src/app/fly-helper.ts`,
`components/FlyMenu.tsx` y `components/FlyUnlockHandler.tsx`).

## Campos en `MapType` (editables desde el Map Editor)

- `flyable: boolean` — el mapa es destino de Vuelo.
- `flySpot: { x, y }` — casilla de aterrizaje al volar aquí.
- `minimapPos: { x, y }` — punto sobre `kanto_region.png` (237×213) para el menú.
- `flyAlwaysAvailable?: boolean` — si `true`, el destino está disponible desde
  el inicio (sin pisar casillas). Por defecto `false`.
- `flyUnlockTiles?: Record<fila, col[]>` — casillas (formato `walls`) que, al
  pisarlas, DESBLOQUEAN este destino. Se colocan normalmente en la entrada.

## Regla de disponibilidad (en `FlyMenu`)

Un destino aparece en el menú de Vuelo si:
`flyable && minimapPos && flySpot` (configuración) **y** además
`flyAlwaysAvailable === true` **o** el mapa está en `unlockedFlyMaps` del save.

## Desbloqueo por pisada

`FlyUnlockHandler` (montado en `Game.tsx`) observa la posición del jugador; al
pisar una `flyUnlockTiles` del mapa actual, despacha `registerFlyUnlock(mapId)`,
que añade el mapa a `state.unlockedFlyMaps` (persistido al guardar la partida).

## Editor

- Checkbox **"Destino de Vuelo"** (`flyable`) + inputs/overlay del `flySpot`.
- Checkbox **"Siempre disponible"** (`flyAlwaysAvailable`, por defecto vacío).
- Modo de pintado **🛫 Vuelo** (`fly-unlock`): pinta/arrastra las casillas de
  desbloqueo (repinta para borrar). Mismo formato/serialización que `walls`.
- Serialización: `ts-codegen.ts`, `scripts/setup-editor.mjs`, override keys en
  `app/api/admin/map-data/route.ts`.
