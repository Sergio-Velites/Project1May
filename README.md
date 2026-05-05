# WeddingBoy — Invitación de Boda estilo Game Boy

Web interactiva para una invitación de boda con estética Game Boy clásica (Pokémon Rojo/Azul).  
Motor base: [chase-manning/pokemon-js](https://github.com/chase-manning/pokemon-js) (MIT).

**Demo**: desplegado en Vercel · Jugable en cualquier navegador, escritorio y móvil.

---

## Características implementadas

- Motor completo estilo Pokémon Rojo/Azul: combates, Pokédex, ítems, guardado, evoluciones
- **Mecánicas Gen I fieles al original**: growth rates (4 grupos), fórmulas XP, stat stages, críticos 10%, captura con 4 sacudidas reales
- **Narrativa de boda** integrada en cada zona: textos, NPCs y diálogos temáticos
- 3 starters interactivos en el laboratorio con modal centrado (←/→ para Sí/No)
- Passkey / Face ID para guardar partida; fallback local sin bucles si el registro falla
- Video de introducción saltable · Intro del Prof. Oak con efecto typewriter
- Layout Game Boy Color responsive (escritorio y móvil, aspect ratio 3:5 fijo)
- NPCs con diálogo puro (sin combate) que se giran hacia el jugador al hablar
- Team Rocket en salida norte desaparecen cuando el jugador tiene ≥1 pokémon
- Pasajes de texto dependientes de estado (estado del juego → texto diferente)
- `hideCondition` en TrainerType: ocultar NPCs según condición de juego

## Narrativa completa (hoja de ruta)

### Acto I — Pueblo Paleta / DESTILERÍA DEL PROF. OAK ✅
- Habitación del jugador → madre → laboratorio → 3 starters
- Team Rocket bloquean la salida norte hasta tener pokémon
- Prof. Oak da el discurso de bienvenida y anima a ir al bosquecillo

### Acto II — Ruta 1 🔲
- **NPC "invitado cabreado"** (youngster): _"¡No te creas que llegarás tan fácil! ¡Yo quería el vino y tú me lo quitaste!"_ → combate opcional
- **NPC "abuela del anís"** (beauty, no combate): _"¡No olvides que la preboda sin anís no es preboda!"_
- Hierba con encuentros aleatorios ya funcional

### Acto III — SOTO LEZKAIRU (ex Ciudad Añil / Viridian City) 🔲
- Nombre del mapa renombrado a **"SOTO LEZKAIRU"**
- **Grupo de "no invitados"** con anti-preboda de vino barato (trainers combatibles)
- NPC que desafía: _"¡Si me ganas, te diré dónde está escondida la reserva especial!"_
- **Maestro del Vino** (NPC izquierda): enseña a usar _"Vino Tinto"_ como ítem de curación
- Team Rocket norte intentando robar un barril: _"¡Con este vino seremos los reyes de la fiesta!"_
- PokéCenter y PokéMart con textos de boda

### Acto IV — EL BOSQUECILLO (ex Bosque Viridian / Viridian Forest) 🔲
- Nombre renombrado a **"EL BOSQUECILLO"**
- NPCs apuran al jugador: _"¡Corre, que la barra libre se acaba!"_
- Team Rocket intermedio: _"¡Queríamos los Pokémon de la boda, pero nos llevamos este anís de mientras!"_
- Encuentros de pokémon salvajes ya funcionales

### Acto V — VILLAMAYOR DE MONJARDÍN (ex Ciudad Plateada / Pewter City) 🔲
- Nombre renombrado a **"VILLAMAYOR DE MONJARDÍN"**
- NPCs brindan: _"¡Aquí se hace vino del bueno, pero primero tienes que ganar!"_
- **Bodega CASTILLO DE MONJARDÍN** (ex Gimnasio): tipo **"Vino"** (ficticio, referenciado explícitamente)
- **Líderes Sergio y Marta** esperan entre barricas:
  - Intro: _"¡Te lo advertimos, aquí se sirve vino… solo si nos vences primero!"_
  - Victoria: _"¡Nos vemos el 8 de agosto, y esta vez tú brindas con nosotros!"_
- Obtener la **Insignia del Vino** al ganar

---

## Stack

| Capa | Tecnología |
|---|---|
| Shell | Next.js 16 (App Router) + TypeScript |
| Juego | React 18 + TypeScript + Redux + styled-components (CRA build) |
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

El código fuente del juego está en `game-src/src/` (ya incluido en este repo).  
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
