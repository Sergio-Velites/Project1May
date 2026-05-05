<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# WeddingBoy — Guía de agentes

## Arquitectura en dos capas

```
/app/              → Next.js 16 shell (solo redirección a /game/index.html)
/public/game/      → Build estático del juego (NO editar directamente)
/game-src/src/     → FUENTE del juego (editar aquí)
```

Next.js **no toca** `game-src/` — está excluido en `tsconfig.json` raíz.

---

## Flujo de trabajo OBLIGATORIO para cambios en el juego

```bash
# 1. Editar archivos en game-src/src/

# 2. Compilar (siempre con subshell para preservar CWD):
(cd /Users/appsvelites/Projects/Project1May/game-src && \
  PUBLIC_URL=/game DISABLE_ESLINT_PLUGIN=true GENERATE_SOURCEMAP=false \
  node_modules/.bin/react-scripts build) 2>&1 | tail -20

# 3. Ver hash nuevo:
ls game-src/build/static/js/main.*.js

# 4. Copiar y limpiar hash anterior (sustituir OLDHASH):
cp -r game-src/build/* public/game/
rm -f public/game/static/js/main.OLDHASH.js \
      public/game/static/js/main.OLDHASH.js.LICENSE.txt

# 5. Commit y push:
git add public/game/ game-src/src/
git commit -m "feat: descripción"
git push origin local-src

# 6. Sincronizar master (cuando se pide):
git checkout master && git merge local-src --no-edit && git push origin master && git checkout local-src
```

⚠️ **CRÍTICO**: El tool `run_in_terminal` colapsa `cd X && comando` en un solo comando  
sin cambiar directorio. Usar **SIEMPRE** `(cd PATH && comando)` con subshell.  
⚠️ Nunca usar `npx react-scripts build` — hay que usar `node_modules/.bin/react-scripts`  
desde dentro de `game-src/`.

---

## Estado actual del juego (commit 80d402f)

### Flujo de inicio
1. **GameboyMenu** → menú de encendido
2. **IntroVideo** → vídeo intro (saltable A/B)
3. **TitleScreen** → pantalla título
4. **LoadScreen** → gestión save/load:
   - Detecta WebAuthn disponible → **obliga** registro de passkey (Face ID / huella)
   - Si el registro falla → opción "Jugar sin guardar" (UUID local, sin Supabase)
   - Si no hay partida guardada → solo "Nueva partida"
   - Si hay partida → "Continuar" + "Nueva partida"
   - `choosingRef` guard atómico previene race condition doble-A → Oak intro falso
5. **OakIntro** → intro del Profesor Oak con typewriter (solo en nueva partida)
6. **NameKeyboard** → elegir nombre del jugador (solo en nueva partida)
7. Juego comienza en `PalletTownHouseA2F` (habitación del jugador), sin pokémon

### Estado inicial del jugador
- Sin pokémon en equipo ni en PC
- Mapa: `PalletTownHouseA2F` pos (3,6)
- Inventario: 2 Pokéballs
- `defeatedTrainers: ["pallet-town-lab-5-1", "pallet-town-house-a-1f-6-3", "pallet-town-10-0", "pallet-town-11-0"]`
  - `pallet-town-lab-5-1`: Oak pre-derrotado (evita combate automático)
  - `pallet-town-house-a-1f-6-3`: madre pre-derrotada (`persistent:true` → muestra `outtro`)
  - `pallet-town-10-0`, `pallet-town-11-0`: Team Rocket pre-derrotados
    - `persistent:true` + `hideCondition:"has-pokemon"` → visibles solo sin pokémon

### Acto I — DESTILERÍA DEL PROF. OAK / Pueblo Paleta ✅
1. Jugador despierta en habitación 2F → baja a cocina
2. **Madre (beauty, x:6,y:3, persistent)** → quest walk bronca en `house-a-1f`
3. Sale de casa → Pueblo Paleta
4. **Team Rocket norte** (x:10-11, y:0): `persistent+hideCondition="has-pokemon"`
5. **Laboratorio** → **Oak NPC** → discurso de boda
6. **3 pokéballs** (x:6,7,8 y:3) → modal `LabPokeballModal` en screen space → starter
7. Con pokémon: Team Rocket desaparecen → puede subir a Ruta 1

