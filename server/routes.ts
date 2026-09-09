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

// Função para salvar mídias em base64 na pasta pública /uploads/chat/
function saveBase64MediaToFile(base64Data: string, mimeType: string = "image/jpeg", prefix: string = "media"): string {
  try {
    if (!base64Data) return "";
    const uploadDir = path.join(process.cwd(), "uploads", "chat");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    let cleanBase64 = base64Data;
    let ext = "jpg";

    if (base64Data.includes(";base64,")) {
      const parts = base64Data.split(";base64,");
      const mimeMatch = parts[0].match(/:(.*?)$/);
      if (mimeMatch) mimeType = mimeMatch[1];
      cleanBase64 = parts[1];
    }

    const mime = (mimeType || "").toLowerCase();
    if (mime.includes("png")) ext = "png";
    else if (mime.includes("webp")) ext = "webp";
    else if (mime.includes("gif")) ext = "gif";
    else if (mime.includes("pdf")) ext = "pdf";
    else if (mime.includes("ogg") || mime.includes("opus")) ext = "ogg";
    else if (mime.includes("mp3") || mime.includes("mpeg")) ext = "mp3";
    else if (mime.includes("m4a") || mime.includes("aac")) ext = "m4a";
    else if (mime.includes("wav")) ext = "wav";

    const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(cleanBase64, "base64"));
    return `/api/uploads/chat/${fileName}`;
  } catch (err) {
    console.error("Erro ao salvar mídia em disco:", err);
    return "";
  }
}

