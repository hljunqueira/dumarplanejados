import React, { useState, useEffect } from "react";
import { 
  FileText, Plus, Edit3, Printer, CheckCircle2, Clock, 
  Trash2, ShieldCheck, UserCheck, Search, X, Eye, Building, Phone, Mail, MapPin, Layers, DollarSign, AlertCircle, RefreshCw, Image, Upload,
  CreditCard, BookOpen, Check, ChevronRight, Calculator
} from "lucide-react";
import { Lead } from "./types";
import { ContractData, getDefaultContractData, buildClause3PaymentText, PaymentPlanType } from "@/lib/contract-generator";
import CRMMateriaisModal from "./crm-materiais-modal";
import logoDumar from "@/assets/logo1.jpeg";

interface CRMContractsViewProps {
  leads: Lead[];
}

export default function CRMContractsView({ leads }: CRMContractsViewProps) {
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal de Edição / Visualização do Contrato
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [editSubTab, setEditSubTab] = useState<"finance" | "clauses" | "memorial" | "nota">("finance");
  const [printSection, setPrintSection] = useState<"all" | "contrato" | "memorial" | "nota">("all");
  
  const [currentContract, setCurrentContract] = useState<ContractData>(getDefaultContractData());
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [newImageUrl, setNewImageUrl] = useState("");

  // Modal de Catálogo de Materiais
  const [isMaterialsModalOpen, setIsMaterialsModalOpen] = useState(false);
  const [targetMaterialCategory, setTargetMaterialCategory] = useState<string>("all");

  // Buscar contratos da API REST (com fallback localStorage)
  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contracts");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const OFFICIAL_ADDRESS = "Av. Santa Catarina, 551 sala 205, Centro - Balneário Arroio do Silva - SC";
          const parsed = data.map((item: any) => {
            let jsonDetails: any = {};
            try {
              jsonDetails = typeof item.dataJson === "string" ? JSON.parse(item.dataJson) : (item.dataJson || {});
            } catch (e) {}
            const merged = {
              ...getDefaultContractData(),
              ...jsonDetails,
              id: item.id,
              contractNumber: item.contractNumber,
              contractDate: item.contractDate,
              status: item.status,
              leadId: item.leadId,
              clientName: item.clientName,
              clientCpfCnpj: item.clientCpfCnpj,
              clientAddress: item.clientAddress,
              clientPhone: item.clientPhone,
              totalValue: item.totalValue,
              downPayment: item.downPayment,
            };

            // Sanitização de endereço da empresa
            if (!merged.companyAddress || merged.companyAddress.includes("Pereira")) {
              merged.companyAddress = OFFICIAL_ADDRESS;
            }

            return merged;
          });
          setContracts(parsed);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Erro ao buscar contratos da API, usando fallback local:", e);
    }

    // Fallback LocalStorage
    try {
      const saved = localStorage.getItem("dumar_contracts_db");
      if (saved) {
        const parsedSaved = JSON.parse(saved).map((c: any) => ({
          ...c,
          companyAddress: (!c.companyAddress || c.companyAddress.includes("Pereira")) ? "Av. Santa Catarina, 551 sala 205, Centro - Balneário Arroio do Silva - SC" : c.companyAddress
        }));
        setContracts(parsedSaved);
      } else if (leads.length > 0) {
        setContracts([getDefaultContractData(leads[0])]);
      } else {
        setContracts([getDefaultContractData()]);
      }
    } catch (e) {
      setContracts([getDefaultContractData()]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const saveContractsLocal = (newList: ContractData[]) => {
    setContracts(newList);
    try {
      localStorage.setItem("dumar_contracts_db", JSON.stringify(newList));
    } catch (e) {}
  };

  // Abrir Modal de Novo Contrato
  const handleOpenNewContract = (lead?: Lead) => {
    const defaultData = getDefaultContractData(lead);
    setCurrentContract(defaultData);
    setSelectedLeadId(lead ? lead.id.toString() : "");
    setEditSubTab("finance");
    setActiveTab("edit");
    setIsModalOpen(true);
  };

  // Abrir Contrato Existente para Editar ou Imprimir
  const handleOpenContract = (contract: ContractData, mode: "edit" | "preview" = "preview") => {
    const sanitizedContract = {
      ...contract,
      companyAddress: (!contract.companyAddress || contract.companyAddress.includes("Pereira")) 
        ? "Av. Santa Catarina, 551 sala 205, Centro - Balneário Arroio do Silva - SC" 
        : contract.companyAddress
    };
    setCurrentContract(sanitizedContract);
    setSelectedLeadId(sanitizedContract.leadId ? sanitizedContract.leadId.toString() : "");
    setActiveTab(mode);
    setIsModalOpen(true);
  };

  // Atualização reativa de valores, cálculo de saldo e recálculo da Cláusula 3 de Pagamento
  const updateContractFinance = (updates: Partial<ContractData>) => {
    setCurrentContract(prev => {
      const merged = { ...prev, ...updates };
      const total = Number(merged.totalValue) || 0;
      const plan = merged.paymentPlanType || "entrada_saldo";
      let down = Number(merged.downPayment) || 0;
      let comp = Number(merged.downPaymentComplement) || 0;
      let remaining = Math.max(0, total - down);

      if (plan === "a_vista") {
        down = total;
        remaining = 0;
        comp = 0;
      } else if (plan === "entrada_saldo" || plan === "entrada_parcelado") {
        comp = 0;
        remaining = Math.max(0, total - down);
      } else if (plan === "tres_etapas") {
        remaining = Math.max(0, total - (down + comp));
      } else if (plan === "parcelado_cartao") {
        down = 0;
        comp = 0;
        remaining = total;
      }

      const cardCount = Number(merged.cardInstallmentsCount) || 10;
      const cardVal = cardCount > 0 ? Math.round(remaining / cardCount) : 0;

      const nextObj: ContractData = {
        ...merged,
        downPayment: down,
        downPaymentComplement: comp,
        remainingBalance: remaining,
        assemblyPayment: remaining,
        cardInstallmentsCount: cardCount,
        cardInstallmentValue: cardVal,
      };

      nextObj.clause3Payment = buildClause3PaymentText(nextObj);
      return nextObj;
    });
  };

  // Preenchimento automático ao selecionar Lead no dropdown
  const handleSelectLeadChange = (leadIdStr: string) => {
    setSelectedLeadId(leadIdStr);
    if (!leadIdStr) return;

    const foundLead = leads.find(l => String(l.id) === leadIdStr);
    if (foundLead) {
      const defaultData = getDefaultContractData(foundLead);
      updateContractFinance({
        ...defaultData,
        id: currentContract.id,
        contractNumber: currentContract.contractNumber,
        leadId: foundLead.id,
        clientName: foundLead.name,
        clientPhone: foundLead.phone || currentContract.clientPhone,
        clientEmail: foundLead.email || currentContract.clientEmail,
        rooms: foundLead.rooms || currentContract.rooms,
        totalValue: Number(foundLead.value) || currentContract.totalValue,
        downPayment: Math.round((Number(foundLead.value) || currentContract.totalValue) * 0.4),
      });
    }
  };

  // Upload de imagem 3D local via FileReader
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUri = event.target.result as string;
          setCurrentContract(prev => ({
            ...prev,
            memorial: {
              ...prev.memorial,
              projectImages: [...(prev.memorial.projectImages || []), dataUri]
            }
          }));
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    setCurrentContract(prev => ({
      ...prev,
      memorial: {
        ...prev.memorial,
        projectImages: [...(prev.memorial.projectImages || []), newImageUrl.trim()]
      }
    }));
    setNewImageUrl("");
  };

  const handleRemoveImage = (index: number) => {
    setCurrentContract(prev => ({
      ...prev,
      memorial: {
        ...prev.memorial,
        projectImages: prev.memorial.projectImages.filter((_, i) => i !== index)
      }
    }));
  };

  // Salvar Contrato na API & State
  const handleSaveContract = async () => {
    try {
      const payload = {
        contractNumber: currentContract.contractNumber,
        contractDate: currentContract.contractDate,
        status: currentContract.status,
        leadId: currentContract.leadId ? Number(currentContract.leadId) : null,
        clientName: currentContract.clientName,
        clientCpfCnpj: currentContract.clientCpfCnpj,
        clientAddress: `${currentContract.clientAddress}, ${currentContract.clientBairro} - ${currentContract.clientCidadeUf}`,
        clientPhone: currentContract.clientPhone,
        totalValue: currentContract.totalValue,
        downPayment: currentContract.downPayment,
        dataJson: JSON.stringify(currentContract)
      };

      if (currentContract.id) {
        await fetch(`/api/contracts/${currentContract.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        const res = await fetch("/api/contracts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const created = await res.json();
          currentContract.id = created.id;
        }
      }
    } catch (e) {
      console.warn("Erro ao salvar no banco, operando via local storage:", e);
    }

    const existingIndex = contracts.findIndex(c => c.contractNumber === currentContract.contractNumber);
    let updatedList: ContractData[];
    if (existingIndex >= 0) {
      updatedList = [...contracts];
      updatedList[existingIndex] = currentContract;
    } else {
      updatedList = [currentContract, ...contracts];
    }
    saveContractsLocal(updatedList);
    setIsModalOpen(false);
    alert(`✅ Contrato ${currentContract.contractNumber} salvo com sucesso!`);
  };

  // Excluir Contrato
  const handleDeleteContract = async (contract: ContractData) => {
    if (!confirm(`Tem certeza que deseja excluir o contrato ${contract.contractNumber}?`)) return;
    
    if (contract.id) {
      try {
        await fetch(`/api/contracts/${contract.id}`, { method: "DELETE" });
      } catch (e) {}
    }

    const updated = contracts.filter(c => c.contractNumber !== contract.contractNumber);
    saveContractsLocal(updated);
  };

  // Sincronizar com Funil e Financeiro
  const handleSyncFunnelAndFinancial = async () => {
    if (!currentContract.leadId) {
      alert("Selecione um Lead associado para sincronizar com o Funil/Financeiro.");
      return;
    }

    try {
      await fetch(`/api/leads/${currentContract.leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: "contrato" })
      });

      await fetch("/api/financial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: `Sinal Contrato ${currentContract.contractNumber} - ${currentContract.clientName}`,
          type: "receita",
          amount: currentContract.downPayment,
          category: "venda_marcenaria",
          status: "pago",
          dueDate: currentContract.downPaymentDate,
          paymentDate: currentContract.downPaymentDate,
          paymentMethod: currentContract.paymentMethod,
          leadId: Number(currentContract.leadId),
          notes: `Contrato ${currentContract.contractNumber} Assinado`
        })
      });

      alert(`✅ Sucesso! O Lead foi movido para a etapa "Fechamento/Contrato" e a receita de R$ ${currentContract.downPayment.toLocaleString("pt-BR")} foi lançada no Financeiro.`);
    } catch (e) {
      alert("Erro ao sincronizar com Funil/Financeiro: " + (e as Error).message);
    }
  };

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = 
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(c.rooms) ? c.rooms.join(" ") : c.rooms).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "assinado":
        return <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold flex items-center gap-1 w-max"><CheckCircle2 size={12}/> Assinado</span>;
      case "aguardando_assinatura":
        return <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-bold flex items-center gap-1 w-max"><Clock size={12}/> Aguardando Assinatura</span>;
      case "concluido":
        return <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-[10px] font-bold flex items-center gap-1 w-max"><ShieldCheck size={12}/> Concluído</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-full text-[10px] font-bold flex items-center gap-1 w-max"><FileText size={12}/> Rascunho</span>;
    }
  };

  const handlePrint = () => {
    const printElement = document.getElementById("printable-contract-area");
    if (!printElement) {
      window.print();
      return;
    }

    const printWindow = window.open("", "_blank", "width=950,height=1100");
    if (!printWindow) {
      window.print();
      return;
    }

    const contentHtml = printElement.innerHTML;

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Contrato - ${currentContract.contractNumber} - ${currentContract.clientName}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 10mm 10mm 10mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: white !important;
            color: black !important;
            margin: 0;
            padding: 0;
            font-size: 11px;
            line-height: 1.45;
          }
          .contract-page {
            page-break-after: always !important;
            break-after: page !important;
            display: block !important;
            min-height: 98vh;
            padding: 10px 10px 20px 10px;
          }
          .contract-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
            min-height: auto;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          img {
            max-width: 100%;
          }
          @media print {
            .no-print { display: none !important; }
            .contract-page {
              page-break-after: always !important;
              break-after: page !important;
            }
            .contract-page:last-child {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
          }
        </style>
      </head>
      <body>
        ${contentHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 350);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const showPerSectionSignatures = currentContract.signatureLocation === "per_section";

  return (
    <div className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6 scrollbar-thin">
      {/* CABEÇALHO & BOTÃO NOVO CONTRATO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck size={22} className="text-amber-400" />
            Gestão de Contratos Jurídicos (Dumar Planejados)
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Gerador dinâmico dos 3 documentos oficiais: Contrato de Prestação de Serviços, Memorial Descritivo com fotos 3D e Nota de Atenção.
          </p>
        </div>

        <button
          onClick={() => handleOpenNewContract()}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Gerar Novo Contrato Dinâmico
        </button>
      </div>

      {/* FILTROS E PESQUISA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, número do contrato ou ambientes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
        >
          <option value="all" className="bg-neutral-900">Todos os Status</option>
          <option value="rascunho" className="bg-neutral-900">Rascunho</option>
          <option value="aguardando_assinatura" className="bg-neutral-900">Aguardando Assinatura</option>
          <option value="assinado" className="bg-neutral-900">Assinado</option>
          <option value="concluido" className="bg-neutral-900">Concluído</option>
        </select>
      </div>

      {/* TABELA DE CONTRATOS */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-amber-400" /> Carregando contratos...
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FileText size={40} className="mx-auto mb-3 text-gray-600" />
            <p className="text-sm font-semibold text-gray-300">Nenhum contrato encontrado</p>
            <p className="text-xs text-gray-500 mt-1">Clique em "Gerar Novo Contrato Dinâmico" para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-black/40 text-gray-400 uppercase tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Nº Contrato / Data</th>
                  <th className="py-3.5 px-4 font-bold">Cliente (Contratante)</th>
                  <th className="py-3.5 px-4 font-bold">Ambientes / Projeto</th>
                  <th className="py-3.5 px-4 font-bold">Valor Total (R$)</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredContracts.map(c => (
                  <tr key={c.contractNumber} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-amber-400">
                      <div>{c.contractNumber}</div>
                      <div className="text-[10px] text-gray-500 font-sans">{c.contractDate}</div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-white">
                      <div>{c.clientName}</div>
                      <div className="text-[10px] text-gray-400 font-normal">{c.clientPhone}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="truncate max-w-[200px] block text-gray-300">
                        {Array.isArray(c.rooms) ? c.rooms.join(", ") : c.rooms}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-green-400">
                      {c.totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(c.status)}</td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenContract(c, "edit")}
                        className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors cursor-pointer"
                        title="Editar Contrato"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleOpenContract(c, "preview")}
                        className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 p-2 rounded-lg transition-colors cursor-pointer"
                        title="Imprimir / PDF Timbrado"
                      >
                        <Printer size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteContract(c)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Contrato"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE EDIÇÃO E VISUALIZAÇÃO / IMPRESSÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* CABEÇALHO DO MODAL */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/60 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Contrato: <span className="text-amber-400 font-mono">{currentContract.contractNumber}</span>
                  </h3>
                  <p className="text-xs text-gray-400">Cliente: {currentContract.clientName}</p>
                </div>
              </div>

              {/* SELETOR DE MODO: EDITAR / VISUALIZAR */}
              <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setActiveTab("edit")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "edit" ? "bg-amber-500 text-black font-bold" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Edit3 size={14} /> Editar Minuta
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "preview" ? "bg-amber-500 text-black font-bold" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Eye size={14} /> Visualizar / PDF
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-white transition-colors ml-2 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ABA 1: FORMULÁRIO DE EDIÇÃO COMPLETO */}
            {activeTab === "edit" && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin text-xs">
                
                {/* SUB-ABAS DE EDIÇÃO */}
                <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
                  <button
                    onClick={() => setEditSubTab("finance")}
                    className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      editSubTab === "finance" ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <DollarSign size={14} /> 1. Dados & Ficha Financeira
                  </button>
                  <button
                    onClick={() => setEditSubTab("clauses")}
                    className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      editSubTab === "clauses" ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <ShieldCheck size={14} /> 2. Cláusulas Contratuais (1-10)
                  </button>
                  <button
                    onClick={() => setEditSubTab("memorial")}
                    className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      editSubTab === "memorial" ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <Layers size={14} /> 3. Memorial Descritivo & Fotos 3D
                  </button>
                  <button
                    onClick={() => setEditSubTab("nota")}
                    className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      editSubTab === "nota" ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <AlertCircle size={14} /> 4. Nota de Atenção
                  </button>
                </div>

                {/* CONFIGURAÇÃO DO LOCAL DAS ASSINATURAS */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-amber-400" />
                    <div>
                      <p className="font-bold text-white text-xs">Localização do Bloco de Assinaturas:</p>
                      <p className="text-[10px] text-gray-400">Escolha se a assinatura será apenas no final do contrato unificado ou em cada uma das partes.</p>
                    </div>
                  </div>

                  <select
                    value={currentContract.signatureLocation}
                    onChange={e => setCurrentContract({ ...currentContract, signatureLocation: e.target.value as any })}
                    className="bg-neutral-900 border border-amber-500/40 rounded-lg px-3 py-2 text-amber-300 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="end_only">Apenas no Final do Contrato (Recomendado)</option>
                    <option value="per_section">Ao Final de Cada Documento / Parte</option>
                  </select>
                </div>

                {/* SUB-ABA 1: DADOS & FICHA FINANCEIRA */}
                {editSubTab === "finance" && (
                  <div className="space-y-6">
                    {/* SELEÇÃO DO LEAD */}
                    <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3">
                      <label className="text-gray-300 font-bold flex items-center gap-2">
                        <UserCheck size={14} className="text-amber-400" />
                        Vincular ao Lead do CRM (Importar Dados Automaticamente):
                      </label>
                      <select
                        value={selectedLeadId}
                        onChange={e => handleSelectLeadChange(e.target.value)}
                        className="w-full bg-neutral-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                      >
                        <option value="">-- Selecionar Lead ou Inserir Manualmente --</option>
                        {leads.map(lead => (
                          <option key={lead.id} value={String(lead.id)}>
                            {lead.name} - {lead.phone} ({lead.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* DADOS DO CLIENTE */}
                    <div className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-4">
                      <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] border-b border-white/10 pb-2">
                        Dados do Contratante (Cliente)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-gray-400 mb-1 font-bold">Nome do Cliente</label>
                          <input
                            type="text"
                            value={currentContract.clientName}
                            onChange={e => setCurrentContract({ ...currentContract, clientName: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-1 font-bold">CPF / CNPJ</label>
                          <input
                            type="text"
                            value={currentContract.clientCpfCnpj}
                            onChange={e => setCurrentContract({ ...currentContract, clientCpfCnpj: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-1 font-bold">RG</label>
                          <input
                            type="text"
                            value={currentContract.clientRg}
                            onChange={e => setCurrentContract({ ...currentContract, clientRg: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-1 font-bold">Endereço (Rua e Nº)</label>
                          <input
                            type="text"
                            value={currentContract.clientAddress}
                            onChange={e => setCurrentContract({ ...currentContract, clientAddress: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-1 font-bold">Bairro</label>
                          <input
                            type="text"
                            value={currentContract.clientBairro}
                            onChange={e => setCurrentContract({ ...currentContract, clientBairro: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-1 font-bold">Cidade / UF</label>
                          <input
                            type="text"
                            value={currentContract.clientCidadeUf}
                            onChange={e => setCurrentContract({ ...currentContract, clientCidadeUf: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-1 font-bold">Telefone / WhatsApp</label>
                          <input
                            type="text"
                            value={currentContract.clientPhone}
                            onChange={e => setCurrentContract({ ...currentContract, clientPhone: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-1 font-bold">E-mail</label>
                          <input
                            type="text"
                            value={currentContract.clientEmail}
                            onChange={e => setCurrentContract({ ...currentContract, clientEmail: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-1 font-bold">Status do Contrato</label>
                          <select
                            value={currentContract.status}
                            onChange={e => setCurrentContract({ ...currentContract, status: e.target.value as any })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none cursor-pointer font-bold"
                          >
                            <option value="rascunho">Rascunho</option>
                            <option value="aguardando_assinatura">Aguardando Assinatura</option>
                            <option value="assinado">Assinado</option>
                            <option value="concluido">Concluído</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* DADOS DA CONTRATADA (DUMAR) */}
                    <div className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-3">
                      <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] border-b border-white/10 pb-2 flex items-center justify-between">
                        <span>Dados da Contratada (Dumar Móveis Planejados)</span>
                        <span className="text-[10px] text-gray-400 font-normal">Endereço e dados legais impressos no contrato</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                          <label className="block text-gray-400 mb-1 font-bold text-xs">Endereço Institucional da Empresa</label>
                          <input
                            type="text"
                            value={currentContract.companyAddress}
                            onChange={e => setCurrentContract({ ...currentContract, companyAddress: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-1 font-bold text-xs">Telefone / WhatsApp</label>
                          <input
                            type="text"
                            value={currentContract.companyPhone}
                            onChange={e => setCurrentContract({ ...currentContract, companyPhone: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* VALORES E CALCULADORA DE PAGAMENTO */}
                    <div className="bg-black/30 border border-amber-500/20 rounded-xl p-5 space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                          <Calculator size={16} className="text-amber-400" />
                          <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs">
                            Calculadora e Condições de Pagamento
                          </h4>
                        </div>
                        <span className="text-[11px] text-gray-400">
                          Recálculo dinâmico da Cláusula 3 e parcelas em tempo real
                        </span>
                      </div>

                      {/* VALOR TOTAL DO PEDIDO */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-neutral-950/60 p-4 rounded-xl border border-white/5">
                        <div className="md:col-span-2">
                          <label className="block text-gray-300 mb-1 font-bold text-xs">
                            Valor Total do Pedido Contratado (R$):
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-green-400 font-bold text-sm">R$</span>
                            <input
                              type="number"
                              value={currentContract.totalValue}
                              onChange={e => {
                                const val = Number(e.target.value) || 0;
                                updateContractFinance({ totalValue: val });
                              }}
                              className="w-full bg-neutral-900 border border-green-500/40 rounded-lg p-2.5 pl-10 text-green-400 text-lg font-black focus:outline-none focus:border-green-400"
                              placeholder="0,00"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-gray-300 mb-1 font-bold text-xs">Prazo de Fabricação (Dias Úteis)</label>
                          <input
                            type="number"
                            value={currentContract.productionDays || 45}
                            onChange={e => setCurrentContract({ ...currentContract, productionDays: Number(e.target.value) })}
                            className="w-full bg-neutral-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      {/* SELEÇÃO DA MODALIDADE DE PAGAMENTO */}
                      <div className="space-y-2">
                        <label className="block text-gray-300 font-bold text-xs">
                          Escolha a Modalidade de Pagamento Acordada:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                          {[
                            { id: "a_vista", label: "À Vista", sub: "PIX / Dinheiro", icon: DollarSign },
                            { id: "entrada_saldo", label: "1 + 1 (Entrada + Saldo)", sub: "Saldo na Montagem", icon: CheckCircle2 },
                            { id: "entrada_parcelado", label: "Entrada + Cartão", sub: "Saldo Parcelado", icon: CreditCard },
                            { id: "tres_etapas", label: "3 Etapas", sub: "Sinal / Obra / Fim", icon: Layers },
                            { id: "parcelado_cartao", label: "100% Cartão", sub: "Até 18x no Cartão", icon: CreditCard },
                          ].map(plan => {
                            const isSelected = (currentContract.paymentPlanType || "entrada_saldo") === plan.id;
                            const Icon = plan.icon;
                            return (
                              <button
                                key={plan.id}
                                type="button"
                                onClick={() => updateContractFinance({ paymentPlanType: plan.id as PaymentPlanType })}
                                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                  isSelected 
                                    ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10" 
                                    : "bg-neutral-900/80 border-white/10 text-gray-400 hover:text-white hover:bg-neutral-800"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <Icon size={16} className={isSelected ? "text-amber-400" : "text-gray-400"} />
                                  {isSelected && <span className="w-2 h-2 rounded-full bg-amber-400"></span>}
                                </div>
                                <div>
                                  <div className="font-bold text-xs text-white">{plan.label}</div>
                                  <div className="text-[10px] text-gray-400">{plan.sub}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* CAMPOS DINÂMICOS CONFORME A MODALIDADE ESCOLHIDA */}
                      <div className="bg-neutral-950/80 p-4 rounded-xl border border-white/10 space-y-4">
                        {/* 1. MODO À VISTA */}
                        {currentContract.paymentPlanType === "a_vista" && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-gray-400 mb-1 font-bold text-xs">Forma de Pagamento À Vista</label>
                              <select
                                value={currentContract.paymentMethod}
                                onChange={e => updateContractFinance({ paymentMethod: e.target.value })}
                                className="w-full bg-neutral-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                              >
                                <option value="PIX / Transferência">PIX / Transferência Instantânea</option>
                                <option value="Dinheiro em Espécie">Dinheiro em Espécie</option>
                                <option value="Cartão de Débito">Cartão de Débito</option>
                                <option value="TED / DOC">TED / Transferência Bancária</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-gray-400 mb-1 font-bold text-xs">Data Prevista para Quitação</label>
                              <input
                                type="text"
                                value={currentContract.downPaymentDate}
                                onChange={e => updateContractFinance({ downPaymentDate: e.target.value })}
                                className="w-full bg-neutral-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {/* 2. MODO 1+1 (ENTRADA + SALDO NA MONTAGEM) */}
                        {currentContract.paymentPlanType === "entrada_saldo" && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-gray-400 mb-1 font-bold text-xs">Valor da Entrada (R$)</label>
                                <input
                                  type="number"
                                  value={currentContract.downPayment}
                                  onChange={e => updateContractFinance({ downPayment: Number(e.target.value) || 0 })}
                                  className="w-full bg-neutral-900 border border-amber-500/40 rounded-lg p-2.5 text-amber-300 font-bold text-xs focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-gray-400 mb-1 font-bold text-xs">Forma de Pagamento da Entrada</label>
                                <input
                                  type="text"
                                  value={currentContract.downPaymentMethod || "PIX"}
                                  onChange={e => updateContractFinance({ downPaymentMethod: e.target.value })}
                                  className="w-full bg-neutral-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-gray-400 mb-1 font-bold text-xs">Data da Entrada</label>
                                <input
                                  type="text"
                                  value={currentContract.downPaymentDate}
                                  onChange={e => updateContractFinance({ downPaymentDate: e.target.value })}
                                  className="w-full bg-neutral-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* SALDO RESTANTE CALCULADO AUTOMATICAMENTE */}
                            <div className="p-3 bg-neutral-900 rounded-xl border border-green-500/30 flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <div className="text-[11px] text-gray-400 font-semibold">Saldo Restante Calculado:</div>
                                <div className="text-base font-black text-green-400">
                                  {Math.max(0, currentContract.totalValue - currentContract.downPayment).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </div>
                              </div>
                              <div className="flex-1 max-w-sm">
                                <label className="block text-gray-400 mb-1 font-bold text-[11px]">Como será pago o saldo?</label>
                                <input
                                  type="text"
                                  value={currentContract.remainingPaymentMethod || "PIX na conclusão da montagem"}
                                  onChange={e => updateContractFinance({ remainingPaymentMethod: e.target.value })}
                                  placeholder="Ex: PIX na conclusão da montagem ou Cartão"
                                  className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 3. MODO ENTRADA + SALDO PARCELADO NO CARTÃO */}
                        {currentContract.paymentPlanType === "entrada_parcelado" && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-gray-400 mb-1 font-bold text-xs">Valor da Entrada no PIX/Dinheiro (R$)</label>
                                <input
                                  type="number"
                                  value={currentContract.downPayment}
                                  onChange={e => updateContractFinance({ downPayment: Number(e.target.value) || 0 })}
                                  className="w-full bg-neutral-900 border border-amber-500/40 rounded-lg p-2.5 text-amber-300 font-bold text-xs focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-gray-400 mb-1 font-bold text-xs">Saldo a Parcelar no Cartão</label>
                                <div className="p-2.5 bg-neutral-900 border border-white/10 rounded-lg text-green-400 font-bold text-xs">
                                  {Math.max(0, currentContract.totalValue - currentContract.downPayment).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-gray-400 mb-1 font-bold text-xs">Quantidade de Parcelas no Cartão</label>
                                <select
                                  value={currentContract.cardInstallmentsCount || 10}
                                  onChange={e => updateContractFinance({ cardInstallmentsCount: Number(e.target.value) })}
                                  className="w-full bg-neutral-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none cursor-pointer"
                                >
                                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18].map(n => (
                                    <option key={n} value={n}>{n}x parcelas no Cartão</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-gray-400 mb-1 font-bold text-xs">Valor Estimado por Parcela</label>
                                <div className="p-2.5 bg-neutral-900 border border-amber-500/30 rounded-lg text-amber-300 font-black text-xs">
                                  {currentContract.cardInstallmentsCount || 10}x de {((Math.max(0, currentContract.totalValue - currentContract.downPayment)) / (currentContract.cardInstallmentsCount || 10)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 4. MODO 3 ETAPAS */}
                        {currentContract.paymentPlanType === "tres_etapas" && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-gray-400 mb-1 font-bold text-xs">1. Sinal no Contrato (R$)</label>
                              <input
                                type="number"
                                value={currentContract.downPayment}
                                onChange={e => updateContractFinance({ downPayment: Number(e.target.value) || 0 })}
                                className="w-full bg-neutral-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-400 mb-1 font-bold text-xs">2. Complemento na Entrega dos Módulos (R$)</label>
                              <input
                                type="number"
                                value={currentContract.downPaymentComplement}
                                onChange={e => updateContractFinance({ downPaymentComplement: Number(e.target.value) || 0 })}
                                className="w-full bg-neutral-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-400 mb-1 font-bold text-xs">3. Saldo no Fim da Montagem (R$)</label>
                              <div className="p-2.5 bg-neutral-900 border border-green-500/40 rounded-lg text-green-400 font-bold text-xs">
                                {Math.max(0, currentContract.totalValue - (currentContract.downPayment + currentContract.downPaymentComplement)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 5. MODO 100% PARCELADO NO CARTÃO */}
                        {currentContract.paymentPlanType === "parcelado_cartao" && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-gray-400 mb-1 font-bold text-xs">Número de Parcelas</label>
                              <select
                                value={currentContract.cardInstallmentsCount || 12}
                                onChange={e => updateContractFinance({ cardInstallmentsCount: Number(e.target.value) })}
                                className="w-full bg-neutral-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none cursor-pointer"
                              >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18].map(n => (
                                  <option key={n} value={n}>{n}x parcelas</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-gray-400 mb-1 font-bold text-xs">Valor por Parcela no Cartão</label>
                              <div className="p-2.5 bg-neutral-900 border border-amber-500/30 rounded-lg text-amber-300 font-black text-xs">
                                {currentContract.cardInstallmentsCount || 12}x de {(currentContract.totalValue / (currentContract.cardInstallmentsCount || 12)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* AMBIENTES CONTRATADOS */}
                      <div>
                        <label className="block text-gray-300 mb-1 font-bold text-xs">Ambientes Inclusos no Contrato (separados por vírgula):</label>
                        <input
                          type="text"
                          value={Array.isArray(currentContract.rooms) ? currentContract.rooms.join(", ") : currentContract.rooms}
                          onChange={e => setCurrentContract({ ...currentContract, rooms: e.target.value.split(",").map(s => s.trim()) })}
                          placeholder="Ex: Cozinha Planejada, Dormitório Casal, Painel de TV"
                          className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-ABA 2: CLÁUSULAS CONTRATUAIS (1 A 10) */}
                {editSubTab === "clauses" && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] border-b border-white/10 pb-2">
                      Cláusulas Contratuais (Totalmente Editáveis)
                    </h4>

                    <div>
                      <label className="block text-gray-300 font-bold mb-1">Cláusula 1ª - Do Objeto</label>
                      <textarea
                        rows={2}
                        value={currentContract.clause1Object}
                        onChange={e => setCurrentContract({ ...currentContract, clause1Object: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold mb-1">Cláusula 2ª - Dos Prazos</label>
                      <textarea
                        rows={2}
                        value={currentContract.clause2Deadlines}
                        onChange={e => setCurrentContract({ ...currentContract, clause2Deadlines: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold mb-1">Cláusula 3ª - Do Pagamento e Multas</label>
                      <textarea
                        rows={2}
                        value={currentContract.clause3Payment}
                        onChange={e => setCurrentContract({ ...currentContract, clause3Payment: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold mb-1">Cláusula 4ª - Das Obrigações da Contratada</label>
                      <textarea
                        rows={2}
                        value={currentContract.clause4CompanyDuties}
                        onChange={e => setCurrentContract({ ...currentContract, clause4CompanyDuties: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold mb-1">Cláusula 5ª - Das Obrigações do Contratante</label>
                      <textarea
                        rows={2}
                        value={currentContract.clause5ClientDuties}
                        onChange={e => setCurrentContract({ ...currentContract, clause5ClientDuties: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold mb-1">Cláusula 6ª - Da Entrega e Montagem</label>
                      <textarea
                        rows={2}
                        value={currentContract.clause6DeliveryAssembly}
                        onChange={e => setCurrentContract({ ...currentContract, clause6DeliveryAssembly: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold mb-1">Cláusula 7ª - Da Garantia (12 Meses)</label>
                      <textarea
                        rows={2}
                        value={currentContract.clause7Warranty}
                        onChange={e => setCurrentContract({ ...currentContract, clause7Warranty: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold mb-1">Cláusula 8ª - Da Assistência Técnica</label>
                      <textarea
                        rows={2}
                        value={currentContract.clause8TechnicalSupport}
                        onChange={e => setCurrentContract({ ...currentContract, clause8TechnicalSupport: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold mb-1">Cláusula 9ª - Do Cancelamento e Rescisão</label>
                      <textarea
                        rows={2}
                        value={currentContract.clause9Cancellation}
                        onChange={e => setCurrentContract({ ...currentContract, clause9Cancellation: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold mb-1">Cláusula 10ª - Das Disposições Gerais e Foro</label>
                      <textarea
                        rows={2}
                        value={currentContract.clause10General}
                        onChange={e => setCurrentContract({ ...currentContract, clause10General: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* SUB-ABA 3: MEMORIAL DESCRITIVO & PROJETO 3D (COM UPLOAD DE FOTOS) */}
                {editSubTab === "memorial" && (
                  <div className="space-y-6">
                    <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] border-b border-white/10 pb-2">
                      Memorial Descritivo & Imagens de Aprovação do Projeto 3D
                    </h4>

                    {/* SEÇÃO DE UPLOAD DE IMAGENS 3D DO PROJETO */}
                    <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-white font-bold flex items-center gap-2 text-xs">
                          <Image size={16} className="text-amber-400" />
                          Imagens do Projeto 3D (Para Anexar e Imprimir no Memorial)
                        </label>
                        <span className="text-[10px] text-gray-400 font-semibold">
                          {(currentContract.memorial.projectImages || []).length} imagem(ns) adicionada(s)
                        </span>
                      </div>

                      {/* AREA DE UPLOAD DE ARQUIVOS LOCAL */}
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <label className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 text-xs shadow-md shadow-amber-500/20">
                          <Upload size={16} /> Fazer Upload de Imagens 3D
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageFileUpload}
                            className="hidden"
                          />
                        </label>

                        <div className="flex-1 w-full flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Ou cole a URL da imagem 3D..."
                            value={newImageUrl}
                            onChange={e => setNewImageUrl(e.target.value)}
                            className="w-full bg-neutral-800 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                          />
                          <button
                            type="button"
                            onClick={handleAddImageUrl}
                            className="bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-2.5 rounded-xl transition-all cursor-pointer text-xs"
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>

                      {/* THUMBNAILS DAS IMAGENS ADICIONADAS */}
                      {(currentContract.memorial.projectImages || []).length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                          {currentContract.memorial.projectImages.map((imgUrl, idx) => (
                            <div key={idx} className="relative group border border-white/10 rounded-lg overflow-hidden bg-black aspect-video">
                              <img src={imgUrl} alt={`Projeto 3D ${idx + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white p-1 rounded-full opacity-90 transition-opacity cursor-pointer"
                                title="Remover imagem"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                      <div>
                        <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs">
                          Especificações Técnicas e Materiais do Projeto
                        </h4>
                        <p className="text-[11px] text-gray-400">
                          Preencha manualmente ou clique no botão para selecionar os padrões do catálogo da Dumar.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTargetMaterialCategory("all");
                          setIsMaterialsModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                      >
                        <BookOpen size={14} />
                        Catálogo de Materiais
                      </button>
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold mb-1 text-xs">Termo de Instruções e Aprovação do Projeto 3D</label>
                      <textarea
                        rows={4}
                        value={currentContract.memorial.instrucoesProjeto}
                        onChange={e => setCurrentContract({
                          ...currentContract,
                          memorial: { ...currentContract.memorial, instrucoesProjeto: e.target.value }
                        })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* ESTRUTURA */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-gray-300 font-bold text-xs">Estrutura do Móvel (Caixaria / MDF)</label>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetMaterialCategory("estrutura");
                              setIsMaterialsModalOpen(true);
                            }}
                            className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <BookOpen size={11} /> Escolher do Catálogo
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={currentContract.memorial.estruturaMdf}
                          onChange={e => setCurrentContract({
                            ...currentContract,
                            memorial: { ...currentContract.memorial, estruturaMdf: e.target.value }
                          })}
                          className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      {/* FRENTES */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-gray-300 font-bold text-xs">Frentes de Portas e Gavetas</label>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetMaterialCategory("frentes");
                              setIsMaterialsModalOpen(true);
                            }}
                            className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <BookOpen size={11} /> Escolher do Catálogo
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={currentContract.memorial.frentesMdf}
                          onChange={e => setCurrentContract({
                            ...currentContract,
                            memorial: { ...currentContract.memorial, frentesMdf: e.target.value }
                          })}
                          className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      {/* TAMPONAMENTOS */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-gray-300 font-bold text-xs">Tamponamentos e Painéis Lineares</label>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetMaterialCategory("tamponamento");
                              setIsMaterialsModalOpen(true);
                            }}
                            className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <BookOpen size={11} /> Escolher do Catálogo
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={currentContract.memorial.tamponamentosMdf}
                          onChange={e => setCurrentContract({
                            ...currentContract,
                            memorial: { ...currentContract.memorial, tamponamentosMdf: e.target.value }
                          })}
                          className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      {/* VIDROS E ALUMÍNIO (NOVO!) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-xs flex items-center gap-1.5 text-amber-300">
                            <Eye size={13} className="text-amber-400" />
                            Vidros & Perfis de Alumínio (Portas/Cristaleira)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetMaterialCategory("vidros");
                              setIsMaterialsModalOpen(true);
                            }}
                            className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <BookOpen size={11} /> Escolher do Catálogo
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          placeholder="Ex: Portas em vidro Reflecta Fumê 4mm com perfil de alumínio Slim preto fosco."
                          value={currentContract.memorial.vidros || ""}
                          onChange={e => setCurrentContract({
                            ...currentContract,
                            memorial: { ...currentContract.memorial, vidros: e.target.value }
                          })}
                          className="w-full bg-black/50 border border-amber-500/30 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      {/* PUXADORES */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-gray-300 font-bold text-xs">Puxadores</label>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetMaterialCategory("puxadores");
                              setIsMaterialsModalOpen(true);
                            }}
                            className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <BookOpen size={11} /> Escolher do Catálogo
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={currentContract.memorial.puxadores}
                          onChange={e => setCurrentContract({
                            ...currentContract,
                            memorial: { ...currentContract.memorial, puxadores: e.target.value }
                          })}
                          className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      {/* DOBRADIÇAS */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-gray-300 font-bold text-xs">Dobradiças e Sistemas de Giro</label>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetMaterialCategory("dobradicas");
                              setIsMaterialsModalOpen(true);
                            }}
                            className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <BookOpen size={11} /> Escolher do Catálogo
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={currentContract.memorial.dobradicas}
                          onChange={e => setCurrentContract({
                            ...currentContract,
                            memorial: { ...currentContract.memorial, dobradicas: e.target.value }
                          })}
                          className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      {/* CORREDIÇAS */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-gray-300 font-bold text-xs">Corrediças</label>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetMaterialCategory("corredicas");
                              setIsMaterialsModalOpen(true);
                            }}
                            className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <BookOpen size={11} /> Escolher do Catálogo
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={currentContract.memorial.corredicas}
                          onChange={e => setCurrentContract({
                            ...currentContract,
                            memorial: { ...currentContract.memorial, corredicas: e.target.value }
                          })}
                          className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      {/* ITENS EXTRAS */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-gray-300 font-bold text-xs">Itens Extras (ex: Iluminação LED, etc.)</label>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetMaterialCategory("extras");
                              setIsMaterialsModalOpen(true);
                            }}
                            className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <BookOpen size={11} /> Escolher do Catálogo
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={currentContract.memorial.itensExtras}
                          onChange={e => setCurrentContract({
                            ...currentContract,
                            memorial: { ...currentContract.memorial, itensExtras: e.target.value }
                          })}
                          className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-ABA 4: NOTA DE ATENÇÃO */}
                {editSubTab === "nota" && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] border-b border-white/10 pb-2">
                      Nota de Atenção e Orientações Pré/Durante/Pós Montagem
                    </h4>

                    <div>
                      <label className="block text-gray-300 font-bold mb-1">Instruções Gerais de Atenção</label>
                      <textarea
                        rows={3}
                        value={currentContract.notaAtencao.instrucoesGerais}
                        onChange={e => setCurrentContract({
                          ...currentContract,
                          notaAtencao: { ...currentContract.notaAtencao, instrucoesGerais: e.target.value }
                        })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold mb-1">Cidade e Data da Assinatura</label>
                      <input
                        type="text"
                        value={currentContract.notaAtencao.cidadeData}
                        onChange={e => setCurrentContract({
                          ...currentContract,
                          notaAtencao: { ...currentContract.notaAtencao, cidadeData: e.target.value }
                        })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* BOTÕES DE AÇÃO */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={handleSyncFunnelAndFinancial}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-600/20 flex items-center gap-2"
                  >
                    <RefreshCw size={15} /> Sincronizar com Funil & Financeiro
                  </button>

                  <button
                    onClick={handleSaveContract}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Salvar Contrato Atualizado
                  </button>
                </div>
              </div>
            )}

            {/* ABA 2: VISUALIZAÇÃO E IMPRESSÃO / PDF TIMBRADO (3 DOCUMENTOS UNIFICADOS) */}
            {activeTab === "preview" && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-neutral-900 scrollbar-thin">
                
                {/* BOTÕES DE IMPRESSÃO SUPERIORES */}
                <div className="max-w-4xl mx-auto mb-6 flex flex-wrap justify-between items-center gap-3 print:hidden">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 font-semibold">Exibir na Impressão:</span>
                    <select
                      value={printSection}
                      onChange={e => setPrintSection(e.target.value as any)}
                      className="bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="all">3 Documentos Completos (Recomendado)</option>
                      <option value="contrato">Apenas Contrato Principal</option>
                      <option value="memorial">Apenas Memorial Descritivo (3D)</option>
                      <option value="nota">Apenas Nota de Atenção</option>
                    </select>

                    <select
                      value={currentContract.signatureLocation}
                      onChange={e => setCurrentContract({ ...currentContract, signatureLocation: e.target.value as any })}
                      className="bg-amber-500/10 border border-amber-500/40 rounded-lg px-3 py-1.5 text-xs text-amber-400 font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="end_only">Assinatura no Final do Contrato</option>
                      <option value="per_section">Assinaturas ao Fim de Cada Parte</option>
                    </select>
                  </div>

                  <button
                    onClick={handlePrint}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Printer size={16} /> Imprimir / Salvar em PDF
                  </button>
                </div>

                {/* CONTAINER DA FOLHA TIMBRADA (ESTILIZADA PARA IMPRESSÃO EM PDF) */}
                <div id="printable-contract-area" className="max-w-4xl mx-auto bg-white text-black p-8 sm:p-12 shadow-2xl font-serif text-xs leading-relaxed print:p-0 print:shadow-none print:max-w-none print:text-black">
                  
                  {/* CSS EXCLUSIVO DE IMPRESSÃO COM QUEBRA DE PÁGINAS */}
                  <style font-sans="true">{`
                    @media print {
                      body { background: white !important; color: black !important; }
                      .print\\:hidden { display: none !important; }
                      .contract-page { page-break-after: always; break-after: page; }
                      .contract-page:last-child { page-break-after: avoid; break-after: avoid; }
                    }
                  `}</style>

                  {/* ====================================================== */}
                  {/* DOCUMENTO 1: CONTRATO PRINCIPAL */}
                  {/* ====================================================== */}
                  {(printSection === "all" || printSection === "contrato") && (
                    <div className="contract-page mb-12 print:mb-0">
                      {/* Cabeçalho Timbrado */}
                      <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
                        <div className="flex items-center gap-4">
                          <img src={logoDumar} alt="Dumar Logo" className="w-14 h-14 object-contain rounded-lg" />
                          <div>
                            <h1 className="font-sans font-black text-lg tracking-wider uppercase">{currentContract.companyName}</h1>
                            <p className="font-sans text-[10px] text-gray-700 font-bold">{currentContract.companyRazaoSocial}</p>
                            <p className="font-sans text-[9px] text-gray-600">CNPJ: {currentContract.companyCnpj} | Fone: {currentContract.companyPhone}</p>
                            <p className="font-sans text-[9px] text-gray-600">{currentContract.companyAddress}</p>
                          </div>
                        </div>
                        <div className="text-right font-sans">
                          <div className="font-bold text-sm text-black font-mono">{currentContract.contractNumber}</div>
                          <div className="text-xs text-gray-600">Data: {currentContract.contractDate}</div>
                        </div>
                      </div>

                      <div className="text-center mb-6">
                        <h2 className="font-sans font-black text-sm uppercase tracking-wide border-b-2 border-black inline-block pb-1">
                          CONTRATO DE PRESTAÇÃO DE SERVIÇOS E FABRICAÇÃO DE MÓVEIS PLANEJADOS
                        </h2>
                      </div>

                      {/* Partes */}
                      <div className="space-y-2 mb-6 text-justify text-[11px]">
                        <p>
                          <strong>CONTRATADA:</strong> <strong>{currentContract.companyRazaoSocial}</strong>, CNPJ {currentContract.companyCnpj}, Dumar Móveis Planejados, com sede à {currentContract.companyAddress}.
                        </p>
                        <p>
                          <strong>CONTRATANTE:</strong> Nome: <strong>{currentContract.clientName}</strong> | CPF/CNPJ: <strong>{currentContract.clientCpfCnpj}</strong> | Endereço: <strong>{currentContract.clientAddress}</strong> | Bairro: <strong>{currentContract.clientBairro}</strong>, <strong>{currentContract.clientCidadeUf}</strong> | Fone: {currentContract.clientPhone}.
                        </p>
                      </div>

                      {/* Cláusulas 1 a 10 */}
                      <div className="space-y-3 text-[11px] text-justify font-sans">
                        <p><strong>1. Objeto:</strong> {currentContract.clause1Object}</p>
                        <p><strong>2. Prazo:</strong> {currentContract.clause2Deadlines}</p>
                        
                        <div className="bg-gray-100 p-3 rounded border border-gray-300 font-sans my-2">
                          <p className="font-bold border-b border-gray-300 pb-1 mb-1">3. Condições de Pagamento:</p>
                          <p>{currentContract.clause3Payment}</p>
                          <div className="grid grid-cols-3 gap-2 mt-2 text-[10px]">
                            <div><strong>Sinal 1:</strong> R$ {currentContract.downPayment.toLocaleString("pt-BR")} ({currentContract.downPaymentDate})</div>
                            <div><strong>Complemento:</strong> R$ {currentContract.downPaymentComplement.toLocaleString("pt-BR")} ({currentContract.downPaymentComplementDate})</div>
                            <div><strong>Saldo Montagem:</strong> R$ {currentContract.assemblyPayment.toLocaleString("pt-BR")}</div>
                          </div>
                        </div>

                        <p><strong>4. Obrigações da Contratada:</strong> {currentContract.clause4CompanyDuties}</p>
                        <p><strong>5. Obrigações do Contratante:</strong> {currentContract.clause5ClientDuties}</p>
                        <p><strong>6. Entrega e Montagem:</strong> {currentContract.clause6DeliveryAssembly}</p>
                        <p><strong>7. Garantia:</strong> {currentContract.clause7Warranty}</p>
                        <p><strong>8. Assistência Técnica:</strong> {currentContract.clause8TechnicalSupport}</p>
                        <p><strong>9. Cancelamento:</strong> {currentContract.clause9Cancellation}</p>
                        <p><strong>10. Disposições Gerais:</strong> {currentContract.clause10General}</p>
                      </div>

                      {/* Assinaturas (Se configurado por seção) */}
                      {showPerSectionSignatures && (
                        <div className="mt-10 pt-6 border-t border-gray-400 font-sans">
                          <div className="grid grid-cols-2 gap-10 text-center text-xs">
                            <div>
                              <div className="border-t border-black pt-1 font-bold uppercase">{currentContract.clientName}</div>
                              <div className="text-[10px] text-gray-600">CONTRATANTE</div>
                            </div>
                            <div>
                              <div className="border-t border-black pt-1 font-bold uppercase">{currentContract.companyName}</div>
                              <div className="text-[10px] text-gray-600">CONTRATADA (CNPJ: {currentContract.companyCnpj})</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-10 text-center text-[11px] mt-8">
                            <div>
                              <div className="border-t border-gray-400 pt-1">TESTEMUNHA 1: ________________________</div>
                              <div className="text-[9px] text-gray-500">CPF:</div>
                            </div>
                            <div>
                              <div className="border-t border-gray-400 pt-1">TESTEMUNHA 2: ________________________</div>
                              <div className="text-[9px] text-gray-500">CPF:</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ====================================================== */}
                  {/* DOCUMENTO 2: MEMORIAL DESCRITIVO & PROJETO 3D (COM FOTOS) */}
                  {/* ====================================================== */}
                  {(printSection === "all" || printSection === "memorial") && (
                    <div className="contract-page mb-12 print:mb-0">
                      <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
                        <div className="flex items-center gap-4">
                          <img src={logoDumar} alt="Dumar Logo" className="w-14 h-14 object-contain rounded-lg" />
                          <div>
                            <h1 className="font-sans font-black text-lg uppercase">{currentContract.companyName}</h1>
                            <p className="font-sans text-[10px] text-gray-700 font-bold">MEMORIAL DESCRITIVO E APROVAÇÃO DO PROJETO 3D</p>
                          </div>
                        </div>
                        <div className="text-right font-sans text-xs">
                          <div className="font-bold font-mono">{currentContract.contractNumber}</div>
                          <div>Data: {currentContract.contractDate}</div>
                        </div>
                      </div>

                      <div className="text-center mb-4">
                        <h2 className="font-sans font-black text-sm uppercase tracking-wide border-b-2 border-black inline-block pb-1">
                          INSTRUÇÕES DE APROVAÇÃO E DETALHAMENTO TÉCNICO
                        </h2>
                      </div>

                      <div className="bg-gray-50 p-4 rounded border border-gray-300 text-[10.5px] leading-relaxed text-justify font-sans mb-6">
                        <h3 className="font-bold text-black uppercase mb-1">Instruções de Projeto:</h3>
                        <p>{currentContract.memorial.instrucoesProjeto}</p>
                      </div>

                      {/* RENDERS E FOTOS 3D DO PROJETO */}
                      {(currentContract.memorial.projectImages || []).length > 0 && (
                        <div className="mb-6 font-sans">
                          <h3 className="font-bold text-xs uppercase border-b border-black pb-1 mb-3">
                            IMAGENS E RENDERS DO PROJETO 3D APROVADO:
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            {currentContract.memorial.projectImages.map((imgUrl, idx) => (
                              <div key={idx} className="border border-gray-300 rounded p-1 bg-gray-50 text-center">
                                <img src={imgUrl} alt={`Projeto 3D render ${idx + 1}`} className="w-full max-h-56 object-contain rounded" />
                                <span className="text-[9px] text-gray-500 font-sans block mt-1">Imagem 3D Ilustrativa {idx + 1}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mb-6 font-sans">
                        <h3 className="font-bold text-xs uppercase border-b border-black pb-1 mb-3">
                          ESPECIFICAÇÕES TÉCNICAS E MATERIAIS DO PROJETO:
                        </h3>

                        <table className="w-full text-left border-collapse border border-gray-300 text-[11px]">
                          <tbody>
                            <tr className="border-b border-gray-300 bg-gray-100">
                              <td className="p-2.5 font-bold w-1/3 border-r border-gray-300">Estrutura do Móvel</td>
                              <td className="p-2.5">{currentContract.memorial.estruturaMdf}</td>
                            </tr>
                            <tr className="border-b border-gray-300">
                              <td className="p-2.5 font-bold border-r border-gray-300">Frentes (Portas/Gavetas)</td>
                              <td className="p-2.5">{currentContract.memorial.frentesMdf}</td>
                            </tr>
                            <tr className="border-b border-gray-300 bg-gray-100">
                              <td className="p-2.5 font-bold border-r border-gray-300">Tamponamentos / Painéis</td>
                              <td className="p-2.5">{currentContract.memorial.tamponamentosMdf}</td>
                            </tr>
                            <tr className="border-b border-gray-300">
                              <td className="p-2.5 font-bold border-r border-gray-300">Vidros & Perfis de Alumínio</td>
                              <td className="p-2.5">{currentContract.memorial.vidros || "Não aplicável / Conforme projeto"}</td>
                            </tr>
                            <tr className="border-b border-gray-300 bg-gray-100">
                              <td className="p-2.5 font-bold border-r border-gray-300">Puxadores</td>
                              <td className="p-2.5">{currentContract.memorial.puxadores}</td>
                            </tr>
                            <tr className="border-b border-gray-300">
                              <td className="p-2.5 font-bold border-r border-gray-300">Dobradiças / Giro</td>
                              <td className="p-2.5">{currentContract.memorial.dobradicas}</td>
                            </tr>
                            <tr className="border-b border-gray-300 bg-gray-100">
                              <td className="p-2.5 font-bold border-r border-gray-300">Corrediças</td>
                              <td className="p-2.5">{currentContract.memorial.corredicas}</td>
                            </tr>
                            <tr className="bg-amber-50">
                              <td className="p-2.5 font-bold border-r border-gray-300 text-amber-900">Itens Extras</td>
                              <td className="p-2.5 font-bold text-amber-900">{currentContract.memorial.itensExtras || "Nenhum item extra especificado."}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Assinaturas (Se configurado por seção) */}
                      {showPerSectionSignatures && (
                        <div className="mt-12 pt-6 border-t border-gray-400 font-sans">
                          <p className="text-center text-[10px] mb-8">
                            Estando ambas as partes entendidas e de acordo com o detalhamento e imagens apresentadas, assinam e assumem suas responsabilidades por meio deste.
                          </p>
                          <div className="grid grid-cols-2 gap-10 text-center text-xs">
                            <div>
                              <div className="border-t border-black pt-1 font-bold uppercase">{currentContract.clientName}</div>
                              <div className="text-[10px] text-gray-600">Cliente / Contratante</div>
                            </div>
                            <div>
                              <div className="border-t border-black pt-1 font-bold uppercase">{currentContract.companyName}</div>
                              <div className="text-[10px] text-gray-600">Dumar Móveis Planejados (CNPJ: {currentContract.companyCnpj})</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ====================================================== */}
                  {/* DOCUMENTO 3: NOTA DE ATENÇÃO & ASSINATURAS FINAIS */}
                  {/* ====================================================== */}
                  {(printSection === "all" || printSection === "nota") && (
                    <div className="contract-page">
                      <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
                        <div className="flex items-center gap-4">
                          <img src={logoDumar} alt="Dumar Logo" className="w-14 h-14 object-contain rounded-lg" />
                          <div>
                            <h1 className="font-sans font-black text-lg uppercase">{currentContract.companyName}</h1>
                            <p className="font-sans text-[10px] text-gray-700 font-bold">NOTA DE ATENÇÃO E RECOMENDAÇÕES</p>
                          </div>
                        </div>
                        <div className="text-right font-sans text-xs">
                          <div className="font-bold font-mono">{currentContract.contractNumber}</div>
                          <div>Data: {currentContract.contractDate}</div>
                        </div>
                      </div>

                      <div className="text-center mb-4">
                        <h2 className="font-sans font-black text-sm uppercase tracking-wide border-b-2 border-black inline-block pb-1 text-red-700">
                          ATENÇÃO E RECOMENDAÇÕES PRÉ / PÓS MONTAGEM
                        </h2>
                      </div>

                      <div className="bg-red-50/50 p-3 rounded border border-red-200 text-[10.5px] leading-relaxed text-justify font-sans mb-5">
                        <p>{currentContract.notaAtencao.instrucoesGerais}</p>
                      </div>

                      <div className="space-y-4 font-sans text-[10.5px]">
                        <div>
                          <h3 className="font-bold text-xs uppercase text-black border-b border-gray-300 pb-1 mb-2">
                            Antes da Entrega:
                          </h3>
                          <ul className="list-disc pl-5 space-y-1">
                            {currentContract.notaAtencao.antesEntrega.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h3 className="font-bold text-xs uppercase text-black border-b border-gray-300 pb-1 mb-2">
                            Durante a Montagem:
                          </h3>
                          <ul className="list-disc pl-5 space-y-1">
                            {currentContract.notaAtencao.duranteMontagem.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h3 className="font-bold text-xs uppercase text-black border-b border-gray-300 pb-1 mb-2">
                            Ao Término da Montagem:
                          </h3>
                          <ul className="list-disc pl-5 space-y-1">
                            {currentContract.notaAtencao.aoTerminoMontagem.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* ASSINATURA FINAL UNIFICADA (OU APENAS DA NOTA) */}
                      <div className="mt-10 pt-6 border-t border-gray-400 font-sans">
                        <p className="text-center text-xs font-bold mb-8">
                          {currentContract.notaAtencao.cidadeData}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-10 text-center text-xs">
                          <div>
                            <div className="border-t border-black pt-1 font-bold uppercase">{currentContract.companyName}</div>
                            <div className="text-[10px] text-gray-600">Dumar Móveis Planejados LTDA (CONTRATADA)</div>
                          </div>
                          <div>
                            <div className="border-t border-black pt-1 font-bold uppercase">{currentContract.clientName}</div>
                            <div className="text-[10px] text-gray-600">Cliente / Contratante (CONTRATANTE)</div>
                          </div>
                        </div>

                        {/* TESTEMUNHAS CASO ASSINATURA SEJA NO FINAL UNIFICADO */}
                        {!showPerSectionSignatures && (
                          <div className="grid grid-cols-2 gap-10 text-center text-[11px] mt-8">
                            <div>
                              <div className="border-t border-gray-400 pt-1">TESTEMUNHA 1: ________________________</div>
                              <div className="text-[9px] text-gray-500">CPF:</div>
                            </div>
                            <div>
                              <div className="border-t border-gray-400 pt-1">TESTEMUNHA 2: ________________________</div>
                              <div className="text-[9px] text-gray-500">CPF:</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL DE CATÁLOGO DE MATERIAIS, VIDROS E FERRAGENS */}
      <CRMMateriaisModal
        isOpen={isMaterialsModalOpen}
        onClose={() => setIsMaterialsModalOpen(false)}
        targetCategory={targetMaterialCategory}
        onSelectMaterial={(category, description) => {
          setCurrentContract(prev => {
            const updatedMemorial = { ...prev.memorial };
            if (category === "estrutura") updatedMemorial.estruturaMdf = description;
            else if (category === "frentes") updatedMemorial.frentesMdf = description;
            else if (category === "tamponamento") updatedMemorial.tamponamentosMdf = description;
            else if (category === "vidros") updatedMemorial.vidros = description;
            else if (category === "puxadores") updatedMemorial.puxadores = description;
            else if (category === "dobradicas") updatedMemorial.dobradicas = description;
            else if (category === "corredicas") updatedMemorial.corredicas = description;
            else if (category === "extras") updatedMemorial.itensExtras = description;
            return {
              ...prev,
              memorial: updatedMemorial
            };
          });
        }}
      />
    </div>
  );
}
