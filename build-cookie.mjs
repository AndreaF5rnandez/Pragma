import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf-8');
const vars = {};
for (const line of env.split('\n')) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) vars[m[1].trim()] = m[2].trim();
}
const sessionJson = fs.readFileSync('session.json', 'utf-8');
const session = JSON.parse(sessionJson);

const projectRef = new URL(vars.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
const cookieName = `sb-${projectRef}-auth-token`;

function toBase64Url(str) {
  return Buffer.from(str, 'utf-8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const value = 'base64-' + toBase64Url(JSON.stringify(session));
fs.writeFileSync('cookie-value.txt', `${cookieName}=${value}`);
console.log('Cookie name:', cookieName);
console.log('Cookie length:', value.length);
