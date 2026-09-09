import React, { useState, useEffect, useMemo } from "react";
import {
  DollarSign, FileText, CheckCircle2, Clock, AlertCircle, TrendingUp,
  TrendingDown, Plus, Search, Filter, Trash2, Edit3, Download, Check,
  ArrowUpRight, ArrowDownRight, Tag, Calendar, CreditCard, UserCheck, X,
  Layers, Zap, Truck, ChevronDown, ChevronRight, Repeat, CheckSquare
} from "lucide-react";

import { Lead } from "./types";
import { Supplier } from "@shared/schema";
import { useConfirmDialog } from "../ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import CRMContractsView from "./crm-contracts-view";
import CRMSuppliersModal from "./crm-suppliers-modal";

export interface FinancialTransaction {
  id: number;
  description: string;
  type: "receita" | "despesa";
  amount: number;
  category: string;
  status: "pago" | "pendente" | "atrasado";
  dueDate: string;
  paymentDate?: string;
  paymentMethod: string;
  leadId?: number | null;
  supplierId?: number | null;
  supplierName?: string;
  isRecurring?: boolean;
  recurrenceGroup?: string;
  installmentIndex?: number;
  notes?: string;
  createdAt?: string;
}

export interface RecurrenceGroupSummary {
  groupId: string;
  baseTitle: string;
  category: string;
  type: "receita" | "despesa";
  supplierName?: string;
  supplierId?: number | null;
  paymentMethod: string;
  monthlyAmount: number;
  totalAmount: number;
  paidCount: number;
  totalCount: number;
  nextDueDate: string;
  nextPendingTx?: FinancialTransaction;
  transactions: FinancialTransaction[];
}


interface CRMFinanceiroProps {
  leads: Lead[];
  setSelectedLead?: (lead: Lead) => void;
}

const CATEGORIES = [
  { id: "venda_marcenaria", label: "Venda de Marcenaria / Projeto", type: "receita" },
  { id: "entrada_contrato", label: "Entrada de Contrato", type: "receita" },
  { id: "materia_prima", label: "Matéria-prima (MDF/Madeira)", type: "despesa" },
  { id: "ferragens", label: "Ferragens & Acessórios", type: "despesa" },
  { id: "comissao", label: "Comissão de Venda / Projetista", type: "despesa" },
  { id: "frete_montagem", label: "Frete & Equipe de Montagem", type: "despesa" },
  { id: "administrativo", label: "Custo Fixo / Administrativo", type: "despesa" },
  { id: "impostos", label: "Impostos & Taxas", type: "despesa" },
  { id: "outros", label: "Outros Lançamentos", type: "both" }
];

