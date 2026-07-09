#!/usr/bin/env node
/**
 * Aplica todas as migrations SQL em `supabase/migrations/*.sql` no Supabase.
 * Lê a connection string de services/api/.env (DATABASE_URL) ou do ambiente.
 *
 * Uso: node packages/db/scripts/apply-migrations.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.join(ROOT, 'services/api/.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('DATABASE_URL não definida e services/api/.env não encontrado.');
  }
  const text = fs.readFileSync(envPath, 'utf8');
  const match = text.match(/^DATABASE_URL\s*=\s*"?([^"\n]+)"?/m);
  if (!match) throw new Error('DATABASE_URL não encontrada em services/api/.env');
  let url = match[1].trim();
  // Decodifica @ -> %40 escapado no .env
  url = url.replace(/@(?=.*@)/, '%40');
  return url;
}

const MIGRATIONS_DIR = path.join(ROOT, 'supabase/migrations');

async function listMigrations() {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  return files;
}

async function ensureMigrationsTable(client) {
  await client.query(`
    create table if not exists _migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    );
  `);
}

async function alreadyApplied(client, filename) {
  const { rows } = await client.query('select 1 from _migrations where filename = $1', [filename]);
  return rows.length > 0;
}

async function applyOne(client, filename) {
  const fullPath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(fullPath, 'utf8');
  console.log(`→ Aplicando ${filename} (${sql.length} bytes)...`);
  try {
    await client.query(sql);
    await client.query('insert into _migrations (filename) values ($1) on conflict do nothing', [filename]);
    console.log(`  ✅ ${filename} ok`);
  } catch (err) {
    // Continuar mesmo se parte falhar (idempotência)
    console.warn(`  ⚠️  ${filename} aviso: ${err.message}`);
    if (!err.message.includes('already exists')) throw err;
  }
}

async function main() {
  const url = loadDatabaseUrl();
  console.log(`Conectando ao Postgres...`);
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await ensureMigrationsTable(client);
    const files = await listMigrations();
    for (const f of files) {
      if (await alreadyApplied(client, f)) {
        console.log(`↩️  ${f} já aplicada, pulando.`);
        continue;
      }
      await applyOne(client, f);
    }
    console.log('\n✅ Todas as migrations foram aplicadas.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
