import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, Zap, Save, CheckCircle2, Check, MessageSquare, Plus, Trash2, 
  Settings2, RefreshCw, Send, Play, MapPin, Building2, Phone, User, Clock
} from "lucide-react";
import { WhatsappTemplate } from "./types";

interface AIRules {
  noDirectPrice: boolean;
  askFloorPlan: boolean;
  askLocation: boolean;
  inviteOffice: boolean;
  shortMessages: boolean;
}

export interface DaySchedule {
  active: boolean;
  morningActive?: boolean;
  morningStart?: string;
  morningEnd?: string;
  afternoonActive?: boolean;
  afternoonStart?: string;
  afternoonEnd?: string;
}

export interface WeeklySchedule {
  seg: DaySchedule;
  ter: DaySchedule;
  qua: DaySchedule;
  qui: DaySchedule;
  sex: DaySchedule;
  sab: DaySchedule;
  dom: DaySchedule;
}

export const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  seg: { active: true, morningActive: true, morningStart: "08:30", morningEnd: "12:00", afternoonActive: true, afternoonStart: "13:30", afternoonEnd: "18:00" },
  ter: { active: true, morningActive: true, morningStart: "08:30", morningEnd: "12:00", afternoonActive: true, afternoonStart: "13:30", afternoonEnd: "18:00" },
  qua: { active: true, morningActive: true, morningStart: "08:30", morningEnd: "12:00", afternoonActive: true, afternoonStart: "13:30", afternoonEnd: "18:00" },
  qui: { active: true, morningActive: true, morningStart: "08:30", morningEnd: "12:00", afternoonActive: true, afternoonStart: "13:30", afternoonEnd: "18:00" },
  sex: { active: true, morningActive: true, morningStart: "08:30", morningEnd: "12:00", afternoonActive: true, afternoonStart: "13:30", afternoonEnd: "18:00" },
  sab: { active: true, morningActive: true, morningStart: "08:30", morningEnd: "12:00", afternoonActive: false, afternoonStart: "13:30", afternoonEnd: "18:00" },
  dom: { active: false, morningActive: false, morningStart: "08:30", morningEnd: "12:00", afternoonActive: false, afternoonStart: "13:30", afternoonEnd: "18:00" }
};

interface AIConfig {
  botEnabled: boolean;
  assistantName: string;
  companyName: string;
  officeAddress: string;
  activePreset: string;
  welcomeMessage: string;
  systemPrompt: string;
  businessHours?: {
    days?: string[];
    workDaysText?: string;
    weekly?: WeeklySchedule;
    morningStart?: string;
    morningEnd?: string;
    afternoonStart?: string;
    afternoonEnd?: string;
    slotDurationMinutes: number;
    minNoticeHours: number;
  };
  rules: AIRules;
  handoffEnabled: boolean;
  triggerKeyword: string;
  typingDelay: number;
}

