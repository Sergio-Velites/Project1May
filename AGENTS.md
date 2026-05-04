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

## Estado actual del juego (commit 8433186)

### Flujo de inicio
1. **GameboyMenu** → menú de encendido
2. **IntroVideo** → vídeo intro (saltable A/B)
3. **TitleScreen** → pantalla título
4. **LoadScreen** → gestión save/load:
   - Detecta WebAuthn disponible → **obliga** registro de passkey (Face ID / huella)
   - No hay opción de saltarse el registro
   - Si no hay partida guardada → solo "Nueva partida"
   - Si hay partida → "Continuar" + "Nueva partida"
5. **OakIntro** → intro del Profesor Oak con typewriter
6. **NameKeyboard** → elegir nombre del jugador
7. Juego comienza en `PalletTownHouseA2F` (habitación del jugador), sin pokémon

### Estado inicial del jugador
- Sin pokémon en equipo ni en PC
- Mapa: `PalletTownHouseA2F` pos (3,6)
- Inventario: 2 Pokéballs
- `defeatedTrainers: ["pallet-town-lab-5-2"]` (Oak ya pre-derrotado)

### Narrativa del primer acto
1. Jugador en su habitación → baja a cocina
2. **Madre (beauty NPC)** bloquea la puerta de salida en `house-a-1f` (pos x:2,y:6)
   - Es un trainer con Ratata lvl 1 → combate obligatorio → texto de bronca
   - Tras ganar: puede salir de casa
3. En **Pallet Town** norte (y:0-1 cols 10-11): quest walk bloquea si `pokemon.length===0`
   - Texto "¡Viva el vino!... hip! Ve al laboratorio primero!"
   - Acción: `setPos({x, y:2})` (le devuelve)
4. En el **Laboratorio** (pallet-town-lab): 3 pokéballs en mesa (x:2,4,5 en y:3)
   - Componente `LabPokeball.tsx` gestiona selección
   - Pulsar A frente a pokéball → cuadro sprite + confirmación Sí/No
   - Primera pokéball: confirmación directa
   - 2ª/3ª pokéball: texto "borracho" → luego confirmación
   - Equipo lleno (6): aviso
   - Pokémon recogido se marca con `completeQuest("lab-starter-taken-{id}")`
5. Con ≥1 pokémon: quest walk de Route 1 ya no está `active` → puede pasar

---

## Problemas conocidos y soluciones

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
Para NPCs de solo-diálogo sin combate, usar el campo `text` del mapa (tiles de texto)  
o quests tipo "talk" en `use-quests.ts`.

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
| `game-src/src/state/gameSlice.ts` | Estado global: pokémon, mapa, pos, saves |
| `game-src/src/state/uiSlice.ts` | UI: textos, menús, confirmaciones |
| `game-src/src/app/use-quests.ts` | Sistema de quests (walk/talk triggers) |
| `game-src/src/app/cloud-save.ts` | Supabase Edge Functions + WebAuthn passkey |
| `game-src/src/components/LoadScreen.tsx` | Flujo inicio: passkey → save → oak-intro |
| `game-src/src/components/OakIntro.tsx` | Intro Oak con typewriter por línea |
| `game-src/src/components/NameKeyboard.tsx` | Teclado Game Boy para nombre |
| `game-src/src/components/LabPokeball.tsx` | Pokéballs interactivas del lab |
| `game-src/src/components/Pokedex.tsx` | Pokédex lista + ficha detalle |
| `game-src/src/components/PokemonSummary.tsx` | Ficha pokémon (pág1: estado, pág2: habilidades) |
| `game-src/src/components/Menu.tsx` | Menú genérico (battle menu usa `compact` mode) |
| `game-src/src/maps/lab.ts` | Laboratorio con Oak NPC y texto pokéballs |
| `game-src/src/maps/pallet-town.ts` | Pueblo Paleta con NPCs boda y tiles borrachos |
| `game-src/src/maps/house-a-1f.ts` | Casa del jugador 1F con madre bloqueando |
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
