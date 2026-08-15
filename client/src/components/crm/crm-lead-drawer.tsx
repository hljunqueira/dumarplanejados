import React, { useState, useRef } from "react";
import { Phone, FileText, Upload, Send, CheckCircle2, Trash2, Mic, Paperclip, Smile, File, Image as ImageIcon, Volume2, Square, ExternalLink, CheckCheck, Bot, AlertCircle, Play, Pause, UserCheck } from "lucide-react";
import { Lead } from "./types";

interface Stage {
  id: string;
  title: string;
  color: string;
}

interface CRMLeadDrawerProps {
  selectedLead: Lead;
  setSelectedLead: (lead: Lead | null) => void;
  fetchLeads: () => void;
  STAGES: Stage[];
  moveLead: (leadId: string, stageId: string) => void;
  handleDeleteLead?: (leadId: string) => void;
  chatInput: string;
  setChatInput: (val: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  setShowNoInstanceModal?: (val: boolean) => void;
}

const EMOJI_CATEGORIES = [
  {
    name: "Populares & Negócios",
    emojis: ["👍", "👋", "🤝", "🙏", "✅", "📋", "📐", "🏠", "✨", "📞", "📅", "💡", "💰", "💵", "📄", "🛠️", "🔨", "🔑"]
  },
  {
    name: "Carinhas & Expressões",
    emojis: ["😀", "😃", "😄", "😁", "😊", "🙂", "😉", "😍", "🤩", "😎", "🥳", "🤔", "😮", "🙌", "👏", "💪", "❤️", "🔥"]
  },
  {
    name: "Gestos & Mãos",
    emojis: ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤝", "🙌", "👏", "🤲", "🤜", "🤛", "👆", "👇", "👈", "👉", "✍️", "🤳"]
  },
  {
    name: "Casa & Projetos",
    emojis: ["🏠", "🏡", "🏢", "🛠️", "🔨", "🪚", "📐", "📏", "🛋️", "🛏️", "🚪", "🪟", "🔑", "📦", "🎨", "📑", "📊", "📈"]
  }
];

export default function CRMLeadDrawer({
  selectedLead,
  setSelectedLead,
  fetchLeads,
  STAGES,
  moveLead,
  handleDeleteLead,
  chatInput,
  setChatInput,
  handleSendMessage,
  setShowNoInstanceModal
}: CRMLeadDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(selectedLead.name);
  const [editPhone, setEditPhone] = useState(selectedLead.phone);
  const [editEmail, setEditEmail] = useState(selectedLead.email || "");
  const [editValue, setEditValue] = useState(String(selectedLead.value || 0));
  const [editRooms, setEditRooms] = useState(Array.isArray(selectedLead.rooms) ? selectedLead.rooms.join(", ") : String(selectedLead.rooms || ""));
  const [editAssembler, setEditAssembler] = useState(selectedLead.assembler || "");
  const [loadingSave, setLoadingSave] = useState(false);

  // Estados de Mídia, Emojis e Gravador de Voz
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sendingMedia, setSendingMedia] = useState(false);
  const [togglingAi, setTogglingAi] = useState(false);

