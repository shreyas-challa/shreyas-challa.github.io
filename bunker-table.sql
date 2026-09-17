-- Table behind /bunker. Run this once in the Supabase SQL editor.
--
-- It creates the entries table, opens it to the anon key (the key the site
-- ships with), and adds it to the realtime publication so an insert is pushed
-- to every open /bunker within about a second.
--
-- Note on access: the anon key is public in any static site, so these policies
-- mean anyone who finds the key can read and insert entries. The password on
-- /bunker gates the page, not the table. See the bottom of this file for how
-- to tighten that if the values ever matter.

create table if not exists public.bunker_entries (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  value_1     text,
  value_2     text,
  value_3     text
);

-- The table is read newest-first and capped, so an index on the sort column
-- keeps that cheap as rows pile up.
create index if not exists bunker_entries_created_at_idx
  on public.bunker_entries (created_at desc);

alter table public.bunker_entries enable row level security;

drop policy if exists "bunker entries are readable" on public.bunker_entries;
create policy "bunker entries are readable"
  on public.bunker_entries
  for select
  to anon, authenticated
  using (true);

drop policy if exists "anyone can add a bunker entry" on public.bunker_entries;
create policy "anyone can add a bunker entry"
  on public.bunker_entries
  for insert
  to anon, authenticated
  with check (true);

-- Realtime delivers the full row to subscribers rather than just its id.
alter table public.bunker_entries replica identity full;

-- Add to the realtime publication, ignoring the error if it is already there.
-- This is the step that decides whether inserts are pushed to open pages or
-- only picked up by the page's fallback poll a few seconds later.
do $$
begin
  alter publication supabase_realtime add table public.bunker_entries;
exception
  when duplicate_object then null;
end
$$;

-- Verify it took. One row back means Realtime is carrying the table; no rows
-- means the alter above did not apply, and the dashboard toggle at
-- Database -> Replication -> supabase_realtime is the way to fix it.
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime' and tablename = 'bunker_entries';

-- Renaming the three columns: change them here and in BUNKER_COLUMNS in
-- src/data/bunker-feed.js. The table, the form, and the insert all read from
-- that list, so those two edits are the whole job.
--
--   alter table public.bunker_entries rename column value_1 to reactor_temp;

-- Tightening access later, in rough order of effort:
--
--   1. Cap the damage. Add a check constraint on length, e.g.
--        alter table public.bunker_entries
--          add constraint bunker_value_len check (length(value_1) < 200);
--
--   2. Require a sign-in. Drop the anon grants above and leave the policies on
--      `authenticated` only, then have the page sign in through Supabase Auth
--      instead of comparing a password in the browser.
--
--   3. Move the write behind a function. Revoke insert entirely and expose a
--      `security definer` rpc that checks a shared secret passed as an
--      argument, so the write rule lives in the database.
