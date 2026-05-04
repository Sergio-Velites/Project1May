# WeddingBoy — Invitación de Boda estilo Game Boy

Web interactiva para una invitación de boda con estética Game Boy clásica (Pokémon Rojo/Azul).  
Motor base: [chase-manning/pokemon-js](https://github.com/chase-manning/pokemon-js) (MIT).

**Demo**: desplegado en Vercel · Jugable en cualquier navegador, escritorio y móvil.

---

## Características

- Juego completo estilo Pokémon Rojo/Azul en el navegador
- Flujo narrativo: habitación del jugador → madre → laboratorio → Route 1
- 3 starters interactivos en el laboratorio (Bulbasaur, Charmander, Squirtle) — modal centrado en pantalla con ←/→ para Sí/No
- Passkey / Face ID para guardar partida; fallback local si el registro falla (sin bucles)
- Todos los textos en español, con diálogos temáticos de boda
- Video de introducción saltable · Intro del Profesor Oak con efecto typewriter
- Layout Game Boy Color responsive (escritorio y móvil)
- NPCs con diálogo puro (sin combate): se giran hacia el jugador al hablar
- Team Rocket en salida norte solo visibles hasta que el jugador recoge un pokémon

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
