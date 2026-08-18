import React, { useState, useEffect, useMemo } from "react";
import { 
  Calendar as CalendarIcon, Clock, MapPin, CheckSquare, Plus, Trash2, 
  ChevronLeft, ChevronRight, User, FileText, CheckCircle2, Tag, StickyNote,
  Edit3, Search, Filter, Phone, MessageSquare, AlertCircle, Sparkles,
  CalendarDays, ListFilter, AlertTriangle, ExternalLink, X, Navigation, Car,
  ChevronDown, Video, Users, AlignLeft, Check
} from "lucide-react";
import { Lead } from "./types";
import CRMConfirmModal from "./crm-confirm-modal";

interface CRMAgendaProps {
  leads: Lead[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // Hora Início (ex: "17:30")
  endTime?: string; // Hora Término (ex: "18:30")
  duration?: string; // Duração em minutos ou "dia_todo" (ex: "30", "60", "90", "120", "180", "240", "dia_todo", "custom")
  type: "evento" | "tarefa" | "nota";
  priority: "alta" | "media" | "baixa";
  leadId?: string;
  notes?: string;
  location?: string;
  completed?: boolean;
}

// Presets de Duração configuráveis para Marcenaria de Alto Padrão
const DURATION_PRESETS = [
  { value: "30", label: "30 min", desc: "Contato Rápido / Dúvidas", icon: "💬" },
  { value: "45", label: "45 min", desc: "Briefing / Alinhamento", icon: "📐" },
  { value: "60", label: "1 hora", desc: "Apresentação Projeto 3D (Escritório)", icon: "💎", isDefault: true },
  { value: "90", label: "1h 30m", desc: "Medição Técnica Local", icon: "📏" },
  { value: "120", label: "2 horas", desc: "Medição em Outra Cidade / Regional", icon: "🚗" },
  { value: "180", label: "3 horas", desc: "Medição Casa Toda / Obra Completa", icon: "🏠" },
  { value: "240", label: "4 horas", desc: "Visita Técnica + Deslocamento", icon: "🏗️" },
];

// Estrutura de Dias da Semana no Brasil: Segunda a Domingo
const DAYS_HEADER = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Helper para obter a data YYYY-MM-DD exatamente no fuso de São Paulo
const getSaoPauloDateStr = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const y = parts.find(p => p.type === "year")?.value;
  const m = parts.find(p => p.type === "month")?.value;
  const d = parts.find(p => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
};

// Formatar data no padrão oficial brasileiro: "17/08/2026"
export const formatPtBrDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  }
  return dateStr;
};

