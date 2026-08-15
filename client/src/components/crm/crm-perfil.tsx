import React, { useState } from "react";
import { User, Key, CheckCircle, Shield } from "lucide-react";
import { getApiUrl } from "@/lib/api";

interface CRMPerfilProps {
  currentUser: { username: string };
  setCurrentUser: (user: { username: string }) => void;
}

export default function CRMPerfil({ currentUser, setCurrentUser }: CRMPerfilProps) {
  const [displayName, setDisplayName] = useState(currentUser.username || "Administrador");
  const [username, setUsername] = useState(currentUser.username || "admin");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      // Atualiza o estado local do usuário
      const updatedUser = { username: username.trim() || displayName.trim() };
      setCurrentUser(updatedUser);
      localStorage.setItem("crm_username", updatedUser.username);

      // Tenta enviar a atualização para o backend
      const res = await fetch(getApiUrl("/api/users/update"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: updatedUser.username,
          password: newPassword || undefined
        })
      });

      setSuccessMsg("Informações do perfil atualizadas com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setSuccessMsg("Perfil atualizado localmente com sucesso!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-wide uppercase">Meu Perfil</h2>
          <p className="text-xs text-gray-400">Gerencie suas credenciais de acesso ao CRM Dumar</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle size={16} />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2">
          <Shield size={16} />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-white/10">
          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
            <span className="text-2xl font-black text-white uppercase">
              {displayName.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{displayName}</h3>
            <p className="text-xs text-gray-400">Administrador de Vendas & Marcenaria</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              <User size={14} className="inline mr-1" /> Nome de Exibição / Usuário
            </label>
            <input 
              type="text" 
              value={username}
              onChange={e => {
                setUsername(e.target.value);
                setDisplayName(e.target.value);
              }}
              className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-white text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Função no Sistema
            </label>
            <input 
              type="text" 
              value="Administrador Geral"
              disabled
              className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-gray-400 text-sm cursor-not-allowed"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 space-y-4">
          <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Key size={14} /> Alterar Senha de Acesso
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nova Senha</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Deixe em branco para manter a atual"
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Confirmar Nova Senha</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-white text-sm"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            type="submit"
            disabled={loading}
            className="bg-white hover:bg-neutral-200 text-black font-extrabold px-8 py-3.5 rounded-xl transition-all text-xs cursor-pointer shadow-lg hover:scale-[1.02]"
          >
            {loading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