### Acto II — Ruta 1 · Camino al Soto ✅ (`maps/route-1.ts`)
- `name: "Ruta 1 · Camino al Soto"`
- **youngster** (x:14,y:18, combate): Spearow lvl 3, money:50
- **beauty** (x:7,y:20, decorativo `intro:[]`): _"¡La preboda sin anís no es preboda!"_
- **lass** (x:13,y:10, decorativo): mensajero del coche de novios
- **fisher** (x:13,y:26, combate): Magikarp+Goldeen, money:70
- **sailor** (x:6,y:16, combate): Tentacool+Psyduck, money:90

### Acto III — SOTO LEZKAIRU ✅ (`maps/viridian-city.ts`)
- `name: "SOTO LEZKAIRU"`
- **cueBall** (x:12,y:20, combate): Rattata lvl 4, money:80
- **jrTrainerFemale** (x:26,y:24, combate): Zubat lvl 5, money:100
- **teamRocketGrunt** (x:11,y:11, combate): Nidorino+Meowth, money:200
- **gentleman** (x:27,y:22, persistent decorativo): quest walk da SodaPop como "Vino Tinto"
- Quest `"vino-tinto-dado"` en `use-quests.ts` (posición 23:[27])
- Carteles temáticos de Lezkairu, música pewter-city.mp3

### Acto IV — EL BOSQUECILLO ✅ (`maps/viridian-forrest.ts`)
- `name: "EL BOSQUECILLO"`
- NPCs decorativos dispersos que apuran al jugador
- Team Rocket bloqueando el paso (combate)
- Hierba densa con encuentros aleatorios funcionales

### Acto V — VILLAMAYOR DE MONJARDÍN ✅ (`maps/pewter-city.ts` + `pewter-city-gym.ts`)
- `name: "VILLAMAYOR DE MONJARDÍN"`
- **Bodega CASTILLO DE MONJARDÍN** (`maps/pewter-city-gym.ts`): `name: "Bodega CASTILLO DE MONJARDÍN"`
- **sailor** (guardián, x:3,y:6): bloquea antes de los líderes, money:300
- **Sergio** (aceTrainerMale, x:4,y:1, combate): Growlithe lvl 14 + Ponyta lvl 12, money:1400
  - postGame: `ItemType.BoulderBadge` + `ItemType.Tm34` → mensaje "INSIGNIA DEL VINO"
- **Marta** (aceTrainerFemale, x:5,y:1, combate): Butterfree lvl 16 + Clefairy lvl 14, money:1600
- Quest en `pewter-city` guía al gimnasio si `badges.length === 0`

### Batallas online entre invitados ✅
- Scientist NPC en los 3 centros Pokémon (viridian, pewter, route-3), pos `{x:10,y:2}`
- `MapType.onlineBattleNpc?: PosType` — campo del mapa
- `OnlineBattleNpc.tsx` — detecta A frente al scientist, abre `showOnlineBattleMenu()`
- `OnlineBattleMenu.tsx` — flujo: greeting → listPlayers() → seleccionar → loadFromCloud() → batalla
- `TrainerType.isOnline?: boolean` — las batallas online no se añaden a `defeatedTrainers`
- Edge function `supabase/functions/list-players/index.ts` — devuelve `{playerId,name,pokemonCount}[]`

---

## `hideCondition` — Sistema de visibilidad condicional de NPCs

```typescript
hideCondition?: "has-pokemon";
```

Evaluado en **una sola capa**:
- **`Game.tsx`** → filtro de render: NPC no se dibuja si la condición se cumple

Los trainers **sin** `hideCondition` siempre se renderizan, incluso después de ser derrotados.  
`TrainerEncounter.tsx` muestra `outtro` (no inicia batalla) cuando el trainer está en `defeatedTrainers`.

---

## Problemas conocidos y soluciones

### Bug KO resuelto (commit 93f3332)
Stage 27 de `PokemonEncounter.tsx`: `endEncounter_(true)` a t=1000ms, `recoverFromFainting()` a t=1500ms.  
El orden anterior (curar primero, cerrar después) permitía continuar el combate con pokémon curados.

### `lastHealLocation` — recuperación en el último centro (commit 93f3332)
`healPokemon` guarda `lastHealLocation` resolviendo `exitReturnPos` del centro.  
`recoverFromFainting` usa `lastHealLocation` si existe; si no, recurre al `recoverLocation` del mapa.

### Trainers permanecen visibles tras derrota (commit 80d402f)
`Game.tsx` ya NO filtra trainers por `defeatedTrainers`. Solo `hideCondition` oculta trainers.  
Los trainers derrotados se quedan en su tile y muestran `outtro` al pulsar A.

### Bucle infinito en pantalla passkey (`require-passkey`)
Solución aplicada: tras primer fallo de registro, `registrationFailed=true` → segunda opción cambia a "Jugar sin guardar".

