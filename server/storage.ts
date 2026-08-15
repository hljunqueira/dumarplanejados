import { db } from "./db";
import { 
  users, leads, whatsappTemplates, calendarEvents, financialTransactions, contracts,
  type User, type InsertUser, type Lead, type InsertLead, 
  type WhatsappTemplate, type InsertWhatsappTemplate, 
  type CalendarEventItem, type InsertCalendarEvent,
  type FinancialTransaction, type InsertFinancialTransaction,
  type ContractItem, type InsertContract
} from "../shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getLeads(): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead>;
  deleteLead(id: number): Promise<boolean>;

  getTemplates(): Promise<WhatsappTemplate[]>;
  createTemplate(template: InsertWhatsappTemplate): Promise<WhatsappTemplate>;
  deleteTemplate(id: number): Promise<boolean>;

  getCalendarEvents(): Promise<CalendarEventItem[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEventItem>;
  updateCalendarEvent(id: number, updates: Partial<InsertCalendarEvent>): Promise<CalendarEventItem>;
  deleteCalendarEvent(id: number): Promise<boolean>;

  getFinancialTransactions(): Promise<FinancialTransaction[]>;
  getFinancialTransaction(id: number): Promise<FinancialTransaction | undefined>;
  createFinancialTransaction(tx: InsertFinancialTransaction): Promise<FinancialTransaction>;
  updateFinancialTransaction(id: number, updates: Partial<InsertFinancialTransaction>): Promise<FinancialTransaction>;
  deleteFinancialTransaction(id: number): Promise<boolean>;

  getContracts(): Promise<ContractItem[]>;
  getContract(id: number): Promise<ContractItem | undefined>;
  createContract(contract: InsertContract): Promise<ContractItem>;
  updateContract(id: number, updates: Partial<InsertContract>): Promise<ContractItem>;
  deleteContract(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getLeads(): Promise<Lead[]> {
    return await db.select().from(leads);
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db.insert(leads).values(insertLead).returning();
    return lead;
  }

  async updateLead(id: number, updateData: Partial<InsertLead>): Promise<Lead> {
    const [lead] = await db.update(leads).set(updateData).where(eq(leads.id, id)).returning();
    if (!lead) throw new Error("Lead não encontrado");
    return lead;
  }

  async deleteLead(id: number): Promise<boolean> {
    const result = await db.delete(leads).where(eq(leads.id, id)).returning();
    return result.length > 0;
  }

  async getTemplates(): Promise<WhatsappTemplate[]> {
    return await db.select().from(whatsappTemplates);
  }

  async createTemplate(insertTemplate: InsertWhatsappTemplate): Promise<WhatsappTemplate> {
    const [template] = await db.insert(whatsappTemplates).values(insertTemplate).returning();
    return template;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    const result = await db.delete(whatsappTemplates).where(eq(whatsappTemplates.id, id)).returning();
    return result.length > 0;
  }

  async getCalendarEvents(): Promise<CalendarEventItem[]> {
    return await db.select().from(calendarEvents);
  }

  async createCalendarEvent(insertEv: InsertCalendarEvent): Promise<CalendarEventItem> {
    const [ev] = await db.insert(calendarEvents).values(insertEv).returning();
    return ev;
  }

  async updateCalendarEvent(id: number, updates: Partial<InsertCalendarEvent>): Promise<CalendarEventItem> {
    const [ev] = await db.update(calendarEvents).set(updates).where(eq(calendarEvents.id, id)).returning();
    if (!ev) throw new Error("Evento não encontrado");
    return ev;
  }

  async deleteCalendarEvent(id: number): Promise<boolean> {
    const result = await db.delete(calendarEvents).where(eq(calendarEvents.id, id)).returning();
    return result.length > 0;
  }

  async getFinancialTransactions(): Promise<FinancialTransaction[]> {
    return await db.select().from(financialTransactions);
  }

  async getFinancialTransaction(id: number): Promise<FinancialTransaction | undefined> {
    const [tx] = await db.select().from(financialTransactions).where(eq(financialTransactions.id, id));
    return tx;
  }

  async createFinancialTransaction(insertTx: InsertFinancialTransaction): Promise<FinancialTransaction> {
    const [tx] = await db.insert(financialTransactions).values(insertTx).returning();
    return tx;
  }

  async updateFinancialTransaction(id: number, updates: Partial<InsertFinancialTransaction>): Promise<FinancialTransaction> {
    const [tx] = await db.update(financialTransactions).set(updates).where(eq(financialTransactions.id, id)).returning();
    if (!tx) throw new Error("Transação financeira não encontrada");
    return tx;
  }

  async deleteFinancialTransaction(id: number): Promise<boolean> {
    const result = await db.delete(financialTransactions).where(eq(financialTransactions.id, id)).returning();
    return result.length > 0;
  }

  async getContracts(): Promise<ContractItem[]> {
    return await db.select().from(contracts);
  }

  async getContract(id: number): Promise<ContractItem | undefined> {
    const [c] = await db.select().from(contracts).where(eq(contracts.id, id));
    return c;
  }

  async createContract(insertContract: InsertContract): Promise<ContractItem> {
    const [c] = await db.insert(contracts).values(insertContract).returning();
    return c;
  }

  async updateContract(id: number, updates: Partial<InsertContract>): Promise<ContractItem> {
    const [c] = await db.update(contracts).set(updates).where(eq(contracts.id, id)).returning();
    if (!c) throw new Error("Contrato não encontrado");
    return c;
  }

  async deleteContract(id: number): Promise<boolean> {
    const result = await db.delete(contracts).where(eq(contracts.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();