// Formatar data por extenso: "segunda-feira, 17/08/2026"
const formatExtensiveDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return dateStr;
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(dt);
  return `${weekday}, ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
};

// Helper para somar minutos a um horário HH:MM
const calculateEndTime = (startTime: string, durationMinutes: string): string => {
  if (!startTime || durationMinutes === "dia_todo" || durationMinutes === "custom") return "";
  const [hStr, mStr] = startTime.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const addMins = parseInt(durationMinutes, 10);
  if (isNaN(h) || isNaN(m) || isNaN(addMins)) return "";
  const totalMins = h * 60 + m + addMins;
  const endH = Math.floor(totalMins / 60) % 24;
  const endM = totalMins % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
};

// Helper para formatar rótulo de período com início e término
const formatPeriodLabel = (time?: string, endTime?: string, duration?: string): string => {
  if (!time) return "Sem horário";
  if (duration === "dia_todo") return "Dia inteiro";
  if (endTime && endTime !== time) {
    const durPreset = DURATION_PRESETS.find(p => p.value === duration);
    const durText = durPreset ? ` (${durPreset.label})` : "";
    return `${time} às ${endTime}${durText}`;
  }
  return `${time}`;
};

export default function CRMAgenda({ leads }: CRMAgendaProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dbEvents, setDbEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros e Busca
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"todos" | "evento" | "tarefa" | "nota">("todos");
  const [priorityFilter, setPriorityFilter] = useState<"todas" | "alta" | "media" | "baixa">("todas");
  const [statusFilter, setStatusFilter] = useState<"todos" | "pendentes" | "concluidos">("todos");
  const [activeView, setActiveView] = useState<"calendario" | "lista">("calendario");

  // Modal de Detalhes / Visualização de Evento
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);

  // Modal de Criação / Edição de Evento Estilo Google Calendar
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(getSaoPauloDateStr());
  const [eventEndDate, setEventEndDate] = useState(getSaoPauloDateStr());
  const [isAllDay, setIsAllDay] = useState(false);
  const [eventTime, setEventTime] = useState("17:30");
  const [eventEndTime, setEventEndTime] = useState("18:30");
  const [eventDuration, setEventDuration] = useState("60");
  const [showDurationOptions, setShowDurationOptions] = useState(false);
  const [eventType, setEventType] = useState<"evento" | "tarefa" | "nota">("evento");
  const [eventPriority, setEventPriority] = useState<"alta" | "media" | "baixa">("media");
  const [eventLeadId, setEventLeadId] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventNotes, setEventNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Modal de Confirmação de Exclusão
  const [deletingEvent, setDeletingEvent] = useState<CalendarEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Carregar eventos do Banco PostgreSQL
  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/calendar-events");
      if (res.ok) {
        const data = await res.json();
        setDbEvents(data.map((item: any) => ({
          ...item,
          id: String(item.id),
          leadId: item.leadId ? String(item.leadId) : undefined
        })));
      }
    } catch (err) {
      console.error("Erro ao carregar eventos do banco:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Sincronizar Horário de Término ao Mudar Hora Inicial ou Duração
  const handleTimeOrDurationChange = (newTime: string, newDuration: string) => {
    setEventTime(newTime);
    setEventDuration(newDuration);
    if (newDuration !== "dia_todo" && newDuration !== "custom") {
      const calculated = calculateEndTime(newTime, newDuration);
      if (calculated) setEventEndTime(calculated);
    }
  };

  // Combinar Eventos Manuais + Medições Agendadas dos Leads
  const scheduledLeadEvents: CalendarEvent[] = useMemo(() => {
    return leads
      .filter(l => (l.stage === "briefing" || l.stage === "apresentacao") && l.checklist?.dataAgendamento)
      .map(l => {
        const rawDate = typeof l.checklist?.dataAgendamento === "string" ? l.checklist.dataAgendamento : "";
        const dateMatch = rawDate ? (rawDate.match(/\d{4}-\d{2}-\d{2}/) || rawDate.match(/\d{2}\/\d{2}\/\d{4}/)) : null;
        let isoDate = getSaoPauloDateStr();
        if (dateMatch) {
          if (dateMatch[0].includes("/")) {
            const [d, m, y] = dateMatch[0].split("/");
            isoDate = `${y}-${m}-${d}`;
          } else {
            isoDate = dateMatch[0];
          }
        }

        const timeMatch = rawDate ? rawDate.match(/\b(\d{1,2}:\d{2})\b/) : null;
        const eventTime = timeMatch ? timeMatch[1] : "14:00";
        const enderecoObraStr = String((typeof l.checklist === "object" && l.checklist?.enderecoObra) || "").toLowerCase();
        const isOutraCidade = enderecoObraStr.includes("criciúma") || 
                              enderecoObraStr.includes("tubarão") ||
                              enderecoObraStr.includes("araranguá");
        const defaultDur = isOutraCidade ? "120" : "60";
        const defaultEnd = calculateEndTime(eventTime, defaultDur);

        const enderecoText = (typeof l.checklist === "object" && l.checklist && l.checklist.enderecoObra) ? String(l.checklist.enderecoObra) : "";
        const roomsText = Array.isArray(l.rooms) ? l.rooms.join(", ") : String(l.rooms || "");

        return {
          id: `lead-${l.id}`,
          title: `Visita / Medição: ${l.name}`,
          date: isoDate,
          time: eventTime,
          endTime: defaultEnd,
          duration: defaultDur,
          type: "evento" as const,
          priority: "alta" as const,
          leadId: String(l.id),
          location: enderecoText || "Endereço da Obra do Cliente",
          notes: `Ambientes: ${roomsText}${enderecoText ? ` • Local: ${enderecoText}` : ""}`,
          completed: false
        };
      });
  }, [leads]);

  const allEvents = useMemo(() => {
    const list = [...dbEvents];
    for (const leadEv of scheduledLeadEvents) {
      if (!list.some(e => e.leadId === leadEv.leadId && e.date === leadEv.date)) {
        list.push(leadEv);
      }
    }
    return list;
  }, [dbEvents, scheduledLeadEvents]);

  // Detector de Conflitos de Horário em Tempo Real
  const timeConflict = useMemo(() => {
    if (!showEventModal || eventType === "nota" || isAllDay || !eventDate || !eventTime) {
      return null;
    }

    const startToMins = (t: string) => {
      if (!t) return 0;
      const [h, m] = t.split(":").map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const newStart = startToMins(eventTime);
    const newEnd = eventEndTime ? startToMins(eventEndTime) : newStart + (parseInt(eventDuration, 10) || 60);

    const sameDayEvents = allEvents.filter(e => 
      e.date === eventDate && 
      e.id !== editingEventId && 
      e.type !== "nota" && 
      !e.completed &&
      e.time
    );

    for (const ev of sameDayEvents) {
      if (!ev.time || ev.duration === "dia_todo") continue;
      const evStart = startToMins(ev.time);
      const evEnd = ev.endTime ? startToMins(ev.endTime) : evStart + (parseInt(ev.duration || "60", 10) || 60);

      // Checa sobreposição: (novo_inicio < evento_fim) E (novo_fim > evento_inicio)
      if (newStart < evEnd && newEnd > evStart) {
        const suggH = Math.floor((evEnd + 15) / 60) % 24;
        const suggM = (evEnd + 15) % 60;
        const suggestedTime = `${String(suggH).padStart(2, "0")}:${String(suggM).padStart(2, "0")}`;
        return {
          conflictingEvent: ev,
          suggestedStart: suggestedTime
        };
      }
    }

    return null;
  }, [showEventModal, eventType, isAllDay, eventDuration, eventDate, eventTime, eventEndTime, allEvents, editingEventId]);

  // Filtragem Dinâmica de Eventos
  const filteredEvents = useMemo(() => {
    return allEvents.filter(ev => {
      if (typeFilter !== "todos" && ev.type !== typeFilter) return false;
      if (priorityFilter !== "todas" && ev.priority !== priorityFilter) return false;
      if (statusFilter === "pendentes" && ev.completed) return false;
      if (statusFilter === "concluidos" && !ev.completed) return false;
      if (searchTerm.trim().length > 0) {
        const query = searchTerm.toLowerCase();
        const leadMatch = leads.find(l => String(l.id) === ev.leadId);
        const matchesTitle = ev.title.toLowerCase().includes(query);
        const matchesNotes = (ev.notes || "").toLowerCase().includes(query);
        const matchesLead = leadMatch ? (leadMatch.name.toLowerCase().includes(query) || leadMatch.phone.includes(query)) : false;
        if (!matchesTitle && !matchesNotes && !matchesLead) return false;
      }
      return true;
    });
  }, [allEvents, typeFilter, priorityFilter, statusFilter, searchTerm, leads]);

  // Calendário Mensal
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const firstDayOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Abrir Modal para Criar Novo Evento
  const openCreateModal = (dateStr: string = getSaoPauloDateStr()) => {
    setEditingEventId(null);
    setEventDate(dateStr);
    setEventEndDate(dateStr);
    setIsAllDay(false);
    setEventTime("17:30");
    setEventDuration("60");
    setEventEndTime("18:30");
    setShowDurationOptions(false);
    setEventTitle("");
    setEventType("evento");
    setEventPriority("media");
    setEventLeadId("");
    setEventLocation("Escritório Comercial Dumar (Av. Santa Catarina, 551)");
    setEventNotes("");
    setShowEventModal(true);
  };

  // Abrir Modal para Editar Evento
  const openEditModal = (ev: CalendarEvent) => {
    setViewingEvent(null);
    const evIsAllDay = ev.duration === "dia_todo" || (!ev.time && ev.type !== "nota");
    setIsAllDay(evIsAllDay);
    setEventDate(ev.date);
    setEventEndDate(ev.date);
    setEventTitle(ev.title);
    setEventTime(ev.time || "17:30");
    setEventDuration(ev.duration || "60");
    setEventEndTime(ev.endTime || calculateEndTime(ev.time || "17:30", ev.duration || "60"));
    setShowDurationOptions(false);
    setEventType(ev.type);
    setEventPriority(ev.priority);
    setEventLeadId(ev.leadId || "");
    setEventLocation(ev.location || "");
    setEventNotes(ev.notes || "");

    if (ev.id.startsWith("lead-")) {
      setEditingEventId(null);
    } else {
      setEditingEventId(ev.id);
    }
    setShowEventModal(true);
  };

  // Salvar Evento
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    setSaving(true);
    try {
      const finalDuration = isAllDay ? "dia_todo" : eventDuration;
      const payload = {
        title: eventTitle.trim(),
        date: eventDate,
        time: (isAllDay || eventType === "nota") ? "" : eventTime,
        endTime: (isAllDay || eventType === "nota") ? "" : eventEndTime,
        duration: finalDuration,
        type: eventType,
        priority: eventPriority,
        leadId: eventLeadId ? Number(eventLeadId) : undefined,
        notes: eventNotes.trim() || (eventLocation ? `Local: ${eventLocation}` : ""),
        completed: false
      };

      if (editingEventId) {
        const res = await fetch(`/api/calendar-events/${editingEventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          await fetchEvents();
          setShowEventModal(false);
        }
      } else {
        const res = await fetch("/api/calendar-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          await fetchEvents();
          setShowEventModal(false);
        }
      }
    } catch (err) {
      console.error("Erro ao salvar evento:", err);
    } finally {
      setSaving(false);
    }
  };

  // Concluir ou Reabrir
  const toggleEventCompleted = async (ev: CalendarEvent) => {
    if (ev.id.startsWith("lead-")) {
      const realLeadId = ev.id.replace("lead-", "");
      const targetLead = leads.find(l => String(l.id) === String(realLeadId));
      if (!targetLead) return;
      const curCheck = typeof targetLead.checklist === "string" ? JSON.parse(targetLead.checklist || "{}") : (targetLead.checklist || {});
      try {
        await fetch(`/api/leads/${realLeadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checklist: JSON.stringify({ ...curCheck, briefing: !ev.completed, medicao: !ev.completed })
          })
        });
        await fetchEvents();
      } catch (e) {}
      return;
    }

    try {
      const res = await fetch(`/api/calendar-events/${ev.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !ev.completed })
      });
      if (res.ok) {
        setDbEvents(prev => prev.map(item => item.id === ev.id ? { ...item, completed: !ev.completed } : item));
        if (viewingEvent && viewingEvent.id === ev.id) {
          setViewingEvent(prev => prev ? { ...prev, completed: !prev.completed } : null);
        }
      }
    } catch (err) {
      console.error("Erro ao alternar status do evento:", err);
    }
  };

  // Excluir Evento
  const confirmDeleteEvent = async () => {
    if (!deletingEvent) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/calendar-events/${deletingEvent.id}`, { method: "DELETE" });
      if (res.ok) {
        setDbEvents(prev => prev.filter(e => e.id !== deletingEvent.id));
        setDeletingEvent(null);
        setViewingEvent(null);
      }
    } catch (err) {
      console.error("Erro ao excluir evento:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "alta": return "bg-red-500/10 text-red-400 border-red-500/30";
      case "media": return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      default: return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    }
  };

  const getTypeBadge = (t: string) => {
    switch (t) {
      case "evento": return "bg-blue-500/15 text-blue-300 border-blue-500/30";
      case "tarefa": return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
      case "nota": return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      default: return "bg-gray-500/15 text-gray-300 border-gray-500/30";
    }
  };

  const getTypeIcon = (t: string) => {
    switch (t) {
      case "evento": return <CalendarIcon size={12} className="text-blue-400" />;
      case "tarefa": return <CheckSquare size={12} className="text-emerald-400" />;
      case "nota": return <StickyNote size={12} className="text-amber-400" />;
      default: return <Clock size={12} />;
    }
  };

  // Grade do Calendário
  const calendarCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i < firstDayOffset; i++) {
      cells.push({ day: null, dateStr: null, isCurrentMonth: false });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(month + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      cells.push({ day, dateStr, isCurrentMonth: true });
    }
    return cells;
  }, [firstDayOffset, daysInMonth, year, month]);

  const todayStr = getSaoPauloDateStr();

  return (
    <div className="space-y-6 animate-fade-in text-gray-200">
      {/* Header Superior & Filtros Rápidos */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#0f0f0f] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <CalendarDays size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
              Agenda Comercial & Medições
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Agenda Dumar
              </span>
            </h2>
            <p className="text-xs text-gray-400">Gestão de visitas técnicas, apresentações 3D no escritório e tarefas</p>
          </div>
        </div>

        {/* Controles de Visão e Novo Evento */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Alternador de Visão */}
          <div className="flex bg-black/60 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveView("calendario")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeView === "calendario" ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"
              }`}
            >
              <CalendarIcon size={13} />
              Calendário
            </button>
            <button
              onClick={() => setActiveView("lista")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeView === "lista" ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"
              }`}
            >
              <ListFilter size={13} />
              Lista
            </button>
          </div>

          <button
            onClick={() => openCreateModal()}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            Novo Compromisso
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-lg">
        {/* Campo de Busca */}
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, ambiente ou cidade..."
            className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Filtros Dropdown */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="todos">Todos os Tipos</option>
            <option value="evento">Reuniões / Visitas</option>
            <option value="tarefa">Tarefas</option>
            <option value="nota">Notas</option>
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as any)}
            className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="todas">Todas as Prioridades</option>
            <option value="alta">🚨 Alta (VIP 💎)</option>
            <option value="media">⚡ Média</option>
            <option value="baixa">☕ Baixa</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="todos">Todos os Status</option>
            <option value="pendentes">Pendentes</option>
            <option value="concluidos">Concluídos</option>
          </select>
        </div>
      </div>

      {/* VISÃO CALENDÁRIO */}
      {activeView === "calendario" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CALENDÁRIO MENSAL (Grade 7 Colunas) */}
          <div className="lg:col-span-8 bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col">
            {/* Navegação do Mês */}
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer border border-white/5"
                  title="Mês Anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer border border-white/5"
                  title="Próximo Mês"
                >
                  <ChevronRight size={16} />
                </button>
                <h3 className="text-base font-bold text-white capitalize pl-2">
                  {MONTH_NAMES[month]} <span className="text-amber-400 font-mono">{year}</span>
                </h3>
              </div>

              <button
                onClick={goToToday}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10 cursor-pointer"
              >
                Hoje
              </button>
            </div>

            {/* Cabeçalho dos Dias (Seg - Dom) */}
            <div className="grid grid-cols-7 gap-1 mb-2 text-center">
              {DAYS_HEADER.map(dayName => (
                <div key={dayName} className="text-[11px] font-bold uppercase tracking-wider text-gray-400 py-1">
                  {dayName}
                </div>
              ))}
            </div>

            {/* Grade de Dias */}
            <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-[380px]">
              {calendarCells.map((cell, idx) => {
                if (!cell.isCurrentMonth || !cell.dateStr) {
                  return (
                    <div 
                      key={`empty-${idx}`} 
                      className="bg-black/20 border border-white/5 rounded-xl p-1.5 min-h-[75px] opacity-30 cursor-default"
                    />
                  );
                }

                const dayEvents = filteredEvents.filter(e => e.date === cell.dateStr);
                const isToday = cell.dateStr === todayStr;

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => openCreateModal(cell.dateStr!)}
                    className={`border rounded-xl p-1.5 min-h-[75px] flex flex-col justify-between transition-all group cursor-pointer hover:border-amber-400/50 hover:bg-white/5 ${
                      isToday 
                        ? "bg-amber-500/5 border-amber-500/40 shadow-inner" 
                        : "bg-black/40 border-white/5"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        isToday ? "bg-amber-500 text-black shadow" : "text-gray-300 group-hover:text-white"
                      }`}>
                        {cell.day}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Lista dos Eventos no Dia */}
                    <div className="space-y-1 overflow-y-auto max-h-[70px] scrollbar-none">
                      {dayEvents.map(ev => (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingEvent(ev);
                          }}
                          className={`text-[9px] px-1.5 py-0.5 rounded font-medium flex items-center justify-between border truncate transition-all hover:scale-[1.02] cursor-pointer ${
                            ev.completed 
                              ? "line-through opacity-40 bg-black/40 border-transparent text-gray-500" 
                              : getTypeBadge(ev.type)
                          }`}
                          title={`${formatPeriodLabel(ev.time, ev.endTime, ev.duration)} • ${ev.title}`}
                        >
                          <span className="truncate flex items-center gap-1">
                            {ev.priority === "alta" && <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />}
                            {ev.time ? `${ev.time} ${ev.title}` : ev.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LADO DIREITO: Painel de Próximos Compromissos */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 flex flex-col flex-1 shadow-xl">
              <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">Próximos Compromissos</h3>
                </div>
                <span className="text-[10px] font-bold bg-white/10 text-gray-300 px-2 py-0.5 rounded border border-white/10">
                  {filteredEvents.length} Itens
                </span>
              </div>

              {/* Lista dos Eventos */}
              <div className="space-y-2.5 flex-1 overflow-y-auto scrollbar-thin pr-1 max-h-[540px]">
                {filteredEvents.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-xs">
                    Nenhum compromisso encontrado para este filtro.
                  </div>
                ) : (
                  filteredEvents.map(ev => {
                    const linkedLead = leads.find(l => String(l.id) === ev.leadId);
                    return (
                      <div
                        key={ev.id}
                        onClick={() => setViewingEvent(ev)}
                        className={`p-3.5 border rounded-xl flex flex-col gap-2.5 transition-all cursor-pointer hover:border-amber-400/40 hover:bg-white/10 ${
                          ev.completed
                            ? "bg-black/30 border-white/5 opacity-50"
                            : "bg-white/5 border-white/10 shadow-md"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 overflow-hidden">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleEventCompleted(ev);
                              }}
                              className="cursor-pointer text-gray-400 hover:text-emerald-400 transition-colors flex-shrink-0 mt-0.5"
                              title={ev.completed ? "Reabrir compromisso" : "Concluir compromisso"}
                            >
                              {ev.completed ? (
                                <CheckCircle2 size={16} className="text-emerald-400 fill-emerald-400/20" />
                              ) : (
                                <div className="w-4 h-4 rounded border border-white/40 hover:border-emerald-400" />
                              )}
                            </button>

                            <div>
                              <h4 className={`text-xs font-bold truncate ${
                                ev.completed ? "line-through text-gray-500" : "text-white"
                              }`}>
                                {ev.title}
                              </h4>

                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase flex items-center gap-1 ${getTypeBadge(ev.type)}`}>
                                  {getTypeIcon(ev.type)}
                                  {ev.type}
                                </span>

                                <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase ${getPriorityBadge(ev.priority)}`}>
                                  {ev.priority}
                                </span>

                                <span className="text-[10px] text-amber-300 font-mono flex items-center gap-1">
                                  <Clock size={10} />
                                  {formatPtBrDate(ev.date)} • {formatPeriodLabel(ev.time, ev.endTime, ev.duration)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(ev);
                              }}
                              className="text-gray-400 hover:text-amber-400 transition-colors p-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
                              title="Editar Compromisso"
                            >
                              <Edit3 size={13} />
                            </button>
                          </div>
                        </div>

                        {linkedLead && (
                          <div className="bg-black/40 p-2 rounded-lg border border-white/5 text-[11px] text-gray-300 flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1 text-white">
                              <User size={12} className="text-amber-400" />
                              {linkedLead.name}
                            </span>
                            {linkedLead.phone && (
                              <span className="text-gray-400 font-mono text-[10px]">{linkedLead.phone}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISÃO LISTA / LINHA DO TEMPO */}
      {activeView === "lista" && (
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ListFilter size={16} className="text-amber-400" />
              Lista Completa de Compromissos ({filteredEvents.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map(ev => {
              const linkedLead = leads.find(l => String(l.id) === ev.leadId);
              return (
                <div
                  key={ev.id}
                  onClick={() => setViewingEvent(ev)}
                  className={`p-4 border rounded-2xl flex flex-col justify-between gap-3 transition-all cursor-pointer hover:border-amber-400/40 hover:bg-white/10 ${
                    ev.completed ? "bg-black/30 border-white/5 opacity-50" : "bg-white/5 border-white/10 shadow-lg"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${getTypeBadge(ev.type)}`}>
                        {getTypeIcon(ev.type)}
                        {ev.type}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-bold ${getPriorityBadge(ev.priority)}`}>
                        {ev.priority}
                      </span>
                    </div>

                    <h4 className={`text-sm font-bold ${ev.completed ? "line-through text-gray-500" : "text-white"}`}>
                      {ev.title}
                    </h4>

                    <div className="text-xs text-amber-300 font-mono font-medium flex items-center gap-1.5">
                      <Clock size={12} />
                      {formatPtBrDate(ev.date)} • {formatPeriodLabel(ev.time, ev.endTime, ev.duration)}
                    </div>

                    {linkedLead && (
                      <div className="bg-black/40 p-2 rounded-lg border border-white/5 text-[11px] text-gray-300 flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5">
                          <User size={12} className="text-amber-400" />
                          {linkedLead.name}
                        </span>
                        {linkedLead.phone && (
                          <span className="text-gray-400 font-mono text-[10px]">{linkedLead.phone}</span>
                        )}
                      </div>
                    )}

                    {ev.notes && (
                      <p className="text-[11px] text-gray-400 bg-black/40 p-2.5 rounded-lg border border-white/5 italic">
                        "{ev.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleEventCompleted(ev);
                      }}
                      className="text-gray-400 hover:text-emerald-400 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <CheckCircle2 size={14} className={ev.completed ? "text-emerald-400" : ""} />
                      {ev.completed ? "Concluído" : "Marcar Concluído"}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(ev);
                        }}
                        className="text-gray-400 hover:text-amber-300 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors font-bold cursor-pointer"
                      >
                        Editar
                      </button>

                      {!ev.id.startsWith("lead-") && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingEvent(ev);
                          }}
                          className="text-gray-400 hover:text-red-400 p-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                          title="Excluir"
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
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO DE DETALHES DO EVENTO */}
      {viewingEvent && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#12141a] border border-white/15 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-scale-in text-left">
            {/* Header do Modal */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${
                  viewingEvent.type === "evento" ? "bg-blue-500/10 text-blue-400 border-blue-500/30" :
                  viewingEvent.type === "tarefa" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                  "bg-amber-500/10 text-amber-400 border-amber-500/30"
                }`}>
                  {getTypeIcon(viewingEvent.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase ${getTypeBadge(viewingEvent.type)}`}>
                      {viewingEvent.type}
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-bold ${getPriorityBadge(viewingEvent.priority)}`}>
                      {viewingEvent.priority}
                    </span>
                    {viewingEvent.completed && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-bold flex items-center gap-1">
                        <CheckCircle2 size={10} /> Concluído
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{viewingEvent.title}</h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingEvent(null)}
                className="text-gray-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Informações de Horário & Período */}
            <div className="bg-black/50 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-medium flex items-center gap-2">
                  <CalendarIcon size={14} className="text-blue-400" />
                  Data:
                </span>
                <span className="text-white font-bold">{formatExtensiveDate(viewingEvent.date)}</span>
              </div>

              {viewingEvent.time && (
                <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2.5">
                  <span className="text-gray-400 font-medium flex items-center gap-2">
                    <Clock size={14} className="text-blue-400" />
                    Horário & Duração:
                  </span>
                  <span className="text-amber-300 font-bold font-mono">
                    {formatPeriodLabel(viewingEvent.time, viewingEvent.endTime, viewingEvent.duration)}
                  </span>
                </div>
              )}

              {viewingEvent.location && (
                <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2.5">
                  <span className="text-gray-400 font-medium flex items-center gap-2">
                    <MapPin size={14} className="text-red-400" />
                    Local:
                  </span>
                  <span className="text-gray-200 font-medium">{viewingEvent.location}</span>
                </div>
              )}
            </div>

            {/* Cliente Vinculado */}
            {(() => {
              const linkedLead = leads.find(l => String(l.id) === viewingEvent.leadId);
              if (!linkedLead) return null;
              const cleanPhone = (linkedLead.phone || "").replace(/\D/g, "");

              return (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User size={13} className="text-amber-400" />
                      Cliente Vinculado
                    </span>
                    <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded border border-white/10">
                      {linkedLead.stage}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <div>
                      <h4 className="text-sm font-bold text-white">{linkedLead.name}</h4>
                      <p className="text-xs text-gray-400 font-mono">{linkedLead.phone}</p>
                    </div>

                    {cleanPhone && (
                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-green-600/20"
                      >
                        <MessageSquare size={13} />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Notas e Detalhes da Obra */}
            {viewingEvent.notes && (
              <div>
                <label className="block text-gray-400 font-bold mb-1.5 uppercase text-[10px] tracking-wider">
                  Notas / Detalhes de Marcenaria
                </label>
                <div className="bg-black/60 border border-white/10 rounded-2xl p-3.5 text-xs text-gray-300 leading-relaxed italic">
                  "{viewingEvent.notes}"
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => toggleEventCompleted(viewingEvent)}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${
                  viewingEvent.completed 
                    ? "bg-white/10 hover:bg-white/20 text-gray-300" 
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                }`}
              >
                <CheckCircle2 size={15} />
                {viewingEvent.completed ? "Reabrir Compromisso" : "Concluir Compromisso"}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(viewingEvent)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  <Edit3 size={14} />
                  Editar
                </button>

                {!viewingEvent.id.startsWith("lead-") && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeletingEvent(viewingEvent);
                      setViewingEvent(null);
                    }}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold p-2 rounded-xl transition-colors cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO NO ESTILO GOOGLE CALENDAR (LARGO COM GRIDS) */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[250] flex items-center justify-center p-3 sm:p-5 animate-fade-in overflow-y-auto">
          <div className="bg-[#1a1b1e] border border-white/15 rounded-3xl w-full max-w-4xl shadow-2xl animate-scale-in text-left overflow-hidden my-4 sm:my-8 flex flex-col max-h-[90vh]">
            {/* Header: Botão Fechar à Esquerda + Título/Status + Botão Salvar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-2">
                  <CalendarIcon size={16} className="text-blue-400" />
                  {editingEventId ? "Editar Compromisso" : "Novo Compromisso na Agenda"}
                </h3>
              </div>
              
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="text-xs font-semibold text-gray-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer hidden sm:block"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEvent}
                  disabled={saving || !eventTitle.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-extrabold px-6 py-2 rounded-full transition-all shadow-lg shadow-blue-600/30 cursor-pointer flex items-center gap-1.5"
                >
                  {saving ? "Salvando..." : "Salvar Compromisso"}
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveEvent} className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
              {/* Título Superior Largo */}
              <div>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  placeholder="Adicionar título do compromisso (ex: Apresentação Projeto 3D)"
                  required
                  className="w-full bg-transparent border-b border-white/15 pb-2.5 text-xl sm:text-2xl font-medium text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  autoFocus
                />
              </div>

              {/* Pills de Tipo: Evento / Tarefa / Anotação */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEventType("evento")}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    eventType === "evento"
                      ? "bg-blue-600/30 text-blue-300 border border-blue-500/50 shadow"
                      : "bg-white/5 text-gray-400 hover:text-gray-200 border border-white/5"
                  }`}
                >
                  Reunião / Visita
                </button>
                <button
                  type="button"
                  onClick={() => setEventType("tarefa")}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    eventType === "tarefa"
                      ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow"
                      : "bg-white/5 text-gray-400 hover:text-gray-200 border border-white/5"
                  }`}
                >
                  Tarefa
                </button>
                <button
                  type="button"
                  onClick={() => setEventType("nota")}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    eventType === "nota"
                      ? "bg-amber-600/30 text-amber-300 border border-amber-500/50 shadow"
                      : "bg-white/5 text-gray-400 hover:text-gray-200 border border-white/5"
                  }`}
                >
                  Anotação / Lembrete
                </button>
              </div>

              {/* GRID PRINCIPAL DE 2 COLUNAS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                {/* COLUNA ESQUERDA: Data, Horários, Duração Rápida & Conflitos */}
                <div className="lg:col-span-7 space-y-4 bg-black/40 p-5 rounded-2xl border border-white/10">
                  {/* Linha: Ícone Relógio + Dia Inteiro + Switch */}
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <div className="flex items-center gap-3 text-sm text-gray-200 font-bold">
                      <Clock size={18} className="text-blue-400" />
                      <span>Dia inteiro</span>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isAllDay} 
                        onChange={e => setIsAllDay(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Grid de Início e Término */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Card Início */}
                    <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                          <CalendarDays size={12} />
                          Data de Início
                        </span>
                        {!isAllDay && eventType !== "nota" && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Horário
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2.5">
                        <div className="relative flex-1 bg-black/50 border border-white/10 hover:border-blue-500/40 transition-colors rounded-xl px-3 py-2 cursor-pointer">
                          <input
                            type="date"
                            value={eventDate}
                            onChange={e => {
                              setEventDate(e.target.value);
                              setEventEndDate(e.target.value);
                            }}
                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                          />
                          <span className="text-xs text-gray-200 hover:text-blue-400 font-semibold truncate block capitalize">
                            {formatExtensiveDate(eventDate)}
                          </span>
                        </div>

                        {!isAllDay && eventType !== "nota" && (
                          <input
                            type="time"
                            value={eventTime}
                            onChange={e => handleTimeOrDurationChange(e.target.value, eventDuration)}
                            className="bg-black/80 border border-blue-500/40 focus:border-blue-400 rounded-xl px-2.5 py-2 text-white font-mono text-xs font-bold focus:outline-none cursor-pointer text-center min-w-[78px] shadow-inner"
                          />
                        )}
                      </div>
                    </div>

                    {/* Card Término */}
                    {!isAllDay && eventType !== "nota" ? (
                      <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                            <CalendarDays size={12} />
                            Data de Término
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Horário
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2.5">
                          <div className="relative flex-1 bg-black/50 border border-white/10 hover:border-emerald-500/40 transition-colors rounded-xl px-3 py-2 cursor-pointer">
                            <input
                              type="date"
                              value={eventEndDate}
                              onChange={e => setEventEndDate(e.target.value)}
                              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                            />
                            <span className="text-xs text-gray-200 hover:text-emerald-400 font-semibold truncate block capitalize">
                              {formatExtensiveDate(eventEndDate)}
                            </span>
                          </div>

                          <input
                            type="time"
                            value={eventEndTime}
                            onChange={e => {
                              setEventEndTime(e.target.value);
                              setEventDuration("custom");
                            }}
                            className="bg-black/80 border border-emerald-500/40 focus:border-emerald-400 rounded-xl px-2.5 py-2 text-white font-mono text-xs font-bold focus:outline-none cursor-pointer text-center min-w-[78px] shadow-inner"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 flex items-center justify-center text-xs text-gray-400">
                        Compromisso para o dia todo
                      </div>
                    )}
                  </div>

                  {/* DURAÇÃO RÁPIDA (GRADE DE PRESETS) */}
                  {!isAllDay && eventType !== "nota" && (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        Duração Rápida (1 Clique)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {DURATION_PRESETS.map(preset => {
                          const isSelected = eventDuration === preset.value;
                          return (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() => handleTimeOrDurationChange(eventTime, preset.value)}
                              className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                                isSelected
                                  ? "bg-blue-600/30 border-blue-500 text-white shadow-md"
                                  : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              <div className="text-xs font-bold flex items-center gap-1.5">
                                <span>{preset.icon}</span> {preset.label}
                              </div>
                              <div className="text-[9px] text-gray-400 truncate mt-1">
                                {preset.desc}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ALERTA DE CONFLITO DE HORÁRIO EM TEMPO REAL */}
                  {timeConflict && (
                    <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-start gap-3 animate-fade-in">
                      <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="text-xs leading-relaxed">
                        <strong className="text-red-200 block font-bold">Atenção: Conflito de Horário!</strong>
                        Já existe <em>"{timeConflict.conflictingEvent.title}"</em> agendado das {timeConflict.conflictingEvent.time} às {timeConflict.conflictingEvent.endTime || "término"} neste dia.
                        <div className="mt-1.5">
                          👉 <button 
                            type="button" 
                            onClick={() => handleTimeOrDurationChange(timeConflict.suggestedStart, eventDuration)}
                            className="underline font-bold text-amber-300 hover:text-white cursor-pointer"
                          >
                            Clique aqui para ajustar para {timeConflict.suggestedStart}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* COLUNA DIREITA: Cliente Lead, Local, Prioridade & Notas */}
                <div className="lg:col-span-5 space-y-4 bg-white/[0.03] p-5 rounded-2xl border border-white/10">
                  {/* Seção Conta */}
                  <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                    <div className="w-8 h-8 rounded-full bg-black border border-white/15 flex items-center justify-center text-[10px] font-bold text-white tracking-tighter">
                      Dumar
                    </div>
                    <div>
                      <div className="text-xs text-gray-200 font-medium">dumarmoveisplanejados@gmail.com</div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Minha agenda (Dumar CRM)
                      </div>
                    </div>
                  </div>

                  {/* Vincular Cliente Lead */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      <Users size={13} className="text-amber-400" />
                      Cliente Vinculado (Lead)
                    </label>
                    <select
                      value={eventLeadId}
                      onChange={e => setEventLeadId(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="">Nenhum cliente selecionado</option>
                      {leads.map(l => (
                        <option key={l.id} value={l.id}>{l.name} {l.phone ? `(${l.phone})` : ""}</option>
                      ))}
                    </select>
                  </div>

                  {/* Prioridade */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Prioridade
                    </label>
                    <select
                      value={eventPriority}
                      onChange={e => setEventPriority(e.target.value as any)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="alta">🚨 Alta (VIP 💎)</option>
                      <option value="media">⚡ Média (Padrão)</option>
                      <option value="baixa">☕ Baixa</option>
                    </select>
                  </div>

                  {/* Local da Reunião / Obra */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      <MapPin size={13} className="text-red-400" />
                      Local do Compromisso
                    </label>
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={e => setEventLocation(e.target.value)}
                      placeholder="Ex: Escritório Comercial (Av. Santa Catarina, 551) ou Obra"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Notas e Observações Técnicas */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      <AlignLeft size={13} className="text-gray-400" />
                      Notas / Detalhes de Marcenaria
                    </label>
                    <textarea
                      value={eventNotes}
                      onChange={e => setEventNotes(e.target.value)}
                      placeholder="Anotações sobre projeto 3D, medição de cozinha, amostras de MDF..."
                      rows={3}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none scrollbar-thin"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação Segura de Exclusão */}
      <CRMConfirmModal
        isOpen={Boolean(deletingEvent)}
        title="Excluir Compromisso da Agenda?"
        description={`Tem certeza que deseja excluir "${deletingEvent?.title}" agendado para o dia ${deletingEvent?.date}? Esta ação removerá o registro do banco de dados.`}
        confirmText="Sim, Excluir Registro"
        cancelText="Cancelar"
        isDestructive={true}
        loading={isDeleting}
        onConfirm={confirmDeleteEvent}
        onClose={() => setDeletingEvent(null)}
      />
    </div>
  );
}
