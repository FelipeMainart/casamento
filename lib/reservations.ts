import config from './supabase-public.json';
// Only the public anon key is bundled. Privileged keys stay in Supabase.
export function reservationRequest(init: RequestInit = {}) {
 const headers = new Headers(init.headers);
 headers.set('apikey',config.anonKey);
 headers.set('Authorization','Bearer '+config.anonKey);
 return fetch(config.url+'/functions/v1/wedding-if-reservations',{...init,headers,cache:'no-store',signal:init.signal??AbortSignal.timeout(20000)});
}
