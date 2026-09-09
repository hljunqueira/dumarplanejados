import fs from "fs";
import path from "path";
import fileUrl from "url";

const N8N_URL = process.env.VITE_N8N_URL || "https://n8n.dumarplanejados.com.br";
const N8N_API_KEY = process.env.N8N_API_KEY || process.env.VITE_N8N_API_KEY || "";
const CRM_API_URL = process.env.CRM_API_URL || "https://dumarplanejados.com.br/api/leads";

if (!N8N_API_KEY) {
  console.error("❌ ERRO: N8N_API_KEY não definida no ambiente.");
  process.exit(1);
}

const headers = {
  "X-N8N-API-KEY": N8N_API_KEY,
  "Content-Type": "application/json",
};

async function getExistingWorkflows(): Promise<any[]> {
  try {
    const res = await fetch(`${N8N_URL}/api/v1/workflows`, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Status ${res.status}: ${text}`);
    }
    const data = await res.json();
    return data.data || [];
  } catch (err: any) {
    console.error("❌ Erro ao buscar workflows do n8n:", err.message);
    return [];
  }
}

async function activateWorkflow(id: string) {
  try {
    const res = await fetch(`${N8N_URL}/api/v1/workflows/${id}/activate`, {
      method: "POST",
      headers,
    });
    if (res.ok) {
      console.log(`✅ Workflow [${id}] ativado com sucesso no n8n.`);
    } else {
      console.warn(`⚠️ Não foi possível ativar workflow [${id}] automaticamente. Status: ${res.status}`);
    }
  } catch (e: any) {
    console.error(`⚠️ Erro ao ativar workflow [${id}]:`, e.message);
  }
}

export async function deployWorkflows() {
  console.log("🚀 Iniciando Deploy de Workflows para o n8n...");
  console.log(`📡 Instância n8n: ${N8N_URL}\n`);

  const workflowsDir = path.join(process.cwd(), "n8n", "workflows");
  if (!fs.existsSync(workflowsDir)) {
    console.error(`❌ Diretório de workflows não encontrado: ${workflowsDir}`);
    return;
  }

  const files = fs.readdirSync(workflowsDir).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    console.log("ℹ️ Nenhum arquivo de workflow JSON encontrado em n8n/workflows/.");
    return;
  }

  const existingWorkflows = await getExistingWorkflows();

  for (const file of files) {
    const filePath = path.join(workflowsDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    let workflowData: any;

    try {
      workflowData = JSON.parse(content);
    } catch (e: any) {
      console.error(`❌ Erro de sintaxe JSON no arquivo ${file}:`, e.message);
      continue;
    }

    const workflowName = workflowData.name || path.basename(file, ".json");
    const matched = existingWorkflows.find((w) => w.name === workflowName);

    if (matched) {
      console.log(`🔄 Atualizando workflow existente "${workflowName}" (ID: ${matched.id})...`);
      const updateRes = await fetch(`${N8N_URL}/api/v1/workflows/${matched.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          name: workflowData.name,
          nodes: workflowData.nodes,
          connections: workflowData.connections,
          settings: workflowData.settings || {},
        }),
      });

      if (updateRes.ok) {
        console.log(`✨ Workflow "${workflowName}" atualizado com sucesso!`);
        await activateWorkflow(matched.id);
      } else {
        const errText = await updateRes.text();
        console.error(`❌ Erro ao atualizar workflow "${workflowName}":`, errText);
      }
    } else {
      console.log(`➕ Criando novo workflow "${workflowName}"...`);
      const createRes = await fetch(`${N8N_URL}/api/v1/workflows`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: workflowData.name,
          nodes: workflowData.nodes,
          connections: workflowData.connections,
          settings: workflowData.settings || {},
        }),
      });

      if (createRes.ok) {
        const created = await createRes.json();
        console.log(`✨ Workflow "${workflowName}" criado com sucesso! (ID: ${created.id})`);
        await activateWorkflow(created.id);
      } else {
        const errText = await createRes.text();
        console.error(`❌ Erro ao criar workflow "${workflowName}":`, errText);
      }
    }
  }

  console.log("\n🎉 Deploy de workflows finalizado!");
}

export async function statusWorkflows() {
  console.log("📊 Consultando Status dos Workflows no n8n...");
  console.log(`📡 Instância n8n: ${N8N_URL}\n`);

  const workflows = await getExistingWorkflows();
  if (workflows.length === 0) {
    console.log("ℹ️ Nenhum workflow encontrado no n8n.");
    return;
  }

  console.table(
    workflows.map((w) => ({
      ID: w.id,
      Nome: w.name,
      Ativo: w.active ? "✅ SIM" : "❌ NÃO",
      CriadoEm: w.createdAt,
    }))
  );
}

export async function testCampaignFlow() {
  console.log("🧪 Testando Automação de Leads e Integração de Webhooks do n8n...\n");

  const endpoints = [
    {
      name: "Fluxo Campanha & Site (campaign-lead)",
      url: `${N8N_URL}/webhook/campaign-lead`,
      payload: {
        name: "Lead Teste Campanha Site",
        phone: "48999887766",
        email: "teste.campanha@dumarplanejados.com.br",
        stage: "entrada",
        value: 18000,
        utmSource: "Google Ads",
        utmCampaign: "Campanha Institucional Dumar",
        rooms: ["Cozinha Planejada", "Área Gourmet"],
      }
    },
    {
      name: "Fluxo Meta Instagram Lead Ads (meta-lead)",
      url: `${N8N_URL}/webhook/meta-lead`,
      payload: {
        lead_data: {
          full_name: "Lead Teste Meta Instagram Ads",
          phone_number: "48988776655",
          email: "teste.meta@dumarplanejados.com.br",
          campaign_name: "Campanha Instagram Móveis Sob Medida"
        }
      }
    }
  ];

  for (const ep of endpoints) {
    console.log(`📡 [${ep.name}]`);
    console.log(`📤 Enviando para Webhook: ${ep.url}`);

    try {
      const webhookRes = await fetch(ep.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ep.payload),
      });

      console.log(`   Status do Webhook: ${webhookRes.status} ${webhookRes.statusText}`);

      if (webhookRes.ok) {
        console.log(`   ✅ Webhook disparado e processado com sucesso pelo n8n!\n`);
      } else {
        const errText = await webhookRes.text();
        console.warn(`   ⚠️ Webhook retornou status ${webhookRes.status}: ${errText}\n`);
      }
    } catch (err: any) {
      console.error(`   ❌ Erro ao disparar webhook:`, err.message, "\n");
    }
  }

  console.log("🔍 Verificando recepção dos leads na API do CRM Dumar...");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  try {
    const crmRes = await fetch(CRM_API_URL);
    if (crmRes.ok) {
      const leads: any[] = await crmRes.json();
      console.log(`📊 Total de leads no CRM: ${leads.length}`);
      const recentLeads = leads.slice(0, 3);
      console.table(
        recentLeads.map((l) => ({
          ID: l.id,
          Nome: l.name,
          Telefone: l.phone,
          Origem: l.utmSource,
          Campanha: l.utmCampaign,
          Estágio: l.stage,
        }))
      );
    }
  } catch (err: any) {
    console.error("❌ Erro ao consultar CRM:", err.message);
  }
}

// Execução CLI
const command = process.argv[2] || "deploy";
if (command === "deploy") {
  deployWorkflows();
} else if (command === "status") {
  statusWorkflows();
} else if (command === "test") {
  testCampaignFlow();
} else {
  console.log("Uso: npm run n8n:deploy | npm run n8n:status | npm run n8n:test");
}
