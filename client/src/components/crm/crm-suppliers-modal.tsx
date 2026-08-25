import React, { useState, useEffect } from "react";
import {
  Truck, Plus, Search, Edit3, Trash2, Phone, Mail, User,
  FileText, Check, X, Building2, Tag, CreditCard, MessageSquare, AlertCircle
} from "lucide-react";
import { Supplier, InsertSupplier } from "@shared/schema";
import { useConfirmDialog } from "../ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";

export const SUPPLIER_CATEGORIES = [
  { id: "materia_prima", label: "MDF & Madeiras", color: "text-amber-400 bg-amber-950/40 border-amber-800/50" },
  { id: "ferragens", label: "Ferragens & Acessórios", color: "text-blue-400 bg-blue-950/40 border-blue-800/50" },
  { id: "vidros", label: "Vidros & Perfis de Alumínio", color: "text-cyan-400 bg-cyan-950/40 border-cyan-800/50" },
  { id: "servicos", label: "Serviços & Terceirizados", color: "text-emerald-400 bg-emerald-950/40 border-emerald-800/50" },
  { id: "administrativo", label: "Telecom / Software / Admin", color: "text-purple-400 bg-purple-950/40 border-purple-800/50" },
  { id: "outros", label: "Outros Fornecedores", color: "text-slate-400 bg-slate-800/60 border-slate-700/50" },
];

interface CRMSuppliersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSupplier?: (supplier: Supplier) => void;
  selectedSupplierId?: number | null;
}

