import React, { useState, useEffect } from "react";
import { 
  DollarSign, FileText, CheckCircle2, Clock, AlertCircle, TrendingUp, 
  TrendingDown, Plus, Search, Filter, Trash2, Edit3, Download, Check, 
  ArrowUpRight, ArrowDownRight, Tag, Calendar, CreditCard, UserCheck, X 
} from "lucide-react";
import { Lead } from "./types";

import CRMContractsView from "./crm-contracts-view";

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
  notes?: string;
  createdAt?: string;
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
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "receita" | "despesa">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pago" | "pendente" | "atrasado">("all");
  const [periodFilter, setPeriodFilter] = useState<"all" | "this_month" | "last_month" | "year">("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<FinancialTransaction | null>(null);

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
  const [formNotes, setFormNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    fetchTransactions();
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
    setFormNotes("");
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
    setFormNotes(tx.notes || "");
    setIsModalOpen(true);
  };

  // Salvar (Criar ou Atualizar)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription || !formAmount) return;

    setIsSubmitting(true);
    const payload = {
      description: formDescription,
      type: formType,
      amount: Number(formAmount),
      category: formCategory,
      status: formStatus,
      dueDate: formDueDate,
      paymentDate: formStatus === "pago" ? formPaymentDate : "",
      paymentMethod: formPaymentMethod,
      leadId: formLeadId ? Number(formLeadId) : null,
      notes: formNotes
    };

    try {
      let res;
      if (editingTx) {
        res = await fetch(`/api/financial/transactions/${editingTx.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/api/financial/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setIsModalOpen(false);
        fetchTransactions();
      } else {
        alert("Erro ao salvar lançamento financeiro.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com o servidor.");
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
        fetchTransactions();
      }
    } catch (err) {
      console.error("Erro ao alterar status:", err);
    }
  };

  // Excluir Lançamento
  const handleDeleteTransaction = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este lançamento financeiro?")) return;

    try {
      const res = await fetch(`/api/financial/transactions/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchTransactions();
      }
    } catch (err) {
      console.error("Erro ao excluir transação:", err);
    }
  };

  // Exportar para CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("Nenhum lançamento para exportar.");
      return;
    }

    let csv = "ID,Data Vencimento,Data Pagamento,Tipo,Descricao,Categoria,Valor (R$),Status,Forma Pagamento,Observacoes\n";
    filteredTransactions.forEach(t => {
      csv += `"${t.id}","${t.dueDate || ''}","${t.paymentDate || ''}","${t.type}","${t.description.replace(/"/g, '""')}","${t.category}","${t.amount}","${t.status}","${t.paymentMethod}","${(t.notes || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financeiro_dumar_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Filtragem dos lançamentos
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            financialTab === "cashflow"
              ? "bg-white text-black shadow-lg"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <DollarSign size={16} /> Lançamentos & Fluxo de Caixa
        </button>

        <button
          onClick={() => setFinancialTab("contracts")}
          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            financialTab === "contracts"
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
          {/* HEADER & METRICAS CHAVE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receitas */}
        <div className="bg-[#0f0f0f] border border-emerald-500/20 p-5 rounded-2xl shadow-xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all"></div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Entradas / Receitas Pagas</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">
              {totalReceitasPagas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </h3>
            <p className="text-[10px] text-emerald-500/80 mt-1 font-semibold flex items-center gap-1">
              <ArrowDownRight size={12} /> Faturamento Concluído
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <TrendingUp size={22} />
          </div>
        </div>

        {/* Despesas */}
        <div className="bg-[#0f0f0f] border border-rose-500/20 p-5 rounded-2xl shadow-xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-all"></div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Saídas / Despesas Pagas</p>
            <h3 className="text-2xl font-black text-rose-400 mt-1">
              {totalDespesasPagas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </h3>
            <p className="text-[10px] text-rose-500/80 mt-1 font-semibold flex items-center gap-1">
              <ArrowUpRight size={12} /> Custos & Matérias-Primas
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/10">
            <TrendingDown size={22} />
          </div>
        </div>

        {/* Lucro Líquido */}
        <div className={`bg-[#0f0f0f] border ${lucroLiquido >= 0 ? "border-amber-500/20" : "border-red-500/30"} p-5 rounded-2xl shadow-xl flex items-center justify-between relative overflow-hidden group`}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Resultado / Lucro Líquido</p>
            <h3 className={`text-2xl font-black mt-1 ${lucroLiquido >= 0 ? "text-amber-400" : "text-red-400"}`}>
              {lucroLiquido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </h3>
            <p className="text-[10px] text-gray-400 mt-1 font-semibold">
              Margem de Lucro: <span className="text-white font-bold">{margemLucro}%</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <DollarSign size={22} />
          </div>
        </div>

        {/* Pendentes */}
        <div className="bg-[#0f0f0f] border border-blue-500/20 p-5 rounded-2xl shadow-xl flex items-center justify-between relative overflow-hidden group">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Previsão de Caixa (A Receber)</p>
            <h3 className="text-2xl font-black text-blue-400 mt-1">
              {contasAReceber.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </h3>
            <p className="text-[10px] text-gray-400 mt-1 font-semibold">
              A Pagar: <span className="text-rose-400 font-bold">{contasAPagar.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/10">
            <Clock size={22} />
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
              onClick={handleExportCSV}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-white/10"
            >
              <Download size={15} /> Exportar CSV
            </button>
          </div>
        </div>

        {/* FILTROS & BUSCA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
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
        </div>

        {/* TABELA DE LANÇAMENTOS */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Vencimento</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Pagamento</th>
                <th className="py-3 px-4">Valor (R$)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTransactions.map(tx => {
                const isReceita = tx.type === "receita";
                const isPaid = tx.status === "pago";

                const categoryObj = CATEGORIES.find(c => c.id === tx.category);
                const categoryLabel = categoryObj ? categoryObj.label : tx.category;

                const linkedLead = tx.leadId ? leads.find(l => String(l.id) === String(tx.leadId)) : null;

                return (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                    {/* Vencimento */}
                    <td className="py-3.5 px-4 text-gray-300 font-semibold text-[11px]">
                      {tx.dueDate ? new Date(tx.dueDate + "T00:00:00").toLocaleDateString("pt-BR") : "-"}
                    </td>

                    {/* Tipo Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase inline-flex items-center gap-1 ${
                        isReceita 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}>
                        {isReceita ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                        {isReceita ? "Entrada" : "Saída"}
                      </span>
                    </td>

                    {/* Descrição & Lead */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-xs">{tx.description}</div>
                      {linkedLead && (
                        <div className="text-[10px] text-amber-400/90 font-medium flex items-center gap-1 mt-0.5">
                          <UserCheck size={11} /> Cliente: {linkedLead.name}
                        </div>
                      )}
                      {tx.notes && (
                        <div className="text-[10px] text-gray-500 truncate max-w-[200px] mt-0.5">{tx.notes}</div>
                      )}
                    </td>

                    {/* Categoria */}
                    <td className="py-3.5 px-4 text-gray-300 text-[11px] max-w-[150px] truncate">
                      {categoryLabel}
                    </td>

                    {/* Forma de Pagamento */}
                    <td className="py-3.5 px-4 text-gray-300 text-[11px]">
                      {tx.paymentMethod || "PIX"}
                    </td>

                    {/* Valor */}
                    <td className={`py-3.5 px-4 font-black text-xs ${isReceita ? "text-emerald-400" : "text-rose-400"}`}>
                      {isReceita ? "+" : "-"} {tx.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(tx)}
                        title="Clique para alterar status"
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase cursor-pointer transition-all ${
                          isPaid 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20" 
                            : tx.status === "atrasado"
                            ? "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                        }`}
                      >
                        {isPaid ? "✅ Pago / Concluído" : tx.status === "atrasado" ? "⚠️ Atrasado" : "⏳ Pendente"}
                      </button>
                    </td>

                    {/* Ações */}
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEditModal(tx)}
                        className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                        title="Editar Lançamento"
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Lançamento"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredTransactions.length === 0 && !loading && (
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

      {/* MODAL CRIAR / EDITAR LANÇAMENTO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-md font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <DollarSign size={18} className="text-amber-400" />
                {editingTx ? "Editar Lançamento Financeiro" : `Novo Lançamento - ${formType === "receita" ? "Receita (Entrada)" : "Despesa (Saída)"}`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Selector Tipo (Receita vs Despesa) */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setFormType("receita");
                    setFormCategory("venda_marcenaria");
                  }}
                  className={`py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formType === "receita" ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <ArrowDownRight size={14} /> Receita (Entrada)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormType("despesa");
                    setFormCategory("materia_prima");
                  }}
                  className={`py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formType === "despesa" ? "bg-rose-600 text-white shadow-md shadow-rose-600/30" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <ArrowUpRight size={14} /> Despesa (Saída)
                </button>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Descrição do Lançamento *</label>
                <input
                  type="text"
                  required
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Ex: Entrada 50% Cozinha Cliente João ou Compra MDF Arauco"
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-amber-400/50"
                />
              </div>

              {/* Valor & Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formAmount}
                    onChange={e => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-amber-400/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Categoria</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 text-white rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer"
                  >
                    {CATEGORIES.filter(c => c.type === "both" || c.type === formType).map(cat => (
                      <option key={cat.id} value={cat.id} className="bg-neutral-900">
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vencimento, Data Pgto & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Data Vencimento</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={e => setFormDueDate(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 text-white rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>

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

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Forma Pagamento</label>
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

              {/* Vínculo com Lead do CRM (opcional) */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Vincular a Cliente/Lead (Opcional)</label>
                <select
                  value={formLeadId}
                  onChange={e => setFormLeadId(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 text-white rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-neutral-900">Nenhum cliente vinculado</option>
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id} className="bg-neutral-900">
                      {lead.name} {lead.phone ? `(${lead.phone})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Número de nota fiscal, comprovante ou observação..."
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
                  {isSubmitting ? "Salvando..." : editingTx ? "Salvar Alterações" : "Criar Lançamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