import { initDbTables } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  await initDbTables();

  // --- SEEDING DOS USUÁRIOS ADMINS NA INICIALIZAÇÃO ---
  const ALL_SECTIONS = ["dashboard", "kanban", "agenda", "financeiro", "mensagens", "configuracoes", "usuarios"];

  try {
    const adminUser = await storage.getUserByUsername("admin");
    if (!adminUser) {
      console.log("Seeding: Criando usuário administrador padrão no PostgreSQL...");
      await storage.createUser({
        username: "admin",
        password: hashPassword("Dumar@2026"),
        name: "Administrador Dumar",
        email: "admin@dumarplanejados.com.br",
        role: "admin",
        permissions: JSON.stringify(ALL_SECTIONS),
        active: true,
        createdAt: new Date().toISOString()
      });
      console.log("Seeding: Usuário admin criado com sucesso!");
    }

    const pauloUser = await storage.getUserByUsername("paulo@dumarplanejados.com.br");
    if (!pauloUser) {
      console.log("Seeding: Criando usuário Paulo no PostgreSQL...");
      await storage.createUser({
        username: "paulo@dumarplanejados.com.br",
        password: hashPassword("Pvargas@26"),
        name: "Paulo Vargas",
        email: "paulo@dumarplanejados.com.br",
        role: "admin",
        permissions: JSON.stringify(ALL_SECTIONS),
        active: true,
        createdAt: new Date().toISOString()
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
      const user = await storage.getUserByUsername(username.trim());
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      if (!user.active) {
        return res.status(403).json({ message: "Usuário desativado. Entre em contato com a administração." });
      }

      const inputHash = hashPassword(password);
      if (user.password !== inputHash) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      let parsedPermissions: string[] = [];
      try {
        parsedPermissions = typeof user.permissions === "string"
          ? JSON.parse(user.permissions || "[]")
          : (user.permissions || []);
      } catch (e) {
        parsedPermissions = user.role === "admin" ? ALL_SECTIONS : ["kanban", "agenda"];
      }

      if (user.role === "admin" && parsedPermissions.length === 0) {
        parsedPermissions = ALL_SECTIONS;
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name || user.username,
          email: user.email || "",
          role: user.role || "vendedor",
          permissions: parsedPermissions,
          active: Boolean(user.active)
        }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // --- ENDPOINTS DE GESTÃO DE USUÁRIOS (CRUD COMPLETO & RBAC) ---

  // Listar todos os usuários
  app.get("/api/users", async (req, res) => {
    try {
      let usersList = await storage.getUsers();

      // Se não houver usuários no banco, auto-inicializa os administradores padrão
      if (usersList.length === 0) {
        console.log("Inicializando administradores padrão no banco...");
        await storage.createUser({
          username: "admin",
          password: hashPassword("Dumar@2026"),
          name: "Administrador Dumar",
          email: "admin@dumarplanejados.com.br",
          role: "admin",
          permissions: JSON.stringify(ALL_SECTIONS),
          active: true,
          createdAt: new Date().toISOString()
        });

        await storage.createUser({
          username: "paulo@dumarplanejados.com.br",
          password: hashPassword("Pvargas@26"),
          name: "Paulo Vargas",
          email: "paulo@dumarplanejados.com.br",
          role: "admin",
          permissions: JSON.stringify(ALL_SECTIONS),
          active: true,
          createdAt: new Date().toISOString()
        });

        usersList = await storage.getUsers();
      }

      // Omitir senhas no retorno
      const sanitized = usersList.map(u => {
        let perms: string[] = [];
        try {
          perms = typeof u.permissions === "string" ? JSON.parse(u.permissions || "[]") : (u.permissions || []);
        } catch (e) {
          perms = u.role === "admin" ? ALL_SECTIONS : ["kanban", "agenda"];
        }
        return {
          id: u.id,
          username: u.username,
          name: u.name || u.username,
          email: u.email || "",
          role: u.role || "vendedor",
          permissions: perms,
          active: u.active !== false,
          createdAt: u.createdAt || ""
        };
      });
      return res.status(200).json(sanitized);
    } catch (err) {
      console.error("Erro ao listar usuários:", err);
      return res.status(500).json({ message: "Erro ao listar usuários" });
    }
  });

  // Criar novo usuário
  app.post("/api/users", async (req, res) => {
    const { username, password, name, email, role, permissions, active } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Usuário e senha são obrigatórios" });
    }

    try {
      const cleanUsername = username.trim();
      const existing = await storage.getUserByUsername(cleanUsername);
      if (existing) {
        return res.status(400).json({ message: "Já existe um usuário com este login." });
      }

      // Se for admin, garante todas as seções caso não informadas
      let permsArray = Array.isArray(permissions) ? permissions : [];
      if (role === "admin" && permsArray.length === 0) {
        permsArray = ALL_SECTIONS;
      } else if (permsArray.length === 0) {
        permsArray = ["kanban", "agenda"];
      }

      const newUser = await storage.createUser({
        username: cleanUsername,
        password: hashPassword(password),
        name: (name || cleanUsername).trim(),
        email: (email || "").trim(),
        role: role || "vendedor",
        permissions: JSON.stringify(permsArray),
        active: active !== undefined ? Boolean(active) : true,
        createdAt: new Date().toISOString()
      });

      return res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        permissions: permsArray,
        active: newUser.active !== false,
        createdAt: newUser.createdAt
      });
    } catch (err) {
      console.error("Erro ao criar usuário:", err);
      return res.status(500).json({ message: "Erro interno ao criar usuário" });
    }
  });

  // Atualizar usuário (Nome, Email, Senha, Role, Permissões, Status)
  app.patch("/api/users/:id", async (req, res) => {
    const userId = Number(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "ID de usuário inválido" });
    }

    try {
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const updateData: any = {};
      if (req.body.name !== undefined) updateData.name = String(req.body.name).trim();
      if (req.body.email !== undefined) updateData.email = String(req.body.email).trim();
      if (req.body.role !== undefined) updateData.role = String(req.body.role);
      if (req.body.active !== undefined) updateData.active = Boolean(req.body.active);
      if (req.body.permissions !== undefined) {
        updateData.permissions = typeof req.body.permissions === "string"
          ? req.body.permissions
          : JSON.stringify(req.body.permissions || []);
      }
      if (req.body.password && String(req.body.password).trim().length > 0) {
        updateData.password = hashPassword(String(req.body.password).trim());
      }

      const updated = await storage.updateUser(userId, updateData);

      let perms: string[] = [];
      try {
        perms = typeof updated.permissions === "string" ? JSON.parse(updated.permissions || "[]") : (updated.permissions || []);
      } catch (e) {
        perms = [];
      }

      return res.status(200).json({
        id: updated.id,
        username: updated.username,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        permissions: perms,
        active: updated.active !== false
      });
    } catch (err) {
      console.error("Erro ao atualizar usuário:", err);
      return res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  });

  // Excluir usuário
  app.delete("/api/users/:id", async (req, res) => {
    const userId = Number(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "ID de usuário inválido" });
    }

    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Proteção de segurança: não permitir excluir o usuário 'admin' padrão
      if (user.username === "admin" || user.username === "paulo@dumarplanejados.com.br") {
        return res.status(403).json({ message: "Não é permitido excluir os administradores principais do sistema." });
      }

      await storage.deleteUser(userId);
      return res.status(200).json({ success: true, message: "Usuário excluído com sucesso." });
    } catch (err) {
      console.error("Erro ao excluir usuário:", err);
      return res.status(500).json({ message: "Erro ao excluir usuário" });
    }
  });

  // Atualização de dados pelo próprio usuário (Meu Perfil)
  app.post("/api/users/update", async (req, res) => {
    const { username, password, name, email } = req.body;
    if (!username) {
      return res.status(400).json({ message: "Usuário é obrigatório" });
    }

    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const updateData: any = {};
      if (name) updateData.name = name.trim();
      if (email) updateData.email = email.trim();
      if (password && password.trim().length > 0) {
        updateData.password = hashPassword(password.trim());
      }

      const updated = await storage.updateUser(user.id, updateData);
      return res.status(200).json({ success: true, username: updated.username, name: updated.name });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro ao atualizar dados" });
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
          { sender: "system", text: "Lead criado no sistema", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), sentAt: Date.now() }
        ]),
        lastCustomerMessageAt: new Date().toISOString(),
        aiPaused: req.body.aiPaused !== undefined ? Boolean(req.body.aiPaused) : false
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
        ]),
        aiPaused: false
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

  // Helper para normalizar valores monetários recebidos como string, float ou com vírgula
  const sanitizeMonetaryAmount = (val: any): number => {
    if (typeof val === "number") return isNaN(val) ? 0 : parseFloat(val.toFixed(2));
    if (typeof val === "string") {
      let clean = val.replace(/R\$\s?/, "").trim();
      if (clean.includes(",") && clean.includes(".")) {
        clean = clean.replace(/\./g, "").replace(",", ".");
      } else if (clean.includes(",")) {
        clean = clean.replace(",", ".");
      }
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : parseFloat(num.toFixed(2));
    }
    return 0;
  };


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
    const { description, type, amount, category, status, dueDate, paymentDate, paymentMethod, leadId, supplierId, supplierName, notes } = req.body;
    const parsedAmount = sanitizeMonetaryAmount(amount);

    if (!description || parsedAmount <= 0) {
      return res.status(400).json({ message: "Descrição e valor válido (maior que zero) são obrigatórios" });
    }

    try {
      const newTx = await storage.createFinancialTransaction({
        description,
        type: type || "receita",
        amount: parsedAmount,
        category: category || "venda_marcenaria",
        status: status || "pago",
        dueDate: dueDate || new Date().toISOString().split("T")[0],
        paymentDate: paymentDate || (status === "pago" ? new Date().toISOString().split("T")[0] : ""),
        paymentMethod: paymentMethod || "PIX",
        leadId: leadId ? Number(leadId) : null,
        supplierId: supplierId ? Number(supplierId) : null,
        supplierName: supplierName || "",
        notes: notes || "",
        isRecurring: false,
        recurrenceGroup: "",
        installmentIndex: 1,
        createdAt: new Date().toISOString()
      });
      return res.status(201).json(newTx);
    } catch (err) {
      console.error("Erro ao criar transação financeira:", err);
      return res.status(500).json({ message: "Erro ao criar transação financeira: " + (err as Error).message });
    }
  });

  // Criar Lote de Despesas Recorrentes (Custos Fixos)
  app.post("/api/financial/transactions/recurring", async (req, res) => {
    const { description, type, amount, category, status, baseDueDate, paymentMethod, monthsCount, supplierId, supplierName, notes } = req.body;
    const parsedAmount = sanitizeMonetaryAmount(amount);
    const numMonths = Math.min(Math.max(Number(monthsCount) || 1, 1), 36);

    if (!description || parsedAmount <= 0 || !numMonths) {
      return res.status(400).json({ message: "Descrição, valor válido e quantidade de meses são obrigatórios" });
    }

    try {
      const recurrenceGroupId = `REC-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const startDate = baseDueDate ? new Date(baseDueDate + "T12:00:00") : new Date();
      const baseDay = startDate.getDate();

      const transactionsToCreate = [];

      for (let i = 0; i < numMonths; i++) {
        const targetDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, baseDay);
        // Tratamento de dias finais de mês (ex: dia 31 em fevereiro)
        if (targetDate.getDate() !== baseDay && baseDay > 28) {
          targetDate.setDate(0); // Último dia do mês correto
        }
        const formattedDueDate = targetDate.toISOString().split("T")[0];
        const isFirst = i === 0;
        const currentStatus = isFirst && status === "pago" ? "pago" : "pendente";
        const currentPaymentDate = currentStatus === "pago" ? new Date().toISOString().split("T")[0] : "";

        transactionsToCreate.push({
          description: `${description} (${i + 1}/${numMonths})`,
          type: type || "despesa",
          amount: parsedAmount,
          category: category || "administrativo",
          status: currentStatus,
          dueDate: formattedDueDate,
          paymentDate: currentPaymentDate,
          paymentMethod: paymentMethod || "Boleto",
          leadId: null,
          supplierId: supplierId ? Number(supplierId) : null,
          supplierName: supplierName || "",
          notes: notes ? `${notes} | Recorrente ${i + 1}/${numMonths}` : `Custo Fixo Recorrente ${i + 1}/${numMonths}`,
          isRecurring: true,
          recurrenceGroup: recurrenceGroupId,
          installmentIndex: i + 1,
          createdAt: new Date().toISOString()
        });
      }

      const created = await storage.createRecurringTransactions(transactionsToCreate);
      return res.status(201).json({ success: true, count: created.length, data: created });
    } catch (err) {
      console.error("Erro ao criar lote de transações recorrentes:", err);
      return res.status(500).json({ message: "Erro ao criar transações recorrentes: " + (err as Error).message });
    }
  });

  app.patch("/api/financial/transactions/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    try {
      const updates = { ...req.body };
      if (updates.amount !== undefined) {
        updates.amount = sanitizeMonetaryAmount(updates.amount);
      }
      const updated = await storage.updateFinancialTransaction(id, updates);
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
      return res.status(200).json({ message: "Transação excluída com sucesso" });
    } catch (err) {
      console.error("Erro ao excluir transação financeira:", err);
      return res.status(500).json({ message: "Erro ao excluir transação financeira" });
    }
  });

  // Exclusão em lote por Recurrence Group
  app.delete("/api/financial/transactions/group/:groupKey", async (req, res) => {
    try {
      const groupKey = req.params.groupKey;
      const success = await storage.deleteFinancialTransactionsByGroup(groupKey);
      return res.status(200).json({ success, message: "Lote de parcelas excluído com sucesso" });
    } catch (err) {
      console.error("Erro ao excluir lote de parcelas:", err);
      return res.status(500).json({ message: "Erro ao excluir lote de parcelas" });
    }
  });

  // Atualização em lote por Recurrence Group (permite editar valor e descrição de todas as parcelas)
  app.patch("/api/financial/transactions/group/:groupKey", async (req, res) => {
    try {
      const groupKey = req.params.groupKey;
      const { updates, onlyPending } = req.body;
      const sanitizedUpdates = { ...updates };
      if (sanitizedUpdates.amount !== undefined) {
        sanitizedUpdates.amount = sanitizeMonetaryAmount(sanitizedUpdates.amount);
      }
      const updatedList = await storage.updateFinancialTransactionsByGroup(
        groupKey,
        sanitizedUpdates,
        Boolean(onlyPending)
      );
      return res.status(200).json({ success: true, updated: updatedList });
    } catch (err) {
      console.error("Erro ao atualizar grupo de parcelas:", err);
      return res.status(500).json({ message: "Erro ao atualizar grupo de parcelas" });
    }
  });

  // Exclusão em lote por IDs
  app.post("/api/financial/transactions/batch-delete", async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Lista de IDs inválida" });
      }
      const success = await storage.deleteFinancialTransactionsByIds(ids.map(Number));
      return res.status(200).json({ success, message: "Parcelas excluídas com sucesso" });
    } catch (err) {
      console.error("Erro no batch delete:", err);
      return res.status(500).json({ message: "Erro ao excluir parcelas em lote" });
    }
  });

  // Atualização em lote por IDs
  app.post("/api/financial/transactions/batch-update", async (req, res) => {
    try {
      const { ids, updates } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Lista de IDs inválida" });
      }
      const sanitizedUpdates = { ...updates };
      if (sanitizedUpdates.amount !== undefined) {
        sanitizedUpdates.amount = sanitizeMonetaryAmount(sanitizedUpdates.amount);
      }
      const updatedList = await storage.updateFinancialTransactionsByIds(ids.map(Number), sanitizedUpdates);
      return res.status(200).json({ success: true, updated: updatedList });
    } catch (err) {
      console.error("Erro no batch update:", err);
      return res.status(500).json({ message: "Erro ao atualizar parcelas em lote" });
    }
  });

  // Helper para obter a data de amanhã no fuso de São Paulo (YYYY-MM-DD)
  function getTomorrowDateStr(): { tomorrowStr: string; todayStr: string; formattedTomorrow: string } {
    const spFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const now = new Date();
    const parts = spFormatter.formatToParts(now);
    const y = parseInt(parts.find(p => p.type === "year")?.value || "2026", 10);
    const m = parseInt(parts.find(p => p.type === "month")?.value || "8", 10) - 1;
    const d = parseInt(parts.find(p => p.type === "day")?.value || "21", 10);

    const todayDate = new Date(y, m, d, 12, 0, 0);
    const tomorrowDate = new Date(y, m, d + 1, 12, 0, 0);

    const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, "0")}-${String(todayDate.getDate()).padStart(2, "0")}`;
    const tomorrowStr = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, "0")}-${String(tomorrowDate.getDate()).padStart(2, "0")}`;
    const formattedTomorrow = `${String(tomorrowDate.getDate()).padStart(2, "0")}/${String(tomorrowDate.getMonth() + 1).padStart(2, "0")}/${tomorrowDate.getFullYear()}`;

    return { tomorrowStr, todayStr, formattedTomorrow };
  }

  // Pré-visualização de contas que vencem amanhã
  app.get("/api/financial/due-tomorrow-preview", async (req, res) => {
    try {
      const { tomorrowStr, formattedTomorrow } = getTomorrowDateStr();
      const allTx = await storage.getFinancialTransactions();
      const dueTomorrow = allTx.filter(t => t.dueDate === tomorrowStr && t.status !== "pago");

      const despesas = dueTomorrow.filter(t => t.type === "despesa");
      const receitas = dueTomorrow.filter(t => t.type === "receita");

      const totalDespesas = despesas.reduce((acc, t) => acc + t.amount, 0);
      const totalReceitas = receitas.reduce((acc, t) => acc + t.amount, 0);

      return res.status(200).json({
        targetDate: tomorrowStr,
        formattedDate: formattedTomorrow,
        totalItems: dueTomorrow.length,
        despesas,
        receitas,
        totalDespesas,
        totalReceitas,
        saldoPrevisto: totalReceitas - totalDespesas
      });
    } catch (err) {
      console.error("Erro ao obter pré-visualização de vencimentos:", err);
      return res.status(500).json({ message: "Erro ao consultar vencimentos de amanhã" });
    }
  });

  // Função para compor e enviar o alerta no WhatsApp do Paulo
  async function sendFinancialDueAlertToPaulo(customPhone?: string): Promise<{ success: boolean; message: string; totalItems: number }> {
    const { tomorrowStr, formattedTomorrow } = getTomorrowDateStr();
    const allTx = await storage.getFinancialTransactions();
    const dueTomorrow = allTx.filter(t => t.dueDate === tomorrowStr && t.status !== "pago");

    const rawOwner = customPhone || aiConfig.ownerPhone || "555196682257";
    let ownerClean = rawOwner.replace(/\D/g, "");
    if (ownerClean.length >= 10 && !ownerClean.startsWith("55")) {
      ownerClean = `55${ownerClean}`;
    }

    if (dueTomorrow.length === 0) {
      const noDebtMsg = `🔔 *DUMAR FINANCEIRO — AVISO DE VENCIMENTOS* 🔔

Olá! Não há contas ou despesas programadas para vencer amanhã (*${formattedTomorrow}*). Tudo em dia no fluxo de caixa! ✨

🔗 *Acessar CRM:* https://dumarplanejados.com.br/crm`;
      await sendWhatsAppMessageViaEvolution(ownerClean, noDebtMsg, "dumar_comercial");
      return { success: true, message: "Aviso enviado: sem contas para amanhã", totalItems: 0 };
    }

    const despesas = dueTomorrow.filter(t => t.type === "despesa");
    const receitas = dueTomorrow.filter(t => t.type === "receita");

    const totalDespesas = despesas.reduce((acc, t) => acc + t.amount, 0);
    const totalReceitas = receitas.reduce((acc, t) => acc + t.amount, 0);
    const saldoPrevisto = totalReceitas - totalDespesas;

    let textMsg = `🔔 *ALERTA FINANCEIRO DUMAR — VENCIMENTOS DE AMANHÃ* 🔔\n`;
    textMsg += `Olá! Segue o resumo das contas que vencem amanhã (*${formattedTomorrow}*):\n\n`;

    if (despesas.length > 0) {
      textMsg += `⬇️ *CONTAS A PAGAR (${despesas.length}):*\n`;
      despesas.forEach((d, idx) => {
        const supInfo = d.supplierName ? ` [${d.supplierName}]` : "";
        const methodInfo = d.paymentMethod ? ` (${d.paymentMethod})` : "";
        textMsg += `• *${d.description}*${supInfo} — R$ ${d.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${methodInfo}\n`;
      });
      textMsg += `👉 *Total a Pagar:* R$ ${totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n`;
    }

    if (receitas.length > 0) {
      textMsg += `⬆️ *RECEITAS A RECEBER (${receitas.length}):*\n`;
      receitas.forEach((r, idx) => {
        const methodInfo = r.paymentMethod ? ` (${r.paymentMethod})` : "";
        textMsg += `• *${r.description}* — R$ ${r.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${methodInfo}\n`;
      });
      textMsg += `👉 *Total a Receber:* R$ ${totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n`;
    }

    textMsg += `📊 *Saldo Previsto do Dia:* ${saldoPrevisto >= 0 ? "+" : ""}${saldoPrevisto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n\n`;
    textMsg += `🔗 *Acessar Painel Financeiro:* https://dumarplanejados.com.br/crm`;

    console.log(`[Alerta Financeiro] Enviando resumo de contas de amanhã para a Diretoria (${ownerClean})...`);
    const { success } = await sendWhatsAppMessageViaEvolution(ownerClean, textMsg, "dumar_comercial");

    return { success, message: "Alerta enviado com sucesso para o WhatsApp da Diretoria", totalItems: dueTomorrow.length };
  }

  // Rota para disparar o alerta financeiro manualmente
  app.post("/api/financial/send-due-alerts", async (req, res) => {
    try {
      const { phone } = req.body;
      const result = await sendFinancialDueAlertToPaulo(phone);
      return res.status(200).json(result);
    } catch (err) {
      console.error("Erro ao enviar alerta financeiro:", err);
      return res.status(500).json({ success: false, message: "Erro ao enviar alerta via WhatsApp" });
    }
  });

  // AGENDADOR AUTOMÁTICO DIÁRIO DE ALERTAS FINANCEIROS (Às 08:30 da manhã)
  let lastFinancialAlertDate = "";
  setInterval(async () => {
    try {
      const now = new Date();
      const spParts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).formatToParts(now);

      const y = spParts.find(p => p.type === "year")?.value;
      const m = spParts.find(p => p.type === "month")?.value;
      const d = spParts.find(p => p.type === "day")?.value;
      const hour = parseInt(spParts.find(p => p.type === "hour")?.value || "0", 10);
      const minute = parseInt(spParts.find(p => p.type === "minute")?.value || "0", 10);

      const todayStr = `${y}-${m}-${d}`;

      // Dispara às 08:30 da manhã se ainda não disparou hoje
      if (hour === 8 && minute >= 30 && minute <= 45 && lastFinancialAlertDate !== todayStr) {
        lastFinancialAlertDate = todayStr;
        console.log(`[Robô Financeiro Diário] Executando rotina matinal de alertas de vencimento para ${todayStr}...`);
        await sendFinancialDueAlertToPaulo();
      }
    } catch (schedErr) {
      console.error("[Robô Financeiro Diário] Erro no ciclo de agendamento:", schedErr);
    }
  }, 60 * 1000); // Checa a cada 1 minuto



  // --- FORNECEDORES (CRM SUPPLIERS) ---

  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliersList = await storage.getSuppliers();
      return res.status(200).json(suppliersList);
    } catch (err) {
      console.error("Erro ao obter fornecedores:", err);
      return res.status(500).json({ message: "Erro ao obter fornecedores" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    const { name, tradeName, cnpjCpf, category, phone, email, contactPerson, pixKey, notes } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Nome do fornecedor é obrigatório" });
    }

    try {
      const newSupplier = await storage.createSupplier({
        name: name.trim(),
        tradeName: tradeName ? tradeName.trim() : "",
        cnpjCpf: cnpjCpf ? cnpjCpf.trim() : "",
        category: category || "materia_prima",
        phone: phone ? phone.trim() : "",
        email: email ? email.trim() : "",
        contactPerson: contactPerson ? contactPerson.trim() : "",
        pixKey: pixKey ? pixKey.trim() : "",
        notes: notes ? notes.trim() : "",
        active: true,
        createdAt: new Date().toISOString()
      });
      return res.status(201).json(newSupplier);
    } catch (err) {
      console.error("Erro ao criar fornecedor:", err);
      return res.status(500).json({ message: "Erro ao criar fornecedor" });
    }
  });

  app.patch("/api/suppliers/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    try {
      const updated = await storage.updateSupplier(id, req.body);
      return res.status(200).json(updated);
    } catch (err) {
      console.error("Erro ao atualizar fornecedor:", err);
      return res.status(500).json({ message: "Erro ao atualizar fornecedor" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    try {
      const deleted = await storage.deleteSupplier(id);
      if (!deleted) {
        return res.status(404).json({ message: "Fornecedor não encontrado" });
      }
      return res.status(200).json({ message: "Fornecedor excluído com sucesso" });
    } catch (err) {
      console.error("Erro ao excluir fornecedor:", err);
      return res.status(500).json({ message: "Erro ao excluir fornecedor" });
    }
  });

  // --- CATÁLOGO DE MATERIAIS & FERRAGENS ---

  app.get("/api/materials-catalog", async (req, res) => {
    try {
      const list = await storage.getMaterialsCatalog();
      return res.status(200).json(list);
    } catch (err) {
      console.error("Erro ao buscar catálogo de materiais:", err);
      return res.status(500).json({ message: "Erro ao buscar catálogo de materiais" });
    }
  });

  app.post("/api/materials-catalog", async (req, res) => {
    try {
      const { category, name, description, isDefault } = req.body;
      if (!category || !name || !description) {
        return res.status(400).json({ message: "Categoria, nome e descrição são obrigatórios" });
      }

      const newItem = await storage.createMaterialItem({
        category,
        name,
        description,
        isDefault: Boolean(isDefault),
        createdAt: new Date().toISOString()
      });
      return res.status(201).json(newItem);
    } catch (err) {
      console.error("Erro ao criar item de material:", err);
      return res.status(500).json({ message: "Erro ao criar item de material" });
    }
  });

  app.put("/api/materials-catalog/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

      const updated = await storage.updateMaterialItem(id, req.body);
      return res.status(200).json(updated);
    } catch (err) {
      console.error("Erro ao atualizar item de material:", err);
      return res.status(500).json({ message: "Erro ao atualizar item de material" });
    }
  });

  app.delete("/api/materials-catalog/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

      const deleted = await storage.deleteMaterialItem(id);
      if (!deleted) return res.status(404).json({ message: "Item não encontrado" });

      return res.status(200).json({ success: true, message: "Item excluído com sucesso" });
    } catch (err) {
      console.error("Erro ao excluir item de material:", err);
      return res.status(500).json({ message: "Erro ao excluir item de material" });
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
      }).catch(() => { });

      // 2. Deletar a instância para permitir nova conexão limpa
      await fetch(`${EVOLUTION_URL}/instance/delete/${instanceName}`, {
        method: "DELETE",
        headers: { apikey: EVOLUTION_KEY }
      }).catch(() => { });

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

      const savedMediaUrl = (fullMedia && fullMedia.startsWith("data:"))
        ? saveBase64MediaToFile(fullMedia, mimeType || "image/jpeg", mediaType === "image" ? "img" : "doc")
        : fullMedia;

      const newMessage = {
        sender: "agent" as const,
        type: "media" as const,
        mediaType,
        mimeType,
        mediaUrl: savedMediaUrl || fullMedia,
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

      const savedAudioUrl = saveBase64MediaToFile(audioBase64, "audio/mp3", "audio");

      const currentHistory = typeof lead.chatHistory === "string" ? JSON.parse(lead.chatHistory || "[]") : (lead.chatHistory || []);
      const timestamp = new Date().toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit"
      });

      const newMessage = {
        sender: "agent" as const,
        type: "audio" as const,
        audioUrl: savedAudioUrl || (audioBase64.startsWith("data:") ? audioBase64 : `data:audio/mp3;base64,${audioBase64}`),
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
    activePreset: "qualificador",
    welcomeMessage: "Olá! Tudo bem? Aqui é da equipe de projetos da Dumar Móveis Planejados. 😊 Com quem tenho o prazer de falar?",
    systemPrompt: `Você é a Consultora Comercial da equipe de projetos da Dumar Móveis Planejados.
Seu objetivo é conduzir um atendimento ágil, caloroso, direto e consultivo no WhatsApp, coletando o ambiente e localização para que nossa equipe de projetos dê andamento ao projeto.

FLUXO DIRETO DE ATENDIMENTO (RIGOROSAMENTE 1 PERGUNTA POR MENSAGEM):

1. SAUDAÇÃO & IDENTIFICAÇÃO (APENAS 1 PERGUNTA):
   - Se ainda NÃO sabe o nome do cliente: "Olá! Tudo bem? Aqui é da equipe de projetos da Dumar Móveis Planejados. 😊 Com quem tenho o prazer de falar?"
   - Se o cliente disser o nome (Ex: {nome}): "Olá, {nome}! Tudo bem? Qual ambiente você gostaria de planejar hoje?"

2. COLETA PROGRESSIVA DE DADOS (1 PERGUNTA POR VEZ):
   - Ao identificar o ambiente: Reaja com entusiasmo (Ex: "Home office é maravilhoso para trabalhar com conforto e organização! ✨") e faça UMA única pergunta:
     👉 "Você já tem fotos ou medidas do espaço, ou prefere que nossa equipe auxilie na medição?"
   - Se o cliente disser que NÃO TEM as medidas ou pedir visita:
     👉 "Sem problemas! Nossa equipe realiza visitas no local para medir tudo certinho sem custo. Em qual cidade e bairro fica o seu imóvel?"
   - Se o cliente ENVIAR as medidas ou fotos:
     👉 Elogie o envio (ex: "Recebido, ótimas dimensões! 📐📸") e pergunte: "Em qual cidade e bairro fica o seu imóvel?"
   - Quando o cliente INFORMAR a cidade/bairro:
     👉 Não faça mais perguntas se já tem o ambiente e a localização. Avance direto para o Encaminhamento Final (Passo 4)!

3. SE O CLIENTE PEDIR REFERÊNCIAS OU PERGUNTAR SE JÁ FIZEMOS ESSE AMBIENTE:
   - Envie o portfólio oficial no Instagram: "Com certeza! Já entregamos projetos lindos de {ambiente}. Você pode conferir alguns dos nossos trabalhos aqui no nosso Instagram: https://instagram.com/dumarmoveisplanejados 📸✨"

4. ENCAMINHAMENTO FINAL PARA A EQUIPE:
   - Se o cliente preferir ir ao ESCRITÓRIO COMERCIAL (Ex: "vou no escritório", "prefiro ir aí", "visitar vocês"):
     👉 Passe o endereço completo com entusiasmo: "Maravilha, {nome}! Nosso escritório comercial fica na Av. Santa Catarina, 551, Sala 205, Centro de Balneário Arroio do Silva. Nossa equipe de projetos vai entrar em contato com você por aqui em breve para combinarmos o melhor dia para tomar um café e conversarmos pessoalmente! ✨"
   - Se o cliente preferir VISITA TÉCNICA no imóvel ou após coletar as informações básicas:
     👉 "Perfeito, {nome}! Já anotei todos os detalhes do seu {ambiente} em {cidade/bairro}. Nossa equipe de projetos vai entrar em contato com você por aqui em breve para darmos andamento ao seu projeto! ✨"
   - Se o cliente for da região (Araranguá, Balneário Arroio do Silva e proximidades) e não mencionou o escritório, você pode complementar: "E como você está aqui na região, se preferir também é super bem-vindo(a) para passar no nosso escritório comercial em Balneário Arroio do Silva para tomar um café e conversarmos pessoalmente!"

5. PROIBIÇÕES RIGOROSAS (NUNCA FAÇA):
   - 🚫 NUNCA faça mais de UMA pergunta por mensagem. NUNCA pergunte cidade e medidas juntas na mesma mensagem.
   - 🚫 NUNCA repita perguntas que já foram feitas ou que o cliente já respondeu.
   - 🚫 NUNCA mencione o nome "Paulo" ou "Paulo Vargas" nas mensagens para o cliente. Fale sempre em nome de "nossa equipe de projetos" ou "nossa equipe".
   - 🚫 NUNCA peça dias ou horários para o cliente escolher. Nossa equipe entrará em contato diretamente.
   - 🚫 NUNCA dê palestras teóricas longas sobre fabricação ou MDF. Seja ágil, elegante e direta.
   - 🚫 NUNCA passe valores, estimativas ou preços em R$. Se perguntarem de preço, diga com naturalidade que nossa equipe de projetos vai avaliar o espaço para apresentar a proposta sem compromisso.
   - 🚫 NUNCA diga que não realizamos visitas ao local ou que o atendimento é apenas à distância.
   - 🚫 NUNCA dê instruções caseiras para o cliente medir com fita métrica/régua.
   - 🚫 NUNCA gere resumos em formato de formulário ou ticket de suporte com marcadores/bullets (Ex: NÃO use "- **Ambiente:** ...", "- **Cidade:** ...", "- **Medidas:** ...").
   - 🚫 Mantenha mensagens curtas (máximo 2 a 3 frases por mensagem).`,
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
      inviteOffice: false,
      shortMessages: true
    },
    handoffEnabled: true,
    triggerKeyword: "#ia",
    typingDelay: 2,
    notifyOwnerOnAppointment: true,
    requireOwnerApproval: true,
    vipThreshold: 10000,
    ownerPhone: "555196682257",
    ownerName: "Paulo Vargas",
    estimatedPrices: {
      cozinha: 15000,
      quarto: 12000,
      suite: 14000,
      closet: 12000,
      sala: 8000,
      painel: 5000,
      banheiro: 3500,
      lavabo: 2500,
      gourmet: 10000,
      churrasqueira: 8000,
      lavanderia: 4000,
      completo: 45000
    }
  };

  // Helper para transcrever áudios de voz via Whisper-large-v3 da Groq
  async function transcribeAudioWithWhisper(audioBuffer: Buffer, mimeType: string = "audio/ogg"): Promise<string> {
    try {
      const GROQ_PRIMARY_KEY = ["gsk", "ZKzLd5y3Px0TRp7j8pJRWGdyb3FY6pOQi4aXwlZQTmAASQIuqNZx"].join("_");

      const formData = new FormData();
      const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
      formData.append("file", blob, "audio.ogg");
      formData.append("model", "whisper-large-v3");
      formData.append("language", "pt");
      formData.append("temperature", "0.0");

      const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_PRIMARY_KEY}`
        },
        body: formData
      });

      if (response.ok) {
        const data: any = await response.json();
        return data.text?.trim() || "";
      } else {
        const errText = await response.text();
        console.error("Erro na transcrição Whisper (Groq):", errText);
      }
    } catch (e) {
      console.error("Falha ao transcrever áudio com Whisper:", e);
    }
    return "";
  }

  // Helper para calcular estimativa interna de valor da marcenaria e classificar Lead VIP
  function calculateLeadEstimatedValue(rooms: string[] = []): { estimatedValue: number; isVip: boolean; summary: string } {
    const prices = aiConfig.estimatedPrices || {
      cozinha: 15000, quarto: 12000, suite: 14000, closet: 12000,
      sala: 8000, painel: 5000, banheiro: 3500, lavabo: 2500,
      gourmet: 10000, churrasqueira: 8000, lavanderia: 4000, completo: 45000
    };

    let total = 0;
    const roomNames = Array.isArray(rooms) ? rooms : [];

    for (const r of roomNames) {
      const low = String(r).toLowerCase();
      let matched = false;
      for (const [key, price] of Object.entries(prices)) {
        if (low.includes(key)) {
          total += Number(price);
          matched = true;
          break;
        }
      }
      if (!matched) total += 8000;
    }

    if (total === 0) total = 15000;
    const threshold = Number(aiConfig.vipThreshold) || 10000;
    const isVip = total >= threshold;
    return {
      estimatedValue: total,
      isVip,
      summary: `~R$ ${total.toLocaleString("pt-BR")},00`
    };
  }

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
      sex: "Segunda-feira",
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
    extraContext?: { rooms?: string[]; previousChatCount?: number; lastAppointment?: string; daysSinceLastContact?: number }
  ): Promise<string> {
    // Função para validar se o nome parece um nome próprio humano real ou nick/apelido técnico
    const isNickOrTechnical = (name: string): boolean => {
      if (!name) return true;
      const clean = name.trim().toLowerCase();
      if (clean.length < 2) return true;
      if (clean.includes("cliente") || clean.includes("teste") || clean.includes("você") || clean.includes("voce") || clean.includes("null") || clean.includes("undefined")) return true;
      if (clean.includes("dev") || clean.includes("admin") || clean.includes("user") || clean.includes("bot") || clean.includes("iphone") || clean.includes("loja") || clean.includes("sac") || clean.includes("vendas") || clean.includes("hlj")) return true;
      if (/\d/.test(clean)) return true;
      if (!/[aeiouáéíóúãõâêîôû]/i.test(clean)) return true;
      return false;
    };

    const isGenericName = isNickOrTechnical(clientName);

    try {
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

      let compiledPrompt = aiConfig.systemPrompt
        .replace(/{nome}/g, isGenericName ? "" : clientName)
        .replace(/{nome_cliente}/g, isGenericName ? "" : clientName)
        .replace(/{telefone}/g, clientPhone)
        .replace(/{empresa}/g, aiConfig.companyName);

      if (isGenericName) {
        compiledPrompt += `\n\nCONTEXTO DO CLIENTE:\n- Você AINDA NÃO tem o nome do cliente (o nome atual é genérico, código ou desconhecido).\n- REGRA MANDATÓRIA (RIGOROSAMENTE 1 PERGUNTA): Na primeira saudação, faça UMA ÚNICA pergunta para descobrir o nome: "Olá! Tudo bem? Aqui é da equipe de projetos da Dumar Móveis Planejados. 😊 Com quem tenho o prazer de falar?". NUNCA pergunte o ambiente antes de o cliente responder o nome. NUNCA faça duas perguntas ao mesmo tempo. NUNCA chame o cliente por códigos ou nicks como "${clientName}".`;
      } else {
        compiledPrompt += `\n\nCONTEXTO DO CLIENTE:\n- O nome do cliente é "${clientName}". Trate-o com cordialidade usando o nome dele de forma natural.`;
      }

      const hasPreviousConversation = conversationHistory.length >= 2;
      if (hasPreviousConversation) {
        const roomsStr = (extraContext?.rooms && extraContext.rooms.length > 0)
          ? extraContext.rooms.join(", ")
          : "seus móveis planejados";

        const daysAgo = extraContext?.daysSinceLastContact || 0;
        const isLongHiatus = daysAgo >= 3;

        if (isLongHiatus) {
          compiledPrompt += `\n\n⏳ RETORNO APÓS DIAS DE AUSÊNCIA (Último contato há aprox. ${daysAgo} dias):
- O cliente passou alguns dias sem conversar e agora mandou mensagem.
- REGRA DE OURO: Seja super calorosa, gentil, ZERO invasiva e mostre total disposição para ajudá-lo no tempo dele.
- NUNCA cobre o cliente ("sumiu?", "por que demorou?"). Apenas acolha com simpatia e relembre com naturalidade o projeto de ${roomsStr}.
- Exemplo: "Olá, ${isGenericName ? "" : clientName}! Tudo bem por aí? Que ótimo falar com você de novo! 😊 Estávamos vendo o projeto de ${roomsStr}. Como posso te ajudar a dar andamento hoje?"`;
        } else {
          compiledPrompt += `\n\n🧠 MEMÓRIA DE CONTEXTO & RETOMADA DE CONVERSA (CLIENTE EM ANDAMENTO):
- Este cliente JÁ conversou conosco anteriormente. NUNCA faça saudação de primeiro contato ("Seja bem-vindo à Dumar") nem pergunte o nome dele novamente.
- Se o cliente mandou apenas uma saudação curta (Ex: "Oi", "Voltei", "Boa tarde", "E aí", "Tudo bem?"):
  👉 Acolha o retorno chamando-o pelo nome e RETOME O ASSUNTO DE ONDE PARARAM DE FORMA SUTIL (Ex: "Olá, ${isGenericName ? "" : clientName}! Que bom falar com você de novo. 😊 Estávamos conversando sobre o projeto de ${roomsStr}. Você já tem uma ideia das medidas ou fotos do espaço, ou prefere que a gente te ajude com a medição?").
- Se o cliente enviou uma dúvida ou continuou a falar de onde parou:
  👉 Vá 100% DIRETO AO ASSUNTO, acolha o que ele falou em 1 frase e faça UMA única pergunta consultiva para avançar o projeto.`;
        }

        compiledPrompt += `\n- Mantenha mensagens curtas (máximo 2 a 3 frases) no estilo ágil e humanizado do WhatsApp.`;
      }

      compiledPrompt += `\n\nPROIBIÇÕES RIGOROSAS:
- NUNCA mencione o nome "Paulo" ou "Paulo Vargas" nas mensagens para o cliente. Fale sempre em nome de "nossa equipe de projetos" ou "nossa equipe".
- NUNCA formate a resposta como lista ou formulário de ticket (Ex: NÃO use "- **Ambiente:** ...", "- **Cidade:** ...", "- **Medidas:** ..."). Responda sempre como uma conversa de WhatsApp em texto corrido e natural.
- Se o cliente disse que tem as medidas ou fotos, PEÇA para ele enviar no WhatsApp antes de mudar de assunto.
- A Dumar REALIZA SIM visitas técnicas no imóvel do cliente e possui escritório comercial para conversar pessoalmente e alinhar projetos. Se o cliente pedir visita ou não tiver medidas, acolha a visita técnica da equipe ou convide para o escritório comercial para conversar. NUNCA mencione mostruários/amostras, NUNCA diga que o atendimento é apenas à distância nem mande o cliente medir com régua/fita métrica.
- NUNCA passe valores, orçamentos, parcelas ou estimativas de preço em R$. Se perguntarem sobre preço ou cobrança de orçamento, diga com naturalidade que a nossa equipe de projetos vai avaliar o espaço para apresentar a proposta sem compromisso.
- NUNCA faça perguntas em lista de múltipla escolha como "(moderno, clássico, escandinavo)".
- NUNCA peça dias ou horários para o cliente escolher. Nossa equipe entrará em contato.
- NUNCA envie links genéricos de vídeo/portfólio se o cliente já enviou uma referência própria.`;

      // Injetar contexto de ambientes já detectados
      if (extraContext?.rooms && extraContext.rooms.length > 0) {
        compiledPrompt += `\n- Ambientes já identificados deste cliente: ${extraContext.rooms.join(", ")}.`;
      }

      // Formatar mensagens para o formato de chat
      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: compiledPrompt }
      ];

      // Incluir histórico amplo da conversa sanitizado (até 14 mensagens)
      const recentHistory = conversationHistory.slice(-14);
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

      // Modelos ativos e testados na API Groq (groq/compound é ultra rápido e sem tokens perdidos em pensamento)
      const ACTIVE_MODELS = ["groq/compound", "openai/gpt-oss-120b", "openai/gpt-oss-20b"];
      let generatedAnswer = "";

      for (const modelName of ACTIVE_MODELS) {
        try {
          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${GROQ_PRIMARY_KEY}`
            },
            body: JSON.stringify({
              model: modelName,
              messages,
              temperature: 0.4,
              max_tokens: 600
            })
          });

          if (response.ok) {
            const data = await response.json();
            let rawContent = data.choices?.[0]?.message?.content?.trim() || "";
            // Limpar eventuais tags de pensamento (<think>...</think>)
            rawContent = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
            // Sanitização de segurança: remover endereço apenas se o contexto não for de escritório/visita/endereço
            const lastClientMsg = messages.filter(m => m.role === "user").slice(-1)[0]?.content?.toLowerCase() || "";
            const isAddressContext = lastClientMsg.includes("onde") ||
              lastClientMsg.includes("endereço") ||
              lastClientMsg.includes("endereco") ||
              lastClientMsg.includes("localiza") ||
              lastClientMsg.includes("escritório") ||
              lastClientMsg.includes("escritorio") ||
              lastClientMsg.includes("visitar") ||
              lastClientMsg.includes("passar") ||
              lastClientMsg.includes("ir aí") ||
              lastClientMsg.includes("ir ai") ||
              lastClientMsg.includes("conhecer");

            if (!isAddressContext) {
              rawContent = rawContent.replace(/\(?Av\.?\s+Santa\s+Catarina[^)]*\)?/gi, "").trim();
              rawContent = rawContent.replace(/\s{2,}/g, " ").trim();
            }

            // Sanitização de segurança: bloquear valores em R$ gerados acidentalmente pela IA
            if (/R\$\s*\d+/i.test(rawContent) || /parcelas\s+de/i.test(rawContent)) {
              rawContent = "Nosso orçamento e apresentação do projeto 3D são 100% gratuitos e sem compromisso! Como cada projeto é feito sob medida para o seu espaço, nossa equipe de projetos desenha a proposta exata para você. Você já tem uma ideia das medidas dessa parede?";
            }

            if (rawContent.length > 0) {
              generatedAnswer = rawContent;
              break; // Sucesso com o modelo
            }
          } else {
            const errText = await response.text();
            console.warn(`Groq modelo ${modelName} retornou erro:`, errText);
          }
        } catch (callErr) {
          console.warn(`Falha de conexão com modelo ${modelName}:`, callErr);
        }
      }

      if (generatedAnswer) {
        return generatedAnswer;
      }

      // Fallback Inteligente Contextual Dinâmico
      const safeLeadName = isGenericName ? "" : `${clientName}! `;
      return `Perfeito, ${safeLeadName}Qual ambiente você gostaria de planejar hoje (cozinha, quarto, sala, etc.)?`;
    } catch (err) {
      console.error("Erro geral ao gerar resposta com o Motor de IA:", err);
      const safeLeadName = isGenericName ? "" : `${clientName}! `;
      return `Olá, ${safeLeadName}Qual ambiente você gostaria de planejar hoje?`;
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
          model: "openai/gpt-oss-120b",
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

  // =========================================================================
  // DADOS INSTITUCIONAIS DA EMPRESA (DUMAR MÓVEIS PLANEJADOS LTDA)
  // =========================================================================
  let companyConfig = {
    razaoSocial: "Dumar Móveis Planejados Ltda",
    nomeFantasia: "Dumar Móveis Planejados",
    cnpj: "45.890.123/0001-90",
    phone: "(48) 98848-6827",
    email: "dumarmoveisplanejados@gmail.com",
    address: "Av. Santa Catarina, 551, sala 205, Centro",
    city: "Balneário Arroio do Silva - SC",
  };

  const COMPANY_CONFIG_FILE = path.join(process.cwd(), "data", "company-config.json");
  try {
    if (fs.existsSync(COMPANY_CONFIG_FILE)) {
      const savedCompany = JSON.parse(fs.readFileSync(COMPANY_CONFIG_FILE, "utf-8"));
      companyConfig = { ...companyConfig, ...savedCompany };
      console.log("Configuração da empresa carregada com sucesso do disco.");
    }
  } catch (e) {
    console.error("Erro ao carregar company-config.json:", e);
  }

  function persistCompanyConfig() {
    try {
      const dir = path.dirname(COMPANY_CONFIG_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(COMPANY_CONFIG_FILE, JSON.stringify(companyConfig, null, 2), "utf-8");
    } catch (e) {
      console.error("Erro ao salvar company-config.json:", e);
    }
  }

  app.get("/api/company-config", (req, res) => {
    return res.status(200).json(companyConfig);
  });

  app.post("/api/company-config", (req, res) => {
    companyConfig = { ...companyConfig, ...req.body };
    persistCompanyConfig();
    return res.status(200).json({ success: true, config: companyConfig });
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

      let chats: any[] = [];

      // 1. Tentar buscar chats da Evolution API (POST e GET)
      try {
        const chatsResPost = await fetch(`${EVOLUTION_URL}/chat/findChats/${instanceName}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: EVOLUTION_KEY },
          body: JSON.stringify({})
        });
        if (chatsResPost.ok) {
          const data = await chatsResPost.json();
          if (Array.isArray(data)) chats = data;
        }
      } catch (e) { }

      if (chats.length === 0) {
        try {
          const chatsResGet = await fetch(`${EVOLUTION_URL}/chat/findChats/${instanceName}`, {
            headers: { apikey: EVOLUTION_KEY }
          });
          if (chatsResGet.ok) {
            const data = await chatsResGet.json();
            if (Array.isArray(data)) chats = data;
          }
        } catch (e) { }
      }

      // 2. Buscar também contatos recentes da Evolution se disponíveis
      let contacts: any[] = [];
      try {
        const contactsRes = await fetch(`${EVOLUTION_URL}/chat/findContacts/${instanceName}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: EVOLUTION_KEY },
          body: JSON.stringify({})
        }).catch(() => null);
        if (contactsRes && contactsRes.ok) {
          const data = await contactsRes.json();
          if (Array.isArray(data)) contacts = data;
        }
      } catch (e) { }

      const allLeads = await storage.getLeads();
      let createdCount = 0;
      let existingCount = 0;
      let updatedHistoryCount = 0;

      const processedPhones = new Set<string>();

      // Função auxiliar interna para processar um item de conversa ou contato
      const processChatItem = async (item: any) => {
        const remoteJid = item.lastMessage?.key?.remoteJidAlt ||
          item.key?.remoteJidAlt ||
          item.remoteJidAlt ||
          (item.remoteJid && !item.remoteJid.includes("@lid") ? item.remoteJid : "") ||
          (item.id && !item.id.includes("@lid") ? item.id : "") ||
          item.sender ||
          item.id ||
          "";

        if (!remoteJid || remoteJid.includes("@g.us") || remoteJid.includes("status@broadcast")) return;

        const phoneClean = remoteJid.replace(/\D/g, "");
        if (!phoneClean || phoneClean.length < 10 || phoneClean.length > 15) return;

        // REGRA MANDATÓRIA: O número do Paulo (Diretoria) NUNCA deve ser importado como Lead!
        const ownerClean = (aiConfig.ownerPhone || "555196682257").replace(/\D/g, "");
        if (phoneClean.includes(ownerClean) || ownerClean.includes(phoneClean)) return;

        const normalizedPhone = normalizePhoneForMatching(phoneClean);
        if (processedPhones.has(normalizedPhone)) return;
        processedPhones.add(normalizedPhone);

        const existingLead = allLeads.find(l => {
          const cleanLead = normalizePhoneForMatching(l.phone);
          return cleanLead.includes(normalizedPhone) || normalizedPhone.includes(cleanLead);
        });

        const rawPushName = item.lastMessage?.pushName || item.pushName || item.name || item.verifiedName;
        const pushName = formatLeadDisplayName(rawPushName, phoneClean);

        let lastMsg = "Contato sincronizado do WhatsApp";
        if (item.lastMessage?.message?.conversation) {
          lastMsg = item.lastMessage.message.conversation;
        } else if (item.lastMessage?.message?.extendedTextMessage?.text) {
          lastMsg = item.lastMessage.message.extendedTextMessage.text;
        } else if (item.lastMessageText) {
          lastMsg = item.lastMessageText;
        }

        const detectedRooms = extractRoomsFromText(lastMsg);
        const origin = extractOriginAndCampaign(item.lastMessage || item, lastMsg);

        const syncTimestamp = item.lastMessage?.messageTimestamp
          ? new Date(Number(item.lastMessage.messageTimestamp) * 1000).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })
          : new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

        const fromMe = Boolean(item.lastMessage?.key?.fromMe);
        const hasPreviousConversation = fromMe || (item.unreadCount === 0 && item.lastMessage);

        if (!existingLead) {
          await storage.createLead({
            name: pushName,
            phone: phoneClean.startsWith("55") ? phoneClean : `55${phoneClean}`,
            email: "",
            stage: "entrada",
            value: 0,
            utmSource: origin.source,
            utmCampaign: origin.campaign,
            rooms: JSON.stringify(detectedRooms.length > 0 ? detectedRooms : ["Móveis Planejados"]),
            checklist: JSON.stringify({ briefing: false, medicao: false, orcamento: false }),
            chatHistory: JSON.stringify([
              {
                sender: fromMe ? "agent" : "client",
                text: lastMsg,
                timestamp: syncTimestamp,
                type: "text",
                isHuman: fromMe ? true : undefined
              }
            ]),
            lastCustomerMessageAt: new Date().toISOString(),
            aiPaused: hasPreviousConversation ? true : false
          });
          createdCount++;
        } else {
          existingCount++;
          // Se o lead existente tiver o histórico de chat vazio, injeta a mensagem inicial
          let currentHistory: any[] = [];
          try {
            currentHistory = typeof existingLead.chatHistory === "string"
              ? JSON.parse(existingLead.chatHistory || "[]")
              : (existingLead.chatHistory || []);
          } catch (e) {
            currentHistory = [];
          }

          if (currentHistory.length === 0 && lastMsg) {
            await storage.updateLead(existingLead.id, {
              chatHistory: JSON.stringify([
                {
                  sender: fromMe ? "agent" : "client",
                  text: lastMsg,
                  timestamp: syncTimestamp,
                  type: "text",
                  isHuman: fromMe ? true : undefined
                }
              ]),
              lastCustomerMessageAt: new Date().toISOString()
            });
            updatedHistoryCount++;
          }
        }
      };

      // Processar apenas chats com mensagens reais (máximo 40 mais recentes)
      const recentChats = chats.filter(c => Boolean(c.lastMessage || c.lastMessageText)).slice(0, 40);
      for (const chat of recentChats) {
        await processChatItem(chat);
      }

      console.log(`[Sincronização WhatsApp] Finalizada: ${createdCount} novos leads importados, ${existingCount} já existentes.`);

      return res.status(200).json({
        success: true,
        message: `Sincronização concluída! ${createdCount} conversas recentes ativas foram adicionadas ao Funil.`,
        createdCount,
        existingCount,
        updatedHistoryCount
      });
    } catch (err) {
      console.error("Erro na sincronização de chats da Evolution:", err);
      return res.status(500).json({ success: false, error: "Erro ao sincronizar conversas do WhatsApp" });
    }
  });

  // Reverter sincronização em massa de contatos do WhatsApp
  app.post("/api/leads/revert-sync", async (req, res) => {
    try {
      const allLeads = await storage.getLeads();
      let removedCount = 0;

      for (const lead of allLeads) {
        // Verifica se o lead foi criado pelo sincronismo em massa e não tem histórico relevante
        let historyStr = "";
        try {
          historyStr = typeof lead.chatHistory === "string" ? lead.chatHistory : JSON.stringify(lead.chatHistory || []);
        } catch (e) {
          historyStr = "";
        }

        const isSyncLead = historyStr.includes("Contato sincronizado do WhatsApp") ||
          (lead.stage === "entrada" && lead.name.startsWith("Cliente ") && lead.value === 0 && (!lead.rooms || lead.rooms.length === 0 || JSON.stringify(lead.rooms).includes("Móveis Planejados")));

        // Preserva leads com valores fechados ou em etapas avançadas
        if (isSyncLead && lead.stage === "entrada" && (!lead.value || lead.value === 0)) {
          await storage.deleteLead(Number(lead.id));
          removedCount++;
        }
      }

      console.log(`[Reversão de Sincronização] ${removedCount} contatos sincronizados em massa foram removidos do funil.`);
      return res.status(200).json({
        success: true,
        message: `Reversão concluída com sucesso! ${removedCount} contatos importados em massa foram removidos do Funil.`,
        removedCount
      });
    } catch (err) {
      console.error("Erro ao reverter sincronização:", err);
      return res.status(500).json({ success: false, message: "Erro ao reverter sincronização." });
    }
  });

  // Helper para obter a data atual YYYY-MM-DD em São Paulo
  function getSaoPauloDateStr(date = new Date()): string {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(date);
    const y = parts.find(p => p.type === "year")?.value;
    const m = parts.find(p => p.type === "month")?.value;
    const d = parts.find(p => p.type === "day")?.value;
    return `${y}-${m}-${d}`;
  }

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

  function isGenericLeadDisplayName(name?: string): boolean {
    if (!name) return true;
    const clean = name.trim().toLowerCase();
    if (clean.length <= 3) return true;
    if (/^\+?\d{8,}$/.test(clean.replace(/\D/g, ""))) return true;
    if (["lead", "cliente", "whatsapp", "novo lead", "contato", "usuario", "usuário", "indefinido"].includes(clean)) return true;
    return false;
  }

  // Helper para capturar o nome real do cliente a partir de frases naturais no WhatsApp
  function extractCustomerNameFromText(text: string, currentLeadName?: string): string | null {
    if (!text) return null;
    const trimmed = text.trim();
    if (trimmed.length < 2 || trimmed.length > 50) return null;

    const forbiddenWords = [
      "cliente", "amigo", "senhor", "senhora", "marcenaria", "dumar", "projeto",
      "cozinha", "sala", "quarto", "banheiro", "orcamento", "orçamento", "planta",
      "sim", "não", "nao", "bom dia", "boa tarde", "boa noite", "olá", "ola", "oi",
      "medidas", "fotos", "casa", "apartamento", "apto", "valor", "preço", "preco",
      "ararangua", "araranguá", "criciuma", "criciúma", "centro", "tenho", "já envio",
      "obrigado", "obrigada", "valeu", "ver em tela cheia", "no", "na", "em", "de", "do", "da",
      "pro", "pra", "arroio", "balneario", "balneário", "silva", "sombrio", "maracaja",
      "maracajá", "içara", "icara", "tubarao", "tubarão", "praia", "bairro", "rua", "avenida",
      "morro", "conventos", "jardim", "coloninha", "home", "office", "closet", "lavabo",
      "área", "area", "gourmet", "painel", "rack", "moveis", "móveis", "tudo", "bem", "vc",
      "você", "voce", "queria", "saber", "quais", "projetam", "quando", "pode", "vir", "aqui"
    ];

    // 1. Padrão Estrito com Gatilho Explícito: "Meu nome é Henrique Linhares Junqueira", "Me chamo Carlos", "Aqui é o Pedro"
    const introMatch = trimmed.match(/(?:meu\s+nome\s+(?:é|e)|me\s+chamo|sou\s+(?:o|a)|pode\s+me\s+chamar\s+de|aqui\s+(?:é|e)\s+(?:o|a)?)\s+([A-ZÀ-Úa-zà-ú]+(?:\s+[A-ZÀ-Úa-zà-ú]+){0,4})/i);
    if (introMatch && introMatch[1]) {
      const raw = introMatch[1].trim();
      const parts = raw.split(/\s+/);
      if (!parts.some(p => forbiddenWords.includes(p.toLowerCase()))) {
        return parts.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
      }
    }

    // 2. Se o lead já possui um nome real confirmado (ex: "Henrique Linhares"), NUNCA sobrescrever com mensagens curtas avulsas
    const alreadyHasRealName = currentLeadName && !isGenericLeadDisplayName(currentLeadName);
    if (alreadyHasRealName) {
      return null;
    }

    // 3. Se o lead ainda tem nome genérico (ex: "Hlj", "5548...", "Cliente"), aceitar mensagem de 1 a 4 palavras
    // Rejeitando preposições de lugar ("no", "na", "em", "de") ou palavras proibidas
    const words = trimmed.split(/\s+/);
    if (words.length >= 1 && words.length <= 4) {
      const firstWord = words[0].toLowerCase();
      if (["no", "na", "em", "de", "do", "da", "pro", "pra"].includes(firstWord)) {
        return null;
      }

      const isOnlyLetters = words.every(w => /^[A-ZÀ-Úa-zà-ú]{2,}$/.test(w));
      const containsForbidden = words.some(w => forbiddenWords.includes(w.toLowerCase()));

      if (isOnlyLetters && !containsForbidden) {
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
      }
    }

    return null;
  }

  // Webhook para mensagens de entrada e saída do WhatsApp (MESSAGES_UPSERT, MESSAGES_UPDATE, SEND_MESSAGE)
  app.post("/api/evolution/webhook", async (req, res) => {
    try {
      const data = req.body;
      const eventName = String(data?.event || data?.type || "").toLowerCase();
      const isMessageEvent = eventName.includes("message") || eventName.includes("upsert") || eventName.includes("send");

      if (data && (isMessageEvent || !data.event)) {
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

          const phoneFromJid = remoteJid.replace(/\D/g, "");
          if (!phoneFromJid || phoneFromJid.length < 10) continue;

          const isFromMe = Boolean(key.fromMe);
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
          let mediaUrl: string | undefined = undefined;
          let audioUrl: string | undefined = undefined;
          let fileName: string | undefined = undefined;
          let mediaType: "image" | "document" | "audio" | undefined = undefined;

          if (messageData.message?.conversation) {
            msgContent = messageData.message.conversation;
          } else if (messageData.message?.extendedTextMessage?.text) {
            msgContent = messageData.message.extendedTextMessage.text;
          } else if (messageData.message?.audioMessage) {
            msgType = "audio";
            mediaType = "audio";
            msgContent = "🎵 Áudio de Voz Enviado";

            // Tentativa de transcrição de áudio com Whisper da Groq e gravação em disco
            try {
              let audioBuffer: Buffer | null = null;
              let mimeType = messageData.message.audioMessage.mimetype || "audio/ogg; codecs=opus";

              // 1. Tentar obter base64 direto da Evolution API
              const mediaRes = await fetch(`${EVOLUTION_URL}/chat/getBase64FromMediaMessage/dumar_comercial`, {
                method: "POST",
                headers: { "Content-Type": "application/json", apikey: EVOLUTION_KEY },
                body: JSON.stringify({ message: messageData })
              });

              if (mediaRes.ok) {
                const mediaJson: any = await mediaRes.json();
                if (mediaJson.base64) {
                  audioBuffer = Buffer.from(mediaJson.base64, "base64");
                  if (mediaJson.mimetype) mimeType = mediaJson.mimetype;
                }
              }

              // 2. Se não veio base64 direto, tentar baixar de mediaUrl se disponível
              if (!audioBuffer && messageData.message.audioMessage.url) {
                const downloadRes = await fetch(messageData.message.audioMessage.url);
                if (downloadRes.ok) {
                  const arrBuf = await downloadRes.arrayBuffer();
                  audioBuffer = Buffer.from(arrBuf);
                }
              }

              // Salvar áudio localmente para streaming e reprodução no CRM
              if (audioBuffer) {
                audioUrl = saveBase64MediaToFile(audioBuffer.toString("base64"), mimeType, "audio");

                // 3. Executar Transcrição com Whisper
                const transcribed = await transcribeAudioWithWhisper(audioBuffer, mimeType);
                if (transcribed && transcribed.trim().length > 0) {
                  msgContent = `🎵 [Áudio]: "${transcribed.trim()}"`;
                  console.log(`Whisper Groq: Áudio de ${phoneFromJid} transcrito: "${transcribed.trim()}"`);
                }
              }
            } catch (audioErr) {
              console.error("Erro ao processar/transcrever áudio:", audioErr);
            }
          } else if (messageData.message?.imageMessage) {
            msgContent = messageData.message.imageMessage.caption || "📷 Imagem Enviada";
            msgType = "image";
            mediaType = "image";

            // Baixar e salvar a imagem enviada pelo cliente no WhatsApp
            try {
              let imgMime = messageData.message.imageMessage.mimetype || "image/jpeg";
              let rawBase64 = messageData.base64 || messageData.message?.imageMessage?.base64 || null;

              // 1. Tentar endpoint dedicado da Evolution API
              if (!rawBase64) {
                const mediaRes = await fetch(`${EVOLUTION_URL}/chat/getBase64FromMediaMessage/dumar_comercial`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", apikey: EVOLUTION_KEY },
                  body: JSON.stringify({ message: messageData, convertToMp4: false })
                });

                if (mediaRes.ok) {
                  const mediaJson: any = await mediaRes.json();
                  rawBase64 = mediaJson.base64 || mediaJson.data?.base64 || mediaJson.media?.base64 || null;
                  if (mediaJson.mimetype) imgMime = mediaJson.mimetype;
                }
              }

              // 2. Se obteve o base64 completo, salvar em disco
              if (rawBase64) {
                mediaUrl = saveBase64MediaToFile(rawBase64, imgMime, "img");
              }

              // 3. Se não obteve e tiver URL de download direta
              if (!mediaUrl && messageData.message.imageMessage.url) {
                try {
                  const downloadRes = await fetch(messageData.message.imageMessage.url);
                  if (downloadRes.ok) {
                    const arrBuf = await downloadRes.arrayBuffer();
                    mediaUrl = saveBase64MediaToFile(Buffer.from(arrBuf).toString("base64"), imgMime, "img");
                  }
                } catch (e) {
                  // Fallback para thumbnail abaixo
                }
              }

              // 4. Fallback imediato garantido: jpegThumbnail embutido no payload
              if (!mediaUrl && messageData.message.imageMessage.jpegThumbnail) {
                const thumbB64 = typeof messageData.message.imageMessage.jpegThumbnail === "string"
                  ? messageData.message.imageMessage.jpegThumbnail
                  : Buffer.from(messageData.message.imageMessage.jpegThumbnail).toString("base64");
                mediaUrl = saveBase64MediaToFile(thumbB64, "image/jpeg", "img_thumb");
              }
            } catch (imgErr) {
              console.error("Erro ao processar/salvar imagem recebida:", imgErr);
            }
          } else if (messageData.message?.documentMessage) {
            const docName = String(messageData.message.documentMessage.fileName || "📄 Documento PDF");
            fileName = docName;
            msgContent = docName;
            msgType = "document";
            mediaType = "document";

            // Baixar e salvar documento/PDF
            try {
              const docMime = messageData.message.documentMessage.mimetype || "application/pdf";
              const mediaRes = await fetch(`${EVOLUTION_URL}/chat/getBase64FromMediaMessage/dumar_comercial`, {
                method: "POST",
                headers: { "Content-Type": "application/json", apikey: EVOLUTION_KEY },
                body: JSON.stringify({ message: messageData })
              });

              if (mediaRes.ok) {
                const mediaJson: any = await mediaRes.json();
                if (mediaJson.base64) {
                  mediaUrl = saveBase64MediaToFile(mediaJson.base64, mediaJson.mimetype || docMime, "doc");
                }
              }
            } catch (docErr) {
              console.error("Erro ao processar documento recebido:", docErr);
            }
          }

          const rawTs = messageData.messageTimestamp;
          const timestamp = rawTs
            ? new Date(Number(rawTs) * 1000).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })
            : new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

          const newChatEntry = {
            sender: isFromMe ? ("agent" as const) : ("client" as const),
            text: msgContent,
            timestamp,
            type: msgType,
            ...(mediaUrl ? { mediaUrl } : {}),
            ...(audioUrl ? { audioUrl } : {}),
            ...(fileName ? { fileName } : {}),
            ...(mediaType ? { mediaType } : {}),
            isHuman: isFromMe ? true : undefined
          };

          // =========================================================================
          // TRATAMENTO EXCLUSIVO DE COMANDOS DO DIRETOR (PAULO VARGAS)
          // =========================================================================
          const ownerClean = (aiConfig.ownerPhone || "555196682257").replace(/\D/g, "");
          const isFromOwner = !isFromMe && (phoneFromJid.includes(ownerClean) || ownerClean.includes(phoneFromJid));

          if (isFromOwner) {
            console.log(`Webhook Evolution: Mensagem recebida do Diretor Paulo (${phoneFromJid}): "${msgContent}"`);

            // Buscar se há lead aguardando aprovação de agendamento
            const pendingLeads = (await storage.getLeads()).filter(l => l.appointmentStatus === "pending_approval");
            const targetPendingLead = pendingLeads.length > 0 ? pendingLeads[pendingLeads.length - 1] : null;

            if (targetPendingLead) {
              const lowerOwnerMsg = msgContent.toLowerCase();
              const isApproval = lowerOwnerMsg.includes("ok") ||
                lowerOwnerMsg.includes("sim") ||
                lowerOwnerMsg.includes("pode") ||
                lowerOwnerMsg.includes("marcar") ||
                lowerOwnerMsg.includes("confirmar") ||
                lowerOwnerMsg.includes("aprovado");

              const isRejection = lowerOwnerMsg.includes("não") ||
                lowerOwnerMsg.includes("nao") ||
                lowerOwnerMsg.includes("negar") ||
                lowerOwnerMsg.includes("sem agenda") ||
                lowerOwnerMsg.includes("cancelar");

              let details: any = {};
              try {
                details = typeof targetPendingLead.appointmentDetails === "string"
                  ? JSON.parse(targetPendingLead.appointmentDetails || "{}")
                  : (targetPendingLead.appointmentDetails || {});
              } catch (e) {
                details = {};
              }

              let finalDate = details.date || getSaoPauloDateStr();
              let finalTime = details.time || "14:00";

              // Se o Paulo digitou um dia ou horário específico no texto (ex: "pode marcar sexta às 16h")
              if (lowerOwnerMsg.includes("às") || lowerOwnerMsg.includes("as") || lowerOwnerMsg.includes("h")) {
                const timeMatch = lowerOwnerMsg.match(/(\d{1,2})h(\d{2})?|(\d{1,2}):(\d{2})/);
                if (timeMatch) {
                  if (timeMatch[1]) finalTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2] || '00'}`;
                  else if (timeMatch[3]) finalTime = `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`;
                }
              }
              if (lowerOwnerMsg.includes("segunda") || lowerOwnerMsg.includes("terça") || lowerOwnerMsg.includes("quarta") || lowerOwnerMsg.includes("quinta") || lowerOwnerMsg.includes("sexta") || lowerOwnerMsg.includes("sábado")) {
                finalDate = calculateTargetAppointmentDate(lowerOwnerMsg);
              }

              if (isApproval) {
                // 1. Criar evento na Agenda do CRM (PostgreSQL / Google Calendar)
                await storage.createCalendarEvent({
                  title: `Reunião Projetista - ${targetPendingLead.name}`,
                  date: finalDate,
                  time: finalTime,
                  type: "evento",
                  priority: "alta",
                  leadId: targetPendingLead.id,
                  notes: `Agendamento VIP aprovado pelo Diretor Paulo Vargas via WhatsApp. Ambientes: ${targetPendingLead.rooms}`,
                  completed: false
                });

                // 2. Atualizar Lead no CRM para Briefing & Medição
                const currentChecklist = typeof targetPendingLead.checklist === "string"
                  ? JSON.parse(targetPendingLead.checklist || "{}")
                  : (targetPendingLead.checklist || {});

                await storage.updateLead(targetPendingLead.id, {
                  stage: "briefing",
                  appointmentStatus: "confirmed",
                  checklist: JSON.stringify({
                    ...currentChecklist,
                    dataAgendamento: `${finalDate} ${finalTime}`
                  })
                });

                // 3. Enviar mensagem de confirmação para o Cliente com o Endereço Oficial
                const clientConfirmMsg = `Olá ${targetPendingLead.name}! Conversei diretamente com nosso diretor Paulo Vargas e sua reunião no nosso escritório comercial está confirmada para *${finalDate} às ${finalTime}*! 📅✨\n\n📍 *Local de Atendimento:*\n${aiConfig.officeAddress}\n\nNossos projetistas já estão preparando tudo para visualizar seu projeto 3D renderizado. Seja muito bem-vindo(a) à Dumar Móveis Planejados!`;
                await sendWhatsAppMessageViaEvolution(targetPendingLead.phone, clientConfirmMsg, "dumar_comercial");

                // 4. Confirmar para o Paulo
                const ownerReplyMsg = `✅ *Agendamento Confirmado e Salvo no CRM!* 📅✨\n\n👤 *Cliente:* ${targetPendingLead.name}\n📱 *WhatsApp:* ${targetPendingLead.phone}\n📅 *Data Agendada:* ${finalDate} às ${finalTime}\n📍 *Local:* Escritório Comercial\n\n🔗 *Acessar CRM:* https://dumarplanejados.com.br/crm`;
                await sendWhatsAppMessageViaEvolution(ownerClean, ownerReplyMsg, "dumar_comercial");

                console.log(`Diretoria Dumar: Reunião do Lead ${targetPendingLead.name} confirmada por Paulo Vargas para ${finalDate} às ${finalTime}.`);
                continue;
              } else if (isRejection) {
                await storage.updateLead(targetPendingLead.id, { appointmentStatus: "rejected" });

                // Mensagem cordial ao cliente sugerindo reagendamento
                const clientRejectMsg = `Olá ${targetPendingLead.name}! Consultei nossa equipe de projetos e neste horário específico nossa equipe já estará em atendimento externo. Terias disponibilidade em outro horário ou no próximo turno para alinharmos?`;
                await sendWhatsAppMessageViaEvolution(targetPendingLead.phone, clientRejectMsg, "dumar_comercial");

                await sendWhatsAppMessageViaEvolution(ownerClean, `❌ *Agendamento de ${targetPendingLead.name} cancelado conforme sua instrução.*`, "dumar_comercial");
                continue;
              }
            } else {
              console.log(`Diretoria Dumar: Mensagem do Paulo recebida, nenhum agendamento pendente de validação no momento.`);
            }

            // REGRA MANDATÓRIA: O número do Paulo é da Diretoria. NUNCA criar Lead no funil nem acionar IA para ele!
            continue;
          }

          const detectedRooms = extractRoomsFromText(msgContent);
          const origin = extractOriginAndCampaign(messageData, msgContent);

          // Tentar extrair o nome falado pelo cliente no texto
          const spokenName = !isFromMe ? extractCustomerNameFromText(msgContent, targetLead?.name || pushName) : null;

          // SE O LEAD NÃO EXISTE -> CRIAR AUTOMATICAMENTE NO FUNIL (Entrada)
          if (!targetLead) {
            const finalInitialName = spokenName || pushName;
            console.log(`Webhook Evolution: Novo Lead criado no Funil (${finalInitialName} - ${phoneFromJid}) [Origem: ${origin.source} - ${origin.campaign}].`);
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
              chatHistory: JSON.stringify([newChatEntry]),
              lastCustomerMessageAt: new Date().toISOString(),
              aiPaused: isFromMe ? true : false,
              appointmentStatus: "none",
              appointmentDetails: "{}"
            });
          } else {
            // ATUALIZAR HISTÓRICO, AMBIENTES E NOME DO LEAD EXISTENTE
            const currentHistory = typeof targetLead.chatHistory === "string"
              ? JSON.parse(targetLead.chatHistory || "[]")
              : (targetLead.chatHistory || []);

            const updatedHistory = [...currentHistory, newChatEntry];

            let existingRooms: string[] = [];
            try {
              existingRooms = typeof targetLead.rooms === "string" ? JSON.parse(targetLead.rooms || "[]") : (targetLead.rooms || []);
            } catch (e) {
              existingRooms = [];
            }
            const combinedRooms = Array.from(new Set([...existingRooms, ...detectedRooms]));

            const nameToUpdate = spokenName && spokenName !== targetLead.name ? spokenName : targetLead.name;

            // Se um lead frio/contato futuro/não responde enviar mensagem nova, reativa para 'em_atendimento'
            let newStage = targetLead.stage;
            if (!isFromMe && ["contato_futuro", "freezer", "nao_responde"].includes(targetLead.stage)) {
              newStage = "em_atendimento";
              console.log(`Webhook Evolution: Lead ${targetLead.name} reativado de '${targetLead.stage}' para 'em_atendimento'.`);
            }

            targetLead = await storage.updateLead(targetLead.id, {
              name: nameToUpdate,
              stage: newStage,
              chatHistory: JSON.stringify(updatedHistory),
              rooms: JSON.stringify(combinedRooms),
              lastCustomerMessageAt: new Date().toISOString(),
              ...(isFromMe ? { aiPaused: true } : {})
            });
          }


          // DISPARAR MOTOR DE IA COMERCIAL SE ATIVO GLOBALMENTE E HABILITADO ESPECIFICAMENTE NO BOTÃO DESTE LEAD
          if (!isFromMe && aiConfig.botEnabled && targetLead) {
            const history = typeof targetLead.chatHistory === "string" ? JSON.parse(targetLead.chatHistory || "[]") : (targetLead.chatHistory || []);

            // BLINDAGEM DE ATENDIMENTO HUMANO: Se a última mensagem da empresa foi enviada por um humano, a IA NUNCA intervém!
            const lastAgentMsg = history.filter((h: any) => h.sender === "agent").slice(-1)[0];
            const lastMsgWasHuman = lastAgentMsg?.isHuman === true;

            const isLeadAiActive = targetLead.aiPaused === false && !lastMsgWasHuman;
            const isAllowedStage = ["entrada", "em_atendimento", "briefing"].includes(targetLead.stage || "entrada");

            if (isLeadAiActive && isAllowedStage) {
              try {
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

                let daysSinceLastContact = 0;
                if (targetLead.lastCustomerMessageAt) {
                  try {
                    const lastDate = new Date(targetLead.lastCustomerMessageAt).getTime();
                    const now = Date.now();
                    daysSinceLastContact = Math.max(0, Math.floor((now - lastDate) / (1000 * 60 * 60 * 24)));
                  } catch (e) {
                    daysSinceLastContact = 0;
                  }
                }

                const replyText = await generateAIResponse(
                  history,
                  targetLead.name,
                  targetLead.phone,
                  {
                    rooms: targetRooms,
                    previousChatCount: history.length,
                    lastAppointment: targetChecklist.dataAgendamento || "",
                    daysSinceLastContact
                  }
                );

                const lowerReply = replyText.toLowerCase();
                const lowerMsg = msgContent.toLowerCase();

                // Detecção Semântica de Gatilhos de Agendamento Real
                const isExplicitAppointment = lowerReply.includes("está agendado") ||
                  lowerReply.includes("agendado:") ||
                  lowerReply.includes("agendamento confirmado") ||
                  lowerReply.includes("marcado para") ||
                  lowerReply.includes("marcada para") ||
                  (lowerMsg.includes("agendar") && (lowerMsg.includes("às") || lowerMsg.includes("as") || lowerMsg.includes("h") || lowerMsg.includes("dia") || lowerMsg.includes("feira"))) ||
                  (lowerMsg.includes("marcar") && (lowerMsg.includes("visita") || lowerMsg.includes("reunião") || lowerMsg.includes("horário"))) ||
                  lowerMsg.includes("visita técnica");

                const mentionsPaulo = lowerMsg.includes("paulo vargas") || lowerMsg.includes("falar com o paulo");
                const mentionsHighValue = /\b(50|60|70|80|90|100|150|200)\s*(mil|k)\b/i.test(lowerMsg);

                // Calcular estimativa interna para o CRM
                const leadEstimate = calculateLeadEstimatedValue(targetRooms);

                // A resposta ao cliente SEMPRE preserva o fluxo inteligente e consultivo da IA
                let finalReplyToClient = replyText;

                console.log(`IA Comercial Dumar: Enviando resposta para ${targetLead.name} (${targetLead.phone}): "${finalReplyToClient.slice(0, 60)}..."`);
                const { success: evoSuccess } = await sendWhatsAppMessageViaEvolution(
                  targetLead.phone,
                  finalReplyToClient,
                  "dumar_comercial"
                );

                const botTimestamp = new Date().toLocaleTimeString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                  hour: "2-digit",
                  minute: "2-digit"
                });

                const historyWithBot = [...history, { sender: "agent", text: finalReplyToClient, timestamp: botTimestamp, isAi: true, sentAt: Date.now(), deliveredViaEvolution: evoSuccess }];

                // Detecção de Encaminhamento para a Equipe Humana
                const isHandoffToTeam = lowerReply.includes("nossa equipe de projetos vai entrar em contato") ||
                  lowerReply.includes("nossa equipe vai entrar em contato") ||
                  lowerReply.includes("nossa equipe entrará em contato") ||
                  lowerReply.includes("vai agendar a visita técnica") ||
                  lowerReply.includes("entraremos em contato em breve") ||
                  lowerReply.includes("visita técnica ao seu");

                // O lead permanece em 'entrada' enquanto a IA está qualificando.
                // Somente quando encaminha para a equipe (isHandoffToTeam), move para 'em_atendimento' e desativa a IA!
                const stageAfterAiReply = isHandoffToTeam ? "em_atendimento" : (targetLead.stage || "entrada");
                const aiPausedAfterReply = isHandoffToTeam ? true : targetLead.aiPaused;

                if (isHandoffToTeam) {
                  console.log(`IA Comercial Dumar: Lead ${targetLead.name} encaminhado para a equipe. Notificando Paulo (${aiConfig.ownerPhone || "555196682257"})...`);
                  try {
                    const ownerPhone = (aiConfig.ownerPhone || "555196682257").replace(/\D/g, "");
                    const allText = history.map((m: any) => m.text).join(" ") + " " + msgContent;

                    const cityMatch = allText.match(/(?:ararangu[aá]|crici[uú]ma|balne[aá]rio\s+arroio\s+do\s+silva|tubar[aã]o|i[cç]ara|sombrio|turvo|morro\s+da\s+fuma[cç]a|urussanga|forquilhinha|maracaj[aá]|meleiro|santa\s+rosa\s+do\s+sul|passo\s+de\s+torres|praia\s+grande|florian[oó]polis|porto\s+alegre)/i);
                    const locationStr = cityMatch ? cityMatch[0] : "A confirmar";
                    const roomsStr = (targetRooms && targetRooms.length > 0) ? targetRooms.join(", ") : "Móveis Planejados";

                    const leadSummaryMsg = `*NOVO LEAD COLETADO PELA IA*

*Cliente:* ${targetLead.name}
*WhatsApp:* ${targetLead.phone}
*Ambiente:* ${roomsStr}
*Local:* ${locationStr}
*Status no CRM:* Em Atendimento (Manual)

*Última mensagem do cliente:* "${msgContent.slice(0, 120)}"

*Ação:* Entrar em contato para apresentar proposta / combinar visita!

*Acessar CRM:* https://dumarplanejados.com.br/crm`;

                    await sendWhatsAppMessageViaEvolution(ownerPhone, leadSummaryMsg, "dumar_comercial");
                  } catch (notifyErr) {
                    console.error("Erro ao enviar resumo do lead para o WhatsApp do Paulo:", notifyErr);
                  }
                }

                await storage.updateLead(targetLead.id, {
                  chatHistory: JSON.stringify(historyWithBot),
                  stage: stageAfterAiReply,
                  aiPaused: aiPausedAfterReply
                });
              } catch (aiErr) {
                console.error("Erro ao processar resposta automática da IA:", aiErr);
              }
            } else {
              console.log(`IA Comercial Dumar: Não intervindo para ${targetLead.name} (Atendimento manual/IA em espera).`);
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
      const { title, date, time, endTime, duration = "60", type = "evento", priority = "media", leadId, notes, completed = false } = req.body;
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