### El tool run_in_terminal no preserva `cd`
**Solución siempre**: subshell `(cd /ruta/absoluta && comando)`.

### `showText` + setTimeout no es seguro para texto → acción
Usar siempre `dispatch(showTextThenAction({ text: ["..."], action: () => doSomething() }))`.

### Modal/overlay dentro del BackgroundContainer no queda centrado
Renderizar **fuera** de `BackgroundContainer` en `Game.tsx`. Compartir estado via Redux (campo en `uiSlice`).

### NPCs decorativos (solo diálogo, sin combate)
```typescript
{ intro: [], outtro: ["Texto..."], money: 0 }
```
`TrainerEncounter.tsx`: si `intro` está vacío → no inicia batalla → muestra `outtro` directo.

### NPC `persistent:true` con `intro:[]` — comportamiento exacto
- Siempre visible en el mapa
- No muestra `!` ni inicia batalla
- Al pulsar A: muestra `outtro`
- Se gira hacia el jugador gracias a `setNpcFacing`

---

## Archivos clave del juego

| Archivo | Propósito |
|---|---|
| `game-src/src/state/gameSlice.ts` | Estado global: pokémon, mapa, pos, saves, npcFacings, lastHealLocation |
| `game-src/src/state/uiSlice.ts` | UI: textos, menús, confirmaciones, pokeballCardId, onlineBattleMenu |
| `game-src/src/state/state-types.ts` | Interfaces GameState, PokemonInstance, etc. |
| `game-src/src/app/use-quests.ts` | Sistema de quests (walk/talk triggers) |
| `game-src/src/app/cloud-save.ts` | Supabase Edge Functions + WebAuthn passkey + listPlayers() |
| `game-src/src/app/move-helper.ts` | Mecánicas Gen I completas: stat stages, drain/recoil, flinch, counter, etc. |
| `game-src/src/app/level-helper.ts` | getLearnedMove(), getHpDeltaOnLevelUp(), 4 growth rates |
| `game-src/src/app/xp-helper.ts` | XP de entrenadores ×1.5 (bonus Gen I) |
| `game-src/src/app/pokeball-helper.ts` | Fórmula de captura Gen I con 4 sacudidas |
| `game-src/src/components/LoadScreen.tsx` | Flujo inicio: passkey → save → oak-intro |
| `game-src/src/components/OakIntro.tsx` | Intro Oak con typewriter por línea |
| `game-src/src/components/NameKeyboard.tsx` | Teclado Game Boy para nombre |
| `game-src/src/components/LabPokeball.tsx` | Sprites pokéball en el mundo (world coords) |
| `game-src/src/components/LabPokeballModal.tsx` | Modal de selección de starter (screen coords) |
| `game-src/src/components/AcademyPokeball.tsx` | Pokéball interactiva en la academia |
| `game-src/src/components/AcademyPokeballModal.tsx` | Modal academia (screen coords) |
| `game-src/src/components/OnlineBattleNpc.tsx` | Detecta A frente al scientist, abre menú online |
| `game-src/src/components/OnlineBattleMenu.tsx` | Flujo de batalla online: lista jugadores → batalla |
| `game-src/src/components/Trainer.tsx` | Renderiza sprite NPC; usa `npcFacings` para girar al ser hablado |
| `game-src/src/components/TrainerEncounter.tsx` | Maneja encuentros + diálogos NPCs + dispatch de `setNpcFacing` |
| `game-src/src/components/PokemonEncounter.tsx` | Componente principal de combate (stages 0-52) |
| `game-src/src/components/Evolution.tsx` | Animación de evolución + aprender movimientos post-evolución |
| `game-src/src/components/Game.tsx` | Componente raíz: monta todos los sistemas |
| `game-src/src/components/MoveSelect.tsx` | Selector de movimiento a olvidar (LearnMove flow) |
| `game-src/src/maps/map-types.ts` | Interfaces MapType, TrainerType (isOnline, hideCondition, onlineBattleNpc) |
| `game-src/src/maps/pallet-town.ts` | Pueblo Paleta con NPCs boda + Team Rocket |
| `game-src/src/maps/route-1.ts` | Ruta 1 · Camino al Soto con 5 NPCs |
| `game-src/src/maps/viridian-city.ts` | SOTO LEZKAIRU con trainers combatibles + Maestro del Vino |
| `game-src/src/maps/viridian-forrest.ts` | EL BOSQUECILLO |
| `game-src/src/maps/pewter-city.ts` | VILLAMAYOR DE MONJARDÍN |
| `game-src/src/maps/pewter-city-gym.ts` | Bodega CASTILLO DE MONJARDÍN (Sergio + Marta) |
| `supabase/functions/list-players/index.ts` | Edge function: devuelve lista de jugadores con saves |

