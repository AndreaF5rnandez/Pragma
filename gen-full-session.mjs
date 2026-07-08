import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf-8');
const vars = {};
for (const line of env.split('\n')) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) vars[m[1].trim()] = m[2].trim();
}
const admin = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY);
const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
  type: 'magiclink',
  email: 'capacitacion.costo@gmail.com',
});
if (linkErr) { console.error('link error', linkErr); process.exit(1); }

const anon = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data, error } = await anon.auth.verifyOtp({
  token_hash: linkData.properties.hashed_token,
  type: 'magiclink',
});
if (error) { console.error('verify error', error); process.exit(1); }

fs.writeFileSync('session.json', JSON.stringify(data.session));
console.log('Session saved. User:', data.session.user.email, 'expires_at:', data.session.expires_at);