const PRESETS = {
  qualificador: {
    name: "Qualificador Comercial Completo (Recomendado)",
    desc: "Qualifica os ambientes desejados, prazo da obra e convida para reunião no escritório ou visita técnica.",
    prompt: `Você é a assistente comercial de inteligência artificial da Dumar Móveis Planejados, especialista em móveis sob medida de alto padrão 100% MDF com ferragens amortecidas.
Seu objetivo é atender os clientes de forma calorosa, ágil e profissional no WhatsApp.

REGRAS MANDATÓRIAS:
1. SAUDAÇÃO PERSONALIZADA: Se você souber o nome do cliente ({nome}), comece chamando-o pelo nome (Ex: "Olá, {nome}! Tudo bem? Seja muito bem-vindo(a) à Dumar Móveis Planejados."). Se o nome não estiver identificado ou for genérico, pergunte gentilmente: "Olá! Tudo bem? Seja bem-vindo(a) à Dumar Móveis Planejados. Com quem tenho o prazer de falar? E qual ambiente você gostaria de planejar?".
2. INFORMAÇÕES INSTITUCIONAIS & DIRETORIA: O fundador, empresário e diretor executivo da Dumar Móveis Planejados é o Paulo Vargas. Se o cliente perguntar quem é o dono, CEO, empresário ou responsável pela Dumar, informe com total segurança que é o Paulo Vargas, um profissional apaixonado por marcenaria fina e móveis sob medida de excelência.
3. NUNCA passe valores ou orçamentos fechados de cabeça. Explique que cada projeto é 100% sob medida e personalizado.
4. Descubra quais ambientes o cliente deseja planejar (Cozinha, Quarto/Suíte, Banheiro, Sala, Closet, Lavanderia, etc.).
5. Pergunte se o cliente já possui a planta baixa com medidas ou fotos do cômodo.
6. Identifique onde fica o imóvel (cidade/bairro) e se é casa ou apartamento.
7. Convide o cliente para uma reunião no Escritório Comercial da Dumar ({endereco_escritorio}) para tomar um café e visualizar o projeto 3D renderizado no Promob com nossos projetistas, ou agendar uma visita técnica na obra.
8. LINKS DE PORTFÓLIO E VÍDEOS: Se o cliente pedir para ver fotos de trabalhos realizados, modelos de ambientes ou projetos entregues, envie o link do nosso Portfólio: https://dumarplanejados.com.br/#portfolio . Se pedir vídeos de móveis, montagens e acabamentos, envie o link dos nossos Vídeos: https://dumarplanejados.com.br/#videos .
9. Escreva mensagens curtas, humanizadas e acolhedoras (estilo WhatsApp real, máximo de 2 a 3 parágrafos curtos).`,
    welcome: "Olá {nome}! Tudo bem? Seja muito bem-vindo(a) à {empresa}. Recebemos seu contato com sucesso. Para qual ambiente você gostaria de fazer um projeto sob medida?",
    rules: {
      noDirectPrice: true,
      askFloorPlan: true,
      askLocation: true,
      inviteOffice: true,
      shortMessages: true
    }
  },
  agendador: {
    name: "Agendador de Visitas & Medições Técnicas",
    desc: "Focado em agendar rapidamente uma visita técnica na obra ou reunião de apresentação no escritório.",
    prompt: `Você é o assistente de agendamento da Dumar Móveis Planejados.
Seu foco principal é agendar uma visita técnica gratuita na obra do cliente para medições de precisão (esquadro, hidráulica e elétrica) ou convidá-lo para conhecer nosso Escritório Comercial ({endereco_escritorio}).

REGRAS:
1. Seja cortês, direto e profissional.
2. Pergunte qual o melhor dia e período (manhã ou tarde) para o projetista realizar a medição técnica.
3. Não passe estimativas de preços sem antes realizar a conferência das medidas no local.
4. Mantenha mensagens curtas e objetivas.`,
    welcome: "Olá {nome}! Aqui é da {empresa}. Gostaria de agendar uma visita técnica sem compromisso na sua obra ou prefere nos visitar no nosso escritório?",
    rules: {
      noDirectPrice: true,
      askFloorPlan: false,
      askLocation: true,
      inviteOffice: true,
      shortMessages: true
    }
  },
  triagem: {
    name: "Recepção & Triagem Rápida",
    desc: "Atendimento acolhedor de primeiro contato que coleta o nome e transfere para um consultor.",
    prompt: `Você é a recepcionista virtual da Dumar Móveis Planejados.
Dê boas-vindas calorosas, pergunte como podemos ajudar e avise que um consultor especializado entrará em contato em instantes para dar sequência no atendimento personalizado.`,
    welcome: "Olá {nome}! Obrigado por entrar em contato com a {empresa}. Em qual ambiente você está pensando em planejar?",
    rules: {
      noDirectPrice: true,
      askFloorPlan: false,
      askLocation: false,
      inviteOffice: false,
      shortMessages: true
    }
  }
};

const VARIABLE_BADGES = [
  { tag: "{nome}", label: "Nome do Cliente", icon: User, example: "Paulo Vargas" },
  { tag: "{ambientes}", label: "Ambientes", icon: Building2, example: "Cozinha, Closet" },
  { tag: "{endereco_escritorio}", label: "Endereço do Escritório", icon: MapPin, example: "Av. Santa Catarina, 551, Sala 205" },
  { tag: "{empresa}", label: "Nome da Empresa", icon: Building2, example: "Dumar Móveis Planejados" },
  { tag: "{telefone}", label: "Telefone Formatado", icon: Phone, example: "(48) 99101-3293" }
];

