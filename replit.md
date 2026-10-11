# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm run test:cms` — permanent CMS regression suite (isolated API fixtures + React component journeys)
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

### CMS regression tests

`pnpm run test:cms` requires no database, schema push, running server, or admin credentials.
The API suite bundles the real studio routes and schemas but substitutes the database and
authentication boundaries with test-only in-memory fixtures. It never imports the real
database module and starts a temporary loopback server with an allowlisted environment.
The frontend suite uses the real editor provider, generated API hooks, page builder,
preview dialogs, protected route map, and public page renderer in jsdom. Only the HTTP
transport, authentication/chrome, and upload/animation peripherals are substituted;
unexpected requests fail rather than reaching a live service.

Reload checks use fresh mounted trees and QueryClients while retaining only fixture
storage. These tests cover draft/published separation, About on `/about`, bilingual
rendering, shared `/admin/content` editing, contact identity, slug/menu changes,
unpublishing/deletion, cache invalidation, and save/publish failure recovery.
They do not validate production authentication or browser layout; never replace real
user drafts to run them.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
