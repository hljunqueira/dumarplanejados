import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { ArrowLeft, Phone, Send, CheckCircle, Clock, MapPin } from "lucide-react";
import { Link } from "wouter";
import logoDumar from "@/assets/logo1.jpeg";

import { getStoredUtm, trackGoogleAdsConversion } from "@/lib/utm-tracker";

interface AppointmentFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  alternativeDate: string;
  alternativeTime: string;
  notes: string;
}

export default function AppointmentPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<AppointmentFormData>();

  const onSubmit = async (data: AppointmentFormData) => {
    // 0. Disparar Conversão Google Ads AW-17444188651
    trackGoogleAdsConversion("appointment_form_submission");

    // 1. Persistir no banco de dados com UTMs capturadas
    try {
      const { utmSource, utmCampaign } = getStoredUtm();
      
      const payload = {
        name: data.name,
        phone: data.phone,
        email: data.email,
        value: 0,
        stage: "briefing", // Etapa do Funil para agendamentos de visita/medição
        rooms: [data.serviceType || "Visita Técnica"],
        utmSource,
        utmCampaign,
        checklist: {
          dataAgendamento: `${data.preferredDate} ${data.preferredTime}`,
          enderecoObra: data.address
        },
        chatHistory: [],
        promobFiles: []
      };

      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("Erro ao salvar lead no banco de dados:", err);
    }

    // 2. Criar mensagem para WhatsApp
    const message = `📅 *AGENDAMENTO DE ATENDIMENTO*\n\n` +
      `👤 *Nome:* ${data.name}\n` +
      `📱 *Telefone:* ${data.phone}\n` +
      `📧 *Email:* ${data.email}\n` +
      `📍 *Endereço:* ${data.address}\n\n` +
      `🔧 *Tipo de Serviço:* ${data.serviceType}\n\n` +
      `📅 *Data Preferencial:* ${data.preferredDate}\n` +
      `⏰ *Horário Preferencial:* ${data.preferredTime}\n\n` +
      `📅 *Data Alternativa:* ${data.alternativeDate || "Não informada"}\n` +
      `⏰ *Horário Alternativo:* ${data.alternativeTime || "Não informado"}\n\n` +
      `📝 *Observações:*\n${data.notes || "Nenhuma observação"}\n\n` +
      `Agendamento solicitado através do site dumarplanejados.com.br`;
    
    const whatsappUrl = `https://wa.me/5548988486827?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    setIsSubmitted(true);
  };

  const serviceTypes = [
    { value: "visita-tecnica", label: "Visita Técnica Gratuita" },
    { value: "medicao", label: "Medição do Ambiente" },
    { value: "apresentacao-projeto", label: "Apresentação de Projeto 3D" },
    { value: "consultoria", label: "Consultoria de Design & Cores" }
  ];

  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "13:30", "14:30",
    "15:30", "16:30", "17:30"
  ];

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-[#1A1A1A]/5">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-200">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Agendamento Solicitado!</h2>
          <p className="text-neutral-500 text-sm leading-relaxed mb-6">
            Sua solicitação de agendamento foi criada. Se não tiver aberto automaticamente, use o botão abaixo para nos enviar os detalhes por WhatsApp.
          </p>
          <div className="space-y-3">
            <Button className="w-full bg-[#1A1A1A] hover:bg-yellow-600 hover:text-black text-white py-5 rounded-xl font-bold transition-all duration-300" asChild>
              <a href="https://wa.me/5548988486827">
                <Phone className="mr-2 h-4 w-4" />
                Falar no WhatsApp
              </a>
            </Button>
            <Button variant="outline" className="w-full border-neutral-200 py-5 rounded-xl text-neutral-600" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Início
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-16 text-[#1A1A1A]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center text-neutral-500 hover:text-[#1A1A1A] mb-6 transition-colors text-sm font-semibold">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a Home
          </Link>
          
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mx-auto mb-4 border border-[#1A1A1A]/10">
            <img 
              src={logoDumar} 
              alt="Dumar Logo" 
              className="w-9 h-9 object-contain rounded-lg"
            />
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            Agendar <span className="bg-gradient-to-r from-yellow-600 to-amber-500 bg-clip-text text-transparent">Visita Técnica</span>
          </h1>
          <p className="text-neutral-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Selecione uma data e período desejados para a consultoria ou medição física dos seus ambientes.
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-3xl shadow-xl border border-[#1A1A1A]/5 p-8 sm:p-12">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            
            {/* Passo 1 */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-[#1A1A1A] flex items-center">
                <span className="w-6 h-6 rounded-full bg-yellow-600/10 text-yellow-700 flex items-center justify-center text-xs font-extrabold mr-3">1</span>
                Dados Básicos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Nome Completo *</label>
                  <Input
                    {...register("name", { required: "Nome é obrigatório" })}
                    placeholder="Ex: Paulo Vargas"
                    className="w-full bg-[#FAF8F5]/50 border-[#1A1A1A]/10 rounded-xl focus:border-yellow-600/50 text-[#1A1A1A] px-4 py-6"
                  />
                  {errors.name && <span className="text-red-500 text-[11px] block mt-1">{errors.name.message}</span>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Telefone / WhatsApp *</label>
                  <Input
                    type="tel"
                    {...register("phone", { required: "Telefone é obrigatório" })}
                    placeholder="(48) 98848-6827"
                    className="w-full bg-[#FAF8F5]/50 border-[#1A1A1A]/10 rounded-xl focus:border-yellow-600/50 text-[#1A1A1A] px-4 py-6"
                  />
                  {errors.phone && <span className="text-red-500 text-[11px] block mt-1">{errors.phone.message}</span>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Email *</label>
                  <Input
                    type="email"
                    {...register("email", { required: "Email é obrigatório" })}
                    placeholder="seuemail@exemplo.com"
                    className="w-full bg-[#FAF8F5]/50 border-[#1A1A1A]/10 rounded-xl focus:border-yellow-600/50 text-[#1A1A1A] px-4 py-6"
                  />
                  {errors.email && <span className="text-red-500 text-[11px] block mt-1">{errors.email.message}</span>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Endereço da Visita *</label>
                  <Input
                    {...register("address", { required: "Endereço é obrigatório" })}
                    placeholder="Ex: Rua das Flores, 123 - Centro"
                    className="w-full bg-[#FAF8F5]/50 border-[#1A1A1A]/10 rounded-xl focus:border-yellow-600/50 text-[#1A1A1A] px-4 py-6"
                  />
                  {errors.address && <span className="text-red-500 text-[11px] block mt-1">{errors.address.message}</span>}
                </div>
              </div>
            </div>

            {/* Passo 2 */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-[#1A1A1A] flex items-center">
                <span className="w-6 h-6 rounded-full bg-yellow-600/10 text-yellow-700 flex items-center justify-center text-xs font-extrabold mr-3">2</span>
                Data & Horário
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Serviço Desejado *</label>
                  <select
                    {...register("serviceType", { required: "Selecione o serviço" })}
                    className="w-full px-4 py-3 bg-[#FAF8F5]/50 border border-[#1A1A1A]/10 rounded-xl focus:border-yellow-600/50 text-[#1A1A1A] text-sm h-12"
                  >
                    <option value="">Selecione...</option>
                    {serviceTypes.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  {errors.serviceType && <span className="text-red-500 text-[11px] block mt-1">{errors.serviceType.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Data Preferencial *</label>
                  <input
                    type="date"
                    min={getMinDate()}
                    {...register("preferredDate", { required: "Data é obrigatória" })}
                    className="w-full px-4 py-3 bg-[#FAF8F5]/50 border border-[#1A1A1A]/10 rounded-xl focus:border-yellow-600/50 text-[#1A1A1A] text-sm h-12"
                  />
                  {errors.preferredDate && <span className="text-red-500 text-[11px] block mt-1">{errors.preferredDate.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Horário Preferencial *</label>
                  <select
                    {...register("preferredTime", { required: "Selecione o horário" })}
                    className="w-full px-4 py-3 bg-[#FAF8F5]/50 border border-[#1A1A1A]/10 rounded-xl focus:border-yellow-600/50 text-[#1A1A1A] text-sm h-12"
                  >
                    <option value="">Selecione...</option>
                    {timeSlots.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {errors.preferredTime && <span className="text-red-500 text-[11px] block mt-1">{errors.preferredTime.message}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Data Alternativa</label>
                  <input
                    type="date"
                    min={getMinDate()}
                    {...register("alternativeDate")}
                    className="w-full px-4 py-3 bg-[#FAF8F5]/50 border border-[#1A1A1A]/10 rounded-xl focus:border-yellow-600/50 text-[#1A1A1A] text-sm h-12"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Horário Alternativo</label>
                  <select
                    {...register("alternativeTime")}
                    className="w-full px-4 py-3 bg-[#FAF8F5]/50 border border-[#1A1A1A]/10 rounded-xl focus:border-yellow-600/50 text-[#1A1A1A] text-sm h-12"
                  >
                    <option value="">Selecione...</option>
                    {timeSlots.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Notas / Observações Adicionais</label>
                <Textarea
                  {...register("notes")}
                  placeholder="Se houver alguma restrição de condomínio, melhor forma de acesso ou particularidades, descreva aqui..."
                  className="w-full bg-[#FAF8F5]/50 border-[#1A1A1A]/10 rounded-xl focus:border-yellow-600/50 text-[#1A1A1A] px-4 py-3 min-h-[120px]"
                />
              </div>
            </div>

            {/* Envio */}
            <div className="pt-6 border-t border-[#1A1A1A]/5">
              <Button
                type="submit"
                className="w-full bg-[#1A1A1A] text-white hover:bg-yellow-600 hover:text-black font-extrabold py-6 rounded-xl transition-all duration-300 hover:scale-[1.01] shadow-md flex items-center justify-center text-base"
              >
                <Send className="mr-3 h-5 w-5" />
                Agendar e Enviar via WhatsApp
              </Button>
              <p className="text-center text-xs text-neutral-400 mt-4 leading-relaxed">
                Você será direcionado para o WhatsApp com todos os horários e informações solicitadas estruturadas.
              </p>
            </div>
          </form>
        </div>

        {/* Informações */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-[#1A1A1A]/5 text-center shadow-sm flex items-center space-x-4">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div className="text-left">
              <h4 className="font-bold text-[#1A1A1A] text-xs">Pontualidade</h4>
              <p className="text-[10px] text-neutral-400">Respeito rigoroso aos horários agendados.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-[#1A1A1A]/5 text-center shadow-sm flex items-center space-x-4">
            <MapPin className="h-5 w-5 text-yellow-600" />
            <div className="text-left">
              <h4 className="font-bold text-[#1A1A1A] text-xs">Frota Própria</h4>
              <p className="text-[10px] text-neutral-400">Atendimento em toda a microrregião litorânea.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-[#1A1A1A]/5 text-center shadow-sm flex items-center space-x-4">
            <CheckCircle className="h-5 w-5 text-yellow-600" />
            <div className="text-left">
              <h4 className="font-bold text-[#1A1A1A] text-xs">Sem Custos</h4>
              <p className="text-[10px] text-neutral-400">O estudo preliminar e medição inicial são cortesia.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}