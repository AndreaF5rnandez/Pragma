import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf-8');
const vars = {};
for (const line of env.split('\n')) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) vars[m[1].trim()] = m[2].trim();
}
const supabase = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY);
const { data: rubros } = await supabase.from('rubros').select('id,nombre').ilike('nombre', 'QA%');
console.log('leftover rubros:', rubros);
const { data: items } = await supabase.from('items').select('id,descripcion').ilike('descripcion', 'QA%');
console.log('leftover items:', items);