export default function CRMSettings() {
  const [activeTab, setActiveTab] = useState<"ai_assistant" | "welcome" | "templates">("ai_assistant");

  // Estado da Configuração de IA
  const [config, setConfig] = useState<AIConfig>({
    botEnabled: true,
    assistantName: "Assistente Comercial Dumar",
    companyName: "Dumar Móveis Planejados",
    officeAddress: "Av. Santa Catarina, 551, Sala 205, Centro, Balneário Arroio do Silva - SC",
    activePreset: "qualificador",
    welcomeMessage: PRESETS.qualificador.welcome,
    systemPrompt: PRESETS.qualificador.prompt,
    businessHours: {
      days: ["seg", "ter", "qua", "qui", "sex", "sab"],
      morningStart: "08:30",
      morningEnd: "12:00",
      afternoonStart: "13:30",
      afternoonEnd: "18:00",
      slotDurationMinutes: 60,
      minNoticeHours: 2
    },
    rules: PRESETS.qualificador.rules,
    handoffEnabled: true,
    triggerKeyword: "#ia",
    typingDelay: 2
  });

  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Referência do textarea para inserção de badges dinâmicos
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const welcomeTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Estado do Simulador de Teste
  const [simMode, setSimMode] = useState<"with_name" | "no_name">("with_name");
  const [simClientName, setSimClientName] = useState("Henrique");
  const [simMessages, setSimMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Olá, Henrique! Tudo bem? Seja muito bem-vindo(a) à Dumar Móveis Planejados. Para qual ambiente você gostaria de fazer um projeto sob medida?" }
  ]);
  const [simInput, setSimInput] = useState("");
  const [simLoading, setSimLoading] = useState(false);

  const resetSimulator = (mode: "with_name" | "no_name", nameVal: string) => {
    setSimMode(mode);
    if (mode === "with_name") {
      setSimMessages([{
        sender: "ai",
        text: `Olá, ${nameVal || "Cliente"}! Tudo bem? Seja muito bem-vindo(a) à Dumar Móveis Planejados. Para qual ambiente você gostaria de fazer um projeto sob medida?`
      }]);
    } else {
      setSimMessages([{
        sender: "ai",
        text: "Olá! Tudo bem? Seja muito bem-vindo(a) à Dumar Móveis Planejados. Com quem tenho o prazer de falar? E qual ambiente você gostaria de planejar?"
      }]);
    }
  };

  // Templates Rápidos
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [templateCategory, setTemplateCategory] = useState("Proposta");
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Carregar configurações do Backend
  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/ai-assistant/config");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setConfig(prev => ({
            ...prev,
            ...data,
            rules: { ...prev.rules, ...(data.rules || {}) }
          }));
        }
      }
    } catch (err) {
      console.error("Erro ao carregar configurações de IA:", err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/whatsapp/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchTemplates();
  }, []);

  // Salvar Configurações no Backend
  const handleSaveConfig = async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch("/api/ai-assistant/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3500);
      }
    } catch (err) {
      console.error("Erro ao salvar configurações:", err);
      alert("Erro ao salvar configurações de IA.");
    } finally {
      setLoadingConfig(false);
    }
  };

  // Aplicar Preset de 1 Clique
  const applyPreset = (key: "qualificador" | "agendador" | "triagem") => {
    const p = PRESETS[key];
    if (!p) return;
    setConfig(prev => ({
      ...prev,
      activePreset: key,
      systemPrompt: p.prompt,
      welcomeMessage: p.welcome,
      rules: { ...p.rules }
    }));
  };

  // Inserir Badge Variável no Campo de Texto Ativo
  const insertVariable = (tag: string, target: "prompt" | "welcome") => {
    if (target === "prompt") {
      const textarea = promptTextareaRef.current;
      if (!textarea) {
        setConfig(prev => ({ ...prev, systemPrompt: prev.systemPrompt + " " + tag }));
        return;
      }
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const current = config.systemPrompt;
      const updated = current.substring(0, start) + tag + current.substring(end);
      setConfig(prev => ({ ...prev, systemPrompt: updated }));
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 50);
    } else {
      const textarea = welcomeTextareaRef.current;
      if (!textarea) {
        setConfig(prev => ({ ...prev, welcomeMessage: prev.welcomeMessage + " " + tag }));
        return;
      }
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const current = config.welcomeMessage;
      const updated = current.substring(0, start) + tag + current.substring(end);
      setConfig(prev => ({ ...prev, welcomeMessage: updated }));
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 50);
    }
  };

  // Enviar Mensagem no Simulador de Teste
  const handleSendSimMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simInput.trim() || simLoading) return;

    const userText = simInput.trim();
    const newSimHistory = [...simMessages, { sender: "user" as const, text: userText }];
    setSimMessages(newSimHistory);
    setSimInput("");
    setSimLoading(true);

    try {
      const formattedHistory = newSimHistory.map(m => ({
        sender: m.sender === "user" ? "client" : "agent",
        text: m.text
      }));

      const activeClientName = simMode === "with_name" ? (simClientName.trim() || "Cliente") : "";

      const res = await fetch("/api/ai-assistant/test-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: formattedHistory,
          clientName: activeClientName
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSimMessages([...newSimHistory, { sender: "ai", text: data.reply || "Resposta recebida com sucesso." }]);
      } else {
        setSimMessages([...newSimHistory, { sender: "ai", text: "Erro ao consultar a IA de teste." }]);
      }
    } catch (err) {
      console.error(err);
      setSimMessages([...newSimHistory, { sender: "ai", text: "Falha de conexão com o motor de teste." }]);
    } finally {
      setSimLoading(false);
    }
  };

  // Adicionar Template Rápido
  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateTitle || !templateContent) return;
    setSavingTemplate(true);

    try {
      const res = await fetch("/api/whatsapp/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: templateTitle, content: templateContent, category: templateCategory })
      });
      if (res.ok) {
        const newT = await res.json();
        setTemplates(prev => [...prev, newT]);
        setTemplateTitle("");
        setTemplateContent("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    try {
      const res = await fetch(`/api/whatsapp/templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-8 space-y-6 bg-[#080808] text-white font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bot size={18} />
            </div>
            <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider text-white">
              Central de Automação & Assistente de IA
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Configure o atendimento automático inteligente no WhatsApp da Dumar com regras de marcenaria fina.
          </p>
        </div>

        {/* Abas de Navegação */}
        <div className="flex bg-black/60 border border-white/10 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("ai_assistant")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "ai_assistant" ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "text-gray-400 hover:text-white"
            }`}
          >
            <Bot size={13} />
            Assistente de IA
          </button>
          <button
            onClick={() => setActiveTab("welcome")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "welcome" ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "text-gray-400 hover:text-white"
            }`}
          >
            <Zap size={13} />
            Boas-Vindas
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "templates" ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "text-gray-400 hover:text-white"
            }`}
          >
            <MessageSquare size={13} />
            Templates Rápidos
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: ASSISTENTE DE IA COMERCIAL (PROMPT + PRESETS + BADGES + REGRAS) */}
      {/* ========================================================================= */}
      {activeTab === "ai_assistant" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Lado Esquerdo: Formulário de Configuração & Prompt */}
          <div className="xl:col-span-7 space-y-6">
            {/* Card de Status do Robô */}
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                  config.botEnabled 
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/10" 
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}>
                  <Bot size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Assistente Automático no WhatsApp</h4>
                  <p className="text-xs text-gray-400">
                    {config.botEnabled 
                      ? "Ativo • Responde e qualifica os clientes em tempo real" 
                      : "Pausado • Nenhuma mensagem automática será disparada"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, botEnabled: !prev.botEnabled }))}
                className={`text-xs px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  config.botEnabled 
                    ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20" 
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                {config.botEnabled ? "IA LIGADA" : "IA DESLIGADA"}
              </button>
            </div>

            {/* Presets Rápidos de 1 Clique */}
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  Modelos Prontos de Atendimento (1 Clique)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map(key => {
                  const p = PRESETS[key];
                  const isSelected = config.activePreset === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applyPreset(key)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected 
                          ? "bg-amber-500/10 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10" 
                          : "bg-black/40 border-white/5 text-gray-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold block mb-1 text-white">{p.name}</span>
                        <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">{p.desc}</p>
                      </div>
                      {isSelected && (
                        <span className="text-[9px] font-extrabold text-amber-400 mt-2 flex items-center gap-1">
                          <CheckCircle2 size={10} /> Ativo no momento
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inserção de Variáveis Dinâmicas por Badges Clicáveis */}
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <Plus size={14} className="text-amber-400" />
                  Variáveis Dinâmicas (Clique para Inserir no Prompt)
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Ao clicar em uma tag abaixo, o sistema insere o marcador no texto do seu prompt:
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {VARIABLE_BADGES.map((b, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => insertVariable(b.tag, "prompt")}
                    className="bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-gray-300 hover:text-amber-300 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow"
                    title={`Exemplo real: "${b.example}"`}
                  >
                    <b.icon size={12} className="text-amber-400" />
                    <span>+ Inserir {b.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt do Assistente (Instruções da Marcenaria) */}
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <Settings2 size={14} className="text-amber-400" />
                  Instruções e Personalidade da IA (Prompt Completo)
                </label>
                <span className="text-[10px] text-gray-500">Total controle das respostas</span>
              </div>

              <textarea
                ref={promptTextareaRef}
                rows={9}
                value={config.systemPrompt}
                onChange={e => setConfig(prev => ({ ...prev, systemPrompt: e.target.value, activePreset: "personalizado" }))}
                placeholder="Escreva como o assistente deve responder aos clientes..."
                className="w-full bg-black/60 border border-white/10 rounded-xl p-3.5 text-xs text-gray-200 leading-relaxed font-mono focus:outline-none focus:border-amber-400 transition-colors scrollbar-thin"
              />
            </div>

            {/* Regras Mandatórias de Marcenaria (Toggles / Checkboxes) */}
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                Regras Mandatórias de Marcenaria Fina
              </h4>

              <div className="space-y-2.5">
                {[
                  {
                    key: "noDirectPrice" as const,
                    title: "Proibir valores fechados de cabeça sem medição ou planta",
                    desc: "A IA explica com elegância que cada móvel é 100% sob medida e precisa de conferência técnica."
                  },
                  {
                    key: "askFloorPlan" as const,
                    title: "Qualificar Planta Baixa e Fotos do Ambiente",
                    desc: "Pergunta ativamente se o cliente já possui planta baixa com cotas ou fotos do cômodo."
                  },
                  {
                    key: "askLocation" as const,
                    title: "Identificar Localização e Tipo do Imóvel",
                    desc: "Pergunta a cidade/bairro e se é casa, apartamento ou espaço comercial."
                  },
                  {
                    key: "inviteOffice" as const,
                    title: "Convidar para o Escritório Comercial ou Visita Técnica",
                    desc: `Convida para tomar um café no Escritório (${config.officeAddress}) para ver o 3D ou agendar visita na obra.`
                  },
                  {
                    key: "shortMessages" as const,
                    title: "Respostas Humanas no Estilo WhatsApp (Sem textão)",
                    desc: "Limita o tamanho das mensagens a 2 ou 3 parágrafos curtos para conversa fluida."
                  }
                ].map(rule => (
                  <label 
                    key={rule.key} 
                    className="flex items-start gap-3 p-3 bg-black/40 border border-white/5 rounded-xl cursor-pointer hover:border-white/20 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={config.rules[rule.key]}
                      onChange={e => setConfig(prev => ({
                        ...prev,
                        rules: { ...prev.rules, [rule.key]: e.target.checked }
                      }))}
                      className="mt-0.5 rounded border-white/20 text-amber-500 focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">{rule.title}</span>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-normal">{rule.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Endereço do Escritório Comercial */}
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <MapPin size={14} className="text-amber-400" />
                Endereço Oficial do Escritório Comercial (Reuniões com Projetista)
              </label>
              <input
                type="text"
                value={config.officeAddress}
                onChange={e => setConfig(prev => ({ ...prev, officeAddress: e.target.value }))}
                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
              />
              <p className="text-[10px] text-gray-500">
                O escritório acima é o endereço oficial para atendimento, café e apresentação do 3D renderizado.
              </p>
            </div>

            {/* Grade de Horários & Validação de Agenda em Tempo Real */}
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Grade de Horários & Agendamento da IA
                  </h4>
                </div>
                <span className="text-[10px] bg-amber-500/10 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                  Validação Ativa
                </span>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                A IA consulta esta grade e a <strong className="text-amber-400">Agenda do CRM</strong> em tempo real antes de confirmar qualquer visita técnica ou reunião no escritório.
              </p>

              {/* Dias de Funcionamento */}
              {/* GRADE PERSONALIZADA POR DIA DA SEMANA (SEG A DOM) */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                  <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block">
                    Horários de Atendimento por Dia da Semana:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev,
                          businessHours: {
                            ...(prev.businessHours || { slotDurationMinutes: 60, minNoticeHours: 2 }),
                            weekly: DEFAULT_WEEKLY_SCHEDULE,
                            days: ["seg", "ter", "qua", "qui", "sex", "sab"]
                          }
                        }));
                      }}
                      className="text-[10px] px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 font-bold transition-all cursor-pointer"
                    >
                      ⚡ Padrão Dumar (Sáb até 12h)
                    </button>
                  </div>
                </div>

                {/* Lista dos 7 Dias da Semana */}
                <div className="space-y-2">
                  {[
                    { key: "seg", label: "Segunda-feira" },
                    { key: "ter", label: "Terça-feira" },
                    { key: "qua", label: "Quarta-feira" },
                    { key: "qui", label: "Quinta-feira" },
                    { key: "sex", label: "Sexta-feira" },
                    { key: "sab", label: "Sábado (Ex: apenas manhã)" },
                    { key: "dom", label: "Domingo" }
                  ].map(day => {
                    const currentWeekly = config.businessHours?.weekly || DEFAULT_WEEKLY_SCHEDULE;
                    const dayData = (currentWeekly as any)[day.key] || {
                      active: day.key !== "dom",
                      morningActive: true,
                      morningStart: "08:30",
                      morningEnd: "12:00",
                      afternoonActive: day.key !== "sab" && day.key !== "dom",
                      afternoonStart: "13:30",
                      afternoonEnd: "18:00"
                    };

                    const updateDay = (patch: Partial<DaySchedule>) => {
                      const updatedWeekly = {
                        ...currentWeekly,
                        [day.key]: { ...dayData, ...patch }
                      };
                      const activeDays = Object.keys(updatedWeekly).filter(k => (updatedWeekly as any)[k].active);
                      setConfig(prev => ({
                        ...prev,
                        businessHours: {
                          ...(prev.businessHours || { slotDurationMinutes: 60, minNoticeHours: 2 }),
                          weekly: updatedWeekly,
                          days: activeDays
                        }
                      }));
                    };

                    return (
                      <div 
                        key={day.key}
                        className={`p-3 rounded-xl border transition-all ${
                          dayData.active 
                            ? "bg-black/50 border-white/10" 
                            : "bg-black/20 border-white/5 opacity-60"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Dia e Toggle Ativo/Fechado */}
                          <div className="flex items-center gap-3 min-w-[170px]">
                            <button
                              type="button"
                              onClick={() => updateDay({ active: !dayData.active })}
                              className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                dayData.active 
                                  ? "bg-amber-500 border-amber-400 text-black" 
                                  : "border-white/30 bg-transparent"
                              }`}
                            >
                              {dayData.active && <Check size={12} strokeWidth={3} />}
                            </button>
                            <div>
                              <span className="text-xs font-bold text-white block">{day.label}</span>
                              <span className="text-[10px] text-gray-400">
                                {dayData.active ? "Atendimento Disponível" : "Fechado"}
                              </span>
                            </div>
                          </div>

                          {/* Turnos do Dia */}
                          {dayData.active && (
                            <div className="flex flex-wrap items-center gap-4 flex-1 justify-end text-xs">
                              {/* Turno Manhã */}
                              <div className="flex items-center gap-2 bg-black/60 p-1.5 px-2.5 rounded-lg border border-white/10">
                                <label className="flex items-center gap-1.5 cursor-pointer text-gray-300 font-semibold text-[11px]">
                                  <input
                                    type="checkbox"
                                    checked={dayData.morningActive !== false}
                                    onChange={e => updateDay({ morningActive: e.target.checked })}
                                    className="accent-amber-500 rounded"
                                  />
                                  <span>🌅 Manhã:</span>
                                </label>
                                {dayData.morningActive !== false && (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="time"
                                      value={dayData.morningStart || "08:30"}
                                      onChange={e => updateDay({ morningStart: e.target.value })}
                                      className="bg-black/80 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white focus:border-amber-400"
                                    />
                                    <span className="text-gray-500 text-[10px]">às</span>
                                    <input
                                      type="time"
                                      value={dayData.morningEnd || "12:00"}
                                      onChange={e => updateDay({ morningEnd: e.target.value })}
                                      className="bg-black/80 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white focus:border-amber-400"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Turno Tarde */}
                              <div className="flex items-center gap-2 bg-black/60 p-1.5 px-2.5 rounded-lg border border-white/10">
                                <label className="flex items-center gap-1.5 cursor-pointer text-gray-300 font-semibold text-[11px]">
                                  <input
                                    type="checkbox"
                                    checked={dayData.afternoonActive !== false}
                                    onChange={e => updateDay({ afternoonActive: e.target.checked })}
                                    className="accent-amber-500 rounded"
                                  />
                                  <span>🌇 Tarde:</span>
                                </label>
                                {dayData.afternoonActive !== false ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="time"
                                      value={dayData.afternoonStart || "13:30"}
                                      onChange={e => updateDay({ afternoonStart: e.target.value })}
                                      className="bg-black/80 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white focus:border-amber-400"
                                    />
                                    <span className="text-gray-500 text-[10px]">às</span>
                                    <input
                                      type="time"
                                      value={dayData.afternoonEnd || "18:00"}
                                      onChange={e => updateDay({ afternoonEnd: e.target.value })}
                                      className="bg-black/80 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white focus:border-amber-400"
                                    />
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-gray-500 italic">Fechado à tarde</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Antecedência e Duração */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Duração da Reunião/Visita:
                  </label>
                  <select
                    value={config.businessHours?.slotDurationMinutes || 60}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      businessHours: { ...(prev.businessHours as any), slotDurationMinutes: Number(e.target.value) }
                    }))}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-amber-400 cursor-pointer"
                  >
                    <option value={45}>45 minutos</option>
                    <option value={60}>1 hora (Padrão)</option>
                    <option value={90}>1 hora e 30 minutos</option>
                    <option value={120}>2 horas</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Antecedência Mínima:
                  </label>
                  <select
                    value={config.businessHours?.minNoticeHours || 2}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      businessHours: { ...(prev.businessHours as any), minNoticeHours: Number(e.target.value) }
                    }))}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-amber-400 cursor-pointer"
                  >
                    <option value={1}>1 hora antes</option>
                    <option value={2}>2 horas antes (Recomendado)</option>
                    <option value={4}>4 horas antes</option>
                    <option value={24}>Apenas para o dia seguinte (24h)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Botão Salvar Todas as Configurações */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={loadingConfig}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs py-3 px-6 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-xl shadow-amber-500/20"
              >
                <Save size={16} />
                {loadingConfig ? "Salvando Alterações..." : "Salvar Configurações da IA"}
              </button>

              {savedSuccess && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 animate-fade-in">
                  <CheckCircle2 size={16} />
                  Configurações salvas e ativas no WhatsApp!
                </div>
              )}
            </div>
          </div>

          {/* Lado Direito: Simulador de Teste Interativo (Sandbox) */}
          <div className="xl:col-span-5 bg-[#121212] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col h-[740px] sticky top-6">
            <div className="border-b border-white/10 pb-3 mb-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Play size={14} className="text-amber-400" />
                    Simulador de Conversa em Tempo Real
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Teste as respostas da IA antes de ligar no WhatsApp real</p>
                </div>

                <button
                  type="button"
                  onClick={() => resetSimulator(simMode, simClientName)}
                  className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Reiniciar conversa de teste"
                >
                  <RefreshCw size={11} />
                  Reiniciar
                </button>
              </div>

              {/* Seletor de Perfil do Cliente no Teste */}
              <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => resetSimulator("with_name", simClientName)}
                  className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    simMode === "with_name"
                      ? "bg-amber-500 text-black shadow"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <User size={11} />
                  Cliente com Nome
                </button>

                <button
                  type="button"
                  onClick={() => resetSimulator("no_name", "")}
                  className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    simMode === "no_name"
                      ? "bg-amber-500 text-black shadow"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  ❓ Lead Novo (Sem Nome)
                </button>
              </div>

              {simMode === "with_name" && (
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[10px] text-gray-400 font-semibold">Nome para o Teste:</span>
                  <input
                    type="text"
                    value={simClientName}
                    onChange={e => {
                      const val = e.target.value;
                      setSimClientName(val);
                      resetSimulator("with_name", val);
                    }}
                    placeholder="Ex: Henrique, Paulo..."
                    className="flex-1 bg-black/80 border border-white/10 rounded-lg px-2 py-0.5 text-[11px] text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}
            </div>

            {/* Mensagens do Simulador */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-[#0b141a]/80 rounded-xl border border-white/5 scrollbar-thin">
              {simMessages.map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-md ${
                    m.sender === "user" 
                      ? "bg-[#005c4b] text-white rounded-tr-none" 
                      : "bg-[#202c33] text-gray-100 rounded-tl-none border border-white/5"
                  }`}>
                    <span className="text-[9px] font-bold block mb-1 text-gray-400 uppercase">
                      {m.sender === "user" ? "Você (Cliente)" : "Assistente Dumar"}
                    </span>
                    <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              ))}

              {simLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#202c33] text-gray-400 rounded-2xl rounded-tl-none p-3 text-xs flex items-center gap-2 border border-white/5">
                    <RefreshCw size={14} className="animate-spin text-amber-400" />
                    <span>Digitando resposta...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input do Simulador */}
            <form onSubmit={handleSendSimMessage} className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={simInput}
                onChange={e => setSimInput(e.target.value)}
                placeholder="Ex: Gostaria de saber o valor de uma cozinha sob medida..."
                className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={simLoading || !simInput.trim()}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold p-2.5 rounded-xl transition-all cursor-pointer flex-shrink-0"
                title="Enviar mensagem de teste"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: MENSAGEM AUTOMÁTICA DE ENTRADA & BOAS-VINDAS */}
      {/* ========================================================================= */}
      {activeTab === "welcome" && (
        <div className="max-w-4xl space-y-6">
          <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Zap size={16} className="text-amber-400" />
              Mensagem Automática de Entrada (Primeiro Contato)
            </h3>
            <p className="text-xs text-gray-400">
              Disparada imediatamente quando um novo cliente envia a primeira mensagem no WhatsApp.
            </p>

            {/* Badges para Inserir na Mensagem de Boas-Vindas */}
            <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-gray-400 block">Clique para Inserir Variável Dinâmica:</span>
              <div className="flex flex-wrap gap-2">
                {VARIABLE_BADGES.map((b, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => insertVariable(b.tag, "welcome")}
                    className="bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-gray-300 hover:text-amber-300 px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <b.icon size={12} className="text-amber-400" />
                    <span>+ Inserir {b.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            <textarea
              ref={welcomeTextareaRef}
              rows={4}
              value={config.welcomeMessage}
              onChange={e => setConfig(prev => ({ ...prev, welcomeMessage: e.target.value }))}
              className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400 font-mono leading-relaxed"
            />

            {/* Hand-off Inteligente */}
            <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.handoffEnabled}
                  onChange={e => setConfig(prev => ({ ...prev, handoffEnabled: e.target.checked }))}
                  className="mt-0.5 rounded border-white/20 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-white block">Hand-off Automático (Pausa da IA com Atendente Humano)</span>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Quando um atendente humano responder ao cliente no chat, a IA pausa automaticamente para não interromper a conversa. Digite <code className="text-amber-400 bg-black px-1 rounded font-bold">#ia</code> no chat para religar.
                  </p>
                </div>
              </label>
            </div>

            {/* Delay de Digitação */}
            <div className="flex items-center gap-4">
              <div className="w-48">
                <label className="text-xs font-bold text-gray-300 block mb-1">Delay de Digitação (Segundos):</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={config.typingDelay}
                  onChange={e => setConfig(prev => ({ ...prev, typingDelay: Number(e.target.value) }))}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-5">
                Simula o tempo em que uma pessoa real estaria digitando a mensagem no WhatsApp.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={loadingConfig}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs py-2.5 px-5 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-amber-500/20"
            >
              <Save size={15} />
              {loadingConfig ? "Salvando..." : "Salvar Mensagem de Boas-Vindas"}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: TEMPLATES RÁPIDOS DE MENSAGENS (1 CLIQUE NO CHAT) */}
      {/* ========================================================================= */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Formulário Novo Template */}
          <div className="lg:col-span-5 bg-[#121212] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Plus size={15} className="text-amber-400" />
              Criar Novo Template Rápido
            </h3>

            <form onSubmit={handleAddTemplate} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-400 block mb-1">Título do Atalho:</label>
                <input
                  type="text"
                  placeholder="Ex: Apresentação de Projeto 3D"
                  value={templateTitle}
                  onChange={e => setTemplateTitle(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 block mb-1">Categoria:</label>
                <select
                  value={templateCategory}
                  onChange={e => setTemplateCategory(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="Proposta">Proposta & Orçamento</option>
                  <option value="Medição">Medição Técnica</option>
                  <option value="Contrato">Contrato & Financeiro</option>
                  <option value="Pós-Venda">Pós-Venda</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 block mb-1">Conteúdo da Mensagem:</label>
                <textarea
                  rows={4}
                  placeholder="Olá! Seu projeto 3D já está pronto para visualização..."
                  value={templateContent}
                  onChange={e => setTemplateContent(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={savingTemplate}
                className="w-full bg-white hover:bg-gray-200 text-black font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow flex items-center justify-center gap-2"
              >
                <Save size={14} />
                {savingTemplate ? "Salvando Template..." : "Adicionar aos Atalhos Rápidos"}
              </button>
            </form>
          </div>

          {/* Lista de Templates Cadastrados */}
          <div className="lg:col-span-7 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Biblioteca de Templates Ativos ({templates.length})
            </h3>

            {templates.length === 0 ? (
              <div className="p-8 bg-black/30 border border-white/5 rounded-2xl text-center space-y-2">
                <p className="text-xs text-gray-400">Nenhum template cadastrado ainda.</p>
                <p className="text-[11px] text-gray-500">Crie modelos como "Apresentação 3D" ou "Agendamento" para enviar com 1 clique.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {templates.map(t => (
                  <div key={t.id} className="p-4 bg-[#121212] border border-white/10 rounded-xl flex items-start justify-between gap-3 group shadow">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{t.title}</span>
                        <span className="text-[9px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase">
                          {t.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed font-mono whitespace-pre-wrap">{t.content}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(t.id)}
                      className="text-gray-600 hover:text-red-400 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Excluir Template"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
