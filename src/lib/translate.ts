import { supabase } from'@/integrations/supabase/client';

const memCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

export class TranslateError extends Error {
 status: number;
 constructor(message: string, status: number) {
 super(message);
 this.status = status;
 }
}

export async function translateSentence(japanese: string): Promise<string> {
 const key = japanese.trim();
 if (!key) return'';
 const cached = memCache.get(key);
 if (cached) return cached;

 const existing = inflight.get(key);
 if (existing) return existing;

 const p = (async () => {
 const { data, error } = await supabase.functions.invoke('translate-sentence', {
 body: { japanese: key },
 });
 if (error) {
 // supabase-js wraps non-2xx; try to surface message
 const status = (error as any)?.context?.status ?? 500;
 let msg ='Translation unavailable';
 try {
 const body = await (error as any)?.context?.json?.();
 if (body?.error) msg = typeof body.error ==='string'? body.error : msg;
 } catch { /* ignore */ }
 throw new TranslateError(msg, status);
 }
 const english = (data as any)?.english as string | undefined;
 if (!english) throw new TranslateError('Empty translation', 500);
 memCache.set(key, english);
 return english;
 })();

 inflight.set(key, p);
 try {
 return await p;
 } finally {
 inflight.delete(key);
 }
}
