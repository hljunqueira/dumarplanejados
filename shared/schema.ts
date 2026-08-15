import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  stage: text("stage").notNull().default("entrada"),
  value: integer("value").notNull().default(0),
  utmSource: text("utm_source").default("Google Ads"),
  utmCampaign: text("utm_campaign").default("Campanha Manual"),
  rooms: text("rooms").default("[]"), // Armazenado como JSON string do array de ambientes
  promobFiles: text("promob_files").default("[]"), // Armazenado como JSON string
  paymentMethod: text("payment_method").default(""),
  installments: integer("installments").default(1),
  downPayment: integer("down_payment").default(0),
  deliveryDate: text("delivery_date").default(""),
  assembler: text("assembler").default(""),
  checklist: text("checklist").default("{}"), // Armazenado como JSON string do objeto de checklist técnico de marcenaria
  chatHistory: text("chat_history").default("[]"), // Armazenado como JSON string das mensagens do whatsapp (Evolution API)
  constructionPhotos: text("construction_photos").default("[]"),
  materials: text("materials").default("{}"),
  lastCustomerMessageAt: text("last_customer_message_at").default(""),
});

export const insertLeadSchema = createInsertSchema(leads);
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

export const whatsappTemplates = pgTable("whatsapp_templates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").default("Geral"),
});

export const insertWhatsappTemplateSchema = createInsertSchema(whatsappTemplates);
export type InsertWhatsappTemplate = z.infer<typeof insertWhatsappTemplateSchema>;
export type WhatsappTemplate = typeof whatsappTemplates.$inferSelect;

export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  time: text("time").default(""),
  type: text("type").notNull().default("evento"), // "evento" | "tarefa" | "nota"
  priority: text("priority").notNull().default("media"), // "alta" | "media" | "baixa"
  leadId: integer("lead_id"),
  notes: text("notes").default(""),
  completed: boolean("completed").notNull().default(false),
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents);
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEventItem = typeof calendarEvents.$inferSelect;

export const financialTransactions = pgTable("financial_transactions", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  type: text("type").notNull().default("receita"), // "receita" | "despesa"
  amount: integer("amount").notNull().default(0), // em reais (ex: 1500)
  category: text("category").notNull().default("venda_marcenaria"),
  status: text("status").notNull().default("pago"), // "pago" | "pendente" | "atrasado"
  dueDate: text("due_date").notNull().default(""),
  paymentDate: text("payment_date").default(""),
  paymentMethod: text("payment_method").default("PIX"),
  leadId: integer("lead_id"),
  notes: text("notes").default(""),
  createdAt: text("created_at").default(""),
});

export const insertFinancialTransactionSchema = createInsertSchema(financialTransactions);
export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;
export type FinancialTransaction = typeof financialTransactions.$inferSelect;

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  contractNumber: text("contract_number").notNull(),
  contractDate: text("contract_date").notNull(),
  status: text("status").notNull().default("rascunho"),
  leadId: integer("lead_id"),
  clientName: text("client_name").notNull(),
  clientCpfCnpj: text("client_cpf_cnpj").default(""),
  clientAddress: text("client_address").default(""),
  clientPhone: text("client_phone").default(""),
  totalValue: integer("total_value").notNull().default(0),
  downPayment: integer("down_payment").notNull().default(0),
  dataJson: text("data_json").notNull().default("{}"),
  createdAt: text("created_at").default(""),
});

export const insertContractSchema = createInsertSchema(contracts);
export type InsertContract = z.infer<typeof insertContractSchema>;
export type ContractItem = typeof contracts.$inferSelect;


