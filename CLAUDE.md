# WeddingBoy — Invitación de Boda estilo Game Boy

## Objetivo del proyecto

Web interactiva para una invitación de boda, con estética Game Boy clásica (Pokémon Rojo/Azul).  
El juego es una parodia original: sin ROMs, sin assets de Nintendo, sin nombres de Pokémon.  
El motor base proviene del proyecto open source **chase-manning/pokemon-js** (MIT).

**Jugable en**: cualquier navegador, escritorio y móvil.  
**Desplegado en**: Vercel (rama `master`).

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
Next.js los sirve automáticamente sin ninguna configuración adicional.

---

## Estructura de carpetas

```
/
├── app/
│   ├── layout.tsx          # Layout raíz de Next.js
│   ├── page.tsx            # Redirect a /game/index.html
│   └── globals.css         # CSS global (mínimo)
├── lib/supabase/           # Cliente Supabase (reservado para futuras funciones)
│   ├── client.ts
│   └── server.ts
├── public/
│   └── game/               # ← BUILD DEL JUEGO (no editar aquí, son archivos compilados)
│       ├── index.html
│       ├── static/js/      # Bundle compilado
│       ├── static/css/
│       └── styles/         # CSS adicional del motor
├── vercel.json
└── package.json            # Next.js deps
```

---

## Dónde editar el juego

La fuente editable es el repo **chase-manning/pokemon-js**. Para modificar:

### 1. Clonar la fuente de edición (una sola vez)

```bash
git clone https://github.com/chase-manning/pokemon-js.git game-src
cd game-src
npm install --legacy-peer-deps
```

### 2. Archivos clave a modificar

| Qué cambiar | Archivo |
|---|---|
| Mapas / escenarios | `game-src/src/maps/*.ts` |
| Textos y diálogos de NPCs | `game-src/src/maps/pallet-town.ts` (y demás mapas) |
| Datos de personajes | Buscar `npc`, `character`, `dialogue` en `game-src/src/` |
| Sprites / imágenes | `game-src/src/assets/` |
| Nombre del juego / título | `game-src/public/index.html` y componentes en `game-src/src/` |
| Música / sonidos | `game-src/src/assets/` |
| Shell CSS Game Boy | `game-src/public/styles/css-pokemon-gameboy.css` |

### 3. Compilar y actualizar el build

Después de editar, recompilar y copiar al proyecto:

```bash
cd game-src
PUBLIC_URL=/game DISABLE_ESLINT_PLUGIN=true GENERATE_SOURCEMAP=false npm run build
cp -r build/* ../public/game/
```

> `PUBLIC_URL=/game` no modifica el código fuente — solo indica al bundler desde qué ruta se servirán los assets estáticos.

---

## Comandos de desarrollo

```bash
# Servidor local Next.js (puerto 3000)
npm run dev
# → abre http://localhost:3000  (redirige a /game/index.html automáticamente)

# Build de producción Next.js
npm run build

# TypeScript check (CI)
npx tsc --noEmit

# Recompilar el juego tras editar game-src/
cd game-src
PUBLIC_URL=/game DISABLE_ESLINT_PLUGIN=true GENERATE_SOURCEMAP=false npm run build
cp -r build/* ../public/game/
```

---

## Controles del juego

El motor ya tiene controles on-screen + teclado implementados.

| Acción | Teclado | On-screen |
|---|---|---|
| Mover | Flechas ← ↑ ↓ → | D-pad |
| Confirmar / Hablar | Z / Enter | Botón A |
| Cancelar / Menú | X / Escape | Botón B |
| Start | Enter | Botón START |
| Select | Shift | Botón SELECT |

---

## Reglas legales y creativas

- ✅ Motor fan-made, licencia MIT (chase-manning/pokemon-js)
- ✅ No se usan ROMs ni assets de Nintendo / Game Freak / The Pokémon Company
- ✅ Los sprites son originales del repo base
- ❌ No usar nombres registrados: Pokémon, Pikachu, Pallet Town, Professor Oak, etc.
- ❌ No redistribuir con marcas de Nintendo

---

## Roadmap

- [x] Base jugable en navegador (chase-manning/pokemon-js)
- [x] Integración en Next.js / Vercel sin cambios al motor
- [ ] Sustituir textos y diálogos por contenido de boda
- [ ] Crear mapa personalizado (pueblo / lugar de la boda)
- [ ] Reemplazar sprites de NPCs por novio / novia / invitados
- [ ] Pantalla título con nombres de la pareja y fecha
- [ ] Integrar datos (fecha, lugar, menú) desde JSON o Supabase
- [ ] Formulario de RSVP integrado
- [ ] Música personalizada
- [ ] Compartir con invitados vía Vercel

---

## Variables de entorno

```bash
# Requeridas en .env.local (para futuras funciones con Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

El juego en `/game/` no necesita variables de entorno para funcionar.
