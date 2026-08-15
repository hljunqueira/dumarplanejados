import React, { useMemo } from "react";
import { 
  DollarSign, BarChart2, Calendar as CalendarIcon, Users, 
  TrendingUp, Award, CheckCircle2, PieChart as PieChartIcon, 
  Layers, ArrowUpRight, Flame, Building2
} from "lucide-react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from "recharts";
import { Lead } from "./types";

interface CRMDashboardProps {
  leads: Lead[];
  closedSalesTotal: number;
  activeProjectsCount: number;
  scheduledMeasurementsCount: number;
  totalValue: number;
  utmData: Array<{
    source: string;
    count: number;
    value: number;
    percentage: number;
  }>;
  getNetworkColor: (source: string) => string;
}

// Cores premium do Design System Dumar (Âmbar, Esmeralda, Cobalto, Roxo, etc.)
const CHANNEL_COLORS: { [key: string]: string } = {
  "WhatsApp Direto / Orgânico": "#10b981", // Emerald
  "WhatsApp Direto / CRM": "#059669",
  "Google Ads": "#3b82f6", // Blue
  "Instagram Ads": "#ec4899", // Pink
  "Instagram Ads (Meta)": "#e11d48", // Rose
  "Facebook Ads (Meta)": "#2563eb",
  "ZernFlow Instagram": "#8b5cf6",
  "ZernFlow WhatsApp": "#06b6d4",
  "Campanha Manual": "#f59e0b",
  "Outros / Indicação": "#94a3b8"
};

const STAGE_LABELS: { [key: string]: { label: string; color: string } } = {
  entrada: { label: "Entrada", color: "#3b82f6" },
  nao_responde: { label: "Não Responde", color: "#f59e0b" },
  briefing: { label: "Briefing & Medição", color: "#8b5cf6" },
  "3d": { label: "Projeto 3D", color: "#e2e8f0" },
  apresentacao: { label: "Orçamento", color: "#94a3b8" },
  contrato: { label: "Contrato Fechado", color: "#10b981" },
  fabrica: { label: "Fábrica & Corte", color: "#f97316" },
  montagem: { label: "Montagem", color: "#ec4899" },
  posvenda: { label: "Pós-Venda", color: "#14b8a6" }
};

