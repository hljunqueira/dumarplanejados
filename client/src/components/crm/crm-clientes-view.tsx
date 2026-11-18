import React, { useState, useEffect, useMemo } from "react";
import {
  Users, Plus, Search, Edit3, Trash2, Phone, Mail, User,
  FileText, Check, X, MapPin, Building2, MessageSquare, AlertCircle,
  RefreshCw, ExternalLink, ShieldCheck, ChevronRight, Receipt, DollarSign,
  Calendar, Layers, CheckCircle2, Copy
} from "lucide-react";
import { useLocation } from "wouter";
import { Client, InsertClient } from "@shared/schema";
import { Lead } from "./types";
import { useConfirmDialog } from "../ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDateSafeBR } from "./crm-financeiro";

interface CRMClientesViewProps {
  leads?: Lead[];
  onSelectClientForContext?: (client: Client) => void;
}

export default function CRMClientesView({ leads = [], onSelectClientForContext }: CRMClientesViewProps): JSX.Element {
  const { confirm, showAlert } = useConfirmDialog();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [receiptsList, setReceiptsList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDeduplicating, setIsDeduplicating] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Redirecionamento para o módulo de Contratos
  const handleNavigateToContract = (contractNumber?: string) => {
    if (contractNumber) {
      try {
        sessionStorage.setItem("contract_search_target", contractNumber);
      } catch (e) {}
    }
    setLocation("/crm/contratos");
  };

  // Seleção e Modos do Painel Direito (Tudo na Mesma Página)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [panelMode, setPanelMode] = useState<"view" | "edit" | "new">("view");
  const [activeDetailTab, setActiveDetailTab] = useState<"dados" | "contratos" | "recibos">("dados");

  // Filtros e Busca
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<"todos" | "com_contrato" | "com_cpf" | "origem_lead">("todos");

  // Form State
  const [formName, setFormName] = useState("");
  const [formCpfCnpj, setFormCpfCnpj] = useState("");
  const [formRg, setFormRg] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formBairro, setFormBairro] = useState("");
  const [formCity, setFormCity] = useState("Balneário Arroio do Silva - SC");
  const [formCep, setFormCep] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // Carregar dados de clientes, contratos e recibos
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [resClients, resContracts, resReceipts] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/contracts"),
        fetch("/api/receipts")
      ]);

      if (resClients.ok) {
        const cData = await resClients.json();
        const list = Array.isArray(cData) ? cData : [];
        setClients(list);
        
        // Se já havia um selecionado, manter atualizado
        setSelectedClient(prev => {
          if (!prev && list.length > 0) return list[0];
          if (!prev) return null;
          return list.find(c => c.id === prev.id) || list[0] || null;
        });
      }

      if (resContracts.ok) {
        const ctrData = await resContracts.json();
        setContracts(Array.isArray(ctrData) ? ctrData : []);
      }

      if (resReceipts.ok) {
        const rData = await resReceipts.json();
        setReceiptsList(Array.isArray(rData) ? rData : []);
      }
    } catch (err) {
      console.error("Erro ao carregar dados de clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Busca automática de endereço via CEP (ViaCEP)
  const handleCepBlur = async () => {
    const clean = formCep.replace(/\D/g, "");
    if (clean.length === 8) {
      try {
        setIsSearchingCep(true);
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        if (res.ok) {
          const data = await res.json();
          if (!data.erro) {
            if (data.logradouro && !formAddress) setFormAddress(data.logradouro);
            if (data.bairro && !formBairro) setFormBairro(data.bairro);
            if (data.localidade && data.uf) setFormCity(`${data.localidade} - ${data.uf}`);
            toast({
              title: "Endereço Localizado",
              description: `${data.logradouro || ""}, ${data.bairro || ""} - ${data.localidade}/${data.uf}`,
            });
          }
        }
      } catch (e) {
        console.warn("ViaCEP indisponível:", e);
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  // Abrir modo "Novo Cliente"
  const handleStartNew = () => {
    setSelectedClient(null);
    setFormName("");
    setFormCpfCnpj("");
    setFormRg("");
    setFormPhone("");
    setFormEmail("");
    setFormAddress("");
    setFormBairro("");
    setFormCity("Balneário Arroio do Silva - SC");
    setFormCep("");
    setFormNotes("");
    setPanelMode("new");
  };

  // Abrir modo "Editar Cliente"
  const handleStartEdit = (cli: Client) => {
    setSelectedClient(cli);
    setFormName(cli.name || "");
    setFormCpfCnpj(cli.cpfCnpj || "");
    setFormRg(cli.rg || "");
    setFormPhone(cli.phone || "");
    setFormEmail(cli.email || "");
    setFormAddress(cli.address || "");
    setFormBairro(cli.bairro || "");
    setFormCity(cli.city || "Balneário Arroio do Silva - SC");
    setFormCep(cli.cep || "");
    setFormNotes(cli.notes || "");
    setPanelMode("edit");
  };

  // Cancelar formulário e voltar para visualização
  const handleCancelForm = () => {
    if (selectedClient) {
      setPanelMode("view");
    } else if (clients.length > 0) {
      setSelectedClient(clients[0]);
      setPanelMode("view");
    } else {
      setPanelMode("view");
    }
  };

  // Salvar Cliente (Novo ou Edição)
  const handleSubmitClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      await showAlert({
        title: "Nome Obrigatório",
        message: "Por favor, preencha o nome completo do cliente.",
        variant: "warning"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: Partial<InsertClient> = {
        name: formName.trim(),
        cpfCnpj: formCpfCnpj.trim(),
        rg: formRg.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        address: formAddress.trim(),
        bairro: formBairro.trim(),
        city: formCity.trim(),
        cep: formCep.trim(),
        notes: formNotes.trim(),
      };

      if (panelMode === "edit" && selectedClient) {
        const res = await fetch(`/api/clients/${selectedClient.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Erro ao atualizar cliente");
        const updated = await res.json();
        toast({
          title: "Cliente Atualizado",
          description: `Os dados de ${updated.name} foram atualizados com sucesso.`
        });
        setSelectedClient(updated);
      } else {
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Erro ao cadastrar cliente");
        const created = await res.json();
        toast({
          title: "Cliente Registrado",
          description: `${created.name} cadastrado na base com sucesso.`
        });
        setSelectedClient(created);
      }

      setPanelMode("view");
      await loadAllData();
    } catch (err) {
      console.error(err);
      await showAlert({
        title: "Erro ao Salvar",
        message: "Não foi possível salvar o cliente. Verifique os dados e tente novamente.",
        variant: "danger"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Excluir Cliente com confirmação segura
  const handleDeleteClient = async (cli: Client) => {
    const ok = await confirm({
      title: "Excluir Cadastro de Cliente",
      message: `Tem certeza que deseja excluir o cadastro de "${cli.name}"?\nEsta ação removerá o registro do sistema. Contratos e lançamentos já emitidos permanecerão com histórico preservado.`,
      variant: "danger",
      confirmText: "Sim, Excluir Cliente"
    });

    if (!ok) return;

    try {
      const res = await fetch(`/api/clients/${cli.id}`, { method: "DELETE" });
      if (res.ok) {
        toast({
          title: "Cliente Removido",
          description: `Cadastro de ${cli.name} removido com sucesso.`
        });
        const remaining = clients.filter(c => c.id !== cli.id);
        setClients(remaining);
        if (selectedClient?.id === cli.id) {
          setSelectedClient(remaining[0] || null);
          setPanelMode("view");
        }
      } else {
        throw new Error("Erro ao excluir");
      }
    } catch (err) {
      await showAlert({
        title: "Erro ao Excluir",
        message: "Não foi possível excluir o cliente no momento.",
        variant: "danger"
      });
    }
  };

  // Executar Deduplicação Automática da Base
  const handleDeduplicate = async () => {
    const ok = await confirm({
      title: "Deduplicar Base de Clientes",
      message: "O sistema irá verificar cadastros com o mesmo CPF/CNPJ ou mesmo Nome/Telefone, mesclando dados complementares no cadastro principal e removendo os clones redundantes.\n\nDeseja executar a deduplicação agora?",
      confirmText: "Sim, Deduplicar",
      variant: "warning"
    });

    if (!ok) return;

    try {
      setIsDeduplicating(true);
      const res = await fetch("/api/clients/deduplicate", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        toast({
          title: "Base Deduplicada",
          description: data.message || `Deduplicação concluída! ${data.mergedCount} duplicatas unificadas.`
        });
        await loadAllData();
      } else {
        throw new Error("Erro ao deduplicar");
      }
    } catch (e) {
      toast({
        title: "Erro",
        description: "Falha ao executar a deduplicação de clientes.",
        variant: "destructive"
      });
    } finally {
      setIsDeduplicating(false);
    }
  };

  // Sincronizar de Contratos & Leads (com proteção anti-duplicação)
  const handleSyncFromSources = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch("/api/clients/sync-from-sources", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        toast({
          title: "Sincronização Finalizada",
          description: `${data.imported || 0} novos clientes importados. Total na base: ${data.total || 0}`
        });
        await loadAllData();
      }
    } catch (e) {
      toast({
        title: "Erro",
        description: "Erro ao sincronizar clientes de contratos e leads.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Contratos vinculados ao cliente selecionado
  const clientContracts = useMemo(() => {
    if (!selectedClient) return [];
    const cleanDoc = (selectedClient.cpfCnpj || "").replace(/\D/g, "");
    const cleanName = (selectedClient.name || "").trim().toLowerCase();
    
    return contracts.filter(ctr => {
      if (ctr.clientId && ctr.clientId === selectedClient.id) return true;
      const ctrDoc = (ctr.clientCpfCnpj || "").replace(/\D/g, "");
      if (cleanDoc && cleanDoc.length >= 11 && ctrDoc === cleanDoc) return true;
      if (ctr.clientName && ctr.clientName.trim().toLowerCase() === cleanName) return true;
      return false;
    });
  }, [selectedClient, contracts]);

  // Obter contratos vinculados a qualquer cliente
  const getContractsForClient = (cli: Client) => {
    const cleanDoc = (cli.cpfCnpj || "").replace(/\D/g, "");
    const cleanName = (cli.name || "").trim().toLowerCase();
    return contracts.filter(ctr => {
      if (ctr.clientId && ctr.clientId === cli.id) return true;
      const ctrDoc = (ctr.clientCpfCnpj || "").replace(/\D/g, "");
      if (cleanDoc && cleanDoc.length >= 11 && ctrDoc === cleanDoc) return true;
      if (ctr.clientName && ctr.clientName.trim().toLowerCase() === cleanName) return true;
      return false;
    });
  };
  const clientReceipts = useMemo(() => {
    if (!selectedClient) return [];
    const cleanDoc = (selectedClient.cpfCnpj || "").replace(/\D/g, "");
    const cleanName = (selectedClient.name || "").trim().toLowerCase();

    return receiptsList.filter(rec => {
      if (rec.clientId && rec.clientId === selectedClient.id) return true;
      const recDoc = (rec.clientCpfCnpj || "").replace(/\D/g, "");
      if (cleanDoc && cleanDoc.length >= 11 && recDoc === cleanDoc) return true;
      if (rec.clientName && rec.clientName.trim().toLowerCase() === cleanName) return true;
      return false;
    });
  }, [selectedClient, receiptsList]);

  // Filtragem da lista
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = !term || (
        (c.name || "").toLowerCase().includes(term) ||
        (c.cpfCnpj || "").toLowerCase().includes(term) ||
        (c.phone || "").toLowerCase().includes(term) ||
        (c.email || "").toLowerCase().includes(term) ||
        (c.city || "").toLowerCase().includes(term) ||
        (c.address || "").toLowerCase().includes(term) ||
        (c.notes || "").toLowerCase().includes(term)
      );

      if (!matchSearch) return false;

      if (filterType === "com_contrato") {
        const hasCtr = contracts.some(ctr => 
          ctr.clientId === c.id || 
          (c.name && ctr.clientName && ctr.clientName.trim().toLowerCase() === c.name.trim().toLowerCase())
        );
        return hasCtr;
      }

      if (filterType === "com_cpf") {
        return !!(c.cpfCnpj && c.cpfCnpj.trim().length >= 11);
      }

      if (filterType === "origem_lead") {
        return !!(c.leadId || (c.notes && c.notes.toLowerCase().includes("lead")));
      }

      return true;
    });
  }, [clients, searchTerm, filterType, contracts]);

  // Formatação de WhatsApp
  const getWhatsAppLink = (phone?: string | null) => {
    if (!phone) return null;
    const clean = phone.replace(/\D/g, "");
    if (!clean) return null;
    const ddiNumber = clean.startsWith("55") ? clean : `55${clean}`;
    return `https://wa.me/${ddiNumber}`;
  };

  // Iniciais para avatar
  const getInitials = (name: string) => {
    if (!name) return "CL";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0d11] text-white font-sans overflow-hidden">
      
      {/* 1. TOP BAR FIXA: Métricas, Título & Ações Principais */}
      <header className="h-16 border-b border-white/10 px-4 sm:px-6 flex items-center justify-between bg-[#11141a]/90 backdrop-blur-md flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Users size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Base Central de Clientes
              </h1>
              <span className="text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                {clients.length} cadastrados
              </span>
            </div>
            <p className="text-[11px] text-gray-400 hidden sm:block">
              Gestão unificada de clientes para contratos, projetos e recibos financeiros
            </p>
          </div>
        </div>

        {/* Ações Topo */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDeduplicate}
            disabled={isDeduplicating}
            className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-amber-500/40 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Mesclar cadastros duplicados com mesmo CPF ou Nome/Telefone"
          >
            <ShieldCheck size={14} className={isDeduplicating ? "animate-spin text-amber-400" : "text-amber-400"} />
            <span className="hidden md:inline">{isDeduplicating ? "Deduplicando..." : "Deduplicar Base"}</span>
          </button>

          <button
            type="button"
            onClick={handleSyncFromSources}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-blue-500/40 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Importar clientes existentes em contratos e leads com proteção anti-duplicidade"
          >
            <RefreshCw size={13} className={isSyncing ? "animate-spin text-blue-400" : "text-blue-400"} />
            <span className="hidden lg:inline">{isSyncing ? "Sincronizando..." : "Puxar de Contratos"}</span>
          </button>

          <button
            type="button"
            onClick={handleStartNew}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Novo Cliente</span>
          </button>
        </div>
      </header>

      {/* 2. CORPO PRINCIPAL: MASTER-DETAIL SPLIT VIEW (100% DA ALTURA - ZERO SCROLL NO BODY) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ======================================================== */}
        {/* PAINEL ESQUERDO: LISTA DE CLIENTES COM BUSCA & FILTROS   */}
        {/* ======================================================== */}
        <section className="w-full md:w-[380px] lg:w-[420px] border-r border-white/10 flex flex-col bg-[#0e1015] flex-shrink-0">
          
          {/* Barra de Busca e Filtros Rápidos */}
          <div className="p-3 sm:p-4 border-b border-white/10 space-y-2.5 bg-black/20 flex-shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, CPF, fone, cidade..."
                className="w-full pl-9 pr-8 py-2 bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Pílulas de Filtro */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              {[
                { id: "todos", label: "Todos", count: clients.length },
                { id: "com_contrato", label: "Com Contrato" },
                { id: "com_cpf", label: "Com CPF" },
                { id: "origem_lead", label: "Leads" }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterType(f.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                    filterType === f.id
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                      : "bg-white/5 text-gray-400 hover:text-white border border-transparent"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista com Rolagem Contida Interna */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 scrollbar-thin">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 space-y-2">
                <RefreshCw size={22} className="animate-spin text-amber-400" />
                <span className="text-xs">Carregando base de clientes...</span>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-8 text-center text-gray-500 space-y-2">
                <Users size={32} className="mx-auto text-gray-600 opacity-60" />
                <p className="text-xs font-semibold">Nenhum cliente encontrado</p>
                <p className="text-[11px] text-gray-600">Ajuste os termos de busca ou clique em "+ Novo Cliente"</p>
              </div>
            ) : (
              filteredClients.map(cli => {
                const isSelected = selectedClient?.id === cli.id;
                const waLink = getWhatsAppLink(cli.phone);
                const initials = getInitials(cli.name);

                return (
                  <div
                    key={cli.id}
                    onClick={() => {
                      setSelectedClient(cli);
                      setPanelMode("view");
                    }}
                    className={`group p-3 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5"
                        : "bg-[#14171f] hover:bg-[#1a1e27] border-white/5 hover:border-white/15"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 transition-colors ${
                        isSelected
                          ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                          : "bg-white/10 text-amber-300 group-hover:bg-amber-500/20"
                      }`}>
                        {initials}
                      </div>

                      {/* Dados Principais */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className={`text-xs font-bold truncate ${
                            isSelected ? "text-amber-300" : "text-white group-hover:text-amber-200"
                          }`}>
                            {cli.name}
                          </h3>

                          {/* Ações Rápidas */}
                          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(cli)}
                              className="p-1 text-gray-400 hover:text-amber-400 rounded hover:bg-white/10 transition-colors"
                              title="Editar cliente"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClient(cli)}
                              className="p-1 text-gray-400 hover:text-red-400 rounded hover:bg-red-500/10 transition-colors"
                              title="Excluir cliente"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Documento e Telefone */}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {cli.cpfCnpj ? (
                            <span className="text-[10px] font-mono text-gray-300 bg-white/5 border border-white/10 px-1.5 py-0.2 rounded">
                              {cli.cpfCnpj}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-500 italic">Sem CPF</span>
                          )}

                          {cli.phone && (
                            <div className="flex items-center gap-1 text-[11px] text-gray-300">
                              <Phone size={10} className="text-gray-400" />
                              <span>{cli.phone}</span>
                              {waLink && (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="text-emerald-400 hover:text-emerald-300 p-0.5"
                                  title="Abrir WhatsApp"
                                >
                                  <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Cidade / Endereço */}
                        {(cli.city || cli.address) && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400 truncate">
                            <MapPin size={10} className="text-gray-500 flex-shrink-0" />
                            <span className="truncate">{cli.city || cli.address}</span>
                          </div>
                        )}

                        {/* Contratos Vinculados com clique para abrir */}
                        {(() => {
                          const cliCtrs = getContractsForClient(cli);
                          if (cliCtrs.length === 0) return null;
                          return (
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap" onClick={e => e.stopPropagation()}>
                              {cliCtrs.map(ctr => (
                                <button
                                  key={ctr.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNavigateToContract(ctr.contractNumber);
                                  }}
                                  className="text-[10px] font-mono text-amber-300 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Clique para abrir este contrato no módulo de Contratos"
                                >
                                  <FileText size={10} />
                                  <span>{ctr.contractNumber}</span>
                                  <ExternalLink size={9} className="opacity-70" />
                                </button>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ======================================================== */}
        {/* PAINEL DIREITO: FICHA 360° & EDIÇÃO (TUDO NA MESMA TELA) */}
        {/* ======================================================== */}
        <main className="flex-1 flex flex-col bg-[#0b0d11] overflow-hidden">
          
          {panelMode === "view" && selectedClient ? (
            /* MODO 1: VISUALIZAÇÃO COMPLETA DA FICHA 360° DO CLIENTE */
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Header do Cliente Selecionado */}
              <div className="p-5 sm:p-6 border-b border-white/10 bg-[#12151c]/80 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-lg shadow-inner">
                    {getInitials(selectedClient.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                        {selectedClient.name}
                      </h2>
                      {selectedClient.cpfCnpj && (
                        <span className="text-xs font-mono font-bold bg-white/10 border border-white/15 px-2 py-0.5 rounded-md text-amber-300">
                          {selectedClient.cpfCnpj}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 flex-wrap">
                      {selectedClient.city && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-gray-500" />
                          {selectedClient.city}
                        </span>
                      )}
                      {selectedClient.createdAt && (
                        <span className="text-[11px] text-gray-500">
                          Cadastrado em: {new Date(selectedClient.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ações da Ficha */}
                <div className="flex items-center gap-2">
                  {getWhatsAppLink(selectedClient.phone) && (
                    <a
                      href={getWhatsAppLink(selectedClient.phone)!}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-600/20"
                    >
                      <MessageSquare size={14} />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleStartEdit(selectedClient)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Edit3 size={14} />
                    <span>Editar Ficha</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteClient(selectedClient)}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all cursor-pointer"
                    title="Excluir cadastro"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Abas Internas da Ficha (Dados, Contratos, Recibos) */}
              <div className="border-b border-white/10 px-6 flex items-center gap-4 bg-black/20 flex-shrink-0">
                {[
                  { id: "dados", label: "Dados Cadastrais", icon: User },
                  { id: "contratos", label: `Contratos (${clientContracts.length})`, icon: FileText },
                  { id: "recibos", label: `Recibos (${clientReceipts.length})`, icon: Receipt },
                ].map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveDetailTab(t.id as any)}
                      className={`py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                        activeDetailTab === t.id
                          ? "border-amber-400 text-amber-300"
                          : "border-transparent text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      <Icon size={14} />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Conteúdo com Rolagem Contida */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                
                {/* ABA 1: DADOS CADASTRAIS COMPLETOS */}
                {activeDetailTab === "dados" && (
                  <div className="space-y-6 max-w-4xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Cartão de Identificação */}
                      <div className="bg-[#14171f] border border-white/10 rounded-2xl p-5 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <User size={13} /> Identificação Oficial
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-gray-400 block text-[11px]">Nome Completo</span>
                            <span className="font-semibold text-white">{selectedClient.name}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-gray-400 block text-[11px]">CPF / CNPJ</span>
                              <span className="font-mono text-white">{selectedClient.cpfCnpj || "Não informado"}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 block text-[11px]">RG</span>
                              <span className="font-mono text-white">{selectedClient.rg || "Não informado"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cartão de Contato */}
                      <div className="bg-[#14171f] border border-white/10 rounded-2xl p-5 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <Phone size={13} /> Contatos & Comunicação
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-gray-400 block text-[11px]">Telefone Principal</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{selectedClient.phone || "Não informado"}</span>
                              {getWhatsAppLink(selectedClient.phone) && (
                                <a
                                  href={getWhatsAppLink(selectedClient.phone)!}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5"
                                >
                                  Conversar <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[11px]">E-mail</span>
                            <span className="text-white">{selectedClient.email || "Não informado"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Cartão de Endereço */}
                      <div className="bg-[#14171f] border border-white/10 rounded-2xl p-5 space-y-3 md:col-span-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <MapPin size={13} /> Endereço de Instalação / Residencial
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className="sm:col-span-2">
                            <span className="text-gray-400 block text-[11px]">Logradouro / Número</span>
                            <span className="font-semibold text-white">{selectedClient.address || "Não informado"}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[11px]">Bairro</span>
                            <span className="text-white">{selectedClient.bairro || "Não informado"}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[11px]">Cidade / UF</span>
                            <span className="text-white">{selectedClient.city || "Balneário Arroio do Silva - SC"}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[11px]">CEP</span>
                            <span className="font-mono text-white">{selectedClient.cep || "Não informado"}</span>
                          </div>
                          {selectedClient.address && (
                            <div className="flex items-end">
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedClient.address}, ${selectedClient.city || 'Balneário Arroio do Silva - SC'}`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                              >
                                Ver no Google Maps <ExternalLink size={12} />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Observações / Notas */}
                      {selectedClient.notes && (
                        <div className="bg-[#14171f] border border-white/10 rounded-2xl p-5 space-y-2 md:col-span-2 text-xs">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Observações do Cadastro
                          </h4>
                          <p className="text-gray-300 leading-relaxed whitespace-pre-line bg-black/30 p-3 rounded-xl border border-white/5">
                            {selectedClient.notes}
                          </p>
                        </div>
                      )}

                      {/* Contratos Vinculados (Clique para Redirecionar) */}
                      {clientContracts.length > 0 && (
                        <div className="bg-[#14171f] border border-amber-500/25 rounded-2xl p-5 space-y-3 md:col-span-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                              <FileText size={13} /> Contratos Vinculados ({clientContracts.length})
                            </h4>
                            <span className="text-[11px] text-gray-400">Clique no contrato para abrir e gerenciar na aba Contratos</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {clientContracts.map(ctr => (
                              <div
                                key={ctr.id}
                                onClick={() => handleNavigateToContract(ctr.contractNumber)}
                                className="bg-black/40 hover:bg-amber-500/10 border border-white/10 hover:border-amber-400/50 p-3.5 rounded-xl flex items-center justify-between cursor-pointer transition-all group shadow-sm"
                                title="Clique para abrir este contrato no módulo de Contratos"
                              >
                                <div className="space-y-1">
                                  <span className="font-mono font-bold text-amber-400 text-xs group-hover:underline flex items-center gap-1">
                                    <FileText size={13} /> {ctr.contractNumber}
                                  </span>
                                  <span className="text-[11px] text-gray-400 block">
                                    Data: {formatDateSafeBR(ctr.contractDate)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono font-bold text-xs text-emerald-400">
                                    {Number(ctr.totalValue || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </span>
                                  <ExternalLink size={13} className="text-amber-400 opacity-60 group-hover:opacity-100" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ABA 2: CONTRATOS DO CLIENTE */}
                {activeDetailTab === "contratos" && (
                  <div className="space-y-4 max-w-4xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Contratos Assinados e Vendas
                      </h3>
                      <span className="text-xs text-gray-400">
                        Total: <strong>{clientContracts.length} contrato(s)</strong>
                      </span>
                    </div>

                    {clientContracts.length === 0 ? (
                      <div className="p-8 border border-white/10 border-dashed rounded-2xl text-center text-gray-500 space-y-2">
                        <FileText size={28} className="mx-auto opacity-50" />
                        <p className="text-xs">Nenhum contrato vinculado a este cliente no momento.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {clientContracts.map(ctr => (
                          <div
                            key={ctr.id}
                            onClick={() => handleNavigateToContract(ctr.contractNumber)}
                            className="bg-[#14171f] hover:bg-[#1a1e27] border border-white/10 hover:border-amber-400/50 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 transition-all cursor-pointer group shadow-sm"
                            title="Clique para abrir e gerenciar este contrato no módulo de Contratos"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-amber-400 text-xs group-hover:underline flex items-center gap-1.5">
                                  <FileText size={14} />
                                  {ctr.contractNumber}
                                </span>
                                <span className="text-xs text-gray-400">
                                  • {formatDateSafeBR(ctr.contractDate)}
                                </span>
                              </div>
                              <p className="text-xs font-medium text-white">
                                {ctr.clientName}
                              </p>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="text-[10px] text-gray-400 block uppercase font-bold">Valor Total</span>
                                <span className="font-mono font-bold text-sm text-emerald-400">
                                  {Number(ctr.totalValue || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNavigateToContract(ctr.contractNumber);
                                }}
                                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/10"
                              >
                                <span>Abrir Contrato</span>
                                <ExternalLink size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ABA 3: RECIBOS EMITIDOS */}
                {activeDetailTab === "recibos" && (
                  <div className="space-y-4 max-w-4xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Recibos de Pagamento Emitidos
                      </h3>
                      <span className="text-xs text-gray-400">
                        Total: <strong>{clientReceipts.length} recibo(s)</strong>
                      </span>
                    </div>

                    {clientReceipts.length === 0 ? (
                      <div className="p-8 border border-white/10 border-dashed rounded-2xl text-center text-gray-500 space-y-2">
                        <Receipt size={28} className="mx-auto opacity-50" />
                        <p className="text-xs">Nenhum recibo de pagamento emitido para este cliente.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {clientReceipts.map(rec => (
                          <div
                            key={rec.id}
                            className="bg-[#14171f] border border-white/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 hover:border-emerald-500/40 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-amber-400 text-xs">
                                  {rec.receiptNumber}
                                </span>
                                <span className="text-xs text-gray-400">
                                  • {rec.receiptDate ? new Date(rec.receiptDate + "T00:00:00").toLocaleDateString("pt-BR") : "-"}
                                </span>
                                <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-300">
                                  {rec.paymentMethod || "PIX"}
                                </span>
                              </div>
                              <p className="text-xs text-gray-300 max-w-md truncate">
                                {rec.description}
                              </p>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-gray-400 block uppercase font-bold">Valor</span>
                              <span className="font-mono font-bold text-sm text-emerald-400">
                                {Number(rec.amount || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          ) : panelMode === "edit" || panelMode === "new" ? (
            /* MODO 2: FORMULÁRIO DE CADASTRO / EDIÇÃO INLINE (SEM NENHUM MODAL) */
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="p-5 border-b border-white/10 bg-[#12151c] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <User size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">
                      {panelMode === "edit" ? `Editar Cadastro de ${selectedClient?.name}` : "Novo Cadastro de Cliente"}
                    </h2>
                    <p className="text-[11px] text-gray-400">
                      Preencha os dados oficiais do cliente para contratos e recibos
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Formulário com Scroll Contido */}
              <form onSubmit={handleSubmitClient} className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin max-w-3xl">
                
                {/* Nome */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Nome Completo <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* CPF e RG */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      CPF ou CNPJ
                    </label>
                    <input
                      type="text"
                      value={formCpfCnpj}
                      onChange={e => setFormCpfCnpj(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl text-xs text-white placeholder-gray-500 font-mono focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      RG / Inscrição Estadual
                    </label>
                    <input
                      type="text"
                      value={formRg}
                      onChange={e => setFormRg(e.target.value)}
                      placeholder="Número do RG"
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl text-xs text-white placeholder-gray-500 font-mono focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Telefone e Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      Telefone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value)}
                      placeholder="(48) 99999-9999"
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      placeholder="cliente@exemplo.com"
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* CEP e Endereço */}
                <div className="border-t border-white/10 pt-4 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <MapPin size={13} /> Endereço
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        CEP {isSearchingCep && <span className="text-amber-400 text-[10px] lowercase font-normal">(buscando...)</span>}
                      </label>
                      <input
                        type="text"
                        value={formCep}
                        onChange={e => setFormCep(e.target.value)}
                        onBlur={handleCepBlur}
                        placeholder="88900-000"
                        className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl text-xs text-white placeholder-gray-500 font-mono focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Logradouro / Rua e Número
                      </label>
                      <input
                        type="text"
                        value={formAddress}
                        onChange={e => setFormAddress(e.target.value)}
                        placeholder="Ex: Rua das Flores, 123"
                        className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={formBairro}
                        onChange={e => setFormBairro(e.target.value)}
                        placeholder="Ex: Centro"
                        className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Cidade / UF
                      </label>
                      <input
                        type="text"
                        value={formCity}
                        onChange={e => setFormCity(e.target.value)}
                        placeholder="Ex: Balneário Arroio do Silva - SC"
                        className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Notas / Observações */}
                <div className="border-t border-white/10 pt-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Observações Adicionais
                  </label>
                  <textarea
                    rows={3}
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    placeholder="Detalhes sobre o cliente, preferências ou histórico de atendimento..."
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition-colors resize-none"
                  />
                </div>

                {/* Botões do Rodapé do Form */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        <span>{panelMode === "edit" ? "Salvar Alterações" : "Cadastrar Cliente"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* MODO 3: ESTADO VAZIO (NENHUM CLIENTE SELECIONADO) */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 text-gray-400">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
                <Users size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Nenhum Cliente Selecionado</h3>
                <p className="text-xs text-gray-500 max-w-sm">
                  Selecione um cliente da lista à esquerda para visualizar sua ficha 360° ou cadastre um novo cliente.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartNew}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Plus size={14} /> Novo Cliente
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