---

## Cómo añadir un NPC solo-diálogo (sin combate)

```typescript
// En el map .ts, añadir a trainers[]:
{
  npc: youngster,
  pokemon: [{ id: 19, level: 2 }],  // obligatorio aunque no combata
  facing: Direction.Right,
  pos: { x: 3, y: 7 },
  intro: [],           // ← VACÍO = sin combate
  outtro: ["Texto..."],
  money: 0,
}
```

## Cómo añadir un mapa nuevo

1. Añadir valor al enum `MapId` en `maps/map-types.ts`
2. Crear archivo (copiar `maps/template.ts`)
3. Importar y registrar en `maps/map-data.ts`

## Cómo añadir una quest

Editar `game-src/src/app/use-quests.ts`. Las quests pueden:
- Mostrar texto
- Ejecutar código Redux (mover jugador, dar dinero, teleportar)
- Mostrar `showConfirmationMenu` (Sí/No)
- Marcar quests completadas (`completeQuest("id")`)
- Bloquear paso con `setPos` (quest walk)

**Quests activas:**
1. `madre-bronca-done` — House A 1F: madre bronca al bajar las escaleras (walk)
2. Pueblo Paleta norte — bloqueo si `pokemon.length === 0` (walk): devuelve a y:3
3. Pewter City — guía al gimnasio si `badges.length === 0` (walk)
4. Pewter Museum — cobro de 50₽ si no ha pagado (walk)
5. `vino-tinto-dado` — Soto Lezkairu: Maestro del Vino da SodaPop una vez (walk)

---

## Variables de entorno

```bash
REACT_APP_SUPABASE_URL=https://<project-ref>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<anon-key>
```

En `game-src/.env` (no commitear).

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# WeddingBoy — Guía de agentes

## Arquitectura en dos capas

```
/app/              → Next.js 16 shell (solo redirección a /game/index.html)
/public/game/      → Build estático del juego (NO editar directamente)
/game-src/src/     → FUENTE del juego (editar aquí)
```

Next.js **no toca** `game-src/` — está excluido en `tsconfig.json` raíz.

---

## Flujo de trabajo OBLIGATORIO para cambios en el juego

```bash
# 1. Editar archivos en game-src/src/

# 2. Compilar (siempre con subshell para preservar CWD):
(cd /Users/appsvelites/Projects/Project1May/game-src && \
  PUBLIC_URL=/game DISABLE_ESLINT_PLUGIN=true GENERATE_SOURCEMAP=false \
  node_modules/.bin/react-scripts build) 2>&1 | tail -20

# 3. Ver hash nuevo:
ls game-src/build/static/js/main.*.js

# 4. Copiar y limpiar hash anterior (sustituir OLDHASH):
cp -r game-src/build/* public/game/
rm -f public/game/static/js/main.OLDHASH.js \
      public/game/static/js/main.OLDHASH.js.LICENSE.txt

# 5. Commit y push:
git add public/game/ game-src/src/
git commit -m "feat: descripción"
git push origin local-src
```

⚠️ **CRÍTICO**: El tool `run_in_terminal` colapsa `cd X && comando` en un solo comando  
sin cambiar directorio. Usar **SIEMPRE** `(cd PATH && comando)` con subshell.  
⚠️ Nunca usar `npx react-scripts build` — hay que usar `node_modules/.bin/react-scripts`  
desde dentro de `game-src/`.

---

## Estado actual del juego (commit b2c12f3)

### Flujo de inicio
1. **GameboyMenu** → menú de encendido
2. **IntroVideo** → vídeo intro (saltable A/B)
3. **TitleScreen** → pantalla título
4. **LoadScreen** → gestión save/load:
   - Detecta WebAuthn disponible → **obliga** registro de passkey (Face ID / huella)
   - Si el registro falla → opción "Jugar sin guardar" (UUID local, sin Supabase)
   - Si no hay partida guardada → solo "Nueva partida"
   - Si hay partida → "Continuar" + "Nueva partida"
   - `choosingRef` guard atómico previene race condition doble-A → Oak intro falso
5. **OakIntro** → intro del Profesor Oak con typewriter (solo en nueva partida)
   - Pulsar A en panel "NUEVO NOMBRE" ya funciona (antes requería click táctil)
6. **NameKeyboard** → elegir nombre del jugador (solo en nueva partida)
7. Juego comienza en `PalletTownHouseA2F` (habitación del jugador), sin pokémon

