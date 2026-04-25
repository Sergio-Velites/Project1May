# TestRuflo — Claude Code desde el móvil

Entorno de desarrollo multiagente con **Claude Code + Ruflo**, con una webapp **TaskFlow** de ejemplo desplegable en Vercel + Supabase.

---

## Configuración inicial (una sola vez, desde escritorio o Codespaces)

### 1. Supabase — crear la base de datos

1. Entra en [supabase.com/dashboard](https://supabase.com/dashboard) → tu proyecto
2. Ve a **SQL Editor** → pega el contenido de `webapp/supabase/migrations/001_tasks.sql` → ejecutar
3. Copia tus credenciales: **Settings → API → Project URL** y **anon public key**

### 2. Variables de entorno en Vercel

1. En [vercel.com](https://vercel.com) → tu proyecto → **Settings → Environment Variables**
2. Añade:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Conectar repo a Vercel

1. En Vercel → **New Project** → importa este repo de GitHub
2. **Root Directory**: cambia a `webapp`
3. Deploy — Vercel detecta Next.js automáticamente

---

## Flujo diario desde iOS (GitHub Codespaces)

### Abrir el entorno de desarrollo

1. Abre **Safari** (o Chrome) en tu iPhone/iPad
2. Ve a `github.com/TU_USUARIO/TestRuflo`
3. Pulsa el botón verde **Code** → **Codespaces** → **Create codespace on main**
4. Se abre VS Code en el navegador (tarda ~1 min la primera vez)

### Usar Claude Code con Ruflo

Una vez en Codespaces, abre el **terminal** (`Ctrl+\`` o menú Terminal):

```bash
# Configura tu API key (solo la primera vez en cada Codespace)
export ANTHROPIC_API_KEY="sk-ant-..."

# Inicia Claude Code con Ruflo habilitado
claude

# Para inicializar Ruflo la primera vez
npx ruflo@latest init
```

### Pedir cosas a los agentes (ejemplos)

```
# Dentro de claude:

"Añade un campo de prioridad (alta/media/baja) a las tareas"
→ coordinator descompone → database-architect crea migración SQL
  → backend-developer actualiza actions.ts → frontend-developer
  actualiza TaskCard y NewTaskForm → code-reviewer valida

"Crea una vista de calendario para ver tareas por fecha"
→ frontend-developer crea página /calendar con componente

"Añade login con Google"
→ auth-specialist configura OAuth en Supabase + frontend-developer
  actualiza páginas de auth

"El deploy está fallando"
→ devops-engineer diagnostica GitHub Actions + variables de entorno
```

### Ver la app en producción

Cada push a `main` → Vercel despliega automáticamente en ~30 segundos.

---

## Estructura del proyecto

```
TestRuflo/
├── .devcontainer/
│   └── devcontainer.json       # Config GitHub Codespaces (iOS optimizada)
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI: type check en cada PR
├── .mcp.json                   # Ruflo MCP server para Claude Code
├── CLAUDE.md                   # Definición de agentes y reglas
└── webapp/                     # Next.js 15 App
    ├── app/
    │   ├── auth/callback/      # OAuth redirect handler
    │   ├── login/              # Página de login
    │   ├── signup/             # Página de registro
    │   └── tasks/              # Dashboard principal
    │       ├── page.tsx
    │       └── actions.ts      # Server Actions (CRUD)
    ├── components/
    │   ├── TaskCard.tsx
    │   └── NewTaskForm.tsx
    ├── lib/supabase/
    │   ├── client.ts           # Cliente browser
    │   └── server.ts           # Cliente server (SSR)
    ├── middleware.ts            # Protección de rutas
    └── supabase/
        └── migrations/
            └── 001_tasks.sql   # Schema inicial
```

---

## Desarrollo local (desde Mac)

```bash
cd webapp
cp .env.example .env.local
# Edita .env.local con tus credenciales de Supabase
npm run dev
# → http://localhost:3000
```

---

## Tips para iOS + Codespaces

- **Teclado**: usa un teclado bluetooth para mayor comodidad en sesiones largas
- **Terminal**: el devcontainer tiene fuente 16px, óptimo para móvil
- **Codespaces gratis**: 60h/mes en GitHub Free, 90h en GitHub Pro
- **Suspender**: cierra el tab y el Codespace se suspende automáticamente (no cuenta tiempo)
- **Reanudar**: vuelve a `github.com/TU_USUARIO/TestRuflo` → Code → Codespaces → tu codespace existente

## Comandos Claude Code útiles

```bash
claude          # Modo interactivo (ideal para móvil)
claude -p "..."  # Modo no interactivo (una sola petición)
/clear          # Limpiar contexto
/help           # Ayuda
```
