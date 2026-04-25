# TestRuflo — Multi-Agent Workspace

Project: **TaskFlow** — task management webapp built with Next.js 16, Supabase, and Vercel.

## Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend/Backend | Next.js (App Router, TypeScript) | 16.2.4 |
| UI Framework | React | 19.2.4 |
| Styling | Tailwind CSS v4 | ^4 |
| Database + Auth | Supabase (PostgreSQL + RLS) | ^2.104.1 |
| SSR Auth | @supabase/ssr | ^0.10.2 |
| Deployment | Vercel | — |
| Node.js | Node | 22 |

**Root of all application code**: `webapp/`

---

## Repository Structure

```
TestRuflo/
├── .devcontainer/devcontainer.json   # Codespaces config (iOS-optimized, Node 22)
├── .github/workflows/deploy.yml      # CI: TypeScript type check on push/PR to main
├── .mcp.json                          # Ruflo multiagent MCP server config
├── .gitignore
├── CLAUDE.md                          # This file
├── README.md
└── webapp/                            # Next.js application root
    ├── app/
    │   ├── layout.tsx                 # Root layout (Geist fonts, metadata)
    │   ├── page.tsx                   # Root page → redirects to /tasks
    │   ├── globals.css                # Tailwind v4 imports + CSS custom properties
    │   ├── auth/callback/route.ts     # OAuth code-for-session exchange handler
    │   ├── login/page.tsx             # Login page (Client Component)
    │   ├── signup/page.tsx            # Signup page (Client Component)
    │   └── tasks/
    │       ├── page.tsx               # Dashboard (Server Component, kanban board)
    │       └── actions.ts             # Server Actions: getTasks, createTask, updateTaskStatus, deleteTask, signOut
    ├── components/
    │   ├── TaskCard.tsx               # Task display with status cycling + delete (Client Component)
    │   └── NewTaskForm.tsx            # Task creation toggle form (Client Component)
    ├── lib/supabase/
    │   ├── client.ts                  # Browser Supabase client (createBrowserClient)
    │   └── server.ts                  # Server Supabase client (createServerClient + cookies)
    ├── middleware.ts                  # Route protection: redirects unauthenticated users
    ├── supabase/migrations/
    │   └── 001_tasks.sql              # tasks table, RLS policy, updated_at trigger
    ├── next.config.ts                 # Next.js config (defaults only)
    ├── tsconfig.json                  # TypeScript strict mode, @/* path alias
    ├── eslint.config.mjs              # ESLint with Next.js core-web-vitals + TypeScript rules
    ├── postcss.config.mjs             # PostCSS with @tailwindcss/postcss plugin
    └── package.json
```

---

## Database Schema

Migration file: `webapp/supabase/migrations/001_tasks.sql`

**Apply manually**: copy SQL into the Supabase SQL Editor (no Supabase CLI configured).

```sql
-- tasks table
id          uuid  PRIMARY KEY (gen_random_uuid())
user_id     uuid  FK → auth.users(id) ON DELETE CASCADE, NOT NULL
title       text  NOT NULL
description text  (nullable)
status      text  DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done'))
created_at  timestamptz  DEFAULT now(), NOT NULL
updated_at  timestamptz  DEFAULT now(), NOT NULL (auto-updated via trigger)
```

**RLS policy** `users_own_tasks`: users can only SELECT/INSERT/UPDATE/DELETE their own rows (`auth.uid() = user_id`).

**Task status flow**: `todo` → `in_progress` → `done` → `todo` (cycles on click in TaskCard)

---

## Server Actions (`webapp/app/tasks/actions.ts`)

All actions use the server Supabase client and operate on the authenticated user's session.

