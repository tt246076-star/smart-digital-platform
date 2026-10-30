create table if not exists public.private_integrations (
  id text primary key,
  encrypted_secret text not null,
  base_url text not null,
  updated_at timestamptz not null default now()
);

alter table public.private_integrations enable row level security;

-- No policies are intentionally created: browser clients must not read or write integration secrets.
revoke all on public.private_integrations from anon, authenticated;
