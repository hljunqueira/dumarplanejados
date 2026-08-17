import pg from "pg";

const connectionString = process.env.DATABASE_URL || "postgresql://dumar_user:DUMAR_DB_PASS_2026@184.107.88.189:5435/infra_db?schema=public";

async function main() {
  console.log("🔌 Conectando ao PostgreSQL da Dumar Móveis Planejados...");
  const client = new pg.Client({ connectionString });
  await client.connect();

  console.log("🛠️ 1. Verificando e atualizando tabela financial_transactions...");
  await client.query(`
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
  `);

  // Adicionar colunas de recorrência caso não existam
  await client.query(`
    ALTER TABLE financial_transactions 
    ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS recurrence_group TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS installment_index INTEGER DEFAULT 1;
  `);
  console.log("✅ Colunas de recorrência verificadas na tabela financial_transactions!");

  console.log("🛠️ 2. Criando tabela materials_catalog...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS materials_catalog (
      id SERIAL PRIMARY KEY,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      is_default BOOLEAN DEFAULT false,
      created_at TEXT DEFAULT ''
    );
  `);
  console.log("✅ Tabela materials_catalog criada/verificada com sucesso!");

  console.log("🌱 3. Verificando seed de materiais e ferragens padrão...");
  const { rows } = await client.query("SELECT COUNT(*) FROM materials_catalog");
  const count = parseInt(rows[0].count, 10);

  if (count === 0) {
    console.log("📦 Inserindo catálogo padrão de marcenaria fina (MDFs, Vidros, Ferragens)...");
    const defaultMaterials = [
      // Estrutura
      {
        category: "estrutura",
        name: "MDF 15mm Branco BP Standard",
        description: "Estrutura do móvel em MDF 15mm, revestimento melamínico BP cor branco, fita de borda reta em polipropileno 0,4mm.",
        is_default: true
      },
      {
        category: "estrutura",
        name: "MDF 18mm Branco BP Alta Densidade",
        description: "Estrutura do móvel em MDF 18mm reforçado, revestimento melamínico BP cor branco, fita de borda reta em polipropileno 1,0mm.",
        is_default: false
      },
      // Frentes
      {
        category: "frentes",
        name: "MDF 15mm BP Padrão Fendi",
        description: "Frentes de portas, gavetas, gavetões e articulados (se existir no projeto) em MDF 15mm, revestimento melamínico BP padrão Fendi, fita de borda reta em poliestireno 0,4mm.",
        is_default: true
      },
      {
        category: "frentes",
        name: "MDF 18mm BP Carvalho Hanover / Madeirado Nobre",
        description: "Frentes de portas e gavetas em MDF 18mm, padrão Carvalho Hanover com veios sincronizados, fita de borda 1,0mm termofundida.",
        is_default: false
      },
      {
        category: "frentes",
        name: "MDF 18mm BP Grafite Matt Fosco",
        description: "Frentes em MDF 18mm acabamento acetinado Grafite Matt com tratamento anti-marcas e fitamento em poliestireno.",
        is_default: false
      },
      // Tamponamentos
      {
        category: "tamponamento",
        name: "Tamponamento MDF 15mm BP Fendi",
        description: "Tamponamentos, prateleiras externas e painéis lineares em MDF, revestimento melamínico BP padrão Fendi, fita de borda reta em poliestireno 0,4mm.",
        is_default: true
      },
      {
        category: "tamponamento",
        name: "Tamponamento Engrossado 25mm / 30mm",
        description: "Tamponamento duplo engrossado 25mm em MDF BP com fita de borda 1,0mm de alto impacto.",
        is_default: false
      },
      // Vidros & Perfis de Alumínio
      {
        category: "vidros",
        name: "Vidro Reflecta Fumê com Perfil Slim Preto",
        description: "Portas em vidro Reflecta Fumê 4mm temperado com moldura em perfil de alumínio Slim anodizado preto fosco.",
        is_default: true
      },
      {
        category: "vidros",
        name: "Vidro Reflecta Bronze com Perfil Champagne",
        description: "Portas em vidro Reflecta Bronze 4mm com moldura em perfil de alumínio champagne acetinado e puxador integrado.",
        is_default: false
      },
      {
        category: "vidros",
        name: "Vidro Canelado Vintage com Perfil Preto",
        description: "Vidro canelado translúcido 4mm com caixilho em perfil de alumínio preto fosco.",
        is_default: false
      },
      {
        category: "vidros",
        name: "Espelho Prata Bisotado 4mm",
        description: "Espelho cristal prata 4mm com lapidação reta / bisotê para portas de correr e painéis.",
        is_default: false
      },
      // Puxadores
      {
        category: "puxadores",
        name: "Vancouver 128mm Alumínio Anodizado",
        description: "Vancouver 128mm, material alumínio, acabamento anodizado natural.",
        is_default: true
      },
      {
        category: "puxadores",
        name: "Perfil Cava / Gola Embutido Preto",
        description: "Puxador perfil tipo Gola / Cava contínuo em alumínio anodizado preto fosco embutido nas portas e gavetas.",
        is_default: false
      },
      {
        category: "puxadores",
        name: "Puxador Alça Barra Dourado / Gold Escovado",
        description: "Puxador tubular alça longa em liga metálica com acabamento Gold escovado de alto padrão.",
        is_default: false
      },
      {
        category: "puxadores",
        name: "Sistema Cava Usinada / Toque Push-Open",
        description: "Frentes sem puxador aparente, abertura por fecho de toque (Push-to-Open) ou cava usinada 45 graus.",
        is_default: false
      },
      // Dobradiças
      {
        category: "dobradicas",
        name: "Inox com Amortecedor Soft Close (Portas de Giro)",
        description: "Inox com amortecimento, para portas de giro. E sistema de giro normal Hettich para portas basculantes.",
        is_default: true
      },
      {
        category: "dobradicas",
        name: "Hettich Sensys com Amortecimento Integrado",
        description: "Dobradiças alemãs Hettich Sensys com amortecedor silencioso integrado no corpo da dobradiça e click rápido.",
        is_default: false
      },
      {
        category: "dobradicas",
        name: "Articulador Basculante a Gás com Pistão",
        description: "Pistão a gás com amortecimento na subida e descida para portas basculantes e articuladas.",
        is_default: false
      },
      // Corrediças
      {
        category: "corredicas",
        name: "Telescópica Rolamento Esférico 450mm",
        description: "Com rolamento esférico, 450mm, sem sistema de amortecimento.",
        is_default: true
      },
      {
        category: "corredicas",
        name: "Telescópica Oculta / Invisível Soft Close (Slow)",
        description: "Corrediça invisível oculta sob a gaveta com amortecimento Soft Close de extração total e deslizamento suave.",
        is_default: false
      },
      {
        category: "corredicas",
        name: "Corrediça Invisível com Toque (Push-Open)",
        description: "Corrediça oculta sob o fundo da gaveta com abertura automática por toque (Push-to-Open).",
        is_default: false
      },
      // Itens Extras
      {
        category: "extras",
        name: "Fita LED COB com Perfil Difusor na Cristaleira",
        description: "Fita led nas laterais internas da cristaleira",
        is_default: true
      },
      {
        category: "extras",
        name: "Perfil LED Embutido 3000K Branco Quente sob os Armários",
        description: "Perfil de alumínio embutido com difusor leitoso e fita LED COB 3000K quente para bancada de trabalho.",
        is_default: false
      },
      {
        category: "extras",
        name: "Divisor de Talheres em Acrílico + Lixeira Dupla Inox",
        description: "Organizador de gaveta em acrílico sob medida e sistema de lixeira seletiva de embutir no gavetão.",
        is_default: false
      }
    ];

    for (const item of defaultMaterials) {
      await client.query(
        `INSERT INTO materials_catalog (category, name, description, is_default, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [item.category, item.name, item.description, item.is_default, new Date().toISOString()]
      );
    }
    console.log(`✅ ${defaultMaterials.length} itens de materiais e ferragens inseridos com sucesso!`);
  } else {
    console.log(`ℹ️ Catálogo já contém ${count} itens cadastrados.`);
  }

  await client.end();
  console.log("🎉 Banco de dados atualizado e sincronizado com sucesso!");
}

main().catch(err => {
  console.error("❌ Erro durante execução do script de banco de dados:", err);
  process.exit(1);
});
