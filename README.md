# WeddingBoy — Invitación de Boda estilo Game Boy

Web interactiva para una invitación de boda con estética Game Boy clásica (Pokémon Rojo/Azul).  
Motor base: [chase-manning/pokemon-js](https://github.com/chase-manning/pokemon-js) (MIT).

**Demo**: desplegado en Vercel · Jugable en cualquier navegador, escritorio y móvil.

---

## Características implementadas

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
