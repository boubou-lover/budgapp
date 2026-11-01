-- À exécuter une fois dans Supabase > SQL Editor.
create table if not exists public.budget_docs (
  id         text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);

alter table public.budget_docs enable row level security;

-- Seuls les comptes connectés (ceux que TU crées, inscriptions publiques désactivées) ont accès.
create policy "famille lit"      on public.budget_docs for select to authenticated using (true);
create policy "famille ajoute"   on public.budget_docs for insert to authenticated with check (true);
create policy "famille modifie"  on public.budget_docs for update to authenticated using (true) with check (true);
create policy "famille supprime" on public.budget_docs for delete to authenticated using (true);

-- Mise à jour en temps réel entre les appareils.
alter publication supabase_realtime add table public.budget_docs;
