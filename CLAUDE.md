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
19. [Variables de entorno](#variables-de-entorno)

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

**Repositorio**: `Sergio-Velites/Project1May` · **Rama activa de desarrollo**: `claude/pokemon-gen2-database-tScT0` · **Producción**: `master` → Vercel

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

### ⚠️ Regla 3: NUNCA commits directos a master

Toda modificación del juego va a la rama de desarrollo activa (`claude/pokemon-gen2-database-tScT0`). El merge a master es decisión del usuario.

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

# 5. Commit y push (a la rama activa, NUNCA a master)
git add public/game/ game-src/src/
git commit -m "feat: descripción"
git push origin claude/pokemon-gen2-database-tScT0
```

### Cambios solo en Next.js (admin, RSVP, map-editor)

No requieren compilar el juego:

```bash
git add app/ supabase/
git commit -m "feat: descripción"
git push origin claude/pokemon-gen2-database-tScT0
```

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

### Moves Gen II sin mecánica (caen a "sin efecto" limpiamente)

`NO_EFFECT_MOVES` incluye: `nightmare, attract, encore, destiny-bond, future-sight, rollout, fury-cutter, magnitude, belly-drum, endure, safeguard, sandstorm, sunny-day, rain-dance, spikes, conversion-2, spider-web, mean-look, lock-on, psych-up, perish-song`

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

---

## Batallas online entre invitados

1. Jugador se acerca al NPC **scientist** en un Centro Pokémon (pos `{x:10,y:2}`)
2. `OnlineBattleNpc.tsx` detecta la tecla A → `dispatch(showOnlineBattleMenu())`
3. `OnlineBattleMenu.tsx`: llama `listPlayers()` → muestra lista de invitados
4. Jugador selecciona un rival → `loadFromCloud(playerId)` carga su `game_state`
5. Se construye `TrainerType` con los Pokémon del rival (`isOnline: true`)
6. La batalla transcurre normalmente (local, sin red en tiempo real)
7. `isOnline: true` → `defeatTrainer` NO añade al `defeatedTrainers` → repetible

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

Ruta: `/admin/map-editor` · Herramienta visual para editar mapas sin tocar el código.

### Arquitectura

```
app/admin/map-editor/page.tsx  → Editor principal (Client Component)
app/api/admin/
  ├── map-data/route.ts        → GET/POST: lee y guarda maps/*.ts via AST
  ├── music-tracks/route.ts    → GET: lista .mp3 de /game/music/maps-original/
  └── item-types/route.ts      → GET: lista ItemType disponibles
public/editor/
  ├── pokemon/                 → Sprites front de los 251 Pokémon
  └── original-map-music.json → Metadatos de música original Gen I (referencia)
```

### Selector de música

El inspector de mapa (`MapMetaInspector`) ofrece:
1. **Desplegable**: lista de tracks disponibles en `/game/music/maps-original/` (consume `/api/admin/music-tracks`)
2. **Input manual**: para expresiones personalizadas (ej. `music` para un import existente, o `"/game/music/maps-original/route-1.mp3"` para ruta pública)

El campo `expression` del track es la cadena que se almacena en `MapType.music`.

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
| `game-src/src/maps/map-data.ts` | Registro de los 33 mapas |
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

---

## Ideas futuras (no implementadas)

### Item Mapa en el juego
Implementar el objeto "Mapa" (ItemType.Map) usando `kanto_region.png` (237×213px en `game-src/src/assets/map/kanto_region.png`).
- Al usarlo desde el menú de mochila, abrir un overlay que muestre el mapa de Kanto.
- Mostrar la posición actual del jugador como un punto parpadeante.
- Coordenadas de referencia en `MINIMAP_COORDS` del map-editor (ver `app/admin/map-editor/page.tsx`).

### HM Vuelo (Fly)
Destinos: lista de ciudades visitadas (`visitedMaps` en gameSlice). Al usar Vuelo, mostrar un menú con las ciudades/mapas exterior disponibles y teletransportar.
- Usar `recoverLocation` de cada mapa como punto de aterrizaje.
- Añadir animación de pantalla negra (como `BlackScreen.tsx`) antes del teleporte.

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
