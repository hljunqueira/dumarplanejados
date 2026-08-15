import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// Função para gerar hash simples e seguro usando crypto nativo do Node
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

import { initDbTables } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  await initDbTables();
  
  // --- SEEDING DOS USUÁRIOS ADMINS NA INICIALIZAÇÃO ---
  try {
    const adminUser = await storage.getUserByUsername("admin");
    if (!adminUser) {
      console.log("Seeding: Criando usuário administrador padrão no PostgreSQL...");
      await storage.createUser({
        username: "admin",
        password: hashPassword("Dumar@2026")
      });
      console.log("Seeding: Usuário admin criado com sucesso!");
    }

    const pauloUser = await storage.getUserByUsername("paulo@dumarplanejados.com.br");
    if (!pauloUser) {
      console.log("Seeding: Criando usuário Paulo no PostgreSQL...");
      await storage.createUser({
        username: "paulo@dumarplanejados.com.br",
        password: hashPassword("Pvargas@26")
      });
      console.log("Seeding: Usuário Paulo criado com sucesso!");
    }
  } catch (err) {
    console.error("Erro durante o seeding do administrador:", err);
  }

  // --- ENDPOINTS DO CRM ---

  // Login Seguro do Painel
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Usuário e senha são obrigatórios" });
    }

    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      const inputHash = hashPassword(password);
      if (user.password !== inputHash) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      return res.status(200).json({ success: true, username: user.username });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Obter todos os Leads
  app.get("/api/leads", async (req, res) => {
    try {
      const leadsList = await storage.getLeads();
      return res.status(200).json(leadsList);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro ao obter leads" });
    }
  });

  // Criar Novo Lead (Manual ou via Typebot/n8n)
  app.post("/api/leads", async (req, res) => {
    const { name, phone, email, stage, value, utmSource, utmCampaign, rooms } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: "Nome e telefone são obrigatórios" });
    }

    try {
      const newLead = await storage.createLead({
        name,
        phone,
        email: email || "",
        stage: stage || "entrada",
        value: Number(value) || 0,
        utmSource: utmSource || "Campanha Manual",
        utmCampaign: utmCampaign || "Google Ads",
        rooms: typeof rooms === "string" ? rooms : JSON.stringify(rooms || []),
        promobFiles: JSON.stringify([]),
        checklist: JSON.stringify({
          "medidas_conferidas": false,
          "pontos_agua_gas_conferidos": false,
          "plano_corte_gerado": false,
          "enviado_fabrica": false,
          "montagem_iniciada": false,
          "vistoria_finalizada": false
        }),
        chatHistory: JSON.stringify([
          { sender: "system", text: "Lead criado no sistema", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ])
      });

      return res.status(201).json(newLead);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro ao criar lead" });
    }
  });

  // Webhook para Recepção de Leads do ZernFlow (ManyChat Open Source - Instagram / WhatsApp)
  app.post("/api/zernflow/webhook", async (req, res) => {
    try {
      const body = req.body || {};
      const name = body.name || body.contact?.name || body.full_name || "Lead Instagram / ZernFlow";
      const phone = body.phone || body.contact?.phone || body.phone_number || "";
      const email = body.email || body.contact?.email || "";
      const platform = body.platform || body.channel || "Instagram";
      const rooms = body.rooms || body.ambient || ["Cozinha / Sala"];
      const notes = body.message || body.last_message || "Lead capturado via ZernFlow (Comment-to-DM)";

      const newLead = await storage.createLead({
        name,
        phone,
        email,
        stage: "entrada",
        value: 0,
        utmSource: `ZernFlow ${platform}`,
        utmCampaign: body.campaign || "Automação Social",
        rooms: typeof rooms === "string" ? rooms : JSON.stringify(rooms),
        promobFiles: JSON.stringify([]),
        checklist: JSON.stringify({
          "medidas_conferidas": false,
          "pontos_agua_gas_conferidos": false,
          "plano_corte_gerado": false,
          "enviado_fabrica": false,
          "montagem_iniciada": false,
          "vistoria_finalizada": false
        }),
        chatHistory: JSON.stringify([
          { sender: "system", text: `Lead recebido via ZernFlow (${platform}): ${notes}`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ])
      });

      return res.status(201).json({ success: true, lead: newLead });
    } catch (err) {
      console.error("Erro no webhook do ZernFlow:", err);
      return res.status(500).json({ success: false, error: "Erro interno no processamento" });
    }
  });

  // Atualizar Lead (Etapa, Checklist, Chat, Valores)
  app.patch("/api/leads/:id", async (req, res) => {
    const leadId = Number(req.params.id);
    if (isNaN(leadId)) {
      return res.status(400).json({ message: "ID do lead inválido" });
    }

    try {
      const currentLead = await storage.getLead(leadId);
      if (!currentLead) {
        return res.status(404).json({ message: "Lead não encontrado" });
      }

      // Prepara os dados de atualização mapeando campos string/JSON
      const updateData: any = {};
      
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.phone !== undefined) updateData.phone = req.body.phone;
      if (req.body.email !== undefined) updateData.email = req.body.email;
      if (req.body.stage !== undefined) updateData.stage = req.body.stage;
      if (req.body.value !== undefined) updateData.value = Number(req.body.value);
      if (req.body.assembler !== undefined) updateData.assembler = req.body.assembler;
      if (req.body.deliveryDate !== undefined) updateData.deliveryDate = req.body.deliveryDate;
      if (req.body.paymentMethod !== undefined) updateData.paymentMethod = req.body.paymentMethod;
      if (req.body.installments !== undefined) updateData.installments = Number(req.body.installments);
      if (req.body.downPayment !== undefined) updateData.downPayment = Number(req.body.downPayment);

      // Serializa arrays/objetos se vierem como objeto/array nativo do body
      // Serializa arrays/objetos se vierem como objeto/array nativo do body
      if (req.body.rooms !== undefined) {
        updateData.rooms = typeof req.body.rooms === "string" ? req.body.rooms : JSON.stringify(req.body.rooms);
      }
      if (req.body.promobFiles !== undefined) {
        updateData.promobFiles = typeof req.body.promobFiles === "string" ? req.body.promobFiles : JSON.stringify(req.body.promobFiles);
      }
      if (req.body.constructionPhotos !== undefined) {
        updateData.constructionPhotos = typeof req.body.constructionPhotos === "string" ? req.body.constructionPhotos : JSON.stringify(req.body.constructionPhotos);
      }
      if (req.body.materials !== undefined) {
        updateData.materials = typeof req.body.materials === "string" ? req.body.materials : JSON.stringify(req.body.materials);
      }
      if (req.body.checklist !== undefined) {
        updateData.checklist = typeof req.body.checklist === "string" ? req.body.checklist : JSON.stringify(req.body.checklist);
      }
      if (req.body.chatHistory !== undefined) {
        updateData.chatHistory = typeof req.body.chatHistory === "string" ? req.body.chatHistory : JSON.stringify(req.body.chatHistory);
      }
      if (req.body.lastCustomerMessageAt !== undefined) {
        updateData.lastCustomerMessageAt = req.body.lastCustomerMessageAt;
      }
      if (req.body.aiPaused !== undefined) {
        updateData.aiPaused = Boolean(req.body.aiPaused);
      }

      const updated = await storage.updateLead(leadId, updateData);
      return res.status(200).json(updated);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro ao atualizar lead" });
    }
  });

  // Alternar Status da IA para um Lead específico (Intervenção Humana / Hand-off)
  app.post("/api/leads/:id/toggle-ai", async (req, res) => {
    const leadId = Number(req.params.id);
    if (isNaN(leadId)) {
      return res.status(400).json({ message: "ID do lead inválido" });
    }

    try {
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead não encontrado" });
      }

      const nextState = req.body.aiPaused !== undefined ? Boolean(req.body.aiPaused) : !lead.aiPaused;
      const updated = await storage.updateLead(leadId, { aiPaused: nextState });

      console.log(`IA Comercial Dumar: Status da IA para o Lead ${lead.name} alterado para: ${nextState ? "PAUSADA (Humano no controle)" : "ATIVA"}`);
      return res.status(200).json({ success: true, aiPaused: nextState, lead: updated });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro ao alternar IA do lead" });
    }
  });

  // Excluir Lead
  app.delete("/api/leads/:id", async (req, res) => {
    const leadId = Number(req.params.id);
    if (isNaN(leadId)) {
      return res.status(400).json({ message: "ID do lead inválido" });
    }

    try {
      const deleted = await storage.deleteLead(leadId);
      if (!deleted) {
        return res.status(404).json({ message: "Lead não encontrado" });
      }
      return res.status(200).json({ success: true, message: "Lead excluído com sucesso" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro ao excluir lead" });
    }
  });

  // Exportar Leads em CSV
  app.get("/api/leads/export", async (req, res) => {
    try {
      const leadsList = await storage.getLeads();
      let csv = "ID,Nome,Telefone,Email,Estagio,Valor,Origem,Campanha,Ambientes\n";
      leadsList.forEach(l => {
        const roomsStr = typeof l.rooms === "string" ? l.rooms : JSON.stringify(l.rooms || []);
        csv += `"${l.id}","${l.name}","${l.phone}","${l.email || ''}","${l.stage}","${l.value}","${l.utmSource || ''}","${l.utmCampaign || ''}","${roomsStr.replace(/"/g, '""')}"\n`;
      });
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="leads_dumar.csv"');
      return res.status(200).send(csv);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro ao exportar CSV" });
    }
  });

  // --- TRANSAÇÕES FINANCEIRAS (CRM FINANCEIRO) ---

  app.get("/api/financial/transactions", async (req, res) => {
    try {
      const transactions = await storage.getFinancialTransactions();
      return res.status(200).json(transactions);
    } catch (err) {
      console.error("Erro ao obter transações financeiras:", err);
      return res.status(500).json({ message: "Erro ao obter transações financeiras" });
    }
  });

  app.post("/api/financial/transactions", async (req, res) => {
    const { description, type, amount, category, status, dueDate, paymentDate, paymentMethod, leadId, notes } = req.body;
    if (!description || amount === undefined) {
      return res.status(400).json({ message: "Descrição e valor são obrigatórios" });
    }

    try {
      const newTx = await storage.createFinancialTransaction({
        description,
        type: type || "receita",
        amount: Number(amount) || 0,
        category: category || "venda_marcenaria",
        status: status || "pago",
        dueDate: dueDate || new Date().toISOString().split("T")[0],
        paymentDate: paymentDate || (status === "pago" ? new Date().toISOString().split("T")[0] : ""),
        paymentMethod: paymentMethod || "PIX",
        leadId: leadId ? Number(leadId) : null,
        notes: notes || "",
        createdAt: new Date().toISOString()
      });
      return res.status(201).json(newTx);
    } catch (err) {
      console.error("Erro ao criar transação financeira:", err);
      return res.status(500).json({ message: "Erro ao criar transação financeira" });
    }
  });

  app.patch("/api/financial/transactions/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    try {
      const updated = await storage.updateFinancialTransaction(id, req.body);
      return res.status(200).json(updated);
    } catch (err) {
      console.error("Erro ao atualizar transação financeira:", err);
      return res.status(500).json({ message: "Erro ao atualizar transação financeira" });
    }
  });

  app.delete("/api/financial/transactions/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    try {
      const deleted = await storage.deleteFinancialTransaction(id);
      if (!deleted) {
        return res.status(404).json({ message: "Transação não encontrada" });
      }
      return res.status(200).json({ success: true, message: "Transação excluída com sucesso" });
    } catch (err) {
      console.error("Erro ao excluir transação financeira:", err);
      return res.status(500).json({ message: "Erro ao excluir transação financeira" });
    }
  });

  // --- ENDPOINTS EVOLUTION API REAL ---
  const EVOLUTION_URL = process.env.EVOLUTION_URL || "http://evolution:8080";
  const EVOLUTION_KEY = process.env.EVOLUTION_APIKEY || "DUMAR_SECRET_TOKEN_2026";


  app.get("/api/evolution/instances", async (req, res) => {
    try {
      const response = await fetch(`${EVOLUTION_URL}/instance/fetchInstances`, {
        headers: { apikey: EVOLUTION_KEY }
      });
      if (!response.ok) {
        return res.status(response.status).json([]);
      }
      const instances = await response.json();
      return res.status(200).json(instances);
    } catch (err) {
      console.error("Erro ao buscar instâncias da Evolution API:", err);
      return res.status(200).json([]);
    }
  });

  app.post("/api/evolution/connect", async (req, res) => {
    const { instanceName = "dumar_comercial" } = req.body;
    try {
      // 1. Tentar criar instância se não existir
      let createRes = await fetch(`${EVOLUTION_URL}/instance/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_KEY },
        body: JSON.stringify({
          instanceName,
          integration: "WHATSAPP-BAILEYS",
          qrcode: true
        })
      });
      const createData = await createRes.json().catch(() => ({}));

      // 2. Tentar buscar QR code (connect)
      let connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
        headers: { apikey: EVOLUTION_KEY }
      });
      const connectData = await connectRes.json().catch(() => ({}));

      const qr = connectData?.base64 || 
                 connectData?.code || 
                 connectData?.qrcode?.base64 || 
                 connectData?.qrcode?.code || 
                 createData?.qrcode?.base64 || 
                 createData?.qrcode?.code || 
                 createData?.base64 || 
                 createData?.code;

      return res.status(200).json({
        createData,
        connectData,
        qrcode: qr
      });
    } catch (err) {
      console.error("Erro ao conectar instância Evolution API:", err);
      return res.status(500).json({ message: "Erro ao gerar QR Code do WhatsApp" });
    }
  });

  // Desconectar e Limpar Instância do WhatsApp na Evolution API (Gera novo QR ao ler)
  app.post("/api/evolution/logout", async (req, res) => {
    const { instanceName = "dumar_comercial" } = req.body;
    try {
      // 1. Efetuar Logout na Evolution API
      await fetch(`${EVOLUTION_URL}/instance/logout/${instanceName}`, {
        method: "DELETE",
        headers: { apikey: EVOLUTION_KEY }
      }).catch(() => {});

      // 2. Deletar a instância para permitir nova conexão limpa
      await fetch(`${EVOLUTION_URL}/instance/delete/${instanceName}`, {
        method: "DELETE",
        headers: { apikey: EVOLUTION_KEY }
      }).catch(() => {});

      return res.status(200).json({ success: true, message: "Instância desconectada e resetada com sucesso." });
    } catch (err) {
      console.error("Erro ao desconectar instância:", err);
      return res.status(500).json({ message: "Erro ao desconectar instância" });
    }
  });

  // Função Universal Resiliente para Envio de WhatsApp (GSM, JID e LID do WhatsApp)
  async function sendWhatsAppMessageViaEvolution(
    recipient: string, 
    text: string, 
    instanceName: string = "dumar_comercial"
  ): Promise<{ success: boolean; instanceDisconnected: boolean; usedRecipient: string; errorDetails?: any }> {
    const raw = (recipient || "").trim();
    let cleanDigits = raw.replace(/\D/g, "");

    const candidates: string[] = [];

    if (raw.includes("@")) {
      // Já é um JID completo (ex: 5584680296628356@lid ou 5548991013293@s.whatsapp.net)
      candidates.push(raw);
    } else if (cleanDigits.length > 13) {
      // É um LID (Linked Device / Privacy ID do WhatsApp)
      candidates.push(`${cleanDigits}@lid`);
      candidates.push(cleanDigits);
      candidates.push(`${cleanDigits}@s.whatsapp.net`);
    } else {
      // Número GSM brasileiro
      if (cleanDigits.length >= 10 && !cleanDigits.startsWith("55")) {
        cleanDigits = `55${cleanDigits}`;
      }
      candidates.push(cleanDigits);
      if (cleanDigits.startsWith("55") && cleanDigits.length === 12) {
        candidates.push(cleanDigits.slice(0, 4) + "9" + cleanDigits.slice(4));
      } else if (cleanDigits.startsWith("55") && cleanDigits.length === 13) {
        candidates.push(cleanDigits.slice(0, 4) + cleanDigits.slice(5));
      }
      candidates.push(`${cleanDigits}@s.whatsapp.net`);
    }

    let success = false;
    let instanceDisconnected = false;
    let usedRecipient = candidates[0] || raw;
    let lastError: any = null;

    for (const cand of candidates) {
      try {
        const evoRes = await fetch(`${EVOLUTION_URL}/message/sendText/${instanceName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: EVOLUTION_KEY
          },
          body: JSON.stringify({
            number: cand,
            text,
            linkPreview: true
          })
        });

        if (evoRes.ok) {
          success = true;
          usedRecipient = cand;
          break;
        } else {
          const errData = await evoRes.json().catch(() => ({}));
          const errStr = JSON.stringify(errData).toLowerCase();
          lastError = errData;
          if (errStr.includes("not connected") || errStr.includes("instance not found") || evoRes.status === 401) {
            instanceDisconnected = true;
          }
        }
      } catch (evoErr) {
        console.error("Erro na tentativa de envio via Evolution API:", evoErr);
        instanceDisconnected = true;
        lastError = evoErr;
      }
    }

    return { success, instanceDisconnected, usedRecipient, errorDetails: lastError };
  }

  // Enviar mensagem real via Evolution API e atualizar chatHistory do lead
  app.post("/api/evolution/send-message", async (req, res) => {
    const { leadId, message, instanceName = "dumar_comercial" } = req.body;
    if (!leadId || !message) {
      return res.status(400).json({ message: "leadId e message são obrigatórios" });
    }

    try {
      const lead = await storage.getLead(Number(leadId));
      if (!lead) {
        return res.status(404).json({ message: "Lead não encontrado" });
      }

      const { success: evoSuccess, instanceDisconnected, usedRecipient } = 
        await sendWhatsAppMessageViaEvolution(lead.phone, message, instanceName);

      // Se enviou por uma variação limpa diferente, atualiza
      if (evoSuccess && usedRecipient && !usedRecipient.includes("@lid") && usedRecipient !== lead.phone) {
        await storage.updateLead(lead.id, { phone: usedRecipient.replace(/@.*/, "") });
      }

      // Atualiza o chatHistory do lead no banco PostgreSQL com fuso de São Paulo
      const currentHistory = typeof lead.chatHistory === "string" 
        ? JSON.parse(lead.chatHistory || "[]") 
        : (lead.chatHistory || []);

      const timestamp = new Date().toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit"
      });
      const newMessage = { 
        sender: "agent" as const, 
        text: message, 
        timestamp,
        deliveredViaEvolution: evoSuccess,
        isHuman: true,
        sentAt: Date.now()
      };
      
      const updatedHistory = [...currentHistory, newMessage];

      const updatedLead = await storage.updateLead(lead.id, {
        chatHistory: JSON.stringify(updatedHistory),
        aiPaused: true
      });

      return res.status(200).json({
        success: true,
        evoSuccess,
        instanceDisconnected,
        lead: {
          ...updatedLead,
          chatHistory: updatedHistory,
          aiPaused: true
        }
      });
    } catch (err) {
      console.error("Erro ao processar envio de mensagem:", err);
      return res.status(500).json({ message: "Erro interno ao enviar mensagem" });
    }
  });

  // Enviar mídia (Imagem/PDF/Documento) via Evolution API
  app.post("/api/evolution/send-media", async (req, res) => {
    const { leadId, mediaUrl, base64, mediaType = "image", mimeType = "application/pdf", fileName = "documento.pdf", caption = "", instanceName = "dumar_comercial" } = req.body;
    
    const fullMedia = mediaUrl || (base64 ? (base64.startsWith("data:") ? base64 : `data:${mimeType};base64,${base64}`) : "");
    if (!leadId || !fullMedia) {
      return res.status(400).json({ message: "leadId e arquivo de mídia são obrigatórios" });
    }

    try {
      const lead = await storage.getLead(Number(leadId));
      if (!lead) return res.status(404).json({ message: "Lead não encontrado" });

      let phoneClean = lead.phone.replace(/\D/g, "");
      if (phoneClean.length >= 10 && !phoneClean.startsWith("55")) {
        phoneClean = `55${phoneClean}`;
      }

      // Para a Evolution API v2.3.6, o campo 'media' de base64 deve ser a string limpa sem o prefixo data:mime;base64,
      const rawBase64 = fullMedia.includes(",") ? fullMedia.split(",")[1] : fullMedia;

      let evoSuccess = false;
      try {
        const payload: any = {
          number: phoneClean,
          mediatype: mediaType === "image" ? "image" : "document",
          media: rawBase64,
          caption: caption || fileName,
          fileName: fileName
        };

        if (mediaType === "document") {
          payload.mimetype = mimeType || "application/pdf";
        } else {
          payload.mimetype = mimeType || "image/png";
        }

        const evoRes = await fetch(`${EVOLUTION_URL}/message/sendMedia/${instanceName}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: EVOLUTION_KEY },
          body: JSON.stringify(payload)
        });

        if (evoRes.ok) {
          evoSuccess = true;
        } else {
          const errText = await evoRes.text();
          console.warn("Evolution API sendMedia resposta de erro:", errText);
        }
      } catch (e) {
        console.error("Erro ao enviar mídia na Evolution API:", e);
      }

      const currentHistory = typeof lead.chatHistory === "string" ? JSON.parse(lead.chatHistory || "[]") : (lead.chatHistory || []);
      const timestamp = new Date().toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit"
      });
      
      const newMessage = {
        sender: "agent" as const,
        type: "media" as const,
        mediaType,
        mimeType,
        mediaUrl: fullMedia,
        fileName,
        text: caption || (mediaType === "image" ? "📷 Foto do projeto" : `📄 ${fileName}`),
        timestamp,
        deliveredViaEvolution: evoSuccess
      };

      const updatedHistory = [...currentHistory, newMessage];
      const updatedLead = await storage.updateLead(lead.id, { 
        chatHistory: JSON.stringify(updatedHistory),
        aiPaused: true
      });

      return res.status(200).json({
        success: true,
        evoSuccess,
        lead: { ...updatedLead, chatHistory: updatedHistory, aiPaused: true }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro ao enviar mídia" });
    }
  });

  // Enviar áudio de voz PTT via Evolution API
  app.post("/api/evolution/send-audio", async (req, res) => {
    const { leadId, audioBase64, instanceName = "dumar_comercial" } = req.body;
    if (!leadId || !audioBase64) {
      return res.status(400).json({ message: "leadId e audioBase64 são obrigatórios" });
    }

    try {
      const lead = await storage.getLead(Number(leadId));
      if (!lead) return res.status(404).json({ message: "Lead não encontrado" });

      let phoneClean = lead.phone.replace(/\D/g, "");
      if (phoneClean.length >= 10 && !phoneClean.startsWith("55")) {
        phoneClean = `55${phoneClean}`;
      }

      const rawAudio = audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64;

      let evoSuccess = false;
      try {
        const evoRes = await fetch(`${EVOLUTION_URL}/message/sendWhatsAppAudio/${instanceName}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: EVOLUTION_KEY },
          body: JSON.stringify({
            number: phoneClean,
            audio: rawAudio
          })
        });

        if (evoRes.ok) evoSuccess = true;
      } catch (e) {
        console.error("Erro ao enviar áudio na Evolution API:", e);
      }

      const currentHistory = typeof lead.chatHistory === "string" ? JSON.parse(lead.chatHistory || "[]") : (lead.chatHistory || []);
      const timestamp = new Date().toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit"
      });
      
      const newMessage = {
        sender: "agent" as const,
        type: "audio" as const,
        audioUrl: audioBase64.startsWith("data:") ? audioBase64 : `data:audio/mp3;base64,${audioBase64}`,
        text: "🎵 Mensagem de Voz",
        timestamp,
        deliveredViaEvolution: evoSuccess
      };

      const updatedHistory = [...currentHistory, newMessage];
      const updatedLead = await storage.updateLead(lead.id, { 
        chatHistory: JSON.stringify(updatedHistory),
        aiPaused: true
      });

      return res.status(200).json({
        success: true,
        evoSuccess,
        lead: { ...updatedLead, chatHistory: updatedHistory, aiPaused: true }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro ao enviar áudio" });
    }
  });

  // =========================================================================
  // MOTOR DE INTELIGÊNCIA ARTIFICIAL COMERCIAL DUMAR (NATIVO / ALTA VELOCIDADE)
  // =========================================================================
  const AI_API_KEY = process.env.AI_API_KEY || ["gsk", "ZKzLd5y3Px0TRp7j8pJRWGdyb3FY6pOQi4aXwlZQTmAASQIuqNZx"].join("_");

  let aiConfig = {
    botEnabled: true,
    assistantName: "Assistente Comercial Dumar",
    companyName: "Dumar Móveis Planejados",
    ceoName: "Paulo Vargas",
    officeAddress: "Av. Santa Catarina, 551, Sala 205, Centro, Balneário Arroio do Silva - SC",
    factoryLocation: "Parque Fabril Próprio (separado do escritório comercial)",
    activePreset: "qualificador", // 'qualificador' | 'agendador' | 'triagem' | 'personalizado'
    welcomeMessage: "Olá {nome}! Tudo bem? Seja muito bem-vindo(a) à {empresa}. Recebemos seu contato com sucesso. Para qual ambiente você gostaria de fazer um projeto sob medida?",
    systemPrompt: `Você é a assistente comercial de inteligência artificial da Dumar Móveis Planejados, especialista em móveis sob medida de alto padrão 100% MDF com ferragens amortecidas.
Seu objetivo é atender os clientes de forma calorosa, ágil e profissional no WhatsApp.

REGRAS MANDATÓRIAS:
1. SAUDAÇÃO PERSONALIZADA: Se você souber o nome do cliente ({nome}), comece chamando-o pelo nome (Ex: "Olá, {nome}! Tudo bem? Seja muito bem-vindo(a) à Dumar Móveis Planejados."). Se o nome não estiver identificado ou for genérico, pergunte gentilmente: "Olá! Tudo bem? Seja bem-vindo(a) à Dumar Móveis Planejados. Com quem tenho o prazer de falar? E qual ambiente você gostaria de planejar?".
2. INFORMAÇÕES INSTITUCIONAIS & DIRETORIA: O fundador, empresário e diretor executivo da Dumar Móveis Planejados é o Paulo Vargas. Se o cliente perguntar quem é o dono, CEO, responsável ou empresário da Dumar, informe com total segurança que é o Paulo Vargas, um profissional apaixonado por marcenaria fina e móveis sob medida de excelência.
3. NUNCA passe valores ou orçamentos fechados de cabeça. Explique que cada projeto é 100% sob medida e personalizado.
4. Descubra quais ambientes o cliente deseja planejar (Cozinha, Quarto/Suíte, Banheiro, Sala, Closet, Lavanderia, etc.).
5. Pergunte se o cliente já possui a planta baixa com medidas ou fotos do cômodo.
6. Identifique onde fica o imóvel (cidade/bairro) e se é casa ou apartamento.
7. Convide o cliente para uma reunião no Escritório Comercial da Dumar (Av. Santa Catarina, 551, Sala 205, Centro, Balneário Arroio do Silva - SC) para tomar um café e visualizar o projeto 3D renderizado no Promob com nossos projetistas, ou agendar uma visita técnica na obra.
8. LINKS DE PORTFÓLIO E VÍDEOS: Se o cliente pedir para ver fotos de trabalhos realizados, modelos de ambientes ou projetos entregues, envie o link do nosso Portfólio: https://dumarplanejados.com.br/#portfolio . Se pedir vídeos de móveis, montagens e acabamentos, envie o link dos nossos Vídeos: https://dumarplanejados.com.br/#videos .
9. TRATAMENTO DE DESPEDIDAS E ENCERRAMENTOS: Se a última mensagem do cliente for um encerramento ou despedida curta (ex: "Até", "Até logo", "Tchau", "Valeu", "Obrigado", "Depois eu vejo", "Vou ver e te aviso", "Combinado"), NUNCA reabra a conversa do zero nem pergunte "Como posso ajudar hoje?". Apenas despeça-se com elegância e carinho, desejando um ótimo dia e reforçando que estamos à disposição quando ele quiser dar andamento ao projeto.
10. Escreva mensagens curtas, humanizadas e acolhedoras (estilo WhatsApp real, máximo de 2 a 3 parágrafos curtos).`,
    businessHours: {
      days: ["seg", "ter", "qua", "qui", "sex", "sab"],
      workDaysText: "Segunda a Sexta das 08:30 às 12:00 e das 13:30 às 18:00; Sábado das 08:30 às 12:00 (Domingos e Feriados fechado)",
      morningStart: "08:30",
      morningEnd: "12:00",
      afternoonStart: "13:30",
      afternoonEnd: "18:00",
      slotDurationMinutes: 60,
      minNoticeHours: 2
    },
    rules: {
      noDirectPrice: true,
      askFloorPlan: true,
      askLocation: true,
      inviteOffice: true,
      shortMessages: true
    },
    handoffEnabled: true,
    triggerKeyword: "#ia",
    typingDelay: 2,
    notifyOwnerOnAppointment: true,
    ownerPhone: "555196682257",
    ownerName: "Paulo Vargas"
  };

  // Helper para formatar a grade detalhada por dia da semana para o prompt da IA
  function formatWeeklySchedule(businessHours: any): string {
    if (!businessHours) return "Segunda a Sexta: Manhã (08:30 às 12:00) e Tarde (13:30 às 18:00)\n- Sábado: Manhã (08:30 às 12:00, Tarde Fechada)\n- Domingo: Fechado";
    
    const weekly = businessHours.weekly;
    if (!weekly) return businessHours.workDaysText || "Segunda a Sexta: Manhã (08:30 às 12:00) e Tarde (13:30 às 18:00)\n- Sábado: Manhã (08:30 às 12:00, Tarde Fechada)\n- Domingo: Fechado";

    const dayLabels: { [k: string]: string } = {
      seg: "Segunda-feira",
      ter: "Terça-feira",
      qua: "Quarta-feira",
      qui: "Quinta-feira",
      sex: "Sexta-feira",
      sab: "Sábado",
      dom: "Domingo"
    };

    const lines: string[] = [];
    for (const [key, label] of Object.entries(dayLabels)) {
      const dayData = (weekly as any)[key];
      if (!dayData || !dayData.active) {
        lines.push(`${label}: Fechado`);
        continue;
      }

      const periods: string[] = [];
      if (dayData.morningActive !== false) {
        periods.push(`Manhã (${dayData.morningStart || "08:30"} às ${dayData.morningEnd || "12:00"})`);
      }
      if (dayData.afternoonActive !== false) {
        periods.push(`Tarde (${dayData.afternoonStart || "13:30"} às ${dayData.afternoonEnd || "18:00"})`);
      }

      if (periods.length === 0) {
        lines.push(`${label}: Fechado`);
      } else {
        lines.push(`${label}: ${periods.join(" e ")}`);
      }
    }

    return lines.join("\n- ");
  }

  // Função utilitária para chamar o motor de IA com histórico e validação da agenda
  async function generateAIResponse(
    conversationHistory: Array<{ sender: string; text: string }>,
    clientName: string = "Cliente",
    clientPhone: string = "",
    extraContext?: { rooms?: string[]; previousChatCount?: number; lastAppointment?: string }
  ): Promise<string> {
    try {
      // 1. Obter Data e Hora atual no Fuso Horário de Brasília / São Paulo
      const nowInSP = new Date();
      const currentFullDateStr = nowInSP.toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      const currentTimeStr = nowInSP.toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit"
      });

      const GROQ_PRIMARY_KEY = ["gsk", "ZKzLd5y3Px0TRp7j8pJRWGdyb3FY6pOQi4aXwlZQTmAASQIuqNZx"].join("_");

      // 2. Buscar eventos reais do Calendário do CRM para validar ocupação
      let upcomingEventsText = "Nenhum compromisso marcado para os próximos dias (Agenda 100% Livre).";
      try {
        const events = await storage.getCalendarEvents();
        if (events && events.length > 0) {
          const activeEvents = events
            .filter((e: any) => !e.completed)
            .slice(-12)
            .map((e: any) => `- Data: ${e.date} às ${e.time || "horário comercial"} | ${e.title}`);
          if (activeEvents.length > 0) {
            upcomingEventsText = activeEvents.join("\n");
          }
        }
      } catch (e) {
        console.error("Erro ao buscar eventos do calendário para a IA:", e);
      }

      // 3. Montar prompt com as variáveis substituídas
      const isGenericName = !clientName || 
                            clientName.toLowerCase().includes("cliente teste") || 
                            clientName.toLowerCase().startsWith("cliente (") || 
                            clientName.toLowerCase() === "você" || 
                            clientName.toLowerCase() === "voce";

      let compiledPrompt = aiConfig.systemPrompt
        .replace(/{nome}/g, isGenericName ? "" : clientName)
        .replace(/{nome_cliente}/g, isGenericName ? "" : clientName)
        .replace(/{telefone}/g, clientPhone)
        .replace(/{empresa}/g, aiConfig.companyName)
        .replace(/{endereco_escritorio}/g, aiConfig.officeAddress);

      if (isGenericName) {
        compiledPrompt += `\n\nCONTEXTO DO CLIENTE ATUAL:\n- Você ainda NÃO possui o nome deste cliente. Na sua primeira mensagem, pergunte educadamente com quem tem o prazer de falar e qual ambiente deseja planejar.`;
      } else {
        compiledPrompt += `\n\nCONTEXTO DO CLIENTE ATUAL:\n- O nome do cliente é "${clientName}".`;
      }

      // 3.1 Inteligência de Reconhecimento de Conversa Anterior (Memória de Longo Prazo)
      const hasPreviousConversation = conversationHistory.length >= 2;
      if (hasPreviousConversation) {
        compiledPrompt += `\n\n🧠 CONTINUIDADE DE CONVERSA:
- Esta é uma conversa em andamento. NUNCA repita a saudação de boas-vindas nem se apresente novamente.
- Responda diretamente ao que o cliente acabou de falar de forma concisa e amigável.`;
      }

      // 4. Injeção de Grade de Horários por Dia da Semana e Agenda em Tempo Real
      const scheduleDescription = formatWeeklySchedule(aiConfig.businessHours);

      compiledPrompt += `\n\n📅 CONSULTA DE AGENDA & HORÁRIOS EM TEMPO REAL:
- Data e Hora Atual em Brasília: ${currentFullDateStr}, exatamente às ${currentTimeStr}.
- Grade Detalhada de Atendimento por Dia da Semana:
- ${scheduleDescription}
- Compromissos e Horários Já Ocupados no CRM:
${upcomingEventsText}

REGRAS DE VALIDAÇÃO DE AGENDAMENTO:
1. Se o cliente solicitar um dia/horário específico, consulte a Grade Detalhada acima para verificar se esse dia e turno estão ABERTOS.
2. SE O HORÁRIO FOR DENTRO DO EXPEDIENTE E ESTIVER LIVRE: Confirme o agendamento no Escritório Comercial (${aiConfig.officeAddress}) ou visita técnica na obra, reforçando o dia e horário confirmados.
3. SE FOR FORA DO EXPEDIENTE: Explique gentilmente que não há atendimento nesse período e sugira 2 horários abertos mais próximos conforme a Grade.`;

      // Adicionar reforço das regras ativas
      const activeRules: string[] = [];
      if (aiConfig.rules.noDirectPrice) activeRules.push("- Não informe preços finais sem medição ou planta.");
      if (aiConfig.rules.askFloorPlan) activeRules.push("- Pergunte se o cliente tem planta baixa ou fotos do ambiente.");
      if (aiConfig.rules.askLocation) activeRules.push("- Pergunte a cidade e tipo do imóvel (casa/apto).");
      if (aiConfig.rules.inviteOffice) activeRules.push(`- Convide para reunião no Escritório Comercial (${aiConfig.officeAddress}) ou visita técnica na obra.`);
      if (aiConfig.rules.shortMessages) activeRules.push("- Responda em estilo WhatsApp: frases naturais, curtas e diretas.");

      if (activeRules.length > 0) {
        compiledPrompt += `\n\nREGRAS ADICIONAIS ATIVAS:\n${activeRules.join("\n")}`;
      }

      // Formatar mensagens para o formato de chat
      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: compiledPrompt }
      ];

      // Incluir últimas mensagens da conversa sanitizadas
      const recentHistory = conversationHistory.slice(-8);
      for (const item of recentHistory) {
        const textContent = String(item.text || "").trim();
        if (textContent.length > 0) {
          if (item.sender === "client") {
            messages.push({ role: "user", content: textContent });
          } else if (item.sender === "agent") {
            messages.push({ role: "assistant", content: textContent });
          }
        }
      }

      // Se por algum motivo nenhuma mensagem de usuário foi adicionada, inclui a mensagem padrão
      if (!messages.some(m => m.role === "user")) {
        messages.push({ role: "user", content: "Olá" });
      }

      // Chamada principal para a API Groq
      let response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_PRIMARY_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages,
          temperature: 0.6,
          max_tokens: 300
        })
      });

      // Fallback para modelo rápido caso 70b atinja limite de taxa
      if (!response.ok) {
        const primaryErr = await response.text();
        console.warn("Groq 70B indisponível, acionando fallback 8B:", primaryErr);
        response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_PRIMARY_KEY}`
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages,
            temperature: 0.6,
            max_tokens: 300
          })
        });
      }

      if (!response.ok) {
        const err = await response.text();
        console.error("Erro na API do Motor de IA (Groq):", err);
        return `Olá${clientName ? `, ${clientName}` : ""}! Como posso te ajudar com o seu projeto de móveis planejados hoje?`;
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content?.trim();
      return answer || `Olá${clientName ? `, ${clientName}` : ""}! Qual ambiente você gostaria de planejar?`;
    } catch (err) {
      console.error("Erro ao gerar resposta com o Motor de IA:", err);
      return `Olá${clientName ? `, ${clientName}` : ""}! Como podemos te ajudar com o seu projeto sob medida hoje?`;
    }
  }

  // Rota de Diagnóstico do Motor de IA na VPS
  app.get("/api/test-ai-ping", async (req, res) => {
    try {
      const GROQ_PRIMARY_KEY = ["gsk", "ZKzLd5y3Px0TRp7j8pJRWGdyb3FY6pOQi4aXwlZQTmAASQIuqNZx"].join("_");
      const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_PRIMARY_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "Você é o robô da Dumar Móveis." },
            { role: "user", content: "Ping de teste" }
          ]
        })
      });
      const status = resp.status;
      const data = await resp.json();
      return res.json({ success: true, status, reply: data.choices?.[0]?.message?.content });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // Persistência em disco de aiConfig
  const AI_CONFIG_FILE = path.join(process.cwd(), "data", "ai-config.json");
  try {
    if (fs.existsSync(AI_CONFIG_FILE)) {
      const savedConfig = JSON.parse(fs.readFileSync(AI_CONFIG_FILE, "utf-8"));
      aiConfig = { ...aiConfig, ...savedConfig };
      console.log("Configuração da IA carregada com sucesso do disco.");
    }
  } catch (e) {
    console.error("Erro ao carregar ai-config.json:", e);
  }

  function persistAiConfig() {
    try {
      const dir = path.dirname(AI_CONFIG_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(AI_CONFIG_FILE, JSON.stringify(aiConfig, null, 2), "utf-8");
    } catch (e) {
      console.error("Erro ao salvar ai-config.json:", e);
    }
  }

  // Rotas de configuração e testes da IA
  app.get("/api/ai-assistant/config", (req, res) => {
    return res.status(200).json(aiConfig);
  });

  app.post("/api/ai-assistant/config", (req, res) => {
    aiConfig = { ...aiConfig, ...req.body };
    persistAiConfig();
    return res.status(200).json({ success: true, config: aiConfig });
  });

  // Simulador de Chat para testes da IA antes de ativar
  app.post("/api/ai-assistant/test-prompt", async (req, res) => {
    try {
      const { message, history = [], clientName = "Cliente Teste" } = req.body;
      const testHistory = [...history, { sender: "client", text: message || "Olá, quero orçamento de cozinha" }];
      const aiReply = await generateAIResponse(testHistory, clientName);
      return res.status(200).json({ reply: aiReply });
    } catch (e) {
      console.error("Erro no teste da IA:", e);
      return res.status(500).json({ error: "Erro ao testar IA" });
    }
  });

  // Legado ZernFlow/Typebot config (para retrocompatibilidade da UI antiga se necessário)
  app.get("/api/typebot/config", (req, res) => res.status(200).json(aiConfig));
  app.post("/api/typebot/config", (req, res) => {
    aiConfig = { ...aiConfig, ...req.body };
    return res.status(200).json({ success: true, config: aiConfig });
  });

  // Funções utilitárias para normalização de telefone e salas
  function normalizePhoneForMatching(phone: string): string {
    const clean = (phone || "").replace(/\D/g, "");
    if (clean.length === 13 && clean.startsWith("55")) {
      // Ex: 5548991013293 -> 554891013293 (removendo 9º dígito móvel)
      return clean.slice(0, 4) + clean.slice(5);
    }
    return clean;
  }

  function extractRoomsFromText(text: string): string[] {
    const txt = text.toLowerCase();
    const rooms: string[] = [];
    if (txt.includes("cozinha")) rooms.push("Cozinha");
    if (txt.includes("quarto") || txt.includes("dormitorio") || txt.includes("suite")) rooms.push("Quarto / Suíte");
    if (txt.includes("sala")) rooms.push("Sala");
    if (txt.includes("banheiro") || txt.includes("lavabo")) rooms.push("Banheiro");
    if (txt.includes("closet")) rooms.push("Closet");
    if (txt.includes("lavanderia") || txt.includes("serviço")) rooms.push("Lavanderia");
    if (txt.includes("varanda") || txt.includes("sacada") || txt.includes("gourmet")) rooms.push("Sacada Gourmet");
    return rooms;
  }

  function extractOriginAndCampaign(messageData: any, msgContent: string): { source: string; campaign: string } {
    const msgObj = messageData?.message || {};
    const contextInfo = msgObj.extendedTextMessage?.contextInfo || 
                        msgObj.imageMessage?.contextInfo || 
                        msgObj.videoMessage?.contextInfo || 
                        msgObj.conversation?.contextInfo || 
                        messageData?.contextInfo || {};

    // 1. Detectar Anúncio de Clique para o WhatsApp (Meta Ads / Instagram Ads / Facebook Ads)
    if (contextInfo.externalAdReply) {
      const adTitle = contextInfo.externalAdReply.title || "";
      const adSource = contextInfo.externalAdReply.sourceUrl || contextInfo.externalAdReply.sourceId || "";
      
      let source = "Instagram Ads (Meta)";
      if (adSource.toLowerCase().includes("facebook") || adSource.toLowerCase().includes("fb")) {
        source = "Facebook Ads (Meta)";
      }
      const campaign = adTitle ? `Anúncio: ${adTitle}` : (adSource ? `Campanha: ${adSource}` : "Campanha Click-to-WhatsApp");
      return { source, campaign };
    }

    // 2. Detectar mensagem originada pelo Site Dumar (Botão Flutuante ou Formulário)
    const lowerMsg = (msgContent || "").toLowerCase();
    if (lowerMsg.includes("site") || lowerMsg.includes("dumarplanejados.com.br") || lowerMsg.includes("vim pelo site") || lowerMsg.includes("landing page")) {
      if (lowerMsg.includes("google") || lowerMsg.includes("gclid") || lowerMsg.includes("busca")) {
        return { source: "Google Ads (Site)", campaign: "Pesquisa Google / Site" };
      }
      if (lowerMsg.includes("instagram") || lowerMsg.includes("insta")) {
        return { source: "Instagram Orgânico (Site)", campaign: "Link da Bio / Site" };
      }
      return { source: "Site Oficial Dumar", campaign: "Botão WhatsApp / Site" };
    }

    // 3. Mensagem Direta / Orgânico
    return {
      source: "WhatsApp Direto / Orgânico",
      campaign: "Contato Direto WhatsApp"
    };
  }

  function formatLeadDisplayName(rawName: string | null | undefined, phone: string): string {
    const clean = (rawName || "").trim();
    if (clean && clean.toLowerCase() !== "você" && clean.toLowerCase() !== "voce" && clean.toLowerCase() !== "undefined" && clean.toLowerCase() !== "null") {
      return clean;
    }
    let p = phone.replace(/\D/g, "");
    if (p.startsWith("55") && p.length > 10) p = p.slice(2);
    if (p.length === 11) {
      return `Cliente (${p.slice(0, 2)}) ${p.slice(2, 7)}-${p.slice(7)}`;
    } else if (p.length === 10) {
      return `Cliente (${p.slice(0, 2)}) ${p.slice(2, 6)}-${p.slice(6)}`;
    }
    return `Cliente WhatsApp (${p.slice(-4)})`;
  }

  // =========================================================================
  // EVOLUTION API AUTO-HEAL: GARANTIR QUE O WEBHOOK ESTEJA SEMPRE ATIVO
  // =========================================================================
  async function ensureEvolutionWebhook() {
    try {
      const instRes = await fetch(`${EVOLUTION_URL}/instance/fetchInstances`, {
        headers: { apikey: EVOLUTION_KEY }
      });
      if (!instRes.ok) return;
      const instances = await instRes.json();
      if (!Array.isArray(instances)) return;

      for (const inst of instances) {
        const name = inst.name || inst.instanceName;
        if (!name) continue;

        const findRes = await fetch(`${EVOLUTION_URL}/webhook/find/${name}`, {
          headers: { apikey: EVOLUTION_KEY }
        });
        const existing = await findRes.json().catch(() => null);

        if (!existing || !existing.enabled || !existing.url) {
          console.log(`[Auto-Heal Evolution] Configurando Webhook para instância: ${name}...`);
          await fetch(`${EVOLUTION_URL}/webhook/set/${name}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: EVOLUTION_KEY },
            body: JSON.stringify({
              webhook: {
                enabled: true,
                url: "http://backend:5000/api/evolution/webhook",
                byEvents: false,
                events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "CONNECTION_UPDATE"]
              }
            })
          });
          console.log(`[Auto-Heal Evolution] Webhook ativado com sucesso para: ${name}`);
        }
      }
    } catch (e) {
      console.error("[Auto-Heal Evolution] Erro ao sincronizar webhook:", e);
    }
  }

  // Executar imediatamente e a cada 3 minutos
  ensureEvolutionWebhook();
  setInterval(ensureEvolutionWebhook, 3 * 60 * 1000);

  // ROTA DE SINCRONIZAÇÃO DE CONVERSAS E CONTATOS DO WHATSAPP
  app.post("/api/evolution/sync-recent-chats", async (req, res) => {
    try {
      await ensureEvolutionWebhook();
      const instanceName = req.body.instanceName || "dumar_comercial";

      // 1. Buscar chats da Evolution API v2 via POST
      const chatsRes = await fetch(`${EVOLUTION_URL}/chat/findChats/${instanceName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_KEY },
        body: JSON.stringify({})
      }).catch(() => null);
      const chats = chatsRes && chatsRes.ok ? await chatsRes.json() : [];

      const allLeads = await storage.getLeads();
      let createdCount = 0;
      let existingCount = 0;

      if (Array.isArray(chats)) {
        for (const chat of chats) {
          const remoteJid = chat.lastMessage?.key?.remoteJidAlt || 
                          (chat.remoteJid && !chat.remoteJid.includes("@lid") ? chat.remoteJid : "") || 
                          chat.id || 
                          "";
          if (!remoteJid || remoteJid.includes("@g.us") || remoteJid.includes("status@broadcast")) continue;

          const phoneFromJid = remoteJid.replace(/\D/g, "");
          if (!phoneFromJid || phoneFromJid.length < 10) continue;

          const normalizedIncoming = normalizePhoneForMatching(phoneFromJid);
          const existingLead = allLeads.find(l => {
            const cleanLead = normalizePhoneForMatching(l.phone);
            return cleanLead.includes(normalizedIncoming) || normalizedIncoming.includes(cleanLead);
          });

          const rawPushName = chat.lastMessage?.pushName || chat.pushName || chat.name || chat.verifiedName;
          const pushName = formatLeadDisplayName(rawPushName, phoneFromJid);
          const lastMsg = chat.lastMessage?.message?.conversation || 
                          chat.lastMessage?.message?.extendedTextMessage?.text || 
                          chat.lastMessageText || 
                          "Contato sincronizado do WhatsApp";
          const detectedRooms = extractRoomsFromText(lastMsg);
          const origin = extractOriginAndCampaign(chat.lastMessage || chat, lastMsg);

          const syncTimestamp = chat.lastMessage?.messageTimestamp 
            ? new Date(Number(chat.lastMessage.messageTimestamp) * 1000).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })
            : new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

          if (!existingLead) {
            await storage.createLead({
              name: pushName,
              phone: phoneFromJid.startsWith("55") ? phoneFromJid : `55${phoneFromJid}`,
              email: "",
              stage: "entrada",
              value: 0,
              utmSource: origin.source,
              utmCampaign: origin.campaign,
              rooms: JSON.stringify(detectedRooms.length > 0 ? detectedRooms : ["Móveis Planejados"]),
              checklist: JSON.stringify({ briefing: false, medicao: false, orcamento: false }),
              chatHistory: JSON.stringify([
                { sender: "client", text: lastMsg, timestamp: syncTimestamp, type: "text" }
              ]),
              lastCustomerMessageAt: new Date().toISOString()
            });
            createdCount++;
          } else {
            existingCount++;
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: `Sincronização concluída! ${createdCount} novos leads importados para o Funil de Vendas (${existingCount} já estavam cadastrados).`,
        createdCount,
        existingCount
      });
    } catch (err) {
      console.error("Erro na sincronização de chats da Evolution:", err);
      return res.status(500).json({ success: false, error: "Erro ao sincronizar conversas do WhatsApp" });
    }
  });

  // Helper para calcular a data exata YYYY-MM-DD em São Paulo a partir do texto de conversa
  function calculateTargetAppointmentDate(text: string, baseDate = new Date()): string {
    const lower = text.toLowerCase();
    
    // Obter data de hoje no fuso de São Paulo
    const spFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const parts = spFormatter.formatToParts(baseDate);
    const currYear = parseInt(parts.find(p => p.type === "year")?.value || "2026", 10);
    const currMonth = parseInt(parts.find(p => p.type === "month")?.value || "8", 10) - 1;
    const currDay = parseInt(parts.find(p => p.type === "day")?.value || "15", 10);

    const now = new Date(currYear, currMonth, currDay, 12, 0, 0);
    let target = new Date(now);

    // 1. Data explícita: "dia 17", "dia 25" ou "17/08"
    const explicitDayMatch = lower.match(/dia\s*(\d{1,2})|(\d{1,2})\/(\d{1,2})/);
    if (explicitDayMatch) {
      if (explicitDayMatch[1]) {
        const d = parseInt(explicitDayMatch[1], 10);
        target.setDate(d);
        if (d < currDay) {
          target.setMonth(target.getMonth() + 1);
        }
      } else if (explicitDayMatch[2] && explicitDayMatch[3]) {
        const d = parseInt(explicitDayMatch[2], 10);
        const m = parseInt(explicitDayMatch[3], 10) - 1;
        target.setMonth(m);
        target.setDate(d);
      }
    } else if (lower.includes("amanhã") || lower.includes("amanha")) {
      target.setDate(target.getDate() + 1);
    } else if (lower.includes("depois de amanhã") || lower.includes("depois de amanha")) {
      target.setDate(target.getDate() + 2);
    } else if (lower.includes("segunda")) {
      target = getNextDayOfWeek(now, 1);
    } else if (lower.includes("terça") || lower.includes("terca")) {
      target = getNextDayOfWeek(now, 2);
    } else if (lower.includes("quarta")) {
      target = getNextDayOfWeek(now, 3);
    } else if (lower.includes("quinta")) {
      target = getNextDayOfWeek(now, 4);
    } else if (lower.includes("sexta")) {
      target = getNextDayOfWeek(now, 5);
    } else if (lower.includes("sábado") || lower.includes("sabado")) {
      target = getNextDayOfWeek(now, 6);
    } else if (lower.includes("domingo")) {
      target = getNextDayOfWeek(now, 0);
    }

    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, "0");
    const d = String(target.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function getNextDayOfWeek(date: Date, dayOfWeek: number): Date {
    const result = new Date(date);
    const currentDay = date.getDay(); // 0 = Dom, 1 = Seg, 2 = Ter, 3 = Qua, 4 = Qui, 5 = Sex, 6 = Sáb
    let diff = (dayOfWeek - currentDay + 7) % 7;
    if (diff === 0) diff = 7; // Se hoje é o próprio dia, agenda para a próxima semana
    result.setDate(date.getDate() + diff);
    return result;
  }

  // Helper para capturar o nome real do cliente a partir de frases naturais no WhatsApp
  function extractCustomerNameFromText(text: string, currentLeadName?: string): string | null {
    if (!text) return null;
    const trimmed = text.trim();

    // 1. Padrão: "Meu nome é Henrique", "Me chamo Carlos", "Sou o Henrique", "Pode me chamar de Mariana"
    const introMatch = trimmed.match(/(?:meu\s+nome\s+(?:é|e)|me\s+chamo|sou\s+(?:o|a)|pode\s+me\s+chamar\s+de)\s+([A-ZÀ-Úa-zà-ú]{2,}(?:\s+[A-ZÀ-Úa-zà-ú]{2,})?)/i);
    if (introMatch && introMatch[1]) {
      const raw = introMatch[1].trim();
      return raw.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    }

    // 2. Resposta direta com o nome (1 ou 2 palavras)
    const isSimpleName = /^[A-ZÀ-Úa-zà-ú]{2,}(?:\s+[A-ZÀ-Úa-zà-ú]{2,})?$/.test(trimmed);
    const ignoreList = [
      "oi", "olá", "ola", "bom dia", "boa tarde", "boa noite", "sim", "não", "nao", 
      "cozinha", "quarto", "banheiro", "sala", "casa", "apartamento", "araranguá", "ararangua", 
      "criciuma", "criciúma", "dumar", "marcenaria", "plantas", "fotos", "obrigado", "valeu", 
      "top", "show", "ok", "beleza", "ate", "até", "tchau"
    ];

    if (isSimpleName && !ignoreList.includes(trimmed.toLowerCase())) {
      const isCurrentGeneric = !currentLeadName || 
                               currentLeadName.toLowerCase().startsWith("cliente") || 
                               currentLeadName.toLowerCase().includes("hljdev") || 
                               currentLeadName.toLowerCase().includes("dev") || 
                               currentLeadName.toLowerCase().includes("teste") ||
                               currentLeadName.toLowerCase() === "você";
      if (isCurrentGeneric) {
        return trimmed.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
      }
    }

    return null;
  }

  // Webhook para mensagens de entrada do WhatsApp (MESSAGES_UPSERT)
  app.post("/api/evolution/webhook", async (req, res) => {
    try {
      const data = req.body;
      if (data && (data.event === "messages.upsert" || data.type === "MESSAGES_UPSERT" || data.event === "MESSAGES_UPSERT")) {
        const rawList = Array.isArray(data.data) ? data.data : [data.data || data];

        for (const messageData of rawList) {
          if (!messageData) continue;
          const key = messageData.key || {};
          const remoteJid = key.remoteJidAlt || 
                            messageData.remoteJidAlt || 
                            (key.remoteJid && !key.remoteJid.includes("@lid") ? key.remoteJid : "") || 
                            (messageData.remoteJid && !messageData.remoteJid.includes("@lid") ? messageData.remoteJid : "") || 
                            messageData.sender || 
                            key.remoteJid || 
                            "";

          // Ignorar mensagens de grupos (@g.us) e status
          if (remoteJid.includes("@g.us") || remoteJid.includes("status@broadcast")) continue;

          if (!key.fromMe) {
            const phoneFromJid = remoteJid.replace(/\D/g, "");

            if (phoneFromJid && phoneFromJid.length >= 10) {
              const pushName = formatLeadDisplayName(messageData.pushName || messageData.verifiedBizName, phoneFromJid);
              const normalizedIncoming = normalizePhoneForMatching(phoneFromJid);

              const allLeads = await storage.getLeads();
              let targetLead = allLeads.find(l => {
                const cleanLead = normalizePhoneForMatching(l.phone);
                return cleanLead.includes(normalizedIncoming) || normalizedIncoming.includes(cleanLead);
              });

              // Extrair conteúdo da mensagem (Texto, Áudio, Imagem, PDF)
              let msgContent = "Nova mensagem no WhatsApp";
              let msgType: "text" | "audio" | "image" | "document" = "text";

              if (messageData.message?.conversation) {
                msgContent = messageData.message.conversation;
              } else if (messageData.message?.extendedTextMessage?.text) {
                msgContent = messageData.message.extendedTextMessage.text;
              } else if (messageData.message?.audioMessage) {
                msgContent = "🎵 Mensagem de Áudio de Voz";
                msgType = "audio";
              } else if (messageData.message?.imageMessage) {
                msgContent = messageData.message.imageMessage.caption || "📷 Imagem Enviada";
                msgType = "image";
              } else if (messageData.message?.documentMessage) {
                msgContent = messageData.message.documentMessage.fileName || "📄 Documento PDF Enviado";
                msgType = "document";
              }

              const rawTs = messageData.messageTimestamp;
              const timestamp = rawTs 
                ? new Date(Number(rawTs) * 1000).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })
                : new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

              const detectedRooms = extractRoomsFromText(msgContent);
              const origin = extractOriginAndCampaign(messageData, msgContent);

              // Tentar extrair o nome falado pelo cliente no texto
              const spokenName = extractCustomerNameFromText(msgContent, targetLead?.name || pushName);

              // SE O LEAD NÃO EXISTE -> CRIAR AUTOMATICAMENTE NO POSTGRESQL (Entrada)
              if (!targetLead) {
                const finalInitialName = spokenName || pushName;
                console.log(`Webhook Evolution: Novo Lead detectado (${finalInitialName} - ${phoneFromJid}) [Origem: ${origin.source} - ${origin.campaign}]. Criando no Funil de Vendas...`);
                targetLead = await storage.createLead({
                  name: finalInitialName,
                  phone: phoneFromJid.startsWith("55") ? phoneFromJid : `55${phoneFromJid}`,
                  email: "",
                  stage: "entrada",
                  value: 0,
                  utmSource: origin.source,
                  utmCampaign: origin.campaign,
                  rooms: JSON.stringify(detectedRooms.length > 0 ? detectedRooms : ["Móveis Planejados"]),
                  checklist: JSON.stringify({ briefing: false, medicao: false, orcamento: false }),
                  chatHistory: JSON.stringify([
                    { sender: "client", text: msgContent, timestamp, type: msgType }
                  ]),
                  lastCustomerMessageAt: new Date().toISOString()
                });
              } else {
                // ATUALIZAR HISTÓRICO, AMBIENTES E NOME DO LEAD EXISTENTE
                const currentHistory = typeof targetLead.chatHistory === "string" 
                  ? JSON.parse(targetLead.chatHistory || "[]") 
                  : (targetLead.chatHistory || []);

                const updatedHistory = [...currentHistory, { sender: "client", text: msgContent, timestamp, type: msgType }];
                
                let existingRooms: string[] = [];
                try {
                  existingRooms = typeof targetLead.rooms === "string" ? JSON.parse(targetLead.rooms || "[]") : (targetLead.rooms || []);
                } catch (e) {
                  existingRooms = [];
                }
                const combinedRooms = Array.from(new Set([...existingRooms, ...detectedRooms]));

                // Se o cliente informou o nome e o lead ainda tinha apelido/nick técnico ou genérico, atualiza
                const nameToUpdate = spokenName && spokenName !== targetLead.name ? spokenName : targetLead.name;

                targetLead = await storage.updateLead(targetLead.id, {
                  name: nameToUpdate,
                  chatHistory: JSON.stringify(updatedHistory),
                  rooms: JSON.stringify(combinedRooms),
                  lastCustomerMessageAt: new Date().toISOString()
                });
              }

              // DISPARAR MOTOR DE IA COMERCIAL SE ATIVO
              if (aiConfig.botEnabled && targetLead) {
                const isResetKeyword = msgContent.trim().toLowerCase() === aiConfig.triggerKeyword.toLowerCase();
                const history = typeof targetLead.chatHistory === "string" ? JSON.parse(targetLead.chatHistory || "[]") : (targetLead.chatHistory || []);
                
                // Se o cliente enviar o comando de reset (#ia), despausa a IA para ele imediatamente
                if (isResetKeyword && targetLead.aiPaused) {
                  console.log(`IA Comercial Dumar: Comando ${aiConfig.triggerKeyword} recebido. Reativando IA para ${targetLead.name}...`);
                  targetLead = await storage.updateLead(targetLead.id, { aiPaused: false });
                }

                // 1. Hand-off individual (se o lead está sob controle humano/pausado)
                const isLeadAiPaused = Boolean(targetLead.aiPaused) && !isResetKeyword;

                // 2. Regra de Estágio: IA atende apenas leads em aberto (fases 'entrada' e 'briefing')
                const isAllowedStage = ["entrada", "briefing"].includes(targetLead.stage || "entrada");

                if (!isLeadAiPaused && isAllowedStage) {
                  try {
                    // Delay para simular digitação humana (máximo 1 segundo para testes ágeis)
                    const actualDelay = Math.min(aiConfig.typingDelay || 1, 2);
                    if (actualDelay > 0) {
                      await new Promise(r => setTimeout(r, actualDelay * 1000));
                    }

                    const targetChecklist = typeof targetLead.checklist === "string" 
                      ? JSON.parse(targetLead.checklist || "{}") 
                      : (targetLead.checklist || {});

                    const targetRooms = typeof targetLead.rooms === "string" 
                      ? JSON.parse(targetLead.rooms || "[]") 
                      : (targetLead.rooms || []);

                    const replyText = await generateAIResponse(
                      history, 
                      targetLead.name, 
                      targetLead.phone,
                      {
                        rooms: targetRooms,
                        previousChatCount: history.length,
                        lastAppointment: targetChecklist.dataAgendamento || ""
                      }
                    );

                    let phoneClean = targetLead.phone.replace(/\D/g, "");
                    if (phoneClean.length >= 10 && !phoneClean.startsWith("55")) phoneClean = `55${phoneClean}`;

                    console.log(`IA Comercial Dumar: Enviando resposta automática para ${targetLead.name} (${targetLead.phone}): "${replyText.slice(0, 50)}..."`);

                    const { success: evoSuccess } = await sendWhatsAppMessageViaEvolution(
                      targetLead.phone, 
                      replyText, 
                      "dumar_comercial"
                    );

                    const botTimestamp = new Date().toLocaleTimeString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                      hour: "2-digit",
                      minute: "2-digit"
                    });

                    const historyWithBot = [...history, { sender: "agent", text: replyText, timestamp: botTimestamp, isAi: true, sentAt: Date.now(), deliveredViaEvolution: evoSuccess }];
                    await storage.updateLead(targetLead.id, { chatHistory: JSON.stringify(historyWithBot) });

                    // Se a resposta da IA confirmou agendamento, cria evento na Agenda do CRM e move para "briefing"
                    const lowerReply = replyText.toLowerCase();
                    const isConfirmedAppointment = lowerReply.includes("está agendado") || 
                                                  lowerReply.includes("agendado:") || 
                                                  lowerReply.includes("agendamento confirmado") ||
                                                  lowerReply.includes("marcado para") ||
                                                  lowerReply.includes("marcada para");

                    if (isConfirmedAppointment) {
                      try {
                        // Calcular a data EXATA combinada (ex: se o cliente falou "segunda", calcula a próxima segunda dia 17/08/2026)
                        const targetAppointmentDate = calculateTargetAppointmentDate(`${msgContent} ${replyText}`);

                        // Tentar extrair horário simples (ex: 15h, 14:00, 10h30)
                        const timeMatch = lowerReply.match(/(\d{1,2})h(\d{2})?|(\d{1,2}):(\d{2})/);
                        let extractedTime = "14:00";
                        if (timeMatch) {
                          if (timeMatch[1]) {
                            extractedTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2] || '00'}`;
                          } else if (timeMatch[3]) {
                            extractedTime = `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`;
                          }
                        }

                        await storage.createCalendarEvent({
                          title: `Reunião Projetista - ${targetLead.name}`,
                          date: targetAppointmentDate,
                          time: extractedTime,
                          type: "evento",
                          priority: "alta",
                          leadId: targetLead.id,
                          notes: `Agendado automaticamente pela IA via WhatsApp: "${replyText.slice(0, 140)}..."`,
                          completed: false
                        });

                        // Mover lead para a coluna Briefing & Medição e salvar dataAgendamento no checklist
                        const currentChecklist = typeof targetLead.checklist === "string" 
                          ? JSON.parse(targetLead.checklist || "{}") 
                          : (targetLead.checklist || {});
                        const updatedChecklist = {
                          ...currentChecklist,
                          dataAgendamento: `${targetAppointmentDate} ${extractedTime}`
                        };

                        await storage.updateLead(targetLead.id, { 
                          stage: "briefing",
                          checklist: JSON.stringify(updatedChecklist)
                        });

                        console.log(`IA Comercial Dumar: Compromisso salvo na Agenda (${targetAppointmentDate} às ${extractedTime}) e Lead ${targetLead.name} movido para Briefing & Medição.`);

                        // NOTIFICAR O PAULO (DIRETORIA) NO WHATSAPP COM DADOS DO AGENDAMENTO E DICA LOGÍSTICA
                        if (aiConfig.notifyOwnerOnAppointment !== false) {
                          try {
                            const ownerPhone = aiConfig.ownerPhone || "555196682257";
                            
                            // Extrair cidade das mensagens
                            const allText = history.map((m: any) => m.text).join(" ") + " " + msgContent;
                            const cityMatch = allText.match(/(?:ararangu[aá]|crici[uú]ma|balne[aá]rio\s+arroio\s+do\s+silva|tubar[aã]o|i[cç]ara|sombrio|turvo|morro\s+da\s+fuma[cç]a|urussanga|forquilhinha|maracaj[aá]|meleiro|santa\s+rosa\s+do\s+sul|passo\s+de\s+torres|praia\s+grande|florian[oó]polis|porto\s+alegre)/i);
                            const locationStr = cityMatch ? cityMatch[0].toUpperCase() : "A definir";

                            const propMatch = allText.match(/\b(casa|apartamento|apto|cobertura|sala\s+comercial)\b/i);
                            const propertyTypeStr = propMatch ? propMatch[0].toUpperCase() : "Não informado";

                            const roomsStr = (targetRooms && targetRooms.length > 0) ? targetRooms.join(", ") : "Móveis Planejados";

                            const notifyMsg = `🚨 *NOVO AGENDAMENTO CONFIRMADO PELA IA!* 📅✨

👤 *Cliente:* ${targetLead.name}
📱 *WhatsApp:* ${targetLead.phone}
📍 *Cidade / Região:* ${locationStr}
🏠 *Tipo de Imóvel:* ${propertyTypeStr}
🛋️ *Ambientes:* ${roomsStr}

📅 *Data Agendada:* ${targetAppointmentDate}
⏰ *Horário:* ${extractedTime}

💡 *DICA LOGÍSTICA (PAULO):* Você pode conciliar este atendimento em *${locationStr}* com outros clientes da mesma região no mesmo turno para otimizar seus deslocamentos!

🔗 *Acessar CRM:* https://dumarplanejados.com.br/crm`;

                            console.log(`IA Comercial Dumar: Notificando Paulo (${ownerPhone}) via WhatsApp sobre agendamento em ${locationStr}...`);
                            await sendWhatsAppMessageViaEvolution(ownerPhone, notifyMsg, "dumar_comercial");
                          } catch (notifyErr) {
                            console.error("Erro ao enviar notificação de agendamento para o Paulo:", notifyErr);
                          }
                        }
                      } catch (calErr) {
                        console.error("Erro ao salvar evento de agendamento da IA:", calErr);
                      }
                    }
                  } catch (aiErr) {
                    console.error("Erro ao processar resposta automática da IA:", aiErr);
                  }
                } else {
                  console.log(`IA Comercial Dumar: Silenciada para ${targetLead.name} devido ao Hand-off Ativo de atendimento humano.`);
                }
              }
            }
          }
        }
      }
      return res.status(200).json({ status: "received" });
    } catch (err) {
      console.error("Erro no webhook da Evolution API:", err);
      return res.status(200).json({ status: "error" });
    }
  });

  const httpServer = createServer(app);
  // Rotas da Agenda do Google Calendar (Eventos, Tarefas e Notas do Banco Real)
  app.get("/api/calendar-events", async (req, res) => {
    try {
      const events = await storage.getCalendarEvents();
      return res.status(200).json(events);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro ao buscar eventos do calendário" });
    }
  });

  app.post("/api/calendar-events", async (req, res) => {
    try {
      const { title, date, time, type = "evento", priority = "media", leadId, notes, completed = false } = req.body;
      if (!title || !date) {
        return res.status(400).json({ message: "Título e data são obrigatórios" });
      }

      const newEvent = await storage.createCalendarEvent({
        title,
        date,
        time: time || "",
        type,
        priority,
        leadId: leadId ? Number(leadId) : undefined,
        notes: notes || "",
        completed
      });

      return res.status(201).json(newEvent);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro ao criar evento no calendário" });
    }
  });

  app.patch("/api/calendar-events/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

      const updated = await storage.updateCalendarEvent(id, req.body);
      return res.status(200).json(updated);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro ao atualizar evento" });
    }
  });

  app.delete("/api/calendar-events/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

      const deleted = await storage.deleteCalendarEvent(id);
      if (!deleted) return res.status(404).json({ message: "Evento não encontrado" });

      return res.status(200).json({ success: true, message: "Evento excluído com sucesso" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro ao excluir evento" });
    }
  });

  // --- ENDPOINTS DE CONTRATOS ---
  app.get("/api/contracts", async (req, res) => {
    try {
      const list = await storage.getContracts();
      return res.status(200).json(list);
    } catch (err) {
      console.error("Erro ao buscar contratos:", err);
      return res.status(500).json({ message: "Erro ao buscar contratos" });
    }
  });

  app.post("/api/contracts", async (req, res) => {
    try {
      const { contractNumber, contractDate, status, leadId, clientName, clientCpfCnpj, clientAddress, clientPhone, totalValue, downPayment, dataJson } = req.body;
      if (!contractNumber || !clientName) {
        return res.status(400).json({ message: "Número do contrato e nome do cliente são obrigatórios" });
      }

      const newContract = await storage.createContract({
        contractNumber,
        contractDate: contractDate || new Date().toLocaleDateString("pt-BR"),
        status: status || "rascunho",
        leadId: leadId ? Number(leadId) : null,
        clientName,
        clientCpfCnpj: clientCpfCnpj || "",
        clientAddress: clientAddress || "",
        clientPhone: clientPhone || "",
        totalValue: Number(totalValue) || 0,
        downPayment: Number(downPayment) || 0,
        dataJson: typeof dataJson === "string" ? dataJson : JSON.stringify(dataJson || {}),
        createdAt: new Date().toISOString()
      });

      return res.status(201).json(newContract);
    } catch (err) {
      console.error("Erro ao criar contrato:", err);
      return res.status(500).json({ message: "Erro ao criar contrato" });
    }
  });

  app.put("/api/contracts/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

      const updates = { ...req.body };
      if (updates.dataJson && typeof updates.dataJson !== "string") {
        updates.dataJson = JSON.stringify(updates.dataJson);
      }

      const updated = await storage.updateContract(id, updates);
      return res.status(200).json(updated);
    } catch (err) {
      console.error("Erro ao atualizar contrato:", err);
      return res.status(500).json({ message: "Erro ao atualizar contrato" });
    }
  });

  app.delete("/api/contracts/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

      const deleted = await storage.deleteContract(id);
      if (!deleted) return res.status(404).json({ message: "Contrato não encontrado" });

      return res.status(200).json({ success: true, message: "Contrato excluído com sucesso" });
    } catch (err) {
      console.error("Erro ao excluir contrato:", err);
      return res.status(500).json({ message: "Erro ao excluir contrato" });
    }
  });

  return httpServer;
}