### Estado inicial del jugador
- Sin pokémon en equipo ni en PC
- Mapa: `PalletTownHouseA2F` pos (3,6)
- Inventario: 2 Pokéballs
- `defeatedTrainers: ["pallet-town-lab-5-1", "pallet-town-house-a-1f-6-3", "pallet-town-10-0", "pallet-town-11-0"]`
  - `pallet-town-lab-5-1`: Oak pre-derrotado (evita combate automático)
  - `pallet-town-house-a-1f-6-3`: madre pre-derrotada (`persistent:true` → muestra `outtro`)
  - `pallet-town-10-0`, `pallet-town-11-0`: Team Rocket pre-derrotados
    - `persistent:true` + `hideCondition:"has-pokemon"` → visibles solo sin pokémon

### Acto I — DESTILERÍA DEL PROF. OAK / Pueblo Paleta ✅
1. Jugador despierta en habitación 2F → baja a cocina
2. **Madre (beauty, x:6,y:3, persistent)** → quest walk bronca en `house-a-1f`
3. Sale de casa → Pueblo Paleta
4. **Team Rocket norte** (x:10-11, y:0): `persistent+hideCondition="has-pokemon"`
   - Sin pokémon: visibles, bloquean con diálogo, quest walk devuelve al jugador a y:3
   - Con ≥1 pokémon: desaparecen visualmente Y no responden al pulsar A
5. **Laboratorio** (x:12, y:11) → **Oak NPC** (x:5,y:1, persistent) → discurso de boda
6. **3 pokéballs** (x:6,7,8 y:3) → modal `LabPokeballModal` en screen space → starter
7. Con pokémon: quest walk norte ya no activa → puede subir a Ruta 1

---

## Narrativa completa — Hoja de ruta de implementación

### Acto II — RUTA 1 🔲 (maps/route-1.ts)
**Renombrar**: el campo `name` ya dice "Route 1" — cambiar a `"Ruta 1 · Camino al Soto"`

**NPCs a añadir** (en `route-1.ts`, array `trainers`):

```typescript
// NPC combatible: "invitado cabreado" — youngster en posición media de la ruta
{
  npc: youngster,
  pokemon: [{ id: 21, level: 3 }],  // Spearow
  facing: Direction.Left,
  pos: { x: 12, y: 18 },
  intro: [
    "¡Para ahí, tú!",
    "¡No te creas que llegarás tan fácil!",
    "¡Yo quería el vino y tú me lo quitaste!",
  ],
  outtro: ["Bueno... puede que yo tampoco llegue a tiempo."],
  money: 50,
}

// NPC decorativo: "abuela del anís" — beauty, sin combate
{
  npc: beauty,
  pokemon: [{ id: 35, level: 3 }],
  facing: Direction.Right,
  pos: { x: 7, y: 28 },
  intro: [],
  outtro: ["¡No olvides que la preboda sin anís no es preboda!"],
  money: 0,
}
```

### Acto III — SOTO LEZKAIRU (ex Viridian City) 🔲 (maps/viridian-city.ts)
**Renombrar**: `name: "SOTO LEZKAIRU"` · Textos del mapa actualizados

**Cambios en `viridian-city.ts`**:
- `text`: actualizar todos los carteles con temática de boda y Lezkairu
- `trainers`: añadir grupo de "no invitados" (combatibles) + Maestro del Vino (NPC decorativo)

```typescript
// Anti-preboda — grupo combatible de 2-3 trainers
{
  npc: cueBall,
  pokemon: [{ id: 19, level: 4 }],
  facing: Direction.Down,
  pos: { x: 15, y: 8 },
  intro: [
    "¡Hemos montado nuestra propia preboda!",
    "¡Con vino barato y sin protocolo!",
    "¡Demuestra que mereces el bueno!",
  ],
  outtro: ["...igual el vino caro tampoco está tan mal."],
  money: 80,
}

// Maestro del Vino — NPC decorativo que enseña el ítem "Vino Tinto"
// Usa showTextThenAction + addItem (ItemType.SodaPop como proxy de "Vino Tinto")
{
  npc: gentleman,
  pokemon: [{ id: 1, level: 1 }],
  facing: Direction.Down,
  pos: { x: 6, y: 14 },
  intro: [],
  outtro: [
    "Joven, el vino tinto cura... y anima.",
    "Toma una botella para el camino.",
  ],
  money: 0,
}
// → quest "talk" en use-quests.ts da SodaPop como "Vino Tinto" 1 vez

// Team Rocket norte — intentando robar barril
{
  npc: teamRocketGrunt,
  pokemon: [{ id: 33, level: 5 }, { id: 52, level: 4 }],
  facing: Direction.Down,
  pos: { x: 19, y: 3 },
  intro: [
    "¡Con este vino seremos los reyes de la fiesta!",
    "¡No te metas en nuestros asuntos!",
  ],
  outtro: ["¡Maldición! ¡Nos retiramos... pero volveremos por el anís!"],
  money: 200,
}
```

