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
