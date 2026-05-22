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
9. [Mecánicas de combate (Gen I)](#mecánicas-de-combate-gen-i)
10. [Sistema de gritos Pokémon](#sistema-de-gritos-pokémon)
11. [Sistema de guardado (Supabase + WebAuthn)](#sistema-de-guardado-supabase--webauthn)
12. [Batallas online entre invitados](#batallas-online-entre-invitados)
13. [Panel de administración](#panel-de-administración)
14. [Estado actual de la narrativa](#estado-actual-de-la-narrativa)
15. [Archivos clave](#archivos-clave)
16. [Problemas conocidos y soluciones definitivas](#problemas-conocidos-y-soluciones-definitivas)
17. [Variables de entorno](#variables-de-entorno)

---

## Objetivo del proyecto

Invitación de boda interactiva con estética Game Boy (Pokémon Rojo/Azul). El motor base es [chase-manning/pokemon-js](https://github.com/chase-manning/pokemon-js) (MIT), extendido con:
- Mecánicas Gen I completas (growth rates, XP, stat stages, críticos, captura, drain, recoil, etc.)
- Narrativa de boda en 5 actos con NPCs, diálogos y quests personalizados
- Guardado en nube via Supabase + WebAuthn passkey (Face ID / huella)
- Batallas en tiempo real entre invitados
- Panel de administración para los organizadores
- Sistema de medallas únicas por invitado

**Repositorio**: `Sergio-Velites/Project1May` · **Rama principal**: `master` → despliegue automático en Vercel

---

## Stack técnico

| Capa | Tecnología | Notas |
|---|---|---|
| Shell | Next.js 16 (App Router) + TypeScript | Routing, admin, RSVP, API routes |
| Juego | React 18 + TypeScript + Redux Toolkit + styled-components | CRA build (`react-scripts`) |
| Motor base | chase-manning/pokemon-js (MIT) | Extendido con mecánicas Gen I |
| Build | CRA (`react-scripts build`) | **NO usar npx** — ver sección de flujo |
| Despliegue | Vercel | Branch `master` → producción |
| DB / Auth | Supabase (PostgreSQL + Edge Functions Deno) | Partidas + WebAuthn passkey |
| Admin auth | Middleware Next.js + cookie | `ADMIN_SECRET` env var |

---

## Arquitectura en dos capas

```
/app/              → Next.js 16 shell (routing, admin, RSVP, API)
/public/game/      → Build estático del juego (NO editar directamente)
/game-src/src/     → FUENTE del juego (editar aquí)
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

# 5. Commit y push
git add public/game/ game-src/src/
git commit -m "feat: descripción"
git push origin master
```

### Cambios solo en Next.js (admin, RSVP)

No requieren compilar el juego:

```bash
git add app/
git commit -m "feat: descripción"
git push origin master
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
}
```

Campos clave adicionales:
- `trainerEncounter` / `pokemonEncounter`: estado del combate activo
- `rsvp`: datos RSVP del invitado (nombre, acompañante, etc.)

### `ui` slice (`state/uiSlice.ts`)

```typescript
{
  text: string[] | null,          // Texto mostrado en el cuadro de diálogo
  textThenAction: ...,            // Texto + callback al cerrarlo
  startMenu / itemsMenu / playerMenu / titleMenu / loadMenu / gameboyMenu,
  pokemonCenterMenu / pcMenu / pokeMartMenu / pokedexOpen,
  learningMove / blackScreen / confirmationMenu / evolution,
  pokeballCardId: number | null,  // Modal starter activo
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

### `loadFromState(state)` — cargar desde guardado externo

```typescript
dispatch(loadFromState(savedGameState));
```
Usado en `cloud-save.ts` para cargar partidas desde Supabase.

---

## Sistema de mapas

### Interfaz `MapType` (campos clave)

```typescript
{
  id: MapId,          // Enum único del mapa
  name: string,       // Nombre mostrado en pantalla
  image: string,      // Path al asset PNG del mapa
  height: number, width: number,
  start: PosType,     // Posición inicial al entrar sin teleport
  walls: PosType[],   // Tiles bloqueados
  fences: PosType[],  // Saltables con bici
  grass: PosType[],   // Encuentros aleatorios
  text: Record<fila, Record<col, string[]>>,  // Carteles y textos de tile
  maps: { ... }[],    // Conexiones con otros mapas (edges del mapa)
  teleports: { ... }[], // Teletransportes (puertas de edificios)
  exits: { ... }[],
  exitReturnMap / exitReturnPos,   // Dónde vuelves al salir del edificio
  music: string,      // Fichero .mp3 en /sfx/
  encounters: { id, minLevel, maxLevel, rarity }[],  // Pokémon salvajes
  trainers: TrainerType[],
  items: MapItemType[],
  recoverLocation: PosType,  // Dónde respawneas tras KO (si no hay lastHealLocation)
  pokemonCenter / pc / store / storeItems,  // Servicios disponibles
  onlineBattleNpc?: PosType,  // Posición del scientist para batallas online
}
```

### IDs de los 33 mapas

```
pallet-town, pallet-town-lab, pallet-town-house-a-1f, pallet-town-house-a-2f, pallet-town-house-b
route-1, route-2, route-22, route-3
gate-house, route-2-gate, route-2-gate-north
viridian-city, viridian-city-gym, viridian-city-pokemon-center, viridian-city-poke-mart,
  viridian-city-pokemon-acadamy, viridian-city-npc-house
viridian-forrest
pewter-city, pewter-city-gym, pewter-city-pokemon-center, pewter-city-poke-mart,
  pewter-city-npc-a, pewter-city-npc-b, pewter-city-museum-1f, pewter-city-museum-2f
route-3-pokemon-center
mt-moon-1f, mt-moon-2f, mt-moon-3f
```

### Cómo añadir un mapa nuevo

1. Añadir valor al enum `MapId` en `maps/map-types.ts`
2. Crear archivo (copiar `maps/template.ts` como base)
3. Importar y registrar en `maps/map-data.ts`

---

## Sistema de NPCs y trainers

### Interfaz `TrainerType`

```typescript
{
  npc: NpcType,                    // Sprite (youngster, beauty, teamRocketGrunt, etc.)
  pokemon: [{ id: number, level: number }][],
  facing: Direction,
  pos: { x: number, y: number },
  intro: string[],    // VACÍO [] = sin combate (solo diálogo al pulsar A)
  outtro: string[],   // Texto tras derrota o si intro está vacío
  money: number,
  persistent?: boolean,    // No desaparece aunque esté en defeatedTrainers
  hideCondition?: "has-pokemon",  // Se oculta si el jugador tiene ≥1 pokémon
  isOnline?: boolean,      // Batalla online: no se añade a defeatedTrainers
  postGame?: { message: string[], items?: ItemType[] },  // Recompensa tras ganar
}
```

### ID de un trainer

El ID se forma como `"mapId-x-y"` (ej. `"pallet-town-10-0"`). Este ID es lo que va en `defeatedTrainers`.

### Visibilidad tras derrota

- `Game.tsx` **NO filtra** trainers por `defeatedTrainers`.
- Solo `hideCondition: "has-pokemon"` oculta a un NPC.
- Los trainers derrotados permanecen en su tile y muestran `outtro` al pulsar A.
- `persistent: true` → el NPC siempre aparece, incluso si está en `defeatedTrainers`.

### NPC de solo diálogo (sin combate)

```typescript
{
  npc: beauty,
  pokemon: [{ id: 35, level: 3 }],  // Obligatorio aunque no combata
  facing: Direction.Right,
  pos: { x: 7, y: 20 },
  intro: [],           // ← VACÍO = sin combate
  outtro: ["¡La preboda sin anís no es preboda!"],
  money: 0,
}
```

### Sistema de giro (`npcFacings`)

Al pulsar A frente a un NPC, `TrainerEncounter.tsx` dispara:
```typescript
dispatch(setNpcFacing({ id: "mapId-x-y", direction: opposite(playerDirection) }));
```
`Trainer.tsx` lee `npcFacings[trainerId]` como override de `trainer.facing`.
El mapa de `npcFacings` se limpia al cambiar de mapa (reducers `setMap`, `setMapWithPos`, `exitMap`).

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

### Tipos de trigger

- `"walk"`: se activa cuando el jugador pisa una posición específica
- `"talk"`: se activa cuando el jugador pulsa A en una posición específica

### Estructura de una quest

```typescript
{
  trigger: "walk" | "talk",
  map: MapId.PalletTown,
  positions: { 3: [6, 7] },  // fila: [columnas] — { y: [x1, x2] }
  active: () => !completedQuests.includes("quest-id"),  // condición
  text: ["Línea 1", "Línea 2"],  // texto a mostrar (puede ser [])
  action: () => { dispatch(setPos({x:3, y:3})); },  // acción Redux
}
```

### 5 quests activas

1. **`madre-bronca-done`** — `house-a-1f` (walk, y:3): bronca al bajar las escaleras
2. **Bloqueo norte** — `pallet-town` (walk, y:0): devuelve a y:3 si `pokemon.length === 0`
3. **Guía al gimnasio** — `pewter-city` (walk): muestra flecha si `badges.length === 0`
4. **Museo** — `pewter-city-museum-1f` (walk): cobra 50₽ si no ha pagado (`pewter-museum-1f-paid`)
5. **`vino-tinto-dado`** — `viridian-city` (walk, pos Maestro del Vino): da SodaPop una sola vez

### Marcar una quest como completada

```typescript
dispatch(completeQuest("quest-id"));
```

---

## Mecánicas de combate (Gen I)

Archivo principal: `game-src/src/app/move-helper.ts`

### Implementadas fielmente al original

- **Stat stages** (−6/+6): ataque, defensa, velocidad, especial, accuracy, evasion
- **Críticos**: 10% base (×2 daño), high-crit ×8 (Slash, Razor Leaf, etc.)
- **Drain moves** (Absorb, Mega Drain, Dream Eater): recupera ½ del daño infligido
- **Recoil** (Take Down, Double-Edge, Submission)
- **Flinch**: 10%/30% según el movimiento
- **Counter**: devuelve ×2 el último daño físico recibido
- **Metronome**: movimiento aleatorio del pool Gen I
- **Leech Seed**: drena HP cada turno
- **Super Fang**: reduce HP al 50%
- **4 growth rates**: Fast, Medium-Fast, Medium-Slow, Slow (fórmulas exactas Gen I)
- **XP entrenadores**: ×1.5 del XP base (bonus Gen I) — `app/xp-helper.ts`
- **Captura Gen I**: fórmula con 4 sacudidas reales — `app/pokeball-helper.ts`
- **Evolución**: `Evolution.tsx` llama `getLearnedMove()` post-evolución
  - Si hay hueco libre: aprende automáticamente
  - Si 4 movimientos: muestra `MoveSelect.tsx` para olvidar uno

### PokemonEncounter.tsx — stages relevantes

| Stage | Evento |
|---|---|
| 0 | Inicio encuentro (wild o trainer) |
| 1 | Wild: cry del enemigo (t=2000ms) |
| 3 | Animación ChangePokemon (slide-out Ash sprite) |
| 4-9 | Throw pokeball animación |
| 10 | Player pokémon cry (durante throwPokeball) |
| 11 | Battle menu (Luchar / Mochila / Pokémon / Huir) |
| 13/25 | Lista de Pokémon (switch voluntario / forzado post-KO) |
| 27 | `endEncounter_(true)` t=1000ms → `recoverFromFainting()` t=1500ms |
| 34-38 | Throw pokeball at enemy (captura) |
| 48 | Primer trainer pokémon: cry |
| 49 | Trainer pokémon siguiente: cry |
| 52+ | Fin combate |

### `lastHealLocation` — recuperación tras KO

`healPokemon` guarda `lastHealLocation` resolviendo `exitReturnPos` del centro Pokémon.
`recoverFromFainting` usa `lastHealLocation` si existe; si no, recurre a `recoverLocation` del mapa.

---

## Sistema de gritos Pokémon

Archivo: `game-src/src/app/pokemon-cry.ts`

### Problema resuelto (bug GC)

`new Audio(url)` sin guardar referencia → el GC recoge el objeto antes de que `play()` se ejecute → gritos silenciosos.

### Solución: singleton con referencia de módulo

```typescript
const CRY_LOCK_MS = 1100;
let lastAudio: HTMLAudioElement | null = null;  // Previene GC
let lockUntil = 0;

export const playCry = (id: number): void => {
  lockUntil = Date.now() + CRY_LOCK_MS;
  const a = new Audio("/game/sfx/pokemon-cries/" + String(id).padStart(3, "0") + ".mp3");
  a.volume = 1;
  lastAudio = a;  // CRÍTICO: mantiene la referencia
  a.play().catch(() => {});
};

export const isCryActive = (): boolean => Date.now() < lockUntil;
export const cryLockRemainingMs = (): number => Math.max(0, lockUntil - Date.now());
export const waitForCry = (cb: () => void): void => { setTimeout(cb, cryLockRemainingMs()); };
export const cancelCry = (): void => {
  lockUntil = 0;
  if (lastAudio) { try { lastAudio.pause(); } catch {} lastAudio = null; }
};
```

### Cuándo suena cada grito

- **Stage 1**: enemy wild pokémon (t=2000ms tras inicio)
- **Stage 10**: player pokémon (durante throwPokeball, ~3100ms tras inicio)
- **Stage 48**: primer pokémon del trainer rival
- **Stage 49**: pokémon siguientes del trainer rival

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

### Edge Functions Supabase (Deno)

| Función | Propósito |
|---|---|
| `save-game` | Upsert de `game_state` JSONB por `player_id` |
| `load-game` | SELECT de `game_state` por `player_id` |
| `list-players` | Lista `{playerId, name, pokemonCount}[]` para batallas online |
| `save-rsvp` | Guarda datos RSVP del invitado |
| `get-all-rsvp` | Join de `saves` + `rsvp` para el panel admin |
| `webauthn-register-start/finish` | Registro de passkey (credential creation) |
| `webauthn-auth-start/finish` | Autenticación con passkey existente |

---

## Batallas online entre invitados

### Flujo

1. Jugador se acerca al NPC **scientist** en un Centro Pokémon (pos `{x:10,y:2}`)
2. `OnlineBattleNpc.tsx` detecta la tecla A → `dispatch(showOnlineBattleMenu())`
3. `OnlineBattleMenu.tsx`: llama `listPlayers()` → muestra lista de invitados
4. Jugador selecciona un rival → `loadFromCloud(playerId)` carga su `game_state`
5. Se construye `TrainerType` con los Pokémon del rival (`isOnline: true`)
6. La batalla transcurre normalmente (local, sin red en tiempo real)
7. `isOnline: true` → `defeatTrainer` NO añade al `defeatedTrainers` → repetible

### Centros con scientist para batallas online

- `viridian-city-pokemon-center` (SOTO LEZKAIRU)
- `pewter-city-pokemon-center` (VILLAMAYOR DE MONJARDÍN)
- `route-3-pokemon-center` (Camino de la Resaca)

---

## Panel de administración

Ruta: `/admin` · Protegida por middleware con cookie `ADMIN_PASSWORD`.

### Arquitectura del panel

```
app/admin/page.tsx           → Server Component: fetch RSVPs de Supabase
  └── AdminDashboard.tsx     → Client Component: sorting + render tarjetas
        ├── admin-medals.ts  → Lógica pura de medallas (sin React)
        ├── ImpersonateButtons.tsx  → Botones impersonar (Client, usa window)
        ├── item-names.ts    → Labels de ítems/badges
        └── quest-names.ts   → Labels de quests
```

### Sistema de medallas (admin-medals.ts)

**Regla**: una medalla = un ganador máximo. Si hay empate → nadie recibe esa medalla.

```typescript
// Definir una categoría
const CATEGORIES: CategoryDef[] = [
  {
    getValue: (e) => getCaughtSet(e).size,  // Función que devuelve número
    minValue: 1,                             // Mínimo para que sea válido
    medal: { emoji: "🏆", label: "El Mayor Entrenador", description: "...", rarity: "gold" },
  },
  // ...
];

// Calcular ganadores (descarta empates)
export function computeGlobalMedals(entries: RSVPForMedals[]): GlobalMedalEntry[] {
  for (const cat of CATEGORIES) {
    const topVal = Math.max(...values.map(v => v.val));
    if (topVal < cat.minValue) continue;
    const winners = values.filter(v => v.val === topVal);
    if (winners.length !== 1) continue;  // Empate → skip
    results.push({ index: winners[0].i, player_name: ..., medal: cat.medal });
  }
}
```

**Para añadir una medalla nueva**: añadir una entrada al array `CATEGORIES` en `admin-medals.ts`.

### Ordenación en AdminDashboard.tsx

```typescript
type SortKey = "index" | "name" | "caught" | "seen" | "quests" | "level";
type SortDir = "asc" | "desc";
```

Controles en la UI: 6 botones de criterio + toggle de dirección.

### Chip de pokémon capturados

El chip `🎮 N` muestra el total de pokémon únicos capturados:
```typescript
getCaughtSet(e).size  // = caughtPokemon ∪ pokemon.map(p=>p.id) ∪ pc.map(p=>p.id)
```

---

## Estado actual de la narrativa

### Flujo de inicio

1. **GameboyMenu** → menú de encendido
2. **IntroVideo** → vídeo intro (saltable A/B)
3. **TitleScreen** → pantalla título
4. **LoadScreen** → gestión save/load:
   - WebAuthn disponible → obliga registro passkey (Face ID / huella)
   - Falla registro → `registrationFailed=true` → "Jugar sin guardar"
   - Sin partida → solo "Nueva partida"
   - Con partida → "Continuar" + "Nueva partida"
   - `choosingRef` guard atómico previene race condition doble-A → Oak intro falso
5. **OakIntro** → intro Prof. Oak con typewriter (solo nueva partida)
6. **NameKeyboard** → elegir nombre del jugador
7. Juego comienza en `PalletTownHouseA2F` (pos 3,6), sin pokémon

### Acto I — PUEBLO PALETA / DESTILERÍA DEL PROF. OAK ✅
- Madre bronca en `house-a-1f` (quest walk `madre-bronca-done`)
- Team Rocket norte (persistent + `hideCondition:"has-pokemon"`) + quest walk bloqueo
- Prof. Oak (lab, x:5,y:1, persistent) → discurso boda
- 3 pokéballs lab (x:6,7,8, y:3) → `LabPokeballModal` → starter

### Acto II — Ruta 1 · Camino al Soto ✅
- youngster (combate, Spearow lvl3, 50₽) · beauty (decorativo) · lass (decorativo)
- fisher (combate, Magikarp+Goldeen, 70₽) · sailor (combate, Tentacool+Psyduck, 90₽)

### Acto III — SOTO LEZKAIRU ✅
- cueBall (combate, Rattata lvl4, 80₽) · jrTrainerFemale (combate, Zubat lvl5, 100₽)
- teamRocketGrunt (combate, Nidorino+Meowth, 200₽)
- gentleman (decorativo, quest `vino-tinto-dado` → da SodaPop)

### Acto IV — EL BOSQUECILLO ✅
- NPCs decorativos que apuran · Team Rocket bloqueando el paso (combate)
- Hierba densa con encuentros aleatorios

### Acto V — VILLAMAYOR DE MONJARDÍN ✅
- sailor guardián (combate, 300₽)
- Sergio (aceTrainerMale, Growlithe lvl14 + Ponyta lvl12, 1400₽) → `BoulderBadge` + TM34
- Marta (aceTrainerFemale, Butterfree lvl16 + Clefairy lvl14, 1600₽)

---

## Archivos clave

| Archivo | Propósito |
|---|---|
| `game-src/src/state/gameSlice.ts` | Estado global: pokémon, mapa, pos, saves, npcFacings, lastHealLocation |
| `game-src/src/state/uiSlice.ts` | Estado UI: textos, menús, confirmaciones, pokeballCardId, onlineBattleMenu |
| `game-src/src/state/state-types.ts` | Interfaces GameState, PokemonInstance, PosType, Direction, RSVPData |
| `game-src/src/app/cloud-save.ts` | Supabase Edge Functions + WebAuthn passkey + listPlayers() |
| `game-src/src/app/move-helper.ts` | Mecánicas Gen I completas |
| `game-src/src/app/level-helper.ts` | 4 growth rates + getLearnedMove() + getHpDeltaOnLevelUp() |
| `game-src/src/app/xp-helper.ts` | XP Gen I: `floor(base*level/7)`, ×1.5 entrenador |
| `game-src/src/app/pokeball-helper.ts` | Fórmula captura Gen I con 4 sacudidas |
| `game-src/src/app/pokemon-cry.ts` | Singleton gritos Pokémon (evita GC) |
| `game-src/src/app/use-quests.ts` | 5 quests activas (walk + talk triggers) |
| `game-src/src/app/move-metadata.ts` | ~24k líneas: nombres oficiales ES de movimientos |
| `game-src/src/app/npcs.ts` | 40+ tipos de NPC con sprites |
| `game-src/src/components/Game.tsx` | Componente raíz: monta todos los sistemas |
| `game-src/src/components/PokemonEncounter.tsx` | Combate principal (stages 0-52+) |
| `game-src/src/components/TrainerEncounter.tsx` | Encuentros NPC + diálogos + setNpcFacing |
| `game-src/src/components/LoadScreen.tsx` | Flujo inicio: passkey → save → oak-intro |
| `game-src/src/components/OakIntro.tsx` | Intro Oak typewriter (40ms/char) |
| `game-src/src/components/NameKeyboard.tsx` | Teclado 4 filas + FIN siempre visible |
| `game-src/src/components/LabPokeball.tsx` | Sprites pokéball (world coords, dentro BackgroundContainer) |
| `game-src/src/components/LabPokeballModal.tsx` | Modal starter (screen coords, fuera BackgroundContainer) |
| `game-src/src/components/Evolution.tsx` | Animación evolución + getLearnedMove() post-evolución |
| `game-src/src/components/OnlineBattleNpc.tsx` | Detecta A frente al scientist → showOnlineBattleMenu() |
| `game-src/src/components/OnlineBattleMenu.tsx` | Flujo batalla online: lista jugadores → batalla |
| `game-src/src/components/Trainer.tsx` | Sprite NPC con npcFacings override |
| `game-src/src/components/MoveSelect.tsx` | Selector movimiento a olvidar |
| `game-src/src/maps/map-types.ts` | Interfaces MapType, TrainerType (isOnline, hideCondition, onlineBattleNpc) |
| `game-src/src/maps/map-data.ts` | Registro de los 33 mapas |
| `app/admin/page.tsx` | Server Component: fetch RSVPs de Supabase |
| `app/admin/AdminDashboard.tsx` | Client Component: sorting + render + medallas |
| `app/admin/admin-medals.ts` | Lógica medallas únicas (12 categorías, empate = nadie) |
| `app/admin/CsvDownload.tsx` | Exportar datos RSVP a CSV |
| `app/admin/ImpersonateButtons.tsx` | Jugar como invitado / recuperar partida |
| `supabase/functions/list-players/index.ts` | Edge function: jugadores para batalla online |
| `scripts/setup-editor.mjs` | Prebuild: copia assets de game-src a public/editor |
| `middleware.ts` | Protección /admin con cookie ADMIN_PASSWORD |

---

## Problemas conocidos y soluciones definitivas

### 1. `cd X && comando` pierde el directorio
**Causa**: `run_in_terminal` colapsa el comando.
**Solución**: **SIEMPRE** subshell `(cd /ruta/absoluta && comando)`.

### 2. react-scripts: "Cannot find module 'typescript'"
**Causa**: CWD no es `game-src/`. TypeScript está instalado en `game-src/node_modules/`.
**Solución**: subshell que fuerza CWD a `game-src/`.

### 3. Bucle infinito en pantalla passkey
**Causa**: `webauthn-register-finish` falla → fase vuelve a `require-passkey` → bucle.
**Solución**: tras primer fallo `registrationFailed=true` → opción "Jugar sin guardar" (UUID local).

### 4. Modal/overlay no centrado en pantalla
**Causa**: `BackgroundContainer` tiene `transform: translate(...)` → mueve contenido con el scroll del mapa.
**Solución**: separar en dos componentes — sprite en world coords (dentro BackgroundContainer) + modal en screen coords (fuera, en `Game.tsx`). Estado compartido via Redux (`pokeballCardId` en uiSlice, incluido en `selectMenuOpen`).

### 5. `showText` + setTimeout no seguro
**Solución**: `dispatch(showTextThenAction({ text: ["..."], action: () => doSomething() }))`.

### 6. Gritos Pokémon silenciosos
**Causa**: GC recoge el objeto Audio antes de que `play()` se ejecute.
**Solución**: `let lastAudio` a nivel de módulo en `pokemon-cry.ts`.

### 7. Sprite Ash durante switch de pokémon
**Causa**: `setStage(3)` en `performSwitchTo` activa animación slide-out con `leftImage()=playerBack`.
**Solución**: eliminar `setStage(3)`. La lista Pokémon (stage 13/25) sirve de cortina hasta que `throwPokeball` dispara `setStage(4)`.

### 8. Bug KO: combate continúa tras KO del jugador
**Causa**: curar primero, cerrar combate después → combate detectaba pokémon curados.
**Solución**: Stage 27: `endEncounter_(true)` t=1000ms → `recoverFromFainting()` t=1500ms.

### 9. Trainers desaparecían tras derrota (resuelto commit 80d402f)
**Solución**: `Game.tsx` no filtra por `defeatedTrainers`. Solo `hideCondition` oculta NPCs.

### 10. Turbopack: template literal mal cerrado
**Síntoma**: `Expected ',', got 'ident'` en el número de línea del error.
**Causa**: backtick `` ` `` sustituido por `"` en una descripción larga.
**Diagnóstico**: buscar template literal sin cerrar en la línea indicada.

### 11. replace_string_in_file duplica contenido
**Causa**: si el patrón coincide con solo el comentario inicial, el nuevo contenido se inserta antes del viejo.
**Diagnóstico**: verificar con `wc -l` después de edits grandes.
**Solución**: si el archivo está duplicado, `head -n N > /tmp/clean.ts && mv /tmp/clean.ts archivo.ts`.

### 12. `LabPokeball.tsx` usa `completedQuests`, no `collectedItems`
**Razón**: no usa `collectItem` (que requiere `ItemType` real). Cada pokéball usa `completeQuest("lab-starter-taken-{pokemonId}")`.

### 13. NPC persistent + intro vacío → comportamiento exacto
- Siempre visible en el mapa
- Al acercarse: NO muestra `!` ni inicia batalla
- Al pulsar A: muestra `outtro`
- Se gira hacia el jugador gracias a `setNpcFacing`

---

## Variables de entorno

### `game-src/.env` (para el juego — NO commitear)

```bash
REACT_APP_SUPABASE_URL=https://<project-ref>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<anon-key>
```

### Vercel (dashboard del proyecto)

```bash
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
ADMIN_SECRET=<contraseña-del-panel-admin>
```


Web interactiva para una invitación de boda, con estética Game Boy clásica (Pokémon Rojo/Azul).
El juego es una parodia original: sin ROMs, sin assets de Nintendo, sin nombres de Pokémon.
El motor base proviene del proyecto open source **chase-manning/pokemon-js** (MIT).

**Jugable en**: cualquier navegador, escritorio y móvil.
**Desplegado en**: Vercel (rama `local-src` → producción).

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Shell (wrapper) | Next.js 16 (App Router) + TypeScript |
| Juego | React 18 + TypeScript + Redux Toolkit + styled-components (CRA build) |
| Base del motor | chase-manning/pokemon-js (MIT) |
| Despliegue | Vercel |
| DB/Auth | Supabase (partidas cloud + WebAuthn passkey) |

---

## Cómo funciona la integración

El juego vive en `/public/game/` como archivos estáticos.
Next.js redirige `/` a `/game/index.html`.

---

## Estructura de carpetas

```
/
├── app/                  # Next.js shell (mínimo)
├── game-src/             # ← SOURCE del juego (editar aquí)
│   └── src/             # React 18 + CRA
├── public/game/          # ← BUILD del juego (no editar directamente)
├── supabase/functions/   # Edge Functions Deno
└── package.json
```

> El `tsconfig.json` raíz excluye `game-src/` para que Next.js no intente compilarlo.

---

## Arquitectura interna del juego (game-src/)

### Estado global: Redux Toolkit

**`game` slice** (`state/gameSlice.ts`):
```
pos / map / direction / moving / jumping / name
pokemon / pc / activePokemonIndex
inventory / money
trainerEncounter / pokemonEncounter
defeatedTrainers: string[]
collectedItems / completedQuests / seenPokemon / caughtPokemon
npcFacings: Record<string, Direction>   (ID = "mapId-x-y")
lastHealLocation: { map: MapId; pos: PosType } | undefined
```

**Estado inicial:**
- Sin pokémon en equipo ni PC
- Mapa: PalletTownHouseA2F pos (3,6), inventario: 2 PokéBalls
- `defeatedTrainers: ["pallet-town-lab-5-1", "pallet-town-house-a-1f-6-3", "pallet-town-10-0", "pallet-town-11-0"]`
- `npcFacings: {}` — se limpia al cambiar de mapa
- `lastHealLocation: undefined`

**`ui` slice** (`state/uiSlice.ts`):
```
text / startMenu / itemsMenu / playerMenu / titleMenu / loadMenu / gameboyMenu
pokemonCenterMenu / pcMenu / pokeMartMenu / pokedexOpen
textThenAction / learningMove / blackScreen / confirmationMenu / evolution
pokeballCardId: number | null
academyPokeballOpen: bool
onlineBattleMenu: bool
```

Save/Load: `localStorage` con clave = nombre del jugador.
`dispatch(loadFromState(state))` → carga desde estado externo (cloud save).

---

### Sistema de eventos: mitt

`app/emitter.ts` — bus de eventos global. Suscripción: `useEvent(Event.A, callback)`.

Eventos: `up/down/left/right`, `start-*/stop-*`, `a`, `b`, `start`, `select`,
`stop-moving`, `enter-door`, `heal-pokemon`.

---

### Sistema de mapas (`src/maps/`)

Campos clave de `MapType`:
- `name`, `image`, `height`/`width`, `start`
- `walls`, `fences`, `grass`
- `text: Record<fila, Record<col, string[]>>`
- `maps`, `teleports`, `exits`, `exitReturnMap`, `exitReturnPos`
- `music`, `encounters`, `cave`, `recoverLocation`
- `pokemonCenter`, `pc`, `store`, `storeItems`
- `trainers: TrainerType[]`, `items: MapItemType[]`
- `onlineBattleNpc?: PosType` — posición del scientist NPC para batallas online

**33 mapas existentes:**
- Pallet Town + Lab + 2 casas
- Viridian City (SOTO LEZKAIRU) + Gym + PokéCenter + PokéMart + Academia + Casa NPC
- Route 1 (Ruta 1 · Camino al Soto), Route 2, Route 22, Route 3 + PokéCenter
- Gate House, Route 2 Gate, Route 2 Gate North
- Viridian Forest (EL BOSQUECILLO)
- Pewter City (VILLAMAYOR DE MONJARDÍN) + Gym (Bodega CASTILLO DE MONJARDÍN) + PokéCenter + PokéMart + 2 casas NPC + Museo 1F/2F
- Mt. Moon 1F/2F/3F

**Para añadir un mapa:** enum `MapId` → nuevo archivo → registrar en `maps/map-data.ts`.

---

### TrainerType

```typescript
interface TrainerType {
  npc: NpcType; pokemon: [{id, level}]; facing: Direction; pos: {x, y}
  intro: string[]       // vacío = sin combate, muestra outtro al pulsar A
  outtro: string[]; money: number
  persistent?: boolean  // no desaparece aunque esté en defeatedTrainers
  hideCondition?: "has-pokemon"
  isOnline?: boolean    // batalla online: no se añade a defeatedTrainers
  postGame?: { message: string[], items?: ItemType[] }
}
```

**Visibilidad:** todos los trainers permanecen visibles tras derrota.
Solo `hideCondition` puede ocultarlos. `Game.tsx` NO filtra por `defeatedTrainers`.

**Radio de detección:** 5 tiles. Derrotado → muestra `outtro`. `intro` vacío → nunca combate.

---

### 40 tipos de NPC

`ash`, `oak`, `rival`, `beauty`, `birdKeeper`, `blackBelt`, `bugCatcher`,
`burglar`, `channeler`, `aceTrainerMale/Female`, `cueBall`, `engineer`,
`fisher`, `gambler`, `gentleman`, `hiker`, `jrTrainerMale/Female`, `juggler`,
`lass`, `pokeManiac`, `psychic`, `rocker`, `teamRocketGrunt`, `sailor`,
`scientist`, `superNerd`, `swimmer`, `tamer`, `youngster`, `biker`,
`brock`, `misty`, `ltSurge`, `erica`, `koga`, `sabrina`, `blaine`, `giovanni`

---

### Sistema de quests (`app/use-quests.ts`)

Tipos: `"talk"` | `"walk"` — activadas por posición en un mapa.

**5 quests activas:**
1. `madre-bronca-done` — House A 1F: bronca al bajar las escaleras (walk)
2. Pueblo Paleta norte — bloqueo si `pokemon.length === 0` (walk): devuelve a y:3
3. Pewter City — guía al gimnasio si `badges.length === 0` (walk)
4. Pewter Museum — cobro de 50 monedas si no ha pagado (walk + confirmationMenu)
5. `vino-tinto-dado` — Soto Lezkairu: da SodaPop como "Vino Tinto" una sola vez (walk)

---

### Mecánicas Gen I (`app/move-helper.ts`)

- Stat stages (-6/+6): ataque, defensa, velocidad, especial, accuracy, evasion
- Críticos 10% (×2), high-crit ×8 (Slash, Razor Leaf, etc.)
- Drain (Absorb, Mega Drain, Dream Eater) y Recoil
- Flinch 10%/30%, Counter, Metronome, Leech Seed, Super Fang
- XP entrenadores ×1.5 (`app/xp-helper.ts`)
- Captura Gen I con 4 sacudidas (`app/pokeball-helper.ts`)
- 4 growth rates (`app/level-helper.ts`): Fast, Med-Fast, Med-Slow, Slow

**Bug KO resuelto (commit 93f3332):**
Stage 27: `endEncounter_(true)` t=1000ms → `recoverFromFainting()` t=1500ms.
`lastHealLocation` garantiza volver siempre al último centro visitado.

**Evolución:** `Evolution.tsx` llama `getLearnedMove()` post-evolución.
Si hay hueco: aprende automáticamente. Si 4 moves: avisa sin bloquear.

---

### Batallas online entre invitados

- `OnlineBattleNpc.tsx`: detecta A frente al scientist → `showOnlineBattleMenu()`
- `OnlineBattleMenu.tsx`: greeting → `listPlayers()` → select → `loadFromCloud()` → batalla
- `TrainerType.isOnline`: `defeatTrainer` no añade a `defeatedTrainers` → repetible
- Edge function `list-players`: `SELECT player_id, game_state FROM saves` → `{playerId, name, pokemonCount}[]`
- Centros con scientist: `viridian-city-pokemon-center`, `pewter-city-pokemon-center`, `route-3-pokemon-center` (pos `{x:10, y:2}`)

---

## Flujo de trabajo

```bash
# Compilar (SIEMPRE subshell):
(cd /Users/appsvelites/Projects/Project1May/game-src && \
  PUBLIC_URL=/game DISABLE_ESLINT_PLUGIN=true GENERATE_SOURCEMAP=false \
  node_modules/.bin/react-scripts build) 2>&1 | tail -20

# Copiar build (sustituir OLDHASH):
cp -r game-src/build/* public/game/
rm -f public/game/static/js/main.OLDHASH.js \
      public/game/static/js/main.OLDHASH.js.LICENSE.txt

# Commit y push:
git add public/game/ game-src/src/
git commit -m "feat: descripción"
git push origin local-src

# Sincronizar master:
git checkout master && git merge local-src --no-edit && git push origin master && git checkout local-src
```

---

## Archivos propios de WeddingBoy

| Archivo | Qué hace |
|---|---|
| `app/cloud-save.ts` | Supabase Edge Functions + WebAuthn passkey + `listPlayers()` |
| `app/level-helper.ts` | 4 fórmulas growth rate Gen I + `getLearnedMove()` |
| `app/move-helper.ts` | Mecánicas Gen I completas |
| `app/move-metadata.ts` | ~24k líneas, nombres oficiales ES (Wikidex) |
| `app/xp-helper.ts` | XP entrenadores ×1.5 |
| `app/pokeball-helper.ts` | Captura Gen I 4 sacudidas |
| `app/use-quests.ts` | 5 quests activas |
| `components/IntroVideo.tsx` | Video intro (saltable A/B) |
| `components/LoadScreen.tsx` | Passkey → save/load → oak-intro → name-picker |
| `components/OakIntro.tsx` | Typewriter 40ms/char, sprites por línea |
| `components/NameKeyboard.tsx` | Teclado 4 filas + FIN siempre visible |
| `components/LabPokeball.tsx` | Sprites pokéball (world coords) |
| `components/LabPokeballModal.tsx` | Modal starter (screen coords, fuera de BackgroundContainer) |
| `components/AcademyPokeball.tsx` / `AcademyPokeballModal.tsx` | Pokéball academia |
| `components/OnlineBattleNpc.tsx` | Detecta A frente al scientist |
| `components/OnlineBattleMenu.tsx` | Flujo batalla online |
| `components/Evolution.tsx` | Animación + `getLearnedMove()` post-evolución |
| `components/Pokedex.tsx` / `PokemonSummary.tsx` | Pokédex + ficha |
| `components/Trainer.tsx` | Sprite NPC con `npcFacings` override |
| `components/TrainerEncounter.tsx` | Encuentros + diálogos + `setNpcFacing` |
| `components/MoveSelect.tsx` | Selector movimiento a olvidar |
| `state/gameSlice.ts` | Estado global + `loadFromState()` + `lastHealLocation` |
| `state/uiSlice.ts` | Estado UI + `onlineBattleMenu` |
| `state/state-types.ts` | Interfaces `GameState`, `PokemonInstance`, etc. |
| `maps/map-types.ts` | `TrainerType.isOnline`, `MapType.onlineBattleNpc` |
| `maps/pallet-town.ts` | Pueblo Paleta — NPCs boda + Team Rocket |
| `maps/route-1.ts` | Ruta 1 · Camino al Soto — 5 NPCs |
| `maps/viridian-city.ts` | SOTO LEZKAIRU |
| `maps/viridian-forrest.ts` | EL BOSQUECILLO |
| `maps/pewter-city.ts` | VILLAMAYOR DE MONJARDÍN |
| `maps/pewter-city-gym.ts` | Bodega CASTILLO DE MONJARDÍN (Sergio + Marta) |
| `supabase/functions/list-players/index.ts` | Edge function lista de jugadores |

---

## Problemas conocidos y soluciones

### `cd X && comando` pierde el directorio con run_in_terminal
**Solución siempre**: `(cd /ruta/absoluta && comando)`

### react-scripts: "Cannot find module 'typescript'"
CWD no es `game-src/`. Usar subshell.

### Bucle infinito en pantalla passkey
Tras primer fallo: `registrationFailed=true` → opción "Jugar sin guardar" (UUID local).

### Modal/overlay dentro de BackgroundContainer no queda centrado
BackgroundContainer tiene `transform: translate(...)`. Renderizar modal fuera en `Game.tsx`.
Compartir estado via Redux + incluir flag en `selectMenuOpen`.

### `showText` + setTimeout no es seguro
```typescript
dispatch(showTextThenAction({ text: ["..."], action: () => doSomething() }));
```

### Trainers desaparecían tras derrota (resuelto commit 80d402f)
`Game.tsx` ya no filtra por `defeatedTrainers`. Solo `hideCondition` oculta trainers.

### Bug KO: combate continuaba tras KO (resuelto commit 93f3332)
Stage 27 orden correcto: `endEncounter_(true)` t=1000ms, `recoverFromFainting()` t=1500ms.

### Pokéballs del lab usan completedQuests, no collectedItems
`completeQuest("lab-starter-taken-{pokemonId}")` — estado en `completedQuests[]`.

---

## Roadmap

### Motor ✅
- [x] Base jugable (chase-manning/pokemon-js)
- [x] Integración Next.js/Vercel, traducciones ES
- [x] Mecánicas Gen I completas (growth rates, XP, stat stages, críticos, captura, etc.)
- [x] Video intro, intro Oak, teclado nombre, layout responsive
- [x] Passkey/Face ID con fallback sin bucles
- [x] NPCs se giran al hablar, trainers permanecen visibles
- [x] Bug KO + lastHealLocation
- [x] Evolución aprende movimientos
- [x] Batallas online entre invitados

### Narrativa ✅ (todos los actos implementados)
- [x] Acto I: Pueblo Paleta / DESTILERÍA DEL PROF. OAK
- [x] Acto II: Ruta 1 · Camino al Soto (5 NPCs)
- [x] Acto III: SOTO LEZKAIRU
- [x] Acto IV: EL BOSQUECILLO
- [x] Acto V: VILLAMAYOR DE MONJARDÍN + Bodega CASTILLO DE MONJARDÍN

### Personalización visual pendiente 🔲
- [ ] Pantalla de título: logos de la pareja y fecha
- [ ] Video de intro: clip real de la boda
- [ ] Compartir enlace con invitados

---

## Sistema de guardado (Supabase + WebAuthn)

Passkey (Face ID / huella) → UUID de usuario → `wedding_user_id` en localStorage → Supabase Edge Functions.
Sin WebAuthn: UUID anónimo local.

### Esquema Supabase
```sql
CREATE TABLE saves (player_id UUID PRIMARY KEY, game_state JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW());
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_saves" ON saves FOR ALL USING (true);
```

### Variables de entorno (`game-src/.env`, no commitear)
```bash
REACT_APP_SUPABASE_URL=https://<project-ref>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<anon-key>
```

---

## Reglas legales

- Motor fan-made, licencia MIT (chase-manning/pokemon-js)
- Sin ROMs ni assets de Nintendo / Game Freak / The Pokémon Company

---

## Comandos

```bash
npm run dev                                    # Next.js local → localhost:3000
(cd game-src && npx tsc --noEmit)              # TypeScript check sin compilar
```

## Controles

| Acción | Teclado |
|---|---|
| Mover | Flechas |
| Confirmar / Hablar | Z / Enter (Botón A) |
| Cancelar / Menú | X / Escape (Botón B) |
| Start | Enter |
| Select | Shift |
