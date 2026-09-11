# Quarterly Goals

An internal quarterly goal-tracking app for Purely Works — implemented from the
`Quarterly Goals v2` design in [`design/`](./design) (a Claude Design handoff
bundle; see `design/README.md` and `design/chats/chat1.md` for the original
design brief and decisions).

Stack: **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS v4** +
**Prisma 7** (PostgreSQL) + **Auth.js (NextAuth v5)** with Google sign-in.

## Roles

Role comes from the account, not a selector in the product:

- **Employee** — manages their own goals (Individual / Team / Organizational) and profile.
- **Manager** — everything an employee has, plus a read-only view of direct reports' goals with a remark thread.
- **CEO** — everything an employee has, plus a company-wide dashboard (KPIs, heatmap, trend, audit log) and a read-only Manage Users table.
- **Admin** — same org dashboard as CEO, but Manage Users is editable (assigns roles, designation, department, manager, access level).

New sign-ins default to Employee; an admin promotes people from **Organization → Manage users**.

## Local development

Prerequisites: Node 20.9+, a PostgreSQL database.

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL at minimum
npm run db:migrate:dev # creates tables
npm run db:seed        # seeds quarters + a small sample org (see below)
npm run dev
```

Open http://localhost:3000.

### Signing in without Google during development

Real sign-in is Google OAuth only. To make local development possible before
you've set up Google OAuth credentials, the login page also shows a **"Demo
accounts"** section — but only when `NODE_ENV !== "production"` (it is never
present in a production build, see `src/lib/auth.ts`). It lets you sign in
directly as any seeded user (`ceo@example.com`, `manager@example.com`,
`sam.oyelaran@example.com`, etc. — see `prisma/seed.ts`) with no password.
Once you configure real Google OAuth credentials you can sign in with your
own Google account too; the first login by an email listed in `ADMIN_EMAILS`
is auto-promoted to Admin.

### Environment variables

See `.env.example`. In production you must set:

- `DATABASE_URL` — a PostgreSQL connection string.
- `NEXTAUTH_SECRET` — random string (`openssl rand -base64 32`).
- `NEXTAUTH_URL` — the app's public URL (e.g. `https://goals.purelyworks.com`).
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from a Google Cloud OAuth
  client (Web application). Add `https://<your-domain>/api/auth/callback/google`
  as an authorized redirect URI.
- `ADMIN_EMAILS` — comma-separated emails auto-promoted to Admin on first sign-in.

## Data model

See `prisma/schema.prisma`. Quarters are self-maintaining: the app lazily
creates the calendar-current quarter (`Q<n>-<year>`) the first time anyone
visits after a quarter boundary passes (`src/lib/quarters.ts`), and any
quarter that isn't current is `locked` — goal create/edit is blocked
server-side for locked quarters (`src/app/(app)/goals/actions.ts`).

## Deploying to Hostinger (hPanel Node.js app)

This targets Hostinger's **hPanel → Node.js** application feature (Business /
Cloud shared hosting) — no root SSH required. The app is built as a
**standalone bundle** (`output: "standalone"` in `next.config.ts`) specifically
for this: it's a self-contained `server.js` plus only the `node_modules` it
actually needs, so you upload one folder and point hPanel's Node.js app at it.
This was verified end-to-end in this repo: built, packaged, launched exactly
as below, and confirmed a real signed-in user's data-backed page rendered
correctly from the standalone bundle.

### 1. Get a PostgreSQL database

Hostinger's shared/Business/Cloud plans ship MySQL, not PostgreSQL — this app
needs Postgres, so use an external managed one. **[Neon](https://neon.tech)**
or **[Supabase](https://supabase.com)** both have a free tier that's plenty
for this app; either gives you a `postgresql://...` connection string in a
couple of minutes. Copy it — you'll use it as `DATABASE_URL` below.

### 2. Set up Google OAuth

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
create an **OAuth client ID** (type: Web application), and add
`https://<your-domain>/api/auth/callback/google` as an authorized redirect
URI (use your real domain — you can add `http://localhost:3000/api/auth/callback/google`
too, for local testing). Note the Client ID and Client Secret.

### 3. Build the deployable bundle (on your own machine)

Hostinger's shared Node.js hosting isn't a great place to run `next build`
itself (limited resources, no guarantee of build tools) — build locally (or
in CI) and upload only the output:

```bash
npm ci
npm run build          # runs `next build`, then a postbuild step that
                        # assembles a complete .next/standalone folder
```

This produces `.next/standalone/` — a folder containing `server.js`,
`node_modules/`, `public/`, and `.next/static/`. That folder is the entire
deployable app. Zip it up:

```bash
cd .next/standalone && zip -r ../../deploy.zip . && cd ../..
```

### 4. Run database migrations

Run this from your own machine (or CI), pointed at the **production**
`DATABASE_URL` from step 1 — the standalone bundle doesn't include the Prisma
CLI, so migrations aren't run on Hostinger itself:

```bash
DATABASE_URL="<your production connection string>" npm run db:migrate
# optional, only if you want the sample org data to start:
DATABASE_URL="<your production connection string>" npm run db:seed
```

### 5. Create the Node.js app in hPanel

In **hPanel → Advanced → Node.js**:

1. Create a new Node.js application. Pick **Node.js 20 or later** (this app
   requires 20.9+).
2. Set the **application root** to a folder (e.g. `goals-app`), then upload
   and extract `deploy.zip` into it via File Manager (or FTP).
3. Set the **application startup file** to `server.js`.
4. In the app's **environment variables** screen, add:
   - `DATABASE_URL` — the same production connection string from step 1.
   - `NEXTAUTH_SECRET` — a random string (generate with `openssl rand -base64 32`).
   - `NEXTAUTH_URL` — your real site URL, e.g. `https://goals.yourdomain.com`.
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from step 2.
   - `ADMIN_EMAILS` — comma-separated emails to auto-promote to Admin on first sign-in.

   Leave `PORT`/`HOSTNAME` alone — Hostinger sets `PORT` itself and
   `server.js` already reads it (`process.env.PORT`, falling back to 3000).
5. Start (or restart) the app from hPanel.

### 6. Redeploying after a code change

Repeat steps 3–4 (rebuild, re-zip, re-run migrations only if the schema
changed), re-upload `deploy.zip` over the application root, and restart the
app in hPanel.

### If you outgrow shared hosting

A **Hostinger VPS** works too, and is more flexible (real SSH, can run
PostgreSQL itself, no rebuild-and-reupload dance): `git clone` the repo,
`npm ci && npm run build`, then `npm run start:standalone` (or plain
`npm run start`) under a process manager like `pm2`, behind `nginx` as a
TLS-terminating reverse proxy. Steps 1–2 and the environment variable list
above still apply.

## Project layout

```
prisma/schema.prisma          Data model
prisma/seed.ts                Quarters + sample org (safe to edit/delete via Manage Users)
next.config.ts                output: "standalone" — see Deploying to Hostinger below
scripts/package-standalone.js Assembles the complete .next/standalone deploy bundle (runs as "postbuild")
src/lib/auth.ts               NextAuth config (Google + dev-only Credentials provider)
src/lib/prisma.ts             Prisma client (pg driver adapter)
src/lib/quarters.ts           Quarter helpers (self-maintaining "current quarter")
src/app/(app)/                Authenticated app shell + goals/team/organization/profile
src/app/login/                Public sign-in page
```
