import React, { useState, useEffect } from "react";
import { 
  Users, UserPlus, Shield, ShieldCheck, Edit3, Trash2, Key, Check, 
  X, AlertCircle, CheckCircle2, Lock, Mail, User as UserIcon, Search, 
  Power, Sparkles
} from "lucide-react";
import CRMConfirmModal from "./crm-confirm-modal";

export interface UserItem {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  active: boolean;
  createdAt?: string;
}

const AVAILABLE_SECTIONS = [
  { id: "dashboard", label: "Visão Geral", desc: "Métricas e KPIs comerciais" },
  { id: "kanban", label: "Funil de Vendas", desc: "Quadro Kanban e gestão de leads" },
  { id: "agenda", label: "Agenda de Medições", desc: "Calendário e visitas técnicas" },
  { id: "financeiro", label: "Financeiro & Contratos", desc: "Fluxo de caixa, minutas e recibos" },
  { id: "mensagens", label: "Automação & IA", desc: "Configurações do bot comercial" },
  { id: "configuracoes", label: "Configurações & Conexões", desc: "WhatsApp e dados da empresa" },
  { id: "usuarios", label: "Gestão de Usuários", desc: "Administração de acessos e equipe" },
];

const ROLE_PRESETS: Record<string, { label: string; color: string; defaultPermissions: string[] }> = {
  admin: {
    label: "Administrador / Diretor",
    color: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    defaultPermissions: ["dashboard", "kanban", "agenda", "financeiro", "mensagens", "configuracoes", "usuarios"]
  },
  gerente: {
    label: "Gerente Comercial",
    color: "bg-purple-500/10 text-purple-300 border-purple-500/30",
    defaultPermissions: ["dashboard", "kanban", "agenda", "financeiro", "mensagens", "configuracoes"]
  },
  vendedor: {
    label: "Vendedor / Atendente",
    color: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    defaultPermissions: ["kanban", "agenda"]
  },
  projetista: {
    label: "Projetista 3D (Promob)",
    color: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
    defaultPermissions: ["kanban", "agenda"]
  },
  financeiro: {
    label: "Financeiro / Contábil",
    color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    defaultPermissions: ["dashboard", "financeiro"]
  },
  montador: {
    label: "Montador / Equipe Obra",
    color: "bg-orange-500/10 text-orange-300 border-orange-500/30",
    defaultPermissions: ["agenda"]
  },
  custom: {
    label: "Personalizado",
    color: "bg-gray-500/10 text-gray-300 border-gray-500/30",
    defaultPermissions: ["kanban", "agenda"]
  }
};

