import React, { useState, useEffect } from "react";
import {
  Calculator, Plus, Edit3, Printer, CheckCircle2, Clock, 
  Trash2, Search, X, Eye, Phone, Mail, MapPin, DollarSign,
  AlertCircle, RefreshCw, FileText, ArrowRight, Share2, Copy, Check
} from "lucide-react";
import { Lead } from "./types";
import { Client, Quote, QuoteItem } from "@shared/schema";
import { useConfirmDialog } from "../ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import logoDumar from "@/assets/logo1.jpeg";

interface CRMQuotesViewProps {
  leads: Lead[];
  onOpenContract?: (contractId?: number) => void;
}

export interface QuoteItemFormData {
  id?: number;
  itemOrder: number;
  itemType: "produto" | "servico";
  environment: string;
  description: string;
  quantity: number;
  unitMeasure: string;
  unitPrice: number;
  totalPrice: number;
  ncm?: string;
  cfop?: string;
}

export interface QuoteFormData {
  id?: number;
  quoteNumber: string;
  quoteDate: string;
  validUntil: string;
  status: "rascunho" | "enviado" | "aprovado" | "recusado" | "expirado";
  leadId?: number | null;
  clientId?: number | null;
  contractId?: number | null;
  clientName: string;
  clientCpfCnpj: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  clientBairro: string;
  clientCity: string;
  subtotal: number;
  discountType: "fixed" | "percentage";
  discountValue: number;
  totalValue: number;
  downPayment: number;
  downPaymentMethod: string;
  remainingBalance: number;
  remainingPaymentMethod: string;
  installmentsCount: number;
  cardInstallmentValue: number;
  paymentTerms: string;
  deliveryDays: number;
  notes: string;
  items: QuoteItemFormData[];
}

const COMMON_ENVIRONMENTS = [
  "Cozinha Planejada", "Dormitório Casal", "Dormitório Solteiro", 
  "Closet", "Banheiro", "Sala de Estar / Home", "Sacada Gourmet / Quiosque",
  "Lavanderia", "Área de Serviço", "Espaço Gourmet / Churrasqueira"
];