| Action | Signature | Description |
|---|---|---|
| `getTasks` | `() => Promise<Task[]>` | Fetch all tasks for current user, ordered by created_at DESC |
| `createTask` | `(formData: FormData) => Promise<void>` | Create task from `title` and `description` fields |
| `updateTaskStatus` | `(id: string, status: TaskStatus) => Promise<void>` | Update task status, revalidates `/tasks` |
| `deleteTask` | `(id: string) => Promise<void>` | Delete task by ID, revalidates `/tasks` |
| `signOut` | `() => Promise<void>` | Sign out, revalidates `/tasks` |

**Types exported**:
```typescript
type TaskStatus = 'todo' | 'in_progress' | 'done'
interface Task { id: string; title: string; description: string | null; status: TaskStatus; created_at: string }
```

---

## Authentication Flow

1. **Signup**: `app/signup/page.tsx` → `supabase.auth.signUp()` → email verification → redirect to `/auth/callback`
2. **Callback**: `app/auth/callback/route.ts` → `exchangeCodeForSession(code)` → redirect to `/tasks`
3. **Login**: `app/login/page.tsx` → `supabase.auth.signInWithPassword()` → redirect to `/tasks`
4. **Middleware**: `webapp/middleware.ts` protects all routes except `/login`, `/signup`, `/auth/callback`
   - Unauthenticated → redirect to `/login`
   - Authenticated on `/login` or `/signup` → redirect to `/tasks`

**Client factory pattern**:
- Browser operations → `import { createClient } from '@/lib/supabase/client'`
- Server operations → `import { createClient } from '@/lib/supabase/server'` (async, uses `next/headers cookies()`)

---

## Styling Conventions (Tailwind CSS v4)

Tailwind v4 has breaking changes from v3:
- **No `tailwind.config.js`** — configuration lives in CSS via `@theme` blocks
- **Import**: `@import "tailwindcss"` in `globals.css` (not `@tailwind base/components/utilities`)
- **Custom tokens**: use CSS `@theme inline { --color-*: ...; --font-*: ... }` syntax
- **Dark mode**: uses `@media (prefers-color-scheme: dark)` on `:root` CSS variables

The app uses a dark theme by default with `gray-950` backgrounds in auth pages.

---

## TypeScript Conventions

- **Strict mode** enabled (`tsconfig.json`)
- **Path alias**: `@/*` maps to `webapp/` root — use `@/lib/supabase/server` not relative paths
- **Type check command**: `cd webapp && npx tsc --noEmit`
- No explicit `any` — all Supabase responses are typed via generated or inferred types

---

## Component Architecture

| Component | Type | Reason |
|---|---|---|
| `app/tasks/page.tsx` | Server Component | Fetches tasks server-side, no client interactivity needed at page level |
| `app/login/page.tsx` | Client Component (`'use client'`) | Form state, event handlers |
| `app/signup/page.tsx` | Client Component | Form state, conditional rendering |
| `components/TaskCard.tsx` | Client Component | Status cycling button, delete action |
| `components/NewTaskForm.tsx` | Client Component | Toggle open/closed, controlled inputs |

Server actions are called directly from both Server and Client Components using `action=` props or `import`.

---

## CI/CD Pipeline

**File**: `.github/workflows/deploy.yml`

Triggers on: `push` to `main`, `pull_request` targeting `main`

Steps:
1. Checkout code
2. Setup Node 22 with npm cache (`webapp/package-lock.json`)
3. `npm ci` in `webapp/`
4. `npx tsc --noEmit` in `webapp/`

Requires GitHub Secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Vercel deployment** is separate and configured in the Vercel dashboard with `webapp/` as the root directory.

---

## Environment Variables

