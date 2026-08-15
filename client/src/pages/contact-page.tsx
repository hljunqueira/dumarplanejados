import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { ArrowLeft, Phone, Mail, MapPin, Clock, Send, CheckCircle, MessageCircle, Instagram } from "lucide-react";
import { Link } from "wouter";
import logoDumar from "@/assets/logo1.jpeg";

import { getStoredUtm, trackGoogleAdsConversion } from "@/lib/utm-tracker";

interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  contactPreference: string;
}

export default function ContactPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    // 0. Disparar Conversão Google Ads AW-17444188651
    trackGoogleAdsConversion("contact_form_submission");

    // 1. Persistir no banco de dados com UTMs capturadas
    try {
      const { utmSource, utmCampaign } = getStoredUtm();
      
      const payload = {
        name: data.name,
        phone: data.phone,
        email: data.email,
        value: 0,
        stage: "entrada",
        rooms: [data.subject || "Contato Geral"],
        utmSource,
        utmCampaign,
        checklist: {
          preferenciaContato: data.contactPreference
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
    const message = `💬 *CONTATO PELO SITE*\n\n` +
      `👤 *Nome:* ${data.name}\n` +
      `📱 *Telefone:* ${data.phone}\n` +
      `📧 *Email:* ${data.email}\n` +
      `📋 *Assunto:* ${data.subject}\n` +
      `📞 *Preferência de Contato:* ${data.contactPreference}\n\n` +
      `💬 *Mensagem:*\n${data.message}\n\n` +
      `Mensagem enviada através do site dumarplanejados.com.br`;
    
    const whatsappUrl = `https://wa.me/5548988486827?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    setIsSubmitted(true);
  };

  const subjects = [
    { value: "orcamento", label: "Solicitar Orçamento" },
    { value: "agendamento", label: "Agendar Atendimento" },
    { value: "duvidas", label: "Dúvidas sobre Projetos" },
    { value: "pos-venda", label: "Pós-venda/Suporte" }
  ];

  const contactPreferences = [
    { value: "whatsapp", label: "WhatsApp" },
    { value: "telefone", label: "Ligação" },
    { value: "email", label: "Email" }
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-[#1A1A1A]/5">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-200">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Mensagem Enviada!</h2>
          <p className="text-neutral-500 text-sm leading-relaxed mb-6">
            Sua solicitação de contato foi gerada. Se não abrir automaticamente, use o botão abaixo para abrir o WhatsApp.
          </p>
          <div className="space-y-3">
            <Button className="w-full bg-[#1A1A1A] hover:bg-yellow-600 hover:text-black text-white py-5 rounded-xl font-bold transition-all duration-300" asChild>
              <a href="https://wa.me/5548988486827">
                <MessageCircle className="mr-2 h-4 w-4" />
                Continuar no WhatsApp
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        
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
            Canais de <span className="bg-gradient-to-r from-yellow-600 to-amber-500 bg-clip-text text-transparent">Contato</span>
          </h1>
          <p className="text-neutral-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Estamos prontos para atender você. Fale diretamente por WhatsApp ou envie suas necessidades no formulário técnico.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* LADO ESQUERDO: Info de Contato */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-8 border border-[#1A1A1A]/5 shadow-xl flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold">Showroom & Atendimento</h3>
                <p className="text-xs text-neutral-400">Entre em contato direto por telefone ou venha nos visitar.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-[#FAF8F5] rounded-xl border border-[#1A1A1A]/5">
                  <Phone className="h-5 w-5 text-yellow-600" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">WhatsApp</span>
                    <a href="tel:+5548988486827" className="text-sm font-bold text-[#1A1A1A] hover:text-yellow-600 transition-colors">(48) 98848-6827</a>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-[#FAF8F5] rounded-xl border border-[#1A1A1A]/5">
                  <Mail className="h-5 w-5 text-yellow-600" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">Email</span>
                    <span className="text-sm font-bold">dumarmoveisplanejados@gmail.com</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-[#FAF8F5] rounded-xl border border-[#1A1A1A]/5">
                  <MapPin className="h-5 w-5 text-yellow-600" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">Localização</span>
                    <span className="text-sm font-bold">Av. Santa Catarina, 551 sala 205 - Centro</span>
                    <span className="text-xs text-neutral-500 block">Balneário Arroio do Silva, SC</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#FAF8F5] rounded-2xl p-5 border border-[#1A1A1A]/5 space-y-2">
              <span className="text-xs font-bold text-yellow-600 block uppercase tracking-wider">Horário de Funcionamento</span>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Segunda a Sexta: 08:00 às 18:00<br />
                Sábado: Mediante agendamento prévio.
              </p>
            </div>
          </div>

          {/* LADO DIREITO: Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 border border-[#1A1A1A]/5 shadow-xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Assunto *</label>
                  <select
                    {...register("subject", { required: "Selecione o assunto" })}
                    className="w-full px-4 py-3 bg-[#FAF8F5]/50 border border-[#1A1A1A]/10 rounded-xl focus:border-yellow-600/50 text-[#1A1A1A] text-sm h-12"
                  >
                    <option value="">Selecione...</option>
                    {subjects.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  {errors.subject && <span className="text-red-500 text-[11px] block mt-1">{errors.subject.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Preferência de Contato *</label>
                  <select
                    {...register("contactPreference", { required: "Selecione a preferência" })}
                    className="w-full px-4 py-3 bg-[#FAF8F5]/50 border border-[#1A1A1A]/10 rounded-xl focus:border-yellow-600/50 text-[#1A1A1A] text-sm h-12"
                  >
                    <option value="">Selecione...</option>
                    {contactPreferences.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  {errors.contactPreference && <span className="text-red-500 text-[11px] block mt-1">{errors.contactPreference.message}</span>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Mensagem *</label>
                <Textarea
                  {...register("message", { required: "Mensagem é obrigatória" })}
                  placeholder="Escreva sua mensagem com detalhes de sua solicitação..."
                  className="w-full bg-[#FAF8F5]/50 border-[#1A1A1A]/10 rounded-xl focus:border-yellow-600/50 text-[#1A1A1A] px-4 py-3 min-h-[120px]"
                />
                {errors.message && <span className="text-red-500 text-[11px] block mt-1">{errors.message.message}</span>}
              </div>

              <Button
                type="submit"
                className="w-full bg-[#1A1A1A] text-white hover:bg-yellow-600 hover:text-black font-extrabold py-6 rounded-xl transition-all duration-300 hover:scale-[1.01] shadow-md flex items-center justify-center text-base"
              >
                <Send className="mr-3 h-5 w-5" />
                Enviar Mensagem
              </Button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}