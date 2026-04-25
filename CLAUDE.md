# TestRuflo — Multi-Agent Workspace

Proyecto: **TaskFlow** — webapp de gestión de tareas con Next.js 15, Supabase y Vercel.

## Stack
- **Frontend/Backend**: Next.js 15 (App Router, TypeScript, Tailwind CSS)
- **Base de datos + Auth**: Supabase (PostgreSQL, Row Level Security)
- **Despliegue**: Vercel (CI/CD automático desde rama main)
- **Código**: `/webapp/`

## Archivos clave
- `webapp/app/tasks/` — Dashboard principal y server actions
- `webapp/app/login/`, `webapp/app/signup/` — Autenticación
- `webapp/components/` — Componentes React reutilizables
- `webapp/lib/supabase/` — Clientes Supabase (client/server)
- `webapp/middleware.ts` — Protección de rutas
- `webapp/supabase/migrations/001_tasks.sql` — Schema de base de datos

## Variables de entorno requeridas
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Agentes especializados

### coordinator
**Rol**: Descompone tareas complejas y asigna subtareas a agentes especializados.
**Activar cuando**: La petición implique cambios en 3+ archivos o múltiples capas.
**Protocolo**: Analizar → Descomponer → Asignar → Revisar resultado.

### frontend-developer
**Rol**: Desarrollador React/Next.js. Crea páginas, componentes y UI.
**Skills**: React, Next.js App Router, Tailwind CSS, TypeScript, Server Components, Client Components.
**Archivos**: `webapp/app/`, `webapp/components/`
**Activar cuando**: Nueva UI, nuevas páginas, componentes, estilos.

### backend-developer
**Rol**: Lógica server-side. Server Actions, API Routes, middleware.
**Skills**: Next.js Server Actions, API Routes, TypeScript, autenticación.
**Archivos**: `webapp/app/*/actions.ts`, `webapp/app/api/`, `webapp/middleware.ts`
**Activar cuando**: Nueva lógica de negocio, endpoints, acciones del servidor.

### database-architect
**Rol**: Diseña schema Supabase, RLS policies y migraciones SQL.
**Skills**: PostgreSQL, Supabase, Row Level Security, índices, performance.
**Archivos**: `webapp/supabase/migrations/`
**Activar cuando**: Nuevas tablas, cambios de schema, políticas RLS.

### auth-specialist
**Rol**: Integración Supabase Auth. Sesiones, rutas protegidas, OAuth.
**Skills**: Supabase Auth, cookies SSR, middleware Next.js, JWT.
**Archivos**: `webapp/lib/supabase/`, `webapp/middleware.ts`, `webapp/app/auth/`
**Activar cuando**: Cambios en flujo de auth, nuevos proveedores OAuth, permisos.

### code-reviewer
**Rol**: Auditor de calidad, seguridad y TypeScript.
**Skills**: Code review, seguridad web, TypeScript strict, OWASP.
**Activar cuando**: Antes de cualquier commit, especialmente en cambios de auth o DB.

### devops-engineer
**Rol**: CI/CD, Vercel, variables de entorno, Supabase migrations en producción.
**Skills**: Vercel, GitHub Actions, environment variables, Supabase CLI.
**Archivos**: `.github/workflows/`, `.devcontainer/`
**Activar cuando**: Problemas de despliegue, nuevas variables de entorno, migraciones.

---

## Reglas de orquestación

1. **Feature nueva** → coordinator → frontend-developer + backend-developer → code-reviewer
2. **Cambio de DB** → database-architect → code-reviewer (siempre)
3. **Bug de auth** → auth-specialist + code-reviewer
4. **Solo UI** → frontend-developer (sin coordinator)
5. **Deploy roto** → devops-engineer (acceso directo)

## Comandos útiles

```bash
# Desarrollo local
cd webapp && npm run dev

# Build de producción
cd webapp && npm run build

# Type check
cd webapp && npx tsc --noEmit

# Aplicar migración en Supabase
# → Copiar SQL de webapp/supabase/migrations/ al SQL Editor de Supabase
```

## Contexto de despliegue
- **URL producción**: configurada en Vercel dashboard
- **Branch de deploy**: `main`
- **Vercel ignora**: `/webapp` como root directory (configurar en Vercel dashboard)
