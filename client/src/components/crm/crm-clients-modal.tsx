import React, { useState, useEffect } from "react";
import {
  Users, Plus, Search, Edit3, Trash2, Phone, Mail, User,
  FileText, Check, X, MapPin, Building2, MessageSquare, AlertCircle, RefreshCw, ExternalLink
} from "lucide-react";
import { Client, InsertClient } from "@shared/schema";
import { useConfirmDialog } from "../ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";

interface CRMClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClient?: (client: Client) => void;
  selectedClientId?: number | null;
}

export default function CRMClientsModal({
  isOpen,
  onClose,
  onSelectClient,
  selectedClientId
}: CRMClientsModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  // Form State para Novo / Edição
  const [isEditing, setIsEditing] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
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

  const { confirm, showAlert } = useConfirmDialog();
  const { toast } = useToast();

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchClients();
    }
  }, [isOpen]);

  const handleOpenNew = () => {
    setEditingClient(null);
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
    setIsEditing(true);
  };

  const handleOpenEdit = (cli: Client) => {
    setEditingClient(cli);
    setFormName(cli.name);
    setFormCpfCnpj(cli.cpfCnpj || "");
    setFormRg(cli.rg || "");
    setFormPhone(cli.phone || "");
    setFormEmail(cli.email || "");
    setFormAddress(cli.address || "");
    setFormBairro(cli.bairro || "");
    setFormCity(cli.city || "Balneário Arroio do Silva - SC");
    setFormCep(cli.cep || "");
    setFormNotes(cli.notes || "");
    setIsEditing(true);
  };

  const handleCloseForm = () => {
    setIsEditing(false);
    setEditingClient(null);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      await showAlert({
        title: "Nome Obrigatório",
        message: "Por favor, informe o nome completo do cliente.",
        variant: "warning",
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

      if (editingClient) {
        const res = await fetch(`/api/clients/${editingClient.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Erro ao atualizar cliente");
        toast({
          title: "Cliente Atualizado",
          description: `${formName} atualizado com sucesso.`,
        });
      } else {
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Erro ao cadastrar cliente");
        const created = await res.json();
        toast({
          title: "Cliente Cadastrado",
          description: `${formName} salvo no sistema com sucesso.`,
        });
        if (onSelectClient) {
          onSelectClient(created);
        }
      }

      handleCloseForm();
      fetchClients();
    } catch (err) {
      console.error(err);
      await showAlert({
        title: "Erro ao Salvar",
        message: "Não foi possível salvar o cliente. Tente novamente.",
        variant: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (cli: Client) => {
    const ok = await confirm({
      title: "Excluir Cliente",
      message: `Tem certeza que deseja excluir o cadastro de "${cli.name}"?\nEsta ação não poderá ser desfeita.`,
      variant: "danger",
      confirmText: "Sim, Excluir",
    });

    if (!ok) return;

    try {
      const res = await fetch(`/api/clients/${cli.id}`, { method: "DELETE" });
      if (res.ok) {
        toast({
          title: "Cliente Removido",
          description: `Cadastro de ${cli.name} removido com sucesso.`,
        });
        fetchClients();
      } else {
        throw new Error("Erro ao excluir");
      }
    } catch (err) {
      await showAlert({
        title: "Erro",
        message: "Não foi possível excluir o cliente.",
        variant: "danger",
      });
    }
  };

  const handleSyncFromSources = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch("/api/clients/sync-from-sources", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        toast({
          title: "Sincronização Concluída",
          description: `${data.imported || 0} novos clientes importados dos contratos e leads! Total: ${data.total || 0}`,
        });
        fetchClients();
      }
    } catch (e) {
      toast({
        title: "Aviso",
        description: "Erro ao sincronizar clientes de outras fontes.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredClients = clients.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.cpfCnpj && c.cpfCnpj.toLowerCase().includes(term)) ||
      (c.phone && c.phone.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.city && c.city.toLowerCase().includes(term)) ||
      (c.address && c.address.toLowerCase().includes(term))
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Cabeçalho */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Cadastro de Clientes
                <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
                  {clients.length} cadastrados
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Gerencie dados completos de clientes salvos para contratos e lançamentos financeiros
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* Se estiver no modo de edição/cadastro */}
          {isEditing ? (
            <form onSubmit={handleSubmitForm} className="space-y-4 bg-black/40 border border-white/10 rounded-xl p-4 sm:p-5 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <User size={16} className="text-amber-400" />
                  {editingClient ? `Editar Cliente: ${editingClient.name}` : "Novo Cadastro de Cliente"}
                </h3>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="text-xs text-gray-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-300 font-semibold mb-1">
                    Nome Completo / Razão Social *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Ex: FELIPE DANIEL DA SILVA"
                    className="w-full bg-black/50 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-300 font-semibold mb-1">
                    CPF / CNPJ
                  </label>
                  <input
                    type="text"
                    value={formCpfCnpj}
                    onChange={e => setFormCpfCnpj(e.target.value)}
                    placeholder="Ex: 007.114.550-82"
                    className="w-full bg-black/50 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-300 font-semibold mb-1">
                    RG / Inscrição Estadual
                  </label>
                  <input
                    type="text"
                    value={formRg}
                    onChange={e => setFormRg(e.target.value)}
                    placeholder="Ex: 00711455082"
                    className="w-full bg-black/50 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-300 font-semibold mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="Ex: (48) 99999-9999"
                    className="w-full bg-black/50 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-300 font-semibold mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="Ex: cliente@email.com"
                    className="w-full bg-black/50 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-300 font-semibold mb-1">
                    Endereço (Rua e Nº)
                  </label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={e => setFormAddress(e.target.value)}
                    placeholder="Ex: Rua Visconde de Cairu, 47 AP 706"
                    className="w-full bg-black/50 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-300 font-semibold mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={formBairro}
                    onChange={e => setFormBairro(e.target.value)}
                    placeholder="Ex: Santa Bárbara"
                    className="w-full bg-black/50 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-300 font-semibold mb-1">
                    Cidade / UF
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={e => setFormCity(e.target.value)}
                    placeholder="Ex: Criciúma - SC"
                    className="w-full bg-black/50 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-300 font-semibold mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={formCep}
                    onChange={e => setFormCep(e.target.value)}
                    placeholder="Ex: 88800-000"
                    className="w-full bg-black/50 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs text-gray-300 font-semibold mb-1">
                    Observações Cadastrais / Financeiras
                  </label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    placeholder="Informações adicionais, preferências de pagamento ou histórico..."
                    className="w-full bg-black/50 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 rounded-xl text-xs text-gray-300 hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  <Check size={14} />
                  {isSubmitting ? "Salvando..." : editingClient ? "Atualizar Cliente" : "Salvar Cliente"}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Barra de Ferramentas: Busca + Novo Cliente + Sincronizar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome, CPF/CNPJ, fone, cidade..."
                    className="w-full bg-black/50 border border-white/10 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSyncFromSources}
                    disabled={isSyncing}
                    title="Importar automaticamente clientes já preenchidos em contratos e leads"
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={isSyncing ? "animate-spin text-amber-400" : "text-amber-400"} />
                    {isSyncing ? "Sincronizando..." : "Puxar de Contratos & Leads"}
                  </button>

                  <button
                    onClick={handleOpenNew}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    <Plus size={15} /> Novo Cliente
                  </button>
                </div>
              </div>

              {/* Lista de Clientes */}
              {loading ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  Carregando cadastro de clientes...
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="bg-black/20 border border-dashed border-white/10 rounded-2xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                    <Users size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Nenhum cliente encontrado</h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      {searchTerm 
                        ? "Nenhum resultado corresponde à sua pesquisa." 
                        : "Cadastre novos clientes ou clique em 'Puxar de Contratos & Leads' para importar automaticamente!"}
                    </p>
                  </div>
                  <div className="flex justify-center gap-2 pt-2">
                    <button
                      onClick={handleSyncFromSources}
                      className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RefreshCw size={14} className="text-amber-400" /> Sincronizar de Contratos
                    </button>
                    <button
                      onClick={handleOpenNew}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus size={14} /> Cadastrar Novo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredClients.map(cli => {
                    const isSelected = selectedClientId === cli.id;
                    const cleanPhone = (cli.phone || "").replace(/\D/g, "");

                    return (
                      <div
                        key={cli.id}
                        className={`bg-black/40 border rounded-xl p-4 transition-all space-y-3 relative group ${
                          isSelected
                            ? "border-amber-500 shadow-md shadow-amber-500/10 bg-amber-500/5"
                            : "border-white/10 hover:border-white/20 hover:bg-black/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-sm text-white flex items-center gap-2">
                              {cli.name}
                              {cli.cpfCnpj && (
                                <span className="text-[10px] bg-white/5 border border-white/10 text-amber-300 px-2 py-0.5 rounded font-mono">
                                  {cli.cpfCnpj}
                                </span>
                              )}
                            </div>
                            {cli.rg && (
                              <div className="text-[11px] text-gray-400">
                                RG: <span className="text-gray-300 font-mono">{cli.rg}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(cli)}
                              title="Editar Cliente"
                              className="text-gray-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteClient(cli)}
                              title="Excluir Cliente"
                              className="text-gray-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Dados de Contato e Endereço */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-300 pt-1 border-t border-white/5">
                          {cli.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone size={12} className="text-amber-400 flex-shrink-0" />
                              <span className="truncate">{cli.phone}</span>
                              {cleanPhone && (
                                <a
                                  href={`https://wa.me/55${cleanPhone}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Conversar no WhatsApp"
                                  className="text-emerald-400 hover:underline flex items-center ml-1"
                                >
                                  <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          )}

                          {cli.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail size={12} className="text-amber-400 flex-shrink-0" />
                              <span className="truncate">{cli.email}</span>
                            </div>
                          )}

                          {(cli.address || cli.city) && (
                            <div className="sm:col-span-2 flex items-start gap-1.5 text-[11px] text-gray-400">
                              <MapPin size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
                              <span className="line-clamp-2">
                                {[cli.address, cli.bairro, cli.city, cli.cep].filter(Boolean).join(" - ")}
                              </span>
                            </div>
                          )}
                        </div>

                        {cli.notes && (
                          <div className="text-[11px] text-gray-400 italic bg-black/50 p-2 rounded-lg border border-white/5">
                            "{cli.notes}"
                          </div>
                        )}

                        {onSelectClient && (
                          <button
                            onClick={() => {
                              onSelectClient(cli);
                              onClose();
                            }}
                            className="w-full mt-2 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-bold py-1.5 rounded-lg text-xs transition-all cursor-pointer border border-amber-500/40 text-center"
                          >
                            Selecionar Cliente
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

        </div>

        {/* Rodapé */}
        <div className="p-3 sm:p-4 border-t border-white/10 flex items-center justify-between bg-black/40 text-xs text-gray-400">
          <span>Cadastro centralizado para contratos, orçamentos e financeiro</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-gray-300 hover:bg-white/5 transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