export default function CRMUsersView({ currentUser }: { currentUser?: { username: string } }) {
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("vendedor");
  const [formPermissions, setFormPermissions] = useState<string[]>(["kanban", "agenda"]);
  const [formActive, setFormActive] = useState(true);
  const [savingUser, setSavingUser] = useState(false);

  // Modal de Confirmação de Exclusão
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsersList(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Erro ao carregar usuários:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleOpenCreateModal = () => {
    setEditingUserId(null);
    setFormName("");
    setFormUsername("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("vendedor");
    setFormPermissions(ROLE_PRESETS.vendedor.defaultPermissions);
    setFormActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserItem) => {
    setEditingUserId(user.id);
    setFormName(user.name || "");
    setFormUsername(user.username);
    setFormEmail(user.email || "");
    setFormPassword("");
    setFormRole(user.role || "vendedor");
    setFormPermissions(user.permissions || []);
    setFormActive(user.active !== false);
    setIsModalOpen(true);
  };

  const handleRoleChange = (newRole: string) => {
    setFormRole(newRole);
    if (newRole !== "custom" && ROLE_PRESETS[newRole]) {
      setFormPermissions(ROLE_PRESETS[newRole].defaultPermissions);
    }
  };

  const togglePermission = (sectionId: string) => {
    setFormPermissions(prev => {
      const exists = prev.includes(sectionId);
      const next = exists ? prev.filter(s => s !== sectionId) : [...prev, sectionId];
      // Se alterou manualmente, muda para custom se não for exatamente um preset
      setFormRole("custom");
      return next;
    });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = formEmail.trim();
    const cleanUsername = (formUsername.trim() || cleanEmail).toLowerCase();

    if (!cleanEmail) {
      showToast("Informe o e-mail de acesso.", "error");
      return;
    }

    if (!editingUserId && !formPassword.trim()) {
      showToast("A senha de acesso é obrigatória para cadastrar o colaborador.", "error");
      return;
    }

    setSavingUser(true);
    try {
      if (editingUserId) {
        // Atualização
        const payload: any = {
          name: (formName.trim() || cleanUsername),
          email: cleanEmail,
          role: formRole,
          permissions: formPermissions,
          active: formActive
        };
        if (formPassword.trim()) {
          payload.password = formPassword.trim();
        }

        const res = await fetch(`/api/users/${editingUserId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          setIsModalOpen(false);
          showToast("Colaborador atualizado com sucesso!");
          await fetchUsers();
        } else {
          const err = await res.json().catch(() => ({ message: "Erro ao atualizar usuário." }));
          showToast(err.message || "Erro ao atualizar usuário.", "error");
        }
      } else {
        // Criação
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: (formName.trim() || cleanUsername),
            username: cleanUsername,
            email: cleanEmail,
            password: formPassword.trim(),
            role: formRole,
            permissions: formPermissions,
            active: formActive
          })
        });

        if (res.ok) {
          setIsModalOpen(false);
          showToast("Novo colaborador cadastrado com sucesso!");
          await fetchUsers();
        } else {
          const err = await res.json().catch(() => ({ message: "Erro ao cadastrar colaborador." }));
          showToast(err.message || "Erro ao criar usuário.", "error");
        }
      }
    } catch (e) {
      showToast("Erro ao conectar com o servidor.", "error");
    } finally {
      setSavingUser(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteUserId) return;
    setDeletingUser(true);
    try {
      const res = await fetch(`/api/users/${deleteUserId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        showToast("Usuário excluído com sucesso.");
        setDeleteUserId(null);
        await fetchUsers();
      } else {
        const err = await res.json();
        showToast(err.message || "Erro ao excluir usuário.", "error");
      }
    } catch (e) {
      showToast("Erro ao conectar com o servidor.", "error");
    } finally {
      setDeletingUser(false);
    }
  };

  const filteredUsers = usersList.filter(u => {
    const q = searchTerm.toLowerCase();
    return u.name.toLowerCase().includes(q) || 
           u.username.toLowerCase().includes(q) || 
           u.email.toLowerCase().includes(q) ||
           (ROLE_PRESETS[u.role]?.label || u.role).toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between border animate-fade-in ${
          feedback.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" 
            : "bg-red-500/10 border-red-500/30 text-red-300"
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.text}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="text-gray-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header & Ações */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">Equipe & Controle de Acesso (RBAC)</h3>
          <p className="text-xs text-gray-400">Cadastre colaboradores e defina quais telas e recursos cada perfil pode acessar no CRM.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" size={13} />
            <input
              type="text"
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/50"
            />
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs py-1.5 px-3.5 rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex-shrink-0"
          >
            <UserPlus size={14} />
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Grid de Usuários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(user => {
          const roleInfo = ROLE_PRESETS[user.role] || ROLE_PRESETS.custom;
          const isCurrentUser = currentUser?.username === user.username;
          const isMainAdmin = user.username === "admin" || user.username === "paulo@dumarplanejados.com.br";

          return (
            <div 
              key={user.id} 
              className={`bg-white/[0.03] border rounded-2xl p-4.5 space-y-3.5 transition-all hover:border-white/20 ${
                user.active ? "border-white/10" : "border-white/5 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300 font-black text-sm uppercase">
                    {(user.name || user.username).charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="truncate max-w-[140px]">{user.name || user.username}</span>
                      {isCurrentUser && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-semibold">Você</span>
                      )}
                    </h4>
                    <p className="text-[11px] text-gray-400 font-mono truncate max-w-[140px]">@{user.username}</p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${roleInfo.color}`}>
                  {roleInfo.label}
                </span>
              </div>

              {user.email && (
                <div className="text-[11px] text-gray-400 flex items-center gap-1.5 truncate">
                  <Mail size={12} className="text-gray-500 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              )}

              {/* Seções Permitidas */}
              <div className="space-y-1 pt-1 border-t border-white/5">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Acessos Liberados:</span>
                <div className="flex flex-wrap gap-1">
                  {AVAILABLE_SECTIONS.filter(s => user.permissions.includes(s.id)).map(s => (
                    <span 
                      key={s.id} 
                      className="text-[9px] bg-white/5 text-gray-300 border border-white/5 px-1.5 py-0.5 rounded"
                      title={s.desc}
                    >
                      {s.label}
                    </span>
                  ))}
                  {user.permissions.length === 0 && (
                    <span className="text-[10px] text-red-400 italic">Nenhum acesso configurado</span>
                  )}
                </div>
              </div>

              {/* Footer com Status e Ações */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                <span className="flex items-center gap-1.5 text-gray-400">
                  <span className={`w-2 h-2 rounded-full ${user.active ? "bg-emerald-400" : "bg-gray-500"}`} />
                  {user.active ? "Ativo" : "Inativo"}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(user)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-300 hover:bg-white/5 transition-colors cursor-pointer"
                    title="Editar Usuário & Permissões"
                  >
                    <Edit3 size={13} />
                  </button>

                  {!isMainAdmin && !isCurrentUser && (
                    <button
                      type="button"
                      onClick={() => setDeleteUserId(user.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                      title="Excluir Usuário"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-12 px-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
          <Users size={36} className="mx-auto text-gray-600" />
          <div>
            <h4 className="text-sm font-bold text-white">Nenhum colaborador encontrado</h4>
            <p className="text-xs text-gray-400 mt-1">Comece cadastrando os atendentes, projetistas ou equipe técnica.</p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs py-2 px-4 rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <UserPlus size={15} />
            <span>Cadastrar Novo Colaborador</span>
          </button>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE USUÁRIO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[180] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-[#12141a] border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 animate-scale-in my-8">
            <div className="flex items-start justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    {editingUserId ? "Editar Usuário & Permissões" : "Novo Colaborador"}
                  </h3>
                  <p className="text-[11px] text-gray-400">Configure os dados de acesso e controle de seções do CRM.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João da Silva"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (!formUsername && !editingUserId) {
                        setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, "."));
                      }
                    }}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-amber-300 uppercase tracking-wider mb-1.5">
                    E-mail de Acesso (Login) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: joao@dumarplanejados.com.br"
                    value={formEmail}
                    onChange={(e) => {
                      setFormEmail(e.target.value);
                      if (!formUsername && !editingUserId && e.target.value.includes("@")) {
                        setFormUsername(e.target.value.split("@")[0].toLowerCase());
                      }
                    }}
                    className="w-full bg-black/60 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Nome de Usuário / Apelido
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: joao.vendas"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    disabled={Boolean(editingUserId)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/50 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    {editingUserId ? "Nova Senha (Deixe em branco para manter)" : "Senha de Acesso *"}
                  </label>
                  <input
                    type="password"
                    required={!editingUserId}
                    placeholder={editingUserId ? "••••••••" : "Mínimo 6 caracteres"}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/50"
                  />
                </div>
              </div>

              {/* Perfil / Função */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                    Função & Perfil de Acesso:
                  </label>
                  <span className="text-[10px] text-gray-400">Define as permissões padrão</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(ROLE_PRESETS).map(([key, info]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleRoleChange(key)}
                      className={`text-[11px] p-2 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                        formRole === key 
                          ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm" 
                          : "bg-white/[0.02] border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                      }`}
                    >
                      <span className="block truncate">{info.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkboxes de Permissões Granulares */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                    Seções Permitidas no Sidebar:
                  </label>
                  <span className="text-[10px] text-amber-400/80">Personalização Granular</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {AVAILABLE_SECTIONS.map(section => {
                    const isChecked = formPermissions.includes(section.id);
                    return (
                      <label 
                        key={section.id} 
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isChecked 
                            ? "bg-white/[0.04] border-amber-500/30 text-white" 
                            : "bg-black/40 border-white/5 text-gray-500 hover:border-white/10"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(section.id)}
                          className="mt-0.5 accent-amber-500 cursor-pointer"
                        />
                        <div className="text-left">
                          <span className="block text-xs font-bold leading-tight">{section.label}</span>
                          <span className="block text-[10px] text-gray-400">{section.desc}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Status Ativo/Inativo */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="accent-amber-500 cursor-pointer"
                  />
                  <span>Usuário Ativo (Pode fazer login no CRM)</span>
                </label>
              </div>

              {/* Botões do Modal */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  {savingUser ? "Salvando..." : editingUserId ? "Atualizar Usuário" : "Cadastrar Usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <CRMConfirmModal
        isOpen={Boolean(deleteUserId)}
        onClose={() => setDeleteUserId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Colaborador"
        description="Tem certeza que deseja excluir este usuário do CRM? O colaborador perderá o acesso imediato ao sistema. Esta ação é permanente."
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        isDestructive={true}
        loading={deletingUser}
      />
    </div>
  );
}
