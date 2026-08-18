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
      const usersList = await storage.getUsers();
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
      const existing = await storage.getUserByUsername(username.trim());
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
        username: username.trim(),
        password: hashPassword(password),
        name: (name || username).trim(),
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
          { sender: "system", text: "Lead criado no sistema", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]),
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
        isRecurring: false,
        recurrenceGroup: "",
        installmentIndex: 1,
        createdAt: new Date().toISOString()
      });
      return res.status(201).json(newTx);
    } catch (err) {
      console.error("Erro ao criar transação financeira:", err);
      return res.status(500).json({ message: "Erro ao criar transação financeira" });
    }
  });

  // Criar Lote de Despesas Recorrentes (Custos Fixos)
  app.post("/api/financial/transactions/recurring", async (req, res) => {
    const { description, type, amount, category, status, baseDueDate, paymentMethod, monthsCount, notes } = req.body;
    if (!description || !amount || !monthsCount) {
      return res.status(400).json({ message: "Descrição, valor e quantidade de meses são obrigatórios" });
    }

    try {
      const numMonths = Math.min(Math.max(Number(monthsCount) || 1, 1), 36);
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
          amount: Number(amount) || 0,
          category: category || "administrativo",
          status: currentStatus,
          dueDate: formattedDueDate,
          paymentDate: currentPaymentDate,
          paymentMethod: paymentMethod || "Boleto",
          leadId: null,
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
      return res.status(500).json({ message: "Erro ao criar transações recorrentes" });
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
    activePreset: "qualificador",
    welcomeMessage: "Olá! Tudo bem? Aqui é da equipe de projetos da Dumar Móveis Planejados. 😊 Com quem tenho o prazer de falar? E qual ambiente você gostaria de planejar?",
    systemPrompt: `Você é a Consultora Comercial da equipe de projetos da Dumar Móveis Planejados (móveis sob medida de alto padrão 100% MDF com ferragens amortecidas).
Seu objetivo é conduzir um atendimento ágil, caloroso, altamente persuasivo e humanizado no WhatsApp, qualificando o cliente e avançando para validação da diretoria ou agendamento de visita técnica / projeto 3D.

REGRAS SUPREMAS DE CONVERSÃO & INSIDE SALES NO WHATSAPP:
1. SAUDAÇÃO INICIAL & APRESENTAÇÃO:
   - Se você AINDA NÃO sabe o nome do cliente (ou se for desconhecido/apelido), apresente-se sempre assim:
     "Olá! Tudo bem? Aqui é da equipe de projetos da Dumar Móveis Planejados. 😊 Com quem tenho o prazer de falar?"
   - Se você já sabe o nome (Ex: "Henrique"), use o nome dele cordialmente:
     "Olá, {nome}! Tudo bem? Aqui é da equipe de projetos da Dumar Móveis Planejados. 😊 Qual ambiente você gostaria de planejar hoje?"
2. MENSAGENS CURTAS E DIRETAS (MÁXIMO 2 A 3 FRASES): NUNCA envie blocos de texto ou parágrafos longos. Escreva exatamente como uma pessoa real conversa no WhatsApp.
3. UMA PERGUNTA POR VEZ (ESCUTA ATIVA & MICRO-COMPROMISSOS):
   - Nunca faça mais de uma pergunta na mesma mensagem.
   - Sempre valide e acolha o que o cliente acabou de dizer antes de fazer a próxima pergunta.
   - Siga a cadência natural:
     Passo 1: Confirmar o nome e acolher com entusiasmo.
     Passo 2: Entender quais ambientes ele deseja planejar (Cozinha, Quarto/Suíte, Banheiro, Sala, Casa toda, etc.).
     Passo 3: Saber a cidade/bairro do imóvel e se é casa ou apartamento.
     Passo 4: Perguntar se já possui a planta com medidas ou fotos do cômodo.
     Passo 5: Sondar investimento previsto ou encaminhar para a aprovação da diretoria (Paulo Vargas).
4. PROIBIDO COLAR ENDEREÇO OU CONVITE REPETITIVO DE CAFÉ:
   - NUNCA cole o endereço completo do escritório ("Av. Santa Catarina, 551...") nem convide para café a cada mensagem de sondagem.
   - O endereço só deve ser mencionado se o cliente perguntar expressamente onde fica a loja ou quando o agendamento presencial for efetivamente concluído.
5. ATENDIMENTO EXCLUSIVO & DIRETORIA (PAULO VARGAS):
   - O fundador e diretor executivo da Dumar é o Paulo Vargas.
   - Se o cliente citar o Paulo, múltiplos ambientes ou valores de investimento (ex: R$ 25 mil, 30k, 50k), acolha com entusiasmo de atendimento VIP e informe que está abrindo o projeto com o Paulo para priorizar a proposta dele.
6. SIGILO COMERCIAL & VALORES:
   - NUNCA passe valores fechados de cabeça. Explique que como é 100% sob medida, o projeto é desenhado para se adequar ao investimento e ao espaço dele.
7. LINKS DE PORTFÓLIO E VÍDEOS:
   - Fotos de projetos: https://dumarplanejados.com.br/#portfolio
   - Vídeos de projetos e bastidores: https://dumarplanejados.com.br/#videos
8. ENCERRAMENTOS E RESPEITO AO TEMPO:
   - Se o cliente disser que vai deixar para depois, que não pode falar agora ou agradecer, despeça-se com elegância e carinho sem insistir.`,
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
        compiledPrompt += `\n\nCONTEXTO DO CLIENTE:\n- Você AINDA NÃO tem o nome do cliente (o nome atual é um apelido/código ou desconhecido).\n- REGRA OBRIGATÓRIA: Como você não sabe o nome real do cliente, na sua saudação pergunte educadamente: "Com quem tenho o prazer de falar? E qual ambiente você gostaria de planejar?". NUNCA chame o cliente por nicks como "${clientName}".`;
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
  👉 Acolha o retorno chamando-o pelo nome e RETOME O ASSUNTO DE ONDE PARARAM (Ex: "Olá, ${isGenericName ? "" : clientName}! Que bom falar com você de novo. 😊 Estávamos conversando sobre o projeto de ${roomsStr}. Você conseguiu a planta baixa ou fotos do espaço para continuarmos?").
- Se o cliente enviou uma dúvida ou continuou a falar de onde parou:
  👉 Vá 100% DIRETO AO ASSUNTO, acolha o que ele falou em 1 frase e faça UMA única pergunta direta para avançar o projeto.`;
        }

        compiledPrompt += `\n- Mantenha mensagens curtas (máximo 2 frases) no estilo ágil e humanizado do WhatsApp.`;
      }
      
      compiledPrompt += `\n\nPROIBIÇÃO RIGOROSA:
- NUNCA mencione o endereço da loja ("Av. Santa Catarina, 551...") nem convide para "tomar um café no escritório" enquanto estiver apenas conversando ou tirando dúvidas.
- Fale sobre os móveis sob medida, qualidade 100% MDF com ferragens amortecidas e faça UMA única pergunta direta.`;

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
            // Sanitização de segurança: remover endereço caso o cliente não tenha perguntado "onde fica"
            const lastClientMsg = messages.filter(m => m.role === "user").slice(-1)[0]?.content?.toLowerCase() || "";
            const askedForAddress = lastClientMsg.includes("onde") || lastClientMsg.includes("endereço") || lastClientMsg.includes("localiza");
            if (!askedForAddress) {
              rawContent = rawContent.replace(/\(?Av\.?\s+Santa\s+Catarina[^)]*\)?/gi, "").trim();
              rawContent = rawContent.replace(/\s{2,}/g, " ").trim();
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
      } catch (e) {}

      if (chats.length === 0) {
        try {
          const chatsResGet = await fetch(`${EVOLUTION_URL}/chat/findChats/${instanceName}`, {
            headers: { apikey: EVOLUTION_KEY }
          });
          if (chatsResGet.ok) {
            const data = await chatsResGet.json();
            if (Array.isArray(data)) chats = data;
          }
        } catch (e) {}
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
      } catch (e) {}

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

      for (const chat of chats) {
        await processChatItem(chat);
      }

      for (const contact of contacts) {
        await processChatItem(contact);
      }

      console.log(`[Sincronização WhatsApp] Finalizada: ${createdCount} novos leads importados, ${existingCount} já existentes.`);

      return res.status(200).json({
        success: true,
        message: `Sincronização concluída! ${createdCount} novos contatos/conversas foram importados para o Funil (${existingCount} já estavam cadastrados).`,
        createdCount,
        existingCount,
        updatedHistoryCount
      });
    } catch (err) {
      console.error("Erro na sincronização de chats da Evolution:", err);
      return res.status(500).json({ success: false, error: "Erro ao sincronizar conversas do WhatsApp" });
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

  // Helper para capturar o nome real do cliente a partir de frases naturais no WhatsApp
  function extractCustomerNameFromText(text: string, currentLeadName?: string): string | null {
    if (!text) return null;
    const trimmed = text.trim();

    // 1. Padrão Estrito com Gatilho Explícito: "Meu nome é Henrique", "Me chamo Carlos", "Sou o Henrique", "Pode me chamar de Mariana", "Aqui é o Pedro"
    const introMatch = trimmed.match(/(?:meu\s+nome\s+(?:é|e)|me\s+chamo|sou\s+(?:o|a)|pode\s+me\s+chamar\s+de|aqui\s+(?:é|e)\s+(?:o|a)?)\s+([A-ZÀ-Úa-zà-ú]{2,}(?:\s+[A-ZÀ-Úa-zà-ú]{2,})?)/i);
    if (introMatch && introMatch[1]) {
      const raw = introMatch[1].trim();
      const forbiddenWords = ["cliente", "amigo", "senhor", "senhora", "marcenaria", "dumar", "projeto", "cozinha", "sala", "quarto", "banheiro", "orcamento", "orçamento", "planta"];
      if (!forbiddenWords.includes(raw.toLowerCase())) {
        return raw.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
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

          if (messageData.message?.conversation) {
            msgContent = messageData.message.conversation;
          } else if (messageData.message?.extendedTextMessage?.text) {
            msgContent = messageData.message.extendedTextMessage.text;
          } else if (messageData.message?.audioMessage) {
            msgType = "audio";
            msgContent = "🎵 Áudio de Voz Enviado";

            // Tentativa de transcrição de áudio com Whisper da Groq
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

              // 3. Executar Transcrição com Whisper
              if (audioBuffer) {
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
          } else if (messageData.message?.documentMessage) {
            msgContent = messageData.message.documentMessage.fileName || "📄 Documento PDF Enviado";
            msgType = "document";
          }

          const rawTs = messageData.messageTimestamp;
          const timestamp = rawTs 
            ? new Date(Number(rawTs) * 1000).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })
            : new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

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
              chatHistory: JSON.stringify([
                { 
                  sender: isFromMe ? "agent" : "client", 
                  text: msgContent, 
                  timestamp, 
                  type: msgType,
                  isHuman: isFromMe ? true : undefined
                }
              ]),
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

            const updatedHistory = [
              ...currentHistory, 
              { 
                sender: isFromMe ? "agent" : "client", 
                text: msgContent, 
                timestamp, 
                type: msgType,
                isHuman: isFromMe ? true : undefined
              }
            ];
            
            let existingRooms: string[] = [];
            try {
              existingRooms = typeof targetLead.rooms === "string" ? JSON.parse(targetLead.rooms || "[]") : (targetLead.rooms || []);
            } catch (e) {
              existingRooms = [];
            }
            const combinedRooms = Array.from(new Set([...existingRooms, ...detectedRooms]));

            const nameToUpdate = spokenName && spokenName !== targetLead.name ? spokenName : targetLead.name;

            targetLead = await storage.updateLead(targetLead.id, {
              name: nameToUpdate,
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
            const isAllowedStage = ["entrada", "briefing"].includes(targetLead.stage || "entrada");

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

                // Detecção Semântica de Gatilhos VIP & Agendamento
                const isExplicitAppointment = lowerReply.includes("está agendado") || 
                                              lowerReply.includes("agendado:") || 
                                              lowerReply.includes("agendamento confirmado") ||
                                              lowerReply.includes("marcado para") ||
                                              lowerReply.includes("marcada para") ||
                                              lowerMsg.includes("agendar") ||
                                              lowerMsg.includes("marcar") ||
                                              lowerMsg.includes("visita técnica") ||
                                              lowerMsg.includes("pode vir medir");

                const mentionsPaulo = lowerMsg.includes("paulo") || lowerReply.includes("paulo vargas");
                const mentionsHighValue = lowerMsg.includes("mil") || lowerMsg.includes("k") || /\b\d{2,3}\.?000\b/.test(lowerMsg) || lowerMsg.includes("25");
                const hasMultipleRooms = targetRooms.length >= 2 || lowerMsg.includes("casa toda") || lowerMsg.includes("apartamento todo");

                // Calcular estimativa interna e classificação de Lead VIP
                const leadEstimate = calculateLeadEstimatedValue(targetRooms);
                const isVipOpportunity = isExplicitAppointment || mentionsPaulo || mentionsHighValue || hasMultipleRooms;

                let finalReplyToClient = replyText;

                // SE FOR GATILHO VIP OU AGENDAMENTO -> ACIONAR VALIDAÇÃO EXECUTIVA COM O PAULO
                if (isVipOpportunity && aiConfig.requireOwnerApproval !== false) {
                  const targetAppointmentDate = calculateTargetAppointmentDate(`${msgContent} ${replyText}`);
                  const timeMatch = (lowerReply + " " + lowerMsg).match(/(\d{1,2})h(\d{2})?|(\d{1,2}):(\d{2})/);
                  let extractedTime = "14:00";
                  if (timeMatch) {
                    if (timeMatch[1]) extractedTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2] || '00'}`;
                    else if (timeMatch[3]) extractedTime = `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`;
                  }

                  // Salvar estado pendente no Lead
                  await storage.updateLead(targetLead.id, {
                    appointmentStatus: "pending_approval",
                    appointmentDetails: JSON.stringify({
                      date: targetAppointmentDate,
                      time: extractedTime,
                      rooms: targetRooms,
                      estimatedValue: leadEstimate.estimatedValue,
                      summary: msgContent
                    })
                  });

                  // Resposta acolhedora e personalizada de atendimento VIP (sem valores)
                  if (mentionsPaulo || mentionsHighValue || hasMultipleRooms) {
                    finalReplyToClient = `Excelente, ${targetLead.name}! Com esses ambientes e esse investimento, estou alinhando agora com o Paulo Vargas (nosso diretor) para priorizarmos seu projeto e vermos a melhor data de atendimento. Um minutinho que já te confirmo por aqui! ✨`;
                  } else {
                    finalReplyToClient = `Perfeito, ${targetLead.name}! Estou verificando a confirmação de agenda com a nossa diretoria para *${targetAppointmentDate} às ${extractedTime}*. Em instantes te confirmo por aqui!`;
                  }

                  // DISPARAR NOTIFICAÇÃO EXECUTIVA VIP NO WHATSAPP DO PAULO
                  try {
                    const ownerPhone = (aiConfig.ownerPhone || "555196682257").replace(/\D/g, "");
                    const allText = history.map((m: any) => m.text).join(" ") + " " + msgContent;
                    const cityMatch = allText.match(/(?:ararangu[aá]|crici[uú]ma|balne[aá]rio\s+arroio\s+do\s+silva|tubar[aã]o|i[cç]ara|sombrio|turvo|morro\s+da\s+fuma[cç]a|urussanga|forquilhinha|maracaj[aá]|meleiro|santa\s+rosa\s+do\s+sul|passo\s+de\s+torres|praia\s+grande|florian[oó]polis|porto\s+alegre)/i);
                    const locationStr = cityMatch ? cityMatch[0].toUpperCase() : "Balneário Arroio do Silva / Criciúma";

                    const propMatch = allText.match(/\b(casa|apartamento|apto|cobertura|sala\s+comercial)\b/i);
                    const propertyTypeStr = propMatch ? propMatch[0].toUpperCase() : "Imóvel";
                    const roomsStr = (targetRooms && targetRooms.length > 0) ? targetRooms.join(", ") : "Móveis Planejados";

                    const vipBadge = (leadEstimate.isVip || mentionsHighValue || mentionsPaulo) 
                      ? "🚨 *OPORTUNIDADE VIP (DIRETORIA DUMAR)* 💎✨" 
                      : "📅 *SOLICITAÇÃO DE AGENDAMENTO* ✨";

                    const notifyMsg = `${vipBadge}

👤 *Cliente:* ${targetLead.name}
📱 *WhatsApp:* ${targetLead.phone}
📍 *Local:* ${locationStr} (${propertyTypeStr})
🛋️ *Ambientes:* ${roomsStr}
💰 *Estimativa / Orçamento:* ${leadEstimate.summary}
📅 *Previsão de Data:* ${targetAppointmentDate} às ${extractedTime}

💬 *Mensagem do Cliente:* "${msgContent.slice(0, 140)}"

👉 *COMO RESPONDER:*
• Digite *OK* ou *SIM* (ou envie um áudio 🎙️) para aprovar neste horário
• Ou digite outro dia/hora (Ex: *"Pode marcar sexta às 10h"*)
• Ou digite *NEGAR* se não tiver agenda

🔗 *Acessar CRM:* https://dumarplanejados.com.br/crm`;

                    console.log(`IA Comercial Dumar: Notificando Paulo (${ownerPhone}) para aprovação de agendamento VIP...`);
                    await sendWhatsAppMessageViaEvolution(ownerPhone, notifyMsg, "dumar_comercial");
                  } catch (notifyErr) {
                    console.error("Erro ao enviar notificação de agendamento para o Paulo:", notifyErr);
                  }
                } else if (isExplicitAppointment && aiConfig.requireOwnerApproval === false) {
                  // Modo direto sem aprovação
                  const targetAppointmentDate = calculateTargetAppointmentDate(`${msgContent} ${replyText}`);
                  const timeMatch = lowerReply.match(/(\d{1,2})h(\d{2})?|(\d{1,2}):(\d{2})/);
                  let extractedTime = "14:00";
                  if (timeMatch) {
                    if (timeMatch[1]) extractedTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2] || '00'}`;
                    else if (timeMatch[3]) extractedTime = `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`;
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

                  await storage.updateLead(targetLead.id, { 
                    stage: "briefing",
                    appointmentStatus: "confirmed",
                    checklist: JSON.stringify({
                      ...targetChecklist,
                      dataAgendamento: `${targetAppointmentDate} ${extractedTime}`
                    })
                  });
                }

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
                await storage.updateLead(targetLead.id, { chatHistory: JSON.stringify(historyWithBot) });
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


