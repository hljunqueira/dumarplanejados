import pg from "pg";

const connectionString = process.env.DATABASE_URL || "postgresql://dumar_user:DUMAR_DB_PASS_2026@184.107.88.189:5435/infra_db?schema=public";

async function testFinancialCrud() {
  console.log("🧪 Testando operações de banco da tabela financial_transactions...");
  const client = new pg.Client({ connectionString });
  await client.connect();

  // 1. Inserir Receita
  const insertReceita = await client.query(`
    INSERT INTO financial_transactions (description, type, amount, category, status, due_date, payment_date, payment_method, notes)
    VALUES ('Venda Cozinha Planejada Cliente Teste', 'receita', 18500, 'venda_marcenaria', 'pago', '2026-07-31', '2026-07-31', 'PIX', 'Teste de integração CRUD')
    RETURNING *;
  `);

  console.log("✅ Receita de Teste inserida:", insertReceita.rows[0]);

  // 2. Inserir Despesa
  const insertDespesa = await client.query(`
    INSERT INTO financial_transactions (description, type, amount, category, status, due_date, payment_method, notes)
    VALUES ('Compra de Chapa MDF Arauco', 'despesa', 4200, 'materia_prima', 'pendente', '2026-08-10', 'Boleto', 'Pagamento fornecedor')
    RETURNING *;
  `);

  console.log("✅ Despesa de Teste inserida:", insertDespesa.rows[0]);

  // 3. Consultar totalização
  const summary = await client.query(`
    SELECT 
      SUM(CASE WHEN type = 'receita' AND status = 'pago' THEN amount ELSE 0 END) as total_receitas,
      SUM(CASE WHEN type = 'despesa' AND status = 'pago' THEN amount ELSE 0 END) as total_despesas
    FROM financial_transactions;
  `);

  console.log("📊 Resumo Financeiro:", summary.rows[0]);

  // 4. Limpar dados de teste
  await client.query("DELETE FROM financial_transactions WHERE notes LIKE '%Teste%';");
  console.log("🧹 Dados de teste limpos com sucesso.");

  await client.end();
}

testFinancialCrud().catch(err => {
  console.error("❌ Erro durante teste do banco:", err);
  process.exit(1);
});
