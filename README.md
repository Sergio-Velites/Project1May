# WeddingBoy — Invitación de Boda estilo Game Boy

Web interactiva para una invitación de boda con estética Game Boy clásica (Pokémon Rojo/Azul).  
Motor base: [chase-manning/pokemon-js](https://github.com/chase-manning/pokemon-js) (MIT).

**Demo**: desplegado en Vercel · Jugable en cualquier navegador, escritorio y móvil.

---

## Stack

| Capa | Tecnología |
|---|---|
| Shell | Next.js 16 (App Router) + TypeScript |
| Juego | React 18 + TypeScript + Redux + styled-components (CRA build) |
| Despliegue | Vercel |
| Guardado | Supabase (partidas por dispositivo vía UUID) |

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

```bash
# Clonar la fuente del juego (una sola vez, fuera del repo)
git clone https://github.com/chase-manning/pokemon-js.git game-src
cd game-src && npm install --legacy-peer-deps

# Hacer cambios en game-src/src/ ...

# Recompilar y copiar al shell
PUBLIC_URL=/game DISABLE_ESLINT_PLUGIN=true GENERATE_SOURCEMAP=false npm run build
cp -r build/* ../public/game/
```

El juego compilado vive en `/public/game/` y Next.js lo sirve como archivos estáticos.  
**No editar `/public/game/` directamente** — ese directorio es output de build.

---

## Variables de entorno

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Crear `.env.local` en la raíz con esas dos variables.

---

## Despliegue en Vercel

1. Importar el repo en [vercel.com](https://vercel.com) → **New Project**
2. Framework: **Next.js** (detección automática)
3. Añadir las variables de entorno en Settings → Environment Variables
4. Cada push a `master` despliega automáticamente

---

## Sistema de guardado (Supabase)

Cada dispositivo recibe un UUID anónimo en su primera visita (`localStorage`).  
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

---

## Estructura del proyecto

```
/
├── app/                    # Next.js shell (mínimo)
│   ├── layout.tsx
│   ├── page.tsx            # Redirect → /game/index.html
│   └── globals.css
├── lib/supabase/           # Cliente Supabase
├── public/game/            # Build del juego (no editar directamente)
├── CLAUDE.md               # Documentación técnica del motor del juego
└── package.json
```

Para la documentación técnica completa del motor (mapas, NPCs, combates, quests, etc.) ver **CLAUDE.md**.
