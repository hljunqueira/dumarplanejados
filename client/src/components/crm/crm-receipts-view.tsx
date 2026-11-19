import React, { useState, useEffect, useMemo } from "react";
import {
  Receipt, Plus, Printer, Trash2, Search, Check, Copy, Edit3, X, RefreshCw
} from "lucide-react";
import { Lead } from "./types";
import { Client } from "@shared/schema";
import { useConfirmDialog } from "../ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import logoDumar from "@/assets/logo1.jpeg";
import {
  ReceiptData,
  getDefaultReceiptData,
  numberToExtensoBRL,
  formatDateExtenso,
  generateReceiptWhatsAppText
} from "@/lib/receipt-utils";
import { parseMonetaryInput, formatBRL } from "@/lib/currency";

interface CRMReceiptsViewProps {
  leads: Lead[];
  initialData?: Partial<ReceiptData> | null;
  onNewTransaction?: () => void;
}

export default function CRMReceiptsView({ leads, initialData, onNewTransaction }: CRMReceiptsViewProps): JSX.Element {
  const { confirm, showAlert } = useConfirmDialog();
  const { toast } = useToast();

  const [receiptsList, setReceiptsList] = useState<ReceiptData[]>([]);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentReceipt, setCurrentReceipt] = useState<ReceiptData>(() => getDefaultReceiptData());
  const [formAmountInput, setFormAmountInput] = useState<string>("");
  const [syncWithFinancial, setSyncWithFinancial] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Carregar lista de recibos da API
  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/receipts");
      if (res.ok) {
        const data = await res.json();
        setReceiptsList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Erro ao carregar recibos:", err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar lista de clientes cadastrados
  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClientsList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    }
  };

  useEffect(() => {
    fetchReceipts();
    fetchClients();
  }, []);

  // Gerador de próximo número sequencial
  const generateNextReceiptNumber = (): string => {
    const year = new Date().getFullYear();
    const count = receiptsList.length + 1;
    return `REC-${year}-${String(count).padStart(3, "0")}`;
  };

  // Iniciar formulário limpo para novo recibo
  const resetForm = () => {
    const def = getDefaultReceiptData();
    def.receiptNumber = generateNextReceiptNumber();
    setCurrentReceipt(def);
    setFormAmountInput("");
    setEditingId(null);
    setSyncWithFinancial(false);
  };

  // Preencher quando vier do botão "Gerar Recibo" de um lançamento existente
  useEffect(() => {
    if (initialData) {
      const def = getDefaultReceiptData();
      const numVal = initialData.amount || 0;
      setCurrentReceipt({
        ...def,
        ...initialData,
        receiptNumber: initialData.receiptNumber || generateNextReceiptNumber(),
        amount: numVal,
        amountExtenso: initialData.amountExtenso || numberToExtensoBRL(numVal),
        description: initialData.description || "",
        clientName: initialData.clientName || "",
        clientCpfCnpj: initialData.clientCpfCnpj || "",
        clientPhone: initialData.clientPhone || "",
        receiptDate: initialData.receiptDate || initialData.paymentDate || def.receiptDate,
        paymentMethod: initialData.paymentMethod || "PIX"
      });
      setFormAmountInput(numVal > 0 ? numVal.toString() : "");
      setEditingId(null);
      setSyncWithFinancial(false);
    } else if (!editingId && receiptsList.length >= 0) {
      // Inicia com próximo número sequencial
      setCurrentReceipt(prev => ({
        ...prev,
        receiptNumber: prev.receiptNumber || generateNextReceiptNumber()
      }));
    }
  }, [initialData, receiptsList.length]);

  // Alteração do valor monetário
  const handleAmountChange = (valStr: string) => {
    setFormAmountInput(valStr);
    const num = parseMonetaryInput(valStr);
    const extenso = numberToExtensoBRL(num);
    setCurrentReceipt(prev => ({
      ...prev,
      amount: num,
      amountExtenso: extenso
    }));
  };

  // Seleção rápida de cliente do sistema
  const handleSelectClient = (identifier: string) => {
    if (!identifier) return;

    if (identifier.startsWith("cli-")) {
      const cid = Number(identifier.replace("cli-", ""));
      const match = clientsList.find(c => c.id === cid);
      if (match) {
        setCurrentReceipt(prev => ({
          ...prev,
          clientId: match.id,
          leadId: match.leadId || null,
          clientName: match.name,
          clientCpfCnpj: match.cpfCnpj || "",
          clientPhone: match.phone || "",
          clientAddress: match.address || ""
        }));
      }
    } else if (identifier.startsWith("lead-")) {
      const lid = Number(identifier.replace("lead-", ""));
      const match = leads.find(l => Number(l.id) === lid);
      if (match) {
        const relatedClient = clientsList.find(c => Number(c.leadId) === lid || c.name === match.name);
        setCurrentReceipt(prev => ({
          ...prev,
          leadId: Number(match.id),
          clientId: relatedClient ? relatedClient.id : null,
          clientName: match.name,
          clientCpfCnpj: relatedClient?.cpfCnpj || "",
          clientPhone: match.phone || "",
          clientAddress: relatedClient?.address || ""
        }));
      }
    }
  };

  // Carregar recibo existente para edição
  const handleEditReceipt = (item: ReceiptData) => {
    const numVal = item.amount || 0;
    setCurrentReceipt({
      ...item,
      amount: numVal,
      amountExtenso: item.amountExtenso || numberToExtensoBRL(numVal)
    });
    setFormAmountInput(numVal > 0 ? numVal.toString() : "");
    setEditingId(typeof item.id === "number" ? item.id : null);
    setSyncWithFinancial(false);

    toast({
      title: "Recibo Selecionado",
      description: `Editando recibo nº ${item.receiptNumber} (${item.clientName}).`,
    });
  };

  // Excluir recibo do banco de dados (CRUD - Delete)
  const handleDeleteReceipt = async (id: number | string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const ok = await confirm({
      title: "Excluir Recibo",
      message: "Tem certeza que deseja excluir este recibo definitivamente?",
      variant: "danger",
      confirmText: "Sim, Excluir"
    });

    if (!ok) return;

    try {
      const res = await fetch(`/api/receipts/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast({
          title: "Recibo Excluído",
          description: "O recibo foi removido com sucesso.",
        });
        if (editingId === Number(id)) {
          resetForm();
        }
        fetchReceipts();
      } else {
        await showAlert({
          title: "Erro ao Excluir",
          message: "Não foi possível excluir o recibo.",
          variant: "danger"
        });
      }
    } catch (err) {
      console.error(err);
      await showAlert({
        title: "Erro de Conexão",
        message: "Falha ao conectar com o servidor.",
        variant: "danger"
      });
    }
  };

  // Salvar / Criar / Atualizar (CRUD - Create & Update)
  const handleSaveReceipt = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentReceipt.clientName.trim()) {
      await showAlert({
        title: "Nome do Cliente Obrigatório",
        message: "Por favor, informe o nome do cliente / pagador.",
        variant: "warning"
      });
      return;
    }

    if (currentReceipt.amount <= 0) {
      await showAlert({
        title: "Valor Obrigatório",
        message: "Por favor, informe um valor maior que zero para o recibo.",
        variant: "warning"
      });
      return;
    }

    if (!currentReceipt.description.trim()) {
      await showAlert({
        title: "Descrição Obrigatória",
        message: "Por favor, descreva a que se refere o pagamento.",
        variant: "warning"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let txId = currentReceipt.financialTransactionId;

      // Opcional: sincronizar com o financeiro caso marcado
      if (syncWithFinancial && !txId) {
        try {
          const resFin = await fetch("/api/financial/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              description: `Recibo ${currentReceipt.receiptNumber || ""} - ${currentReceipt.clientName}`,
              type: "receita",
              amount: currentReceipt.amount,
              category: "venda_marcenaria",
              status: "pago",
              dueDate: currentReceipt.receiptDate,
              paymentDate: currentReceipt.receiptDate,
              paymentMethod: currentReceipt.paymentMethod || "PIX",
              leadId: currentReceipt.leadId || null,
              notes: `Recibo de Pagamento: ${currentReceipt.description}`
            })
          });

          if (resFin.ok) {
            const newTx = await resFin.json();
            txId = newTx.id;
            if (onNewTransaction) onNewTransaction();
          }
        } catch (fErr) {
          console.warn("Erro ao lançar no financeiro:", fErr);
        }
      }

      const payload = {
        receiptNumber: currentReceipt.receiptNumber.trim() || generateNextReceiptNumber(),
        receiptDate: currentReceipt.receiptDate,
        clientName: currentReceipt.clientName.trim(),
        clientCpfCnpj: currentReceipt.clientCpfCnpj.trim(),
        clientPhone: currentReceipt.clientPhone.trim(),
        clientAddress: (currentReceipt.clientAddress || "").trim(),
        amount: currentReceipt.amount,
        amountExtenso: currentReceipt.amountExtenso || numberToExtensoBRL(currentReceipt.amount),
        description: currentReceipt.description.trim(),
        paymentMethod: currentReceipt.paymentMethod,
        leadId: currentReceipt.leadId || null,
        clientId: currentReceipt.clientId || null,
        financialTransactionId: txId || null,
        notes: (currentReceipt.notes || "").trim()
      };

      let res;
      if (editingId) {
        res = await fetch(`/api/receipts/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/api/receipts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        const saved = await res.json();
        toast({
          title: editingId ? "Recibo Atualizado" : "Recibo Criado",
          description: `Recibo nº ${saved.receiptNumber} salvo com sucesso.`,
        });
        setCurrentReceipt(saved);
        setEditingId(saved.id);
        fetchReceipts();
      } else {
        const errJson = await res.json().catch(() => ({}));
        await showAlert({
          title: "Erro ao Salvar",
          message: errJson.message || "Não foi possível salvar o recibo.",
          variant: "danger"
        });
      }
    } catch (err) {
      console.error(err);
      await showAlert({
        title: "Erro de Conexão",
        message: "Falha ao conectar com o servidor.",
        variant: "danger"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copiar Texto para WhatsApp
  const handleCopyWhatsApp = () => {
    if (!currentReceipt.clientName.trim() || currentReceipt.amount <= 0) {
      toast({
        title: "Preencha os Campos",
        description: "Informe o cliente e o valor para copiar o texto do recibo.",
        variant: "destructive"
      });
      return;
    }

    const text = generateReceiptWhatsAppText(currentReceipt);
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);

    toast({
      title: "Texto Copiado",
      description: "Recibo copiado para a área de transferência.",
    });
  };

  // Imprimir Recibo
  const handlePrint = (customReceipt?: ReceiptData | React.MouseEvent) => {
    const rc = (customReceipt && "receiptNumber" in customReceipt) ? customReceipt : currentReceipt;
    if (!rc.clientName.trim() || rc.amount <= 0) {
      toast({
        title: "Preencha o Recibo",
        description: "Informe o cliente e o valor antes de imprimir.",
        variant: "destructive"
      });
      return;
    }

    const printElement = document.getElementById("printable-receipt-area");
    if (!printElement) {
      window.print();
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=850");
    if (!printWindow) {
      window.print();
      return;
    }

    const contentHtml = printElement.innerHTML;
    const origin = window.location.origin;

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <base href="${origin}/" />
        <title>Recibo - ${rc.receiptNumber || "REC"} - ${rc.clientName || "Cliente"} - Dumar Móveis Planejados</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 12mm 15mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box;
          }
          html, body {
            background: #ffffff !important;
            color: #171717 !important;
            margin: 0;
            padding: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 11px;
            line-height: 1.45;
          }
          .receipt-sheet {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div class="receipt-sheet p-4 sm:p-6 space-y-5">
          ${contentHtml}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Lista Filtrada para a Tabela
  const filteredReceipts = useMemo(() => {
    if (!searchTerm.trim()) return receiptsList;
    const term = searchTerm.toLowerCase();
    return receiptsList.filter(r =>
      r.receiptNumber.toLowerCase().includes(term) ||
      r.clientName.toLowerCase().includes(term) ||
      (r.clientCpfCnpj && r.clientCpfCnpj.toLowerCase().includes(term)) ||
      r.description.toLowerCase().includes(term)
    );
  }, [receiptsList, searchTerm]);

  return (
    <div className="space-y-6">
      {/* CSS PARA IMPRESSÃO EM FOLHA / PDF */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt-area, #printable-receipt-area * {
            visibility: visible;
          }
          #printable-receipt-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 32px;
            margin: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* CABEÇALHO DA ABA (SEM ÍCONES DECORATIVOS) */}
      <div className="no-print bg-[#121212] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            Recibos de Pagamento
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Dados da empresa vinculados automaticamente. Preencha os dados do cliente, valor e descrição para emitir.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <button
            type="button"
            onClick={resetForm}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} /> Novo Recibo
          </button>

          <button
            type="button"
            onClick={handleCopyWhatsApp}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            {copiedSuccess ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedSuccess ? "Copiado" : "Copiar Texto"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <Printer size={14} /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* GRID: FORMULÁRIO (ESQUERDA) + PRÉVIA (DIREITA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* FORMULÁRIO DE CADASTRO E EDIÇÃO (CRUD) */}
        <div className="no-print lg:col-span-6 space-y-4">
          <form onSubmit={handleSaveReceipt} className="bg-[#121212] border border-white/10 rounded-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-bold text-white uppercase tracking-wider text-xs">
                {editingId ? `Editar Recibo (ID ${editingId})` : "Dados do Recibo"}
              </span>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-gray-400 hover:text-white text-[11px] underline cursor-pointer"
                >
                  Cancelar Edição
                </button>
              )}
            </div>

            {/* DADOS DA EMPRESA (PRÉ-PREENCHIDOS) */}
            <div className="bg-black/30 border border-white/5 rounded-xl p-3 space-y-1 text-gray-400 text-[11px]">
              <div className="text-gray-200 font-semibold">{currentReceipt.companyNomeFantasia} ({currentReceipt.companyRazaoSocial})</div>
              <div>CNPJ: <span className="font-mono text-gray-300">{currentReceipt.companyCnpj}</span> · Telefone: {currentReceipt.companyPhone}</div>
              <div>Endereço: {currentReceipt.companyAddress}</div>
            </div>

            {/* SELETOR DE CLIENTE DO SISTEMA */}
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Selecionar Cliente ou Lead</label>
              <select
                onChange={e => handleSelectClient(e.target.value)}
                value={currentReceipt.clientId ? `cli-${currentReceipt.clientId}` : currentReceipt.leadId ? `lead-${currentReceipt.leadId}` : ""}
                className="w-full bg-black/50 border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="">Digitar manualmente abaixo</option>
                {clientsList.length > 0 && (
                  <optgroup label="Clientes Cadastrados">
                    {clientsList.map(cli => (
                      <option key={`cli-${cli.id}`} value={`cli-${cli.id}`}>
                        {cli.name} {cli.cpfCnpj ? `(${cli.cpfCnpj})` : ""}
                      </option>
                    ))}
                  </optgroup>
                )}
                {leads.length > 0 && (
                  <optgroup label="Leads">
                    {leads.map(lead => (
                      <option key={`lead-${lead.id}`} value={`lead-${lead.id}`}>
                        {lead.name} {lead.phone ? `(${lead.phone})` : ""}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* NOME E CPF DO CLIENTE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Nome do Cliente / Pagador *</label>
                <input
                  type="text"
                  required
                  value={currentReceipt.clientName}
                  onChange={e => setCurrentReceipt(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="Nome do cliente"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">CPF ou CNPJ</label>
                <input
                  type="text"
                  value={currentReceipt.clientCpfCnpj}
                  onChange={e => setCurrentReceipt(prev => ({ ...prev, clientCpfCnpj: e.target.value }))}
                  placeholder="CPF ou CNPJ"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Telefone</label>
                <input
                  type="text"
                  value={currentReceipt.clientPhone}
                  onChange={e => setCurrentReceipt(prev => ({ ...prev, clientPhone: e.target.value }))}
                  placeholder="Telefone"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Número do Recibo</label>
                <input
                  type="text"
                  value={currentReceipt.receiptNumber}
                  onChange={e => setCurrentReceipt(prev => ({ ...prev, receiptNumber: e.target.value }))}
                  placeholder="Ex: REC-2026-001"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* VALOR, DATA E FORMA DE PAGAMENTO */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Valor (R$) *</label>
                <input
                  type="text"
                  required
                  value={formAmountInput}
                  onChange={e => handleAmountChange(e.target.value)}
                  placeholder="Informe o valor"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-emerald-400 font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Data</label>
                <input
                  type="date"
                  value={currentReceipt.receiptDate}
                  onChange={e => setCurrentReceipt(prev => ({ ...prev, receiptDate: e.target.value }))}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Forma de Pagamento</label>
                <select
                  value={currentReceipt.paymentMethod}
                  onChange={e => setCurrentReceipt(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="PIX">PIX</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Transferência/TED">Transferência/TED</option>
                  <option value="Boleto Bancário">Boleto Bancário</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            {/* VALOR POR EXTENSO */}
            {currentReceipt.amountExtenso && (
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Valor por Extenso</label>
                <input
                  type="text"
                  value={currentReceipt.amountExtenso}
                  onChange={e => setCurrentReceipt(prev => ({ ...prev, amountExtenso: e.target.value }))}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 italic focus:outline-none focus:border-amber-400"
                />
              </div>
            )}

            {/* REFERENTE A (DESCRIÇÃO) */}
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Referente a (Descrição) *</label>
              <textarea
                rows={3}
                required
                value={currentReceipt.description}
                onChange={e => setCurrentReceipt(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Informe detalhadamente a que se refere o pagamento..."
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* OPÇÃO DE SINCRONIZAR COM O FINANCEIRO */}
            <div className="pt-2 border-t border-white/10">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncWithFinancial}
                  onChange={e => setSyncWithFinancial(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-neutral-900 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-gray-300 font-medium">
                  Lançar também como entrada no Fluxo de Caixa (Financeiro)
                </span>
              </label>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="flex items-center gap-3 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={() => handleDeleteReceipt(editingId)}
                  className="px-4 py-2.5 rounded-xl font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/30 transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} /> Excluir
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl font-bold text-black bg-amber-500 hover:bg-amber-400 transition-all cursor-pointer shadow-lg shadow-amber-500/20 text-xs flex items-center justify-center gap-2"
              >
                <Check size={16} />
                <span>{isSubmitting ? "Salvando..." : editingId ? "Salvar Alterações" : "Salvar Recibo"}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2.5 rounded-xl font-bold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-all cursor-pointer text-xs flex items-center justify-center gap-2"
              >
                <Printer size={14} /> Imprimir
              </button>
            </div>
          </form>
        </div>

        {/* PRÉ-VISUALIZAÇÃO / DOCUMENTO OFICIAL (ÁREA DE IMPRESSÃO) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="no-print flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Visualização do Documento
            </span>
          </div>

          <div
            id="printable-receipt-area"
            className="bg-white text-neutral-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-neutral-300 font-sans space-y-6"
          >
            {/* CABEÇALHO COM DADOS DA EMPRESA */}
            <div className="flex items-center justify-between border-b-2 border-neutral-900 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={logoDumar}
                  alt="Dumar Móveis Planejados"
                  className="w-12 h-12 object-contain rounded"
                />
                <div>
                  <h1 className="text-base font-black tracking-tight text-neutral-900 uppercase">
                    {currentReceipt.companyNomeFantasia}
                  </h1>
                  <p className="text-[11px] font-semibold text-neutral-700">
                    {currentReceipt.companyRazaoSocial}
                  </p>
                  <p className="text-[10px] text-neutral-600 font-mono">
                    CNPJ: {currentReceipt.companyCnpj} · Fone: {currentReceipt.companyPhone}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-black text-sm uppercase tracking-wider text-neutral-900">
                  RECIBO
                </span>
                <p className="text-xs font-mono font-bold text-neutral-800">
                  Nº {currentReceipt.receiptNumber || "-"}
                </p>
                <p className="text-[10px] text-neutral-600">
                  Data: {currentReceipt.receiptDate ? new Date(currentReceipt.receiptDate + "T00:00:00").toLocaleDateString("pt-BR") : "-"}
                </p>
              </div>
            </div>

            {/* VALOR DESTACADO */}
            <div className="bg-neutral-100 border border-neutral-300 rounded-lg p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-600 tracking-wider">Valor Recebido</span>
                <div className="text-xl font-black text-neutral-950 font-mono">
                  {currentReceipt.amount > 0 ? formatBRL(currentReceipt.amount) : "R$ 0,00"}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-neutral-600 tracking-wider">Forma de Pagamento</span>
                <div className="text-xs font-bold text-neutral-900">
                  {currentReceipt.paymentMethod || "PIX"}
                </div>
              </div>
            </div>

            {/* TEXTO FORMAL DO RECIBO */}
            <div className="space-y-4 text-xs sm:text-[13px] leading-relaxed text-neutral-800 text-justify">
              <p>
                Recebemos de <strong className="uppercase font-bold text-neutral-950">{currentReceipt.clientName || "______________________________________"}</strong>
                {currentReceipt.clientCpfCnpj && (
                  <span>, portador(a) do CPF/CNPJ sob nº <strong className="font-mono">{currentReceipt.clientCpfCnpj}</strong></span>
                )}
                {currentReceipt.clientPhone && <span>, telefone <strong>{currentReceipt.clientPhone}</strong></span>}
                , a importância de <strong className="font-bold text-neutral-950">{currentReceipt.amount > 0 ? formatBRL(currentReceipt.amount) : "R$ 0,00"}</strong>
                {currentReceipt.amountExtenso ? ` (${currentReceipt.amountExtenso})` : ""}.
              </p>

              <div className="p-3 bg-neutral-50 border-l-2 border-neutral-900 space-y-1">
                <span className="text-[10px] font-bold uppercase text-neutral-600 block">
                  Referente a:
                </span>
                <p className="font-medium text-neutral-900 whitespace-pre-line text-xs">
                  {currentReceipt.description || "________________________________________________________"}
                </p>
              </div>

              <p className="text-[11px] text-neutral-600">
                Para clareza e firmeza do que foi recebido, firmo o presente recibo dando plena e geral quitação da quantia discriminada.
              </p>
            </div>

            {/* DATA E ASSINATURA */}
            <div className="pt-6 border-t border-neutral-300 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-[11px] text-neutral-600">
                {currentReceipt.companyCity}, {formatDateExtenso(currentReceipt.receiptDate)}
              </div>

              <div className="text-center sm:text-right min-w-[200px]">
                <div className="w-48 h-0.5 bg-neutral-400 mx-auto sm:ml-auto sm:mr-0 mb-1" />
                <p className="text-xs font-bold text-neutral-900 uppercase">
                  {currentReceipt.companyNomeFantasia}
                </p>
                <p className="text-[10px] text-neutral-600 font-mono">
                  CNPJ: {currentReceipt.companyCnpj}
                </p>
              </div>
            </div>

            {/* RODAPÉ */}
            <div className="pt-2 border-t border-neutral-200 text-[9px] text-neutral-500 text-center flex items-center justify-between">
              <span>{currentReceipt.companyAddress}</span>
              <span>{currentReceipt.companyPhone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* HISTÓRICO DE RECIBOS (CRUD - READ, UPDATE, DELETE) */}
      <div className="no-print bg-[#121212] border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Histórico de Recibos
            </h3>
            <span className="text-xs bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded-full font-bold">
              {receiptsList.length}
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-gray-500 w-3.5 h-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, recibo..."
              className="w-full bg-black/50 border border-white/10 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-6 text-center text-gray-400 text-xs">
            Carregando recibos...
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="py-6 text-center text-gray-500 text-xs italic">
            Nenhum recibo encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-white/5 text-[10px] text-gray-400 uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-2.5 px-3">Nº Recibo</th>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Valor</th>
                  <th className="py-2.5 px-3">Forma</th>
                  <th className="py-2.5 px-3 max-w-[200px]">Referente a</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredReceipts.map(item => {
                  const isSelected = editingId === item.id;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleEditReceipt(item)}
                      className={`transition-colors cursor-pointer ${
                        isSelected ? "bg-amber-500/15" : "hover:bg-white/5"
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-300 whitespace-nowrap">
                        {item.receiptNumber}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-gray-400">
                        {item.receiptDate ? new Date(item.receiptDate + "T00:00:00").toLocaleDateString("pt-BR") : "-"}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                        {item.clientName}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-400 whitespace-nowrap font-mono">
                        {formatBRL(item.amount)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-gray-300">
                        {item.paymentMethod || "PIX"}
                      </td>
                      <td className="py-2.5 px-3 text-gray-400 max-w-[220px] truncate" title={item.description}>
                        {item.description}
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleEditReceipt(item)}
                          className="p-1.5 text-amber-400 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 font-bold text-[11px]"
                          title="Editar Recibo"
                        >
                          <Edit3 size={12} />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentReceipt(item);
                            setTimeout(() => handlePrint(item), 100);
                          }}
                          className="p-1.5 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 font-bold text-[11px]"
                          title="Imprimir Recibo"
                        >
                          <Printer size={12} />
                          <span>Imprimir</span>
                        </button>
                        <button
                          type="button"
                          onClick={e => handleDeleteReceipt(item.id!, e)}
                          className="p-1.5 text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 font-bold text-[11px]"
                          title="Excluir Recibo"
                        >
                          <Trash2 size={12} />
                          <span>Excluir</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