### Acto IV — EL BOSQUECILLO (ex Viridian Forest) 🔲 (maps/viridian-forrest.ts)
**Renombrar**: `name: "EL BOSQUECILLO"`

**NPCs a añadir**:
```typescript
// NPCs que apuran — decorativos dispersos por el bosque
{ intro: [], outtro: ["¡Corre, que la barra libre se acaba!"], ... }
{ intro: [], outtro: ["¡El DJ ya está calentando! ¡Mueve las piernas!"], ... }

// Team Rocket bloqueando el paso
{
  intro: [
    "¡Teníamos un plan perfecto!",
    "¡Queríamos los Pokémon de la boda!",
    "...pero nos llevamos este anís de mientras.",
  ],
  outtro: ["¡Que disfrutes de la preboda, crío!"],
  money: 150,
}
```

### Acto V — VILLAMAYOR DE MONJARDÍN (ex Pewter City) 🔲 (maps/pewter-city.ts)
**Renombrar**: `name: "VILLAMAYOR DE MONJARDÍN"`

**Cambios**:
- Textos de NPCs y carteles: temática de vino de Monjardín
- **Bodega CASTILLO DE MONJARDÍN** (ex pewter-city-gym.ts):
  - `name: "Bodega CASTILLO DE MONJARDÍN"`
  - `text` de la puerta: _"Gimnasio de tipo VINO"_ (aunque Vino no sea tipo oficial Pokémon, se referencia explícitamente)
  - Trainer previo (ex jrTrainerMale): invitado que guarda la entrada
  - Líderes **Sergio y Marta** (usar `aceTrainerMale` + `aceTrainerFemale` o `gentleman` + `beauty`):

```typescript
// Sergio — primer líder
{
  npc: aceTrainerMale,
  pokemon: [{ id: 58, level: 14 }, { id: 77, level: 12 }],
  facing: Direction.Down,
  pos: { x: 4, y: 3 },
  intro: [
    "¡Te lo advertimos!",
    "Aquí entre barricas solo se habla de vino.",
    "...y de Pokémon.",
    "¡Demuestra que mereces brindar con nosotros!",
  ],
  outtro: [
    "¡Bien hecho!",
    "Nos vemos el 8 de agosto.",
    "Y esta vez tú brindas con nosotros.",
  ],
  money: 1400,
}
// Marta — segundo líder (pos adyacente)
{
  npc: aceTrainerFemale,
  pokemon: [{ id: 12, level: 16 }, { id: 36, level: 14 }],
  ...
}
```
- Al ganar → añadir `ItemType.BoulderBadge` renombrado a **"Insignia del Vino"** en el texto de victoria
  (el ítem BoulderBadge ya existe en el sistema de badges)

---

## `hideCondition` — Sistema de visibilidad condicional de NPCs

Campo en `TrainerType`:
```typescript
hideCondition?: "has-pokemon";
```

Evaluado en **dos capas**:
1. **`Game.tsx`** → filtro de render: NPC no se dibuja si la condición se cumple
2. **`TrainerEncounter.tsx`** → handler de A: interacción ignorada aunque el jugador esté encima

Para añadir nuevas condiciones: extender el tipo union y añadir el check en ambos sitios.
Ejemplo futuro: `hideCondition?: "has-pokemon" | "has-badge-1" | "quest-done:X"`

---

## Problemas conocidos y soluciones

### Bucle infinito en pantalla passkey (`require-passkey`)
Ocurre cuando `webauthn-register-finish` (Edge Function Supabase) falla: la passkey  
se registra en el dispositivo pero el servidor no confirma → `webauthnRegister()` devuelve  
`null` → fase vuelve a `require-passkey` → bucle sin salida. **Solución aplicada**: tras el  
primer fallo de registro se activa `registrationFailed=true` y la segunda opción del menú  
cambia de "Reintentar" (que no servía) a "Jugar sin guardar", que genera un UUID local  
con `crypto.randomUUID()` sin necesidad de Supabase y permite entrar al juego.

