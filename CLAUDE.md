# WeddingBoy — Invitación de Boda estilo Game Boy

## Objetivo del proyecto

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
| Base del motor | [chase-manning/pokemon-js](https://github.com/chase-manning/pokemon-js) — MIT |
| Despliegue | Vercel |
| DB/Auth | Supabase (partidas cloud + WebAuthn passkey) |

---

## Cómo funciona la integración

```
/                     → Next.js redirige a /game/index.html
/game/index.html      → juego completo (build estático de pokemon-js)
/game/static/js/...   → JS del juego (React bundle)
/game/static/css/...  → CSS del juego
```

El juego vive en `/public/game/` como archivos estáticos.  
Next.js los sirve automáticamente sin configuración adicional.

---

## Estructura de carpetas

```
/
├── app/                        # Next.js shell (mínimo)
│   ├── layout.tsx
│   ├── page.tsx                # Redirect a /game/index.html
│   └── globals.css
├── game-src/                   # ← SOURCE del juego (editar aquí)
│   └── src/                   # React 18 + CRA
├── lib/supabase/               # Cliente Supabase (futuras funciones)
├── public/game/                # ← BUILD del juego (no editar directamente)
└── package.json                # Next.js deps
```

> `game-src/` está en el repo (comprometido en `3e9990a`). No hay que clonarlo.
> El `tsconfig.json` raíz excluye `game-src/` para que Next.js no intente compilarlo.

---

## Arquitectura interna del juego (game-src/)

### Estado global: Redux Toolkit

Dos slices:

**`game` slice** (`state/gameSlice.ts`) — estado del mundo:
```
pos             posición del jugador {x, y}
map             mapa actual (MapId enum)
direction       dirección del jugador (up/down/left/right)
moving          bool
jumping         bool (al saltar vallas)
name            nombre del jugador (default: "Blue")
pokemon         array de PokemonInstance (equipo, máx 6)
pc              array de PokemonInstance (almacenados)
activePokemonIndex  índice del primer pokémon activo
inventory       array de {item, amount}
money           número
trainerEncounter    TrainerType | undefined
pokemonEncounter    PokemonEncounterType | undefined
defeatedTrainers    string[] (IDs "mapa-x-y")
collectedItems      string[] (IDs "mapa-x-y")
completedQuests     string[] (IDs de quests completadas)
seenPokemon         number[] (IDs vistos en Pokédex)
caughtPokemon       number[] (IDs capturados)
npcFacings          Record<string, Direction>  (giros temporales de NPCs, ID = "mapId-x-y")
```

**Estado inicial** (`initialState` en gameSlice.ts):
- **Sin pokémon** en equipo ni en PC (arrays vacíos)
- Mapa: `PalletTownHouseA2F` pos (3,6)
- Inventario: 2 PokéBalls
- `defeatedTrainers: ["pallet-town-lab-5-1", "pallet-town-house-a-1f-6-3", "pallet-town-10-0", "pallet-town-11-0"]`
  - `pallet-town-lab-5-1`: Oak pre-derrotado (evita combate)
  - `pallet-town-house-a-1f-6-3`: madre pre-derrotada (para `persistent:true` → muestra `outtro` al hablar)
  - `pallet-town-10-0`, `pallet-town-11-0`: Team Rocket norte pre-derrotados
- `npcFacings: {}` (se limpia al cambiar de mapa)

**`ui` slice** (`state/uiSlice.ts`) — estado de la interfaz:
```
text                string[] | null     (caja de texto activa)
startMenu           bool
itemsMenu           bool
playerMenu          bool
titleMenu           bool                (pantalla de título visible)
loadMenu            bool
gameboyMenu         bool
pokemonCenterMenu   bool
pcMenu              bool
pokeMartMenu        bool
textThenAction      {text, action} | null  (texto → ejecutar función)
learningMove        objeto | null
blackScreen         bool
confirmationMenu    {preMessage, postMessage, confirm, cancel} | null
evolution           {index, evolveToId} | null
```

**Save/Load**: `localStorage` con la clave = nombre del jugador.  
`dispatch(save())` → guarda. `dispatch(load())` → carga.

---

### Sistema de eventos: mitt

`app/emitter.ts` exporta un bus de eventos global con estos eventos:

| Evento | Cuándo se emite |
|---|---|
| `up/down/left/right` | cada tick de movimiento |
| `start-up/start-down/...` | inicio del movimiento en esa dirección |
| `stop-up/stop-down/...` | fin del movimiento |
| `a` | botón A pulsado |
| `b` | botón B pulsado |
| `start` | botón START pulsado |
| `select` | botón SELECT pulsado |
| `stop-moving` | jugador para |
| `enter-door` | al entrar en un edificio |
| `heal-pokemon` | al curar en el Centro |

Cualquier componente puede suscribirse con `useEvent(Event.A, callback)`.

---

### Sistema de mapas (`src/maps/`)

Cada mapa es un objeto TypeScript con esta estructura:

```typescript
interface MapType {
  name: string           // Nombre visible
  image: string          // PNG de fondo (importado como asset)
  height: number         // Alto en tiles
  width: number          // Ancho en tiles
  start: {x, y}          // Posición inicial del jugador

  // Colisiones
  walls: Record<fila, columna[]>       // Tiles bloqueantes
  fences: Record<fila, columna[]>      // Vallas (se puede saltar hacia abajo)

  // Hierba alta (activa encuentros aleatorios)
  grass: Record<fila, columna[]>

  // Texto interactivo (carteles, personas estáticas)
  text: Record<fila, Record<col, string[]>>

  // Transiciones entre mapas
  maps: Record<fila, Record<col, MapId>>        // Tile → cargar mapa en su start
  teleports: Record<fila, Record<col, {map, pos}>>  // Tile → mapa + posición exacta
  exits: Record<fila, columna[]>               // Tiles de salida del mapa
  exitReturnMap: MapId                          // A qué mapa van esos exits
  exitReturnPos: {x, y}                         // En qué posición

  // Opcionales
  music: string                    // MP3 de la música de fondo
  encounters: EncountersType       // Tablas de encuentros salvajes
  cave: boolean                    // Flag para tratarlo como cueva
  recoverLocation: {x, y}          // Dónde respawnea el jugador tras KO
  pokemonCenter: {x, y}            // Posición del mostrador del Centro
  pc: {x, y}                       // Posición del PC
  store: {x, y}                    // Posición de la tienda
  storeItems: ItemType[]           // Qué vende la tienda
  spinners: Record<fila, Record<col, Direction>>  // Entrenadores que giran
  stoppers: Record<fila, columna[]>
  trainers: TrainerType[]          // Entrenadores NPCs
  items: MapItemType[]             // Objetos recogibles en el suelo
}
```

**Los 33 mapas actuales:**
- Pallet Town + Lab + 2 casas
- Viridian City + Gym + PokéCenter + PokéMart + Academia + Casa NPC
- Route 1, Route 2, Route 22, Route 3 + PokéCenter
- Gate House, Route 2 Gate, Route 2 Gate North
- Viridian Forest
- Pewter City + Gym + PokéCenter + PokéMart + 2 casas NPC + Museo 1F/2F
- Mt. Moon 1F/2F/3F

**Para añadir un mapa se requieren 3 cambios:**
1. Añadir valor al enum `MapId` en `maps/map-types.ts`
2. Crear archivo del mapa (copiar `maps/template.ts`)
3. Importar y registrar en `maps/map-data.ts`

---

### Sistema de NPCs (`app/npcs.ts`)

```typescript
interface NpcType {
  canBattle: boolean       // si true, necesita portrait
  canWalk: boolean         // si true, necesita sprites de animación
  name: string
  portrait?: string        // imagen de portrait (batalla/diálogo)
  sprites: {
    down, up, left, right          // sprites estáticos
    downWalk1?, downWalk2?         // animación caminando
    upWalk1?, upWalk2?
    leftWalk1?, rightWalk1?
  }
}
```

**40 tipos de NPC disponibles** con sprites ya integrados:
`ash`, `oak`, `rival`, `beauty`, `birdKeeper`, `blackBelt`, `bugCatcher`,
`burglar`, `channeler`, `aceTrainerMale/Female`, `cueBall`, `engineer`,
`fisher`, `gambler`, `gentleman`, `hiker`, `jrTrainerMale/Female`, `juggler`,
`lass`, `pokeManiac`, `psychic`, `rocker`, `teamRocketGrunt`, `sailor`,
`scientist`, `superNerd`, `swimmer`, `tamer`, `youngster`, `biker`,
+ líderes de gimnasio: `brock`, `misty`, `ltSurge`, `erica`, `koga`, `sabrina`, `blaine`, `giovanni`

**Para la boda, los más útiles:**
- Novio formal: `gentleman`, `oak`, `aceTrainerMale`
- Novia formal: `beauty`, `misty`, `erica`, `aceTrainerFemale`
- Invitados: `youngster`, `lass`, `sailor`, `fisher`
- Fotógrafo: `scientist`

---

### Entrenadores / NPCs con diálogo

Los NPCs que interactúan son `TrainerType`:

```typescript
interface TrainerType {
  npc: NpcType          // sprite y nombre
  pokemon: [{id, level}]  // equipo (necesario aunque no luchen realmente)
  facing: Direction       // dirección que miran
  pos: {x, y}             // posición en el mapa (en tiles)
  intro: string[]         // diálogo al acercarse / al combatir
  outtro: string[]        // diálogo tras la batalla
  money: number           // dinero que da al ganar (0 para NPCs de boda)
  postGame?: { message: string[], items?: ItemType[] }  // post-batalla
}
```

El jugador ve el `intro` cuando entra en la línea de visión del entrenador (radio: **5 tiles**).  
Si el entrenador aún no ha sido derrotado → combate automático.  
Si ya fue derrotado → sólo dice el `postGame.message`.

> **Para NPCs de boda sin combate**: el sistema no tiene modo "hablar sin combate" nativo para entrenadores. La alternativa es usar el campo `text` del mapa (signs interactivos) o quests tipo `"talk"` en `use-quests.ts`.

---

### Sistema de diálogos

Hay dos mecanismos:

1. **`text` en el mapa** — tiles que al pulsarlos muestran texto. Formato:
   ```typescript
   text: {
     5: { 3: ["Línea 1", "Línea 2"] }  // fila 5, col 3
   }
   ```
   Cualquier tile con coordenadas en `text` muestra el texto al presionar A.

2. **`TrainerType.intro/outtro/postGame`** — diálogo de entrenadores.  
   Arrays de strings. Se muestran uno a uno en la caja de texto estándar.

**No hay diálogo ramificado nativo.** La única "bifurcación" disponible es `confirmationMenu` (Sí/No) via el sistema de quests.

---

### Sistema de quests (`app/use-quests.ts`)

```typescript
interface QuestType {
  trigger: "talk" | "walk"          // al hablar con NPC o pisar tile
  map: MapId                         // en qué mapa se activa
  positions: Record<fila, col[]>     // tiles que lo disparan
  active: () => boolean              // condición (¿completada? ¿badge obtenida?)
  text: string[]                     // texto mostrado
  action: () => void                 // función ejecutada tras el texto
}
```

Las quests pueden:
- Mostrar texto
- Ejecutar código arbitrario de Redux (mover al jugador, dar dinero, teletransportar, etc.)
- Mostrar `confirmationMenu` (Sí/No con callbacks)
- Marcar quests como completadas (`dispatch(completeQuest("id"))`)
- **Bloquear al jugador** con `setPos` devolviéndolo a posición anterior (quest walk)

**Quests activas actualmente:**
1. **Pewter City** — guía hacia el gimnasio (walk, si no tiene badges)
2. **Pewter Museum** — cobro de entrada (walk, si no ha pagado)
3. **Pallet Town norte** — bloqueo si `pokemon.length === 0` (walk): texto "¡Viva el vino!..." y devuelve al jugador a y:2

---

### Sistema de combates

**Encuentros salvajes**: al caminar sobre hierba (`grass` tiles), se activa con probabilidad `encounters.walk.rate`. El Pokémon encontrado se decide por tabla de probabilidades en `location-data.json`.

**Encuentros de entrenador**: al entrar en la línea de visión de un trainer (5 tiles frontales), si no está en `defeatedTrainers`, se inicia un combate. Los `spinners` rotan continuamente y pueden activarse al pasar cerca.

**Flujo de combate**: `encounterTrainer(trainerData)` → Redux → el componente `TrainerEncounter` detecta el cambio y renderiza la escena de combate.

**La lógica de combate** incluye: por turnos, cálculo de daño (stats + tipos + movimientos), efectividad de tipos, críticos (10%), lanzar Pokéballs, usar ítems, huir, KO y recuperación.

---

### Pantalla de título

**Archivo**: `components/TitleScreen.tsx`

Muestra 3 imágenes PNG:
- `assets/title-screen/pokemon.png` → el logo del juego
- `assets/title-screen/version.png` → el subtítulo "versión"
- `assets/title-screen/player.png` → el personaje jugador

+ Un Pokémon aleatorio (#1-151) que desfila de derecha a izquierda y cambia cada 5 segundos.

**Para personalizar**: reemplazar esos 3 PNG por imágenes con el nombre de la pareja y la fecha.

---

### Criaturas / Pokémon

- **151 criaturas** con ID 1-151
- Cada una tiene: nombre, tipos, stats base (HP/Ataque/Defensa/Velocidad/Especial), sprites (front + back)
- Los stats reales se calculan en `app/use-pokemon-stats.ts` con fórmulas Gen1
- Las evoluciones por piedra están hardcodeadas en `use-item-data.ts`

---

### Ítems

**100+ ítems** definidos: pociones, Pokéballs, piedras evolutivas, TMs/HMs, medallas, llaves de historia.
Cada ítem tiene: nombre, precio, precio de venta, si es consumible, si es usable en combate, acción al usarlo.

---

## Dónde editar el juego

> **`game-src/` está en el repo** (commit `3e9990a`, rama `local-src`).
> El source se edita en `game-src/src/`. El build va a `public/game/`.
> Next.js no toca `game-src/` — está excluido en el `tsconfig.json` raíz.

### Primera vez (instalar dependencias del juego)

```bash
# Solo la primera vez, o tras clonar el repo:
cd game-src && npm install --legacy-peer-deps
```

### Flujo de trabajo habitual (editar → compilar → commitear)

```bash
# 1. Editar lo que quieras en game-src/src/

# 2. Compilar — OBLIGATORIO usar subshell (cd sin subshell se pierde en run_in_terminal):
(cd /ruta/absoluta/al/repo/game-src && \
  PUBLIC_URL=/game DISABLE_ESLINT_PLUGIN=true GENERATE_SOURCEMAP=false \
  node_modules/.bin/react-scripts build) 2>&1 | tail -20

# 3. Ver el hash del bundle nuevo:
ls game-src/build/static/js/main.*.js

# 4. Copiar el build y borrar el bundle anterior (sustituir OLDHASH):
cp -r game-src/build/* public/game/
rm -f public/game/static/js/main.OLDHASH.js \
      public/game/static/js/main.OLDHASH.js.LICENSE.txt

# 5. Commitear y pushear:
git add public/game/ game-src/src/
git commit -m "feat: <descripción del cambio>"
git push origin local-src
```

> ⚠️ Nunca usar `npx react-scripts build` ni `cd X && cmd` sin subshell — el CWD se pierde.
> ⚠️ El hash del bundle cambia con cada compilación. Borrar el bundle antiguo para no acumular JS obsoleto.

### Archivos propios de WeddingBoy (NO son del repo original)

Estos archivos han sido creados/modificados para la boda y están en `game-src/src/`:

| Archivo | Qué hace |
|---|---|
| `app/cloud-save.ts` | Supabase Edge Functions + WebAuthn passkey (save/load remoto) |
| `app/level-helper.ts` | Fórmula XP Gen I corregida (Medium-Fast: `nextLevel³ − currentLevel³`) |
| `app/move-helper.ts` | Daño Gen I completo: stat stages (20 movimientos), críticos 10%, efectividad |
| `app/move-metadata.ts` | ~24k líneas, nombres oficiales ES de movimientos (Wikidex) |
| `app/xp-helper.ts` | XP de entrenadores × 1.5 (bonus Gen I) |
| `app/pokeball-helper.ts` | Fórmula de captura Gen I con 4 sacudidas reales |
| `app/use-quests.ts` | Sistema de quests + **quest norte Pallet Town** (bloquea sin pokémon) |
| `components/IntroVideo.tsx` | Video intro antes del TitleScreen; se reproduce siempre (saltable A/B) |
| `components/LoadScreen.tsx` | Passkey **obligatorio** → save/load → oak-intro → name-picker → done |
| `components/OakIntro.tsx` | Intro Prof. Oak con typewriter (40ms/char), sprites por línea |
| `components/NameKeyboard.tsx` | Teclado Game Boy: 4 filas (A-Z + DEL) + ⌨ TECLADO y FIN siempre visibles |
| `components/LabPokeball.tsx` | Pokéballs interactivas del lab (starters) con confirmación sprite+Sí/No |
| `components/Pokedex.tsx` | Pokédex lista + ficha detalle sin solapamientos |
| `components/PokemonSummary.tsx` | Ficha pokémon (pág1: estado, pág2: habilidades), layout limpio |
| `state/gameSlice.ts` | `loadFromState()` para cloud save; estado inicial sin pokémon |
| `maps/lab.ts` | Oak como NPC (pos 5,2); mesa con 3 pokéballs en y:3 x:2,4,5 |
| `maps/pallet-town.ts` | NPCs boda (youngster + lass), tiles borrachos zona norte |
| `maps/house-a-1f.ts` | Madre (beauty) bloqueando salida (pos 2,6) con Ratata lvl 1 |

### Guía rápida de modificaciones

| Qué quiero cambiar | Archivo en `game-src/src/` | Campo |
|---|---|---|
| Nombre del jugador por defecto | `state/gameSlice.ts` | `initialState.name` |
| Pokémon iniciales del jugador | `state/gameSlice.ts` | `initialState.pokemon` (array vacío = sin starters) |
| Mapa de inicio | `state/gameSlice.ts` | `initialState.map` + `pos` |
| Texto de un cartel | `maps/<mapa>.ts` | campo `text` |
| Diálogo de un entrenador NPC | `maps/<mapa>.ts` | `trainers[i].intro/outtro` |
| Música de un mapa | `maps/<mapa>.ts` | campo `music` (MP3 en assets/) |
| Mapa de fondo (imagen) | `maps/<mapa>.ts` | campo `image` (PNG en assets/) |
| Añadir un NPC nuevo | `maps/<mapa>.ts` | añadir a array `trainers` |
| Logo pantalla de título | `assets/title-screen/pokemon.png` | reemplazar PNG |
| Subtítulo pantalla de título | `assets/title-screen/version.png` | reemplazar PNG |
| Nombre de una criatura | `app/pokemon-metadata.ts` | campo `name` en cada entrada |
| Quest / evento con condición | `app/use-quests.ts` | añadir nueva entrada |
| Nuevo mapa completo | `maps/template.ts` + 3 cambios | ver sección "Sistema de mapas" |
| Diálogo intro Prof. Oak | `components/OakIntro.tsx` | arrays `BASE_DIALOGUE` y `POST_NAME_DIALOGUE` |
| Textos cloud save | `components/LoadScreen.tsx` | strings inline |
| URL de Supabase | `game-src/.env` | `REACT_APP_SUPABASE_URL` |
| Video de introducción | `public/game/static/media/intro.*.mp4` | reemplazar el archivo MP4 |

---

## Problemas conocidos y soluciones probadas

### Bucle infinito en pantalla passkey (`require-passkey`)
Ocurre cuando la Edge Function `webauthn-register-finish` falla: iOS registra la passkey  
localmente pero el servidor devuelve error → `webauthnRegister()` retorna `null` →  
se vuelve a `require-passkey` sin escape. **Solución**: tras primer fallo, `registrationFailed`  
se pone a `true` y la segunda opción cambia a "Jugar sin guardar" que crea un UUID  
local con `crypto.randomUUID()` sin depender de Supabase.

### `cd X && comando` pierde el directorio con run_in_terminal
El tool colapsa o simplifica `cd X && cmd`. **Solución siempre**: subshell:
```bash
(cd /ruta/absoluta && comando)
```

### react-scripts falla con "Cannot find module 'typescript'"
Ocurre cuando el CWD no es `game-src/`. react-scripts sube al padre buscando node_modules  
y no encuentra typescript. **Solución**: subshell con `cd game-src`.

### Trainers siempre inician combate (no hay NPCs "solo diálogo")
El engine activa combate cuando el jugador entra en el radio de visión (5 tiles) de cualquier  
trainer no derrotado. **Para bloquear sin combate** → usar quest tipo `"walk"` con `setPos`.  
**Para texto decorativo** → usar `text` del mapa (tiles de texto, no trainers).

### Pokéballs del lab no usan `collectItem` (que requiere ItemType real)
Usan `completeQuest("lab-starter-taken-{id}")`. El estado vive en `completedQuests[]`.  
El componente `LabPokeball.tsx` exporta `STARTERS` y `starterQuestId` para que
`LabPokeballModal.tsx` pueda usarlos sin importar el mapa.

### `showText` + setTimeout no es seguro para texto → acción
El usuario puede cerrar el texto antes de que se ejecute el setTimeout. Siempre usar:
```typescript
dispatch(showTextThenAction({ text: ["..."], action: () => doSomething() }));
```

### Modal/overlay dentro del BackgroundContainer no queda centrado en pantalla
`BackgroundContainer` aplica `transform: translate(-pos.x, -pos.y)` para hacer scroll
del mapa. Todo lo que se renderiza dentro se desplaza con el mapa.

**Solución**: renderizar el modal **fuera** de `BackgroundContainer` en `Game.tsx`.
Compartir el estado via Redux (campo en `uiSlice`) en vez de estado local del componente.

Ejemplo implementado: `LabPokeballModal.tsx` lee `pokeballCardId` de `uiSlice` y se
monta después del `</BackgroundContainer>` en `Game.tsx`.

### Freezing del jugador durante un overlay/modal propio
Si el modal no usa `showText`/`confirmationMenu` de uiSlice, el movimiento no se
congela automáticamente. **Solución**: añadir el flag del modal a `selectMenuOpen`:
```typescript
// En uiSlice.ts:
export const selectMenuOpen = (state: RootState) =>
  state.ui.startMenu || ... ||
  state.ui.pokeballCardId !== null;  // ← congela movimiento
```

### NPCs que no se giran al hablar
`Trainer.tsx` usa `npcFacings[trainerId]` como override de `trainer.facing`.
El ID es `"${mapId}-${pos.x}-${pos.y}"`. Si el NPC está en `defeatedTrainers`
con `persistent:true`, `TrainerEncounter.tsx` dispatcha `setNpcFacing` antes de
mostrar el `outtro`. El mapa de `npcFacings` se limpia al cambiar de mapa.

## Reglas legales y creativas

- ✅ Motor fan-made, licencia MIT (chase-manning/pokemon-js)
- ✅ No se usan ROMs ni assets de Nintendo / Game Freak / The Pokémon Company
- ✅ Los sprites son originales del repo base

---

## Comandos

```bash
# Servidor local Next.js
npm run dev
# → http://localhost:3000 (redirige a /game/index.html)

# TypeScript check del juego (sin compilar)
cd game-src && npx tsc --noEmit

# Modo debug del juego (movimiento rápido, ver colisiones)
# En game-src/src/app/constants.ts → DEBUG_MODE = true (no commitear)
```

---

## Controles

| Acción | Teclado | On-screen |
|---|---|---|
| Mover | Flechas ← ↑ ↓ → | D-pad |
| Confirmar / Hablar | Z / Enter | Botón A |
| Cancelar / Menú | X / Escape | Botón B |
| Start | Enter | Botón START |
| Select | Shift | Botón SELECT |

---

## Roadmap

- [x] Base jugable en navegador (chase-manning/pokemon-js)
- [x] Integración en Next.js / Vercel
- [x] Traducciones al español (batallas, menús, diálogos, nombres de movimientos oficiales ES)
- [x] Mecánicas Gen I corregidas (XP, stat stages, captura, HP nivel)
- [x] Video de intro por sesión (saltable con A/B)
- [x] Intro Oak con typewriter + sprites por línea
- [x] Teclado de nombre (4 filas + FIN siempre visible junto a ⌨ TECLADO)
- [x] Layout Game Boy Color responsive (cqw, aspect ratio 3:5)
- [x] Flujo narrativo primer acto: habitación → madre → laboratorio → Route 1
- [x] Starters interactivos en el laboratorio (Bulbasaur, Charmander, Squirtle)
- [x] Passkey/Face ID obligatorio para guardar (necesario para confirmación boda)
- [x] Pokédex y ficha Pokémon sin solapamientos de UI
- [x] Menú batalla navegación lineal (Up/Down recorre las 4 opciones)
- [x] Todos los textos en español sin Lorem ipsum
- [x] `game-src/` añadido al repo GitHub
- [ ] Personalizar pantalla de título (logos de la pareja y fecha)
- [ ] Personalizar video de intro con clip real de la boda
- [ ] Compartir enlace con invitados

---

## Sistema de guardado (Supabase + WebAuthn)

Cada invitado registra una passkey (Face ID / huella) la primera vez.  
La passkey sirve como autenticación para recuperar su partida en futuras visitas.  
Sin contraseñas, sin PII, sin login convencional.

**Flujo**:
1. Primera visita con WebAuthn disponible → `require-passkey` → registro obligatorio
2. Se genera un UUID de usuario → se guarda en `localStorage` como `wedding_user_id`
3. La partida se sincroniza con Supabase (Edge Functions)
4. Visitas siguientes → `webauthnAuth()` recupera el UUID → carga la partida

**Sin WebAuthn** (navegador antiguo): crea UUID anónimo sin passkey.

### Esquema Supabase

```sql
CREATE TABLE saves (
  player_id  UUID        PRIMARY KEY,
  game_state JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_saves" ON saves FOR ALL USING (true);
```

### Variables de entorno

```bash
REACT_APP_SUPABASE_URL=https://<project-ref>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<anon-key>
```

En `game-src/.env` (no commitear).

**Jugable en**: cualquier navegador, escritorio y móvil.  
**Desplegado en**: Vercel (rama `local-src` → producción).

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Shell (wrapper) | Next.js 16 (App Router) + TypeScript |
| Juego | React 18 + TypeScript + Redux Toolkit + styled-components (CRA build) |
| Base del motor | [chase-manning/pokemon-js](https://github.com/chase-manning/pokemon-js) — MIT |
| Despliegue | Vercel |
| DB/Auth (reservado) | Supabase |

---

## Cómo funciona la integración

```
/                     → Next.js redirige a /game/index.html
/game/index.html      → juego completo (build estático de pokemon-js)
/game/static/js/...   → JS del juego (React bundle)
/game/static/css/...  → CSS del juego
```

El juego vive en `/public/game/` como archivos estáticos.  
Next.js los sirve automáticamente sin configuración adicional.

---

## Estructura de carpetas

```
/
├── app/                        # Next.js shell (mínimo)
│   ├── layout.tsx
│   ├── page.tsx                # Redirect a /game/index.html
│   └── globals.css
├── game-src/                   # ← SOURCE del juego (editar aquí)
│   └── src/                   # React 18 + CRA
├── lib/supabase/               # Cliente Supabase (futuras funciones)
├── public/game/                # ← BUILD del juego (no editar directamente)
└── package.json                # Next.js deps
```

> `game-src/` está en el repo (comprometido en `3e9990a`). No hay que clonarlo.
> El `tsconfig.json` raíz excluye `game-src/` para que Next.js no intente compilarlo.

---

## Arquitectura interna del juego (game-src/)

### Estado global: Redux Toolkit

Dos slices:

**`game` slice** (`state/gameSlice.ts`) — estado del mundo:
```
pos             posición del jugador {x, y}
map             mapa actual (MapId enum)
direction       dirección del jugador (up/down/left/right)
moving          bool
jumping         bool (al saltar vallas)
name            nombre del jugador (default: "Blue")
pokemon         array de PokemonInstance (equipo, máx 6)
pc              array de PokemonInstance (almacenados)
activePokemonIndex  índice del primer pokémon activo
inventory       array de {item, amount}
money           número
trainerEncounter    TrainerType | undefined
pokemonEncounter    PokemonEncounterType | undefined
defeatedTrainers    string[] (IDs "mapa-x-y")
collectedItems      string[] (IDs "mapa-x-y")
completedQuests     string[] (IDs de quests completadas)
```

**`ui` slice** (`state/uiSlice.ts`) — estado de la interfaz:
```
text                string[] | null     (caja de texto activa)
startMenu           bool
itemsMenu           bool
playerMenu          bool
titleMenu           bool                (pantalla de título visible)
loadMenu            bool
gameboyMenu         bool
pokemonCenterMenu   bool
pcMenu              bool
pokeMartMenu        bool
textThenAction      {text, action} | null  (texto → ejecutar función)
learningMove        objeto | null
blackScreen         bool
confirmationMenu    {preMessage, postMessage, confirm, cancel} | null
evolution           {index, evolveToId} | null
```

**Save/Load**: `localStorage` con la clave = nombre del jugador.  
`dispatch(save())` → guarda. `dispatch(load())` → carga.

---

### Sistema de eventos: mitt

`app/emitter.ts` exporta un bus de eventos global con estos eventos:

| Evento | Cuándo se emite |
|---|---|
| `up/down/left/right` | cada tick de movimiento |
| `start-up/start-down/...` | inicio del movimiento en esa dirección |
| `stop-up/stop-down/...` | fin del movimiento |
| `a` | botón A pulsado |
| `b` | botón B pulsado |
| `start` | botón START pulsado |
| `select` | botón SELECT pulsado |
| `stop-moving` | jugador para |
| `enter-door` | al entrar en un edificio |
| `heal-pokemon` | al curar en el Centro |

Cualquier componente puede suscribirse con `useEvent(Event.A, callback)`.

---

### Sistema de mapas (`src/maps/`)

Cada mapa es un objeto TypeScript con esta estructura:

```typescript
interface MapType {
  name: string           // Nombre visible
  image: string          // PNG de fondo (importado como asset)
  height: number         // Alto en tiles
  width: number          // Ancho en tiles
  start: {x, y}          // Posición inicial del jugador
  
  // Colisiones
  walls: Record<fila, columna[]>       // Tiles bloqueantes
  fences: Record<fila, columna[]>      // Vallas (se puede saltar hacia abajo)
  
  // Hierba alta (activa encuentros aleatorios)
  grass: Record<fila, columna[]>
  
  // Texto interactivo (carteles, personas estáticas)
  text: Record<fila, Record<col, string[]>>
  
  // Transiciones entre mapas
  maps: Record<fila, Record<col, MapId>>        // Tile → cargar mapa en su start
  teleports: Record<fila, Record<col, {map, pos}>>  // Tile → mapa + posición exacta
  exits: Record<fila, columna[]>               // Tiles de salida del mapa
  exitReturnMap: MapId                          // A qué mapa van esos exits
  exitReturnPos: {x, y}                         // En qué posición

  // Opcionales
  music: string                    // MP3 de la música de fondo
  encounters: EncountersType       // Tablas de encuentros salvajes
  cave: boolean                    // Flag para tratarlo como cueva
  recoverLocation: {x, y}          // Dónde respawnea el jugador tras KO
  pokemonCenter: {x, y}            // Posición del mostrador del Centro
  pc: {x, y}                       // Posición del PC
  store: {x, y}                    // Posición de la tienda
  storeItems: ItemType[]           // Qué vende la tienda
  spinners: Record<fila, Record<col, Direction>>  // Entrenadores que giran
  stoppers: Record<fila, columna[]>
  trainers: TrainerType[]          // Entrenadores NPCs
  items: MapItemType[]             // Objetos recogibles en el suelo
}
```

**Los 33 mapas actuales:**
- Pallet Town + Lab + 2 casas
- Viridian City + Gym + PokéCenter + PokéMart + Academia + Casa NPC
- Route 1, Route 2, Route 22, Route 3 + PokéCenter
- Gate House, Route 2 Gate, Route 2 Gate North
- Viridian Forest
- Pewter City + Gym + PokéCenter + PokéMart + 2 casas NPC + Museo 1F/2F
- Mt. Moon 1F/2F/3F

**Para añadir un mapa se requieren 3 cambios:**
1. Añadir valor al enum `MapId` en `maps/map-types.ts`
2. Crear archivo del mapa (copiar `maps/template.ts`)
3. Importar y registrar en `maps/map-data.ts`

---

### Sistema de NPCs (`app/npcs.ts`)

```typescript
interface NpcType {
  canBattle: boolean       // si true, necesita portrait
  canWalk: boolean         // si true, necesita sprites de animación
  name: string
  portrait?: string        // imagen de portrait (batalla/diálogo)
  sprites: {
    down, up, left, right          // sprites estáticos
    downWalk1?, downWalk2?         // animación caminando
    upWalk1?, upWalk2?
    leftWalk1?, rightWalk1?
  }
}
```

**40 tipos de NPC disponibles** con sprites ya integrados:
`ash`, `oak`, `rival`, `beauty`, `birdKeeper`, `blackBelt`, `bugCatcher`,
`burglar`, `channeler`, `aceTrainerMale/Female`, `cueBall`, `engineer`,
`fisher`, `gambler`, `gentleman`, `hiker`, `jrTrainerMale/Female`, `juggler`,
`lass`, `pokeManiac`, `psychic`, `rocker`, `teamRocketGrunt`, `sailor`,
`scientist`, `superNerd`, `swimmer`, `tamer`, `youngster`, `biker`,
+ líderes de gimnasio: `brock`, `misty`, `ltSurge`, `erica`, `koga`, `sabrina`, `blaine`, `giovanni`

**Para la boda, los más útiles:**
- Novio formal: `gentleman`, `oak`, `aceTrainerMale`
- Novia formal: `beauty`, `misty`, `erica`, `aceTrainerFemale`
- Invitados: `youngster`, `lass`, `sailor`, `fisher`
- Fotógrafo: `scientist`

---

### Entrenadores / NPCs con diálogo

Los NPCs que interactúan son `TrainerType`:

```typescript
interface TrainerType {
  npc: NpcType          // sprite y nombre
  pokemon: [{id, level}]  // equipo (necesario aunque no luchen realmente)
  facing: Direction       // dirección que miran
  pos: {x, y}             // posición en el mapa (en tiles)
  intro: string[]         // diálogo al acercarse / al combatir
  outtro: string[]        // diálogo tras la batalla
  money: number           // dinero que da al ganar
  postGame?: { message: string[], items?: ItemType[] }  // post-batalla
}
```

El jugador ve el `intro` cuando entra en la línea de visión del entrenador (radio: **5 tiles**).  
Si el entrenador aún no ha sido derrotado → combate automático.  
Si ya fue derrotado → sólo dice el `postGame.message`.

> **Para NPCs de boda sin combate**: el sistema no tiene modo "hablar sin combate" nativo para entrenadores. La alternativa es usar el campo `text` del mapa (signs interactivos que no requieren NpcType).

---

### Sistema de diálogos

Hay dos mecanismos:

1. **`text` en el mapa** — tiles que al pulsarlos muestran texto. Formato:
   ```typescript
   text: {
     5: { 3: ["Línea 1", "Línea 2"] }  // fila 5, col 3
   }
   ```
   Cualquier tile con coordenadas en `text` muestra el texto al presionar A.

2. **`TrainerType.intro/outtro/postGame`** — diálogo de entrenadores.  
   Arrays de strings. Se muestran uno a uno en la caja de texto estándar.

**No hay diálogo ramificado nativo.** La única "bifurcación" disponible es `confirmationMenu` (Sí/No) via el sistema de quests.

---

### Sistema de quests (`app/use-quests.ts`)

```typescript
interface QuestType {
  trigger: "talk" | "walk"          // al hablar con NPC o pisar tile
  map: MapId                         // en qué mapa se activa
  positions: Record<fila, col[]>     // tiles que lo disparan
  active: () => boolean              // condición (¿completada? ¿badge obtenida?)
  text: string[]                     // texto mostrado
  action: () => void                 // función ejecutada tras el texto
}
```

Las quests pueden:
- Mostrar texto
- Ejecutar código arbitrario de Redux (mover al jugador, dar dinero, teletransportar, etc.)
- Mostrar `confirmationMenu` (Sí/No con callbacks)
- Marcar quests como completadas (`dispatch(completeQuest("id"))`)

**Actualmente hay 2 quests** (guía a Brock, cobro del museo).

---

### Sistema de combates

**Encuentros salvajes**: al caminar sobre hierba (`grass` tiles), se activa con probabilidad `encounters.walk.rate`. El Pokémon encontrado se decide por tabla de probabilidades en `location-data.json`.

**Encuentros de entrenador**: al entrar en la línea de visión de un trainer (5 tiles frontales), si no está en `defeatedTrainers`, se inicia un combate. Los `spinners` rotan continuamente y pueden activarse al pasar cerca.

**Flujo de combate**: `encounterTrainer(trainerData)` → Redux → el componente `TrainerEncounter` detecta el cambio y renderiza la escena de combate.

**La lógica de combate** incluye: por turnos, cálculo de daño (stats + tipos + movimientos), efectividad de tipos, críticos (10%), lanzar Pokéballs, usar ítems, huir, KO y recuperación.

---

### Pantalla de título

**Archivo**: `components/TitleScreen.tsx`

Muestra 3 imágenes PNG:
- `assets/title-screen/pokemon.png` → el logo del juego
- `assets/title-screen/version.png` → el subtítulo "versión"
- `assets/title-screen/player.png` → el personaje jugador

+ Un Pokémon aleatorio (#1-151) que desfila de derecha a izquierda y cambia cada 5 segundos.

**Para personalizar**: reemplazar esos 3 PNG por imágenes con el nombre de la pareja y la fecha.

---

### Criaturas / Pokémon

- **151 criaturas** con ID 1-151
- Cada una tiene: nombre, tipos, stats base (HP/Ataque/Defensa/Velocidad/Especial), sprites (front + back)
- Los stats reales se calculan en `app/use-pokemon-stats.ts` con fórmulas Gen1
- Las evoluciones por piedra están hardcodeadas en `use-item-data.ts`

---

### Ítems

**100+ ítems** definidos: pociones, Pokéballs, piedras evolutivas, TMs/HMs, medallas, llaves de historia.
Cada ítem tiene: nombre, precio, precio de venta, si es consumible, si es usable en combate, acción al usarlo.

---

## Dónde editar el juego

> **`game-src/` está en el repo** (commit `3e9990a`, rama `local-src`).
> El source se edita en `game-src/src/`. El build va a `public/game/`.
> Next.js no toca `game-src/` — está excluido en el `tsconfig.json` raíz.

### Primera vez (instalar dependencias del juego)

```bash
# Solo la primera vez, o tras clonar el repo:
cd game-src && npm install --legacy-peer-deps
```

### Flujo de trabajo habitual (editar → compilar → commitear)

```bash
# Flujo de trabajo habitual (editar → compilar → commitear)

# 1. Editar lo que quieras en game-src/src/

# 2. Compilar desde DENTRO de game-src:
cd game-src
PUBLIC_URL=/game DISABLE_ESLINT_PLUGIN=true GENERATE_SOURCEMAP=false \
  node_modules/.bin/react-scripts build

# 3. Ver el hash del bundle nuevo:
ls build/static/js/main.*.js

# 4. Copiar el build y borrar el bundle anterior (sustituir OLDHASH y NEWHASH):
cd ..
cp -r game-src/build/* public/game/
rm -f public/game/static/js/main.OLDHASH.js \
      public/game/static/js/main.OLDHASH.js.LICENSE.txt

# 5. Commitear y pushear:
git add public/game/
git commit -m "feat: <descripción del cambio>"
git push origin local-src
```

> ⚠️ Nunca usar `npx react-scripts build` desde la raíz del proyecto —
> hay que estar en `game-src/` y usar `node_modules/.bin/react-scripts`.
> ⚠️ El hash del bundle cambia con cada compilación. Si no borras el bundle
> antiguo, el repo acumula archivos JS obsoletos innecesariamente.

### Archivos propios de WeddingBoy (NO son del repo original)

Estos archivos han sido creados/modificados para la boda y están en `game-src/src/`:

| Archivo | Qué hace |
|---|---|
| `app/cloud-save.ts` | Supabase Edge Functions + WebAuthn passkey (save/load remoto) |
| `app/level-helper.ts` | Fórmula XP Gen I corregida (Medium-Fast: `nextLevel³ − currentLevel³`) |
| `app/move-helper.ts` | Daño Gen I completo: stat stages (20 movimientos), críticos 10%, efectividad |
| `app/xp-helper.ts` | XP de entrenadores × 1.5 (bonus Gen I) |
| `app/pokeball-helper.ts` | Fórmula de captura Gen I con 4 sacudidas reales |
| `components/IntroVideo.tsx` | Video intro antes del TitleScreen; se reproduce siempre (saltable A/B) |
| `components/LoadScreen.tsx` | Passkey **obligatorio** → save/load → oak-intro → name-picker → done |
| `components/OakIntro.tsx` | Intro Prof. Oak con typewriter (40ms/char), sprites por línea |
| `components/NameKeyboard.tsx` | Teclado Game Boy: 4 filas (A-Z + DEL) + botón FIN siempre visible |
| `components/LabPokeball.tsx` | Sprites de pokéball en coordenadas mundo (dentro de BackgroundContainer) |
| `components/LabPokeballModal.tsx` | Modal de selección de starter en coordenadas pantalla (fuera de BackgroundContainer) |
| `components/Trainer.tsx` | Renderiza sprite NPC; usa `npcFacings[trainerId]` como override de dirección |
| `components/TrainerEncounter.tsx` | Maneja encuentros; dispatcha `setNpcFacing` al pulsar A frente a NPC |
| `state/gameSlice.ts` | `loadFromState()` para cloud save; `npcFacings` + `setNpcFacing`; estado inicial sin pokémon |
| `maps/lab.ts` | Oak como NPC (pos 5,1); mesa con 3 pokéballs en y:3 x:6,7,8 |
| `maps/pallet-town.ts` | youngster (x:3,y:7), lass (x:15,y:6), Team Rocket (x:10-11,y:0 persistent) |
| `maps/house-a-1f.ts` | Madre (beauty, pos 6,3, persistent) con Ratata lvl 1 |

### Guía rápida de modificaciones

| Qué quiero cambiar | Archivo en `game-src/src/` | Campo |
|---|---|---|
| Nombre del jugador por defecto | `state/gameSlice.ts` | `initialState.name` |
| Pokémon iniciales del jugador | `state/gameSlice.ts` | `initialState.pokemon` |
| Mapa de inicio | `state/gameSlice.ts` | `initialState.map` + `pos` |
| Texto de un cartel | `maps/<mapa>.ts` | campo `text` |
| Diálogo de un entrenador NPC | `maps/<mapa>.ts` | `trainers[i].intro/outtro` |
| Música de un mapa | `maps/<mapa>.ts` | campo `music` (MP3 en assets/) |
| Mapa de fondo (imagen) | `maps/<mapa>.ts` | campo `image` (PNG en assets/) |
| Añadir un NPC nuevo | `maps/<mapa>.ts` | añadir a array `trainers` |
| Logo pantalla de título | `assets/title-screen/pokemon.png` | reemplazar PNG |
| Subtítulo pantalla de título | `assets/title-screen/version.png` | reemplazar PNG |
| Nombre de una criatura | `app/pokemon-metadata.ts` | campo `name` en cada entrada |
| Quest / evento con condición | `app/use-quests.ts` | añadir nueva entrada |
| Nuevo mapa completo | `maps/template.ts` + 3 cambios (ver arriba) | |
| Diálogo intro Prof. Oak | `components/OakIntro.tsx` | array `BASE_DIALOGUE` y `POST_NAME_DIALOGUE` |
| Textos cloud save (Continuar, etc.) | `components/LoadScreen.tsx` | strings inline |
| URL de Supabase | `.env` o variable en `app/cloud-save.ts` | `REACT_APP_SUPABASE_URL` |
| Video de introducción | `public/game/static/media/intro.*.mp4` | reemplazar el archivo MP4 |

---

## Reglas legales y creativas

- ✅ Motor fan-made, licencia MIT (chase-manning/pokemon-js)
- ✅ No se usan ROMs ni assets de Nintendo / Game Freak / The Pokémon Company
- ✅ Los sprites son originales del repo base

---

## Comandos

```bash
# Servidor local Next.js
npm run dev
# → http://localhost:3000 (redirige a /game/index.html)

# TypeScript check del juego (sin compilar)
cd game-src && npx tsc --noEmit

# Compilar el juego — ver "Flujo de trabajo habitual" arriba para el proceso completo

# Modo debug del juego (movimiento rápido, ver colisiones)
# En game-src/src/app/constants.ts → DEBUG_MODE = true (no commitear)
```

---

## Controles

| Acción | Teclado | On-screen |
|---|---|---|
| Mover | Flechas ← ↑ ↓ → | D-pad |
| Confirmar / Hablar | Z / Enter | Botón A |
| Cancelar / Menú | X / Escape | Botón B |
| Start | Enter | Botón START |
| Select | Shift | Botón SELECT |

---

## Roadmap

- [x] Base jugable en navegador (chase-manning/pokemon-js)
- [x] Integración en Next.js / Vercel
- [x] Traducciones al español (batallas, menús, diálogos)
- [x] Mecánicas Gen I corregidas (XP, stat stages, captura, HP nivel)
- [x] Video de intro por sesión (saltable con A/B)
- [x] Intro Oak con typewriter + sprites por línea
- [x] Teclado de nombre (4 filas + FIN siempre visible)
- [x] Layout Game Boy Color responsive (cqw, aspect ratio 3:5)
- [x] Oak NPC en el laboratorio con diálogo de boda
- [x] `game-src/` añadido al repo GitHub (commit `3e9990a`)
- [x] `tsconfig.json` raíz excluye `game-src/` (fix Vercel build)
- [ ] Guardado en Supabase (WebAuthn passkey — estructura lista, pendiente activar)
- [ ] Personalizar pantalla de título (logos de la pareja y fecha)
- [ ] Personalizar video de intro
- [ ] Compartir enlace con invitados

---

## Sistema de guardado por dispositivo (diseño técnico)

El juego es completamente client-side. Para que cada invitado guarde su partida
de forma independiente y la recupere en futuras visitas **sin necesidad de cuenta**:

### Estrategia: UUID en localStorage + Supabase

1. Al primer acceso se genera `crypto.randomUUID()` → guardado en localStorage
   como `wedding_player_id`.
2. El estado del juego se sincroniza a Supabase en una tabla `saves` con ese UUID
   como clave primaria.
3. Al volver al juego: lee UUID de localStorage → carga partida de Supabase.
4. Funciona en el mismo navegador/dispositivo de forma transparente.
5. Sin datos personales. Sin cuentas. Sin auth. GDPR-friendly.

**Limitación aceptada**: si el invitado limpia el localStorage del navegador, la
conexión con su partida se pierde y empieza de nuevo. Para una invitación de boda
esto es completamente aceptable.

### Esquema Supabase

```sql
CREATE TABLE saves (
  player_id  UUID        PRIMARY KEY,
  game_state JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
-- Sin auth: cualquiera puede leer/escribir su fila por UUID
CREATE POLICY "open_saves" ON saves FOR ALL USING (true);
```

### Flujo de integración

El juego (CRA) no llama directamente a Supabase. El puente se hace desde Next.js:

```
Juego (iframe/static) → postMessage → Next.js page → Supabase client
```

O bien, añadiendo el cliente Supabase directamente dentro del bundle del juego
(game-src), intercalando las llamadas en el dispatch de `save`/`load` de Redux.

### Variables de entorno

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```
