import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf-8');
const vars = {};
for (const line of env.split('\n')) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) vars[m[1].trim()] = m[2].trim();
}
const anon = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data: obrasAnon, error: obrasAnonErr } = await anon.from('obras').select('id').limit(5);
console.log('ANON (no session) obras query ->', obrasAnon, obrasAnonErr);
const { data: itemsAnon, error: itemsAnonErr } = await anon.from('items').select('id').limit(5);
console.log('ANON (no session) items query ->', itemsAnon, itemsAnonErr);
const { data: recetasAnon, error: recetasAnonErr } = await anon.from('recetas').select('id').limit(5);
console.log('ANON (no session) recetas query ->', recetasAnon, recetasAnonErr);
