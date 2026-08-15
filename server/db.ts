import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in .env file");
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export async function initDbTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT DEFAULT '',
        type TEXT NOT NULL DEFAULT 'evento',
        priority TEXT NOT NULL DEFAULT 'media',
        lead_id INTEGER,
        notes TEXT DEFAULT '',
        completed BOOLEAN NOT NULL DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS contracts (
        id SERIAL PRIMARY KEY,
        contract_number TEXT NOT NULL,
        contract_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'rascunho',
        lead_id INTEGER,
        client_name TEXT NOT NULL,
        client_cpf_cnpj TEXT DEFAULT '',
        client_address TEXT DEFAULT '',
        client_phone TEXT DEFAULT '',
        total_value INTEGER NOT NULL DEFAULT 0,
        down_payment INTEGER NOT NULL DEFAULT 0,
        data_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT DEFAULT ''
      );
    `);
  } catch (err) {
    console.error("Erro ao inicializar tabelas no banco:", err);
  }
}