export default function CRMSuppliersModal({
  isOpen,
  onClose,
  onSelectSupplier,
  selectedSupplierId
}: CRMSuppliersModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Form State para Novo / Edição
  const [isEditing, setIsEditing] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formName, setFormName] = useState("");
  const [formTradeName, setFormTradeName] = useState("");
  const [formCnpjCpf, setFormCnpjCpf] = useState("");
  const [formCategory, setFormCategory] = useState("materia_prima");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formContactPerson, setFormContactPerson] = useState("");
  const [formPixKey, setFormPixKey] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { confirm, showAlert } = useConfirmDialog();
  const { toast } = useToast();

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/suppliers");
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      }
    } catch (err) {
      console.error("Erro ao carregar fornecedores:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
    }
  }, [isOpen]);

  const handleOpenNew = () => {
    setEditingSupplier(null);
    setFormName("");
    setFormTradeName("");
    setFormCnpjCpf("");
    setFormCategory("materia_prima");
    setFormPhone("");
    setFormEmail("");
    setFormContactPerson("");
    setFormPixKey("");
    setFormNotes("");
    setIsEditing(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormName(sup.name);
    setFormTradeName(sup.tradeName || "");
    setFormCnpjCpf(sup.cnpjCpf || "");
    setFormCategory(sup.category || "materia_prima");
    setFormPhone(sup.phone || "");
    setFormEmail(sup.email || "");
    setFormContactPerson(sup.contactPerson || "");
    setFormPixKey(sup.pixKey || "");
    setFormNotes(sup.notes || "");
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      await showAlert({
        title: "Campo Obrigatório",
        message: "Por favor, informe a Razão Social ou Nome do Fornecedor.",
        variant: "warning",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<InsertSupplier> = {
        name: formName.trim(),
        tradeName: formTradeName.trim(),
        cnpjCpf: formCnpjCpf.trim(),
        category: formCategory,
        phone: formPhone.trim(),
        email: formEmail.trim(),
        contactPerson: formContactPerson.trim(),
        pixKey: formPixKey.trim(),
        notes: formNotes.trim(),
      };

      let res;
      if (editingSupplier) {
        res = await fetch(`/api/suppliers/${editingSupplier.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const savedSupplier = await res.json();
        toast({
          title: editingSupplier ? "Fornecedor Atualizado" : "Fornecedor Cadastrado",
          description: `${savedSupplier.name} salvo com sucesso!`,
        });
        setIsEditing(false);
        fetchSuppliers();

        // Se estava no modo de seleção ao criar um novo, já auto-seleciona
        if (onSelectSupplier && !editingSupplier) {
          onSelectSupplier(savedSupplier);
          onClose();
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        await showAlert({
          title: "Erro ao Salvar",
          message: errJson.message || "Não foi possível salvar os dados do fornecedor.",
          variant: "danger",
        });
      }
    } catch (err) {
      console.error(err);
      await showAlert({
        title: "Erro de Conexão",
        message: "Falha na comunicação com o servidor.",
        variant: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (sup: Supplier) => {
    const ok = await confirm({
      title: "Excluir Fornecedor",
      message: `Tem certeza que deseja remover o fornecedor "${sup.name}"?\nOs lançamentos financeiros vinculados a este fornecedor serão mantidos no histórico.`,
      variant: "danger",
      confirmText: "Sim, Remover",
    });

    if (!ok) return;

    try {
      const res = await fetch(`/api/suppliers/${sup.id}`, { method: "DELETE" });
      if (res.ok) {
        toast({
          title: "Fornecedor Removido",
          description: `${sup.name} foi removido com sucesso.`,
        });
        fetchSuppliers();
      } else {
        await showAlert({
          title: "Erro ao Excluir",
          message: "Não foi possível remover o fornecedor.",
          variant: "danger",
        });
      }
    } catch (err) {
      console.error(err);
      await showAlert({
        title: "Erro",
        message: "Falha ao conectar com o servidor.",
        variant: "danger",
      });
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.tradeName && s.tradeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.cnpjCpf && s.cnpjCpf.includes(searchTerm)) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === "all" || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Gestão de Fornecedores & Parceiros
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-normal">
                  {suppliers.length} cadastrados
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Cadastro de madeireiras, ferragens, vidraçarias, prestadores de serviço e custos administrativos da Dumar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isEditing ? (
            /* Formulário de Cadastro / Edição */
            <form onSubmit={handleSubmit} className="space-y-5 bg-slate-950/60 p-6 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {editingSupplier ? "Editar Fornecedor" : "Cadastrar Novo Fornecedor"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Voltar à listagem
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Razão Social / Nome Principal *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Madeireira & Compensados Araranguá Ltda"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nome Fantasia (Como é conhecido)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Compensados Araranguá"
                    value={formTradeName}
                    onChange={(e) => setFormTradeName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    CNPJ ou CPF
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={formCnpjCpf}
                    onChange={(e) => setFormCnpjCpf(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Categoria Principal *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {SUPPLIER_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Telefone / WhatsApp Comercial
                  </label>
                  <input
                    type="text"
                    placeholder="(48) 99999-9999"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    E-mail para Pedidos / Boletos
                  </label>
                  <input
                    type="email"
                    placeholder="financeiro@fornecedor.com.br"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Pessoa de Contato / Vendedor Responsável
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Carlos (Representante Arauco/Guararapes)"
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Chave PIX / Dados Bancários
                  </label>
                  <input
                    type="text"
                    placeholder="CNPJ, Chave Aleatória ou Conta"
                    value={formPixKey}
                    onChange={(e) => setFormPixKey(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Observações Comerciais (Prazos, Descontos, Condições)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Faturamento em 28/56 dias no boleto, frete grátis acima de 10 chapas de MDF."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-semibold shadow-lg shadow-amber-950/40 transition-all flex items-center gap-2"
                >
                  {isSubmitting ? "Salvando..." : editingSupplier ? "Salvar Alterações" : "Concluir Cadastro"}
                </button>
              </div>
            </form>
          ) : (
            /* Visualização da Lista de Fornecedores */
            <>
              {/* Barra de Ações & Filtros */}
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="flex flex-1 gap-2 items-center">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar por nome, fantasia, CNPJ ou vendedor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">Todas Categorias</option>
                    {SUPPLIER_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleOpenNew}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  + Novo Fornecedor
                </button>
              </div>

              {/* Grid / Lista de Fornecedores */}
              {loading ? (
                <div className="py-16 text-center text-slate-500 text-sm">
                  Carregando lista de fornecedores...
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="py-16 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80 p-8">
                  <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-300 font-medium text-base mb-1">Nenhum fornecedor encontrado</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                    Cadastre madeireiras, lojas de ferragens, vidraçarias e fornecedores fixos para vincular aos lançamentos do financeiro.
                  </p>
                  <button
                    onClick={handleOpenNew}
                    className="px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition-all inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Cadastrar Primeiro Fornecedor
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSuppliers.map((sup) => {
                    const categoryMeta =
                      SUPPLIER_CATEGORIES.find((c) => c.id === sup.category) ||
                      SUPPLIER_CATEGORIES[SUPPLIER_CATEGORIES.length - 1];

                    const isSelected = selectedSupplierId === sup.id;

                    return (
                      <div
                        key={sup.id}
                        className={`bg-slate-950/80 border rounded-xl p-4 transition-all hover:border-slate-700 flex flex-col justify-between ${
                          isSelected
                            ? "border-amber-500 ring-1 ring-amber-500/50 bg-amber-950/10"
                            : "border-slate-800"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-sm text-slate-100 truncate flex items-center gap-1.5">
                                {sup.tradeName || sup.name}
                                {sup.tradeName && (
                                  <span className="text-xs text-slate-400 font-normal truncate">
                                    ({sup.name})
                                  </span>
                                )}
                              </h4>
                              {sup.cnpjCpf && (
                                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Building2 className="w-3 h-3 text-slate-500" />
                                  CNPJ/CPF: {sup.cnpjCpf}
                                </p>
                              )}
                            </div>
                            <span
                              className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md border shrink-0 ${categoryMeta.color}`}
                            >
                              {categoryMeta.label}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs text-slate-300 my-3">
                            {sup.contactPerson && (
                              <p className="flex items-center gap-2 text-slate-300">
                                <User className="w-3.5 h-3.5 text-slate-500" />
                                <span>Contato: <strong>{sup.contactPerson}</strong></span>
                              </p>
                            )}

                            {sup.phone && (
                              <p className="flex items-center gap-2 text-slate-300">
                                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{sup.phone}</span>
                                <a
                                  href={`https://wa.me/55${sup.phone.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-emerald-400 hover:underline inline-flex items-center gap-0.5 ml-1"
                                >
                                  WhatsApp
                                </a>
                              </p>
                            )}

                            {sup.pixKey && (
                              <p className="flex items-center gap-2 text-slate-400">
                                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                                <span className="truncate">PIX: {sup.pixKey}</span>
                              </p>
                            )}

                            {sup.notes && (
                              <p className="text-xs text-slate-400 bg-slate-900/90 p-2 rounded border border-slate-800/80 italic mt-1 line-clamp-2">
                                "{sup.notes}"
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(sup)}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 border border-slate-800 transition-colors"
                              title="Editar Fornecedor"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(sup)}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/60 text-slate-400 hover:text-red-400 text-xs flex items-center gap-1 border border-slate-800 hover:border-red-800/50 transition-colors"
                              title="Excluir Fornecedor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {onSelectSupplier && (
                            <button
                              onClick={() => {
                                onSelectSupplier(sup);
                                onClose();
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                isSelected
                                  ? "bg-amber-500 text-slate-950 font-bold shadow"
                                  : "bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border border-slate-700"
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              {isSelected ? "Selecionado" : "Selecionar"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Dumar Móveis Planejados &bull; Gestão de Suprimentos & Finanças
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