export default function CRMQuotesView({ leads, onOpenContract }: CRMQuotesViewProps): JSX.Element {
  const [quotes, setQuotes] = useState<(Quote & { items?: QuoteItem[] })[]>([]);
  const [registeredClients, setRegisteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { confirm, showAlert } = useConfirmDialog();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [editSubTab, setEditSubTab] = useState<"client" | "items" | "payment">("client");
  const [isSaving, setIsSaving] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [copiedQuoteId, setCopiedQuoteId] = useState<number | null>(null);

  const getEmptyQuote = (lead?: Lead): QuoteFormData => {
    const today = new Date().toISOString().split("T")[0];
    const vDate = new Date();
    vDate.setDate(vDate.getDate() + 15);
    const validUntil = vDate.toISOString().split("T")[0];
    const quoteNum = `ORC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let initialItems: QuoteItemFormData[] = [];

    if (lead?.rooms) {
      const roomsArr = Array.isArray(lead.rooms) 
        ? lead.rooms 
        : String(lead.rooms).split(",").map(r => r.trim()).filter(Boolean);
      if (roomsArr.length > 0) {
        initialItems = roomsArr.map((r, idx) => ({
          itemOrder: idx + 1,
          itemType: "produto",
          environment: r,
          description: `Mobiliário sob medida para ${r}`,
          quantity: 1,
          unitMeasure: "UN",
          unitPrice: 0,
          totalPrice: 0,
          ncm: "9403.60.00",
          cfop: "5101"
        }));
      }
    }

    if (initialItems.length === 0) {
      initialItems = [
        {
          itemOrder: 1,
          itemType: "produto",
          environment: "",
          description: "",
          quantity: 1,
          unitMeasure: "UN",
          unitPrice: 0,
          totalPrice: 0,
          ncm: "9403.60.00",
          cfop: "5101"
        }
      ];
    }

    return {
      quoteNumber: quoteNum,
      quoteDate: today,
      validUntil: validUntil,
      status: "rascunho",
      leadId: lead?.id ? Number(lead.id) : null,
      clientId: null,
      contractId: null,
      clientName: lead?.name || "",
      clientCpfCnpj: "",
      clientPhone: lead?.phone || "",
      clientEmail: lead?.email || "",
      clientAddress: "",
      clientBairro: "",
      clientCity: "Balneário Arroio do Silva - SC",
      subtotal: 0,
      discountType: "fixed",
      discountValue: 0,
      totalValue: 0,
      downPayment: 0,
      downPaymentMethod: "PIX",
      remainingBalance: 0,
      remainingPaymentMethod: "Cartão de Crédito",
      installmentsCount: 1,
      cardInstallmentValue: 0,
      paymentTerms: "",
      deliveryDays: 35,
      notes: "Valores válidos por 15 dias. Projeto executivo e conferência final de medidas incluídos.",
      items: initialItems
    };
  };

  const [currentQuote, setCurrentQuote] = useState<QuoteFormData>(getEmptyQuote());

  // Buscar Orçamentos da API
  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/quotes");
      if (res.ok) {
        const data = await res.json();
        setQuotes(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn("Erro ao buscar orçamentos da API:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegisteredClients = async () => {
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setRegisteredClients(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn("Erro ao buscar clientes cadastrados:", e);
    }
  };

  useEffect(() => {
    fetchQuotes();
    fetchRegisteredClients();
  }, []);

  // Recalcular totais reativamente
  const recalculateQuote = (updates: Partial<QuoteFormData>) => {
    setCurrentQuote(prev => {
      const merged = { ...prev, ...updates };
      const sub = merged.items.reduce((acc, curr) => acc + (Number(curr.totalPrice) || 0), 0);
      
      let disc = Number(merged.discountValue) || 0;
      if (merged.discountType === "percentage") {
        disc = Math.round((sub * disc) / 100);
      }
      
      const total = Math.max(0, sub - disc);
      const down = Math.min(total, Number(merged.downPayment) || 0);
      const rem = Math.max(0, total - down);
      const instCount = Math.max(1, Number(merged.installmentsCount) || 1);
      const cardInst = rem > 0 ? Math.round(rem / instCount) : 0;

      return {
        ...merged,
        subtotal: sub,
        totalValue: total,
        downPayment: down,
        remainingBalance: rem,
        cardInstallmentValue: cardInst,
        paymentTerms: merged.paymentTerms !== undefined ? merged.paymentTerms : ""
      };
    });
  };

  // Abrir Modal de Novo Orçamento
  const handleOpenNewQuote = (lead?: Lead) => {
    const q = getEmptyQuote(lead);
    setCurrentQuote(q);
    setEditSubTab("client");
    setActiveTab("edit");
    setIsModalOpen(true);
  };

  // Abrir Orçamento Existente
  const handleOpenExistingQuote = (q: Quote & { items?: QuoteItem[] }, mode: "edit" | "preview" = "preview") => {
    const itemsFormatted: QuoteItemFormData[] = (q.items && q.items.length > 0)
      ? q.items.map(i => ({
          id: i.id,
          itemOrder: i.itemOrder,
          itemType: (i.itemType as "produto" | "servico") || "produto",
          environment: i.environment,
          description: i.description,
          quantity: Number(i.quantity) || 1,
          unitMeasure: i.unitMeasure || "UN",
          unitPrice: Number(i.unitPrice) || 0,
          totalPrice: Number(i.totalPrice) || 0,
          ncm: i.ncm || "9403.60.00",
          cfop: i.cfop || "5101"
        }))
      : [
          {
            itemOrder: 1,
            itemType: "produto",
            environment: "Móveis Planejados",
            description: "Projeto de marcenaria sob medida",
            quantity: 1,
            unitMeasure: "UN",
            unitPrice: Number(q.totalValue) || 0,
            totalPrice: Number(q.totalValue) || 0,
            ncm: "9403.60.00",
            cfop: "5101"
          }
        ];

    setCurrentQuote({
      id: q.id,
      quoteNumber: q.quoteNumber,
      quoteDate: q.quoteDate,
      validUntil: q.validUntil,
      status: q.status as any,
      leadId: q.leadId,
      clientId: q.clientId,
      contractId: q.contractId,
      clientName: q.clientName,
      clientCpfCnpj: q.clientCpfCnpj || "",
      clientPhone: q.clientPhone || "",
      clientEmail: q.clientEmail || "",
      clientAddress: q.clientAddress || "",
      clientBairro: q.clientBairro || "",
      clientCity: q.clientCity || "Balneário Arroio do Silva - SC",
      subtotal: Number(q.subtotal) || Number(q.totalValue) || 0,
      discountType: (q.discountType as any) || "fixed",
      discountValue: Number(q.discountValue) || 0,
      totalValue: Number(q.totalValue) || 0,
      downPayment: Number(q.downPayment) || 0,
      downPaymentMethod: q.downPaymentMethod || "PIX",
      remainingBalance: Number(q.remainingBalance) || (Number(q.totalValue) - Number(q.downPayment)),
      remainingPaymentMethod: q.remainingPaymentMethod || "Cartão de Crédito",
      installmentsCount: Number(q.installmentsCount) || 1,
      cardInstallmentValue: Number(q.cardInstallmentValue) || 0,
      paymentTerms: q.paymentTerms || "",
      deliveryDays: Number(q.deliveryDays) || 35,
      notes: q.notes || "",
      items: itemsFormatted
    });

    setActiveTab(mode);
    setEditSubTab("items");
    setIsModalOpen(true);
  };

  // Salvar Orçamento
  const handleSaveQuote = async () => {
    if (!currentQuote.clientName.trim()) {
      await showAlert({
        title: "Nome Obrigatório",
        message: "Por favor, informe o Nome do Cliente para salvar o orçamento.",
        variant: "warning"
      });
      return;
    }

    if (currentQuote.items.length === 0) {
      await showAlert({
        title: "Itens Obrigatórios",
        message: "Adicione ao menos um ambiente ou item ao orçamento.",
        variant: "warning"
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...currentQuote,
        items: currentQuote.items.map((it, idx) => ({
          ...it,
          itemOrder: idx + 1,
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          totalPrice: Number(it.totalPrice) || 0
        }))
      };

      if (currentQuote.id) {
        const res = await fetch(`/api/quotes/${currentQuote.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Erro ao atualizar orçamento no servidor.");
      } else {
        const res = await fetch("/api/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Erro ao registrar novo orçamento no servidor.");
      }

      toast({
        title: "Orçamento Salvo",
        description: `Proposta ${currentQuote.quoteNumber} para ${currentQuote.clientName} salva com sucesso!`,
      });

      setIsModalOpen(false);
      fetchQuotes();
    } catch (e) {
      await showAlert({
        title: "Erro ao Salvar",
        message: (e as Error).message,
        variant: "danger"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Converter Orçamento em Contrato (1 Clique)
  const handleConvertToContract = async (quote: Quote & { items?: QuoteItem[] }) => {
    const ok = await confirm({
      title: "Fechar Venda & Gerar Contrato",
      message: `Deseja aprovar a proposta ${quote.quoteNumber} (${quote.clientName}) no valor de R$ ${Number(quote.totalValue).toLocaleString("pt-BR")} e gerar a minuta de contrato automaticamente?`,
      confirmText: "Sim, Gerar Contrato",
      variant: "info"
    });

    if (!ok) return;

    setIsConverting(true);
    try {
      const res = await fetch(`/api/quotes/${quote.id}/convert-to-contract`, {
        method: "POST"
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Erro ao converter proposta em contrato.");
      }

      const data = await res.json();
      toast({
        title: "Venda Fechada com Sucesso! 🎉",
        description: `Contrato ${data.contract?.contractNumber} gerado e Lead avançado para a etapa de Contrato!`,
      });

      fetchQuotes();
      if (onOpenContract && data.contract?.id) {
        onOpenContract(data.contract.id);
      }
    } catch (e) {
      await showAlert({
        title: "Erro na Conversão",
        message: (e as Error).message,
        variant: "danger"
      });
    } finally {
      setIsConverting(false);
    }
  };

  // Excluir Orçamento
  const handleDeleteQuote = async (quote: Quote) => {
    const ok = await confirm({
      title: "Excluir Orçamento",
      message: `Tem certeza que deseja excluir o orçamento ${quote.quoteNumber} de ${quote.clientName}?\nEsta ação não poderá ser desfeita.`,
      variant: "danger",
      confirmText: "Sim, Excluir"
    });

    if (!ok) return;

    try {
      const res = await fetch(`/api/quotes/${quote.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir orçamento.");
      toast({
        title: "Orçamento Excluído",
        description: `Proposta ${quote.quoteNumber} removida.`,
      });
      fetchQuotes();
    } catch (e) {
      await showAlert({
        title: "Erro",
        message: (e as Error).message,
        variant: "danger"
      });
    }
  };

  // Copiar resumo formatado para o WhatsApp
  const handleCopyForWhatsApp = (quote: Quote & { items?: QuoteItem[] }) => {
    const itemsList = (quote.items || []).map(i => `• *${i.environment}*: R$ ${Number(i.totalPrice).toLocaleString("pt-BR")}`).join("\n");
    const text = `🪵 *DUMAR MÓVEIS PLANEJADOS*
📋 *Proposta Comercial:* ${quote.quoteNumber}
👤 *Cliente:* ${quote.clientName}
📅 *Validade:* Até ${new Date(quote.validUntil + "T12:00:00").toLocaleDateString("pt-BR")}

*Ambientes Inclusos:*
${itemsList || "• Projeto Completo Sob Medida"}

💰 *Valor Total do Projeto:* R$ ${Number(quote.totalValue).toLocaleString("pt-BR")}
💳 *Condições:* ${quote.paymentTerms || "Consulte opções de parcelamento"}
⏱️ *Prazo de Fabricação:* ${quote.deliveryDays || 35} dias úteis

_Ficamos à disposição para apresentar os renders 3D e o memorial descritivo em nosso showroom!_ ✨`;

    navigator.clipboard.writeText(text);
    setCopiedQuoteId(quote.id);
    setTimeout(() => setCopiedQuoteId(null), 2500);
    toast({
      title: "Copiado para o WhatsApp!",
      description: "O texto da proposta foi copiado para a sua área de transferência.",
    });
  };

  // Filtragem
  const filteredQuotes = quotes.filter(q => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      q.clientName.toLowerCase().includes(term) ||
      q.quoteNumber.toLowerCase().includes(term) ||
      (q.items && q.items.some(i => i.environment.toLowerCase().includes(term)));
    const matchesStatus = statusFilter === "all" || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aprovado":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5"><CheckCircle2 size={12} /> Aprovado (Fechado)</span>;
      case "enviado":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1.5"><Clock size={12} /> Enviado ao Cliente</span>;
      case "recusado":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5"><X size={12} /> Não Aprovado</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5"><Clock size={12} /> Rascunho</span>;
    }
  };

  // Funções de manipulação da grade de itens
  const handleAddItem = () => {
    const nextOrder = currentQuote.items.length + 1;
    const newItem: QuoteItemFormData = {
      itemOrder: nextOrder,
      itemType: "produto",
      environment: "",
      description: "",
      quantity: 1,
      unitMeasure: "UN",
      unitPrice: 0,
      totalPrice: 0,
      ncm: "9403.60.00",
      cfop: "5101"
    };
    recalculateQuote({ items: [...currentQuote.items, newItem] });
  };

  const handleUpdateItem = (index: number, updates: Partial<QuoteItemFormData>) => {
    const updated = [...currentQuote.items];
    const target = { ...updated[index], ...updates };
    target.totalPrice = Math.round((Number(target.quantity) || 1) * (Number(target.unitPrice) || 0) * 100) / 100;
    updated[index] = target;
    recalculateQuote({ items: updated });
  };

  const handleRemoveItem = (index: number) => {
    const updated = currentQuote.items.filter((_, idx) => idx !== index);
    recalculateQuote({ items: updated });
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DO MÓDULO DE ORÇAMENTOS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] border border-white/5 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
              <Calculator size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                Orçamentos & Propostas Comerciais
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Emissão ágil de propostas com grade de itens tipo NF, cálculo automático e evolução em 1 clique para Contrato
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => handleOpenNewQuote()}
          className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-6 py-3.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 uppercase tracking-wider"
        >
          <Plus size={16} strokeWidth={2.5} /> Novo Orçamento
        </button>
      </div>

      {/* BARRA DE FILTROS E BUSCA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#111] p-3 rounded-xl border border-white/5">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por cliente, número ou ambiente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#181818] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Todos" },
            { id: "rascunho", label: "Rascunhos" },
            { id: "enviado", label: "Enviados" },
            { id: "aprovado", label: "Aprovados" },
            { id: "recusado", label: "Recusados" }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === f.id
                  ? "bg-white/10 text-white border border-white/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* LISTAGEM DE ORÇAMENTOS */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <RefreshCw size={28} className="animate-spin mb-3 text-amber-500" />
          <p className="text-xs">Carregando orçamentos...</p>
        </div>
      ) : filteredQuotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-[#111] border border-dashed border-white/10 rounded-2xl text-center p-8">
          <Calculator size={40} className="text-gray-600 mb-3" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Nenhum orçamento encontrado</h3>
          <p className="text-xs text-gray-400 max-w-sm mb-4">
            {searchTerm || statusFilter !== "all" 
              ? "Nenhum resultado corresponde aos filtros aplicados." 
              : "Gere seu primeiro orçamento clicando no botão abaixo ou a partir do funil."}
          </p>
          <button
            onClick={() => handleOpenNewQuote()}
            className="bg-amber-500 text-black font-black text-xs px-5 py-2.5 rounded-xl uppercase tracking-wider cursor-pointer hover:bg-amber-400 transition-all flex items-center gap-2"
          >
            <Plus size={15} /> Criar Primeiro Orçamento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuotes.map(q => {
            const itemCount = q.items?.length || 0;
            return (
              <div
                key={q.id}
                className="bg-[#141414] border border-white/5 hover:border-amber-500/30 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {q.quoteNumber}
                    </span>
                    {getStatusBadge(q.status)}
                  </div>

                  <h3 className="text-base font-black text-white tracking-wide truncate group-hover:text-amber-400 transition-colors">
                    {q.clientName}
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                    {q.clientPhone && (
                      <span className="flex items-center gap-1 truncate">
                        <Phone size={12} className="text-gray-500" /> {q.clientPhone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-gray-500" /> Até {new Date(q.validUntil + "T12:00:00").toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  {/* Resumo de Ambientes */}
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Ambientes da Proposta ({itemCount})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-16 overflow-hidden">
                      {q.items && q.items.length > 0 ? (
                        q.items.slice(0, 3).map((it, idx) => (
                          <span key={idx} className="bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded text-[10px] font-medium truncate max-w-[140px]">
                            {it.environment}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-xs italic">Nenhum item discriminado</span>
                      )}
                      {itemCount > 3 && (
                        <span className="text-[10px] text-amber-400 font-bold self-center">+{itemCount - 3} mais</span>
                      )}
                    </div>
                  </div>

                  {/* Valores */}
                  <div className="mt-4 bg-[#0d0d0d] p-3 rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500 block">Valor Total</span>
                      <span className="text-base font-black text-emerald-400">
                        R$ {Number(q.totalValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {Number(q.downPayment) > 0 && (
                      <div className="text-right">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500 block">Sinal / Entrada</span>
                        <span className="text-xs font-bold text-amber-400">
                          R$ {Number(q.downPayment).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTÕES DE AÇÃO */}
                <div className="mt-5 pt-3 border-t border-white/5 flex flex-col gap-2">
                  {q.status !== "aprovado" ? (
                    <button
                      onClick={() => handleConvertToContract(q)}
                      disabled={isConverting}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 uppercase tracking-wider"
                    >
                      <CheckCircle2 size={15} /> Fechar Venda & Gerar Contrato
                    </button>
                  ) : (
                    <div className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[11px] py-2 rounded-xl text-center flex items-center justify-center gap-1.5">
                      <Check size={14} /> Contrato Gerado ({q.contractId ? `#${q.contractId}` : "Vinculado"})
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenExistingQuote(q, "edit")}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Edit3 size={13} /> Editar
                    </button>

                    <button
                      onClick={() => handleOpenExistingQuote(q, "preview")}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-amber-400 font-bold text-xs py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Printer size={13} /> Imprimir / PDF
                    </button>

                    <button
                      onClick={() => handleCopyForWhatsApp(q)}
                      title="Copiar resumo para WhatsApp"
                      className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all cursor-pointer border border-emerald-500/20"
                    >
                      {copiedQuoteId === q.id ? <Check size={14} /> : <Share2 size={14} />}
                    </button>

                    <button
                      onClick={() => handleDeleteQuote(q)}
                      title="Excluir Orçamento"
                      className="p-2 hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE EDIÇÃO / CRIAÇÃO / PREVIEW DO ORÇAMENTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* TOPO DO MODAL */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[#161616]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                  <Calculator size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    {currentQuote.id ? `Orçamento ${currentQuote.quoteNumber}` : "Novo Orçamento Comercial"}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {currentQuote.clientName || "Cliente não informado"} • Emitido em {currentQuote.quoteDate}
                  </p>
                </div>
              </div>

              {/* Seletor de Modo: Edição vs Pré-visualização */}
              <div className="flex items-center gap-3">
                <div className="bg-[#0f0f0f] p-1 rounded-xl border border-white/10 flex items-center">
                  <button
                    onClick={() => setActiveTab("edit")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === "edit" ? "bg-amber-500 text-black shadow-md font-black" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setActiveTab("preview")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === "preview" ? "bg-amber-500 text-black shadow-md font-black" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Visualizar & Imprimir
                  </button>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* CONTEÚDO: ABA EDIÇÃO */}
            {activeTab === "edit" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* SUB-ABAS DE EDIÇÃO */}
                <div className="flex items-center border-b border-white/5 bg-[#121212] px-4 gap-2">
                  {[
                    { id: "client", label: "1. Dados do Cliente & Lead" },
                    { id: "items", label: "2. Grade de Ambientes & Itens (Tipo NF)" },
                    { id: "payment", label: "3. Formas de Pagamento & Prazos" }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setEditSubTab(tab.id as any)}
                      className={`py-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                        editSubTab === tab.id
                          ? "border-amber-500 text-amber-400 bg-amber-500/5 font-black"
                          : "border-transparent text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                  {/* SUB-ABA 1: DADOS DO CLIENTE & PROPOSTA */}
                  {editSubTab === "client" && (
                    <div className="space-y-4">
                      {/* Vínculo Rápido com Clientes Cadastrados ou Leads */}
                      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                            Puxar Dados de Cliente ou Lead Existente
                          </span>
                          <span className="text-[10px] text-gray-400">
                            Selecione para preencher dados cadastrais e ambientes automaticamente
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-gray-400 font-bold block mb-1">Leads do Funil:</label>
                            <select
                              value={currentQuote.leadId || ""}
                              onChange={e => {
                                const lId = String(e.target.value);
                                const l = leads.find(item => String(item.id) === lId);
                                if (l) {
                                  let updatedItems = [...currentQuote.items];
                                  const isCurrentlyEmpty = updatedItems.length === 0 || 
                                    (updatedItems.length === 1 && !updatedItems[0].environment && (Number(updatedItems[0].unitPrice) || 0) === 0);
                                  
                                  if (isCurrentlyEmpty && l.rooms) {
                                    const roomsArr = Array.isArray(l.rooms) ? l.rooms : String(l.rooms).split(",").map(r => r.trim()).filter(Boolean);
                                    if (roomsArr.length > 0) {
                                      updatedItems = roomsArr.map((r, idx) => ({
                                        itemOrder: idx + 1,
                                        itemType: "produto",
                                        environment: r,
                                        description: `Mobiliário sob medida para ${r}`,
                                        quantity: 1,
                                        unitMeasure: "UN",
                                        unitPrice: 0,
                                        totalPrice: 0,
                                        ncm: "9403.60.00",
                                        cfop: "5101"
                                      }));
                                    }
                                  }

                                  setCurrentQuote(prev => ({
                                    ...prev,
                                    leadId: Number(l.id) || null,
                                    clientName: l.name,
                                    clientPhone: l.phone,
                                    clientEmail: l.email || "",
                                    items: updatedItems
                                  }));
                                }
                              }}
                              className="w-full bg-[#181818] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            >
                              <option value="">-- Selecionar Lead do Funil --</option>
                              {leads.map(l => (
                                <option key={l.id} value={l.id}>{l.name} ({l.phone})</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] text-gray-400 font-bold block mb-1">Clientes Cadastrados:</label>
                            <select
                              value={currentQuote.clientId || ""}
                              onChange={e => {
                                const cId = Number(e.target.value);
                                const c = registeredClients.find(item => item.id === cId);
                                if (c) {
                                  setCurrentQuote(prev => ({
                                    ...prev,
                                    clientId: c.id,
                                    clientName: c.name,
                                    clientCpfCnpj: c.cpfCnpj || "",
                                    clientPhone: c.phone || "",
                                    clientEmail: c.email || "",
                                    clientAddress: c.address || "",
                                    clientBairro: c.bairro || "",
                                    clientCity: c.city || "Balneário Arroio do Silva - SC"
                                  }));
                                }
                              }}
                              className="w-full bg-[#181818] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            >
                              <option value="">-- Selecionar Cliente Central --</option>
                              {registeredClients.map(c => (
                                <option key={c.id} value={c.id}>{c.name} {c.cpfCnpj ? `(${c.cpfCnpj})` : ""}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                            Nome Completo do Cliente *
                          </label>
                          <input
                            type="text"
                            value={currentQuote.clientName}
                            onChange={e => setCurrentQuote(prev => ({ ...prev, clientName: e.target.value }))}
                            className="w-full bg-[#181818] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            placeholder="Nome do Cliente"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                            CPF ou CNPJ
                          </label>
                          <input
                            type="text"
                            value={currentQuote.clientCpfCnpj}
                            onChange={e => setCurrentQuote(prev => ({ ...prev, clientCpfCnpj: e.target.value }))}
                            className="w-full bg-[#181818] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            placeholder="000.000.000-00"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                            Telefone / WhatsApp
                          </label>
                          <input
                            type="text"
                            value={currentQuote.clientPhone}
                            onChange={e => setCurrentQuote(prev => ({ ...prev, clientPhone: e.target.value }))}
                            className="w-full bg-[#181818] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            placeholder="(48) 99999-9999"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                            E-mail
                          </label>
                          <input
                            type="email"
                            value={currentQuote.clientEmail}
                            onChange={e => setCurrentQuote(prev => ({ ...prev, clientEmail: e.target.value }))}
                            className="w-full bg-[#181818] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            placeholder="cliente@exemplo.com"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                            Endereço Completo de Instalação da Obra
                          </label>
                          <input
                            type="text"
                            value={currentQuote.clientAddress}
                            onChange={e => setCurrentQuote(prev => ({ ...prev, clientAddress: e.target.value }))}
                            className="w-full bg-[#181818] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            placeholder="Rua, número, complemento"
                          />
                        </div>
                      </div>

                      {/* Botão de avanço rápido */}
                      <div className="pt-4 border-t border-white/5 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setEditSubTab("items")}
                          className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
                        >
                          Avançar para Itens & Ambientes <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SUB-ABA 2: GRADE DE ITENS (TIPO NF) */}
                  {editSubTab === "items" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">
                            Discriminação dos Ambientes e Peças
                          </h4>
                          <p className="text-[11px] text-gray-400">
                            Informe cada ambiente, quantidade e valor unitário. O total é calculado automaticamente.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddItem}
                          className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus size={14} /> Adicionar Ambiente
                        </button>
                      </div>

                      {/* TABELA DE ITENS ESTILO NF */}
                      <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0d0d0d]">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-wider text-gray-400">
                              <th className="py-2.5 px-3 w-10 text-center">Item</th>
                              <th className="py-2.5 px-3 w-48">Ambiente</th>
                              <th className="py-2.5 px-3">Descrição / Especificação do MDF</th>
                              <th className="py-2.5 px-3 w-16 text-center">Qtd</th>
                              <th className="py-2.5 px-3 w-28 text-right">Unitário (R$)</th>
                              <th className="py-2.5 px-3 w-28 text-right">Total (R$)</th>
                              <th className="py-2.5 px-3 w-10 text-center"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {currentQuote.items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-2 px-3 text-center text-gray-500 font-mono font-bold">
                                  {String(idx + 1).padStart(2, "0")}
                                </td>

                                {/* Ambiente com sugestões */}
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    list={`envs-${idx}`}
                                    value={item.environment}
                                    onChange={e => handleUpdateItem(idx, { environment: e.target.value })}
                                    className="w-full bg-[#181818] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                    placeholder="Ex: Cozinha, Quarto"
                                  />
                                  <datalist id={`envs-${idx}`}>
                                    {COMMON_ENVIRONMENTS.map(env => (
                                      <option key={env} value={env} />
                                    ))}
                                  </datalist>
                                </td>

                                {/* Descrição Técnica */}
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    value={item.description}
                                    onChange={e => handleUpdateItem(idx, { description: e.target.value })}
                                    className="w-full bg-[#181818] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                    placeholder="Ex: MDF Branco c/ frentes Cinza Urbe e amortecedores"
                                  />
                                </td>

                                {/* Quantidade */}
                                <td className="py-2 px-3 text-center">
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={e => handleUpdateItem(idx, { quantity: Number(e.target.value) || 1 })}
                                    className="w-14 text-center bg-[#181818] border border-white/10 rounded px-1 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                  />
                                </td>

                                {/* Valor Unitário */}
                                <td className="py-2 px-3 text-right">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.unitPrice || ""}
                                    onChange={e => handleUpdateItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                                    className="w-24 text-right bg-[#181818] border border-white/10 rounded px-2 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-amber-500"
                                    placeholder="0,00"
                                  />
                                </td>

                                {/* Total Linha */}
                                <td className="py-2 px-3 text-right font-black text-white">
                                  R$ {Number(item.totalPrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </td>

                                {/* Excluir Linha */}
                                <td className="py-2 px-3 text-center">
                                  {currentQuote.items.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveItem(idx)}
                                      className="p-1 text-gray-500 hover:text-rose-400 transition-colors"
                                      title="Remover Item"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* CARD RESUMO DE TOTAIS */}
                      <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-[#111] rounded-xl border border-white/5 gap-4">
                        <div className="text-xs text-gray-400">
                          Total de <span className="text-white font-bold">{currentQuote.items.length}</span> ambiente(s) orçado(s).
                        </div>
                        <div className="flex items-center gap-6">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-500 block">Subtotal dos Itens</span>
                            <span className="text-sm font-black text-white">
                              R$ {currentQuote.subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-emerald-500 block">Total Líquido Proposta</span>
                            <span className="text-lg font-black text-emerald-400">
                              R$ {currentQuote.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Navegação entre abas */}
                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setEditSubTab("client")}
                          className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                        >
                          ← Voltar para Dados do Cliente
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditSubTab("payment")}
                          className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
                        >
                          Avançar para Pagamento & Prazos <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SUB-ABA 3: FORMAS DE PAGAMENTO & PRAZOS */}
                  {editSubTab === "payment" && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Subtotal */}
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                            Subtotal dos Itens
                          </label>
                          <input
                            type="text"
                            disabled
                            value={`R$ ${currentQuote.subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                            className="w-full bg-[#181818] border border-white/5 rounded-lg px-3 py-2 text-xs text-gray-400 font-bold"
                          />
                        </div>

                        {/* Desconto */}
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                            Desconto Comercial (R$)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={currentQuote.discountValue || ""}
                            onChange={e => recalculateQuote({ discountValue: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-[#181818] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            placeholder="0,00"
                          />
                        </div>

                        {/* Total Final */}
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                            Valor Total da Proposta
                          </label>
                          <input
                            type="text"
                            disabled
                            value={`R$ ${currentQuote.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                            className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 text-xs text-emerald-400 font-black"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-[#111] rounded-xl border border-white/5 space-y-4">
                        <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                          Condições de Pagamento
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Entrada / Sinal */}
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                              Entrada / Sinal (R$)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={currentQuote.downPayment || ""}
                              onChange={e => recalculateQuote({ downPayment: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-[#181818] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                              placeholder="0,00"
                            />
                          </div>

                          {/* Meio da Entrada */}
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                              Forma da Entrada
                            </label>
                            <select
                              value={currentQuote.downPaymentMethod}
                              onChange={e => recalculateQuote({ downPaymentMethod: e.target.value })}
                              className="w-full bg-[#181818] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            >
                              <option value="PIX">PIX</option>
                              <option value="Dinheiro">Dinheiro</option>
                              <option value="Transferência Bancária">Transferência Bancária / TED</option>
                              <option value="Cartão de Débito">Cartão de Débito</option>
                            </select>
                          </div>

                          {/* Saldo Restante */}
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                              Saldo Restante (R$)
                            </label>
                            <input
                              type="text"
                              disabled
                              value={`R$ ${currentQuote.remainingBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                              className="w-full bg-[#181818] border border-white/5 rounded-lg px-3 py-2 text-xs text-white font-bold"
                            />
                          </div>

                          {/* Parcelamento no Cartão */}
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                              Parcelas no Cartão (Máx. 12x)
                            </label>
                            <div className="flex items-center gap-2">
                              <select
                                value={currentQuote.installmentsCount}
                                onChange={e => recalculateQuote({ installmentsCount: Number(e.target.value) || 1 })}
                                className="w-24 bg-[#181818] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                              >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                                  <option key={n} value={n}>{n}x</option>
                                ))}
                              </select>
                              <span className="text-xs text-gray-400">
                                de R$ {currentQuote.cardInstallmentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Descritivo Comercial das Condições */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              Texto Comercial das Condições de Pagamento
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const total = currentQuote.totalValue;
                                const down = currentQuote.downPayment;
                                const rem = currentQuote.remainingBalance;
                                const inst = currentQuote.installmentsCount;
                                const text = total > 0
                                  ? down > 0 
                                    ? `Entrada de R$ ${down.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} no ${currentQuote.downPaymentMethod} + Saldo de R$ ${rem.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em até ${inst}x no ${currentQuote.remainingPaymentMethod}.`
                                    : `Valor total de R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em até ${inst}x no ${currentQuote.remainingPaymentMethod}.`
                                  : "";
                                setCurrentQuote(prev => ({ ...prev, paymentTerms: text }));
                              }}
                              className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                            >
                              Gerar Texto Automático
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={currentQuote.paymentTerms}
                            onChange={e => setCurrentQuote(prev => ({ ...prev, paymentTerms: e.target.value }))}
                            className="w-full bg-[#181818] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                            placeholder="Ex: Entrada de R$ 3.000 no PIX + 10x de R$ 800 no cartão de crédito na assinatura."
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                              Prazo de Fabricação & Montagem (Dias Úteis)
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={currentQuote.deliveryDays}
                              onChange={e => setCurrentQuote(prev => ({ ...prev, deliveryDays: Number(e.target.value) || 35 }))}
                              className="w-full bg-[#181818] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                              Validade da Proposta (Data)
                            </label>
                            <input
                              type="date"
                              value={currentQuote.validUntil}
                              onChange={e => setCurrentQuote(prev => ({ ...prev, validUntil: e.target.value }))}
                              className="w-full bg-[#181818] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Navegação */}
                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setEditSubTab("items")}
                          className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                        >
                          ← Voltar para Grade de Itens
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* BARRA DE AÇÕES DO MODAL */}
                <div className="p-4 border-t border-white/10 bg-[#161616] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("preview")}
                      className="bg-white/5 hover:bg-white/10 text-amber-400 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Eye size={14} /> Pré-visualizar
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveQuote}
                      disabled={isSaving}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20 flex items-center gap-2 uppercase tracking-wider"
                    >
                      {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />} Salvar Orçamento
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CONTEÚDO: ABA PRÉ-VISUALIZAÇÃO & IMPRESSÃO EXECUTIVA */}
            {activeTab === "preview" && (
              <div className="flex-1 flex flex-col overflow-hidden bg-white text-black">
                {/* BARRA DE IMPRESSÃO */}
                <div className="bg-[#1a1a1a] p-3 px-5 flex items-center justify-between text-white border-b border-white/10">
                  <span className="text-xs font-bold text-gray-300">
                    Layout Executivo de Apresentação (Pronto para A4 e PDF)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 uppercase"
                    >
                      <Printer size={14} /> Imprimir / Salvar PDF
                    </button>
                  </div>
                </div>

                {/* FOLHA A4 DE IMPRESSÃO */}
                <div className="flex-1 overflow-y-auto p-8 sm:p-12 space-y-6 max-w-3xl mx-auto w-full text-neutral-800 font-sans print:p-0">
                  {/* CABEÇALHO */}
                  <div className="flex items-center justify-between border-b-2 border-neutral-800 pb-5">
                    <div className="flex items-center gap-4">
                      <img src={logoDumar} alt="Dumar Móveis Planejados" className="h-16 w-auto object-contain rounded" />
                      <div>
                        <h1 className="text-xl font-black uppercase tracking-wider text-black">
                          Dumar Móveis Planejados Ltda
                        </h1>
                        <p className="text-[11px] text-neutral-600">CNPJ: 42.588.140/0001-72</p>
                        <p className="text-[11px] text-neutral-600">Av. Santa Catarina, 551 sala 205, Centro - Balneário Arroio do Silva/SC</p>
                        <p className="text-[11px] text-neutral-600">WhatsApp: (48) 98848-6827 • dumarmoveisplanejados@gmail.com</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-black bg-neutral-100 border border-neutral-300 px-3 py-1 rounded block">
                        {currentQuote.quoteNumber}
                      </span>
                      <span className="text-[10px] text-neutral-500 mt-1 block">
                        Emissão: {new Date(currentQuote.quoteDate + "T12:00:00").toLocaleDateString("pt-BR")}
                      </span>
                      <span className="text-[10px] text-neutral-500 block">
                        Validade: {new Date(currentQuote.validUntil + "T12:00:00").toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>

                  {/* DADOS DO CLIENTE */}
                  <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-neutral-900 text-sm mb-1">{currentQuote.clientName}</div>
                    <div className="grid grid-cols-2 gap-2 text-neutral-700">
                      <div><span className="font-semibold">Telefone:</span> {currentQuote.clientPhone || "Não informado"}</div>
                      <div><span className="font-semibold">CPF/CNPJ:</span> {currentQuote.clientCpfCnpj || "Não informado"}</div>
                      <div className="col-span-2"><span className="font-semibold">Endereço da Obra:</span> {currentQuote.clientAddress || "Balneário Arroio do Silva - SC"}</div>
                    </div>
                  </div>

                  {/* GRADE DE ITENS TIPO NF */}
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-neutral-900 mb-2 border-b border-neutral-300 pb-1">
                      Discriminação dos Ambientes e Serviços
                    </h2>
                    <table className="w-full text-left text-xs border border-neutral-300 border-collapse">
                      <thead>
                        <tr className="bg-neutral-100 text-[10px] font-bold uppercase text-neutral-700 border-b border-neutral-300">
                          <th className="p-2 w-10 text-center border-r border-neutral-300">Item</th>
                          <th className="p-2 w-48 border-r border-neutral-300">Ambiente</th>
                          <th className="p-2 border-r border-neutral-300">Descrição Técnica / Padrões MDF</th>
                          <th className="p-2 w-14 text-center border-r border-neutral-300">Qtd</th>
                          <th className="p-2 w-24 text-right border-r border-neutral-300">Unitário (R$)</th>
                          <th className="p-2 w-28 text-right">Total (R$)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {currentQuote.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-2 text-center font-mono border-r border-neutral-200">{String(idx + 1).padStart(2, "0")}</td>
                            <td className="p-2 font-bold text-neutral-900 border-r border-neutral-200">{item.environment}</td>
                            <td className="p-2 text-neutral-700 border-r border-neutral-200">{item.description}</td>
                            <td className="p-2 text-center border-r border-neutral-200">{item.quantity}</td>
                            <td className="p-2 text-right border-r border-neutral-200">
                              {Number(item.unitPrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 text-right font-black text-neutral-900">
                              {Number(item.totalPrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* RESUMO FINANCEIRO E CONDIÇÕES */}
                  <div className="grid grid-cols-2 gap-4 border border-neutral-200 p-4 rounded-lg bg-neutral-50 text-xs">
                    <div>
                      <h3 className="font-bold uppercase tracking-wider text-neutral-900 mb-1">Condições de Pagamento</h3>
                      <p className="text-neutral-700 whitespace-pre-line">{currentQuote.paymentTerms}</p>
                      <p className="mt-2 text-neutral-600"><span className="font-semibold">Prazo de Fabricação:</span> {currentQuote.deliveryDays} dias úteis.</p>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-neutral-600">Subtotal dos Itens: R$ {currentQuote.subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                      {currentQuote.discountValue > 0 && (
                        <div className="text-emerald-700">Desconto Comercial: - R$ {currentQuote.discountValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                      )}
                      <div className="text-base font-black text-neutral-900 pt-2 border-t border-neutral-300">
                        Total da Proposta: R$ {currentQuote.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* ASSINATURAS */}
                  <div className="pt-10 grid grid-cols-2 gap-10 text-center text-xs text-neutral-600">
                    <div className="border-t border-neutral-400 pt-2">
                      <div className="font-bold text-neutral-900">Dumar Móveis Planejados Ltda</div>
                      <div>Consultor Comercial / Projetista</div>
                    </div>

                    <div className="border-t border-neutral-400 pt-2">
                      <div className="font-bold text-neutral-900">{currentQuote.clientName}</div>
                      <div>Aceite da Proposta Comercial</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
