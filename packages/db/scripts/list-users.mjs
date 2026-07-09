#!/usr/bin/env node
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';

const envText = fs.readFileSync('services/api/.env', 'utf8');
const url = envText.match(/^DATABASE_URL\s*=\s*"?([^"\n]+)"?/m)[1].trim().replace(/@(?=.*@)/, '%40');

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
const { rows } = await client.query(`
  select id, full_name, cpf, role, created_at
  from users
  order by created_at desc
  limit 5
`);
console.table(rows);
await client.end();
