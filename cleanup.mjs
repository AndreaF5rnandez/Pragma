import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf-8');
const vars = {};
for (const line of env.split('\n')) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) vars[m[1].trim()] = m[2].trim();
}
const supabase = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY);
const { error } = await supabase.from('obras').delete().eq('nombre', '__QA_TEST_TEMPORAL__');
console.log('delete obra QA ->', error ?? 'OK');
const { data: check } = await supabase.from('obras').select('nombre').ilike('nombre', '%QA_TEST%');
console.log('remaining QA obras:', check);