### El tool run_in_terminal no preserva `cd`
El tool colapsa `cd X && cmd` — el `cd` se pierde. **Solución**: usar subshell:
```bash
(cd /ruta/absoluta && comando)
```

### react-scripts busca TypeScript en el directorio padre
Si se lanza `react-scripts` con CWD en la raíz del proyecto, falla con  
`Cannot find module 'typescript' from '/path/node_modules'`. **Solución**: usar  
subshell que fuerza CWD a `game-src/`.

### Trainers con `money: 0` no pagan nada al vencer
Es intencional. Los NPCs de boda tienen `money: 0`.

### `TrainerType` no tiene modo "hablar sin combate"
El engine siempre inicia combate al entrar en el radio de visión del trainer (5 tiles).  
Para NPCs de solo-diálogo sin combate, usar `intro: []`. Así `TrainerEncounter.tsx`
no inicia combate y muestra `outtro` directamente al pulsar A.

**Patrón NPCs decorativos (solo diálogo, sin combate):**
```typescript
{
  npc: youngster,
  pokemon: [{ id: 19, level: 2 }],  // obligatorio aunque no combata
  facing: Direction.Right,
  pos: { x: 3, y: 7 },
  intro: [],           // ← VACÍO = sin combate
  outtro: ["Texto..."],
  money: 0,
}
```

### NPCs que no se giran al hablar / no muestran diálogo
Dos causas habituales:
1. **El NPC está en `defeatedTrainers` con `persistent:true`**: el sprite persiste pero
   `TrainerEncounter` muestra `outtro` (el mensaje post-batalla), no `intro`. Si `outtro`
   está vacío → silencio. Asegurarse de que `outtro` tiene texto.
2. **El jugador no está exactamente en el tile adyacente mirando al NPC**: `isTrainer` en
   `TrainerEncounter.tsx` usa `pos.x + facingMod.x === trainer.pos.x`. Si hay un tile de
   diferencia o el jugador mira en dirección incorrecta, no detecta al NPC.

**Sistema de giro (`npcFacings`):** Al pulsar A frente a un NPC, `TrainerEncounter.tsx`
dispara `setNpcFacing({ id: "mapId-x-y", direction: opposite(playerDirection) })`.
`Trainer.tsx` lee `npcFacings[trainerId]` como override de `trainer.facing` para
el sprite. El map de `npcFacings` se limpia automáticamente al cambiar de mapa
(en los reducers `setMap`, `setMapWithPos`, `exitMap`).

### Modal pokéball dentro del `BackgroundContainer` no queda centrado
El `BackgroundContainer` tiene `transform: translate(...)` que desplaza todo su contenido
con el scroll del mapa. Cualquier overlay renderizado dentro de él se mueve con el mapa
en lugar de quedarse fijo en pantalla.

**Solución**: separar en dos componentes:
- `LabPokeball.tsx` — solo los sprites de pokéball (world coords, dentro de `BackgroundContainer`)
- `LabPokeballModal.tsx` — el modal de selección (screen coords, **fuera** de `BackgroundContainer`, en `Game.tsx`)

El estado se comparte a través de `pokeballCardId: number | null` en `uiSlice`.
Este campo está incluido en `selectMenuOpen` → el movimiento se congela automáticamente.

### NPC `persistent:true` con `intro:[]` — comportamiento exacto
- Siempre visible en el mapa (no desaparece aunque esté en `defeatedTrainers`)
- Al acercarse: **no** muestra `!` ni inicia batalla (porque `intro` está vacío)
- Al pulsar A frente a él: muestra `outtro`
- Se gira hacia el jugador gracias a `setNpcFacing`

**Para ocultar un NPC según una condición** (ej. Team Rocket desaparecen tras coger pokémon):
→ Quitar `persistent: true`. Sin `persistent`, el NPC desaparece del mapa cuando su
ID está en `defeatedTrainers`. Añadir su ID al array `defeatedTrainers` de `initialState`
lo hace invisible desde el principio. Para hacerlo aparecer/desaparecer dinámicamente,
necesitaría un trigger que añada/retire el ID (actualmente no hay un reducer para retirar
IDs de `defeatedTrainers`, solo `defeatTrainer` que añade).

### `LabPokeball.tsx` usa `completeQuest` para marcar pokéballs como recogidas
No usa `collectItem` (que requiere `ItemType` real). En su lugar, cada pokéball  
utiliza `completeQuest("lab-starter-taken-{pokemonId}")` para persistir el estado.  
Por tanto, el estado de las pokéballs vive en `completedQuests[]`, no en `collectedItems[]`.