  const handleToggleAi = async () => {
    if (!selectedLead || togglingAi) return;
    setTogglingAi(true);
    try {
      const res = await fetch(`/api/leads/${selectedLead.id}/toggle-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedLead({
          ...selectedLead,
          aiPaused: data.aiPaused
        });
        fetchLeads();
      }
    } catch (e) {
      console.error("Erro ao alternar IA do lead:", e);
    } finally {
      setTogglingAi(false);
    }
  };

  const handleSaveLead = async () => {
    setLoadingSave(true);
    try {
      const roomsArray = editRooms.split(",").map((r: string) => r.trim()).filter(Boolean);
      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          email: editEmail,
          value: Number(editValue) || 0,
          rooms: roomsArray,
          assembler: editAssembler
        })
      });

      if (res.ok) {
        setSelectedLead({
          ...selectedLead,
          name: editName,
          phone: editPhone,
          email: editEmail,
          value: Number(editValue) || 0,
          rooms: roomsArray,
          assembler: editAssembler
        });
        fetchLeads();
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Erro ao salvar ficha do lead:", err);
    } finally {
      setLoadingSave(false);
    }
  };

  // Gravador de Áudio PTT
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            const res = await fetch("/api/evolution/send-audio", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                leadId: selectedLead.id,
                audioBase64: base64Audio
              })
            });
            if (res.ok) {
              const data = await res.json();
              if (data.lead) setSelectedLead(data.lead);
              if (data.evoSuccess === false && setShowNoInstanceModal) {
                setShowNoInstanceModal(true);
              }
              fetchLeads();
            }
          } catch (e) {
            console.error("Erro ao enviar áudio:", e);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Permissão de microfone não concedida pelo navegador.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Upload de Mídia / Arquivo com limites de tamanho
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const maxSizeBytes = isImage ? 16 * 1024 * 1024 : 50 * 1024 * 1024;
    const limitLabel = isImage ? "16MB (Imagens)" : "50MB (Documentos / PDFs / Promob)";

    if (file.size > maxSizeBytes) {
      alert(`O arquivo selecionado (${(file.size / (1024 * 1024)).toFixed(1)}MB) excede o limite máximo permitido de ${limitLabel}.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSendingMedia(true);
    const mediaType = isImage ? "image" : "document";
    const mimeType = file.type || (isImage ? "image/png" : "application/pdf");

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const fullDataUrl = reader.result as string;
      try {
        const res = await fetch("/api/evolution/send-media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId: selectedLead.id,
            mediaUrl: fullDataUrl,
            mediaType,
            mimeType,
            fileName: file.name,
            caption: file.name
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.lead) setSelectedLead(data.lead);
          if (data.evoSuccess === false && setShowNoInstanceModal) {
            setShowNoInstanceModal(true);
          }
          fetchLeads();
        } else {
          alert("Erro ao enviar arquivo via WhatsApp.");
        }
      } catch (err) {
        console.error("Erro ao enviar arquivo:", err);
      } finally {
        setSendingMedia(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
  };

  const [mobileTab, setMobileTab] = useState<"ficha" | "chat">("ficha");

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[120] flex justify-end">
      <div className="w-full lg:max-w-4xl bg-[#0f0f0f] border-l border-white/10 h-full flex flex-col shadow-2xl animate-slide-in">
        {/* Drawer Header Responsivo */}
        <div className="h-auto min-h-[4rem] border-b border-white/10 px-4 sm:px-6 py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 bg-black/50">
          <div className="flex items-center gap-2 flex-wrap">
            {isEditing ? (
              <input 
                type="text" 
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="bg-black/60 border border-white/20 rounded px-3 py-1 text-sm text-white font-bold focus:outline-none focus:border-white"
              />
            ) : (
              <h3 className="font-bold text-base sm:text-lg">{selectedLead.name}</h3>
            )}
            <span className="text-[10px] sm:text-xs bg-white/10 text-white px-2 py-0.5 rounded border border-white/10">
              {selectedLead.utmSource}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={isEditing ? handleSaveLead : () => setIsEditing(true)}
              disabled={loadingSave}
              className={`text-[11px] sm:text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                isEditing ? "bg-green-600 hover:bg-green-500 text-white" : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
              }`}
            >
              {isEditing ? (loadingSave ? "Salvando..." : "Salvar Ficha") : "Editar Ficha"}
            </button>
            {handleDeleteLead && (
              <button 
                onClick={() => handleDeleteLead(selectedLead.id)}
                className="text-red-400 hover:text-red-300 text-[11px] sm:text-xs font-bold bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} />
                <span className="hidden sm:inline">Excluir Lead</span>
              </button>
            )}
            <button 
              onClick={() => setSelectedLead(null)}
              className="text-gray-400 hover:text-white text-[11px] sm:text-xs font-bold bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* SELETOR DE ABAS MOBILE (< lg) */}
        <div className="lg:hidden flex border-b border-white/10 bg-black/60 p-1 flex-shrink-0">
          <button
            onClick={() => setMobileTab("ficha")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mobileTab === "ficha" ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"
            }`}
          >
            📋 Ficha Técnica & Promob
          </button>

          <button
            onClick={() => setMobileTab("chat")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mobileTab === "chat" ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"
            }`}
          >
            💬 Chat WhatsApp
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Coluna Esquerda: Ficha Técnica & Promob Files */}
          <div className={`
            w-full lg:w-1/2 border-r border-white/10 p-4 sm:p-6 overflow-y-auto space-y-6 scrollbar-thin
            ${mobileTab === "ficha" ? "block" : "hidden lg:block"}
          `}>
            {/* Contatos */}
            <div>
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">Informações de Contato</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-400" />
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      className="bg-black/60 border border-white/20 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-white w-full"
                    />
                  ) : (
                    <span>{selectedLead.phone}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-gray-400" />
                  {isEditing ? (
                    <input 
                      type="email" 
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      placeholder="E-mail do cliente"
                      className="bg-black/60 border border-white/20 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-white w-full"
                    />
                  ) : (
                    <span>{selectedLead.email || "Sem e-mail"}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Ficha do Projeto */}
            <div>
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">Ficha do Projeto</h4>
              <div className="bg-black/40 border border-white/5 rounded-lg p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Ambientes:</span>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editRooms}
                      onChange={e => setEditRooms(e.target.value)}
                      placeholder="Cozinha, Suíte, Closet..."
                      className="bg-black/60 border border-white/20 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-white text-right w-48"
                    />
                  ) : (
                    <span className="font-bold">{Array.isArray(selectedLead.rooms) ? selectedLead.rooms.join(", ") : String(selectedLead.rooms || "Contato Geral")}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Valor do Projeto:</span>
                  {isEditing ? (
                    <input 
                      type="number" 
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      className="bg-black/60 border border-white/20 rounded px-2 py-1 text-xs text-green-400 font-bold focus:outline-none focus:border-white text-right w-36"
                    />
                  ) : (
                    <span className="font-bold text-green-500">
                      {selectedLead.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Montador Responsável:</span>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editAssembler}
                      onChange={e => setEditAssembler(e.target.value)}
                      placeholder="Nome do montador"
                      className="bg-black/60 border border-white/20 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-white text-right w-36"
                    />
                  ) : (
                    <span className="font-bold text-gray-200">{selectedLead.assembler || "Não definido"}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Campanha UTM:</span>
                  <span className="font-bold text-white">{selectedLead.utmCampaign}</span>
                </div>
              </div>
            </div>

            {/* Medição e Produção Checklist */}
            <div>
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">Checklist Técnico (Marcenaria)</h4>
              <div className="space-y-2 bg-black/40 border border-white/5 rounded-lg p-4 text-xs">
                {[
                  { key: "medidas_conferidas", label: "Medições Técnicas Conferidas (Esquadro/Paredes)" },
                  { key: "pontos_agua_gas_conferidos", label: "Pontos Hidráulicos, Gás e Elétricos demarcados" },
                  { key: "plano_corte_gerado", label: "Plano de Corte Otimizado (Corte Cloud)" },
                  { key: "enviado_fabrica", label: "Enviado à Produção/Fábrica" },
                  { key: "montagem_iniciada", label: "Montagem em Execução na Obra" },
                  { key: "vistoria_finalizada", label: "Vistoria Final e Entrega de Chaves" }
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-2 cursor-pointer py-0.5">
                    <input 
                      type="checkbox" 
                      checked={!!selectedLead.checklist[item.key]}
                      onChange={async () => {
                        const updated = { ...selectedLead.checklist, [item.key]: !selectedLead.checklist[item.key] };
                        try {
                          const res = await fetch(`/api/leads/${selectedLead.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ checklist: updated })
                          });
                          if (res.ok) {
                            setSelectedLead({ ...selectedLead, checklist: updated });
                            fetchLeads();
                          }
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="rounded border-white/10 accent-white"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Promob Files Upload Area */}
            <div>
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">Projetos & Renders (Promob)</h4>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sendingMedia}
                className="w-full border border-dashed border-white/20 rounded-lg p-4 text-center hover:border-white/40 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 bg-black/20"
              >
                <Upload size={20} className="text-white" />
                <span className="text-[10px] text-gray-400">
                  {sendingMedia ? "Enviando arquivo..." : "Clique para anexar arquivo .promob ou Renders 3D"}
                </span>
              </button>
            </div>

            {/* Movimentar Etapa do Funil */}
            <div>
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">Movimentar Lead</h4>
              <div className="grid grid-cols-2 gap-2">
                {STAGES.map(st => (
                  <button 
                    key={st.id}
                    onClick={() => moveLead(selectedLead.id, st.id)}
                    className={`text-[10px] py-1.5 px-2 rounded border text-left transition-all ${selectedLead.stage === st.id ? "bg-white text-black border-white font-bold" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                  >
                    {st.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Coluna Direita: Chat Omnichannel Integrado (Evolution API) */}
          <div className={`w-full lg:w-1/2 flex-col bg-[#0b0f12] h-full relative ${mobileTab === "chat" ? "flex" : "hidden lg:flex"}`}>
            {/* Topo do Chat com Status e Botão WhatsApp */}
            <div className="p-3 bg-black/60 border-b border-white/10 flex items-center justify-between gap-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  {selectedLead.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">{selectedLead.name}</h4>
                  <span className="text-[9px] text-emerald-400 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    WhatsApp Conectado
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {/* Botão de Controle de IA / Intervenção Humana */}
                <button
                  type="button"
                  onClick={handleToggleAi}
                  disabled={togglingAi}
                  className={`text-[10px] border px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer shadow-sm ${
                    selectedLead.aiPaused
                      ? "bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300"
                      : "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-300"
                  }`}
                  title={
                    selectedLead.aiPaused
                      ? "A IA está pausada para este cliente. Clique para reativar o robô."
                      : "A IA está respondendo este cliente. Clique para pausar e assumir o atendimento manual."
                  }
                >
                  {selectedLead.aiPaused ? (
                    <>
                      <UserCheck size={12} className="text-amber-400" />
                      <span>Humano no Controle</span>
                      <span className="text-[8px] bg-amber-500/40 px-1 py-0.2 rounded text-white font-medium">IA Pausada</span>
                    </>
                  ) : (
                    <>
                      <Bot size={12} className="text-emerald-400" />
                      <span>IA Ativa</span>
                      <span className="text-[8px] bg-emerald-500/40 px-1 py-0.2 rounded text-white font-medium">Pausar</span>
                    </>
                  )}
                </button>

                {selectedLead.phone && (
                  <a
                    href={`https://wa.me/${selectedLead.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold transition-all"
                    title="Abrir conversa no WhatsApp Web"
                  >
                    <ExternalLink size={11} />
                    WhatsApp Web
                  </a>
                )}
              </div>
            </div>

            {/* Histórico do Chat com Balões Estilo WhatsApp Web */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin bg-[#0b141a]/60">
              {/* Banner de Atendimento Humano em Andamento */}
              {selectedLead.aiPaused && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-between gap-2 text-amber-300 text-xs shadow-inner animate-fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-amber-400 flex-shrink-0" />
                    <span className="text-[11px] leading-tight">
                      <strong>Atendimento Humano em Andamento:</strong> A IA está pausada para este cliente para você conversar livremente.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleAi}
                    className="text-[10px] font-bold bg-amber-500 hover:bg-amber-400 text-black px-2.5 py-1 rounded-lg transition-all flex-shrink-0 cursor-pointer shadow"
                  >
                    Reativar IA
                  </button>
                </div>
              )}

              {/* Separador de Início da Conversa */}
              <div className="flex justify-center my-2">
                <span className="text-[9px] bg-black/60 border border-white/10 text-gray-400 px-3 py-0.5 rounded-full uppercase tracking-wider font-semibold shadow">
                  🔒 Criptografia WhatsApp • Dumar Móveis
                </span>
              </div>

              {selectedLead.chatHistory.map((chat: any, idx: number) => {
                if (chat.sender === "system") {
                  return (
                    <div key={idx} className="flex justify-center my-2">
                      <span className="text-[9px] bg-white/5 border border-white/10 rounded-full px-3 py-1 text-gray-400 tracking-wider">
                        {chat.text}
                      </span>
                    </div>
                  );
                }
                const isAgent = chat.sender === "agent";
                return (
                  <div key={idx} className={`flex ${isAgent ? "justify-end" : "justify-start"} animate-fade-in`}>
                    <div className={`max-w-[80%] sm:max-w-xs rounded-2xl p-3 text-xs shadow-lg relative ${
                      isAgent 
                        ? "bg-[#005c4b] text-white rounded-tr-none border border-emerald-500/20" 
                        : "bg-[#202c33] text-gray-100 rounded-tl-none border border-white/5"
                    }`}>
                      {/* Renderizador de Áudio PTT */}
                      {chat.type === "audio" && (
                        <div className="flex flex-col gap-1.5 mb-1.5">
                          <div className="flex items-center gap-2">
                            <Volume2 size={16} className={isAgent ? "text-emerald-300" : "text-emerald-400"} />
                            <span className="text-[10px] font-bold">Mensagem de Voz</span>
                          </div>
                          <audio controls src={chat.audioUrl} className="w-full h-8 max-w-[220px]" />
                        </div>
                      )}

                      {/* Renderizador de Mídia (Fotos / PDFs) */}
                      {chat.type === "media" && (
                        <div className="space-y-1.5 mb-1.5">
                          {chat.mediaType === "image" ? (
                            <img src={chat.mediaUrl} alt="Foto da conversa" className="rounded-lg max-h-48 object-cover w-full border border-white/10" />
                          ) : (
                            <a href={chat.mediaUrl} target="_blank" rel="noreferrer" download={chat.fileName} className="flex items-center gap-2 p-2 bg-black/30 rounded-lg border border-white/10 hover:underline">
                              <File size={16} className="text-emerald-400" />
                              <span className="truncate max-w-[160px] text-[10px]">{chat.fileName || "Download Documento"}</span>
                            </a>
                          )}
                        </div>
                      )}

                      <p className="leading-relaxed whitespace-pre-wrap select-text">{chat.text}</p>
                      
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className={`text-[9px] ${isAgent ? "text-emerald-200/70" : "text-gray-400"}`}>
                          {chat.timestamp || ""}
                        </span>
                        {isAgent && (
                          <CheckCheck size={12} className="text-emerald-300" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Popover Emojis Categorizados */}
            {showEmojiPicker && (
              <div className="absolute bottom-16 left-4 bg-[#181818] border border-white/20 rounded-xl p-3 shadow-2xl w-72 h-64 overflow-y-auto z-20 animate-scale-in scrollbar-thin">
                <div className="space-y-3">
                  {EMOJI_CATEGORIES.map(cat => (
                    <div key={cat.name}>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{cat.name}</span>
                      <div className="flex flex-wrap gap-1">
                        {cat.emojis.map((emoji, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setChatInput((chatInput || "") + emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="text-lg hover:scale-125 transition-transform cursor-pointer p-1 rounded hover:bg-white/10"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input de Mensagens + Microfone + Anexo */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept="image/*,application/pdf,.promob"
            />

            <form onSubmit={handleSendMessage} className="h-16 border-t border-white/10 px-3 flex items-center gap-2 bg-black/50">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(prev => !prev)}
                className="text-gray-400 hover:text-white p-1.5 transition-colors cursor-pointer"
                title="Inserir Emoji"
              >
                <Smile size={18} />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sendingMedia}
                className="text-gray-400 hover:text-white p-1.5 transition-colors cursor-pointer"
                title="Anexar Imagem ou PDF"
              >
                <Paperclip size={18} />
              </button>

              {isRecording ? (
                <div className="flex-1 flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs text-red-400 font-bold flex-1">Gravando Voz: {recordingSeconds}s</span>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="bg-red-600 text-white p-1 rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Square size={12} /> Parar & Enviar
                  </button>
                </div>
              ) : (
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Digite sua resposta no WhatsApp..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-white"
                />
              )}

              {!isRecording && (
                <button
                  type="button"
                  onClick={startRecording}
                  className="text-gray-400 hover:text-emerald-400 p-1.5 transition-colors cursor-pointer"
                  title="Gravar Áudio de Voz (PTT)"
                >
                  <Mic size={18} />
                </button>
              )}

              <button 
                type="submit" 
                disabled={isRecording || !chatInput.trim()}
                className="bg-white hover:bg-neutral-200 text-black p-2 rounded-lg cursor-pointer transition-colors disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