export default function CRMFinanceiro({ leads, setSelectedLead }: CRMFinanceiroProps) {
  const [financialTab, setFinancialTab] = useState<"cashflow" | "contracts">("cashflow");
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "receita" | "despesa">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pago" | "pendente" | "atrasado">("all");
  const [periodFilter, setPeriodFilter] = useState<"all" | "this_month" | "last_month" | "year">("all");
  const [sortBy, setSortBy] = useState<"due_asc" | "due_desc" | "amount_desc" | "amount_asc" | "status">("due_asc");
  const [groupByRecurring, setGroupByRecurring] = useState<boolean>(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isSendingAlert, setIsSendingAlert] = useState(false);


  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };


  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuppliersModalOpen, setIsSuppliersModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<FinancialTransaction | null>(null);

  // Modal Edição de Grupo Recorrente
  const [editingGroup, setEditingGroup] = useState<RecurrenceGroupSummary | null>(null);
  const [groupFormBaseTitle, setGroupFormBaseTitle] = useState("");
  const [groupFormAmount, setGroupFormAmount] = useState("");
  const [groupFormCategory, setGroupFormCategory] = useState("");
  const [groupFormSupplierId, setGroupFormSupplierId] = useState("");
  const [groupFormSupplierName, setGroupFormSupplierName] = useState("");
  const [groupFormPaymentMethod, setGroupFormPaymentMethod] = useState("PIX");
  const [groupFormScope, setGroupFormScope] = useState<"all" | "pending">("all");

  // Form State
  const [formType, setFormType] = useState<"receita" | "despesa">("receita");
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("venda_marcenaria");
  const [formStatus, setFormStatus] = useState<"pago" | "pendente" | "atrasado">("pago");
  const [formDueDate, setFormDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [formPaymentDate, setFormPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [formPaymentMethod, setFormPaymentMethod] = useState("PIX");
  const [formLeadId, setFormLeadId] = useState<string>("");
  const [formSupplierId, setFormSupplierId] = useState<string>("");
  const [formSupplierName, setFormSupplierName] = useState<string>("");
  const [formNotes, setFormNotes] = useState("");
  const [formIsRecurring, setFormIsRecurring] = useState(false);
  const [formRecurringMonths, setFormRecurringMonths] = useState<number>(12);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const { confirm, showAlert } = useConfirmDialog();
  const { toast } = useToast();

  // Helper para normalizar valores monetários digitados (suporta "104,90", "104.90", "1.250,00", etc.)
  const parseMonetaryInput = (val: string): number => {
    if (!val) return 0;
    let clean = val.toString().replace(/R\$\s?/, "").trim();
    if (clean.includes(",") && clean.includes(".")) {
      clean = clean.replace(/\./g, "").replace(",", ".");
    } else if (clean.includes(",")) {
      clean = clean.replace(",", ".");
    }
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parseFloat(parsed.toFixed(2));
  };


  // Atalhos Rápidos de Despesas Fixas (Custos Fixos Dumar)
  const applyFixedExpensePreset = (preset: { desc: string; category: string; amount?: string; method?: string; supplierKeyword?: string }) => {
    setFormType("despesa");
    setFormDescription(preset.desc);
    setFormCategory(preset.category);
    if (preset.amount) setFormAmount(preset.amount);
    if (preset.method) setFormPaymentMethod(preset.method);

    // Tenta encontrar fornecedor cadastrado correspondente
    if (preset.supplierKeyword && suppliersList.length > 0) {
      const match = suppliersList.find(s =>
        s.name.toLowerCase().includes(preset.supplierKeyword!.toLowerCase()) ||
        (s.tradeName && s.tradeName.toLowerCase().includes(preset.supplierKeyword!.toLowerCase()))
      );
      if (match) {
        setFormSupplierId(match.id.toString());
        setFormSupplierName(match.tradeName || match.name);
      }
    }

    setFormIsRecurring(true);
    setFormStatus("pendente");
  };

  // Carregar transações
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/financial/transactions");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error("Erro ao carregar lançamentos financeiros:", err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar fornecedores para dropdown
  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers");
      if (res.ok) {
        const data = await res.json();
        setSuppliersList(data);
      }
    } catch (err) {
      console.error("Erro ao carregar lista de fornecedores:", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchSuppliers();
  }, []);

  // Abrir Modal de Novo Lançamento
  const handleOpenNewModal = (type: "receita" | "despesa" = "receita") => {
    setEditingTx(null);
    setFormType(type);
    setFormDescription("");
    setFormAmount("");
    setFormCategory(type === "receita" ? "venda_marcenaria" : "materia_prima");
    setFormStatus("pago");
    const today = new Date().toISOString().split("T")[0];
    setFormDueDate(today);
    setFormPaymentDate(today);
    setFormPaymentMethod("PIX");
    setFormLeadId("");
    setFormSupplierId("");
    setFormSupplierName("");
    setFormNotes("");
    setFormIsRecurring(false);
    setFormRecurringMonths(12);
    setIsModalOpen(true);
  };

  // Abrir Modal de Edição
  const handleOpenEditModal = (tx: FinancialTransaction) => {
    setEditingTx(tx);
    setFormType(tx.type);
    setFormDescription(tx.description);
    setFormAmount(tx.amount.toString());
    setFormCategory(tx.category);
    setFormStatus(tx.status);
    setFormDueDate(tx.dueDate || new Date().toISOString().split("T")[0]);
    setFormPaymentDate(tx.paymentDate || new Date().toISOString().split("T")[0]);
    setFormPaymentMethod(tx.paymentMethod || "PIX");
    setFormLeadId(tx.leadId ? tx.leadId.toString() : "");
    setFormSupplierId(tx.supplierId ? tx.supplierId.toString() : "");
    setFormSupplierName(tx.supplierName || "");
    setFormNotes(tx.notes || "");
    setFormIsRecurring(Boolean((tx as any).isRecurring));
    setFormRecurringMonths(12);
    setIsModalOpen(true);
  };

  // Salvar (Criar ou Atualizar)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseMonetaryInput(formAmount);

    if (!formDescription.trim()) {
      await showAlert({
        title: "Descrição Obrigatória",
        message: "Por favor, informe a descrição do lançamento.",
        variant: "warning",
      });
      return;
    }

    if (numericAmount <= 0) {
      await showAlert({
        title: "Valor Inválido",
        message: "Por favor, digite um valor maior que zero (ex: 104,90 ou 1500).",
        variant: "warning",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let res;
      if (editingTx) {
        const payload = {
          description: formDescription.trim(),
          type: formType,
          amount: numericAmount,
          category: formCategory,
          status: formStatus,
          dueDate: formDueDate,
          paymentDate: formStatus === "pago" ? formPaymentDate : "",
          paymentMethod: formPaymentMethod,
          leadId: formLeadId ? Number(formLeadId) : null,
          supplierId: formSupplierId ? Number(formSupplierId) : null,
          supplierName: formSupplierName.trim(),
          notes: formNotes.trim()
        };
        res = await fetch(`/api/financial/transactions/${editingTx.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else if (formIsRecurring && formType === "despesa") {
        // Criação de lote de despesas fixas recorrentes
        const payload = {
          description: formDescription.trim(),
          type: formType,
          amount: numericAmount,
          category: formCategory,
          status: formStatus,
          baseDueDate: formDueDate,
          paymentMethod: formPaymentMethod,
          monthsCount: formRecurringMonths,
          supplierId: formSupplierId ? Number(formSupplierId) : null,
          supplierName: formSupplierName.trim(),
          notes: formNotes.trim()
        };
        res = await fetch("/api/financial/transactions/recurring", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        const payload = {
          description: formDescription.trim(),
          type: formType,
          amount: numericAmount,
          category: formCategory,
          status: formStatus,
          dueDate: formDueDate,
          paymentDate: formStatus === "pago" ? formPaymentDate : "",
          paymentMethod: formPaymentMethod,
          leadId: formLeadId ? Number(formLeadId) : null,
          supplierId: formSupplierId ? Number(formSupplierId) : null,
          supplierName: formSupplierName.trim(),
          notes: formNotes.trim()
        };
        res = await fetch("/api/financial/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setIsModalOpen(false);
        toast({
          title: editingTx ? "Lançamento Atualizado" : "Lançamento Realizado",
          description: `${formDescription} (${numericAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}) salvo com sucesso!`,
        });
        fetchTransactions();
      } else {
        const errJson = await res.json().catch(() => ({}));
        await showAlert({
          title: "Erro ao Salvar",
          message: errJson.message || "Erro ao salvar lançamento financeiro.",
          variant: "danger",
        });
      }
    } catch (err) {
      console.error(err);
      await showAlert({
        title: "Erro de Conexão",
        message: "Erro ao conectar com o servidor.",
        variant: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Alterar Status Rápido (Baixa no Titulo)
  const handleToggleStatus = async (tx: FinancialTransaction) => {
    const nextStatus = tx.status === "pago" ? "pendente" : "pago";
    const today = new Date().toISOString().split("T")[0];

    try {
      const res = await fetch(`/api/financial/transactions/${tx.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          paymentDate: nextStatus === "pago" ? today : ""
        })
      });

      if (res.ok) {
        toast({
          title: nextStatus === "pago" ? "Título Baixado" : "Status Alterado",
          description: `Lançamento marcado como ${nextStatus === "pago" ? "Pago" : "Pendente"}.`,
        });
        fetchTransactions();
      }
    } catch (err) {
      console.error("Erro ao alterar status:", err);
    }
  };

  // Excluir Lançamento
  const handleDeleteTransaction = async (id: number) => {
    const ok = await confirm({
      title: "Excluir Lançamento Financeiro",
      message: "Tem certeza que deseja excluir este lançamento financeiro?\nEsta operação removerá o registro do fluxo de caixa.",
      variant: "danger",
      confirmText: "Sim, Excluir",
    });

    if (!ok) return;

    try {
      const res = await fetch(`/api/financial/transactions/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast({
          title: "Lançamento Excluído",
          description: "O lançamento financeiro foi removido com sucesso.",
        });
        fetchTransactions();
      } else {
        await showAlert({
          title: "Erro ao Excluir",
          message: "Não foi possível excluir o lançamento.",
          variant: "danger",
        });
      }
    } catch (err) {
      console.error("Erro ao excluir transação:", err);
      await showAlert({
        title: "Erro de Conexão",
        message: "Falha ao conectar com o servidor.",
        variant: "danger",
      });
    }
  };

  // Abrir Modal de Edição de Grupo Recorrente
  const handleOpenEditGroupModal = (group: RecurrenceGroupSummary) => {
    setEditingGroup(group);
    setGroupFormBaseTitle(group.baseTitle);
    setGroupFormAmount(String(group.monthlyAmount));
    setGroupFormCategory(group.category);
    setGroupFormSupplierId(group.supplierId ? String(group.supplierId) : "");
    setGroupFormSupplierName(group.supplierName || "");
    setGroupFormPaymentMethod(group.paymentMethod || "PIX");
    setGroupFormScope("all");
  };

  // Salvar Alterações em Lote de Grupo Recorrente (Valor, Nome, etc.)
  const handleSaveEditGroup = async () => {
    if (!editingGroup) return;
    const numAmount = parseMonetaryInput(groupFormAmount);
    if (numAmount <= 0) {
      toast({
        title: "Valor Inválido",
        description: "Informe um valor maior que zero para as parcelas.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updates: any = {
        amount: numAmount,
        category: groupFormCategory,
        paymentMethod: groupFormPaymentMethod,
        supplierId: groupFormSupplierId ? parseInt(groupFormSupplierId) : null,
        supplierName: groupFormSupplierName.trim() || null,
      };

      const targetTxs = groupFormScope === "pending"
        ? editingGroup.transactions.filter(t => t.status !== "pago")
        : editingGroup.transactions;

      const idsToUpdate = targetTxs.map(t => t.id);

      const res = await fetch("/api/financial/transactions/batch-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: idsToUpdate, updates }),
      });

      if (!res.ok) throw new Error("Erro ao atualizar parcelas");

      // Se alterou o título base, atualiza as descrições preservando o índice (ex: "Internet Fibra (1/12)")
      if (groupFormBaseTitle.trim() && groupFormBaseTitle.trim() !== editingGroup.baseTitle) {
        await Promise.all(
          targetTxs.map((t, idx) => {
            const instSuffix = ` (${t.installmentIndex || (idx + 1)}/${editingGroup.totalCount})`;
            return fetch(`/api/financial/transactions/${t.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ description: `${groupFormBaseTitle.trim()}${instSuffix}` }),
            });
          })
        );
      }

      toast({
        title: "Lote Atualizado",
        description: `Todas as parcelas de "${groupFormBaseTitle || editingGroup.baseTitle}" foram atualizadas para ${numAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}!`,
      });

      setEditingGroup(null);
      fetchTransactions();
    } catch (err) {
      console.error("Erro ao salvar grupo recorrente:", err);
      toast({
        title: "Erro na Atualização",
        description: "Não foi possível salvar as alterações das parcelas.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Excluir TODAS as Parcelas do Grupo
  const handleDeleteRecurringGroup = async (group: RecurrenceGroupSummary) => {
    const ok = await confirm({
      title: `Excluir Todas as ${group.totalCount} Parcelas?`,
      message: `Tem certeza que deseja excluir TODAS as ${group.totalCount} parcelas de "${group.baseTitle}"?\nEsta ação removerá definitivamente todo o lote de custos recorrentes do fluxo de caixa.`,
      variant: "danger",
      confirmText: `Sim, Excluir ${group.totalCount} Parcelas`,
      cancelText: "Cancelar",
    });

    if (!ok) return;

    try {
      const ids = group.transactions.map(t => t.id);
      const res = await fetch("/api/financial/transactions/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      if (!res.ok) throw new Error("Erro ao excluir lote de parcelas");

      toast({
        title: "Lote Excluído",
        description: `Todas as ${group.totalCount} parcelas de "${group.baseTitle}" foram excluídas com sucesso.`,
      });

      setTransactions(prev => prev.filter(t => !ids.includes(t.id)));
    } catch (err) {
      console.error("Erro ao excluir lote:", err);
      toast({
        title: "Erro ao Excluir",
        description: "Não foi possível excluir o lote de parcelas.",
        variant: "destructive",
      });
    }
  };


  // Enviar Resumo de Contas do Dia Seguinte no WhatsApp do Paulo
  const handleSendWhatsAppAlert = async () => {
    const ok = await confirm({
      title: "Enviar Resumo de Contas no WhatsApp?",
      message: "Deseja enviar agora o resumo executivo das contas que vencem amanhã diretamente no WhatsApp do Paulo?\nO sistema enviará a lista detalhada com valores, forma de pagamento e saldo projetado.",
      confirmText: "Sim, Enviar via WhatsApp",
      cancelText: "Cancelar",
    });

    if (!ok) return;

    setIsSendingAlert(true);
    try {
      const res = await fetch("/api/financial/send-due-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Alerta Enviado no WhatsApp!",
          description: `Resumo enviado com sucesso para o Paulo (${data.totalItems} lançamentos de amanhã).`,
        });
      } else {
        throw new Error(data.message || "Erro ao disparar alerta");
      }
    } catch (err: any) {
      console.error("Erro ao enviar alerta via WhatsApp:", err);
      toast({
        title: "Erro no Envio",
        description: err.message || "Não foi possível enviar a mensagem pelo WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setIsSendingAlert(false);
    }
  };

  // Exportar para CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      showAlert({
        title: "Exportação Vazia",
        message: "Nenhum lançamento financeiro para exportar com os filtros atuais.",
        variant: "info",
      });
      return;
    }

    let csv = "ID,Data Vencimento,Data Pagamento,Tipo,Descricao,Categoria,Fornecedor,Valor (R$),Status,Forma Pagamento,Observacoes\n";
    filteredTransactions.forEach(t => {
      csv += `"${t.id}","${t.dueDate || ''}","${t.paymentDate || ''}","${t.type}","${t.description.replace(/"/g, '""')}","${t.category}","${(t.supplierName || '').replace(/"/g, '""')}","${t.amount}","${t.status}","${t.paymentMethod}","${(t.notes || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financeiro_dumar_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast({
      title: "Exportação Concluída",
      description: "Arquivo CSV gerado com sucesso!",
    });
  };

  // Filtragem dos lançamentos
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.supplierName && t.supplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === "all" || t.type === typeFilter;
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;

    let matchesPeriod = true;
    if (periodFilter !== "all" && t.dueDate) {
      const txDate = new Date(t.dueDate);
      const now = new Date();
      if (periodFilter === "this_month") {
        matchesPeriod = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      } else if (periodFilter === "last_month") {
        const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        matchesPeriod = txDate.getMonth() === lastM.getMonth() && txDate.getFullYear() === lastM.getFullYear();
      } else if (periodFilter === "year") {
        matchesPeriod = txDate.getFullYear() === now.getFullYear();
      }
    }

    return matchesSearch && matchesType && matchesStatus && matchesPeriod;
  });

  // Agrupamento & Ordenação Inteligente de Lançamentos
  const displayRows = useMemo(() => {
    if (!groupByRecurring) {
      const singleList = filteredTransactions.map(tx => ({ type: "single" as const, tx }));
      singleList.sort((a, b) => {
        if (sortBy === "due_asc") return (a.tx.dueDate || "9999").localeCompare(b.tx.dueDate || "9999");
        if (sortBy === "due_desc") return (b.tx.dueDate || "").localeCompare(a.tx.dueDate || "");
        if (sortBy === "amount_desc") return b.tx.amount - a.tx.amount;
        if (sortBy === "amount_asc") return a.tx.amount - b.tx.amount;
        if (sortBy === "status") {
          const w = (s: string) => (s === "atrasado" ? 0 : s === "pendente" ? 1 : 2);
          return w(a.tx.status) - w(b.tx.status);
        }
        return (a.tx.dueDate || "9999").localeCompare(b.tx.dueDate || "9999");
      });
      return singleList;
    }

    const groupMap = new Map<string, FinancialTransaction[]>();
    const singles: FinancialTransaction[] = [];

    const getRecurrenceKey = (tx: FinancialTransaction) => {
      if (tx.recurrenceGroup && tx.recurrenceGroup.trim().length > 0) {
        const base = tx.description.replace(/\s*\(\d+\/\d+\)\s*$/, "").trim();
        return { isRecurring: true, key: tx.recurrenceGroup, baseTitle: base || tx.description };
      }

      const match = tx.description.match(/^(.*?)\s*\((\d+)\/(\d+)\)$/);
      if (match || tx.isRecurring || tx.notes?.includes("Recorrente")) {
        const base = match ? match[1].trim() : tx.description.replace(/\s*\(\d+\/\d+\)\s*$/, "").trim();
        const key = `group-${tx.type}-${tx.category}-${base.toLowerCase()}-${tx.amount}`;
        return { isRecurring: true, key, baseTitle: base };
      }

      return { isRecurring: false, key: "", baseTitle: tx.description };
    };

    for (const tx of filteredTransactions) {
      const { isRecurring, key } = getRecurrenceKey(tx);
      if (isRecurring && key) {
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)!.push(tx);
      } else {
        singles.push(tx);
      }
    }

    type DisplayRowType =
      | { type: "single"; tx: FinancialTransaction }
      | { type: "group"; group: RecurrenceGroupSummary };

    const rows: DisplayRowType[] = [];

    groupMap.forEach((txList, gKey) => {
      txList.sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || "") || ((a.installmentIndex || 0) - (b.installmentIndex || 0)));

      const { baseTitle } = getRecurrenceKey(txList[0]);
      const first = txList[0];
      const paidCount = txList.filter(t => t.status === "pago").length;
      const totalCount = txList.length;
      const totalAmount = txList.reduce((sum, t) => sum + t.amount, 0);
      const monthlyAmount = first.amount;

      const pendingTxs = txList.filter(t => t.status !== "pago");
      const nextPending = pendingTxs[0];
      const nextDueDate = nextPending ? nextPending.dueDate : txList[txList.length - 1].dueDate;

      rows.push({
        type: "group",
        group: {
          groupId: gKey,
          baseTitle,
          category: first.category,
          type: first.type,
          supplierName: first.supplierName,
          supplierId: first.supplierId,
          paymentMethod: first.paymentMethod,
          monthlyAmount,
          totalAmount,
          paidCount,
          totalCount,
          nextDueDate,
          nextPendingTx: nextPending,
          transactions: txList
        }
      });
    });

    for (const s of singles) {
      rows.push({ type: "single", tx: s });
    }

    // Ordenação configurável das linhas principais
    rows.sort((a, b) => {
      const dateA = a.type === "group" ? (a.group.nextDueDate || "9999") : (a.tx.dueDate || "9999");
      const dateB = b.type === "group" ? (b.group.nextDueDate || "9999") : (b.tx.dueDate || "9999");

      const amtA = a.type === "group" ? a.group.monthlyAmount : a.tx.amount;
      const amtB = b.type === "group" ? b.group.monthlyAmount : b.tx.amount;

      if (sortBy === "due_asc") {
        return (dateA || "9999").localeCompare(dateB || "9999");
      }
      if (sortBy === "due_desc") {
        return (dateB || "").localeCompare(dateA || "");
      }
      if (sortBy === "amount_desc") {
        return amtB - amtA;
      }
      if (sortBy === "amount_asc") {
        return amtA - amtB;
      }
      if (sortBy === "status") {
        const getWeight = (row: DisplayRowType) => {
          if (row.type === "group") {
            return row.group.paidCount < row.group.totalCount ? 1 : 2;
          }
          return row.tx.status === "atrasado" ? 0 : row.tx.status === "pendente" ? 1 : 2;
        };
        return getWeight(a) - getWeight(b);
      }
      return (dateA || "9999").localeCompare(dateB || "9999");
    });

    return rows;
  }, [filteredTransactions, groupByRecurring, sortBy]);




  // Métricas Calculadas
  const totalReceitasPagas = transactions
    .filter(t => t.type === "receita" && t.status === "pago")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalDespesasPagas = transactions
    .filter(t => t.type === "despesa" && t.status === "pago")
    .reduce((acc, t) => acc + t.amount, 0);

  const lucroLiquido = totalReceitasPagas - totalDespesasPagas;
  const margemLucro = totalReceitasPagas > 0 ? Math.round((lucroLiquido / totalReceitasPagas) * 100) : 0;

  const contasAReceber = transactions
    .filter(t => t.type === "receita" && t.status !== "pago")
    .reduce((acc, t) => acc + t.amount, 0);

  const contasAPagar = transactions
    .filter(t => t.type === "despesa" && t.status !== "pago")
    .reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 bg-black/40 font-sans text-white">
      {/* SELETOR DE ABAS DO FINANCEIRO */}
      <div className="flex items-center gap-2 bg-[#0f0f0f] border border-white/10 p-1.5 rounded-2xl shadow-lg">
        <button
          onClick={() => setFinancialTab("cashflow")}
          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${financialTab === "cashflow"
              ? "bg-white text-black shadow-lg"
              : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
        >
          <DollarSign size={16} /> Lançamentos & Fluxo de Caixa
        </button>

        <button
          onClick={() => setFinancialTab("contracts")}
          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${financialTab === "contracts"
              ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
        >
          <FileText size={16} /> Contratos & Minuta Jurídica
        </button>
      </div>

      {/* RENDERIZAÇÃO DA ABA CONTRATOS */}
      {financialTab === "contracts" && (
        <CRMContractsView leads={leads} />
      )}

      {/* RENDERIZAÇÃO DA ABA FLUXO DE CAIXA */}
      {financialTab === "cashflow" && (
        <>
          {/* HEADER & METRICAS CHAVE COM MÁXIMA CLAREZA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* CARD 1: TOTAL RECEBIDO (ENTRADAS LIQUIDADAS) */}
            <div className="bg-[#0f0f0f] border border-emerald-500/20 p-5 rounded-2xl shadow-xl relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/40 transition-all">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all"></div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400/90 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Total Recebido (Entradas)
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <TrendingUp size={18} />
                </div>
              </div>

              <div className="my-3">
                <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                  {totalReceitasPagas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </h3>
              </div>

              <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                <span className="text-emerald-500/80 font-medium">✓ Faturamento liquidado</span>
                {contasAReceber > 0 && (
                  <span className="text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                    +{contasAReceber.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} a receber
                  </span>
                )}
              </div>
            </div>

            {/* CARD 2: TOTAL PAGO (DESPESAS LIQUIDADAS) */}
            <div className="bg-[#0f0f0f] border border-rose-500/20 p-5 rounded-2xl shadow-xl relative overflow-hidden flex flex-col justify-between group hover:border-rose-500/40 transition-all">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-all"></div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-rose-400/90 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  Total Pago (Despesas)
                </span>
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                  <TrendingDown size={18} />
                </div>
              </div>

              <div className="my-3">
                <h3 className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">
                  {totalDespesasPagas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </h3>
              </div>

              <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                <span className="text-rose-500/80 font-medium">↘ Custos & Compras pagas</span>
                {contasAPagar > 0 && (
                  <span className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    {contasAPagar.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} a pagar
                  </span>
                )}
              </div>
            </div>

            {/* CARD 3: SALDO EM CAIXA (LUCRO LÍQUIDO REAL) */}
            <div className={`bg-[#0f0f0f] border ${lucroLiquido >= 0 ? "border-amber-500/20 hover:border-amber-500/40" : "border-red-500/30 hover:border-red-500/50"} p-5 rounded-2xl shadow-xl relative overflow-hidden flex flex-col justify-between group transition-all`}>
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all"></div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                  <DollarSign size={13} className="text-amber-400" />
                  Saldo em Caixa (Lucro Real)
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <DollarSign size={18} />
                </div>
              </div>

              <div className="my-3">
                <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${lucroLiquido >= 0 ? "text-amber-400" : "text-red-400"}`}>
                  {lucroLiquido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </h3>
              </div>

              <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                <span className="text-gray-400 font-medium">Margem Operacional:</span>
                <span className={`font-bold px-2 py-0.5 rounded ${lucroLiquido >= 0 ? "bg-amber-500/20 text-amber-300" : "bg-red-500/20 text-red-300"}`}>
                  {margemLucro}%
                </span>
              </div>
            </div>

            {/* CARD 4: PREVISÃO DE CAIXA & PENDÊNCIAS FUTURAS */}
            <div className="bg-[#0f0f0f] border border-blue-500/20 hover:border-blue-500/40 p-5 rounded-2xl shadow-xl relative overflow-hidden flex flex-col justify-between group transition-all">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all"></div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-400/90 flex items-center gap-1.5">
                  <Clock size={13} className="text-blue-400" />
                  Previsão & Contas a Vencer
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <Calendar size={18} />
                </div>
              </div>

              {/* Grid 2 colunas com A Receber e A Pagar com clareza total */}
              <div className="my-2 grid grid-cols-2 gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                <div>
                  <span className="text-[10px] text-gray-400 block">⬆️ A Receber</span>
                  <span className="text-xs font-black text-emerald-400 block mt-0.5">
                    {contasAReceber.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">⬇️ A Pagar</span>
                  <span className="text-xs font-black text-rose-400 block mt-0.5">
                    {contasAPagar.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                <span className="text-gray-400 font-medium">Saldo Projetado:</span>
                <span className={`font-bold ${(lucroLiquido + contasAReceber - contasAPagar) >= 0 ? "text-blue-400" : "text-rose-400"}`}>
                  {(lucroLiquido + contasAReceber - contasAPagar).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            </div>

          </div>

          {/* CONTROLES DA TABELA & BOTÕES DE AÇÃO */}
          <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText size={18} className="text-amber-400" />
                  Gestão Financeira & Lançamentos de Caixa
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Controle completo de receitas, despesas, fornecedores e contratos de marcenaria</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleOpenNewModal("receita")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <Plus size={15} /> Nova Receita
                </button>

                <button
                  onClick={() => handleOpenNewModal("despesa")}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-rose-600/20"
                >
                  <Plus size={15} /> Nova Despesa
                </button>

                <button
                  onClick={handleSendWhatsAppAlert}
                  disabled={isSendingAlert}
                  className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                  title="Enviar no WhatsApp da Diretoria o resumo executivo das contas que vencem amanhã"
                >
                  <Zap size={15} className="text-emerald-400" />
                  {isSendingAlert ? "Enviando no WhatsApp..." : "Avisar Diretoria no Whats (Amanhã)"}
                </button>

                <button
                  onClick={() => setIsSuppliersModalOpen(true)}
                  className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  <Truck size={15} /> Fornecedores & Parceiros
                </button>

                <button
                  onClick={() => setGroupByRecurring(prev => !prev)}
                  className={`font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border ${groupByRecurring
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10"
                      : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  title="Agrupar ou desagrupar parcelas e custos fixos recorrentes"
                >
                  <Repeat size={15} className={groupByRecurring ? "text-amber-400" : ""} />
                  {groupByRecurring ? "Recorrências: Agrupadas" : "Recorrências: Expandidas"}
                </button>

                <button
                  onClick={handleExportCSV}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-white/10"
                >
                  <Download size={15} /> Exportar CSV
                </button>
              </div>
            </div>

            {/* FILTROS, BUSCA & ORDENAÇÃO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
              {/* Busca */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar lançamento..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/50"
                />
              </div>

              {/* Tipo */}
              <div>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-neutral-900">Todos os Tipos</option>
                  <option value="receita" className="bg-neutral-900">Receitas (Entradas)</option>
                  <option value="despesa" className="bg-neutral-900">Despesas (Saídas)</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-neutral-900">Todos os Status</option>
                  <option value="pago" className="bg-neutral-900">Pagos / Recebidos</option>
                  <option value="pendente" className="bg-neutral-900">Pendentes</option>
                  <option value="atrasado" className="bg-neutral-900">Atrasados</option>
                </select>
              </div>

              {/* Período */}
              <div>
                <select
                  value={periodFilter}
                  onChange={e => setPeriodFilter(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-neutral-900">Todo o Período</option>
                  <option value="this_month" className="bg-neutral-900">Este Mês</option>
                  <option value="last_month" className="bg-neutral-900">Mês Anterior</option>
                  <option value="year" className="bg-neutral-900">Este Ano</option>
                </select>
              </div>

              {/* Ordenação Inteligente por Data e Valor */}
              <div>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
                  title="Escolha o critério de ordenação da tabela"
                >
                  <option value="due_asc" className="bg-neutral-900 text-white">📅 Vencimento (Próximo 1º)</option>
                  <option value="due_desc" className="bg-neutral-900 text-white">📅 Vencimento (Distante 1º)</option>
                  <option value="amount_desc" className="bg-neutral-900 text-white">💰 Maior Valor (R$)</option>
                  <option value="amount_asc" className="bg-neutral-900 text-white">💰 Menor Valor (R$)</option>
                  <option value="status" className="bg-neutral-900 text-white">⚡ Pendentes Primeiro</option>
                </select>
              </div>
            </div>


            {/* TABELA DE LANÇAMENTOS */}
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 font-bold uppercase tracking-wider text-[10px] bg-white/[0.02]">
                    <th className="py-3 px-4 w-[120px]">Vencimento</th>
                    <th className="py-3 px-4 w-[90px]">Tipo</th>
                    <th className="py-3 px-4">Descrição / Fornecedor</th>
                    <th className="py-3 px-4 w-[140px] hidden md:table-cell">Categoria</th>
                    <th className="py-3 px-4 w-[90px] hidden sm:table-cell">Pagamento</th>
                    <th className="py-3 px-4 w-[130px]">Valor (R$)</th>
                    <th className="py-3 px-4 w-[135px]">Status</th>
                    <th className="py-3 px-4 w-[105px] text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {displayRows.map(row => {
                    if (row.type === "group") {
                      const { group } = row;
                      const isExpanded = expandedGroups.has(group.groupId);
                      const isReceita = group.type === "receita";
                      const isAllPaid = group.paidCount === group.totalCount;

                      const todayStr = new Date().toISOString().split("T")[0];
                      const tomorrowDate = new Date();
                      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
                      const tomorrowStr = tomorrowDate.toISOString().split("T")[0];

                      const isGroupToday = group.nextDueDate === todayStr && group.paidCount < group.totalCount;
                      const isGroupTomorrow = group.nextDueDate === tomorrowStr && group.paidCount < group.totalCount;

                      const categoryObj = CATEGORIES.find(c => c.id === group.category);
                      const categoryLabel = categoryObj ? categoryObj.label : group.category;

                      return (

                        <React.Fragment key={`frag-group-${group.groupId}`}>
                          {/* LINHA MASTER AGRUPADA */}
                          <tr
                            onClick={() => toggleGroup(group.groupId)}
                            className={`transition-all cursor-pointer border-l-4 shadow-sm ${isGroupToday
                                ? "bg-red-950/30 hover:bg-red-950/50 border-l-rose-500"
                                : isGroupTomorrow
                                  ? "bg-amber-950/30 hover:bg-amber-950/50 border-l-amber-400"
                                  : "bg-neutral-900/80 hover:bg-neutral-800/90 border-l-amber-500"
                              }`}
                          >
                            {/* Vencimento Próxima Parcela */}
                            <td className="py-3.5 px-4 text-gray-200 font-bold text-[11px]">
                              <div className="flex items-center gap-1.5">
                                <span className="text-amber-400 transition-transform">
                                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </span>
                                <div>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="text-[9px] text-gray-400 block font-normal">Próx. Vencimento:</span>
                                    {isGroupToday && (
                                      <span className="text-[9px] bg-rose-500/20 text-rose-300 font-black px-1.5 py-0.2 rounded border border-rose-500/40 animate-pulse">
                                        🚨 Vence Hoje
                                      </span>
                                    )}
                                    {isGroupTomorrow && (
                                      <span className="text-[9px] bg-amber-500/20 text-amber-300 font-black px-1.5 py-0.2 rounded border border-amber-500/40">
                                        ⚠️ Vence Amanhã
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-white font-bold">{group.nextDueDate ? new Date(group.nextDueDate + "T00:00:00").toLocaleDateString("pt-BR") : "-"}</span>
                                </div>
                              </div>
                            </td>


                            {/* Tipo */}
                            <td className="py-3.5 px-4">
                              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase inline-flex items-center gap-1.5 ${isReceita
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                  : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                }`}>
                                <Repeat size={11} className={isReceita ? "text-emerald-400" : "text-amber-400"} />
                                {isReceita ? "Receita Recorrente" : "Custo Fixo Recorrente"}
                              </span>
                            </td>

                            {/* Descrição & Resumo */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-white text-xs">{group.baseTitle}</span>
                                <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                                  <Layers size={10} /> {group.totalCount} Meses
                                </span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isAllPaid
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                    : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                  }`}>
                                  {group.paidCount} de {group.totalCount} Pagas ({Math.round((group.paidCount / group.totalCount) * 100)}%)
                                </span>
                              </div>

                              {group.supplierName && (
                                <div className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                                  <Truck size={11} className="text-amber-400" /> Fornecedor: {group.supplierName}
                                </div>
                              )}
                            </td>

                            {/* Categoria */}
                            <td className="py-3.5 px-4 text-gray-300 text-[11px] max-w-[150px] truncate">
                              {categoryLabel}
                            </td>

                            {/* Forma de Pagamento */}
                            <td className="py-3.5 px-4 text-gray-300 text-[11px]">
                              {group.paymentMethod || "PIX"}
                            </td>

                            {/* Valor */}
                            <td className={`py-3.5 px-4 font-black text-xs ${isReceita ? "text-emerald-400" : "text-rose-400"}`}>
                              <div>{isReceita ? "+" : "-"} {group.monthlyAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}<span className="text-[10px] font-normal text-gray-400">/mês</span></div>
                              <div className="text-[10px] font-normal text-gray-400">Total: {group.totalAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                              {group.nextPendingTx ? (
                                <button
                                  onClick={() => handleToggleStatus(group.nextPendingTx!)}
                                  title="Clique para dar baixa na próxima parcela pendente"
                                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase cursor-pointer transition-all bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 flex items-center gap-1.5 shadow-sm"
                                >
                                  <Clock size={11} /> Baixar ({group.nextPendingTx.installmentIndex || 1}ª)
                                </button>
                              ) : (
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                                  <CheckCircle2 size={11} /> 100% Pago
                                </span>
                              )}
                            </td>

                            {/* Ações */}
                            <td className="py-3.5 px-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleOpenEditGroupModal(group)}
                                className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                                title="Editar valor e dados de todas as parcelas"
                              >
                                <Edit3 size={14} />
                              </button>

                              <button
                                onClick={() => handleDeleteRecurringGroup(group)}
                                className="p-1.5 text-gray-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/15 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                                title={`Excluir todas as ${group.totalCount} parcelas deste grupo`}
                              >
                                <Trash2 size={14} />
                              </button>

                              <button
                                onClick={() => toggleGroup(group.groupId)}
                                className="px-2.5 py-1 text-[11px] font-bold text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 border border-white/10"
                                title={isExpanded ? "Recolher parcelas" : "Expandir parcelas"}
                              >
                                {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                {isExpanded ? "Ocultar" : `Ver ${group.totalCount}x`}
                              </button>
                            </td>
                          </tr>

                          {/* SUB-TABELA ANINHADA DE PARCELAS QUANDO EXPANDIDO */}
                          {isExpanded && (
                            <tr className="bg-black/60 border-l-4 border-l-amber-500/40 animate-fade-in">
                              <td colSpan={8} className="p-3 pl-6 sm:pl-8">
                                <div className="bg-[#111111] border border-white/10 rounded-xl p-3.5 shadow-inner space-y-2.5">
                                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between border-b border-white/5 pb-2 flex-wrap gap-2">
                                    <span className="flex items-center gap-1.5 text-amber-300 font-extrabold">
                                      <Layers size={13} /> Parcelas de {group.baseTitle} ({group.paidCount}/{group.totalCount} Pagas)
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-gray-400 hidden sm:inline">Total: <strong className="text-white">{group.totalAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></span>

                                      <button
                                        onClick={() => handleOpenEditGroupModal(group)}
                                        className="px-2.5 py-1 text-[10px] font-bold text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/25 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 border border-amber-500/30"
                                        title="Editar valor de todas as parcelas"
                                      >
                                        <Edit3 size={11} /> Editar Grupo ({group.totalCount}x)
                                      </button>

                                      <button
                                        onClick={() => handleDeleteRecurringGroup(group)}
                                        className="px-2.5 py-1 text-[10px] font-bold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/25 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 border border-rose-500/30"
                                        title="Excluir todas as parcelas"
                                      >
                                        <Trash2 size={11} /> Excluir Todas ({group.totalCount}x)
                                      </button>
                                    </div>
                                  </div>


                                  <div className="divide-y divide-white/5">
                                    {group.transactions.map((subTx, idx) => {
                                      const isSubPaid = subTx.status === "pago";
                                      const instNum = subTx.installmentIndex || (idx + 1);
                                      return (
                                        <div
                                          key={subTx.id}
                                          onClick={() => handleOpenEditModal(subTx)}
                                          title="Clique para editar data ou valor desta parcela"
                                          className="py-2.5 flex items-center justify-between text-xs hover:bg-amber-500/10 px-2.5 rounded-lg transition-colors cursor-pointer group"
                                        >
                                          <div className="flex items-center gap-3">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] border ${isSubPaid
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                                : "bg-white/5 text-gray-400 border-white/10"
                                              }`}>
                                              {instNum}
                                            </span>
                                            <div>
                                              <div className="flex items-center gap-1.5">
                                                <span className="font-semibold text-white text-xs group-hover:text-amber-300 transition-colors">{subTx.description}</span>
                                                <Edit3 size={11} className="text-gray-500 group-hover:text-amber-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                                              </div>
                                              <div className="text-[10px] text-gray-400 flex items-center gap-2">
                                                <span>Vencimento: <strong className="text-gray-200 group-hover:text-amber-300 underline">{subTx.dueDate ? new Date(subTx.dueDate + "T00:00:00").toLocaleDateString("pt-BR") : "-"}</strong></span>
                                                {subTx.paymentDate && <span className="text-emerald-400 font-medium">· Pago em: {new Date(subTx.paymentDate + "T00:00:00").toLocaleDateString("pt-BR")}</span>}
                                              </div>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                                            <span className={`font-bold text-xs ${isReceita ? "text-emerald-400" : "text-rose-400"}`}>
                                              {subTx.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                            </span>

                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleStatus(subTx);
                                              }}
                                              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase cursor-pointer transition-all ${isSubPaid
                                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                                  : "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                                                }`}
                                            >
                                              {isSubPaid ? "✅ Pago" : "⏳ Pendente"}
                                            </button>

                                            <div className="flex items-center gap-1">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleOpenEditModal(subTx);
                                                }}
                                                className="p-1 text-amber-400 hover:text-white bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 rounded transition-colors"
                                                title="Editar Parcela"
                                              >
                                                <Edit3 size={12} />
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteTransaction(subTx.id);
                                                }}
                                                className="p-1 text-gray-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded transition-colors"
                                                title="Excluir Parcela"
                                              >
                                                <Trash2 size={12} />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    }

                    // RENDERIZAÇÃO DE ITEM AVULSO (SINGLE)
                    const tx = row.tx;
                    const isReceita = tx.type === "receita";
                    const isPaid = tx.status === "pago";

                    const todayStr = new Date().toISOString().split("T")[0];
                    const tomorrowDate = new Date();
                    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
                    const tomorrowStr = tomorrowDate.toISOString().split("T")[0];

                    const isDueToday = tx.dueDate === todayStr && !isPaid;
                    const isDueTomorrow = tx.dueDate === tomorrowStr && !isPaid;

                    const categoryObj = CATEGORIES.find(c => c.id === tx.category);
                    const categoryLabel = categoryObj ? categoryObj.label : tx.category;

                    const linkedLead = tx.leadId ? leads.find(l => String(l.id) === String(tx.leadId)) : null;

                    return (
                      <tr
                        key={`tx-${tx.id}`}
                        onClick={() => handleOpenEditModal(tx)}
                        title="Clique para editar este lançamento (data, valor, descrição, etc.)"
                        className={`transition-colors cursor-pointer group hover:bg-amber-500/10 ${isDueToday
                            ? "bg-red-950/20 hover:bg-red-950/35"
                            : isDueTomorrow
                              ? "bg-amber-950/20 hover:bg-amber-950/35"
                              : "hover:bg-white/5"
                          }`}
                      >
                        {/* Vencimento */}
                        <td className="py-3.5 px-4 text-gray-300 font-semibold text-[11px] whitespace-nowrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="group-hover:text-amber-300 transition-colors flex items-center gap-1">
                              {tx.dueDate ? new Date(tx.dueDate + "T00:00:00").toLocaleDateString("pt-BR") : "-"}
                              <Edit3 size={11} className="text-gray-500 group-hover:text-amber-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                            </span>
                            {isDueToday && (
                              <span className="text-[9px] bg-rose-500/20 text-rose-300 font-black px-1.5 py-0.2 rounded border border-rose-500/40 animate-pulse">
                                🚨 Vence Hoje
                              </span>
                            )}
                            {isDueTomorrow && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 font-black px-1.5 py-0.2 rounded border border-amber-500/40">
                                ⚠️ Vence Amanhã
                              </span>
                            )}
                          </div>
                        </td>


                        {/* Tipo Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase inline-flex items-center gap-1 ${isReceita
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            }`}>
                            {isReceita ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                            {isReceita ? "Entrada" : "Saída"}
                          </span>
                        </td>

                        {/* Descrição & Lead / Fornecedor */}
                        <td className="py-3.5 px-4 max-w-[280px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white text-xs group-hover:text-amber-300 transition-colors" title={tx.description}>{tx.description}</span>
                            {((tx as any).isRecurring || tx.notes?.includes("Recorrente")) && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-0.5">
                                <Clock size={10} /> Custo Fixo
                              </span>
                            )}
                          </div>

                          {tx.supplierName && (
                            <div className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                              <Truck size={11} className="text-amber-400" /> Fornecedor: {tx.supplierName}
                            </div>
                          )}

                          {linkedLead && (
                            <div className="text-[10px] text-blue-400 font-medium flex items-center gap-1 mt-0.5">
                              <UserCheck size={11} /> Cliente: {linkedLead.name}
                            </div>
                          )}

                          {tx.notes && (
                            <div className="text-[10px] text-gray-500 truncate max-w-[220px] mt-0.5">{tx.notes}</div>
                          )}
                        </td>

                        {/* Categoria */}
                        <td className="py-3.5 px-4 text-gray-400 text-[11px] max-w-[140px] truncate hidden md:table-cell">
                          {categoryLabel}
                        </td>

                        {/* Forma de Pagamento */}
                        <td className="py-3.5 px-4 text-gray-400 text-[11px] whitespace-nowrap hidden sm:table-cell">
                          {tx.paymentMethod || "PIX"}
                        </td>

                        {/* Valor */}
                        <td className={`py-3.5 px-4 font-black text-xs whitespace-nowrap ${isReceita ? "text-emerald-400" : "text-rose-400"}`}>
                          <span className="group-hover:underline flex items-center gap-1">
                            {isReceita ? "+" : "-"} {tx.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            <Edit3 size={11} className="text-gray-500 group-hover:text-amber-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(tx);
                            }}
                            title="Clique para alternar entre Pago e Pendente"
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase cursor-pointer transition-all ${isPaid
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                : tx.status === "atrasado"
                                  ? "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                              }`}
                          >
                            {isPaid ? "✅ Pago" : tx.status === "atrasado" ? "⚠️ Atrasado" : "⏳ Pendente"}
                          </button>
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(tx);
                            }}
                            className="p-1.5 text-amber-400 hover:text-white bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/20 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold"
                            title="Editar Lançamento"
                          >
                            <Edit3 size={12} />
                            <span className="hidden sm:inline">Editar</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTransaction(tx.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Lançamento"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {displayRows.length === 0 && !loading && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-gray-500 italic">
                        Nenhum lançamento financeiro encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  )}


                  {loading && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-gray-400">
                        Carregando lançamentos do financeiro...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MODAL CRIAR / EDITAR LANÇAMENTO (AMPLO EM GRID DE 4 COLUNAS) */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4">
              <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-4xl p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-in max-h-[92vh] overflow-y-auto scrollbar-thin">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <DollarSign size={20} className="text-amber-400" />
                    {editingTx ? "Editar Lançamento Financeiro" : `Novo Lançamento - ${formType === "receita" ? "Receita (Entrada)" : "Despesa (Saída)"}`}
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
                  {/* LINHA 1: TIPO (1 col) + DESCRIÇÃO (2 cols) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Selector Tipo */}
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">Tipo de Lançamento *</label>
                      <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10 h-[42px] items-center">
                        <button
                          type="button"
                          onClick={() => {
                            setFormType("receita");
                            setFormCategory("venda_marcenaria");
                          }}
                          className={`h-full rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${formType === "receita" ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30" : "text-gray-400 hover:text-white"
                            }`}
                        >
                          <ArrowDownRight size={13} /> Receita
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setFormType("despesa");
                            setFormCategory("materia_prima");
                          }}
                          className={`h-full rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${formType === "despesa" ? "bg-rose-600 text-white shadow-md shadow-rose-600/30" : "text-gray-400 hover:text-white"
                            }`}
                        >
                          <ArrowUpRight size={13} /> Despesa
                        </button>
                      </div>
                    </div>

                    {/* Descrição */}
                    <div className="md:col-span-2">
                      <label className="block text-gray-300 font-semibold mb-1">Descrição do Lançamento *</label>
                      <input
                        type="text"
                        required
                        value={formDescription}
                        onChange={e => setFormDescription(e.target.value)}
                        placeholder="Ex: Entrada 50% Cozinha Cliente João ou Compra MDF Arauco"
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-amber-400/50 h-[42px]"
                      />
                    </div>
                  </div>

                  {/* LINHA 2: GRID DE 4 COLUNAS (Valor, Categoria, Vencimento, Forma de Pagamento) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Valor */}
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">Valor (R$) *</label>
                      <input
                        type="text"
                        required
                        value={formAmount}
                        onChange={e => setFormAmount(e.target.value)}
                        placeholder="Ex: 104,90 ou 1500"
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-2 px-3 text-white font-bold focus:outline-none focus:border-amber-400/50"
                      />
                    </div>

                    {/* Categoria */}
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">Categoria</label>
                      <select
                        value={formCategory}
                        onChange={e => setFormCategory(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 text-white rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                      >
                        {CATEGORIES.filter(c => c.type === "both" || c.type === formType).map(cat => (
                          <option key={cat.id} value={cat.id} className="bg-neutral-900">
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Vencimento */}
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">Data Vencimento</label>
                      <input
                        type="date"
                        value={formDueDate}
                        onChange={e => setFormDueDate(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 text-white rounded-xl px-3 py-2 focus:outline-none"
                      />
                    </div>

                    {/* Forma Pagamento */}
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">Forma de Pagamento</label>
                      <select
                        value={formPaymentMethod}
                        onChange={e => setFormPaymentMethod(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 text-white rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                      >
                        <option value="PIX" className="bg-neutral-900">PIX</option>
                        <option value="Boleto" className="bg-neutral-900">Boleto Bancário</option>
                        <option value="Cartão de Crédito" className="bg-neutral-900">Cartão de Crédito</option>
                        <option value="Transferência/TED" className="bg-neutral-900">Transferência/TED</option>
                        <option value="Dinheiro" className="bg-neutral-900">Dinheiro</option>
                        <option value="Financiamento" className="bg-neutral-900">Financiamento</option>
                      </select>
                    </div>
                  </div>

                  {/* LINHA 3: GRID DE 4 COLUNAS (Status, Data Pgto, Cliente Lead ou Fornecedor) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Status */}
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">Status</label>
                      <select
                        value={formStatus}
                        onChange={e => setFormStatus(e.target.value as any)}
                        className="w-full bg-black/50 border border-white/10 text-white rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                      >
                        <option value="pago" className="bg-neutral-900">Pago / Recebido</option>
                        <option value="pendente" className="bg-neutral-900">Pendente</option>
                        <option value="atrasado" className="bg-neutral-900">Atrasado</option>
                      </select>
                    </div>

                    {/* Data Pagamento (se status == pago) */}
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">Data Efetivação / Pgto</label>
                      <input
                        type="date"
                        disabled={formStatus !== "pago"}
                        value={formPaymentDate}
                        onChange={e => setFormPaymentDate(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 text-white rounded-xl px-3 py-2 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Vínculo com Lead do CRM (2 colunas para receita, 1 col para despesa) */}
                    <div className={formType === "receita" ? "sm:col-span-2 lg:col-span-2" : ""}>
                      <label className="block text-gray-300 font-semibold mb-1">Vincular a Cliente/Lead</label>
                      <select
                        value={formLeadId}
                        onChange={e => setFormLeadId(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 text-white rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                      >
                        <option value="" className="bg-neutral-900">Nenhum cliente vinculado</option>
                        {leads.map(lead => (
                          <option key={lead.id} value={lead.id} className="bg-neutral-900">
                            {lead.name} {lead.phone ? `(${lead.phone})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Vínculo com Fornecedor (apenas se despesa) */}
                    {formType === "despesa" && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-gray-300 font-semibold">Fornecedor / Parceiro</label>
                          <button
                            type="button"
                            onClick={() => setIsSuppliersModalOpen(true)}
                            className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5"
                          >
                            + Cadastrar
                          </button>
                        </div>
                        <select
                          value={formSupplierId}
                          onChange={e => {
                            const val = e.target.value;
                            setFormSupplierId(val);
                            const match = suppliersList.find(s => s.id.toString() === val);
                            setFormSupplierName(match ? (match.tradeName || match.name) : "");
                          }}
                          className="w-full bg-black/50 border border-white/10 text-white rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                        >
                          <option value="" className="bg-neutral-900">Nenhum fornecedor vinculado</option>
                          {suppliersList.map(sup => (
                            <option key={sup.id} value={sup.id} className="bg-neutral-900">
                              {sup.tradeName || sup.name} {sup.cnpjCpf ? `(${sup.cnpjCpf})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* ATALHOS RÁPIDOS DE CUSTOS FIXOS (Grid de 5 colunas em tela cheia) */}
                  {formType === "despesa" && !editingTx && (
                    <div className="space-y-2 p-3.5 rounded-xl bg-neutral-950/70 border border-white/5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold flex items-center gap-1.5 text-amber-300">
                          <Zap size={13} className="text-amber-400" />
                          Atalhos Rápidos de Custos Fixos Dumar:
                        </span>
                        <span className="text-[10px] text-gray-500">1 clique para auto-preencher</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-0.5">
                        {[
                          { label: "🏢 Aluguel Galpão", desc: "Aluguel Galpão & Escritório", category: "administrativo", amount: "2500", method: "Boleto", supplierKeyword: "Aluguel" },
                          { label: "⚡ Energia Elétrica", desc: "Energia Elétrica / Luz (Celesc)", category: "administrativo", amount: "550", method: "Boleto", supplierKeyword: "Celesc" },
                          { label: "📊 Contador", desc: "Honorários Contábeis Mensalidade", category: "administrativo", amount: "600", method: "PIX", supplierKeyword: "Contador" },
                          { label: "🌐 Hospedagem/VPS", desc: "Servidor VPS / Hospedagem & Domínio", category: "administrativo", amount: "150", method: "Cartão de Crédito", supplierKeyword: "Hospedagem" },
                          { label: "📶 Internet Fibra", desc: "Internet Fibra Óptica & Telefonia", category: "administrativo", amount: "180", method: "Boleto", supplierKeyword: "Internet" },
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => applyFixedExpensePreset(preset)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 text-[11px] text-gray-300 font-medium transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-0.5"
                          >
                            <span className="font-bold">{preset.label}</span>
                            <span className="text-[9px] text-gray-400">R$ {preset.amount}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* REPETIÇÃO DE DESPESA FIXA (RECORRÊNCIA) */}
                  {formType === "despesa" && !editingTx && (
                    <div className="p-3.5 bg-neutral-950/80 rounded-xl border border-amber-500/20 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formIsRecurring}
                            onChange={e => setFormIsRecurring(e.target.checked)}
                            className="w-4 h-4 rounded border-white/20 bg-neutral-900 text-amber-500 focus:ring-0 cursor-pointer"
                          />
                          <span className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                            <Clock size={13} className="text-amber-400" />
                            Repetir esta Despesa Fixa nos próximos meses (Projeção Automática)
                          </span>
                        </label>
                        {formIsRecurring && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full font-bold border border-amber-500/30">
                            {formRecurringMonths} meses programados
                          </span>
                        )}
                      </div>

                      {formIsRecurring && (
                        <div className="pt-2.5 border-t border-white/5 space-y-2 animate-fade-in">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-gray-400 text-[11px]">Projetar no fluxo de caixa por:</span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {[
                                { label: "3 Meses", val: 3 },
                                { label: "6 Meses", val: 6 },
                                { label: "12 Meses (1 Ano)", val: 12 },
                                { label: "24 Meses (2 Anos)", val: 24 }
                              ].map(opt => (
                                <button
                                  key={opt.val}
                                  type="button"
                                  onClick={() => setFormRecurringMonths(opt.val)}
                                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center ${formRecurringMonths === opt.val
                                      ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                                      : "bg-white/5 text-gray-400 hover:text-white border border-white/10"
                                    }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-400 italic">
                            💡 O sistema criará {formRecurringMonths} lançamentos com o mesmo valor no dia de vencimento de cada mês correspondente.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* LINHA: OBSERVAÇÕES */}
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Observações</label>
                    <textarea
                      rows={2}
                      value={formNotes}
                      onChange={e => setFormNotes(e.target.value)}
                      placeholder="Número de nota fiscal, comprovante, chave PIX ou observação..."
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-400/50"
                    />
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 rounded-xl font-bold text-black bg-amber-500 hover:bg-amber-400 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                    >
                      {isSubmitting ? "Salvando..." : editingTx ? "Salvar Alterações" : formIsRecurring ? `Lançar ${formRecurringMonths}x Meses Recorrentes` : "Criar Lançamento"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL EDITAR GRUPO RECORRENTE EM LOTE */}
          {editingGroup && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4">
              <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-xl p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-in max-h-[92vh] overflow-y-auto scrollbar-thin">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Repeat size={18} className="text-amber-400" />
                    Editar Lote Recorrente ({editingGroup.totalCount}x Meses)
                  </h3>
                  <button
                    onClick={() => setEditingGroup(null)}
                    className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Título Base */}
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Título / Descrição Base *</label>
                    <input
                      type="text"
                      value={groupFormBaseTitle}
                      onChange={e => setGroupFormBaseTitle(e.target.value)}
                      placeholder="Ex: Internet Fibra Óptica, Aluguel do Galpão..."
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-amber-400/50"
                    />
                  </div>

                  {/* Valor por Parcela */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">Novo Valor da Parcela (R$) *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                        <input
                          type="text"
                          value={groupFormAmount}
                          onChange={e => setGroupFormAmount(e.target.value)}
                          placeholder="104,90"
                          className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-white font-black text-sm focus:outline-none focus:border-amber-400/50"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">Ex: digite <strong className="text-amber-300">104,90</strong> ou <strong className="text-amber-300">104.90</strong></p>
                    </div>

                    {/* Forma de Pagamento */}
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">Forma de Pagamento</label>
                      <select
                        value={groupFormPaymentMethod}
                        onChange={e => setGroupFormPaymentMethod(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-white font-medium focus:outline-none focus:border-amber-400/50 cursor-pointer"
                      >
                        <option value="PIX" className="bg-neutral-900">PIX</option>
                        <option value="Boleto" className="bg-neutral-900">Boleto Bancário</option>
                        <option value="Cartão de Crédito" className="bg-neutral-900">Cartão de Crédito</option>
                        <option value="Cartão de Débito" className="bg-neutral-900">Cartão de Débito</option>
                        <option value="Transferência (TED)" className="bg-neutral-900">Transferência (TED)</option>
                        <option value="Dinheiro" className="bg-neutral-900">Dinheiro</option>
                        <option value="Cheque" className="bg-neutral-900">Cheque</option>
                      </select>
                    </div>
                  </div>

                  {/* Categoria */}
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Categoria Financeira</label>
                    <select
                      value={groupFormCategory}
                      onChange={e => setGroupFormCategory(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-white font-medium focus:outline-none focus:border-amber-400/50 cursor-pointer"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.id} value={c.id} className="bg-neutral-900">{c.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Fornecedor */}
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Fornecedor / Parceiro Vinculado</label>
                    <select
                      value={groupFormSupplierId}
                      onChange={e => {
                        const supId = e.target.value;
                        setGroupFormSupplierId(supId);
                        const sup = suppliersList.find(s => String(s.id) === supId);
                        setGroupFormSupplierName(sup ? (sup.tradeName || sup.name) : "");
                      }}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-white font-medium focus:outline-none focus:border-amber-400/50 cursor-pointer"
                    >
                      <option value="" className="bg-neutral-900">Nenhum / Não informado</option>
                      {suppliersList.map(s => (
                        <option key={s.id} value={String(s.id)} className="bg-neutral-900">
                          {s.tradeName || s.name} ({s.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Escopo da Alteração */}
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2">
                    <label className="block text-gray-300 font-bold">Aplicar Alterações Em:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setGroupFormScope("all")}
                        className={`py-2 px-3 rounded-lg font-bold text-xs border text-left transition-all cursor-pointer ${groupFormScope === "all"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                            : "bg-black/30 text-gray-400 border-white/5 hover:text-white"
                          }`}
                      >
                        <div>🔁 Todas as {editingGroup.totalCount} Parcelas</div>
                        <div className="text-[10px] font-normal opacity-80">Atualiza todo o contrato</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGroupFormScope("pending")}
                        className={`py-2 px-3 rounded-lg font-bold text-xs border text-left transition-all cursor-pointer ${groupFormScope === "pending"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                            : "bg-black/30 text-gray-400 border-white/5 hover:text-white"
                          }`}
                      >
                        <div>⏳ Apenas Pendentes ({editingGroup.totalCount - editingGroup.paidCount})</div>
                        <div className="text-[10px] font-normal opacity-80">Preserva parcelas já pagas</div>
                      </button>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setEditingGroup(null)}
                      className="flex-1 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveEditGroup}
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 rounded-xl font-bold text-black bg-amber-500 hover:bg-amber-400 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                    >
                      {isSubmitting ? "Salvando em Lote..." : `Salvar Alterações no Lote`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODAL DE GESTÃO DE FORNECEDORES & PARCEIROS */}

          <CRMSuppliersModal
            isOpen={isSuppliersModalOpen}
            onClose={() => {
              setIsSuppliersModalOpen(false);
              fetchSuppliers();
            }}
            onSelectSupplier={(supplier) => {
              setFormSupplierId(supplier.id.toString());
              setFormSupplierName(supplier.tradeName || supplier.name);
              setIsSuppliersModalOpen(false);
              fetchSuppliers();
            }}
            selectedSupplierId={formSupplierId ? Number(formSupplierId) : null}
          />
        </>
      )}
    </div>
  );
}

