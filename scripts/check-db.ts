import { pool, initDbTables } from '../server/db';

async function main() {
  try {
    console.log("=== Sincronizando tabelas com initDbTables() ===");
    await initDbTables();

    console.log("\n=== Consultando information_schema.tables no PostgreSQL ===");
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log(`Total de tabelas encontradas: ${res.rows.length}\n`);

    for (const r of res.rows) {
      const tName = r.table_name;
      const countRes = await pool.query(`SELECT COUNT(*) as c FROM "${tName}"`).catch(() => ({ rows: [{ c: 'erro' }] }));
      
      const colsRes = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [tName]);

      const cols = colsRes.rows.map(c => `${c.column_name} (${c.data_type})`).join(', ');
      console.log(`✅ [${tName}] -> ${countRes.rows[0].c} registros`);
      console.log(`   Colunas: ${cols}\n`);
    }

    console.log("=== Verificação concluída com sucesso! ===");
  } catch (e) {
    console.error("Erro na verificação:", e);
  } finally {
    await pool.end();
  }
}

main();
