import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, MapPin, CheckSquare, Plus, Trash2, ChevronLeft, ChevronRight, User, FileText, CheckCircle2, Tag, StickyNote } from "lucide-react";
import { Lead } from "./types";

interface CRMAgendaProps {
  leads: Lead[];
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  type: "evento" | "tarefa" | "nota";
  priority: "alta" | "media" | "baixa";
  leadId?: string;
  notes?: string;
  completed?: boolean;
}

// Estrutura de Dias da Semana no Brasil: Segunda a Domingo
const DAYS_HEADER = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Helper para obter a data YYYY-MM-DD exatamente no fuso de São Paulo (America/Sao_Paulo)
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

export default function CRMAgenda({ leads }: CRMAgendaProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dbEvents, setDbEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de Criação / Edição de Evento
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDayForNew, setSelectedDayForNew] = useState<string>("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(getSaoPauloDateStr());
  const [eventTime, setEventTime] = useState("10:00");
  const [eventType, setEventType] = useState<"evento" | "tarefa" | "nota">("evento");
  const [eventPriority, setEventPriority] = useState<"alta" | "media" | "baixa">("media");
  const [eventLeadId, setEventLeadId] = useState("");
  const [eventNotes, setEventNotes] = useState("");

  // Carregar eventos reais do Banco PostgreSQL
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

  // Combinar Eventos Manuais + Medições Agendadas dos Leads do Banco Real
  const scheduledLeadEvents: CalendarEvent[] = leads
    .filter(l => (l.stage === "briefing" || l.stage === "apresentacao") && l.checklist?.dataAgendamento)
    .map(l => {
      const rawDate = typeof l.checklist?.dataAgendamento === "string" ? l.checklist.dataAgendamento : "";
      // Tentar extrair data YYYY-MM-DD
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

      const enderecoText = (typeof l.checklist === "object" && l.checklist && l.checklist.enderecoObra) ? String(l.checklist.enderecoObra) : "Não informado";
      const roomsText = Array.isArray(l.rooms) ? l.rooms.join(", ") : String(l.rooms || "");

      return {
        id: `lead-${l.id}`,
        title: `Medição: ${l.name}`,
        date: isoDate,
        time: "Horário Agendado",
        type: "evento" as const,
        priority: "alta" as const,
        leadId: String(l.id),
        notes: `Ambientes: ${roomsText}. Endereço: ${enderecoText}`,
        completed: false
      };
    });

  const allEvents = [...dbEvents, ...scheduledLeadEvents];

  // Cálculos do Calendário Mensal (Segunda a Domingo)
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Dom, 1 = Seg, ...
  // Ajuste para Segunda = 0, Domingo = 6
  const firstDayOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const openModalForDate = (dateStr: string) => {
    setSelectedDayForNew(dateStr);
    setEventDate(dateStr);
    setEventTitle("");
    setEventNotes("");
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    try {
      const res = await fetch("/api/calendar-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventTitle.trim(),
          date: eventDate,
          time: eventType === "nota" ? "" : eventTime,
          type: eventType,
          priority: eventPriority,
          leadId: eventLeadId ? Number(eventLeadId) : undefined,
          notes: eventNotes.trim() || "",
          completed: false
        })
      });

      if (res.ok) {
        fetchEvents();
        setShowEventModal(false);
      } else {
        alert("Erro ao salvar no banco de dados.");
      }
    } catch (err) {
      console.error("Erro ao salvar evento:", err);
    }
  };

  const toggleEventCompleted = async (ev: CalendarEvent) => {
    if (ev.id.startsWith("lead-")) return; // Eventos automáticos de leads são alterados no card do lead
    try {
      const res = await fetch(`/api/calendar-events/${ev.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !ev.completed })
      });
      if (res.ok) fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteEvent = async (ev: CalendarEvent) => {
    if (ev.id.startsWith("lead-")) return;
    try {
      const res = await fetch(`/api/calendar-events/${ev.id}`, { method: "DELETE" });
      if (res.ok) fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeBadge = (type: "evento" | "tarefa" | "nota") => {
    if (type === "evento") return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    if (type === "tarefa") return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    return "bg-amber-500/20 text-amber-300 border-amber-500/30";
  };

  const getTypeIcon = (type: "evento" | "tarefa" | "nota") => {
    if (type === "evento") return <CalendarIcon size={12} />;
    if (type === "tarefa") return <CheckSquare size={12} />;
    return <StickyNote size={12} />;
  };

  // Gerar Células do Calendário no padrão brasileiro (Segunda a Domingo)
  const calendarCells = [];
  for (let i = 0; i < firstDayOffset; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const formattedDay = String(day).padStart(2, "0");
    const formattedMonth = String(month + 1).padStart(2, "0");
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    calendarCells.push({ day, dateStr });
  }

  const todayStr = getSaoPauloDateStr();

  return (
    <div className="flex-1 p-6 flex flex-col min-h-0 overflow-y-auto bg-black/40">
      {/* Header da Agenda Dumar */}
      <div className="mb-5 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-[#0f0f0f] border border-white/10 p-3.5 sm:p-4 rounded-2xl shadow-xl">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <CalendarIcon size={20} className="text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">Agenda Dumar</h2>
          </div>

          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-xs">
            <button type="button" onClick={prevMonth} className="p-1 hover:text-amber-400 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-white px-1 min-w-[100px] sm:min-w-[120px] text-center text-xs">
              {MONTH_NAMES[month]} {year}
            </span>
            <button type="button" onClick={nextMonth} className="p-1 hover:text-amber-400 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={goToToday}
            className="text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1 rounded-xl border border-amber-500/30 transition-colors cursor-pointer"
          >
            Hoje
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => openModalForDate(todayStr)}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
          >
            <Plus size={14} />
            Criar Evento / Tarefa / Nota
          </button>
        </div>
      </div>

      {/* Grid Principal: Lado Esquerdo (Agenda Grid) + Lado Direito (Painel Lateral de Tarefas e Notas) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">

        {/* LADO ESQUERDO: Grid do Mês no Padrão Brasileiro (Segunda a Domingo - 8 Colunas) */}
        <div className="lg:col-span-8 flex flex-col bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 shadow-xl">
          {/* Header dos Dias da Semana (Segunda a Domingo) */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-gray-400 border-b border-white/10 pb-3 mb-2">
            {DAYS_HEADER.map(d => (
              <div key={d} className="uppercase tracking-wider">{d}</div>
            ))}
          </div>

          {/* Grid de Dias */}
          <div className="grid grid-cols-7 gap-1 flex-1 auto-rows-fr">
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="bg-black/20 rounded-xl min-h-[90px] opacity-20" />;
              }

              const isToday = cell.dateStr === todayStr;
              const dayEvents = allEvents.filter(ev => ev.date === cell.dateStr);

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => openModalForDate(cell.dateStr)}
                  className={`border rounded-xl p-1.5 flex flex-col min-h-[90px] cursor-pointer transition-all hover:border-amber-400/50 group ${isToday ? "bg-amber-500/10 border-amber-500/40 shadow-inner" : "bg-white/5 border-white/5 hover:bg-white/10"
                    }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${isToday ? "bg-amber-500 text-black" : "text-gray-300"
                      }`}>
                      {cell.day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[9px] font-bold text-gray-500">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Indicadores de Eventos no Dia */}
                  <div className="space-y-1 overflow-y-auto max-h-[65px] scrollbar-none">
                    {dayEvents.map(ev => (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleEventCompleted(ev);
                        }}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-medium flex items-center justify-between border truncate ${ev.completed ? "line-through opacity-40 bg-black/40 border-transparent text-gray-500" : getTypeBadge(ev.type)
                          }`}
                        title={`${ev.time ? ev.time + " - " : ""}${ev.title}`}
                      >
                        <span className="truncate">{ev.time ? `${ev.time} ${ev.title}` : ev.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* LADO DIREITO: Lista de Tarefas, Eventos Próximos & Notas (4 Colunas) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 flex flex-col flex-1 shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare size={16} className="text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Tarefas & Notas</h3>
              </div>
              <span className="text-[10px] font-bold bg-white/10 text-gray-300 px-2 py-0.5 rounded border border-white/10">
                {allEvents.length} Registros
              </span>
            </div>

            {/* Lista dos Eventos da Agenda */}
            <div className="space-y-2.5 flex-1 overflow-y-auto scrollbar-thin pr-1 max-h-[500px]">
              {allEvents.map(ev => (
                <div
                  key={ev.id}
                  className={`p-3 border rounded-xl flex flex-col gap-2 transition-all ${ev.completed
                      ? "bg-black/30 border-white/5 opacity-50"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleEventCompleted(ev)}
                        className="cursor-pointer text-gray-400 hover:text-emerald-400 transition-colors flex-shrink-0 mt-0.5"
                      >
                        {ev.completed ? (
                          <CheckCircle2 size={16} className="text-emerald-400 fill-emerald-400/20" />
                        ) : (
                          <div className="w-4 h-4 rounded border border-white/40 hover:border-emerald-400" />
                        )}
                      </button>
                      <div>
                        <h4 className={`text-xs font-bold truncate ${ev.completed ? "line-through text-gray-500" : "text-white"}`}>
                          {ev.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border uppercase flex items-center gap-1 ${getTypeBadge(ev.type)}`}>
                            {getTypeIcon(ev.type)}
                            {ev.type}
                          </span>
                          <span className="text-[9px] text-gray-400">
                            {ev.date} {ev.time ? `às ${ev.time}` : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!ev.id.startsWith("lead-") && (
                      <button
                        type="button"
                        onClick={() => deleteEvent(ev)}
                        className="text-gray-600 hover:text-red-400 transition-colors p-1 flex-shrink-0 cursor-pointer"
                        title="Excluir item"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {ev.notes && (
                    <p className="text-[10px] text-gray-400 bg-black/40 p-2 rounded border border-white/5 italic">
                      "{ev.notes}"
                    </p>
                  )}
                </div>
              ))}

              {allEvents.length === 0 && !loading && (
                <p className="text-gray-500 text-center py-8 text-xs italic">Nenhum evento, tarefa ou nota cadastrada no banco de dados.</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Modal Estilo Agenda Dumar para Criar Evento, Tarefa ou Nota */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/20 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CalendarIcon size={16} className="text-amber-400" />
                Criar na Agenda Dumar
              </h3>
              <button
                type="button"
                onClick={() => setShowEventModal(false)}
                className="text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              {/* Seleção do Tipo: Evento, Tarefa ou Nota */}
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setEventType("evento")}
                  className={`flex-1 py-1.5 text-center font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${eventType === "evento" ? "bg-blue-500 text-white shadow" : "text-gray-400 hover:text-white"
                    }`}
                >
                  <CalendarIcon size={12} /> Evento
                </button>
                <button
                  type="button"
                  onClick={() => setEventType("tarefa")}
                  className={`flex-1 py-1.5 text-center font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${eventType === "tarefa" ? "bg-emerald-500 text-white shadow" : "text-gray-400 hover:text-white"
                    }`}
                >
                  <CheckSquare size={12} /> Tarefa
                </button>
                <button
                  type="button"
                  onClick={() => setEventType("nota")}
                  className={`flex-1 py-1.5 text-center font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${eventType === "nota" ? "bg-amber-500 text-black shadow" : "text-gray-400 hover:text-white"
                    }`}
                >
                  <StickyNote size={12} /> Nota
                </button>
              </div>

              {/* Título */}
              <div>
                <label className="block text-gray-400 font-bold mb-1">Título</label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  placeholder={
                    eventType === "evento"
                      ? "Ex: Medição Técnica na casa do cliente"
                      : (eventType === "tarefa" ? "Ex: Enviar proposta de orçamento PDF" : "Ex: Anotações da reunião...")
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-medium"
                  autoFocus
                />
              </div>

              {/* Data e Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Data</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {eventType !== "nota" && (
                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Horário</label>
                    <input
                      type="time"
                      value={eventTime}
                      onChange={e => setEventTime(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}
              </div>

              {/* Vincular Cliente Lead (Opcional) */}
              <div>
                <label className="block text-gray-400 font-bold mb-1">Vincular Cliente (Opcional)</label>
                <select
                  value={eventLeadId}
                  onChange={e => setEventLeadId(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">Sem cliente vinculado</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.name} - {l.phone}</option>
                  ))}
                </select>
              </div>

              {/* Nota / Detalhes Adicionais */}
              <div>
                <label className="block text-gray-400 font-bold mb-1">Notas / Observações</label>
                <textarea
                  value={eventNotes}
                  onChange={e => setEventNotes(e.target.value)}
                  placeholder="Escreva anotações técnicas, requisitos ou lembretes..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Ações */}
              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 rounded-xl font-bold text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-black transition-colors shadow-lg"
                >
                  Salvar no Calendário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



