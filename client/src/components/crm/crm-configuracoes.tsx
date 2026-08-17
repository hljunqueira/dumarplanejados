import React, { useState, useEffect } from "react";
import { 
  Users, QrCode, Building2, CheckCircle2, 
  RefreshCw, AlertCircle, Phone, MapPin, Check, 
  Power, Clock, Sparkles, LogOut, ChevronRight, Save
} from "lucide-react";
import CRMUsersView from "./crm-users-view";
import CRMConfirmModal from "./crm-confirm-modal";

interface CRMConfiguracoesProps {
  currentUser?: { username: string; name?: string; role?: string; permissions?: string[] };
  setCurrentUser?: (user: any) => void;
  defaultTab?: "usuarios" | "conexoes" | "empresa";
}

export default function CRMConfiguracoes({ 
  currentUser = { username: "admin", role: "admin" }, 
  setCurrentUser,
  defaultTab = "usuarios" 
}: CRMConfiguracoesProps) {
  const [activeTab, setActiveTab] = useState<"usuarios" | "conexoes" | "empresa">(defaultTab);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // --- ESTADO WHATSAPP / EVOLUTION ---
  const [instances, setInstances] = useState<any[]>([]);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [syncingChats, setSyncingChats] = useState(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);

  // --- ESTADO DADOS EMPRESA ---
  const [empresaRazao, setEmpresaRazao] = useState("Dumar Móveis Planejados & Marcenaria Fina");
  const [empresaCnpj, setEmpresaCnpj] = useState("45.890.123/0001-90");
  const [empresaTelefone, setEmpresaTelefone] = useState("(48) 99123-4567");
  const [empresaCidade, setEmpresaCidade] = useState("Balneário Arroio do Silva - SC");
  const [savingEmpresa, setSavingEmpresa] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Carregar Instâncias da Evolution
  const fetchInstances = async () => {
    setLoadingInstances(true);
    try {
      const res = await fetch("/api/evolution/instances");
      if (res.ok) {
        const data = await res.json();
        setInstances(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Erro ao buscar instâncias:", e);
    } finally {
      setLoadingInstances(false);
    }
  };

  useEffect(() => {
    fetchInstances();
    try {
      const savedQR = localStorage.getItem("crm_whatsapp_qrcode");
      if (savedQR) setQrCodeData(savedQR);
    } catch (e) {}
  }, []);

  const handleGenerateQR = async () => {
    setLoadingQR(true);
    try {
      const res = await fetch("/api/evolution/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceName: "dumar_comercial" })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.qrcode) {
          setQrCodeData(data.qrcode);
          try { localStorage.setItem("crm_whatsapp_qrcode", data.qrcode); } catch(e){}
          showToast("QR Code gerado! Abra o WhatsApp no celular e escaneie.");
        }
      }
    } catch (e) {
      showToast("Erro ao gerar QR Code.", "error");
    } finally {
      setLoadingQR(false);
    }
  };

  const handleSyncChats = async () => {
    setSyncingChats(true);
    try {
      const res = await fetch("/api/evolution/sync-recent-chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceName: "dumar_comercial" })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Conversas do WhatsApp sincronizadas com sucesso!");
      } else {
        showToast(data.error || "Erro ao sincronizar conversas.", "error");
      }
    } catch (e) {
      showToast("Falha ao sincronizar conversas.", "error");
    } finally {
      setSyncingChats(false);
    }
  };

  const handleConfirmDisconnect = async () => {
    try {
      const res = await fetch("/api/evolution/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceName: "dumar_comercial" })
      });
      if (res.ok) {
        setQrCodeData(null);
        try { localStorage.removeItem("crm_whatsapp_qrcode"); } catch(e){}
        await fetchInstances();
        showToast("Instância desconectada com sucesso.");
      } else {
        showToast("Erro ao desconectar instância.", "error");
      }
    } catch (e) {
      showToast("Falha ao desconectar.", "error");
    } finally {
      setIsDisconnectModalOpen(false);
    }
  };

  const handleSaveEmpresa = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEmpresa(true);
    setTimeout(() => {
      setSavingEmpresa(false);
      showToast("Dados da empresa atualizados com sucesso!");
    }, 400);
  };

  const tabs = [
    { id: "usuarios", label: "Equipe & Usuários", icon: Users, desc: "Acessos e RBAC" },
    { id: "conexoes", label: "WhatsApp & Conexões", icon: QrCode, desc: "Evolution API" },
    { id: "empresa", label: "Dados da Empresa", icon: Building2, desc: "Endereço e CNPJ" },
  ];

  const isConnected = instances.some(i => i.status === "open" || i.connectionStatus === "open");

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto font-sans">
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
            ✕
          </button>
        </div>
      )}

      {/* Header Clean sem títulos gigantes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
        <div>
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">Configurações & Equipe</h2>
          <p className="text-xs text-gray-400">Controle de colaboradores, permissões de acesso e canais de atendimento</p>
        </div>
      </div>

      {/* Barra de Abas Clean */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/5 no-scrollbar">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "bg-white/[0.02] text-gray-400 hover:text-white hover:bg-white/5 border border-white/5"
              }`}
            >
              <Icon size={14} className={isActive ? "text-black" : "text-gray-400"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* CONTEÚDO DA ABA SELECIONADA */}

      {/* 1. ABA EQUIPE & USUÁRIOS (CRUD + RBAC) */}
      {activeTab === "usuarios" && (
        <CRMUsersView currentUser={currentUser} />
      )}

      {/* 2. ABA CONEXÃO WHATSAPP */}
      {activeTab === "conexoes" && (
        <div className="space-y-6">
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Status da Conexão (Evolution API)</h3>
                <p className="text-[11px] text-gray-400">Canal oficial de atendimento do WhatsApp</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                <span className={`text-xs font-bold ${isConnected ? "text-emerald-400" : "text-red-400"}`}>
                  {isConnected ? "Conectado" : "Desconectado"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Instância Padrão</span>
                <p className="text-xs font-mono font-bold text-white">dumar_comercial</p>
                <p className="text-[11px] text-gray-400">Instância dedicada para leads e agendamentos</p>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Ações Rápidas</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSyncChats}
                    disabled={syncingChats}
                    className="bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RefreshCw size={12} className={syncingChats ? "animate-spin" : ""} />
                    <span>{syncingChats ? "Sincronizando..." : "Sincronizar Conversas"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateQR}
                    disabled={loadingQR}
                    className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <QrCode size={12} />
                    <span>{loadingQR ? "Gerando..." : "Gerar QR Code"}</span>
                  </button>

                  {isConnected && (
                    <button
                      type="button"
                      onClick={() => setIsDisconnectModalOpen(true)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <LogOut size={12} />
                      <span>Desconectar</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Exibição do QR Code */}
            {qrCodeData && (
              <div className="p-4 bg-black/60 border border-amber-500/30 rounded-2xl flex flex-col items-center justify-center space-y-3 text-center animate-scale-in">
                <span className="text-xs font-bold text-amber-300">Escaneie o QR Code no seu WhatsApp:</span>
                <div className="bg-white p-3 rounded-xl">
                  <img src={qrCodeData.startsWith("data:") ? qrCodeData : `data:image/png;base64,${qrCodeData}`} alt="QR Code" className="w-56 h-56 object-contain" />
                </div>
                <p className="text-[11px] text-gray-400 max-w-sm">
                  Abra o WhatsApp no celular &gt; Aparelhos Conectados &gt; Conectar Aparelho e aponte a câmera para a imagem acima.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. ABA DADOS DA EMPRESA */}
      {activeTab === "empresa" && (
        <form onSubmit={handleSaveEmpresa} className="space-y-6">
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="pb-3 border-b border-white/5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Dados Institucionais</h3>
              <p className="text-[11px] text-gray-400">Informações utilizadas em contratos, minutas e rodapés do CRM</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Razão Social / Nome Fantasia
                </label>
                <input
                  type="text"
                  value={empresaRazao}
                  onChange={(e) => setEmpresaRazao(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={empresaCnpj}
                  onChange={(e) => setEmpresaCnpj(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Telefone de Contato
                </label>
                <input
                  type="text"
                  value={empresaTelefone}
                  onChange={(e) => setEmpresaTelefone(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Cidade / Sede
                </label>
                <input
                  type="text"
                  value={empresaCidade}
                  onChange={(e) => setEmpresaCidade(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400/50"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/5">
              <button
                type="submit"
                disabled={savingEmpresa}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <Save size={13} />
                <span>{savingEmpresa ? "Salvando..." : "Salvar Dados da Empresa"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Modal de Confirmação para Desconectar WhatsApp */}
      <CRMConfirmModal
        isOpen={isDisconnectModalOpen}
        onClose={() => setIsDisconnectModalOpen(false)}
        onConfirm={handleConfirmDisconnect}
        title="Desconectar WhatsApp"
        description="Deseja realmente desconectar esta conta do WhatsApp? Para restabelecer o canal, será necessário ler um novo QR Code."
        confirmText="Sim, Desconectar"
        cancelText="Cancelar"
        isDestructive={true}
      />
    </div>
  );
}
