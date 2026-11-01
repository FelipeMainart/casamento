import postgres from 'postgres';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Max-Age': '3600',
};

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { ...cors, 'Cache-Control': 'no-store' } });

export interface Companion {
  name: string;
  type: 'adult' | 'child';
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PRODUCT_RE = /^gift-(0[1-9]|1[0-9]|2[0-3])$/;

let schemaReady = false;

async function ensureSchema(sql: ReturnType<typeof postgres>) {
  if (schemaReady) return;
  await sql.unsafe(`
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
    notify pgrst, 'reload schema';
  `);
  schemaReady = true;
}

if (typeof Deno !== 'undefined') {
  const dbUrl = Deno.env.get('SUPABASE_DB_URL');

  Deno.serve(async (request: Request): Promise<Response> => {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (!dbUrl) {
      return json({ error: 'Serviço de banco de dados indisponível.' }, 503);
    }

    const sql = postgres(dbUrl, { max: 1, idle_timeout: 5, connect_timeout: 10, prepare: false });

    try {
      await ensureSchema(sql);

      if (request.method === 'GET') {
        const [rsvps, giftReservations] = await Promise.all([
          sql`
            select
              id,
              guest_name,
              phone,
              attending,
              companions,
              adults_count,
              children_count,
              message,
              created_at
            from public.wedding_if_rsvps
            order by created_at desc
          `,
          sql`
            select
              product_id,
              guest_name,
              created_at
            from public.wedding_if_reservations
            order by created_at desc
          `,
        ]);
        return json({ rsvps, giftReservations });
      }

      if (request.method === 'DELETE') {
        const raw = await request.text();
        let body: { id?: unknown; productId?: unknown };
        try {
          body = JSON.parse(raw);
        } catch {
          return json({ error: 'Dados inválidos.' }, 400);
        }

        if (typeof body?.productId === 'string') {
          const productId = body.productId.trim();
          if (!PRODUCT_RE.test(productId)) {
            return json({ error: 'ID de presente inválido.' }, 400);
          }
          await sql`delete from public.wedding_if_reservations where product_id = ${productId}`;
          return json({ ok: true });
        }

        const id = typeof body?.id === 'string' ? body.id.trim() : '';
        if (!UUID_RE.test(id)) {
          return json({ error: 'Identificador inválido.' }, 400);
        }
        await sql`delete from public.wedding_if_rsvps where id = ${id}::uuid`;
        return json({ ok: true });
      }

      if (request.method === 'POST') {
        if (Number(request.headers.get('Content-Length') || 0) > 8192) {
          return json({ error: 'Dados muito extensos.' }, 413);
        }
        const raw = await request.text();
        if (raw.length > 8192) {
          return json({ error: 'Dados muito extensos.' }, 413);
        }

        let body: {
          guestName?: unknown;
          phone?: unknown;
          attending?: unknown;
          companions?: unknown;
          message?: unknown;
        };
        try {
          body = JSON.parse(raw);
        } catch {
          return json({ error: 'Formato inválido.' }, 400);
        }

        const guestName = typeof body.guestName === 'string' ? body.guestName.trim() : '';
        if (guestName.length < 2 || guestName.length > 100) {
          return json({ error: 'Informe seu nome completo (entre 2 e 100 caracteres).' }, 400);
        }

        const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
        const digitsOnly = phone.replace(/\D/g, '');
        if (digitsOnly.length < 8 || phone.length > 30) {
          return json({ error: 'Informe um telefone ou WhatsApp válido para contato.' }, 400);
        }

        const attending = body.attending !== false;

        const cleanCompanions: Companion[] = [];
        if (attending && Array.isArray(body.companions)) {
          if (body.companions.length > 15) {
            return json({ error: 'Limite máximo de 15 acompanhantes por confirmação.' }, 400);
          }
          for (const item of body.companions) {
            if (!item || typeof item !== 'object') continue;
            const cName = typeof (item as { name?: unknown }).name === 'string'
              ? (item as { name: string }).name.trim()
              : '';
            const cType = (item as { type?: unknown }).type === 'child' ? 'child' : 'adult';
            if (cName.length >= 2 && cName.length <= 80) {
              cleanCompanions.push({ name: cName, type: cType });
            } else if (cName.length > 0) {
              return json({ error: 'Informe o nome completo de cada acompanhante.' }, 400);
            }
          }
        }

        const adultsCount = attending
          ? 1 + cleanCompanions.filter(c => c.type === 'adult').length
          : 0;
        const childrenCount = attending
          ? cleanCompanions.filter(c => c.type === 'child').length
          : 0;

        const message = typeof body.message === 'string' ? body.message.trim().slice(0, 500) : '';

        const inserted = await sql`
          insert into public.wedding_if_rsvps (
            guest_name,
            phone,
            attending,
            companions,
            adults_count,
            children_count,
            message
          ) values (
            ${guestName},
            ${phone},
            ${attending},
            ${sql.json(cleanCompanions)},
            ${adultsCount},
            ${childrenCount},
            ${message}
          )
          returning id, guest_name, phone, attending, companions, adults_count, children_count, message, created_at
        `;

        return json({ ok: true, rsvp: inserted[0] }, 201);
      }

      return json({ error: 'Método não permitido.' }, 405);
    } catch (err) {
      console.error('wedding-if-rsvps error:', err);
      return json({ error: 'Não foi possível processar a confirmação no momento. Tente novamente.' }, 503);
    } finally {
      await sql.end({ timeout: 2 }).catch(() => {});
    }
  });
}
