# WeddingBoy — Invitación de Boda estilo Game Boy

Web interactiva para una invitación de boda con estética Game Boy clásica (Pokémon Rojo/Azul).  
Motor base: [chase-manning/pokemon-js](https://github.com/chase-manning/pokemon-js) (MIT).

**Demo**: desplegado en Vercel · Jugable en cualquier navegador, escritorio y móvil.

---

## Índice

1. [¿Qué es este proyecto?](#qué-es-este-proyecto)
2. [¿Cómo lo experimenta el invitado?](#cómo-lo-experimenta-el-invitado)
3. [Narrativa completa (Actos I–V)](#narrativa-completa-actos-iv)
4. [Panel de administración](#panel-de-administración)
5. [Stack técnico](#stack-técnico)
6. [Estructura de carpetas](#estructura-de-carpetas)
7. [Arquitectura en dos capas](#arquitectura-en-dos-capas)
8. [Sistema de guardado (Supabase + WebAuthn)](#sistema-de-guardado-supabase--webauthn)
9. [Desarrollo local](#desarrollo-local)
10. [Flujo de compilación y despliegue](#flujo-de-compilación-y-despliegue)
11. [Variables de entorno](#variables-de-entorno)
12. [Dificultades conocidas y soluciones](#dificultades-conocidas-y-soluciones)
13. [Licencia](#licencia)

---

## ¿Qué es este proyecto?

WeddingBoy es una invitación de boda interactiva que replica la experiencia de los juegos Pokémon Rojo/Azul de Game Boy. En lugar de recibir una invitación en papel, los invitados reciben un enlace a una web jugable donde avanzan por una historia personalizada de la boda, capturan Pokémon, completan misiones y pueden batirse contra otros invitados en tiempo real.

- **Sin ROMs, sin assets de Nintendo**: todos los gráficos y lógica son de la base open-source `chase-manning/pokemon-js` (MIT), adaptados y extendidos.
- **Sin instalación**: funciona en cualquier navegador moderno (Chrome, Safari, Firefox), escritorio y móvil.
- **Guardado en la nube**: cada invitado vincula su partida con Face ID / huella digital mediante WebAuthn. No requiere cuenta, email ni contraseña.

---

## ¿Cómo lo experimenta el invitado?

1. **Reciben el enlace** (ej. `https://weddingboy.vercel.app`)
2. **Pantalla Game Boy** → pulsan "ENCENDER"
3. **Vídeo de introducción** (saltable con A/B)
4. **Pantalla de título** → pulsan A para empezar
5. **Gestión de partida**:
   - Primera vez: el juego pide registrar Face ID / huella para guardar en la nube
   - Si el registro falla o no hay WebAuthn: juegan con UUID local (sin guardar en nube)
   - Si ya tienen partida guardada: aparece "Continuar" y "Nueva partida"
6. **Intro del Prof. Oak** (solo nueva partida): typewriter con sprites
7. **Eligen su nombre** en un teclado estilo Game Boy
8. **Juegan**: la historia sigue los 5 actos de la boda
9. Desde cualquier **Centro Pokémon** pueden retar a otros invitados en tiempo real

El juego es completamente autónomo: no requiere que el organizador haga nada una vez desplegado.

---

## Narrativa completa (Actos I–V)

La historia es una parodia cariñosa de los juegos Pokémon originales, con todos los textos y nombres adaptados a la boda.

### Acto I — Pueblo Paleta / DESTILERÍA DEL PROF. OAK ✅
- Jugador despierta en su habitación (2F), baja a la cocina
- **Madre** (beauty, persistente): bronca al bajar las escaleras — quest `madre-bronca-done`
- Sale a PUEBLO PALETA
- **Team Rocket** (x:10-11, y:0): bloquean la salida norte si no hay pokémon; desaparecen al tenerlos (`hideCondition: "has-pokemon"`)
- **Prof. Oak** (laboratorio, x:5,y:1): discurso de bienvenida a la boda
- **3 Pokéballs** en el laboratorio (x:6,7,8, y:3): modal `LabPokeballModal` centrado en pantalla → elegir starter

### Acto II — Ruta 1 · Camino al Soto ✅
- **Invitado cabreado** (youngster, combate, 50₽): _"¡Yo quería el vino y tú me lo quitaste!"_
- **Abuela del anís** (beauty, decorativo): _"¡La preboda sin anís no es preboda!"_
- Mensajero (lass), pescador (fisher, combate, 70₽), marinero (sailor, combate, 90₽)

### Acto III — SOTO LEZKAIRU ✅
- Mapa renombrado de Viridian City · música `pewter-city.mp3`
- **cueBall** (combate, 80₽): grupo anti-preboda
- **jrTrainerFemale** (combate, 100₽): refuerzo del grupo
- **Team Rocket grunt** (combate, 200₽): robando el barril de vino
- **Maestro del Vino** (gentleman, decorativo + quest `vino-tinto-dado`): da SodaPop como _"Vino Tinto"_ una sola vez
- Carteles temáticos de Lezkairu

### Acto IV — EL BOSQUECILLO ✅
- Mapa renombrado de Viridian Forest
- NPCs decorativos dispersos que apuran al jugador: _"¡Corre, que la barra libre se acaba!"_, _"¡El DJ ya está calentando!"_
- Team Rocket bloqueando el paso (combate, 150₽)
- Hierba densa con encuentros aleatorios funcionales

### Acto V — VILLAMAYOR DE MONJARDÍN ✅
- Mapa renombrado de Pewter City
- **Bodega CASTILLO DE MONJARDÍN** (ex gimnasio): tipo VINO
- **Guardián** (sailor, combate, 300₽): bloquea la entrada a los líderes
- **Sergio** (aceTrainerMale, combate, 1400₽): Growlithe lvl14 + Ponyta lvl12 → da `BoulderBadge` (Insignia del Vino) + TM34
- **Marta** (aceTrainerFemale, combate, 1600₽): Butterfree lvl16 + Clefairy lvl14
- Quest en Pewter City guía al jugador hacia el gimnasio si no tiene insignias

---

## Panel de administración

Accesible en `/admin` (protegido con cookie `ADMIN_PASSWORD` vía middleware).

### ¿Qué muestra?

- **Lista de todos los invitados** con RSVP (y los que han jugado sin RSVP)
- **Estadísticas globales**: total RSVPs, asistentes, rechazados, sin RSVP
- **Tarjeta expandible** por invitado con:
  - Datos RSVP: acompañante, niños, autobús ida/vuelta, preboda, alergias
  - Ubicación actual en el juego (mapa + coordenadas)
  - Equipo Pokémon (sprites) y Pokédex completa (vistos + capturados)
  - Inventario / mochila con dinero e insignias
  - Logros (quests completadas)
  - Botones de impersonación (jugar como ese invitado, recuperar partida)
- **Ordenación** por 6 criterios (posición, nombre, capturados, vistos, quests, nivel) con toggle asc/desc
- **Medallas** únicas: máximo 12 premios, un ganador por medalla; si hay empate nadie recibe esa medalla

### Medallas del panel admin

| Medalla | Criterio |
|---|---|
| 🏆 El Mayor Entrenador | Más Pokémon capturados |
| 🔭 El Gran Observador | Más vistos sin capturar |
| 📜 El Completista | Más logros/quests completadas |
| 💪 El Más Fuerte | Pokémon de mayor nivel |
| 💰 El Más Rico | Más dinero acumulado |
| 🎒 El Acaparador | Más objetos en la mochila |
| 🗺️ El Gran Explorador | Zona más lejana alcanzada |
| 🎖️ El más Condecorado | Más insignias de Bodega |
| 💻 El Archivero | Más Pokémon en el PC |
| ✨ Cazador de Leyendas | Más legendarios capturados |
| 🧭 El Explorador Metódico | Mejor ratio vistos/zona |
| 🌱 El Mentor | Mayor nivel mínimo del equipo |

### Exportar CSV

El botón de descarga exporta todos los datos RSVP a CSV para uso externo (catering, transporte, etc.).

### Map Editor (`/admin/map-editor`)

Editor visual de los 163 mapas del juego, sin tocar código a mano:

- **Edición completa**: muros, hierba, agua, salientes direccionales, portales,
  NPCs/entrenadores (con auto-equipos), encuentros (con auto-relleno por
  terreno/hora), objetos, textos, rocas, árboles de bayas, música, minimapa…
- **Imagen del mapa**: botón 🖼 para **subir un PNG que reemplaza el del mapa**
  (commit automático al repo + preview instantáneo) e inputs de **width/height
  en tiles** (16 px = 1 tile) con propuesta automática según el PNG subido.
- **💾 Guardar** hace doble persistencia: preview inmediato en Supabase y
  **commit quirúrgico del `.ts`** del mapa a `master` vía GitHub API (conserva
  todo lo que el editor no gestiona y reconcilia imports).
- **🛠 Compilar juego**: dispara un GitHub Action que recompila el bundle CRA y
  lo commitea — los cambios llegan al juego jugable en unos minutos.
- Usable en móvil/tablet (gestos de dos dedos para desplazar y pinch-zoom).

---

## Stack técnico

| Capa | Tecnología | Notas |
|---|---|---|
| Shell wrapper | Next.js 16 (App Router) + TypeScript | Solo gestiona routing, admin y RSVP |
| Juego | React 18 + TypeScript + Redux Toolkit + styled-components | Compilado con CRA (`react-scripts build`) |
| Motor base | [chase-manning/pokemon-js](https://github.com/chase-manning/pokemon-js) (MIT) | Extendido con mecánicas Gen I completas |
| Despliegue | Vercel | Branch `master` → producción automática |
| DB / Auth | Supabase (PostgreSQL) | Partidas cloud + WebAuthn passkey + Edge Functions |
| Admin auth | Middleware Next.js + cookie | Sin JWT, sin OAuth — solo password de admin |

---

## Estructura de carpetas

```
/
├── app/                        # Next.js shell
│   ├── page.tsx                # Redirect → /game/index.html
│   ├── globals.css             # Estilos globales (fuente Game Boy, colores)
│   ├── admin/                  # Panel de administración
│   │   ├── page.tsx            # Server Component — fetch RSVPs
│   │   ├── AdminDashboard.tsx  # Client Component — sorting + render tarjetas
│   │   ├── admin-medals.ts     # Lógica pura de medallas (sin React)
│   │   ├── CsvDownload.tsx     # Exportar CSV
│   │   ├── ImpersonateButtons.tsx  # Botones impersonar invitado
│   │   ├── item-names.ts       # Labels de ítems y badges
│   │   └── quest-names.ts      # Labels de quests
│   └── api/                    # API routes Next.js
│       └── admin/              # Endpoints admin (Pokedex flavor, etc.)
│
├── game-src/                   # ← SOURCE del juego (EDITAR AQUÍ)
│   ├── src/
│   │   ├── App.tsx             # Punto de entrada React
│   │   ├── app/                # Lógica del juego
│   │   │   ├── cloud-save.ts   # Supabase + WebAuthn passkey
│   │   │   ├── move-helper.ts  # Mecánicas Gen I (stats, criticos, efectos)
│   │   │   ├── level-helper.ts # Growth rates + movimientos por nivel
│   │   │   ├── xp-helper.ts    # Fórmula XP Gen I (×1.5 entrenadores)
│   │   │   ├── pokeball-helper.ts  # Captura Gen I con 4 sacudidas
│   │   │   ├── pokemon-cry.ts  # Singleton para gritos Pokémon (evita GC)
│   │   │   ├── use-quests.ts   # Sistema de quests (walk/talk triggers)
│   │   │   ├── move-metadata.ts    # ~24k líneas: nombres ES de movimientos
│   │   │   ├── pokemon-metadata.ts # Metadatos 151 Pokémon (growthRate, etc.)
│   │   │   ├── npcs.ts         # 40+ tipos de NPC con sprites
│   │   │   └── emitter.ts      # Bus de eventos global (mitt)
│   │   ├── components/         # Componentes React del juego
│   │   │   ├── Game.tsx        # Componente raíz — monta todos los sistemas
│   │   │   ├── PokemonEncounter.tsx  # Combate principal (stages 0-52)
│   │   │   ├── TrainerEncounter.tsx  # Encuentros NPC + diálogos
│   │   │   ├── LoadScreen.tsx  # Flujo inicio: passkey → save → oak-intro
│   │   │   ├── OakIntro.tsx    # Intro Oak typewriter
│   │   │   ├── NameKeyboard.tsx    # Teclado Game Boy para nombre
│   │   │   ├── LabPokeball.tsx     # Sprites pokéball (world coords)
│   │   │   ├── LabPokeballModal.tsx # Modal starter (screen coords)
│   │   │   ├── OnlineBattleNpc.tsx  # Detecta A frente al scientist
│   │   │   ├── OnlineBattleMenu.tsx # Flujo batalla online
│   │   │   ├── Evolution.tsx   # Animación evolución + movimientos
│   │   │   ├── Trainer.tsx     # Sprite NPC con npcFacings override
│   │   │   └── MoveSelect.tsx  # Selector movimiento a olvidar
│   │   ├── maps/               # Definición de los 33 mapas
│   │   │   ├── map-types.ts    # Interfaces MapType, TrainerType
│   │   │   ├── map-data.ts     # Registro de todos los mapas
│   │   │   ├── pallet-town.ts  # PUEBLO PALETA
│   │   │   ├── route-1.ts      # Ruta 1 · Camino al Soto
│   │   │   ├── viridian-city.ts    # SOTO LEZKAIRU
│   │   │   ├── viridian-forrest.ts # EL BOSQUECILLO
│   │   │   ├── pewter-city.ts  # VILLAMAYOR DE MONJARDÍN
│   │   │   ├── pewter-city-gym.ts  # Bodega CASTILLO DE MONJARDÍN
│   │   │   └── ...             # +27 mapas más
│   │   └── state/              # Redux Toolkit
│   │       ├── gameSlice.ts    # Estado global del juego
│   │       ├── uiSlice.ts      # Estado UI (menús, textos, overlays)
│   │       └── state-types.ts  # Interfaces GameState, PokemonInstance, etc.
│   └── build/                  # Build local (NO commitear este directorio directamente)
│
├── public/
│   ├── game/                   # ← BUILD del juego (NO editar directamente)
│   │   ├── index.html
│   │   ├── static/js/          # Bundle React compilado (main.HASH.js)
│   │   ├── sfx/                # Efectos de sonido
│   │   └── styles/             # Fuentes y estilos
│   └── editor/                 # Assets para el editor de mapas (generados por prebuild)
│
├── supabase/
│   ├── functions/              # Edge Functions Deno
│   │   ├── save-game/          # Guardar partida
│   │   ├── load-game/          # Cargar partida
│   │   ├── list-players/       # Lista jugadores para batalla online
│   │   ├── save-rsvp/          # Guardar RSVP del invitado
│   │   ├── get-all-rsvp/       # Obtener todos los RSVPs (admin)
│   │   ├── webauthn-register-start/   # Inicio registro passkey
│   │   ├── webauthn-register-finish/  # Fin registro passkey
│   │   ├── webauthn-auth-start/       # Inicio auth passkey
│   │   └── webauthn-auth-finish/      # Fin auth passkey
│   └── migrations/             # SQL migrations de Supabase
│
├── lib/supabase/               # Clientes Supabase (server + client)
├── scripts/
│   └── setup-editor.mjs        # Prebuild: copia assets y procesa mapas
├── middleware.ts                # Protección ruta /admin con cookie
├── next.config.ts
└── vercel.json
```

---

## Arquitectura en dos capas

El proyecto tiene una separación muy clara entre el **shell Next.js** y el **juego React**:

```
Next.js (shell)                    Juego (CRA)
─────────────────                  ──────────────────────────────
app/page.tsx                 →     public/game/index.html
  ↓ redirect                         ↓ sirve como estático
app/admin/page.tsx           →     Supabase edge functions
  ↓ fetch RSVPs                       (save-game, load-game, list-players)
app/api/                     →     game-src/src/ (fuente del juego)
  (endpoints internos)                ↓ compilado con react-scripts
```

**Por qué esta arquitectura**: el juego fue construido inicialmente como CRA standalone. Integrar Next.js encima como wrapper permite añadir páginas server-side (admin, RSVP, API routes) sin reescribir el juego. El `tsconfig.json` raíz **excluye `game-src/`** para que Next.js no intente compilarlo.

---

## Sistema de guardado (Supabase + WebAuthn)

### Flujo de registro (primera vez)

1. El navegador detecta soporte WebAuthn (Face ID / huella)
2. `webauthn-register-start` → genera un challenge
3. El dispositivo crea las credenciales biométricas
4. `webauthn-register-finish` → verifica y devuelve `player_id` (UUID)
5. El UUID se guarda en `localStorage` como `wedding_user_id`
6. Las partidas se guardan/cargan contra ese UUID en Supabase

### Fallback si falla el registro

Si `webauthn-register-finish` falla (ej. red inestable), el juego genera un UUID local con `crypto.randomUUID()` y sigue sin guardar en la nube. El invitado puede vincular Face ID más tarde desde la URL `/?recover=UUID`.

### Esquema Supabase

```sql
-- Partidas
CREATE TABLE saves (
  player_id  UUID        PRIMARY KEY,
  game_state JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RSVP (confirmación de asistencia)
CREATE TABLE rsvp (
  player_id    UUID        REFERENCES saves(player_id),
  player_name  TEXT,
  attended     BOOLEAN,
  companion    TEXT,
  children     INTEGER DEFAULT 0,
  allergies    TEXT,
  preboda      BOOLEAN DEFAULT FALSE,
  bus_outbound TEXT DEFAULT 'none',
  bus_return   TEXT DEFAULT 'none',
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_saves" ON saves FOR ALL USING (true);
```

### Batallas online entre invitados

Desde cualquier Centro Pokémon, el NPC **scientist** (pos `{x:10,y:2}`) permite retar a otro invitado:
1. `list-players` edge function devuelve `{playerId, name, pokemonCount}[]`
2. El jugador selecciona un rival
3. `load-game` carga el `game_state` del rival
4. Se construye un `TrainerType` con los Pokémon del rival (`isOnline: true`)
5. La batalla se resuelve localmente — no se modifica el guardado del rival
6. `isOnline: true` → la batalla no se añade a `defeatedTrainers` (repetible)

---

## Desarrollo local

```bash
# 1. Clonar el repo
git clone https://github.com/Sergio-Velites/Project1May
cd Project1May

# 2. Instalar dependencias del shell Next.js
npm install

# 3. Instalar dependencias del juego (solo la primera vez)
(cd game-src && npm install --legacy-peer-deps)

# 4. Servidor de desarrollo Next.js
npm run dev
# → http://localhost:3000 (redirige a /game/index.html)
```

> El servidor `npm run dev` sirve el build estático del juego desde `public/game/`.
> Para ver cambios en el juego, hay que compilarlo primero (ver sección siguiente).

---

## Flujo de compilación y despliegue

### ⚠️ Regla crítica: siempre usar subshell para compilar

`run_in_terminal` (y muchas shells) colapsan `cd X && comando` — el `cd` se pierde. **Usar siempre subshell**:

```bash
# ✅ CORRECTO
(cd /ruta/absoluta/game-src && comando)

# ❌ INCORRECTO — el comando se ejecuta en el directorio anterior
cd game-src && comando
```

### Proceso completo de compilación + deploy

```bash
# 1. Editar archivos en game-src/src/

# 2. Compilar el juego
(cd /Users/appsvelites/Projects/Project1May/game-src && \
  PUBLIC_URL=/game DISABLE_ESLINT_PLUGIN=true GENERATE_SOURCEMAP=false \
  node_modules/.bin/react-scripts build) 2>&1 | tail -20

# 3. Ver el nuevo hash del bundle
ls game-src/build/static/js/main.*.js
# → main.NEWHASH.js

# 4. Copiar build a public/game/ y eliminar el bundle anterior
cp -r game-src/build/* public/game/
rm -f public/game/static/js/main.OLDHASH.js \
      public/game/static/js/main.OLDHASH.js.LICENSE.txt

# 5. Commit y push
git add public/game/ game-src/src/
git commit -m "feat: descripción del cambio"
git push origin master
```

Cada push a `master` desencadena un despliegue automático en Vercel (~30 segundos).

### ⚠️ Usar siempre node_modules/.bin/react-scripts

```bash
# ✅ CORRECTO
node_modules/.bin/react-scripts build

# ❌ INCORRECTO — npx puede usar una versión diferente o fallar con TypeScript
npx react-scripts build
```

### Variables de entorno necesarias para compilar

```bash
PUBLIC_URL=/game          # Prefijo de rutas para assets estáticos
DISABLE_ESLINT_PLUGIN=true  # Evita errores de lint que bloqueen el build
GENERATE_SOURCEMAP=false    # Bundle más pequeño y rápido
```

### Cambios solo en Next.js (admin, RSVP, API)

Los cambios en `app/` **no requieren compilar el juego**. Solo:

```bash
git add app/
git commit -m "feat: descripción"
git push origin master
```

---

## Variables de entorno

### `game-src/.env` (para el juego, no commitear)

```bash
REACT_APP_SUPABASE_URL=https://<project-ref>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<anon-key>
```

### Vercel (configurar en el dashboard del proyecto)

```bash
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  # Solo para edge functions admin
ADMIN_SECRET=<contraseña-panel-admin>
```

---

## Controles

| Acción | Teclado | On-screen |
|---|---|---|
| Mover | Flechas ← ↑ ↓ → | D-pad |
| Confirmar / Hablar | Z / Enter | Botón A |
| Cancelar | X / Escape | Botón B |
| Menú Start | Enter | START |
| Select | Shift | SELECT |

---

## Dificultades conocidas y soluciones

### 1. `cd X && comando` no preserva el directorio en run_in_terminal
**Causa**: la integración del terminal colapsa el comando. El `cd` no persiste.  
**Solución**: usar siempre subshell `(cd /ruta && comando)`.

### 2. react-scripts falla con "Cannot find module 'typescript'"
**Causa**: se lanza desde la raíz del proyecto, donde no está `typescript` instalado.  
**Solución**: subshell que fuerza CWD a `game-src/`.

### 3. Bucle infinito en la pantalla de passkey
**Causa**: `webauthn-register-finish` falla silenciosamente → la fase vuelve a `require-passkey` → bucle sin salida.  
**Solución implementada**: tras el primer fallo se activa `registrationFailed=true` → la opción cambia a "Jugar sin guardar" (UUID local con `crypto.randomUUID()`).

### 4. Modal/overlay no queda centrado en pantalla
**Causa**: `BackgroundContainer` tiene `transform: translate(...)` que mueve todo su contenido con el scroll del mapa.  
**Solución**: separar en dos componentes — el sprite en world coords (dentro de `BackgroundContainer`) y el modal en screen coords (fuera, en `Game.tsx`). Estado compartido via Redux (`pokeballCardId` en `uiSlice`).

### 5. `showText` + setTimeout no es seguro
**Causa**: el usuario puede cerrar el texto antes de que el timeout dispare la acción siguiente.  
**Solución**: usar siempre `dispatch(showTextThenAction({ text: ["..."], action: () => doSomething() }))`.

### 6. Gritos Pokémon silenciosos (bug GC)
**Causa**: `new Audio(url)` sin guardar referencia → el GC recoge el objeto antes de que `play()` se ejecute.  
**Solución**: módulo singleton `pokemon-cry.ts` con `let lastAudio: HTMLAudioElement | null` a nivel de módulo para evitar la recolección.

### 7. Trainers desaparecían tras ser derrotados
**Solución**: `Game.tsx` ya no filtra trainers por `defeatedTrainers`. Solo `hideCondition: "has-pokemon"` puede ocultar un NPC. Los trainers derrotados permanecen en su tile y muestran `outtro` al pulsar A.

### 8. Bug KO: el combate continuaba después de que el jugador cayera KO
**Causa**: el orden era curar primero, cerrar combate después → el combate detectaba pokémon curados y continuaba.  
**Solución**: Stage 27 de `PokemonEncounter.tsx`: `endEncounter_(true)` a t=1000ms, `recoverFromFainting()` a t=1500ms.

### 9. NPC "Ash" aparecía durante el switch de pokémon
**Causa**: añadir `setStage(3)` en `performSwitchTo` activaba la animación `ChangePokemon` (slide-out) con `leftImage()=playerBack` (sprite de Ash) porque `leftImage()` devuelve `playerBack` cuando `stage <= 3`.  
**Solución**: eliminar `setStage(3)` de `performSwitchTo`. La lista de Pokémon (stages 13/25) sirve de cortina visual durante los 1300ms hasta que `throwPokeball` dispara `setStage(4)`.

### 10. Turbopack rechaza template literals mal cerrados
**Causa**: un backtick de cierre sustituido por `"` en una cadena de texto genera un error de parsing opaco.  
**Diagnóstico**: mirar el número de línea del error de Turbopack, buscar template literal sin cerrar.

### 11. replace_string_in_file puede duplicar contenido
Si el patrón a reemplazar coincide con el comentario de cabecera pero no con el resto del archivo, el nuevo contenido se inserta antes del viejo en lugar de reemplazarlo. Verificar siempre el tamaño del archivo con `wc -l` después de edits grandes.

---

## Licencia

Motor base: [chase-manning/pokemon-js](https://github.com/chase-manning/pokemon-js), licencia MIT.  
Sprites y assets: del repositorio base. Sin ROMs ni assets de Nintendo / Game Freak / The Pokémon Company.


- Motor completo estilo Pokémon Rojo/Azul: combates, Pokédex, ítems, guardado, evoluciones
- **Mecánicas Gen I fieles al original**: growth rates (4 grupos), fórmulas XP, stat stages, críticos 10%, captura con 4 sacudidas reales, drain/recoil, flinch, leech-seed, counter, metronome, super-fang, dream-eater
- **Narrativa de boda** integrada en todos los actos I–V: textos, NPCs y diálogos temáticos
- 3 starters interactivos en el laboratorio con modal centrado (←/→ para Sí/No)
- Passkey / Face ID para guardar partida; fallback local sin bucles si el registro falla
- Video de introducción saltable · Intro del Prof. Oak con efecto typewriter
- Layout Game Boy Color responsive (escritorio y móvil, aspect ratio 3:5 fijo)
- NPCs con diálogo puro (sin combate) que se giran hacia el jugador al hablar
- Team Rocket en salida norte desaparecen cuando el jugador tiene ≥1 pokémon
- Entrenadores derrotados permanecen visibles en el mapa y saludan con su `outtro`
- Evolución de pokémon aprende movimientos del nuevo formulario automáticamente
- Recuperación tras KO siempre en el último Centro Pokémon donde se curó
- **Batallas online** entre invitados: scientist NPC en los centros Pokémon carga el equipo de otro jugador desde Supabase y lanza la batalla en tiempo real

## Narrativa completa

### Acto I — Pueblo Paleta / DESTILERÍA DEL PROF. OAK ✅
- Habitación del jugador → madre → laboratorio → 3 starters
- Team Rocket bloquean la salida norte hasta tener pokémon
- Prof. Oak da el discurso de bienvenida a la boda

### Acto II — Ruta 1 · Camino al Soto ✅
- NPC **invitado cabreado** (youngster, combate): _"¡Yo quería el vino y tú me lo quitaste!"_
- NPC **abuela del anís** (beauty, decorativo): _"¡La preboda sin anís no es preboda!"_
- Mensajero, pescador y marinero con diálogos temáticos de boda

### Acto III — SOTO LEZKAIRU ✅
- Mapa renombrado de Viridian City
- Grupo **anti-preboda** (cueBall + jrTrainerFemale, combatibles)
- **Team Rocket** robando la reserva de vino (combate, 200 pokedólares)
- **Maestro del Vino** (gentleman, decorativo + quest): da SodaPop como _"Vino Tinto"_ una sola vez
- DJ preparando el equipo, carteles temáticos de Lezkairu

### Acto IV — EL BOSQUECILLO ✅
- Mapa renombrado de Viridian Forest
- NPCs decorativos que apuran al jugador: _"¡Corre, que la barra libre se acaba!"_
- Team Rocket bloqueando el paso (combate, 150 pokedólares)
- Hierba densa con encuentros aleatorios funcionales

### Acto V — VILLAMAYOR DE MONJARDÍN ✅
- Mapa renombrado de Pewter City
- **Bodega CASTILLO DE MONJARDÍN** (ex gimnasio): tipo VINO
- Guardián de la bodega (sailor) antes de los líderes
- **Líderes Sergio** (aceTrainerMale) y **Marta** (aceTrainerFemale) con intro y outtro de boda
- **Insignia del Vino** (`BoulderBadge`) + TM34 al ganar

---

## Stack

| Capa | Tecnología |
|---|---|
| Shell | Next.js 16 (App Router) + TypeScript |
| Juego | React 18 + TypeScript + Redux Toolkit + styled-components (CRA build) |
| Despliegue | Vercel |
| Guardado | Supabase + WebAuthn passkey |

---

## Desarrollo local

```bash
# 1. Instalar dependencias del shell Next.js
npm install

# 2. Servidor local
npm run dev
# → http://localhost:3000 (redirige a /game/index.html)
```

### Editar el juego (fuente)

El código fuente del juego está en `game-src/src/` (incluido en este repo).  
**No hay que clonar nada extra.**

```bash
# Solo la primera vez, o tras clonar el repo:
cd game-src && npm install --legacy-peer-deps

# Hacer cambios en game-src/src/ ...

# Recompilar (usar siempre subshell para preservar el CWD):
(cd /ruta/absoluta/game-src && \
  PUBLIC_URL=/game DISABLE_ESLINT_PLUGIN=true GENERATE_SOURCEMAP=false \
  node_modules/.bin/react-scripts build) 2>&1 | tail -20

# Copiar build y limpiar bundle anterior (sustituir OLDHASH):
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

## Licencia

Basado en [chase-manning/pokemon-js](https://github.com/chase-manning/pokemon-js), licencia MIT.  
Sprites y assets originales del repo base. Sin ROMs ni assets de Nintendo.

rm -f public/game/static/js/main.OLDHASH.js \
      public/game/static/js/main.OLDHASH.js.LICENSE.txt

# Commitear:
git add public/game/ game-src/src/
git commit -m "feat: descripción"
git push origin local-src
```

El juego compilado vive en `/public/game/` y Next.js lo sirve como archivos estáticos.  
**No editar `/public/game/` directamente** — ese directorio es output de build.

---

## Variables de entorno

```bash
# En game-src/.env (para el juego)
REACT_APP_SUPABASE_URL=https://<project-ref>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<anon-key>
```

---

## Despliegue en Vercel

1. Importar el repo en [vercel.com](https://vercel.com) → **New Project**
2. Framework: **Next.js** (detección automática)
3. Cada push a `local-src` despliega automáticamente

---

## Sistema de guardado (Supabase + WebAuthn)

Cada invitado registra una passkey (Face ID / huella) en su primera visita.  
Las partidas se sincronizan con Supabase — sin login, sin PII.

Schema SQL:
```sql
CREATE TABLE saves (
  player_id  UUID        PRIMARY KEY,
  game_state JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_saves" ON saves FOR ALL USING (true);
```

---

## Controles

| Acción | Teclado | On-screen |
|---|---|---|
| Mover | Flechas ← ↑ ↓ → | D-pad |
| Confirmar / Hablar | Z / Enter | Botón A |
| Cancelar | X / Escape | Botón B |
| Menú Start | Enter | START |
| Select | Shift | SELECT |

---

## Estructura del proyecto

```
/
├── app/                    # Next.js shell (mínimo)
│   ├── layout.tsx
│   ├── page.tsx            # Redirect → /game/index.html
│   └── globals.css
├── game-src/               # ← SOURCE del juego (editar aquí)
│   └── src/
├── lib/supabase/           # Cliente Supabase
├── public/game/            # Build del juego (no editar directamente)
├── supabase/               # Edge Functions + migrations
├── AGENTS.md               # Guía para agentes de IA
├── CLAUDE.md               # Documentación técnica completa del motor
└── package.json
```

Para la documentación técnica completa del motor (mapas, NPCs, combates, quests, etc.) ver **CLAUDE.md**.
