import { db } from "./db";
import { 
  users, leads, whatsappTemplates, calendarEvents, financialTransactions, contracts, materialsCatalog, suppliers, clients, quotes, quoteItems, receipts,
  type User, type InsertUser, type Lead, type InsertLead, 
  type WhatsappTemplate, type InsertWhatsappTemplate, 
  type CalendarEventItem, type InsertCalendarEvent,
  type FinancialTransaction, type InsertFinancialTransaction,
  type ContractItem, type InsertContract,
  type MaterialCatalogItem, type InsertMaterialCatalog,
  type Supplier, type InsertSupplier,
  type Client, type InsertClient,
  type Quote, type InsertQuote,
  type QuoteItem, type InsertQuoteItem,
  type ReceiptItem, type InsertReceipt
} from "../shared/schema";
import { eq, desc, and, ne, inArray } from "drizzle-orm";


export interface IStorage {
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<boolean>;

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
  createRecurringTransactions(transactions: InsertFinancialTransaction[]): Promise<FinancialTransaction[]>;
  updateFinancialTransaction(id: number, updates: Partial<InsertFinancialTransaction>): Promise<FinancialTransaction>;
  updateFinancialTransactionsByGroup(recurrenceGroup: string, updates: Partial<InsertFinancialTransaction>, onlyPending?: boolean): Promise<FinancialTransaction[]>;
  updateFinancialTransactionsByIds(ids: number[], updates: Partial<InsertFinancialTransaction>): Promise<FinancialTransaction[]>;
  deleteFinancialTransaction(id: number): Promise<boolean>;
  deleteFinancialTransactionsByGroup(recurrenceGroup: string): Promise<boolean>;
  deleteFinancialTransactionsByIds(ids: number[]): Promise<boolean>;

  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, updates: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: number): Promise<boolean>;

  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  findClientByDocumentOrName(cpfCnpj?: string, name?: string, phone?: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, updates: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: number): Promise<boolean>;
  deduplicateClients(): Promise<{ mergedCount: number; remainingCount: number }>;

  getContracts(): Promise<ContractItem[]>;
  getContract(id: number): Promise<ContractItem | undefined>;
  createContract(contract: InsertContract): Promise<ContractItem>;
  updateContract(id: number, updates: Partial<InsertContract>): Promise<ContractItem>;
  deleteContract(id: number): Promise<boolean>;

  getQuotes(): Promise<(Quote & { items?: QuoteItem[] })[]>;
  getQuote(id: number): Promise<{ quote: Quote; items: QuoteItem[] } | undefined>;
  createQuote(quote: InsertQuote, items?: InsertQuoteItem[]): Promise<{ quote: Quote; items: QuoteItem[] }>;
  updateQuote(id: number, quoteUpdates: Partial<InsertQuote>, items?: InsertQuoteItem[]): Promise<{ quote: Quote; items: QuoteItem[] }>;
  deleteQuote(id: number): Promise<boolean>;

  getMaterialsCatalog(): Promise<MaterialCatalogItem[]>;
  createMaterialItem(material: InsertMaterialCatalog): Promise<MaterialCatalogItem>;
  updateMaterialItem(id: number, updates: Partial<InsertMaterialCatalog>): Promise<MaterialCatalogItem>;
  deleteMaterialItem(id: number): Promise<boolean>;

  getReceipts(): Promise<ReceiptItem[]>;
  getReceipt(id: number): Promise<ReceiptItem | undefined>;
  createReceipt(receipt: InsertReceipt): Promise<ReceiptItem>;
  updateReceipt(id: number, updates: Partial<InsertReceipt>): Promise<ReceiptItem>;
  deleteReceipt(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(usernameOrEmail: string): Promise<User | undefined> {
    const term = usernameOrEmail.trim().toLowerCase();
    const allUsers = await db.select().from(users);
    return allUsers.find(u => 
      u.username.toLowerCase() === term || 
      (u.email && u.email.toLowerCase() === term)
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
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

  async createRecurringTransactions(transactions: InsertFinancialTransaction[]): Promise<FinancialTransaction[]> {
    if (transactions.length === 0) return [];
    return await db.insert(financialTransactions).values(transactions).returning();
  }

  async updateFinancialTransaction(id: number, updates: Partial<InsertFinancialTransaction>): Promise<FinancialTransaction> {
    const [tx] = await db.update(financialTransactions).set(updates).where(eq(financialTransactions.id, id)).returning();
    if (!tx) throw new Error("Transação financeira não encontrada");
    return tx;
  }

  async updateFinancialTransactionsByGroup(
    recurrenceGroup: string,
    updates: Partial<InsertFinancialTransaction>,
    onlyPending: boolean = false
  ): Promise<FinancialTransaction[]> {
    if (!recurrenceGroup) return [];
    if (onlyPending) {
      return await db.update(financialTransactions)
        .set(updates)
        .where(and(eq(financialTransactions.recurrenceGroup, recurrenceGroup), ne(financialTransactions.status, "pago")))
        .returning();
    } else {
      return await db.update(financialTransactions)
        .set(updates)
        .where(eq(financialTransactions.recurrenceGroup, recurrenceGroup))
        .returning();
    }
  }

  async updateFinancialTransactionsByIds(
    ids: number[],
    updates: Partial<InsertFinancialTransaction>
  ): Promise<FinancialTransaction[]> {
    if (ids.length === 0) return [];
    return await db.update(financialTransactions)
      .set(updates)
      .where(inArray(financialTransactions.id, ids))
      .returning();
  }

  async deleteFinancialTransaction(id: number): Promise<boolean> {
    const result = await db.delete(financialTransactions).where(eq(financialTransactions.id, id)).returning();
    return result.length > 0;
  }

  async deleteFinancialTransactionsByGroup(recurrenceGroup: string): Promise<boolean> {
    if (!recurrenceGroup) return false;
    const result = await db.delete(financialTransactions).where(eq(financialTransactions.recurrenceGroup, recurrenceGroup)).returning();
    return result.length > 0;
  }

  async deleteFinancialTransactionsByIds(ids: number[]): Promise<boolean> {
    if (ids.length === 0) return false;
    const result = await db.delete(financialTransactions).where(inArray(financialTransactions.id, ids)).returning();
    return result.length > 0;
  }



  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers);
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [s] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return s;
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const [s] = await db.insert(suppliers).values(insertSupplier).returning();
    return s;
  }

  async updateSupplier(id: number, updates: Partial<InsertSupplier>): Promise<Supplier> {
    const [s] = await db.update(suppliers).set(updates).where(eq(suppliers.id, id)).returning();
    if (!s) throw new Error("Fornecedor não encontrado");
    return s;
  }

  async deleteSupplier(id: number): Promise<boolean> {
    const result = await db.delete(suppliers).where(eq(suppliers.id, id)).returning();
    return result.length > 0;
  }

  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(desc(clients.id));
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [c] = await db.select().from(clients).where(eq(clients.id, id));
    return c;
  }

  async findClientByDocumentOrName(cpfCnpj?: string, name?: string, phone?: string): Promise<Client | undefined> {
    const all = await this.getClients();
    const cleanCpf = (cpfCnpj || "").replace(/\D/g, "");
    const cleanName = (name || "").trim().toLowerCase();
    const cleanPhone = (phone || "").replace(/\D/g, "");

    if (cleanCpf && cleanCpf.length >= 11) {
      const match = all.find(c => (c.cpfCnpj || "").replace(/\D/g, "") === cleanCpf);
      if (match) return match;
    }

    if (cleanName) {
      const match = all.find(c => {
        const cName = (c.name || "").trim().toLowerCase();
        if (cName === cleanName) return true;
        if (cleanPhone && cleanPhone.length >= 8) {
          const cPhone = (c.phone || "").replace(/\D/g, "");
          if (cPhone.includes(cleanPhone) || cleanPhone.includes(cPhone)) {
            return cName.includes(cleanName) || cleanName.includes(cName);
          }
        }
        return false;
      });
      if (match) return match;
    }

    return undefined;
  }

  async deduplicateClients(): Promise<{ mergedCount: number; remainingCount: number }> {
    const all = await this.getClients();
    if (all.length <= 1) return { mergedCount: 0, remainingCount: all.length };

    const groups = new Map<string, Client[]>();

    for (const c of all) {
      const cleanCpf = (c.cpfCnpj || "").replace(/\D/g, "");
      const cleanName = (c.name || "").trim().toLowerCase();
      
      let key = "";
      if (cleanCpf && cleanCpf.length >= 11) {
        key = `cpf_${cleanCpf}`;
      } else if (cleanName) {
        key = `name_${cleanName}`;
      } else {
        key = `id_${c.id}`;
      }

      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(c);
    }

    let mergedCount = 0;

    for (const clientGroup of Array.from(groups.values())) {
      if (clientGroup.length <= 1) continue;

      // Ordenar: primeiro o que tiver mais campos preenchidos, ou id menor (mais antigo)
      clientGroup.sort((a: Client, b: Client) => {
        const scoreA = (a.cpfCnpj ? 3 : 0) + (a.phone ? 2 : 0) + (a.address ? 2 : 0) + (a.email ? 1 : 0) + (a.rg ? 1 : 0);
        const scoreB = (b.cpfCnpj ? 3 : 0) + (b.phone ? 2 : 0) + (b.address ? 2 : 0) + (b.email ? 1 : 0) + (b.rg ? 1 : 0);
        if (scoreB !== scoreA) return scoreB - scoreA;
        return a.id - b.id;
      });

      const canonical = clientGroup[0];
      const duplicates = clientGroup.slice(1);

      let hasUpdates = false;
      const updates: Partial<InsertClient> = {};

      for (const dup of duplicates) {
        if (!canonical.cpfCnpj && dup.cpfCnpj) { canonical.cpfCnpj = dup.cpfCnpj; updates.cpfCnpj = dup.cpfCnpj; hasUpdates = true; }
        if (!canonical.rg && dup.rg) { canonical.rg = dup.rg; updates.rg = dup.rg; hasUpdates = true; }
        if (!canonical.phone && dup.phone) { canonical.phone = dup.phone; updates.phone = dup.phone; hasUpdates = true; }
        if (!canonical.email && dup.email) { canonical.email = dup.email; updates.email = dup.email; hasUpdates = true; }
        if (!canonical.address && dup.address) { canonical.address = dup.address; updates.address = dup.address; hasUpdates = true; }
        if (!canonical.bairro && dup.bairro) { canonical.bairro = dup.bairro; updates.bairro = dup.bairro; hasUpdates = true; }
        if (!canonical.city && dup.city) { canonical.city = dup.city; updates.city = dup.city; hasUpdates = true; }
        if (!canonical.cep && dup.cep) { canonical.cep = dup.cep; updates.cep = dup.cep; hasUpdates = true; }
        if (!canonical.leadId && dup.leadId) { canonical.leadId = dup.leadId; updates.leadId = dup.leadId; hasUpdates = true; }

        // Migrar referências de quotes e receipts para o canonical
        await db.update(quotes).set({ clientId: canonical.id }).where(eq(quotes.clientId, dup.id));
        await db.update(receipts).set({ clientId: canonical.id }).where(eq(receipts.clientId, dup.id));

        // Deletar o duplicado
        await db.delete(clients).where(eq(clients.id, dup.id));
        mergedCount++;
      }

      if (hasUpdates) {
        await db.update(clients).set(updates).where(eq(clients.id, canonical.id));
      }
    }

    const remaining = await this.getClients();
    return { mergedCount, remainingCount: remaining.length };
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [c] = await db.insert(clients).values(insertClient).returning();
    return c;
  }

  async updateClient(id: number, updates: Partial<InsertClient>): Promise<Client> {
    const [c] = await db.update(clients).set(updates).where(eq(clients.id, id)).returning();
    if (!c) throw new Error("Cliente não encontrado");
    return c;
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id)).returning();
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

  async getMaterialsCatalog(): Promise<MaterialCatalogItem[]> {
    return await db.select().from(materialsCatalog);
  }

  async createMaterialItem(material: InsertMaterialCatalog): Promise<MaterialCatalogItem> {
    const [item] = await db.insert(materialsCatalog).values(material).returning();
    return item;
  }

  async updateMaterialItem(id: number, updates: Partial<InsertMaterialCatalog>): Promise<MaterialCatalogItem> {
    const [item] = await db.update(materialsCatalog).set(updates).where(eq(materialsCatalog.id, id)).returning();
    if (!item) throw new Error("Material não encontrado");
    return item;
  }

  async deleteMaterialItem(id: number): Promise<boolean> {
    const result = await db.delete(materialsCatalog).where(eq(materialsCatalog.id, id)).returning();
    return result.length > 0;
  }

  async getQuotes(): Promise<(Quote & { items?: QuoteItem[] })[]> {
    const allQuotes = await db.select().from(quotes).orderBy(desc(quotes.id));
    const allItems = await db.select().from(quoteItems).orderBy(quoteItems.itemOrder);
    
    return allQuotes.map(q => {
      const items = allItems.filter(i => i.quoteId === q.id);
      return { ...q, items };
    });
  }

  async getQuote(id: number): Promise<{ quote: Quote; items: QuoteItem[] } | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    if (!quote) return undefined;
    const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, id)).orderBy(quoteItems.itemOrder);
    return { quote, items };
  }

  async createQuote(quoteData: InsertQuote, itemsData: InsertQuoteItem[] = []): Promise<{ quote: Quote; items: QuoteItem[] }> {
    const [quote] = await db.insert(quotes).values(quoteData).returning();
    const createdItems: QuoteItem[] = [];

    if (itemsData && itemsData.length > 0) {
      for (let i = 0; i < itemsData.length; i++) {
        const item = itemsData[i];
        const [createdItem] = await db.insert(quoteItems).values({
          ...item,
          quoteId: quote.id,
          itemOrder: item.itemOrder || i + 1,
          createdAt: new Date().toISOString()
        }).returning();
        createdItems.push(createdItem);
      }
    }

    return { quote, items: createdItems };
  }

  async updateQuote(id: number, quoteUpdates: Partial<InsertQuote>, itemsData?: InsertQuoteItem[]): Promise<{ quote: Quote; items: QuoteItem[] }> {
    const [quote] = await db.update(quotes).set({
      ...quoteUpdates,
      updatedAt: new Date().toISOString()
    }).where(eq(quotes.id, id)).returning();

    if (!quote) throw new Error("Orçamento não encontrado");

    let items: QuoteItem[] = [];
    if (itemsData !== undefined) {
      await db.delete(quoteItems).where(eq(quoteItems.quoteId, id));
      for (let i = 0; i < itemsData.length; i++) {
        const item = itemsData[i];
        const [createdItem] = await db.insert(quoteItems).values({
          ...item,
          quoteId: quote.id,
          itemOrder: item.itemOrder || i + 1,
          createdAt: new Date().toISOString()
        }).returning();
        items.push(createdItem);
      }
    } else {
      items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, id)).orderBy(quoteItems.itemOrder);
    }

    return { quote, items };
  }

  async deleteQuote(id: number): Promise<boolean> {
    await db.delete(quoteItems).where(eq(quoteItems.quoteId, id));
    const result = await db.delete(quotes).where(eq(quotes.id, id)).returning();
    return result.length > 0;
  }

  async getReceipts(): Promise<ReceiptItem[]> {
    return await db.select().from(receipts).orderBy(desc(receipts.id));
  }

  async getReceipt(id: number): Promise<ReceiptItem | undefined> {
    const [item] = await db.select().from(receipts).where(eq(receipts.id, id));
    return item;
  }

  async createReceipt(insertReceipt: InsertReceipt): Promise<ReceiptItem> {
    const [item] = await db.insert(receipts).values(insertReceipt).returning();
    return item;
  }

  async updateReceipt(id: number, updates: Partial<InsertReceipt>): Promise<ReceiptItem> {
    const [item] = await db.update(receipts).set(updates).where(eq(receipts.id, id)).returning();
    if (!item) throw new Error("Recibo não encontrado");
    return item;
  }

  async deleteReceipt(id: number): Promise<boolean> {
    const result = await db.delete(receipts).where(eq(receipts.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
