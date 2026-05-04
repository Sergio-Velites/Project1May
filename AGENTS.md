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
```

⚠️ **CRÍTICO**: El tool `run_in_terminal` colapsa `cd X && comando` en un solo comando  
sin cambiar directorio. Usar **SIEMPRE** `(cd PATH && comando)` con subshell.  
⚠️ Nunca usar `npx react-scripts build` — hay que usar `node_modules/.bin/react-scripts`  
desde dentro de `game-src/`.

---

## Estado actual del juego (commit 0a0e413)

### Flujo de inicio
1. **GameboyMenu** → menú de encendido
2. **IntroVideo** → vídeo intro (saltable A/B)
3. **TitleScreen** → pantalla título
4. **LoadScreen** → gestión save/load:
   - Detecta WebAuthn disponible → **obliga** registro de passkey (Face ID / huella)
   - Si el registro falla → opción "Jugar sin guardar" (UUID local, sin Supabase)
   - Si no hay partida guardada → solo "Nueva partida"
   - Si hay partida → "Continuar" + "Nueva partida"
5. **OakIntro** → intro del Profesor Oak con typewriter (solo en nueva partida)
6. **NameKeyboard** → elegir nombre del jugador (solo en nueva partida)
7. Juego comienza en `PalletTownHouseA2F` (habitación del jugador), sin pokémon

> ⚠️ **BUG CONOCIDO**: Al elegir "Continuar" con una partida guardada, a veces aparece
> la intro del Profesor Oak. Ocurre porque `handleContinue` en LoadScreen llama `loadComplete()`
> pero el estado de fase queda en `"choose"`. Pendiente: verificar que `phase` se resetee
> correctamente tras `dispatch(loadFromState(...))`.

### Estado inicial del jugador
- Sin pokémon en equipo ni en PC
- Mapa: `PalletTownHouseA2F` pos (3,6)
- Inventario: 2 Pokéballs
- `defeatedTrainers: ["pallet-town-lab-5-1", "pallet-town-house-a-1f-6-3", "pallet-town-10-0", "pallet-town-11-0"]`
  - `pallet-town-lab-5-1`: Oak pre-derrotado (evita combate)
  - `pallet-town-house-a-1f-6-3`: madre pre-derrotada
  - `pallet-town-10-0` y `pallet-town-11-0`: Team Rocket pre-derrotados (solo visibles si `outtro` lo permite; con `persistent:true` siguen apareciendo)

> ⚠️ **PATRÓN NPCs SIEMPRE VISIBLES**: Para que un NPC persista visualmente tras ser
> "derrotado" (sin que desaparezca del mapa), usar `persistent: true` en el `TrainerType`.
> Sin `persistent`, el NPC desaparece del mapa cuando su ID está en `defeatedTrainers`.
> Para ocultar un NPC cuando se cumple una condición, NO usar `persistent`.

### Narrativa del primer acto
1. Jugador en su habitación → baja a cocina
2. **Madre (beauty NPC)** en `house-a-1f` pos (x:6,y:3), `persistent:true`
   - `intro:[]` → sin combate; texto `outtro` al hablar
   - Ya en `defeatedTrainers` de inicio → muestra `outtro` directamente al hablar
3. En **Pallet Town** norte (y:2 cols 10-11): quest walk bloquea si `pokemon.length===0`
   - Team Rocket en `{x:10,y:0}` y `{x:11,y:0}`, `persistent:true`
   - Desaparecen (no persistent) una vez que el jugador tiene pokémon → NO, siguen visibles
   - Para ocultarlos cuando el jugador ya tiene pokémon: quitar `persistent:true`
4. En el **Laboratorio** (pallet-town-lab): 3 pokéballs en mesa `{x:6,y:3}` `{x:7,y:3}` `{x:8,y:3}`
   - Componente `LabPokeball.tsx` (sprite world) + `LabPokeballModal.tsx` (modal pantalla)
   - El modal se renderiza **fuera** del `BackgroundContainer` → centrado en pantalla siempre
   - `pokeballCardId` en `uiSlice` → incluido en `selectMenuOpen` → freeze automático
   - ← / → para cambiar Sí/No en el modal
5. Con ≥1 pokémon: quest walk de Ruta 1 ya no está `active` → puede pasar

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
