import pg from "pg";

const connectionString = process.env.DATABASE_URL || "postgresql://dumar_user:DUMAR_DB_PASS_2026@184.107.88.189:5435/infra_db?schema=public";

async function main() {
  const client = new pg.Client({ connectionString });
  await client.connect();

  const query = `
    CREATE TABLE IF NOT EXISTS financial_transactions (
      id SERIAL PRIMARY KEY,
      description TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'receita',
      amount INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT 'venda_marcenaria',
      status TEXT NOT NULL DEFAULT 'pago',
      due_date TEXT NOT NULL DEFAULT '',
      payment_date TEXT DEFAULT '',
      payment_method TEXT DEFAULT 'PIX',
      lead_id INTEGER,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT ''
    );
  `;

  await client.query(query);
  console.log("✅ Tabela financial_transactions pronta no PostgreSQL!");
  await client.end();
}

main().catch(err => {
  console.error("❌ Erro ao criar tabela:", err);
  process.exit(1);
});
