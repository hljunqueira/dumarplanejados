import React, { useState, useEffect } from "react";
import { 
  X, Plus, Trash2, Edit3, Check, Layers, Box, 
  Maximize2, Eye, Shield, Wrench, Lightbulb, RefreshCw, Search, Package
} from "lucide-react";

export interface MaterialItem {
  id?: number;
  category: "estrutura" | "frentes" | "tamponamento" | "vidros" | "puxadores" | "dobradicas" | "corredicas" | "extras";
  name: string;
  description: string;
  isDefault?: boolean;
}

interface CRMMateriaisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMaterial?: (category: string, description: string) => void;
  targetCategory?: string; // Se aberto a partir de um campo específico do memorial
}

const CATEGORY_TABS = [
  { id: "all", label: "Todos os Itens", icon: Layers },
  { id: "estrutura", label: "Estrutura (Caixaria)", icon: Box },
  { id: "frentes", label: "Frentes (Portas/Gavetas)", icon: Maximize2 },
  { id: "tamponamento", label: "Tamponamentos", icon: Layers },
  { id: "vidros", label: "Vidros & Perfis Alumínio", icon: Eye },
  { id: "puxadores", label: "Puxadores", icon: Shield },
  { id: "dobradicas", label: "Dobradiças & Giro", icon: Wrench },
  { id: "corredicas", label: "Corrediças", icon: Wrench },
  { id: "extras", label: "Itens Extras & Iluminação", icon: Lightbulb },
];

export default function CRMMateriaisModal({
  isOpen,
  onClose,
  onSelectMaterial,
  targetCategory
}: CRMMateriaisModalProps) {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<string>(targetCategory || "all");
  const [search, setSearch] = useState("");

  // Formulário de Cadastro / Edição
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formCategory, setFormCategory] = useState<MaterialItem["category"]>("estrutura");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/materials-catalog");
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      }
    } catch (e) {
      console.error("Erro ao buscar materiais:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMaterials();
      if (targetCategory) {
        setSelectedTab(targetCategory);
      }
    }
  }, [isOpen, targetCategory]);

  if (!isOpen) return null;

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormCategory((selectedTab !== "all" ? selectedTab : "estrutura") as MaterialItem["category"]);
    setFormName("");
    setFormDescription("");
    setFormIsDefault(false);
    setIsEditing(true);
  };

  const handleOpenEdit = (item: MaterialItem) => {
    setEditingId(item.id || null);
    setFormCategory(item.category);
    setFormName(item.name);
    setFormDescription(item.description);
    setFormIsDefault(Boolean(item.isDefault));
    setIsEditing(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formDescription) return;

    setSubmitting(true);
    const payload = {
      category: formCategory,
      name: formName,
      description: formDescription,
      isDefault: formIsDefault
    };

    try {
      if (editingId) {
        await fetch(`/api/materials-catalog/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch("/api/materials-catalog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }
      setIsEditing(false);
      fetchMaterials();
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar item no catálogo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id?: number) => {
    if (!id || !confirm("Deseja realmente remover este item do catálogo?")) return;
    try {
      const res = await fetch(`/api/materials-catalog/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchMaterials();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchesTab = selectedTab === "all" || m.category === selectedTab;
    const matchesSearch = search === "" || 
      m.name.toLowerCase().includes(search.toLowerCase()) || 
      m.description.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* HEADER DO MODAL */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Catálogo de Materiais & Ferragens
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Dumar Marcenaria
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Padrões de MDF, Vidros, Puxadores e Ferragens para inclusão direta no Memorial e Contratos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* BUSCA RÁPIDA */}
            <div className="relative w-48 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar material ou ferragem..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer shrink-0"
            >
              <Plus size={15} />
              Novo Material
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* TABS DE CATEGORIAS (FLEX-WRAP LIMPO SEM SCROLLBAR BRANCA) */}
        <div className="px-4 py-2.5 bg-neutral-950/40 border-b border-white/5 flex flex-wrap items-center gap-1.5">
          {CATEGORY_TABS.map(tab => {
            const Icon = tab.icon;
            const isSelected = selectedTab === tab.id;
            const count = tab.id === "all" 
              ? materials.length 
              : materials.filter(m => m.category === tab.id).length;

            return (
              <button
                key={tab.id}
                onClick={() => { setSelectedTab(tab.id); setIsEditing(false); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected 
                    ? "bg-amber-500 text-black shadow-sm font-bold" 
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-white/5"
                }`}
              >
                <Icon size={13} />
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? "bg-black/20 text-black" : "bg-white/10 text-gray-400"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* CORPO DO MODAL */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin">
          {isEditing && (
            /* FORMULÁRIO DE CADASTRO/EDIÇÃO */
            <form onSubmit={handleSaveItem} className="bg-neutral-950/90 border border-amber-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
              <h4 className="font-bold text-sm text-amber-400 border-b border-white/10 pb-2 flex items-center gap-2">
                {editingId ? <Edit3 size={16} /> : <Plus size={16} />}
                {editingId ? "Editar Material / Ferragem" : "Cadastrar Novo Padrão de Material"}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Categoria:</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as any)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="estrutura">Estrutura do Móvel (Caixaria)</option>
                    <option value="frentes">Frentes de Portas & Gavetas</option>
                    <option value="tamponamento">Tamponamentos & Painéis</option>
                    <option value="vidros">Vidros & Perfis de Alumínio</option>
                    <option value="puxadores">Puxadores</option>
                    <option value="dobradicas">Dobradiças & Sistemas de Giro</option>
                    <option value="corredicas">Corrediças</option>
                    <option value="extras">Itens Extras & Iluminação</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Nome Curto / Referência Comercial:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MDF BP Fendi 15mm ou Vidro Reflecta Fumê Slim"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Especificação Técnica Completa (Texto que sai no Memorial e Contrato):
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Estrutura do móvel em MDF 15mm, revestimento melamínico BP cor branco, fita de borda reta em polipropileno 0,4mm."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={formIsDefault}
                    onChange={e => setFormIsDefault(e.target.checked)}
                    className="rounded border-white/20 bg-neutral-800 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  Marcar como opção padrão desta categoria
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Salvando..." : "Salvar no Catálogo"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* LISTAGEM DE ITENS EM GRID DE 3 COLUNAS */}
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="animate-spin text-amber-400" size={18} />
              Carregando catálogo de materiais...
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-xs">
              Nenhum material encontrado com os filtros aplicados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredMaterials.map(item => (
                <div
                  key={item.id}
                  className="bg-neutral-950/60 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/40 hover:bg-neutral-950/80 transition-all group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors leading-tight">
                        {item.name}
                      </span>
                      {item.isDefault && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30 shrink-0">
                          Padrão
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed font-sans line-clamp-3">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title="Editar Material"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Excluir Material"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {onSelectMaterial && (
                      <button
                        onClick={() => {
                          onSelectMaterial(item.category, item.description);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-bold text-[11px] transition-all cursor-pointer shadow-sm"
                      >
                        <Check size={12} />
                        Usar no Memorial
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-white/10 bg-neutral-950/80 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Total de itens cadastrados: <strong className="text-white">{materials.length}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
