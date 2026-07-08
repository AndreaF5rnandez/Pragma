import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf-8');
const vars = {};
for (const line of env.split('\n')) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) vars[m[1].trim()] = m[2].trim();
}
const supabase = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await supabase.auth.admin.generateLink({
  type: 'magiclink',
  email: 'capacitacion.costo@gmail.com',
});
console.log('URL:', vars.NEXT_PUBLIC_SUPABASE_URL);
console.log(JSON.stringify({ error, hashed_token: data?.properties?.hashed_token, action_link: data?.properties?.action_link }, null, 2));
