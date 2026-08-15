import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { ArrowLeft, Calculator, Phone, Send, CheckCircle, Home, Sofa, Bath, ChefHat } from "lucide-react";
import { Link } from "wouter";
import logoDumar from "@/assets/logo1.jpeg";

interface BudgetFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  projectType: string;
  rooms: string[];
  budget: string;
  timeline: string;
  description: string;
  hasPlans: boolean;
}

import { getStoredUtm, trackGoogleAdsConversion } from "@/lib/utm-tracker";

export default function BudgetPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch } = useForm<BudgetFormData>();
  const selectedRooms = watch("rooms") || [];

  const onSubmit = async (data: BudgetFormData) => {
    // 0. Disparar Conversão Google Ads AW-17444188651
    trackGoogleAdsConversion("budget_form_submission");

    // 1. Persistir no banco de dados com UTMs capturadas
    try {
      const { utmSource, utmCampaign } = getStoredUtm();

      const payload = {
        name: data.name,
        phone: data.phone,
        email: data.email,
        value: 0,
        stage: "entrada",
        rooms: data.rooms || [],
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
      console.error("Erro ao salvar lead no banco de dados:", err);
    }

    // 2. Criar mensagem para WhatsApp
    const message = `🏠 *SOLICITAÇÃO DE ORÇAMENTO*\n\n` +
      `👤 *Nome:* ${data.name}\n` +
      `📧 *Email:* ${data.email}\n` +
      `📱 *Telefone:* ${data.phone}\n` +
      `📍 *Endereço:* ${data.address}\n\n` +
      `🏗️ *Tipo de Projeto:* ${data.projectType}\n` +
      `🏠 *Ambientes:* ${Array.isArray(data.rooms) ? data.rooms.join(", ") : data.rooms}\n` +
      `💰 *Orçamento:* ${data.budget || 'Não informado'}\n` +
      `⏰ *Prazo:* ${data.timeline || 'Não informado'}\n` +
      `📋 *Possui plantas:* ${data.hasPlans ? "Sim" : "Não"}\n\n` +
      `📝 *Descrição do projeto:*\n${data.description || 'Sem descrição adicional'}\n\n` +
      `Enviado através do site dumarplanejados.com.br`;

    const whatsappUrl = `https://wa.me/5548988486827?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    setIsSubmitted(true);
  };

  const roomOptions = [
    { id: "cozinha", label: "Cozinha", icon: ChefHat },
    { id: "quarto", label: "Quarto", icon: Home },
    { id: "sala", label: "Sala", icon: Sofa },
    { id: "banheiro", label: "Banheiro", icon: Bath },
    { id: "closet", label: "Closet", icon: Home },
    { id: "escritorio", label: "Escritório", icon: Home },
    { id: "lavanderia", label: "Lavanderia", icon: Home },
    { id: "area-gourmet", label: "Área Gourmet", icon: ChefHat }
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-[#1A1A1A]/5">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-200">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Orçamento Solicitado!</h2>
          <p className="text-neutral-500 text-sm leading-relaxed mb-6">
            Sua simulação foi gerada. Caso não tenha aberto automaticamente, clique no botão abaixo para nos enviar as especificações pelo WhatsApp.
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
            Simulador de <span className="bg-gradient-to-r from-yellow-600 to-amber-500 bg-clip-text text-transparent">Projeto 3D</span>
          </h1>
          <p className="text-neutral-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Selecione seus ambientes e preferências para montarmos um pré-dimensionamento personalizado do seu espaço.
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-3xl shadow-xl border border-[#1A1A1A]/5 p-8 sm:p-12">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">

            {/* Dados Pessoais */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-[#1A1A1A] flex items-center">
                <span className="w-6 h-6 rounded-full bg-yellow-600/10 text-yellow-700 flex items-center justify-center text-xs font-extrabold mr-3">1</span>
                Dados para Contato
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
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Cidade e Bairro *</label>
                  <Input
                    {...register("address", { required: "Cidade/Bairro é obrigatório" })}
                    placeholder="Ex: Balneário Arroio do Silva - Centro"
                    className="w-full bg-[#FAF8F5]/50 border-[#1A1A1A]/10 rounded-xl focus:border-yellow-600/50 text-[#1A1A1A] px-4 py-6"
                  />
                  {errors.address && <span className="text-red-500 text-[11px] block mt-1">{errors.address.message}</span>}
                </div>
              </div>
            </div>

            {/* Detalhes do Projeto */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-[#1A1A1A] flex items-center">
                <span className="w-6 h-6 rounded-full bg-yellow-600/10 text-yellow-700 flex items-center justify-center text-xs font-extrabold mr-3">2</span>
                Preferências do Projeto
              </h3>

              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Tipo de Projeto *</label>
                  <select
                    {...register("projectType", { required: "Tipo de projeto é obrigatório" })}
                    className="w-full px-4 py-3 bg-[#FAF8F5]/50 border border-[#1A1A1A]/10 rounded-xl focus:border-yellow-600/50 text-[#1A1A1A] text-sm h-12"
                  >
                    <option value="">Selecione o tipo de projeto</option>
                    <option value="Móveis novos para residência">Móveis novos para residência</option>
                    <option value="Reforma/Troca completa">Reforma/Troca completa</option>
                    <option value="Complementar móveis existentes">Complementar móveis existentes</option>
                    <option value="Projeto comercial/corporativo">Projeto comercial/corporativo</option>
                  </select>
                  {errors.projectType && <span className="text-red-500 text-[11px] block mt-1">{errors.projectType.message}</span>}
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">Ambientes que deseja mobiliar *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {roomOptions.map((room) => {
                      const Icon = room.icon;
                      const isChecked = selectedRooms.includes(room.id);
                      return (
                        <label
                          key={room.id}
                          className={`flex items-center space-x-3 p-4 bg-white border rounded-xl hover:border-yellow-600/50 cursor-pointer transition-all duration-300 ${isChecked ? 'border-yellow-600 bg-yellow-600/5' : 'border-[#1A1A1A]/5'
                            }`}
                        >
                          <input
                            type="checkbox"
                            value={room.id}
                            {...register("rooms", { required: "Selecione pelo menos um ambiente" })}
                            className="rounded border-[#1A1A1A]/10 text-yellow-600 focus:ring-0"
                          />
                          <Icon className={`h-4 w-4 ${isChecked ? 'text-yellow-600' : 'text-neutral-400'}`} />
                          <span className="text-xs font-bold text-neutral-700">{room.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  {errors.rooms && <span className="text-red-500 text-[11px] block mt-1">{errors.rooms.message}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Orçamento Estimado</label>
                    <select
                      {...register("budget")}
                      className="w-full px-4 py-3 bg-[#FAF8F5]/50 border border-[#1A1A1A]/10 rounded-xl focus:border-yellow-600/50 text-[#1A1A1A] text-sm h-12"
                    >
                      <option value="">Selecione uma faixa de valores</option>
                      <option value="Até R$ 15.000">Até R$ 15.000</option>
                      <option value="R$ 15.000 - R$ 30.000">R$ 15.000 - R$ 30.000</option>
                      <option value="R$ 30.000 - R$ 60.000">R$ 30.000 - R$ 60.000</option>
                      <option value="R$ 60.000 - R$ 100.000">R$ 60.000 - R$ 100.000</option>
                      <option value="Acima de R$ 100.000">Acima de R$ 100.000</option>
                      <option value="Não tenho ideia">Não tenho ideia</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Prazo Desejado</label>
                    <select
                      {...register("timeline")}
                      className="w-full px-4 py-3 bg-[#FAF8F5]/50 border border-[#1A1A1A]/10 rounded-xl focus:border-yellow-600/50 text-[#1A1A1A] text-sm h-12"
                    >
                      <option value="">Selecione um prazo estimado</option>
                      <option value="Urgente (imediato)">Urgente (imediato)</option>
                      <option value="1 a 2 meses">1 a 2 meses</option>
                      <option value="3 a 4 meses">3 a 4 meses</option>
                      <option value="Mais de 6 meses">Mais de 6 meses</option>
                      <option value="Flexível">Flexível</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("hasPlans")}
                      className="rounded border-[#1A1A1A]/10 text-yellow-600 focus:ring-0"
                    />
                    <span className="text-xs font-bold text-neutral-600">Já possuo plantas ou medidas do ambiente</span>
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Descrição do Projeto / Detalhes</label>
                  <Textarea
                    {...register("description")}
                    placeholder="Descreva seu projeto, estilo preferido, necessidades específicas ou inspirações..."
                    className="w-full bg-[#FAF8F5]/50 border-[#1A1A1A]/10 rounded-xl focus:border-yellow-600/50 text-[#1A1A1A] px-4 py-3 min-h-[120px]"
                  />
                </div>
              </div>
            </div>

            {/* Botão de Envio */}
            <div className="pt-6 border-t border-[#1A1A1A]/5">
              <Button
                type="submit"
                className="w-full bg-[#1A1A1A] text-white hover:bg-yellow-600 hover:text-black font-extrabold py-6 rounded-xl transition-all duration-300 hover:scale-[1.01] shadow-md flex items-center justify-center text-base"
              >
                <Send className="mr-3 h-5 w-5" />
                Simular e Enviar via WhatsApp
              </Button>
              <p className="text-center text-xs text-neutral-400 mt-4 leading-relaxed">
                Após clicar, você será direcionado para o WhatsApp para conversar com nossa engenharia.
              </p>
            </div>
          </form>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-[#1A1A1A]/5 text-center shadow-sm">
            <h4 className="font-bold text-[#1A1A1A] text-sm mb-1">Estudo de Layout</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">Planejamento focado em fluxo, circulação e ergonomia.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-[#1A1A1A]/5 text-center shadow-sm">
            <h4 className="font-bold text-[#1A1A1A] text-sm mb-1">Engenharia Realista 3D</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">Visualize cores, materiais e puxadores fielmente.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-[#1A1A1A]/5 text-center shadow-sm">
            <h4 className="font-bold text-[#1A1A1A] text-sm mb-1">Assessoria Dedicada</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">Acompanhamento contínuo da escolha ao acabamento.</p>
          </div>
        </div>

      </div>
    </div>
  );
}