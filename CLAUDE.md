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