### `showTextThenAction` para flujo texto → acción
Cuando se quiere mostrar texto Y luego ejecutar una función:
```typescript
dispatch(showTextThenAction({ text: ["..."], action: () => doSomething() }));
```
No usar `showText` + setTimeout — el usuario puede cerrar el texto antes.

### Quest walk vs trainer bloqueador
Para bloquear al jugador en un tile (sin combate): usar quest tipo `"walk"` en `use-quests.ts`  
con `active: () => condición` y `action: () => dispatch(setPos({...posAnterior}))`.  
No usar trainers para esto (siempre fuerzan combate).

---

## Archivos clave del juego

| Archivo | Propósito |
|---|---|
| `game-src/src/state/gameSlice.ts` | Estado global: pokémon, mapa, pos, saves, npcFacings |
| `game-src/src/state/uiSlice.ts` | UI: textos, menús, confirmaciones, pokeballCardId |
| `game-src/src/app/use-quests.ts` | Sistema de quests (walk/talk triggers) |
| `game-src/src/app/cloud-save.ts` | Supabase Edge Functions + WebAuthn passkey |
| `game-src/src/components/LoadScreen.tsx` | Flujo inicio: passkey → save → oak-intro |
| `game-src/src/components/OakIntro.tsx` | Intro Oak con typewriter por línea |
| `game-src/src/components/NameKeyboard.tsx` | Teclado Game Boy para nombre |
| `game-src/src/components/LabPokeball.tsx` | Sprites pokéball en el mundo (world coords) |
| `game-src/src/components/LabPokeballModal.tsx` | Modal de selección de starter (screen coords, fuera de BackgroundContainer) |
| `game-src/src/components/Trainer.tsx` | Renderiza sprite NPC; usa `npcFacings` para girar al ser hablado |
| `game-src/src/components/TrainerEncounter.tsx` | Maneja encuentros + diálogos NPCs + dispatch de `setNpcFacing` |
| `game-src/src/components/Pokedex.tsx` | Pokédex lista + ficha detalle |
| `game-src/src/components/PokemonSummary.tsx` | Ficha pokémon (pág1: estado, pág2: habilidades) |
| `game-src/src/components/Menu.tsx` | Menú genérico (battle menu usa `compact` mode) |
| `game-src/src/maps/lab.ts` | Laboratorio con Oak NPC y texto pokéballs |
| `game-src/src/maps/pallet-town.ts` | Pueblo Paleta con youngster, lass, Team Rocket |
| `game-src/src/maps/house-a-1f.ts` | Casa del jugador 1F con madre (beauty, persistent) |
| `game-src/src/maps/house-a-2f.ts` | Habitación del jugador (start) |
| `game-src/src/app/move-metadata.ts` | ~24k líneas. Nombres oficiales ES de movimientos |
| `game-src/src/app/npcs.ts` | 40+ tipos de NPC con sprites |
| `game-src/src/app/level-helper.ts` | 4 fórmulas growth rate Gen I exactas (Fast/Med-Fast/Med-Slow/Slow) |
| `game-src/src/app/xp-helper.ts` | Fórmula XP Gen I: `floor(base*level/7)`, ×1.5 entrenador |
| `game-src/src/app/pokemon-metadata.ts` | Metadatos 151 Pokémon incluyendo campo `growthRate` |

---

## Cómo añadir un NPC solo-diálogo (sin combate)

```typescript
// En use-quests.ts, añadir entrada:
{
  trigger: "talk",
  map: MapId.PalletTown,
  positions: { 8: [3] },  // fila:columnas
  active: () => true,
  text: ["Línea 1", "Línea 2"],
  action: () => {},
}
// El tile (3,8) de pallet-town mostrará ese texto al pulsar A
// El texto aparece en el campo `text` del mapa como alternativa
```

## Cómo añadir un mapa nuevo

1. Añadir valor al enum `MapId` en `maps/map-types.ts`
2. Crear archivo (copiar `maps/template.ts`)
3. Importar y registrar en `maps/map-data.ts`

## Cómo añadir una quest

Editar `game-src/src/app/use-quests.ts`. Las quests pueden:
- Mostrar texto
- Ejecutar código Redux (mover jugador, dar dinero, teleportar)
- Mostrar `showConfirmationMenu` (Sí/No)
- Marcar quests completadas (`completeQuest("id")`)
- Bloquear paso con `setPos` (quest walk)

---

## Variables de entorno

```bash
REACT_APP_SUPABASE_URL=https://<project-ref>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<anon-key>
```

En `game-src/.env` (no commitear). El cloud-save también usa Edge Functions de Supabase.
