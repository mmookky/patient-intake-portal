create table if not exists public.patient_sessions (
  id uuid primary key,
  form_data jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'inactive', 'submitted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz
);

alter table public.patient_sessions enable row level security;

-- Demo access: unguessable UUID sessions are used as capability links.
-- A production system must replace these policies with authenticated staff/patient access.
create policy "anonymous sessions can be read"
on public.patient_sessions for select to anon using (true);

create policy "anonymous sessions can be created"
on public.patient_sessions for insert to anon with check (true);

create policy "anonymous sessions can be updated"
on public.patient_sessions for update to anon using (true) with check (true);

create index if not exists patient_sessions_updated_at_idx
on public.patient_sessions (updated_at desc);
