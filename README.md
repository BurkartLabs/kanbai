# Kanbai

Kanbai is a small kanban board app that doubles as a public portfolio page. It shows a live board of the projects
its owner is working on, and a password-protected `/manage` area is where those boards, columns and cards are edited.

## What it does today

- **Public page** (`/`): a list of projects split into "In progress" and "Completed". Featured projects get a large
  card with a progress bar and recent milestones; the rest are compact rows. Light and dark themes.
- **Project pages** (`/projects/[id]`): a read-only view of a board's columns and cards, opened as a modal over the
  public page.
- **Management area** (`/manage`): sign in, then create, edit and delete projects, add and edit cards, and drag cards
  between columns and into a new order (mouse or keyboard, via dnd-kit). A "Completed" checkbox moves a project to
  the Completed section regardless of its cards or tracker stage.
- **Optional Azure DevOps link**: a project can be tied to a product in an Azure DevOps project. Its progress bar and
  milestones are then read from the tracker's work items (read-only) instead of from cards. Without tracker
  configuration the public page simply renders without that data.
- **Single admin sign-in**: one username and a scrypt password hash held in environment variables, server-side
  sessions stored in the database (only a hash of the session token is stored), and a login throttle.

There is no multi-user support, no sign-up, and no per-user boards.

## Getting started

### Prerequisites

- Node.js 20 or newer and npm
- A MariaDB or MySQL database
- Docker, if you want the throwaway demo database below

### Install and run

```bash
npm install
npm run dev
```

The app serves on <http://localhost:3000>. It needs a database before any page will load.

### Try it with demo data

`npm run demo:db` starts a MariaDB 11 container on `127.0.0.1:3307`, then applies `demo/schema.sql`,
`auth-schema.sql`, `portfolio-schema.sql` and `demo/seed.sql`. It is safe to re-run. `npm run demo:db -- --down`
removes the container and its data.

```bash
npm run demo:db
cp demo/env.example .env.local
npm run dev
```

`demo/env.example` holds a demo database login and a demo admin password hash. They are only for a database with
nothing real in it. Read the comments in that file for the sign-in details and for the tracker options.

### Using your own database

Apply `demo/schema.sql` (the `projects`, `columns` and `cards` tables), then `auth-schema.sql` and
`portfolio-schema.sql`; all three are idempotent. Add your projects in `/manage`. Generate your admin password hash
with:

```bash
npm run hash-password
```

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check, no emit |
| `npm test` | Unit tests (`node --test lib/*.test.ts`) |
| `npm run hash-password` | Prompt for a password and print an `ADMIN_PASSWORD_HASH` |
| `npm run demo:db` | Local demo database in Docker |
| `npm run ado:snapshot` | Write `demo/tracker.json` from your Azure CLI login, for running locally without a token |

## Configuration

Set these in `.env.local` (gitignored). `demo/env.example` is a working template for local development; there is no
root `.env.example`.

| Variable | Purpose |
| --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Database connection |
| `DB_SSL` | TLS for the database connection |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` | The single `/manage` login |
| `ADO_ORG`, `ADO_PROJECT` | Azure DevOps organisation and project to read progress from |
| `ADO_PAT` or `ADO_BEARER` | Credential for the tracker; a PAT with Work Items (Read) is enough |
| `ADO_FIXTURE` | Path to a snapshot file read instead of the API, for local development |

The tracker variables are optional.

## Tech stack

Next.js 16 (App Router, server actions), React 19, TypeScript, Tailwind CSS 4, dnd-kit for drag and drop, and
MySQL/MariaDB through `mysql2`. Tests use Node's built-in test runner.

## Status

Early (version 0.1.0) and built for one owner's portfolio rather than as a general product. The tracker integration
assumes a particular Azure DevOps tagging convention (see `lib/ado.ts`), and the production database schema is not
included beyond what the demo needs. No licence file is included in this repository.
