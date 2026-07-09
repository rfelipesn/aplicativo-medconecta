#!/usr/bin/env node
import pg from 'pg';
import fs from 'node:fs';

const envText = fs.readFileSync('services/api/.env', 'utf8');
const url = envText.match(/^DATABASE_URL\s*=\s*"?([^"\n]+)"?/m)[1].trim().replace(/@(?=.*@)/, '%40');
const supabaseUrl = envText.match(/^SUPABASE_URL\s*=\s*"?([^"\n]+)"?/m)[1].trim();
const serviceKey = envText.match(/^SUPABASE_SERVICE_ROLE_KEY\s*=\s*"?([^"\n]+)"?/m)[1].trim();

// 1) Apaga todos os usuários do DB Postgres (cascade em patients, etc)
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
await client.query('delete from audit_logs where user_id in (select id from users where full_name like $1)', ['%E2E%']);
await client.query('delete from users where full_name like $1', ['%E2E%']);
console.log('✓ Users com "E2E" removidos do Postgres.');
await client.end();

// 2) Apaga usuários do Supabase Auth com email mascarado (@e2e.medconecta.local)
const res = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=1000`, {
  headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
});
const data = await res.json();
const masked = (data.users || data).filter((u) =>
  (u.email || '').includes('@e2e.medconecta.local'),
);
for (const u of masked) {
  await fetch(`${supabaseUrl}/auth/v1/admin/users/${u.id}`, {
    method: 'DELETE',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  console.log(`  ✓ Auth user ${u.id} (${u.email}) removido.`);
}
console.log(`Total de auth users mascarados removidos: ${masked.length}`);
