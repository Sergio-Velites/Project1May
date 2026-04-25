-- Run this in your Supabase SQL Editor

create table public.tasks (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  title       text not null,
  description text,
  status      text default 'todo' check (status in ('todo', 'in_progress', 'done')),
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

alter table public.tasks enable row level security;

create policy "users_own_tasks"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.handle_updated_at();
