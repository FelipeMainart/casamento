import config from './supabase-public.json';

export interface Companion {
  name: string;
  type: 'adult' | 'child';
}

export interface RsvpRecord {
  id: string;
  guest_name: string;
  phone: string;
  attending: boolean;
  companions: Companion[];
  adults_count: number;
  children_count: number;
  message: string;
  created_at: string;
}

export function rsvpRequest(init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('apikey', config.anonKey);
  headers.set('Authorization', 'Bearer ' + config.anonKey);
  return fetch(config.url + '/functions/v1/wedding-if-rsvps', {
    ...init,
    headers,
    cache: 'no-store',
    signal: init.signal ?? AbortSignal.timeout(20000),
  });
}
