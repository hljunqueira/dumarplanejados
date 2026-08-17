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

      -- Migração automática de novas colunas na tabela leads
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS construction_photos TEXT DEFAULT '[]';
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS materials TEXT DEFAULT '{}';
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_customer_message_at TEXT DEFAULT '';
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_paused BOOLEAN DEFAULT FALSE;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS appointment_status TEXT DEFAULT 'none';
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS appointment_details TEXT DEFAULT '{}';

      -- Migração automática de novas colunas na tabela users
      ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'vendedor';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions TEXT DEFAULT '["kanban", "agenda"]';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TEXT DEFAULT '';
    `);
    console.log("Banco de Dados Dumar: Tabelas e colunas sincronizadas com sucesso.");
  } catch (err) {
    console.error("Erro ao inicializar tabelas no banco:", err);
  }
}
