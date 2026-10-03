/**
 * Supabase Database Architecture & SQL Schema
 * 
 * Provides production-ready PostgreSQL / Supabase DDL, Row Level Security (RLS) policies,
 * indexes, and helper functions to synchronize the game portal with Supabase.
 */

export const SUPABASE_SQL_SCHEMA = `-- NovaArcade Game Portal Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Categories Table
create table if not exists public.categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  icon_name text not null,
  color text not null,
  description text,
  created_at timestamptz default now()
);

-- 2. Games Table
create table if not exists public.games (
  id text primary key,
  title text not null,
  slug text not null unique,
  category text not null,
  categories text[] default '{}',
  thumbnail_url text not null,
  description text not null,
  controls text not null,
  how_to_play text,
  game_url text not null,
  featured boolean default false,
  popular boolean default false,
  is_new boolean default false,
  rating numeric(3, 1) default 4.5,
  plays bigint default 0,
  date_added date default current_date,
  playable_type text not null default 'coming-soon',
  tags text[] default '{}',
  custom_source_html text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Indexes for fast search, category filtering and sorting
create index if not exists idx_games_slug on public.games(slug);
create index if not exists idx_games_category on public.games(category);
create index if not exists idx_games_plays on public.games(plays desc);
create index if not exists idx_games_rating on public.games(rating desc);
create index if not exists idx_games_date_added on public.games(date_added desc);
create index if not exists idx_games_featured on public.games(featured) where featured = true;

-- Full-text search index on title and description
create index if not exists idx_games_fts on public.games using gin(to_tsvector('english', title || ' ' || description));

-- 4. Favorites Table
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  game_id text references public.games(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, game_id)
);

-- 5. Recently Played Table
create table if not exists public.recently_played (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  game_id text references public.games(id) on delete cascade,
  played_at timestamptz default now()
);

-- 6. Game Plays Counter
create or replace function public.increment_game_play(game_id_param text)
returns void as $$
begin
  update public.games
  set plays = plays + 1
  where id = game_id_param;
end;
$$ language plpgsql security definer;

-- 7. Row Level Security (RLS)
alter table public.games enable row level security;
alter table public.categories enable row level security;
alter table public.favorites enable row level security;
alter table public.recently_played enable row level security;

-- Public can read games & categories
create policy "Allow public read access to games" on public.games for select using (true);
create policy "Allow public read access to categories" on public.categories for select using (true);

-- Authenticated users manage their own favorites
create policy "Users can manage favorites" on public.favorites
  for all using (auth.uid() = user_id);

-- Authenticated users manage their recently played
create policy "Users can manage recently played" on public.recently_played
  for all using (auth.uid() = user_id);
`;

export const SUPABASE_SETUP_INSTRUCTIONS = `
### How to Connect Supabase to NovaArcade:
1. Create a free account at [supabase.com](https://supabase.com) and create a project.
2. In the Supabase dashboard, go to the SQL Editor and paste the schema above.
3. Obtain your Project URL and anon public API key from Project Settings > API.
4. Add to your .env file:
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
5. The frontend includes a Supabase client and can read games from the configured Supabase project. Admin write access requires the secure admin migration included in this project.
`;
