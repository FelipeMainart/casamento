-- Schema applied to veste-bem-testes by the create_wedding_if_reservations migration.
-- This snapshot is for reference; it is not an automatic startup script.
create table public.wedding_if_reservations (
 product_id text primary key check (product_id ~ '^gift-(0[1-9]|1[0-9]|2[0-3])$'),
 guest_name text not null check (char_length(btrim(guest_name)) between 2 and 80),
 token_hash text not null check (token_hash ~ '^[a-f0-9]{64}$'),
 created_at timestamptz not null default now()
);
alter table public.wedding_if_reservations enable row level security;
revoke all on table public.wedding_if_reservations from public, anon, authenticated;
grant select, insert, delete on table public.wedding_if_reservations to service_role;
comment on table public.wedding_if_reservations is 'Reservas exclusivas dos presentes de Ingrid e Felipe. Acesso apenas pela Edge Function wedding-if-reservations.';

-- Tabela de confirmações de presença (RSVP)
create table if not exists public.wedding_if_rsvps (
 id uuid primary key default gen_random_uuid(),
 guest_name text not null check (char_length(btrim(guest_name)) between 2 and 100),
 phone text not null check (char_length(btrim(phone)) between 8 and 30),
 attending boolean not null default true,
 companions jsonb not null default '[]'::jsonb,
 adults_count integer not null default 1 check (adults_count >= 0 and adults_count <= 20),
 children_count integer not null default 0 check (children_count >= 0 and children_count <= 20),
 message text not null default '' check (char_length(message) <= 500),
 created_at timestamptz not null default now()
);
alter table public.wedding_if_rsvps enable row level security;
revoke all on table public.wedding_if_rsvps from public, anon, authenticated;
grant select, insert, delete on table public.wedding_if_rsvps to service_role;
comment on table public.wedding_if_rsvps is 'Confirmações de presença (RSVP) de Felipe e Ingrid. Acesso apenas pela Edge Function wedding-if-rsvps.';
