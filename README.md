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

## Deploying (Hostinger)

Hostinger's shared hosting is not a Node.js runtime; deploy this app either to
a **Hostinger VPS** or a Hostinger plan with Node.js application support:

1. **Database**: Hostinger doesn't offer managed Postgres, so either install
   PostgreSQL on the VPS yourself, or point `DATABASE_URL` at an external
   managed Postgres (Neon, Supabase, Railway, etc.) — either works fine, the
   app only needs a reachable connection string.
2. **Build & run**:
   ```bash
   npm ci
   npm run build
   npm run db:migrate   # applies migrations (prisma migrate deploy)
   npm run db:seed      # optional — only if you want the sample org data
   npm run start        # or run under pm2 behind nginx as a reverse proxy with TLS
   ```
3. **Environment variables**: set `DATABASE_URL`, `NEXTAUTH_SECRET`,
   `NEXTAUTH_URL` (your real domain, `https://...`), `GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAILS` in whatever Hostinger surface you're
   using (VPS: a `.env` file or systemd unit; Node.js App panel: its
   environment variables screen).
4. **Google OAuth**: add the production callback URL
   (`https://<your-domain>/api/auth/callback/google`) to the OAuth client in
   Google Cloud Console before going live.
5. Building runs with `NODE_ENV=production` automatically, which removes the
   dev-only demo-account sign-in — production only accepts Google sign-in.

## Project layout

```
prisma/schema.prisma        Data model
prisma/seed.ts               Quarters + sample org (safe to edit/delete via Manage Users)
src/lib/auth.ts              NextAuth config (Google + dev-only Credentials provider)
src/lib/prisma.ts            Prisma client (pg driver adapter)
src/lib/quarters.ts          Quarter helpers (self-maintaining "current quarter")
src/app/(app)/               Authenticated app shell + goals/team/organization/profile
src/app/login/               Public sign-in page
```