```bash
# Required in .env.local (local dev), Vercel dashboard (production), and GitHub Secrets (CI)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Both are public (prefixed `NEXT_PUBLIC_`). No server-only secrets currently used.

---

## Development Environment (Codespaces)

**File**: `.devcontainer/devcontainer.json`

- Base image: `mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm` (Node 22, Debian)
- Post-create: `cd webapp && npm install && npm install -g @anthropic-ai/claude-code`
- Port 3000 forwarded with auto-preview
- Optimized for iOS/mobile use (larger font sizes: 16px terminal, 15px editor)
- Extensions: Tailwind CSS IntelliSense, Prettier, ESLint, Auto Rename Tag
- `ANTHROPIC_API_KEY` injected from local environment

---

## Multiagent Framework (Ruflo)

**File**: `.mcp.json` — configures Ruflo as an MCP server for Claude Code

```json
{
  "mcpServers": {
    "ruflo": { "type": "stdio", "command": "npx", "args": ["-y", "ruflo@latest", "mcp"] }
    }
}
```

Ruflo enables the multi-agent orchestration defined below. Agents communicate via MCP protocol.

---

## Specialized Agents

### coordinator
**Role**: Decomposes complex tasks and assigns subtasks to specialized agents.
**Activate when**: Request involves changes to 3+ files or multiple layers.
**Protocol**: Analyze → Decompose → Assign → Review result.

### frontend-developer
**Role**: React/Next.js developer. Creates pages, components, and UI.
**Skills**: React 19, Next.js App Router, Tailwind CSS v4, TypeScript, Server/Client Components.
**Files**: `webapp/app/`, `webapp/components/`
**Activate when**: New UI, pages, components, styles.

### backend-developer
**Role**: Server-side logic. Server Actions, API Routes, middleware.
**Skills**: Next.js Server Actions, API Routes, TypeScript, authentication.
**Files**: `webapp/app/*/actions.ts`, `webapp/app/api/`, `webapp/middleware.ts`
**Activate when**: New business logic, endpoints, server actions.

### database-architect
**Role**: Designs Supabase schema, RLS policies, and SQL migrations.
**Skills**: PostgreSQL, Supabase, Row Level Security, indexes, performance.
**Files**: `webapp/supabase/migrations/`
**Activate when**: New tables, schema changes, RLS policy changes.

### auth-specialist
**Role**: Supabase Auth integration. Sessions, protected routes, OAuth.
**Skills**: Supabase Auth, SSR cookies, Next.js middleware, JWT.
**Files**: `webapp/lib/supabase/`, `webapp/middleware.ts`, `webapp/app/auth/`
**Activate when**: Auth flow changes, new OAuth providers, permission updates.

### code-reviewer
**Role**: Quality, security, and TypeScript auditor.
**Skills**: Code review, web security, TypeScript strict, OWASP.
**Activate when**: Before any commit, especially auth or DB changes.

### devops-engineer
**Role**: CI/CD, Vercel, environment variables, production migrations.
**Skills**: Vercel, GitHub Actions, environment variables, Supabase SQL Editor.
**Files**: `.github/workflows/`, `.devcontainer/`
**Activate when**: Deployment issues, new env vars, migration problems.

---

## Orchestration Rules

1. **New feature** → coordinator → frontend-developer + backend-developer → code-reviewer
2. **DB change** → database-architect → code-reviewer (always)
3. **Auth bug** → auth-specialist + code-reviewer
4. **UI only** → frontend-developer (no coordinator)
5. **Broken deploy** → devops-engineer (direct access)

---

## Development Commands

```bash
# Local development server (http://localhost:3000)
cd webapp && npm run dev

# Production build check
cd webapp && npm run build

# TypeScript type check (same as CI)
cd webapp && npx tsc --noEmit

# Lint
cd webapp && npm run lint

# Apply database migration
# → Copy SQL from webapp/supabase/migrations/001_tasks.sql into Supabase SQL Editor
```

---

## Deployment Context

- **Production URL**: configured in Vercel dashboard
- **Deploy branch**: `main`
- **Vercel root directory**: `webapp/` (configure in Vercel dashboard settings)
- **CI checks**: TypeScript type check must pass before merge
- **DB migrations**: applied manually via Supabase SQL Editor (no automated migration runner)
