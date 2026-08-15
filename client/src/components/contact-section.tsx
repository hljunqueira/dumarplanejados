import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Phone, Send, MapPin, Mail } from "lucide-react";

export default function ContactSection() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    // 1. Persistir no banco de dados com UTMs capturadas
    try {
      const utmSource = sessionStorage.getItem("utm_source") || "WhatsApp Direto / Site";
      const utmCampaign = sessionStorage.getItem("utm_campaign") || "Site Direto";
      
      const payload = {
        name: data.name,
        phone: data.phone,
        email: "",
        value: 0,
        stage: "entrada",
        rooms: ["Contato Geral"],
        utmSource,
        utmCampaign,
        checklist: {},
        chatHistory: [],
        promobFiles: []
      };

      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("Erro ao salvar lead via formulário:", err);
    }

    // 2. Redirecionar para o WhatsApp
    const message = `Olá! Meu nome é ${data.name}. Telefone: ${data.phone}. Mensagem: ${data.message || 'Gostaria de solicitar um orçamento.'}`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/5548988486827?text=${encoded}`, '_blank');
  };

  return (
    <section id="contato" className="py-24 md:py-32 bg-[#FDFBF7] text-[#1A1A1A] relative border-t border-neutral-200 overflow-hidden">
      
      {/* Background Decorativo Sutil */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-10 left-10 w-96 h-96 bg-amber-200/30 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-100/40 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 lg:px-8">
        
        {/* Cabeçalho */}
        <div className="text-center mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-[#1A1A1A]">
            Deseja um Orçamento de <br />
            <span className="text-[#f97316]">Móveis Sob Medida?</span>
          </h2>
          <p className="text-neutral-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Preencha os dados abaixo para iniciar seu atendimento personalizado ou entre em contato diretamente pelo canal móvel.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl mx-auto items-stretch">
          
          {/* LADO ESQUERDO: Formulário Elegante */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 md:p-10 border border-neutral-200 shadow-xl flex flex-col justify-between">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Falar com Consultor</h3>
              <p className="text-xs text-neutral-500">Preencha o formulário e seja direcionado para nossa engenharia.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Nome Completo *
                </label>
                <Input
                  id="name"
                  placeholder="Seu nome completo"
                  {...register("name", { required: true })}
                  className="bg-neutral-50 border-neutral-300 text-[#1A1A1A] focus:border-black rounded-xl py-3 px-4 text-sm"
                />
                {errors.name && <span className="text-xs text-red-500">Nome é obrigatório</span>}
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Telefone / WhatsApp *
                </label>
                <Input
                  id="phone"
                  placeholder="(48) 99999-9999"
                  {...register("phone", { required: true })}
                  className="bg-neutral-50 border-neutral-300 text-[#1A1A1A] focus:border-black rounded-xl py-3 px-4 text-sm"
                />
                {errors.phone && <span className="text-xs text-red-500">Telefone é obrigatório</span>}
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Resumo do Projeto (Ambiente, Cidade, Prazo)
                </label>
                <Textarea
                  id="message"
                  rows={4}
                  placeholder="Ex: Cozinha e Suíte Master em Balneário Arroio do Silva. Previsão de entrega do imóvel em 60 dias."
                  {...register("message")}
                  className="bg-neutral-50 border-neutral-300 text-[#1A1A1A] focus:border-black rounded-xl p-4 text-sm"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-black hover:bg-neutral-800 text-white font-extrabold py-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 text-sm shadow-lg cursor-pointer"
              >
                <span>Enviar Solicitação via WhatsApp</span>
                <Send className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </div>

          {/* LADO DIREITO: Informações de Contato Direto */}
          <div className="lg:col-span-5 bg-neutral-900 text-white rounded-3xl p-8 md:p-10 border border-white/10 shadow-2xl flex flex-col justify-between">
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Canais Diretos</h3>
                <p className="text-xs text-neutral-400">Atendimento presencial em nosso showroom ou visitas técnicas agendadas.</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-[#f97316] flex-shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">Telefone & WhatsApp</h4>
                    <p className="text-sm font-bold text-white">(48) 98848-6827</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Segunda a Sexta, das 08h às 18h</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-[#f97316] flex-shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">Fábrica & Showroom</h4>
                    <p className="text-sm font-bold text-white">Av. Santa Catarina, 551 sala 205</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Centro - Balneário Arroio do Silva</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-[#f97316] flex-shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">E-mail Comercial</h4>
                    <p className="text-sm font-bold text-white">dumarmoveisplanejados@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10 mt-8">
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                * Todos os dados fornecidos são confidenciais e protegidos conforme a Lei Geral de Proteção de Dados (LGPD).
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
