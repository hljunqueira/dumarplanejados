import React, { useState, useEffect } from "react";
import { CheckCircle2, QrCode, RefreshCw, AlertCircle, LogOut, Trash2 } from "lucide-react";

interface Instance {
  name?: string;
  instanceName?: string;
  status?: string;
  connectionStatus?: string;
  phone?: string;
  number?: string;
}

interface CRMConnectionsProps {
  instances?: Instance[];
  showQR?: boolean;
  setShowQR?: (val: boolean) => void;
}

export default function CRMConnections({}: CRMConnectionsProps) {
  const [realInstances, setRealInstances] = useState<any[]>([]);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncingChats, setSyncingChats] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSyncChats = async () => {
    setSyncingChats(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/evolution/sync-recent-chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceName: "dumar_comercial" })
      });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(data.message || "Conversas sincronizadas com sucesso!");
        setTimeout(() => setSyncMessage(null), 6000);
      } else {
        alert(data.error || "Erro ao sincronizar conversas.");
      }
    } catch (err) {
      console.error(err);
      alert("Falha de conexão ao sincronizar conversas.");
    } finally {
      setSyncingChats(false);
    }
  };

  const fetchInstances = async () => {
    setLoadingInstances(true);
    try {
      const res = await fetch("/api/evolution/instances");
      if (res.ok) {
        const data = await res.json();
        setRealInstances(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Erro ao buscar instâncias:", err);
    } finally {
      setLoadingInstances(false);
    }
  };

  // Restaurar QR code do localStorage se houver
  useEffect(() => {
    try {
      const savedQR = localStorage.getItem("crm_whatsapp_qrcode");
      if (savedQR) setQrCodeData(savedQR);
    } catch (e) {
      console.error(e);
    }
    fetchInstances();
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
          try {
            localStorage.setItem("crm_whatsapp_qrcode", data.qrcode);
          } catch (e) {
            console.error(e);
          }
        }
      }
    } catch (err) {
      console.error("Erro ao gerar QR Code:", err);
    } finally {
      setLoadingQR(false);
    }
  };

  const handleDisconnect = async (instName = "dumar_comercial") => {
    if (!window.confirm("Deseja desconectar esta conta do WhatsApp e resetar a instância? Você precisará ler um novo QR Code.")) {
      return;
    }

    setDisconnecting(true);
    try {
      const res = await fetch("/api/evolution/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceName: instName })
      });
      if (res.ok) {
        setQrCodeData(null);
        try { localStorage.removeItem("crm_whatsapp_qrcode"); } catch(e){}
        await fetchInstances();
        alert("Instância desconectada e resetada com sucesso!");
      } else {
        alert("Erro ao desconectar instância.");
      }
    } catch (err) {
      console.error("Erro ao desconectar:", err);
      alert("Falha na comunicação com o servidor ao desconectar.");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-6 font-sans">
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Instâncias do WhatsApp (Evolution API v2.3.6)</h3>
            <p className="text-xs text-gray-400 mt-0.5">Gerencie os números de WhatsApp conectados ao sistema Dumar</p>
          </div>
          <button 
            onClick={fetchInstances}
            disabled={loadingInstances}
            className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={loadingInstances ? "animate-spin" : ""} />
            Atualizar Status
          </button>
        </div>
        
        <div className="space-y-3">
          {realInstances.length === 0 ? (
            <div className="p-5 bg-black/40 border border-white/5 rounded-xl text-center">
              <p className="text-xs text-gray-400">Nenhuma instância ativa registrada no momento.</p>
              <p className="text-[11px] text-gray-500 mt-1">Clique no botão abaixo para gerar o QR Code e parear um novo WhatsApp.</p>
            </div>
          ) : (
            realInstances.map((inst, index) => {
              const instanceName = inst.instanceName || inst.name || `Instância ${index + 1}`;
              const isConnected = inst.connectionStatus === "open" || inst.status === "open" || inst.status === "connecting";
              return (
                <div key={index} className="p-4 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">{instanceName}</h4>
                    <p className="text-xs text-gray-400">{inst.ownerJid || inst.phone || "Número pareado via QR Code"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border ${
                      isConnected 
                        ? "bg-green-500/10 text-green-400 border-green-500/20" 
                        : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                    }`}>
                      <CheckCircle2 size={12} />
                      {isConnected ? "CONECTADO" : "AGUARDANDO QR"}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDisconnect(instanceName)}
                      disabled={disconnecting}
                      className="text-xs bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer font-bold"
                      title="Desconectar conta e limpar para novo QR Code"
                    >
                      <LogOut size={13} className={disconnecting ? "animate-spin" : ""} />
                      {disconnecting ? "Desconectando..." : "Desconectar e Limpar"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button 
            onClick={handleGenerateQR}
            disabled={loadingQR}
            className="bg-white hover:bg-neutral-200 text-black font-bold text-xs py-2.5 px-5 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-white/10"
          >
            <QrCode size={16} />
            {loadingQR ? "Gerando QR Code Real..." : "Conectar Novo Número (Scan QR Real)"}
          </button>

          <button 
            onClick={handleSyncChats}
            disabled={syncingChats}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs py-2.5 px-5 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-amber-500/20"
            title="Importa para o Funil de Vendas os contatos e conversas recentes que já chamaram no WhatsApp"
          >
            <RefreshCw size={16} className={syncingChats ? "animate-spin" : ""} />
            {syncingChats ? "Sincronizando Conversas..." : "Sincronizar Conversas Recentes com o Funil"}
          </button>
        </div>

        {syncMessage && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={16} />
            {syncMessage}
          </div>
        )}
      </div>

      {(loadingQR || qrCodeData) && (
        <div className="bg-white/5 border border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center max-w-md mx-auto shadow-2xl animate-scale-in">
          <h4 className="font-bold text-sm mb-1 text-white uppercase tracking-wider">Conectar Conta WhatsApp</h4>
          <p className="text-xs text-gray-400 text-center mb-5">Abra o WhatsApp no celular {">"} Aparelhos Conectados {">"} Conectar Aparelho e escaneie o código abaixo:</p>
          
          <div className="w-56 h-56 bg-white p-3 rounded-xl flex items-center justify-center shadow-2xl mb-5 border border-white/20">
            {loadingQR ? (
              <div className="flex flex-col items-center gap-2 text-black">
                <RefreshCw size={32} className="animate-spin text-neutral-800" />
                <span className="text-xs font-bold">Solicitando QR Code...</span>
              </div>
            ) : qrCodeData ? (
              qrCodeData.startsWith("data:image") || qrCodeData.length > 300 ? (
                <img 
                  src={qrCodeData.startsWith("data:image") ? qrCodeData : `data:image/png;base64,${qrCodeData}`} 
                  alt="QR Code WhatsApp" 
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-2 text-center text-xs font-mono break-all text-black h-full overflow-y-auto">
                  <span className="text-[10px] text-gray-500 font-sans mb-1">Código de Conexão:</span>
                  <strong className="text-sm font-bold text-black tracking-wider bg-gray-100 p-2 rounded border border-gray-300">{qrCodeData}</strong>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center gap-2 text-red-500">
                <AlertCircle size={28} />
                <span className="text-xs font-bold text-center">Não foi possível carregar o código</span>
              </div>
            )}
          </div>

          <button 
            onClick={() => {
              setQrCodeData(null);
              setLoadingQR(false);
              try { localStorage.removeItem("crm_whatsapp_qrcode"); } catch(e){}
            }}
            className="text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-5 py-2 rounded-xl transition-colors cursor-pointer border border-white/10"
          >
            Fechar QR Code
          </button>
        </div>
      )}
    </div>
  );
}
