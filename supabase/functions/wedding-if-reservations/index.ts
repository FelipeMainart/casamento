const cors = {
 'Access-Control-Allow-Origin':'*',
 'Access-Control-Allow-Methods':'GET, POST, DELETE, OPTIONS',
 'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info, x-reservation-key',
 'Access-Control-Max-Age':'3600',
};
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { ...cors, 'Cache-Control': 'no-store' } });
const validToken = (token: unknown): token is string => typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);
const validProduct = (id: unknown): id is string => typeof id === 'string' && /^gift-(0[1-9]|1[0-9]|2[0-3])$/.test(id);
async function hash(token: string) {
 const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
 return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
}
export function makeHandler(config: {url:string;serviceKey:string}, fetcher: typeof fetch = fetch) {
 async function database(query: string, method = 'GET', body?: unknown, prefer?: string) {
  const response = await fetcher(config.url + '/rest/v1/wedding_if_reservations' + query, {
   method, headers: { apikey:config.serviceKey, Authorization:'Bearer '+config.serviceKey, 'Content-Type':'application/json', ...(prefer ? {Prefer:prefer} : {}) },
   ...(body === undefined ? {} : {body:JSON.stringify(body)}), signal:AbortSignal.timeout(10000)
  });
  if(!response.ok) throw new Error('Database unavailable');
  if(response.status === 204) return [];
  return await response.json() as {product_id:string;token_hash?:string}[];
 }
 return async (request: Request): Promise<Response> => {
  if(request.method === 'OPTIONS') return new Response(null,{status:204,headers:cors});
  try {
   if(request.method === 'GET') {
    const token = request.headers.get('X-Reservation-Key');
    const tokenHash = validToken(token) ? await hash(token) : '';
    const rows = await database('?select=product_id,token_hash');
    return json({reserved:rows.map(r=>r.product_id),mine:rows.filter(r=>r.token_hash === tokenHash).map(r=>r.product_id)});
   }
   if(request.method !== 'POST' && request.method !== 'DELETE') return json({error:'Método inválido.'},405);
   if(Number(request.headers.get('Content-Length')||0)>2048) return json({error:'Dados inválidos.'},413);
   const raw = await request.text();
   if(raw.length > 2048) return json({error:'Dados inválidos.'},413);
   let body: {productId?:unknown;name?:unknown;token?:unknown};
   try {body=JSON.parse(raw);} catch {return json({error:'Dados inválidos.'},400);}
   if(!body || typeof body !== 'object') return json({error:'Dados inválidos.'},400);
   const {productId,name,token}=body;
   if(!validProduct(productId)||!validToken(token)) return json({error:'Dados inválidos.'},400);
   const tokenHash=await hash(token);
   if(request.method==='DELETE') {
    const deleted=await database('?product_id=eq.'+encodeURIComponent(productId)+'&token_hash=eq.'+tokenHash+'&select=product_id','DELETE',undefined,'return=representation');
    if(!deleted.length) return json({error:'Esta reserva não pertence a este navegador.'},403);
    return json({ok:true});
   }
   if(typeof name!=='string'||name.trim().length<2||name.trim().length>80) return json({error:'Informe seu nome para reservar.'},400);
   const inserted=await database('?on_conflict=product_id&select=product_id','POST',{product_id:productId,guest_name:name.trim(),token_hash:tokenHash},'resolution=ignore-duplicates,return=representation');
   if(inserted.length) return json({ok:true},201);
   const owner=await database('?product_id=eq.'+encodeURIComponent(productId)+'&token_hash=eq.'+tokenHash+'&select=product_id');
   if(owner.length) return json({ok:true});
   return json({error:'Este presente acabou de ser reservado por outra pessoa. Escolha outro item.'},409);
  } catch {
   return json({error:'Não foi possível acessar as reservas. Tente novamente.'},503);
  }
 };
}
// These credentials are provided by Supabase at runtime and never sent to the browser.
if (typeof Deno !== 'undefined') {
 const url=Deno.env.get('SUPABASE_URL');
 const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 Deno.serve(url&&serviceKey?makeHandler({url,serviceKey}):()=>json({error:'Serviço indisponível.'},503));
}
