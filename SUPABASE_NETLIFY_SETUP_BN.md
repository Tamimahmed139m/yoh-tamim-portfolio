# NovaArcade — Supabase + Netlify Setup

## 1. Supabase
The original schema has already been run. Then run `supabase-admin-migration.sql` once.

## 2. Create the admin account
In Supabase Dashboard:
- Authentication → Users → Add user
- Create your admin email/password.
- Copy the created user's UUID.
- In SQL Editor run:
  `insert into public.admin_users (user_id) values ('YOUR-USER-UUID');`

## 3. Local environment
Create `.env.local` from `.env.example` and set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Use only the browser-safe publishable/anon key. Never put the service_role/secret key in the frontend.

## 4. Netlify
Connect the GitHub repository. Build command: `npm run build`. Publish directory: `dist`.
Add the same two VITE environment variables in Site configuration → Environment variables.

`netlify.toml` already contains the SPA fallback so `/admin` and `/game/...` refreshes work.