export default function CRMDashboard({
  leads,
  closedSalesTotal,
  activeProjectsCount,
  scheduledMeasurementsCount,
  totalValue,
  utmData,
  getNetworkColor
}: CRMDashboardProps) {

  // 1. Dados para o Gráfico de Distribuição por Canal (Donut)
  const channelChartData = useMemo(() => {
    return utmData.map(item => ({
      name: item.source,
      value: item.count,
      financialValue: item.value,
      percentage: item.percentage,
      color: CHANNEL_COLORS[item.source] || "#f59e0b"
    }));
  }, [utmData]);

  // 2. Dados para o Gráfico de Funil / Pipeline de Etapas
  const pipelineData = useMemo(() => {
    const counts: { [key: string]: { count: number; value: number } } = {
      entrada: { count: 0, value: 0 },
      nao_responde: { count: 0, value: 0 },
      briefing: { count: 0, value: 0 },
      "3d": { count: 0, value: 0 },
      apresentacao: { count: 0, value: 0 },
      contrato: { count: 0, value: 0 },
      fabrica: { count: 0, value: 0 },
      montagem: { count: 0, value: 0 },
      posvenda: { count: 0, value: 0 }
    };

    leads.forEach(l => {
      const st = l.stage || "entrada";
      if (counts[st]) {
        counts[st].count += 1;
        counts[st].value += Number(l.value || 0);
      }
    });

    return Object.keys(STAGE_LABELS).map(stKey => ({
      stageKey: stKey,
      etapa: STAGE_LABELS[stKey].label,
      quantidade: counts[stKey]?.count || 0,
      valor: counts[stKey]?.value || 0,
      fill: STAGE_LABELS[stKey].color
    }));
  }, [leads]);

  // 3. Dados para o Gráfico de Ambientes Mais Procurados
  const roomsData = useMemo(() => {
    const roomCounts: { [key: string]: number } = {};
    leads.forEach(l => {
      let rList: string[] = [];
      try {
        rList = typeof l.rooms === "string" ? JSON.parse(l.rooms || "[]") : (l.rooms || []);
      } catch (e) {
        rList = [];
      }
      rList.forEach(r => {
        const clean = r.trim();
        if (!clean) return;
        roomCounts[clean] = (roomCounts[clean] || 0) + 1;
      });
    });

    const sorted = Object.entries(roomCounts)
      .map(([ambiente, qtd]) => ({ ambiente, quantidade: qtd }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 6);

    return sorted.length > 0 ? sorted : [
      { ambiente: "Cozinha", quantidade: 12 },
      { ambiente: "Quarto / Suíte", quantidade: 8 },
      { ambiente: "Banheiro", quantidade: 6 },
      { ambiente: "Closet", quantidade: 5 },
      { ambiente: "Sala", quantidade: 4 },
      { ambiente: "Sacada Gourmet", quantidade: 3 }
    ];
  }, [leads]);

  // 4. Métricas Complementares (Fechados: Contrato, Fábrica, Montagem e Pós-Venda)
  const closedLeadsCount = useMemo(() => {
    return leads.filter(l => ["contrato", "fabrica", "montagem", "posvenda"].includes(l.stage)).length;
  }, [leads]);

  const ticketMedio = useMemo(() => {
    if (closedLeadsCount === 0) return 0;
    return closedSalesTotal / closedLeadsCount;
  }, [closedSalesTotal, closedLeadsCount]);

  const conversionRate = useMemo(() => {
    if (leads.length === 0) return "0.0";
    return ((closedLeadsCount / leads.length) * 100).toFixed(1);
  }, [leads.length, closedLeadsCount]);

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-8 scrollbar-thin bg-[#080808] text-white font-sans">
      
      {/* 1. CARDS DE KPIS SUPERIORES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Faturamento Fechado */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 relative overflow-hidden shadow-xl hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">Faturamento Fechado</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-emerald-400">
            {closedSalesTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-400/80 font-semibold">
            <CheckCircle2 size={12} />
            <span>{closedLeadsCount} contratos fechados</span>
          </div>
        </div>

        {/* Valor em Negociação */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 relative overflow-hidden shadow-xl hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">Pipeline em Negociação</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-blue-400">
            {(totalValue - closedSalesTotal).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400 font-semibold">
            <span>Oportunidades em aberto no funil</span>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 relative overflow-hidden shadow-xl hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">Ticket Médio por Projeto</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Award size={16} />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-amber-400">
            {ticketMedio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-400/80 font-semibold">
            <Flame size={12} />
            <span>Média por cliente fechado</span>
          </div>
        </div>

        {/* Taxa de Conversão */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 relative overflow-hidden shadow-xl hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">Taxa de Conversão</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <BarChart2 size={16} />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-purple-400">{conversionRate}%</p>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400 font-semibold">
            <span>{leads.length} leads totais registrados</span>
          </div>
        </div>
      </div>

      {/* 2. LINHA DE GRÁFICOS: CANAL DE ORIGEM & FUNIL DE CONVERSÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* GRÁFICO 1: DISTRIBUIÇÃO POR CANAL (DONUT + TABELA VISUAL) */}
        <div className="lg:col-span-6 bg-[#121212] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <PieChartIcon size={16} className="text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Distribuição por Canal de Entrada (UTM)
                </h3>
              </div>
              <span className="text-[10px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-gray-300 font-bold">
                {leads.length} Leads Totais
              </span>
            </div>

            {/* Gráfico Donut Sem Sobreposição */}
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#181818] border border-white/20 p-2.5 rounded-xl shadow-2xl text-xs z-30">
                            <p className="font-bold text-white mb-0.5">{data.name}</p>
                            <p className="text-amber-400 font-semibold">{data.value} leads ({data.percentage}%)</p>
                            {data.financialValue > 0 && (
                              <p className="text-emerald-400 font-bold mt-1">
                                Valor: {data.financialValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={channelChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={78}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {channelChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#121212" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lista de Canais com Valor Financeiro Abaixo */}
          <div className="space-y-2 mt-4 pt-3 border-t border-white/5">
            {utmData.map(item => (
              <div key={item.source} className="p-2 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: CHANNEL_COLORS[item.source] || "#f59e0b" }}
                    />
                    <span className="text-white font-semibold">{item.source}</span>
                  </div>
                  <span className="font-bold text-gray-300">
                    {item.count} leads <span className="text-gray-500 font-normal">({item.percentage}%)</span>
                  </span>
                </div>

                {/* Valor Financeiro exibido na linha abaixo com destaque */}
                {item.value > 0 && (
                  <div className="mt-1.5 pt-1.5 border-t border-white/5 flex items-center justify-between text-[11px]">
                    <span className="text-gray-400">Volume em Negociação / Fechado:</span>
                    <span className="font-bold text-emerald-400">
                      {item.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* GRÁFICO 2: PIPELINE & CONVERSÃO POR ETAPAS DO FUNIL */}
        <div className="lg:col-span-6 bg-[#121212] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <BarChart2 size={16} className="text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Volume de Projetos por Etapa do Funil
                </h3>
              </div>
              <span className="text-[10px] text-gray-400 font-semibold">Pipeline Ativo</span>
            </div>

            {/* Gráfico de Barras Verticais */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis 
                    dataKey="etapa" 
                    stroke="#94a3b8" 
                    fontSize={9} 
                    tickLine={false} 
                    angle={-25} 
                    textAnchor="end" 
                  />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#181818] border border-white/20 p-2.5 rounded-xl shadow-2xl text-xs">
                            <p className="font-bold text-white">{d.etapa}</p>
                            <p className="text-blue-400 font-semibold">{d.quantidade} leads nesta etapa</p>
                            {d.valor > 0 && (
                              <p className="text-emerald-400 font-bold mt-0.5">
                                {d.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="quantidade" radius={[6, 6, 0, 0]}>
                    {pipelineData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/5 text-center">
            <div className="p-2 bg-black/40 rounded-xl border border-white/5">
              <span className="text-[9px] text-gray-400 uppercase font-bold block">Medições</span>
              <span className="text-xs font-black text-purple-400">{scheduledMeasurementsCount} agendadas</span>
            </div>
            <div className="p-2 bg-black/40 rounded-xl border border-white/5">
              <span className="text-[9px] text-gray-400 uppercase font-bold block">Projetos 3D</span>
              <span className="text-xs font-black text-white">{activeProjectsCount} em criação</span>
            </div>
            <div className="p-2 bg-black/40 rounded-xl border border-white/5">
              <span className="text-[9px] text-gray-400 uppercase font-bold block">Na Fábrica</span>
              <span className="text-xs font-black text-orange-400">
                {leads.filter(l => l.stage === "fabrica").length} em corte
              </span>
            </div>
            <div className="p-2 bg-black/40 rounded-xl border border-white/5">
              <span className="text-[9px] text-gray-400 uppercase font-bold block">Entregues</span>
              <span className="text-xs font-black text-emerald-400">
                {leads.filter(l => l.stage === "posvenda").length} finalizados
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. GRÁFICO DE AMBIENTES MAIS PROCURADOS (TOP CÔMODOS) */}
      <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Ambientes e Cômodos Mais Solicitados pelos Clientes
            </h3>
          </div>
          <span className="text-[10px] text-gray-400 font-semibold">Procura por Ambiente</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {roomsData.map((r, idx) => (
            <div key={idx} className="p-3.5 bg-black/40 border border-white/5 rounded-xl hover:border-amber-500/30 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white truncate max-w-[120px]">{r.ambiente}</span>
                <span className="text-[10px] font-black bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">
                  #{idx + 1}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-amber-300">{r.quantidade}</span>
                <span className="text-[10px] text-gray-400">projetos</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

