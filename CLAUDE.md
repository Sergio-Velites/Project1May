# WeddingBoy — Guía técnica completa para agentes y desarrolladores

## Tabla de contenidos

1. [Objetivo del proyecto](#objetivo-del-proyecto)
2. [Stack técnico](#stack-técnico)
3. [Arquitectura en dos capas](#arquitectura-en-dos-capas)
4. [Flujo de trabajo OBLIGATORIO para el juego](#flujo-de-trabajo-obligatorio-para-el-juego)
5. [Estado del juego (Redux)](#estado-del-juego-redux)
6. [Sistema de mapas](#sistema-de-mapas)
7. [Sistema de NPCs y trainers](#sistema-de-npcs-y-trainers)
8. [Sistema de quests](#sistema-de-quests)
9. [Mecánicas de combate (Gen I+II)](#mecánicas-de-combate-gen-iii)
10. [Sistema de SFX de movimientos](#sistema-de-sfx-de-movimientos)
11. [Sistema de gritos Pokémon](#sistema-de-gritos-pokémon)
12. [Sistema de guardado (Supabase + WebAuthn)](#sistema-de-guardado-supabase--webauthn)
13. [Batallas online entre invitados](#batallas-online-entre-invitados)
14. [Panel de administración](#panel-de-administración)
15. [Map Editor](#map-editor)
16. [Estado actual de la narrativa](#estado-actual-de-la-narrativa)
17. [Archivos clave](#archivos-clave)
18. [Problemas conocidos y soluciones definitivas](#problemas-conocidos-y-soluciones-definitivas)
19. [Acceso a infraestructura (Supabase · Vercel · GitHub)](#acceso-a-infraestructura-supabase--vercel--github)
20. [Variables de entorno](#variables-de-entorno)

---

## Objetivo del proyecto

Invitación de boda interactiva con estética Game Boy (Pokémon Rojo/Azul). El motor base es [chase-manning/pokemon-js](https://github.com/chase-manning/pokemon-js) (MIT), extendido con:
- Pokédex Gen I+II (251 Pokémon) con evoluciones correctas, growth rates y stats
- Mecánicas de combate Gen I+II completas (stat stages, críticos, captura, drain, recoil, Protect, Pain Split, Swagger, etc.)
- Narrativa de boda en 5 actos con NPCs, diálogos y quests personalizados
- Guardado en nube via Supabase + WebAuthn passkey (Face ID / huella)
- Batallas en tiempo real entre invitados
- Panel de administración para los organizadores
- Sistema de medallas únicas por invitado
- Map Editor integrado en `/admin/map-editor`

**Repositorio**: `Sergio-Velites/Project1May` · **Rama activa de desarrollo**: `integrate-gb-maps` (jul 2026) · **Producción**: `master` → Vercel (proyecto git-connected: cada push a `master` redespliega el shell Next automáticamente; el juego jugable solo cambia tras recompilar el bundle — botón 🛠 del editor o build manual)

---

## Stack técnico

| Capa | Tecnología | Notas |
|---|---|---|
| Shell | Next.js 16 (App Router) + TypeScript | Routing, admin, RSVP, API routes |
| Juego | React 18 + TypeScript + Redux Toolkit + styled-components | CRA build (`react-scripts`) |
| Motor base | chase-manning/pokemon-js (MIT) | Extendido con mecánicas Gen I+II |
| Build | CRA (`react-scripts build`) | **NO usar npx** — ver sección de flujo |
| Despliegue | Vercel | Branch `master` → producción |
| DB / Auth | Supabase (PostgreSQL + Edge Functions Deno) | Partidas + WebAuthn passkey |
| Admin auth | Middleware Next.js + cookie | `ADMIN_PASSWORD` env var |

---

## Arquitectura en dos capas

```
/app/              → Next.js 16 shell (routing, admin, RSVP, API)
/public/game/      → Build estático del juego (NO editar directamente)
/game-src/src/     → FUENTE del juego (editar aquí)
/public/editor/    → Assets del map editor (sprites, música, JSON)
```

El `tsconfig.json` raíz **excluye `game-src/`** → Next.js no intenta compilarlo.

El juego es un SPA React (CRA) que vive en `public/game/`. Next.js solo lo sirve como archivos estáticos y redirige `/` → `/game/index.html`.

---

## Flujo de trabajo OBLIGATORIO para el juego

### ⚠️ Regla 1: SIEMPRE subshell para compilar

`run_in_terminal` colapsa `cd X && comando` sin cambiar el directorio. **SIEMPRE**:

```bash
(cd /Users/appsvelites/Projects/Project1May/game-src && comando)
```

### ⚠️ Regla 2: NUNCA npx react-scripts

```bash
# ✅ CORRECTO
node_modules/.bin/react-scripts build

# ❌ INCORRECTO — puede fallar con "Cannot find module 'typescript'"
npx react-scripts build
```

### ⚠️ Regla 3: NUNCA commits directos a master (con matiz)

Toda modificación **de código** va a la rama de desarrollo activa (`integrate-gb-maps`).
El merge a `master` lo decide el usuario. Excepción operativa: el map-editor SÍ
commitea `.ts` de mapas y el bundle directamente a `master` por diseño (es su
flujo, ver sección Map Editor). Si el usuario pide explícitamente ver un cambio
en producción, llevar los commits a `master` es lo correcto (fast-forward cuando
la rama solo va por delante) — pero confirmar/avisar, nunca por defecto.

### Flujo completo

```bash
# 1. Editar archivos en game-src/src/

# 2. Compilar
(cd /Users/appsvelites/Projects/Project1May/game-src && \
  PUBLIC_URL=/game DISABLE_ESLINT_PLUGIN=true GENERATE_SOURCEMAP=false \
  node_modules/.bin/react-scripts build) 2>&1 | tail -20

# 3. Ver hash nuevo
ls game-src/build/static/js/main.*.js

# 4. Copiar build y eliminar bundle anterior (sustituir OLDHASH)
cp -r game-src/build/* public/game/
rm -f public/game/static/js/main.OLDHASH.js \
      public/game/static/js/main.OLDHASH.js.LICENSE.txt

# 5. Commit y push (a la rama activa; el merge a master lo decide el usuario)
git add public/game/ game-src/src/
git commit -m "feat: descripción"
git push origin integrate-gb-maps
```

### Cambios solo en Next.js (admin, RSVP, **map-editor**)

Los cambios en `app/` y `supabase/` **NO requieren compilar el juego** (el editor,
el admin y las API routes son parte del shell Next, no del bundle CRA):

```bash
git add app/ supabase/
git commit -m "feat: descripción"
git push origin integrate-gb-maps
```

### ⚠️ Cómo se ve un cambio del editor EN PRODUCCIÓN (regla clave)

Producción (`game.bodasym26.es`) corre **`master`**. Un cambio de `app/`
(p. ej. una función nueva del map-editor) NO aparece en el editor desplegado
hasta que ese commit está en `master`. El proyecto de Vercel es **git-connected**:
un push a `master` dispara solo un deploy del shell Next (~1 min) y el editor
queda actualizado — **sin** recompilar el juego.

- **Solo el JUEGO jugable** (mapas, mecánicas, sprites del bundle) necesita
  además 🛠 **Compilar juego** (recompila el CRA y commitea `public/game/`).
- Síntoma típico de "no veo mi feature del editor": estás mirando producción
  (que corre `master`) pero el commit sigue en una rama de desarrollo. Solución:
  llevar los commits a `master` (fast-forward si la rama solo va por delante:
  `git push origin <rama>:master`) y esperar el deploy de Vercel.
- Verificar el deploy: MCP `claude.ai Vercel` → `list_deployments` (buscar el de
  `githubCommitRef: master` con tu SHA en estado `READY`) o
  `npx vercel inspect <deploy-id> --scope apps-7362s-projects`.

---

## Estado del juego (Redux)

### `game` slice (`state/gameSlice.ts`)

```typescript
// Estado inicial relevante
{
  pos: { x: 3, y: 6 },
  map: MapId.PalletTownHouseA2F,
  direction: Direction.Up,
  money: 400,
  inventory: [{ item: ItemType.PokeBall, amount: 2 }],
  name: "Blue",
  pokemon: [],     // Equipo (max 6)
  pc: [],          // Pokémon en el PC
  activePokemonIndex: 0,
  defeatedTrainers: [
    "pallet-town-lab-5-1",        // Oak pre-derrotado (evita combate automático)
    "pallet-town-house-a-1f-6-3", // Madre pre-derrotada (persistent → muestra outtro)
    "pallet-town-10-0",           // Team Rocket norte pre-derrotado
    "pallet-town-11-0",           // Team Rocket norte pre-derrotado
  ],
  collectedItems: [],
  completedQuests: [],
  seenPokemon: [],
  caughtPokemon: [],
  npcFacings: {},          // Record<"mapId-x-y", Direction> — se limpia al cambiar mapa
  lastHealLocation: undefined,  // { map: MapId, pos: PosType } — último centro visitado
  visitedMaps: [PalletTownHouseA2F, PalletTownHouseA1F, PalletTown, PalletTownLab],
  rsvp: undefined,
}
```

Campos clave adicionales:
- `trainerEncounter` / `pokemonEncounter`: estado del combate activo
- `onBicycle` / `onSurfing`: modos de movimiento
- `visitedMaps`: mapas desbloqueados para MO Vuelo

### Comportamiento de `loadFromState`

```typescript
// Restaura todo el estado de un save, incluyendo:
// - lastHealLocation (para volver al último centro tras KO)
// - pokemon.length <= 6 (sanitiza saves corruptos)
// - activePokemonIndex sanitizado (primer vivo si el índice es inválido)
// - visitedMaps inferidos desde defeatedTrainers si el save es antiguo
dispatch(loadFromState(savedGameState));
```

### `takeMoney` — guardia de saldo negativo

```typescript
// El dinero nunca puede ser negativo
takeMoney: (state, action) => {
  state.money = Math.max(0, state.money - action.payload);
}
```

### `ui` slice (`state/uiSlice.ts`)

```typescript
{
  text: string[] | null,
  textThenAction: ...,    // Texto + callback al cerrarlo
  startMenu / itemsMenu / playerMenu / titleMenu / loadMenu / gameboyMenu,
  pokemonCenterMenu / pcMenu / pokeMartMenu / pokedexOpen,
  learningMove / blackScreen / confirmationMenu / evolution,
  pokeballCardId: number | null,
  academyPokeballOpen: boolean,
  onlineBattleMenu: boolean,
}
```

### Patrón: mostrar texto y luego ejecutar acción

```typescript
// ✅ CORRECTO — espera a que el usuario cierre el texto
dispatch(showTextThenAction({ text: ["Línea 1", "Línea 2"], action: () => doSomething() }));

// ❌ INCORRECTO — el usuario puede cerrar el texto antes del timeout
dispatch(showText(["Línea 1"]));
setTimeout(() => doSomething(), 3000);
```

---

## Sistema de mapas

### Interfaz `MapType` (campos clave)

```typescript
{
  id: MapId,
  name: string,
  image: string,       // Path al asset PNG del mapa
  height: number, width: number,
  start: PosType,
  walls: PosType[], fences: PosType[], grass: PosType[],
  text: Record<fila, Record<col, string[]>>,
  maps: { ... }[],     // Conexiones con otros mapas
  teleports: { ... }[],
  exits: { ... }[], exitReturnMap, exitReturnPos,
  music: string,       // Fichero .mp3 en /game/music/maps-original/ o expresión JS
  encounters: { id, minLevel, maxLevel, rarity }[],
  trainers: TrainerType[],
  items: MapItemType[],
  recoverLocation: PosType,
  pokemonCenter / pc / store / storeItems,
  onlineBattleNpc?: PosType,
}
```

### 163 mapas registrados (enum MapId + map-data.ts)

**Kanto — exterior**
```
pallet-town · route-1 · viridian-city · route-22 · route-2 · viridian-forrest
pewter-city · route-3 · route-4 · cerulean-city · route-24 · route-25
route-5 · route-6 · vermilion-city · route-11 · route-9 · route-10
lavender-town · route-8 · route-7 · celadon-city · route-12 · route-13
route-14 · route-15 · route-16 · route-17 · route-18 · fuchsia-city
route-19 · route-20 · route-21 · cinnabar-island · route-23 · indigo-plateau
```

**Kanto — edificios y casas**
```
pallet-town-lab · pallet-town-house-a-1f · pallet-town-house-a-2f · pallet-town-house-b
gate-house · route-2-gate · route-2-gate-north · route-4-gate · route-12-gate
route-15-gate · route-16-gate · league-route · underground-path-ns · underground-path-ew
viridian-city-gym · viridian-city-pokemon-center · viridian-city-poke-mart
  viridian-city-pokemon-acadamy · viridian-city-npc-house
pewter-city-gym · pewter-city-pokemon-center · pewter-city-poke-mart
  pewter-city-npc-a · pewter-city-npc-b · pewter-museum-1f · pewter-museum-2f
route-3-pokemon-center
cerulean-city-gym · cerulean-city-pokemon-center · cerulean-city-poke-mart
  cerulean-city-bike-shop · cerulean-city-house-a · cerulean-city-house-b
vermilion-city-gym · vermilion-city-pokemon-center · vermilion-city-poke-mart
  vermilion-city-fan-club · vermilion-city-house-a · vermilion-city-house-b
lavender-town-pokemon-center · lavender-town-poke-mart
  lavender-town-house-a · lavender-town-house-b
celadon-city-gym · celadon-city-pokemon-center · celadon-city-poke-mart
  celadon-city-dept-store-1f…6f · celadon-city-game-corner · celadon-city-prize-room
  celadon-city-house-a · celadon-city-house-b
fuchsia-city-gym · fuchsia-city-pokemon-center · fuchsia-city-poke-mart
  fuchsia-city-warden-house · fuchsia-city-house-a · fuchsia-city-house-b
saffron-city-gym · saffron-city-pokemon-center · saffron-city-poke-mart
  saffron-city-fighting-dojo · saffron-city-copycat-house
  saffron-city-house-a · saffron-city-house-b
cinnabar-island-gym · cinnabar-island-pokemon-center · cinnabar-island-poke-mart
  cinnabar-island-lab
indigo-plateau-pokemon-center (no stub — usar pokemonCenter field)
elite-four-1…4 · champion-room
```

**Dungeons / rutas interiores**
```
mt-moon-1f · mt-moon-2f · mt-moon-3f
rock-tunnel-1f · rock-tunnel-2f
pokemon-tower-1f…7f
silph-co-1f…11f
pokemon-mansion-1f…3f · pokemon-mansion-b1f (stub: pokemon-mansion-4f)
diglets-cave (stub del juego) / digletts-cave.png
cerulean-cave-1f · cerulean-cave-2f · cerulean-cave-3f
safari-zone-center · safari-zone-area-1 · safari-zone-area-2 · safari-zone-area-3
power-plant
seafoam-islands-1f…4f
victory-road-1f · victory-road-2f · victory-road-3f
ss-anne-1f · ss-anne-2f · ss-anne-3f · ss-anne-bf1
```

### MO Fuerza (HM04 / "strength") y rocas empujables

- **Movimiento**: `strength` ya existe en `move-metadata.ts` (Normal, físico) y funciona en combate como cualquier move de daño. `ItemType.Hm04` lo enseña (`learnMove("strength")`).
- **Rocas empujables**: `MapType.boulders?: BoulderType[]` (`{ pos, id }`). Bloquean el paso como un muro hasta activar Fuerza.
- **Activación (fiel a Gen I)**: pulsar A frente a una roca con un Pokémon del equipo que conozca `strength` → "¡X usó FUERZA!" y se activa la Fuerza en ese mapa (`strengthActive`). Sin Pokémon que la sepa → solo mensaje informativo.
- **Empuje**: con Fuerza activa, caminar contra la roca la empuja 1 tile si el destino está libre (reducers `moveUp/Down/Left/Right` vía `tryBoulderInteraction`).
- **Estado de sesión (no persiste)**: `boulderPositions` y `strengthActive` viven en `gameSlice` y se reinician al cambiar de mapa o al cargar partida → las rocas vuelven a su sitio (igual que el original).
- **Colisión**: `canWalk`/`moveDown` bloquean los tiles ocupados por rocas (`isBoulder`/`boulderIdAt` en `map-helper.ts`).
- **Render**: `components/Boulder.tsx` (dentro de `BackgroundContainer`), sprite SVG inline pixel-art.
- **Editor**: modo `boulders` en `/admin/map-editor` (botón 🪨). Click para añadir/quitar; export TS `boulders: [...]` para pegar en el `.ts` del mapa. Override key `boulders` en `app/api/admin/map-data/route.ts`.

### Árboles de bayas (Gen II)

- **Mapa**: `MapType.berryTrees?: BerryTreeType[]` (`{ pos, item }` — `item` es
  la baya, p. ej. `ItemType.Berry`). Bloquean SIEMPRE el paso (el árbol no
  desaparece; solo se recoge la baya).
- **Recogida**: pulsar A de frente → "¡Hay una BAYA en el árbol!" → se añade a
  la mochila. UNA baya por árbol y día; rebrota a medianoche (hora local del
  dispositivo, como el reloj de Oro/Plata).
- **Persistencia**: `GameState.berryTreesPicked` (`Record<"mapId-x-y", fecha>`)
  — persiste en el save; `loadFromState` lo restaura con default `{}`.
- **Render**: `components/BerryTree.tsx` (dentro de `BackgroundContainer`),
  SVG pixel-art; las bayas rojas solo se dibujan si quedan por recoger.
- **Editor**: modo `berry-trees` (botón 🍒). Click vacío añade árbol (prompt
  con la baya: Berry, GoldBerry, PrzCureBerry, PsnCureBerry, MintBerry,
  IceBerry, BurntBerry, BitterBerry, MiracleBerry, MysteryBerry); click en
  árbol lo elimina. Export TS `berryTrees: [...]`; override key `berryTrees`
  en `app/api/admin/map-data/route.ts`.
- **Distribución de referencia (Cristal, Kanto)**: Ruta 1 Baya Amarga ·
  Ruta 2 Baya Antitóx · Ruta 8 Baya Antipar · Ruta 11 Baya · Pewter ×2 (Baya
  Hielo + Baya Menta) · Fuchsia Baya Tostada. Colocarlos visualmente con el
  editor (las posiciones no están hardcodeadas).

### Planos de altura (elevations) y rampas

- **Datos**: `MapType.elevations?: Record<fila, Record<col, nivel>>` (sparse,
  tile ausente = nivel 0) y `MapType.ramps?: Record<fila, [cols]>` (formato
  walls). Serializados/parseados en ts-codegen, setup-editor.mjs y parse-ts.ts.
- **Regla de movimiento** (`canWalk` con param opcional `from` + helpers
  `getElevation`/`isRamp`/`canChangeElevation` en `map-helper.ts`): solo se
  camina entre tiles del MISMO nivel; una rampa (en origen o destino) conecta
  cualquier par de niveles. El **salto de saliente NO se bloquea** (un ledge es
  transición legítima de plano, como en Gen I). La roca de Fuerza no cruza
  bordes de elevación ni se puede alcanzar desde otro plano (salvo rampa).
- **Sin estado nuevo**: el "plano actual" del jugador es la elevación del tile
  que pisa. Teleports, KO→centro y cambios de mapa quedan al nivel del tile de
  llegada automáticamente; no hay nada que resetear ni migrar en los saves.
- **Editor**: modo `⛰ Alturas` — brocha de nivel 1/2/3 + 🪜 rampa, pintado con
  arrastre (repintar con la misma brocha borra; nivel 0 = no pintado), overlay
  con tinte/número por nivel (tenue fuera del modo). Integrado en desplazar
  todo, selección rectangular y guardado (override keys `elevations`/`ramps`).
- **Cómo montar la escena de la imagen de ejemplo**: pintar la meseta marrón
  como nivel 1, dejar el suelo verde a nivel 0, y pintar los tiles de las
  escaleras del PNG como 🪜 rampa.

### Salientes (ledges) direccionales

- **Colisión**: `MapType.fences?: Record<number, number[]>` (`{fila:[cols]}`) sigue
  siendo la fuente única de colisión — un saliente bloquea el paso como un muro
  desde todos los flancos salvo el de salto. `isFence` (en `map-helper.ts`) no
  cambia y lo usan colisión, visión de entrenadores, Knockback y MO Corte/etc.
- **Dirección de salto**: `MapType.fenceDirections?: Record<number, Record<number, Direction>>`
  (mismo formato `{fila:{col:Direction}}` que `spinners`). Indica hacia dónde se
  PUEDE saltar el saliente. **Compatibilidad total**: si un tile de `fences` no
  aparece en `fenceDirections`, su dirección por defecto es `Direction.Down` →
  todos los salientes anteriores a este sistema saltan hacia abajo (como antes,
  sin migrar ningún mapa).
- **Helper**: `getFenceDirection(map, x, y)` devuelve la `Direction` del saliente
  (default `Down`) o `null` si ahí no hay saliente.
- **Movimiento (`gameSlice.ts`)**: cada reducer `moveUp/Down/Left/Right` salta el
  saliente (un brinco de 1 tile, `state.jumping = true`) SOLO si la dirección del
  saliente coincide con la del movimiento; desde cualquier otro flanco actúa como
  muro (`canWalk`/`isFence`).
- **Editor**: en el modo `fences` (botón 🚧) hay un selector de dirección
  (▲▼◀▶). Pintar/arrastrar coloca los tiles con la dirección activa; el overlay
  dibuja la flecha de cada tile. Borrar un tile (repintarlo) también quita su
  dirección. Serialización `fenceDirections` en `ts-codegen.ts` (reusa el patrón
  de `spinners`), parser en `parse-ts.ts` + `setup-editor.mjs`, override key en
  `app/api/admin/map-data/route.ts`.

### MO Vuelo (Fly) — destinos y desbloqueo por casillas

- **Config del destino** (`MapType`, editable en el editor): `flyable`,
  `flySpot` (aterrizaje) y `minimapPos` (punto en `kanto_region.png`).
- **Disponibilidad** (nuevo, sustituye a `visitedMaps` para Vuelo):
  - `flyAlwaysAvailable?: boolean` (default false) → disponible desde el inicio.
  - `flyUnlockTiles?: Record<fila, col[]>` (formato `walls`) → al pisar cualquiera
    de esas casillas se añade el mapa a `GameState.unlockedFlyMaps` (reducer
    `registerFlyUnlock`, disparado por `FlyUnlockHandler` montado en `Game.tsx`);
    se persiste al guardar. `loadFromState` lo restaura (default `[]`).
- **Menú** (`FlyMenu`): muestra un destino si `flyable && minimapPos && flySpot`
  **y** (`flyAlwaysAvailable` **o** `unlockedFlyMaps.includes(mapId)`).
- **Editor**: checkbox "Destino de Vuelo" (`flyable`) + "Siempre disponible"
  (`flyAlwaysAvailable`) + modo de pintado **🛫 Vuelo** (`fly-unlock`) para las
  `flyUnlockTiles`. Serialización en `ts-codegen.ts`, `setup-editor.mjs` y
  override keys `flyAlwaysAvailable`/`flyUnlockTiles` en la API route. Ver
  `docs/future-fly-map-editor.md`.

### Cómo añadir un mapa nuevo

1. Añadir valor al enum `MapId` en `maps/map-types.ts`
2. Crear archivo (copiar `maps/template.ts` como base)
3. Importar y registrar en `maps/map-data.ts`

---

## Sistema de NPCs y trainers

### Interfaz `TrainerType`

```typescript
{
  npc: NpcType,
  pokemon: [{ id: number, level: number }][],
  facing: Direction,
  pos: { x: number, y: number },
  intro: string[],    // VACÍO [] = sin combate (solo diálogo al pulsar A)
  outtro: string[],
  money: number,
  persistent?: boolean,
  hideCondition?: "has-pokemon",
  isOnline?: boolean,
  postGame?: { message: string[], items?: ItemType[] },
}
```

### ID de un trainer

`"mapId-x-y"` (ej. `"pallet-town-10-0"`) → va en `defeatedTrainers`.

### Visibilidad tras derrota

- `Game.tsx` **NO filtra** trainers por `defeatedTrainers`.
- Solo `hideCondition: "has-pokemon"` oculta a un NPC.
- Los trainers derrotados permanecen en su tile y muestran `outtro` al pulsar A.

### 40+ tipos de NPC disponibles

```
ash, oak, rival, beauty, birdKeeper, blackBelt, bugCatcher, burglar, channeler,
aceTrainerMale, aceTrainerFemale, cueBall, engineer, fisher, gambler, gentleman,
hiker, jrTrainerMale, jrTrainerFemale, juggler, lass, pokeManiac, psychic, rocker,
teamRocketGrunt, sailor, scientist, superNerd, swimmer, tamer, youngster, biker,
brock, misty, ltSurge, erica, koga, sabrina, blaine, giovanni
```

---

## Sistema de quests

Archivo: `game-src/src/app/use-quests.ts`

```typescript
{
  trigger: "walk" | "talk",
  map: MapId,
  positions: { y: [x1, x2] },
  active: () => !completedQuests.includes("quest-id"),
  text: string[],
  action: () => { dispatch(...); },
}
```

### 5 quests activas

1. **`madre-bronca-done`** — `house-a-1f` (walk, y:3): bronca al bajar las escaleras
2. **Bloqueo norte** — `pallet-town` (walk, y:0): devuelve a y:3 si `pokemon.length === 0`
3. **Guía al gimnasio** — `pewter-city` (walk): muestra flecha si `badges.length === 0`
4. **Museo** — `pewter-city-museum-1f` (walk): cobra 50₽ si no ha pagado
5. **`vino-tinto-dado`** — `viridian-city` (walk): da SodaPop una sola vez

---

## Mecánicas de combate (Gen I+II)

Archivos principales: `game-src/src/app/move-helper.ts`, `game-src/src/components/PokemonEncounter.tsx`

### Implementadas (Gen I)

- **Stat stages** (−6/+6): ataque, defensa, velocidad, especial, accuracy, evasion
- **Críticos**: 10% base (×2 daño), high-crit ×8 (Slash, Razor Leaf, etc.)
- **Drain** (Absorb, Mega Drain, Dream Eater): recupera ½ del daño infligido
- **Recoil** (Take Down, Double-Edge, Submission)
- **Flinch**: 10%/30%
- **Counter**: devuelve ×2 el último daño físico
- **Metronome**: movimiento aleatorio del pool Gen I
- **Leech Seed**: drena HP cada turno
- **Super Fang**: reduce HP al 50%
- **Captura Gen I**: fórmula con 4 sacudidas — `app/pokeball-helper.ts`
- **4 growth rates**: Fast, Medium-Fast, Medium-Slow, Slow — `app/level-helper.ts`
- **XP entrenadores**: ×1.5 del XP base — `app/xp-helper.ts`
- **Evolución**: `Evolution.tsx` llama `getLearnedMove()` post-evolución

### Implementadas (Gen II)

- **Protect / Detect**: bloquea TODOS los moves dirigidos al defensor (daño, estado, stats)
- **Swagger**: +2 ataque al rival + confusión ("se agobió y quedó confundido")
- **Rapid Spin**: daño + limpia trampas del usuario
- **Pain Split**: promedia HP. Caps corregidos (usa `ourStats.hp`/`theirStats.hp` directamente)
- **Mirror Coat**: devuelve 2× el último daño especial recibido
- **Snore**: solo funciona si el usuario está dormido
- **Tri Attack**: 20% de probabilidad de parálisis/quemadura/congelación aleatoria
- **Stat changes Gen II**: Charm (−2 atk), Scary Face (−2 spe), Metal Sound (−2 sp.def), Howl (+1 atk), etc.
- **Status apply Gen II**: Yawn, Spark, Zap Cannon, Flame Wheel, Sacred Fire, Powder Snow, Lava Plume, etc.
- **Heal moves Gen II**: Moonlight, Morning Sun, Synthesis (recuperan ½ HP)
- **Secondary effects Gen II**: Crunch (−1 sp.def), Iron Tail (−1 def), Ancient Power (+all stats 10%), etc.
- **Variable power**: Flail/Reversal (200→20 según HP%), Present (40/80/120 o cura)
- **Whirlpool**: trampa de 2-5 turnos (añadido a TRAP_MOVES)
- **Clima (5 turnos)**: Rain Dance / Sunny Day / Sandstorm (`weatherRef` en
  PokemonEncounter + `context.weather` en move-helper). Agua/Fuego ×1.5/×0.5,
  Trueno no falla con lluvia (50% acc con sol), Rayo Solar sin carga con sol y
  ½ potencia con lluvia/arena, chip 1/8 de arena (inmunes Roca/Tierra/Acero).
  Moonlight/Morning Sun/Synthesis: ¼ base, ×2 en su franja horaria, ½ con sol,
  ⅛ con otro clima (`timeWeatherHealFraction`).
- **Género (Gen II)**: `PokemonInstance.gender` sorteado por ratio oficial
  (`gen2-species-data.ts` + `gender-helper.ts`), migración perezosa en
  `loadFromState`. Símbolo ♂/♀ en combate, party y pantalla de datos.
- **Atracción**: solo géneros opuestos; 50% de no actuar (checkSkipTurn).
- **Más moves Gen II**: Encore (repite último move 2-6 turnos, fuerza la
  selección de ambos bandos), Nightmare (¼/turno dormido), Perish Song
  (cuenta de 3; si ambos llegan a 0 a la vez cae primero el rival — el motor
  no soporta KO mutuo), Spikes (⅛ al entrar, clamp a 1 PS), Mean Look/Spider
  Web, Lock-On/Mind Reader (siguiente ataque no falla), Psych Up, Endure
  (sobrevive con 1 PS), Safeguard (5 turnos sin estados/confusión), Belly
  Drum (½ PS → atk +6), Conversion2, Future Sight (golpea a los 2 turnos,
  sin tipo), Magnitude (tabla 4-10), Rollout/Fury Cutter (rampa ×2, cap ×16).
- **Estados Gen II**: sueño 1-6 turnos; Tóxico → veneno normal al cambiar de
  Pokémon; descongelación 20% por turno (decisión de diseño, Gen II usa 10%).
- **Objetos equipados** (`held-item-helper.ts`, valores de pret/pokecrystal):
  `PokemonInstance.heldItem`. Dar desde la mochila (ItemsMenu → "Dar"),
  Quitar desde el menú Pokémon ("Quitar obj."), visible en PokemonSummary.
  En combate (solo el equipo del jugador; los rivales no llevan objetos):
  potenciadores de tipo ×1.1 (17 items), Restos 1/16/turno, Cinta Focus
  30/256, Garra Rápida 60/256, Roca del Rey 30/256, Polvo Brillo −20/256 acc,
  Periscopio +1 crit (Puño Suerte/Palo +2 para Chansey/Farfetch'd), Bola
  Luminosa/Hueso Grueso ×2, Polvo Metálico ×1.5 (Ditto), bayas autoconsumibles
  al final del turno (PS ≤ ½ → Baya/Baya Dorada; estados → su baya; confusión
  → Baya Amarga/Milagro), Moneda Amuleto ×2 dinero, Huevo Suerte ×1.5 XP,
  Piedra Eterna bloquea evolución (gate en `resolveEvolution`).
- **Balls de Kurt** (`pokeball-helper.ts`, corregidas sin los bugs GSC):
  Veloz (×4 si velocidad base ≥100), Nivel (×8/×4/×2), Amor (×8 misma especie
  + género opuesto), Cebo (×3 pescando — `PokemonEncounterType.fromFishing`),
  Luna (×4 evolución por Piedra Lunar), Peso (±20/+30/+40 por peso), Amigo
  (amistad 200 al capturar — `lastBallUsedRef`).
- **Objetos de evolución Gen II**: Piedra Solar, Rev. Metálico (Steelix,
  Scizor), Escama Dragón (Kingdra), Mejora (Porygon2), Roca del Rey
  (Politoed, Slowking) y Cable Unión (sustituye al intercambio Gen I:
  Alakazam, Machamp, Golem, Gengar). Patrón `evolutionItem` en use-item-data.
- **Día/noche (`time-helper.ts`)**: franjas mañana 4-10h / día 10-18h /
  noche 18-4h. Los encuentros (hierba, surf y pesca) filtran por
  `timesOfDay` en cada entrada (vacío = 24 h). El editor tiene toggles por
  franja en la tabla de encuentros.

### Moves sin mecánica (caen a "sin efecto" limpiamente)

`NO_EFFECT_MOVES` incluye solo: `splash, destiny-bond, foresight`.
**Destiny Bond queda fuera a propósito**: su KO mutuo simultáneo no es
representable en el enrutamiento de stages del motor (riesgo de combate
colgado). No implementar sin rediseñar el flujo de KO.

### Nivel máximo 200 (`MAX_LEVEL`)

- El tope de nivel se elevó de 100 a **200**. Fuente única: `MAX_LEVEL` en
  `game-src/src/app/level-helper.ts` (usado por `getSingleLevelUp` y
  `xpForNextLevel`) y por el Rare Candy en `use-item-data.ts`.
- **Stats**: `getPokemonStats` es lineal en el nivel y NO tiene tope → los stats
  siguen creciendo con la MISMA rampa por encima de 100 (exactamente como si la
  curva continuara). Sin IVs/EVs, sin overflow.
- **Movimientos**: NO se aprenden nuevos por encima de 100 (ningún Pokémon los
  tiene en su tabla `moves`); `getLearnedMove` devuelve `null` de forma natural.
- **XP**: la curva Gen I (`totalXpForLevel`) se extiende sin cambios (Lv200 slow
  ≈ 10M XP). Subir 100→200 es ~8× más grindeo — decisión de diseño aceptada.
- **Espejo del cap fuera del juego** (constantes locales `MAX_LEVEL = 200`,
  sincronizar si cambia): admin `PlayerEditModal.tsx` (editor de equipo) y
  map-editor (`page.tsx`: inputs de nivel de encuentros/regalos/estáticos/
  entrenadores + `AfLevelRange`; `pokemon-pool.ts`: clamps de auto-relleno).

### Pokédex Gen I+II

`pokemon-metadata.ts` contiene los 251 Pokémon con stats, evoluciones y growth rates correctos.

Evoluciones multi-target:
```typescript
// Eevee → [Espeon(196), Umbreon(197)] aleatorio al nivel 25
evolution: { pokemon: [196, 197], level: 25 }

// Tyrogue → [Hitmonlee(106), Hitmonchan(107), Hitmontop(237)] aleatorio al nivel 20
evolution: { pokemon: [106, 107, 237], level: 20 }
```

### Tabla de tipos Gen II

17 tipos incluyendo Steel y Dark. Ghost ahora es ×2 contra Psychic (bug Gen I corregido).

### `MoveContext` — contexto del turno pasado al procesador

```typescript
interface MoveContext {
  attackerStatus?: StatusType;
  lastPhysicalDamageTaken?: number;   // Para Counter
  lastSpecialDamageTaken?: number;    // Para Mirror Coat
  defenderIsProtected?: boolean;      // Para Protect/Detect
  // ... leechSeed, trap, substitute, etc.
}
```

### Flujo de procesado en `PokemonEncounter.tsx`

| Stage | Evento |
|---|---|
| 0 | Inicio encuentro (wild o trainer) |
| 1 | Wild: cry del enemigo (t=2000ms) |
| 3 | Animación ChangePokemon |
| 4-9 | Throw pokeball animación |
| 10 | Player pokémon cry |
| 11 | Battle menu (Luchar / Mochila / Pokémon / Huir) |
| 13/25 | Lista de Pokémon (switch voluntario / forzado post-KO) |
| 17 | Resultado ataque del jugador (mensaje, luego turno rival) |
| 19 | Resultado ataque del rival (mensaje, luego siguiente turno) |
| 27 | `endEncounter_(true)` t=1000ms → `recoverFromFainting()` t=1500ms |
| 34-38 | Throw pokeball at enemy (captura) |
| 48 | Primer trainer pokémon: cry |
| 49 | Trainer pokémon siguiente: cry |
| 52+ | Fin combate |

### `lastHealLocation` — recuperación tras KO

`healPokemon` guarda `lastHealLocation` resolviendo `exitReturnPos` del centro Pokémon.
`recoverFromFainting` usa `lastHealLocation` si existe; si no, recurre a `recoverLocation` del mapa.
`loadFromState` ahora restaura `lastHealLocation` correctamente.

---

## Sistema de SFX de movimientos

Archivo: `game-src/src/app/move-sfx-map.ts`

### Arquitectura (refactorizado para Gen II)

```typescript
// 1. Si existe SFX exacto para el move → usar
// 2. Si no → fallback por tipo (distinto para damage y status)
// 3. Si tipo desconocido → fallback por clase (physical/special/status)
// 4. Último recurso → "Tackle"

export function getMoveSfxPath(moveId: string): string  // API pública
export function getMoveSfxInfo(moveId: string): MoveSfxInfo  // Info completa (exact, reason)
```

- `AVAILABLE_SFX`: Set con todos los filenames del pack Gen I (ej. `"ThunderShock"`)
- `OVERRIDES`: Map de slug → filename para excepciones (ej. `"bubble-beam"` → `"Bubblebeam"`)
- `TYPE_DAMAGE_FALLBACK`: SFX por tipo para moves de daño
- `TYPE_STATUS_FALLBACK`: SFX por tipo para moves de estado

Los moves Gen II sin SFX propio (p.ej. Crunch, Iron Tail, Sacred Fire) reciben automáticamente un SFX temáticamente apropiado — nunca silencio ni 404.

---

## Sistema de gritos Pokémon

Archivo: `game-src/src/app/pokemon-cry.ts`

### Solución: singleton con referencia de módulo (evita GC)

```typescript
let lastAudio: HTMLAudioElement | null = null;  // CRÍTICO: previene GC
let lockUntil = 0;

export const playCry = (id: number): void => {
  const a = new Audio("/game/sfx/pokemon-cries/" + String(id).padStart(3, "0") + ".mp3");
  lastAudio = a;  // Mantiene la referencia viva
  a.play().catch(() => {});
};
```

---

## Sistema de guardado (Supabase + WebAuthn)

Archivo: `game-src/src/app/cloud-save.ts`

### Flujo completo

```
Visita por primera vez
  → detecta WebAuthn → webauthn-register-start → challenge
  → Face ID / huella → webauthn-register-finish → player_id UUID
  → guarda en localStorage: wedding_user_id = UUID
  → partidas guardadas: save-game(player_id, game_state)

Visita posterior
  → lee wedding_user_id de localStorage
  → webauthn-auth-start → challenge
  → Face ID / huella → webauthn-auth-finish → confirma UUID
  → load-game(player_id) → carga partida

Si falla el registro / sin WebAuthn
  → crypto.randomUUID() → UUID local (sin nube)
  → registrationFailed = true → opción "Jugar sin guardar"
```

### Guardado seguro con verificación (`saveGameVerified`)

El guardado desde el menú Start (StartMenu → "Guardar") usa `saveGameVerified(userId, gameState)` en `cloud-save.ts`, que **verifica que la partida se persistió de verdad** (antes era "fire-and-forget" y podía mostrar "guardó la partida" aunque la nube fallara):

1. **Local**: escribe `localStorage[name]` y lo **relee** comprobando que existe.
2. **Nube**: tras `save-game`, **relee** con `load-game` y compara una **huella** (`fingerprintGameState`: name, map, pos, dinero, firma del equipo, longitudes de inventario/quests/etc.). Solo si coincide → `verified`.

Devuelve `SaveVerification`: `{ status: "verified" | "local-only" | "error", reason? }`.
`describeSaveResult(name, result)` traduce el estado al texto de la caja de diálogo:
- `verified` → "¡{name} guardó la partida! Copia de seguridad verificada. ✓"
- `local-only` → guardado solo en el dispositivo (sin nube/impersonación, no es error)
- `error` → avisa del problema (nube no verificada, o fallo local crítico) sin romper la partida local.

**UI (`ConfirmationMenu.tsx`)**: el `confirm` del menú de confirmación ahora puede ser **asíncrono** y devolver un `string` que sustituye al `postMessage`. Fases: `ask` (preMessage + SÍ/NO) → `running` (muestra `pendingMessage`, "Guardando...") → `done` (mensaje final verificado). Todo dentro de la misma caja, sin bloquear ni romper el flujo. Los usos síncronos previos (tirar objeto, quest) siguen funcionando igual.

### Edge Functions Supabase (Deno)

| Función | Propósito |
|---|---|
| `save-game` | Upsert de `game_state` JSONB por `player_id` (valida formato UUID) |
| `load-game` | SELECT de `game_state` por `player_id` |
| `list-players` | Lista `{playerId, name, pokemonCount}[]` para batallas online |
| `save-rsvp` | Guarda datos RSVP del invitado |
| `get-all-rsvp` | Join de `saves` + `rsvp` para el panel admin |
| `webauthn-register-start/finish` | Registro de passkey (credential creation) |
| `webauthn-auth-start/finish` | Autenticación con passkey existente (valida clientDataJSON type + origin) |
| `link-session` | Club Cable: salas de combate en vivo e intercambio (create/list/join/poll/act/resolve/cancel, timeout 1 min) |

---

## Club Cable: combates en vivo, intercambios y combates offline

El NPC **scientist** de los centros Pokémon es el recepcionista del **CLUB
CABLE** (patrón Oro/Plata). `OnlineBattleNpc.tsx` detecta la tecla A →
`dispatch(showCableClubMenu())` → `CableClubMenu.tsx` ofrece tres servicios:

### ¡COLISEO! — combate EN VIVO (requiere a los dos invitados conectados)

- **Emparejamiento por salas**: crear sala y esperar, o unirse a una abierta
  (tabla `link_sessions` + Edge Function `link-session`, polling cada 2 s).
- **Anti-desincronización (host-autoritativo)**: ambos eligen acción; el
  **anfitrión** resuelve el turno con `app/link-battle-engine.ts` (reutiliza
  `processMove` de move-helper) y publica `resolution.events[]`; los dos
  visores (`LinkBattleRoom.tsx`) reproducen esos eventos y adoptan el
  snapshot. El guest no calcula NADA.
- **UI idéntica al combate normal contra NPC**: menú LUCHAR / PKMN / OBJETO /
  RENDIRSE (en vez de HUIR, con doble confirmación), `MoveSelect` y
  `PokemonList` reales (sobre las copias), animaciones `MoveAnimation` +
  flash + embestida, esquinas `corner.png`. NO se muestra el nombre del
  jugador rival bajo su Pokémon.
- **Mensajes relativos al espectador**: el motor emite tokens
  `[[side|NOMBRE]]` y cada visor los traduce con `formatLinkText` →
  "SQUIRTLE" (míos) / "SQUIRTLE rival" (suyos), como en combate normal.
- **Reglas**: OBJETOS DE MOCHILA PERMITIDOS (consumen el turno y se gastan
  del inventario real; pokéballs bloqueadas como contra un entrenador —
  acción `{type:"item", item, targetIndex}`, efectos en
  `LINK_ITEM_EFFECTS` del motor); objetos equipados activos en AMBOS
  bandos (Restos, bayas, Garra Rápida en orden de turno, Cinta Focus...);
  huir = rendirse; se combate con COPIAS (el equipo real queda intacto,
  sin XP).
- **Paridad de mecánicas con el combate normal**: Drenadoras, trampas
  (Wrap/Torbellino 1/16), Tóxico con contador creciente, Púas (al entrar,
  clamp 1 PS), Bis, Inhabilitar, Pesadilla, Canto Mortal (KO doble =
  empate), Sustituto, clima completo (5 turnos + chip de arena),
  Aguante/Protect con racha compartida, Velo Sagrado, Premonición, Fijar
  Blanco, Mal de Ojo (bloquea cambio; pista `sideHints` en la resolución
  para que la UI lo pre-bloquee), Psico-cambio, Conversión/Conversión2,
  Transformación, rampa Rodar/Corte Furia, Patada Salto (1 PS al fallar).
- **Timeout 1 minuto por decisión** (adjudicado en servidor en cada `poll`):
  quien no responde pierde; si el host no resuelve, gana el guest; si nadie
  responde, se cancela.
- Limitaciones documentadas: sin Bide (cae a "no pasó nada"); Roar/Whirlwind
  no fuerzan cambio (como en enlaces Gen I); los moves de carga gastan turno
  de carga (salvo Rayo Solar con sol).

### INTERCAMBIO — trade en tiempo real (timeout 1 min por fase)

- Fases: `offer` (cada uno elige de su equipo) → `confirm` (¿X por Y? doble
  SÍ) → swap. Rechazar vuelve a la mesa (como GSC). Sin respuesta en 1 min →
  se cancela y nadie pierde nada.
- **El objeto equipado viaja con el Pokémon** (cliente y servidor
  intercambian la instancia completa); el panel de confirmación muestra
  "LLEVA: X" en cada tarjeta.
- **Animación GSC** tras el doble SÍ (`tradeStep` en LinkTradeRoom):
  despedida con grito → el Pokémon se retira a su ball (encogido steps) →
  la ball sube por el cable de enlace → transferencia (blips parpadeando;
  aquí se aplica `applyTrade` + save) → llega la ball rival → frames de
  apertura `ball-open-1..5` → el recibido crece desde la ball con grito y
  jingle `pokemonObtained` → "¡Cuida mucho a X!" → evolución si toca.
- `LinkTradeRoom.tsx` aplica `applyTrade` (gameSlice): simultáneo (el equipo
  nunca queda vacío), marca Pokédex visto+capturado, amistad reseteada a
  base 70 y guarda en nube inmediatamente.
- **Evoluciones por intercambio GSC**: Kadabra/Machoke/Graveler/Haunter
  siempre; Poliwhirl+RocaRey→Politoed, Slowpoke+RocaRey→Slowking,
  Onix+RevMetálico→Steelix, Scyther+RevMetálico→Scizor,
  Seadra+EscamaDragón→Kingdra, Porygon+Mejora→Porygon2 (objeto consumido).
  Piedra Eterna bloquea. El Cable Unión sigue existiendo como atajo offline.

### C. OFFLINE — el combate clásico contra equipos guardados

Flujo original intacto (`OnlineBattleMenu.tsx`): `listPlayers()` →
`loadFromCloud(playerId)` → `TrainerType` con `isOnline: true` → batalla
local contra la IA → repetible (no entra en `defeatedTrainers`). No
requiere que el rival esté conectado.

### Seguridad y protocolo

- Toda llamada a `link-session` exige `{ userId, writeToken }` validado
  contra `saves.write_token` (prueba de posesión). Los equipos se leen de
  `saves.game_state` EN SERVIDOR (whitelist de campos, sin PII) — el cliente
  no puede inyectar un equipo ajeno.
- Como en GSC, antes de entrar se guarda la partida (`saveGameVerified`);
  sin write_token (nunca guardó en nube) no se puede entrar.
- Acciones de la Edge Function: `create / list / join / mine / poll / act /
  resolve / cancel`. Transiciones de fase con UPDATEs condicionales
  (atómicas e idempotentes frente a carreras).
- **Intercambio atómico en servidor**: al confirmar ambos, la transición
  exclusiva (lock de fila) aplica el swap directamente en
  `saves.game_state` de los DOS jugadores (`applyTradeToSaves`), con
  comprobación de integridad (la especie ofrecida debe seguir en su hueco)
  y revert si el segundo write falla. `end_reason`: `trade-finishing` →
  `trade-completed` | `trade-integrity`. Un cliente caído ya no puede
  provocar duplicados ni medias transacciones.
- **Anti-trampa en `resolve`**: declarar ganador exige que el equipo
  perdedor esté todo a 0 PS en el snapshot publicado.
- **Rate limit** (1 sala/5 s por host) y **purga** de sesiones
  terminadas/canceladas de >1 día (en `create`).
- **Reanudación**: `mine` devuelve la sesión viva del jugador; al abrir el
  Club Cable tras recargar la app se ofrece "¡VOLVER!" (en combate, el host
  reconstruye la simulación desde el snapshot — los volátiles se pierden,
  degradación documentada). Abandonar explícitamente = rendirse.
- UX: lobby con auto-refresco (3,5 s), confirmación antes de rendirse,
  contador en rojo cuando quedan ≤10 s.
- Cliente: `app/link-session.ts`. Migración: `008_link_sessions.sql`.

**Centros con scientist**: `viridian-city-pokemon-center`, `pewter-city-pokemon-center`, `route-3-pokemon-center`

---

## Panel de administración

Ruta: `/admin` · Protegida por middleware con cookie `ADMIN_PASSWORD` (comparación en tiempo constante con XOR).

### Arquitectura

```
app/admin/page.tsx           → Server Component: fetch RSVPs de Supabase (via process.env)
  └── AdminDashboard.tsx     → Client Component: sorting + render tarjetas
        ├── admin-medals.ts  → Lógica pura de medallas
        ├── ImpersonateButtons.tsx  → Botones impersonar
        ├── item-names.ts    → Labels de ítems/badges
        └── quest-names.ts   → Labels de quests
```

Las credenciales Supabase se leen de `process.env.NEXT_PUBLIC_SUPABASE_URL` y `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` (no están hardcodeadas en el código).

### Sistema de medallas (admin-medals.ts)

**Regla**: una medalla = un ganador máximo. Si hay empate → nadie recibe esa medalla.

**Para añadir una medalla nueva**: añadir una entrada al array `CATEGORIES` en `admin-medals.ts`.

### Ordenación en AdminDashboard.tsx

```typescript
type SortKey = "index" | "name" | "caught" | "seen" | "quests" | "level";
type SortDir = "asc" | "desc";
```

---

## Map Editor

Ruta: `/admin/map-editor` · Herramienta visual para construir mapas **sin tocar código a mano ni copiar/pegar**.

### Arquitectura

```
app/admin/map-editor/page.tsx     → Editor principal (Client Component)
app/admin/map-editor/ts-codegen.ts → Escritor QUIRÚRGICO de los .ts (puro, sin React)
app/api/admin/
  ├── map-data/route.ts           → GET (map-data.json + overrides Supabase) / POST (Supabase, preview)
  ├── commit-map/route.ts         → POST: reescribe game-src/src/maps/<map>.ts y lo COMMITEA a GitHub
  ├── build-game/route.ts         → POST: dispara el workflow build-game.yml (compilar el juego online)
  ├── map-image/[file]/route.ts   → GET: sirve los PNG desde game-src/src/assets/map (fuente única)
  └── music-tracks/route.ts       → GET: lista .mp3 de /game/music/maps-original/
public/editor/
  ├── pokemon/ sprites/ portraits/ → Sprites (copiados por setup-editor)
  ├── map-data.json                → Datos de todos los mapas (generado desde los .ts en cada build)
  └── item-types.json              → Claves del enum ItemType
.github/workflows/build-game.yml   → Recompila el bundle CRA y lo commitea (workflow_dispatch)
```

### Selección visual (sin window.prompt)

Toda la edición pasa por modales con búsqueda y preview clicable:
- **Portales**: selector de mapa con filtro + preview del mapa destino con casillas clicables.
- **Objetos / Pokémon / bayas / recompensas de texto / equipo de entrenador**: listas con búsqueda y sprites.
- **Hide condition `trainer-defeated`**: se elige el entrenador haciendo click sobre el mapa (resaltado).

El sistema de pickers vive en `page.tsx` (estado `picker: PickerState` + `PickerHost`).

### Fuente única de imágenes

Las imágenes de mapa **ya NO se copian** a `public/editor/maps/`. El editor las sirve desde
`game-src/src/assets/map/` vía `/api/admin/map-image/<file>` (misma fuente que compila el juego).
`next.config.ts` incluye `game-src/src/assets/map/**` en el trace de ese lambda.

### Reemplazar el PNG del mapa y editar width/height (desde el editor)

En el inspector 🗺 (modo `map`) hay una sección **"Imagen del mapa"** con preview,
botón **🖼 Reemplazar PNG…** e inputs **Width/Height (tiles)**:

- **Subida**: `POST /api/admin/upload-map-image` valida el PNG (magic bytes + IHDR,
  máx. 4 MB), lo **commitea a GitHub** bajo `game-src/src/assets/map/<imageFile>`
  (mismo nombre → el `import` del `.ts` no cambia) y guarda copia base64 en la
  tabla Supabase `map_editor_images` (migración `011`) para **preview instantáneo**:
  el filesystem del lambda de Vercel no refleja el commit hasta el siguiente deploy.
- **`map-image/[file]` con auto-limpieza**: sirve el override de Supabase solo
  mientras difiera del filesystem; cuando un deploy ya incluye los mismos bytes,
  **borra la fila** y vuelve al filesystem → el override nunca puede tapar una
  edición manual posterior del PNG en el repo (la trampa clásica de los overrides).
- **Dimensiones**: al subir, el servidor devuelve los px y el editor propone
  `width/height = px/16` (confirm). También se pueden editar a mano; el canvas se
  redimensiona al instante (se muta `mapData`, no hay estado aparte). Persisten
  con 💾 Guardar: override Supabase (`width`/`height` en `OVERRIDE_KEYS`) + campos
  `width:`/`height:` del `.ts` vía `ts-codegen` (reescritura quirúrgica; valores
  no enteros o ≤ 0 se ignoran y el campo nunca se elimina).
- **Cache-bust**: el canvas añade `?v=<imgVersion>` a la URL de la imagen; el
  contador se incrementa tras cada subida.
- ⚠️ Encoger un mapa NO recorta el contenido (walls/NPCs con coords mayores
  quedan fuera del canvas pero siguen en los datos).
- El juego jugable muestra la imagen nueva tras **🛠 Compilar juego** (CRA la
  importa del repo en build).

### Guardar → commit del `.ts` (escritura quirúrgica + auto-imports)

`💾 Guardar` hace DOS cosas (aditivo, nunca rompe):
1. **POST `/api/admin/map-data`** → Supabase (preview instantáneo, como siempre).
2. **POST `/api/admin/commit-map`** → reescribe `game-src/src/maps/<sourceFile>` con `ts-codegen.writeMapTs()`:
   - **Quirúrgico**: solo toca los campos que el editor gestiona; conserva el resto
     (`encounters` vía `getEncounterData`, comentarios, imagen, código custom).
   - **Reconcilia imports** según el uso real del texto final (npcs, `Direction`, `ItemType`,
     `MapId`) → resuelve el clásico "faltan librerías al pegar".
   - Commitea a la rama `MAP_EDIT_BRANCH` (def. `master` → llega a producción) vía la GitHub API.

> ⚠️ **No perder datos**: `setup-editor.mjs` DEBE parsear todo campo editable
> (incluidos `boulders`/`berryTrees`/`cuttableTrees`). Si el editor no carga un campo,
> al guardar enviaría un array vacío y `writeMapTs` lo borraría del `.ts`. Si añades un
> campo nuevo al editor, añade su parser en `setup-editor.mjs` Y su serializador en `ts-codegen.ts`.

### Compilar el juego online

Botón `🛠 Compilar juego` → `/api/admin/build-game` dispara `build-game.yml` (workflow_dispatch):
recompila el bundle CRA desde `game-src` y commitea `public/game/` en la rama. Permite publicar
cambios sin entrar al entorno de desarrollo. El juego solo refleja los mapas tras esta compilación.

### Grafo de conexiones

Botón `🕸 Grafo` → overlay con todos los mapas como nodos y las conexiones (puertas/teleports/salidas)
como aristas dirigidas. Simulación de fuerzas, pan/zoom (rueda + arrastre), búsqueda y click-para-ir.

### Minimapa de Kanto (`🗺️ Kanto`) — pan/pinch-zoom + agrupación de puntos

- **Pan + pinch-zoom** (móvil y escritorio) en modos **Navegar** y **Editar**, sin
  desajustar los puntos. La imagen y los puntos viven dentro de un contenedor con
  `transform: translate+scale` (los puntos se posicionan en % → se mueven/escalan
  con la imagen). El mapeo tap→píxel usa el `getBoundingClientRect` REAL de la
  `<img>` (ya refleja el transform), así que es independiente del zoom/desplazamiento.
  Los puntos llevan `scale(1/mmView.scale)` para mantener tamaño constante en pantalla.
- **Gestos**: 1 dedo = tocar (fijar posición en Editar / elegir grupo en Navegar);
  2 dedos = desplazar + escalar (anclado a los dedos). Ratón: arrastrar = pan,
  rueda = zoom focal (listener nativo no-pasivo), botones `− / + / ⤢ Ajustar`.
  Estado en `mmView {scale,tx,ty}` + ref `mmGesture`; `clampMmView` impide sacar
  la imagen de la vista. El panel hace `flex-wrap` → en móvil el inspector baja
  bajo el mapa.
- **Agrupación automática por nombre** (`minimapGroupKey`): los interiores se
  nombran `<padre>-<sufijo>` (gimnasio, centro, casas, plantas…) y las mazmorras
  con plantas caen en `MINIMAP_FLOOR_GROUPS`. La resolución es transitiva → todo
  cuelga de su ciudad/mazmorra en un único nivel. En Navegar se muestra UN punto
  por grupo (🟡 grupo con interiores · 🔵 mapa suelto · 🔴 actual); al tocarlo se
  listan sus sub-mapas en el panel para ir a cualquiera. Sin cambios de datos ni
  migración. Editar sigue fijando el `minimapPos` del mapa seleccionado.

### Auto-relleno de contenido (Pokémon salvajes y equipos) — `pokemon-pool.ts`

Herramientas para poblar contenido rápido sin elegir Pokémon uno a uno. Datos en
`app/admin/map-editor/pokemon-pool.ts` (`POKEMON_POOL`: id→`{types, bst}` de los
251, autogenerado desde `pokemon-metadata.ts`; `LEGENDARY_IDS`, `genOf`).

- **Pokémon salvajes** (botón `✨ Auto-rellenar` en modos Hierba y Agua):
  `buildEncounterTable` elige especies por **terreno** (hierba / cueva según el
  flag del mapa / agua), **generación** (I, II o ambas), **rango de niveles**,
  nº de especies, **franjas horarias** y sesgo automático día/noche
  (fantasmas/siniestros de noche). La distribución de rarezas suma 100
  (`decreasingChances`). La **pesca** rellena las 3 cañas diferenciadas del surf:
  Caña Vieja = debiluchos (BST + nivel bajos), Buena = media, Súper/Surf = fuertes
  (`TERRAIN_BST_CEIL` + ventanas de nivel por tabla en `applyEncounterAutofill`).
- **Equipos de entrenador** (`✨ Auto-equipo` en el inspector · `✨ Auto-equipos`
  para todo el mapa): `buildTrainerTeam` filtra por **tipo/tipos** y generación,
  y la **dificultad 1-10** escala el BST objetivo, los niveles y (a 9-10) habilita
  legendarios; tamaño de equipo configurable o "conservar el actual" de cada NPC.

> Como el resto del editor, el auto-relleno escribe en el mismo estado
> (`encounters` / `trainers`) que la edición manual: persiste a Supabase
> (preview) y, los entrenadores, al `.ts` en el commit. Siempre es ajustable a
> mano después (reemplaza la tabla/equipo actual).

### Responsive

El editor es usable en móvil/tablet: en pantallas ≤820px el inspector pasa a ocupar el ancho completo
bajo el canvas (clases `.me-body`/`.me-inspector` + media queries en el `<style>` de la toolbar).

### Desplazar y hacer zoom del canvas (multitáctil, imprescindible en móvil)

Dos modelos que conviven sin estorbarse (`scrollRef` = contenedor `overflow:auto`):

- **Táctil — gesto de DOS dedos (sin cambiar de modo, a cualquier escala)**: UN
  dedo edita/pinta como siempre; DOS dedos DESPLAZAN el mapa y hacen
  **pinch-zoom**. Es el patrón estándar de editores táctiles (Figma, mapas) y
  funciona en cualquier dispositivo sin tocar ningún botón. Implementación en
  los manejadores del contenedor (`onCanvasScrollPointerDown/Move/Up`): se
  rastrean los punteros táctiles en `gesture.current.pointers`; al entrar el
  segundo dedo se activa el gesto (`gesture.active`), se cancela cualquier
  edición en curso (`wallPaint`/`dragging`/`entityDrag`) y se capturan ambos
  punteros. En `move` se desplaza el scroll según el centro de los dedos y, si
  el ratio de distancia cruza a otro `ZOOM_LEVELS`, se hace `setZoom` con
  preservación del **punto focal** (el tile bajo los dedos sigue bajo los dedos)
  vía `pinchFocus` + un `useLayoutEffect` keyed en `zoom`.
- **Escritorio / explícito — botón `✋ Mover`** (junto a Zoom): activa el
  arrastre con ratón (drag-to-scroll, `panState`). Sigue disponible como antes.

Para que los gestos no disparen edición, los manejadores de edición
(`onCanvasPointerDown`, `onCanvasClick`, drag de NPC/entidades, pintura) hacen
early-return cuando `panMode`, cuando `gesture.active`, o cuando
`isSecondaryTouch(e)` (toque secundario: ya hay otro dedo apoyado → es el inicio
de un gesto de dos dedos, no se pinta ni se coloca). El lienzo mantiene
`touch-action: none` para que los gestos de uno y dos dedos lleguen como
pointer events limpios. En escritorio el scroll por barra/trackpad sigue
funcionando con el modo desactivado.

### Selector de música

`MapMetaInspector`: desplegable de tracks (`/api/admin/music-tracks`) + input manual para expresiones
(`music` para un import, o `"/game/music/maps-original/route-1.mp3"` para ruta pública). El campo
`expression` es la cadena que se almacena en `MapType.music`.

### Variables de entorno requeridas (commit / compilar)

```bash
# Vercel (para que guardar commitee y el botón de compilar funcionen)
GH_TOKEN=<PAT fine-grained con contents:write + actions:write sobre el repo>
GH_REPO=Sergio-Velites/Project1May   # opcional (default)
MAP_EDIT_BRANCH=master               # opcional: rama donde commitea/compila el editor (def. master)
GH_WORKFLOW_REF=master               # opcional: rama donde vive build-game.yml
```

La config de Supabase para el build del juego vive en `game-src/.env.production` (valores
públicos: el anon key ya viaja en el bundle). Así el workflow `build-game.yml` NO necesita
secrets. Único requisito en producción: `GH_TOKEN` en Vercel.

Sin `GH_TOKEN` el editor sigue funcionando (guardado en Supabase) y avisa "commit no configurado".

### Flujo (commit directo a master → producción)

Por defecto el editor commitea los `.ts` directamente a `master` y "Compilar juego" reconstruye el
bundle también en `master`, de modo que los cambios **llegan a producción (Vercel) sin pasos manuales**:
1. Editas y pulsas **💾 Guardar** → commit del `.ts` a `master` (Vercel redespliega el shell Next).
2. Cuando quieras verlo en el juego jugable, pulsas **🛠 Compilar juego** → recompila el bundle CRA y lo
   commitea a `master` → Vercel despliega el juego actualizado (tarda unos minutos).

`writeMapTs` lee siempre el `.ts` actual de `master` antes de reescribir, así que no pisa cambios de
código hechos en otras ramas (esas ramas se rebasan sobre `master` para traerse los mapas). Si prefieres
una rama de staging con revisión por PR, basta con poner `MAP_EDIT_BRANCH=<rama>` en Vercel.

---

## Estado actual de la narrativa

### Flujo de inicio

1. **GameboyMenu** → menú de encendido
2. **IntroVideo** → vídeo intro (saltable A/B)
3. **TitleScreen** → pantalla título
4. **LoadScreen** → gestión save/load (passkey, guard atómico doble-A)
5. **OakIntro** → intro Prof. Oak con typewriter (solo nueva partida)
6. **NameKeyboard** → elegir nombre del jugador
7. Juego comienza en `PalletTownHouseA2F` (pos 3,6), sin pokémon

### Acto I — PUEBLO PALETA / DESTILERÍA DEL PROF. OAK ✅
- Madre bronca (quest `madre-bronca-done`), Team Rocket bloqueo norte
- Prof. Oak (lab, persistent) → discurso boda
- 3 pokéballs → `LabPokeballModal` → starter (Gen I o II)

### Acto II — Ruta 1 · Camino al Soto ✅
- youngster, beauty, lass, fisher, sailor

### Acto III — SOTO LEZKAIRU ✅
- cueBall, jrTrainerFemale, teamRocketGrunt
- gentleman (quest `vino-tinto-dado` → da SodaPop)

### Acto IV — EL BOSQUECILLO ✅
- NPCs decorativos, Team Rocket bloqueando, hierba densa con encuentros

### Acto V — VILLAMAYOR DE MONJARDÍN ✅
- sailor guardián
- Sergio (aceTrainerMale, Growlithe+Ponyta) → `BoulderBadge` + TM34
- Marta (aceTrainerFemale, Butterfree+Clefairy)

---

## Archivos clave

| Archivo | Propósito |
|---|---|
| `game-src/src/state/gameSlice.ts` | Estado global: pokémon, mapa, pos, saves, npcFacings, lastHealLocation |
| `game-src/src/state/uiSlice.ts` | Estado UI: textos, menús, confirmaciones |
| `game-src/src/state/state-types.ts` | Interfaces GameState, PokemonInstance, PosType, etc. |
| `game-src/src/app/cloud-save.ts` | Supabase Edge Functions + WebAuthn passkey + listPlayers() |
| `game-src/src/app/move-helper.ts` | Mecánicas Gen I+II completas (Protect, Pain Split, Swagger, etc.) |
| `game-src/src/app/move-sfx-map.ts` | SFX moves: exact match + fallback por tipo/clase para Gen II |
| `game-src/src/app/move-animations.ts` | Animaciones moves: fallback por tipo (incluye fairy, shadow) |
| `game-src/src/app/level-helper.ts` | 4 growth rates + getLearnedMove() + getHpDeltaOnLevelUp() |
| `game-src/src/app/xp-helper.ts` | XP Gen I: `floor(base*level/7)`, ×1.5 entrenador |
| `game-src/src/app/pokeball-helper.ts` | Fórmula captura Gen I con 4 sacudidas |
| `game-src/src/app/pokemon-cry.ts` | Singleton gritos Pokémon (evita GC) |
| `game-src/src/app/pokemon-metadata.ts` | 251 Pokémon Gen I+II con stats, evoluciones, growth rates |
| `game-src/src/app/move-metadata.ts` | ~24k líneas: nombres oficiales ES + metadatos de moves |
| `game-src/src/app/use-quests.ts` | 5 quests activas (walk + talk triggers) |
| `game-src/src/app/npcs.ts` | 40+ tipos de NPC con sprites |
| `game-src/src/components/Game.tsx` | Componente raíz: monta todos los sistemas |
| `game-src/src/components/PokemonEncounter.tsx` | Combate principal (stages 0-52+) |
| `game-src/src/components/TrainerEncounter.tsx` | Encuentros NPC + diálogos + setNpcFacing |
| `game-src/src/components/LoadScreen.tsx` | Flujo inicio: passkey → save → oak-intro |
| `game-src/src/components/Evolution.tsx` | Animación evolución + getLearnedMove() post-evolución |
| `game-src/src/components/OnlineBattleNpc.tsx` | Detecta A frente al scientist |
| `game-src/src/components/OnlineBattleMenu.tsx` | Flujo batalla online |
| `game-src/src/maps/map-types.ts` | Interfaces MapType, TrainerType |
| `game-src/src/maps/map-data.ts` | Registro de los 163 mapas |
| `app/admin/page.tsx` | Server Component: fetch RSVPs (usa process.env) |
| `app/admin/AdminDashboard.tsx` | Client Component: sorting + render + medallas |
| `app/admin/admin-medals.ts` | Lógica medallas únicas (empate = nadie) |
| `app/admin/map-editor/page.tsx` | Editor visual de mapas |
| `app/api/admin/music-tracks/route.ts` | Lista tracks .mp3 disponibles para el editor |
| `supabase/functions/save-game/index.ts` | Edge function: guarda partida (valida UUID) |
| `supabase/functions/webauthn-auth-finish/index.ts` | Valida clientDataJSON type + origin |
| `middleware.ts` | Protección /admin con comparación en tiempo constante (XOR) |
| `public/editor/original-map-music.json` | Metadatos de música original Gen I (referencia) |
| `public/game/music/maps-original/` | 20+ tracks originales Gen I (.mp3) |
| `game-src/src/assets/pokemon/front/` | 251 sprites de frente (56×56 RGBA) — tamaños ajustados por altura oficial |
| `game-src/src/assets/map/` | 174 PNGs de mapas — overworld + interiores (escala 16px/tile, estilo FireRed/LeafGreen) |
| `game-src/src/assets/map/kanto_region.png` | Minimapa 237×213px para el item Mapa y el panel del map-editor |

---

## Problemas conocidos y soluciones definitivas

### 1. `cd X && comando` pierde el directorio
**Causa**: `run_in_terminal` colapsa el comando.
**Solución**: **SIEMPRE** subshell `(cd /ruta/absoluta && comando)`.

### 2. react-scripts: "Cannot find module 'typescript'"
**Causa**: CWD no es `game-src/`. TypeScript está en `game-src/node_modules/`.
**Solución**: subshell que fuerza CWD a `game-src/`.

### 3. Bucle infinito en pantalla passkey
**Causa**: `webauthn-register-finish` falla → fase vuelve a `require-passkey`.
**Solución**: tras primer fallo `registrationFailed=true` → opción "Jugar sin guardar".

### 4. Modal/overlay no centrado en pantalla
**Causa**: `BackgroundContainer` tiene `transform: translate(...)`.
**Solución**: sprite en world coords (dentro BackgroundContainer) + modal en screen coords (fuera, en `Game.tsx`). Estado via Redux.

### 5. `showText` + setTimeout no seguro
**Solución**: `dispatch(showTextThenAction({ text: ["..."], action: () => doSomething() }))`.

### 6. Gritos Pokémon silenciosos
**Causa**: GC recoge el objeto Audio antes de que `play()` se ejecute.
**Solución**: `let lastAudio` a nivel de módulo en `pokemon-cry.ts`.

### 7. Sprite Ash durante switch de pokémon
**Solución**: eliminar `setStage(3)` en `performSwitchTo`. La lista Pokémon (stage 13/25) sirve de cortina.

### 8. Bug KO: combate continúa tras KO del jugador
**Solución**: Stage 27: `endEncounter_(true)` t=1000ms → `recoverFromFainting()` t=1500ms.

### 9. Trainers desaparecían tras derrota (resuelto)
**Solución**: `Game.tsx` no filtra por `defeatedTrainers`. Solo `hideCondition` oculta NPCs.

### 10. Template literal mal cerrado (Turbopack)
**Síntoma**: `Expected ',', got 'ident'` en el número de línea del error.
**Diagnóstico**: buscar backtick sin cerrar en la línea indicada.

### 11. Edit tool duplica contenido
**Diagnóstico**: verificar con `wc -l` después de edits grandes.
**Solución**: si el archivo está duplicado, `head -n N > /tmp/clean.ts && mv /tmp/clean.ts archivo.ts`.

### 12. `LabPokeball.tsx` usa `completedQuests`, no `collectedItems`
**Razón**: usa `completeQuest("lab-starter-taken-{pokemonId}")` en lugar de `collectItem`.

### 13. NPC persistent + intro vacío → comportamiento exacto
- Siempre visible; al acercarse NO muestra `!`; al pulsar A muestra `outtro`; se gira gracias a `setNpcFacing`.

### 14. Pain Split — caps invertidos (resuelto)
**Causa**: el código antiguo usaba un ternario `isAttacking ? ourStats : theirStats` que intercambiaba los max HP en el branch `isAttacking=false`.
**Solución**: `us` siempre es el usuario, `ourStats.hp` siempre es su max. Sin ternario.

### 15. Protect no bloqueaba moves de estado (resuelto)
**Causa**: `if (context?.defenderIsProtected && moveMetadata.power)` — la condición `&& moveMetadata.power` dejaba pasar moves sin daño.
**Solución**: `if (context?.defenderIsProtected)` — bloquea todo.

### 16. Credenciales Supabase hardcodeadas en admin (resuelto)
**Solución**: `process.env.NEXT_PUBLIC_SUPABASE_URL` y `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` (configuradas en Vercel con ese nombre exacto).

### 17. Open redirect en admin login (resuelto)
**Solución**: `?next=` solo acepta paths internos (`/` y no `//`).

### 18. `canWalk` creaba array intermedia en cada comprobación de colisión (resuelto)
**Causa**: `blockingTrainers = trainers.filter(...); isTrainer(blockingTrainers, x, y)` hacía dos pasadas y reservaba memoria en cada keypress.
**Solución** (`map-helper.ts`): un único bucle `for...of` que comprueba hideCondition y posición en la misma pasada, sin array temporal.

### 19. `isEncounter` llamaba `isTrainer` con coords constantes dentro del bucle de visión (resuelto)
**Causa**: `isTrainer(trainers, pos.x, pos.y)` usa `pos` (posición del jugador, invariante dentro del loop) → computa lo mismo TRAINER_VISION veces.
**Solución** (`map-helper.ts`): hoist de la llamada fuera del bucle con un early return.

> **Nota de rendimiento**: el juego no tiene problemas de rendimiento medibles. Las dos optimizaciones anteriores son correctas y limpias, pero su impacto real es mínimo (arrays de < 10 elementos, llamadas solo en keypress). No hay trabajo de performance pendiente.

### 20. Sprites de frente: escala proporcional a altura oficial (canvas 76×76)
**Problema original**: los 251 sprites tenían contenido ~50×50 dentro del canvas 56×56, independientemente de si el Pokémon mide 0.2m (Diglett) o 9.2m (Steelix).
**Solución**: canvas ampliado de 56×56 a **76×76**. El contenido de los Pokémon grandes se escala UP con nearest-neighbor (sin pérdida de calidad). Los pequeños quedan centrados en el canvas mayor sin escalar, apareciendo proporcionalmente más pequeños.

```
Canvas: 76×76 (1:1 ratio → sin impacto en CSS height:100% / object-fit:contain)
Rango contenido: 0.2m → 50px  /  9.2m → 72px
Formula: target = round(50 + 22 * (log(h_dm) - log(2)) / (log(92) - log(2)))
Solo upscaling (nunca downscaling → calidad original preservada en pequeños)
```

Ejemplos: Diglett/Natu 50px · Pikachu 54px · Charizard 62px · Snorlax 64px · Gyarados 70px · Onix/Steelix 72px.

**Para re-ejecutar** (nuevos sprites o ajuste de rango): script en commit `67546f5`. Cambiar `MIN_TARGET`/`MAX_TARGET` para ampliar o reducir la diferencia de escala.

### 21. Fuga de PII: `load-game` devolvía el `game_state` íntegro sin autenticación (resuelto)
**Problema**: `list-players` expone TODOS los `user_id` (necesario para el selector de batalla online) y `load-game` devolvía el `game_state` completo a cualquiera que pasara un `user_id`. Encadenando ambos, cualquier invitado podía volcar el bloque `rsvp` de todos los demás (nombre real, acompañante, alergias, nº de niños, asistencia, autobús).
**Solución** (`supabase/functions/load-game/index.ts`): se redacta el campo `rsvp` (array `PII_FIELDS`) salvo que el solicitante pruebe posesión presentando el `write_token` correcto por la cabecera `x-write-token`. El dueño recibe el estado íntegro; las batallas online y accesos directos reciben la versión sin PII (solo usan `pokemon` + `name`, que es el nombre de entrenador, público a propósito). Añadida validación de formato UUID.
**Cliente** (`cloud-save.ts` → `loadFromCloud`): envía `x-write-token` (leído de localStorage) por cabecera, no en la URL, para no filtrarlo en logs. Al cargar la propia partida el token coincide → estado íntegro; al cargar el equipo de un rival no coincide → `rsvp` ajeno redactado.
**Verificado sin romper nada**: `progressScore` (decide local vs nube en `LoadScreen`) NO mira `rsvp`; `OnlineBattleMenu` solo usa `pokemon`+`name`; `OakIntro` (formulario RSVP) solo corre en partida nueva → la redacción nunca re-pide el RSVP.

### 22. `save-game` conserva el `rsvp` previo (blindaje de la redacción #21)
**Problema**: un cliente con bundle CACHEADO (service worker antiguo, sin el cambio de `x-write-token`) cargaría un estado con `rsvp` redactado y, al volver a guardar, blanquearía el `rsvp` en `game_state`.
**Solución** (`supabase/functions/save-game/index.ts`): si llega un `gameState` SIN `rsvp` pero ya había uno guardado, se conserva. El `rsvp` es de solo-escritura en el juego (se fija una vez en OakIntro, nunca se borra), así que preservarlo es siempre correcto. Hace el despliegue inmune al orden Vercel/Supabase y al cacheo. La lectura extra solo ocurre cuando falta el `rsvp` (poco común). El dato canónico vive además en la tabla `rsvp`.

### 23. Apropiación de cuenta vía `webauthn-auth-finish` (endurecido)
**Problema**: la función no verifica la firma criptográfica (decisión documentada por un bug de `@simplewebauthn/server@10` con Deno), pero además el `clientDataJSON` era OPCIONAL (`if (...clientDataJSON)`) → un atacante podía omitirlo y saltarse TODAS las comprobaciones, y NO se vinculaba el `challenge` firmado con el emitido. Quien conociera un `credential_id` ajeno obtenía su `user_id` + `write_token` (control total).
**Solución** (`supabase/functions/webauthn-auth-finish/index.ts`):
- `clientDataJSON` ahora es OBLIGATORIO (+ guarda de entrada para `challengeId`/`credential`).
- Se verifica que `clientData.challenge` coincide con el `challenge` emitido y guardado en `webauthn_challenges` (uso único), en forma canónica base64url sin padding (tolerante a `+/` vs `-_` y a `=`) para no generar falsos `Challenge mismatch`.
- Se mantienen las comprobaciones de `type` (`webauthn.get`) y `origin` (`ALLOWED_ORIGINS`).
**Degradación segura**: si `auth-finish` rechaza, `cloud-save.ts` (`webauthnAuth`) cae a la identidad local de `localStorage` → un usuario en su propio dispositivo nunca queda bloqueado.
**Pendiente** (ver Ideas futuras): la verificación criptográfica completa de la firma sigue sin implementarse.

### 24. `admin-player`: validación de formato UUID (defensa en profundidad)
**Solución** (`supabase/functions/admin-player/index.ts`): GET/PUT/DELETE validan que `userId` tiene formato UUID antes de tocar la BD. El admin ya está protegido por `x-admin-key` (`ADMIN_SECRET`); esto solo rechaza IDs malformados que habrían dado error igualmente.

> **Estado de despliegue (revisión de seguridad)**: mergeado a `master` y desplegado. Edge Functions activas en Supabase (`kplfjrjibjptigvfgdvy`): `load-game` v4, `webauthn-auth-finish` v14, `save-game` v8, `admin-player` v2, `webauthn-register-start` v7 (CORS con `x-recover-token`, ver #26), `maintenance` v3. `verify_jwt` preservado en cada una (`admin-player` y `maintenance` = true; resto = false). Las cabeceras `x-write-token` y `x-recover-token` están en la allowlist CORS de `_shared/cors.ts`.

### 25. GH_TOKEN caducado → "Guardado en nube. Commit falló: … HTTP 401" (2026-07-17)
**Síntoma**: al 💾 Guardar en el map-editor, el preview de Supabase se guarda pero el commit del `.ts` falla con `No se pudo comprobar la rama master: HTTP 401` (500 en `/api/admin/commit-map`). También rompe 🛠 Compilar juego y la subida de imágenes.
**Causa**: el PAT guardado como `GH_TOKEN` en Vercel caducó o fue revocado.
**Arreglo (5 min, sin tocar código)**:
1. Conseguir token nuevo: `gh auth token` (la CLI local está logueada como Sergio-Velites, scopes `repo`+`workflow`) o crear un PAT fine-grained en GitHub (Contents + Actions: read/write sobre este repo — preferible, con caducidad posterior al evento).
2. `npx vercel env rm GH_TOKEN --yes && gh auth token | npx vercel env add GH_TOKEN production && gh auth token | npx vercel env add GH_TOKEN preview`
3. Redesplegar (las funciones no cogen el valor hasta el siguiente deploy): `npx vercel redeploy <url-del-último-deploy-prod>`.
**Importante**: los guardados hechos con el token roto viven SOLO en el override de Supabase — reabrir cada mapa afectado y volver a 💾 Guardar para que llegue al `.ts` (consultar `map_editor_data.updated_at` para saber cuáles).
**NO diagnosticar con `vercel env pull`**: devuelve el literal `[SENSITIVE]` (11 chars) para variables sensibles, no el valor real.

### 26. Enlaces de recuperación (?recover=&rt=) no vinculaban la passkey (2026-07-19)
**Síntoma**: al abrir el link `?recover=<uuid>&rt=<token>` del admin, "Vincular Face ID/Huella" fallaba con "No se pudo vincular…" y la sesión degradaba a modo "jugar puntualmente" (sin quedar el dispositivo enlazado).
**Causa raíz (de despliegue, no de código)**: las Edge Functions **empaquetan `_shared/*.ts` en el momento del deploy**. `x-recover-token` se añadió a la allowlist CORS de `_shared/cors.ts`, y `maintenance` se desplegó después (bundle nuevo), pero **`webauthn-register-start` quedó en v6 con el `cors.ts` viejo**. El preflight del navegador no autorizaba `x-recover-token` → el POST nunca se enviaba → el cliente lo trataba como fallo de vinculación. El token en sí siempre fue válido.
**Arreglo**: redesplegar `webauthn-register-start` (v7) con el `_shared/cors.ts` actual, **preservando `verify_jwt=false`**. Verificado con un link real: preflight OK + POST 200 con challenge.
**Regla general**: al tocar CUALQUIER archivo de `supabase/functions/_shared/`, redesplegar TODAS las funciones que dependan del cambio (cada una lleva su copia congelada). Comprobar qué bundle tiene cada función desplegada: MCP Supabase → `get_edge_function` (devuelve los ficheros empaquetados).

---

## Ideas futuras (no implementadas)

### Seguridad pendiente (post-boda)
Mejoras de seguridad identificadas en la revisión que NO se implementaron por riesgo/coste frente al modelo de amenaza real (invitado con DevTools) y al timing del evento:
- **Verificación criptográfica completa de WebAuthn** (la grande): `webauthn-auth-finish` aún NO comprueba la firma con la clave pública COSE almacenada (`webauthn_credentials.public_key`). Implementarla requiere parseo COSE/CBOR + Web Crypto (`crypto.subtle.verify` sobre `authenticatorData || sha256(clientDataJSON)`) y probarla contra autenticadores reales (Face ID/huella). Hasta entonces, quien conozca un `credential_id` ajeno podría obtener su `user_id`+`write_token`; el `credential_id` no se expone públicamente (solo vive en el localStorage del dueño), y el endurecimiento #23 (challenge vinculado + uso único) eleva mucho la barrera. **Hacerlo con dispositivos de prueba.**
- **Rate-limiting** en `create-user`, `webauthn-register-start` y `save-rsvp` (auto-crean filas anónimas): sin límite permiten spam/DoS de cuota. Requiere infra de throttling (p.ej. límite por IP en un edge middleware o tabla de contadores).
- **CORS `*`** en las Edge Functions: necesario hoy para servir el juego con la `apikey` pública; una vez redactada la PII (#21) su impacto es bajo. Revisar si conviene restringir a `ALLOWED_ORIGINS` en las funciones que no sirven al juego.

### Item Mapa en el juego
Implementar el objeto "Mapa" (ItemType.Map) usando `kanto_region.png` (237×213px en `game-src/src/assets/map/kanto_region.png`).
- Al usarlo desde el menú de mochila, abrir un overlay que muestre el mapa de Kanto.
- Mostrar la posición actual del jugador como un punto parpadeante.
- Coordenadas de referencia en `MINIMAP_COORDS` del map-editor (ver `app/admin/map-editor/page.tsx`).

### Pokédex — área de captura
En la vista detalle de la Pokédex, mostrar en qué mapas se puede encontrar cada Pokémon (hierba, pesca, surf).
- Requiere índice inverso: `pokemonId → [{ mapId, encounterType }]`.
- Puede generarse en tiempo de compilación desde los datos de encuentros de cada mapa.
- Fuente de datos: campo `encounters` de cada `MapType`.

### Cerulean Cave acceso
Actualmente `cerulean-cave-1f` no tiene acceso desde el mapa. Conectar con `cerulean-city` (tile ~9,3) una vez el jugador haya derrotado a la Elite Four.
- Usar una quest condicional similar a las existentes para bloquear el acceso antes.

### Editor de mapas — mejoras pendientes
- Selector de `MapId` en portales (doors/teleports) con autocompletado en vez de campo de texto libre.
- Vista de conexiones: mostrar qué mapas están conectados entre sí (grafo).

---

## Acceso a infraestructura (Supabase · Vercel · GitHub)

Cómo operar CUALQUIER pieza del despliegue de forma autónoma, sin pedir nada al
usuario. Ningún secreto vive en este archivo: todo el acceso es vía CLIs ya
autenticadas en esta máquina o herramientas MCP conectadas.

### Supabase — proyecto `kplfjrjibjptigvfgdvy`

- **Vía MCP** (`claude.ai Supabase`): `execute_sql` (consultas), `apply_migration`
  (DDL — además crear SIEMPRE el archivo espejo en `supabase/migrations/`),
  `deploy_edge_function`, `get_logs`, `list_tables`, `get_advisors`.
- **Tablas**: `saves` (partidas + `write_token` + RSVP), `rsvp`,
  `webauthn_credentials`, `webauthn_challenges`, `link_sessions` (Club Cable),
  `map_editor_data` (overrides del editor: `map_id, trainers, walls, overrides,
  updated_at`), `map_editor_images` (PNGs subidos, preview), `app_config`
  (mantenimiento + allowlist).
- **Edge Functions**: listadas en la sección de guardado. `verify_jwt=false` en
  todas salvo `admin-player`. Al redesplegar una función, preservar ese flag.
- **Diagnóstico "¿qué mapas tienen cambios sin commitear?"**:
  `select map_id, updated_at from map_editor_data order by updated_at desc` y
  comparar con los commits `editor:` de `master`.

### Vercel — team `apps-7362s-projects` · proyecto `project1-may`

- **CLI logueada** como `apps-7362` (`npx vercel@latest whoami`). IDs:
  team `team_seM7WhowVA1RMQtTZD6Hua2c`, proyecto `prj_lGeU69gtyehTBf2FMvl2L8dYRVXa`.
  Si el directorio no está linkado: `npx vercel link --yes --project project1-may
  --scope apps-7362s-projects` (crea `.vercel/`, gitignorado).
- **Dominios**: `game.bodasym26.es` (producción), `project1-may.vercel.app`.
- **Git-connected**: push a `master` → deploy automático del shell Next.
  Deploy manual/redeploy: `npx vercel redeploy <url-deploy-prod>` (usar tras
  cambiar env vars) o `npx vercel --prod`.
- **Env vars**: `npx vercel env ls|add|rm`. ⚠️ `env pull` escribe el literal
  `[SENSITIVE]` para variables sensibles — NUNCA diagnosticar valores así;
  verificar por comportamiento. Cambios de env requieren redeploy.
- **Logs de producción**: MCP `claude.ai Vercel` → `get_runtime_logs` /
  `get_runtime_errors` (filtrar con `query`, p.ej. `commit-map`).
- **Borrar SIEMPRE** cualquier `.env*` descargado tras usarlo.

### GitHub — repo `Sergio-Velites/Project1May`

- **CLI `gh` logueada** como `Sergio-Velites` (dueño), scopes `repo`+`workflow`:
  vale para API, PRs, workflows (`gh workflow run build-game.yml -f ref=master`)
  y como fuente de emergencia de token (`gh auth token`) — ver problema #25.
- **`GH_TOKEN` en Vercel** (lo usan `commit-map`, `upload-map-image` y
  `build-game`): desde 2026-07-17 es el token OAuth de la CLI `gh` (amplio: todos
  los repos del usuario). Sustituir cuando se pueda por un PAT fine-grained
  (Contents + Actions: read/write, solo este repo, caducidad > fecha de la boda).
- **Ramas**: el editor commitea a `MAP_EDIT_BRANCH` (sin definir en Vercel →
  default `master`). El botón 🛠 compila el ref `MAP_EDIT_BRANCH` con el workflow
  de `GH_WORKFLOW_REF` (default `master` ambos). Desarrollo de código en ramas
  (`integrate-gb-maps` actual) SIEMPRE rebasadas sobre `master` antes de merge,
  porque `master` avanza solo con los commits `editor:`.

---

## Variables de entorno

### `game-src/.env` (para el juego — NO commitear)

```bash
REACT_APP_SUPABASE_URL=https://<project-ref>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<anon-key>
```

### Vercel (dashboard del proyecto)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co   # ⚠️ con NEXT_PUBLIC_ prefix
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>                     # ⚠️ con NEXT_PUBLIC_ prefix
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
ADMIN_PASSWORD=<contraseña-del-panel-admin>
ADMIN_SECRET=<secreto-edge-functions>
ALLOWED_ORIGINS=https://tu-dominio.vercel.app  # Para validación WebAuthn origin
```

> **⚠️ IMPORTANTE**: Las variables de Supabase usan el prefijo `NEXT_PUBLIC_` tanto para el juego (React) como para el panel admin (Next.js Server Component). Nunca usar `SUPABASE_URL` ni `SUPABASE_ANON_KEY` sin prefijo — no existen en Vercel.

> **Nota**: La variable del panel admin se llama `ADMIN_PASSWORD` en el middleware (cookie) y `ADMIN_SECRET` en la Edge Function `get-all-rsvp`. Son dos mecanismos distintos: el middleware protege las rutas Next.js; `ADMIN_SECRET` protege la Edge Function de Supabase.
