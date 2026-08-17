import pg from "pg";

const connectionString = process.env.DATABASE_URL || "postgresql://dumar_user:DUMAR_DB_PASS_2026@184.107.88.189:5435/infra_db?schema=public";
const NEW_ADDRESS = "Av. Santa Catarina, 551 sala 205, Centro - Balneário Arroio do Silva - SC";

async function updateExistingContractsAddress() {
  console.log("🔌 Conectando ao PostgreSQL da Dumar Móveis Planejados...");
  const client = new pg.Client({ connectionString });
  await client.connect();

  console.log("🔍 Buscando todos os contratos no banco de dados...");
  const res = await client.query("SELECT id, contract_number, data_json FROM contracts");
  console.log(`Encontrados ${res.rows.length} contratos.`);

  let updatedCount = 0;

  for (const c of res.rows) {
    let dataObj: any = {};
    try {
      dataObj = typeof c.data_json === "string" ? JSON.parse(c.data_json) : (c.data_json || {});
    } catch (e) {
      console.warn(`Erro ao fazer parse do data_json do contrato ${c.id}`);
      continue;
    }

    let modified = false;

    // Atualizar companyAddress se for o antigo ou diferente do oficial
    if (!dataObj.companyAddress || dataObj.companyAddress.includes("Pereira") || dataObj.companyAddress !== NEW_ADDRESS) {
      console.log(`Contrato ${c.contract_number} (ID: ${c.id}): Atualizando companyAddress de "${dataObj.companyAddress}" para "${NEW_ADDRESS}"`);
      dataObj.companyAddress = NEW_ADDRESS;
      modified = true;
    }

    if (modified) {
      const updatedJson = JSON.stringify(dataObj);
      await client.query("UPDATE contracts SET data_json = $1 WHERE id = $2", [updatedJson, c.id]);
      updatedCount++;
    }
  }

  console.log(`✅ Concluído! ${updatedCount} contratos atualizados com sucesso para o endereço oficial: "${NEW_ADDRESS}".`);
  await client.end();
  process.exit(0);
}

updateExistingContractsAddress().catch(err => {
  console.error("❌ Erro ao atualizar contratos:", err);
  process.exit(1);
});
