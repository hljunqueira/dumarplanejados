import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { ArrowLeft, Calculator, Phone, Send, CheckCircle, Home, Sofa, Bath, ChefHat } from "lucide-react";
import { Link } from "wouter";

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

export default function BudgetPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch } = useForm<BudgetFormData>();
  const selectedRooms = watch("rooms") || [];

  const onSubmit = (data: BudgetFormData) => {
    console.log(data);
    
    // Criar mensagem para WhatsApp
    const message = `🏠 *SOLICITAÇÃO DE ORÇAMENTO*\n\n` +
      `👤 *Nome:* ${data.name}\n` +
      `📧 *Email:* ${data.email}\n` +
      `📱 *Telefone:* ${data.phone}\n` +
      `📍 *Endereço:* ${data.address}\n\n` +
      `🏗️ *Tipo de Projeto:* ${data.projectType}\n` +
      `🏠 *Ambientes:* ${Array.isArray(data.rooms) ? data.rooms.join(", ") : data.rooms}\n` +
      `💰 *Orçamento:* ${data.budget}\n` +
      `⏰ *Prazo:* ${data.timeline}\n` +
      `📋 *Possui plantas:* ${data.hasPlans ? "Sim" : "Não"}\n\n` +
      `📝 *Descrição do projeto:*\n${data.description}\n\n` +
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
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 rounded-2xl shadow-2xl p-8 text-center border border-gray-700">
          <div className="bg-green-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Orçamento Enviado!</h2>
          <p className="text-gray-300 mb-6">
            Seu orçamento foi enviado com sucesso. Nossa equipe entrará em contato em breve para agendar uma visita técnica gratuita.
          </p>
          <div className="space-y-3">
            <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
              <a href="https://wa.me/5548988486827">
                <Phone className="mr-2 h-4 w-4" />
                Falar no WhatsApp
              </a>
            </Button>
            <Button variant="outline" className="w-full" asChild>
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
    <div className="min-h-screen bg-black py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-6 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao início
          </Link>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Calculator className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Solicitar Orçamento
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Preencha o formulário abaixo e receba um orçamento personalizado para seu projeto de móveis planejados.
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-8 sm:p-12">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Dados Pessoais */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <div className="bg-blue-900 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-blue-400 font-bold">1</span>
                </div>
                Dados Pessoais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nome Completo *</label>
                  <Input
                    {...register("name", { required: "Nome é obrigatório" })}
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-800 text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all placeholder-gray-400"
                  />
                  {errors.name && <span className="text-red-500 text-sm mt-1">{errors.name.message}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                  <Input
                    type="email"
                    {...register("email", { required: "Email é obrigatório" })}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-800 text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all placeholder-gray-400"
                  />
                  {errors.email && <span className="text-red-500 text-sm mt-1">{errors.email.message}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Telefone/WhatsApp *</label>
                  <Input
                    type="tel"
                    {...register("phone", { required: "Telefone é obrigatório" })}
                    placeholder="(48) 99999-9999"
                    className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-800 text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all placeholder-gray-400"
                  />
                  {errors.phone && <span className="text-red-500 text-sm mt-1">{errors.phone.message}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Endereço *</label>
                  <Input
                    {...register("address", { required: "Endereço é obrigatório" })}
                    placeholder="Cidade, bairro"
                    className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-800 text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all placeholder-gray-400"
                  />
                  {errors.address && <span className="text-red-500 text-sm mt-1">{errors.address.message}</span>}
                </div>
              </div>
            </div>

            {/* Detalhes do Projeto */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <div className="bg-purple-900 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-purple-400 font-bold">2</span>
                </div>
                Detalhes do Projeto
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Projeto *</label>
                  <select
                    {...register("projectType", { required: "Tipo de projeto é obrigatório" })}
                    className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-800 text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    <option value="">Selecione o tipo de projeto</option>
                    <option value="Móveis novos">Móveis novos</option>
                    <option value="Reforma completa">Reforma completa</option>
                    <option value="Complementar móveis existentes">Complementar móveis existentes</option>
                    <option value="Projeto comercial">Projeto comercial</option>
                  </select>
                  {errors.projectType && <span className="text-red-500 text-sm mt-1">{errors.projectType.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4">Ambientes que deseja mobiliar *</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {roomOptions.map((room) => {
                      const Icon = room.icon;
                      return (
                        <label key={room.id} className="flex items-center space-x-2 p-3 border-2 border-gray-600 bg-gray-800 rounded-xl hover:border-blue-400 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            value={room.id}
                            {...register("rooms", { required: "Selecione pelo menos um ambiente" })}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <Icon className="h-4 w-4 text-gray-300" />
                          <span className="text-sm font-medium text-gray-300">{room.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  {errors.rooms && <span className="text-red-500 text-sm mt-1">{errors.rooms.message}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Orçamento Estimado</label>
                    <select
                      {...register("budget")}
                      className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-800 text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    >
                      <option value="">Selecione uma faixa</option>
                      <option value="Até R$ 10.000">Até R$ 10.000</option>
                      <option value="R$ 10.000 - R$ 25.000">R$ 10.000 - R$ 25.000</option>
                      <option value="R$ 25.000 - R$ 50.000">R$ 25.000 - R$ 50.000</option>
                      <option value="R$ 50.000 - R$ 100.000">R$ 50.000 - R$ 100.000</option>
                      <option value="Acima de R$ 100.000">Acima de R$ 100.000</option>
                      <option value="Não tenho ideia">Não tenho ideia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Prazo Desejado</label>
                    <select
                      {...register("timeline")}
                      className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-800 text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    >
                      <option value="">Selecione um prazo</option>
                      <option value="Urgente (até 30 dias)">Urgente (até 30 dias)</option>
                      <option value="1-2 meses">1-2 meses</option>
                      <option value="3-4 meses">3-4 meses</option>
                      <option value="5-6 meses">5-6 meses</option>
                      <option value="Mais de 6 meses">Mais de 6 meses</option>
                      <option value="Flexível">Flexível</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register("hasPlans")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-300">Já possuo plantas ou medidas do ambiente</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Descrição do Projeto</label>
                  <Textarea
                    {...register("description")}
                    placeholder="Descreva seu projeto, estilo preferido, necessidades específicas, inspirações..."
                    className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-800 text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all min-h-[120px] placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Botão de Envio */}
            <div className="pt-6 border-t border-gray-700">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-8 rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-xl hover:scale-105 group"
              >
                <Send className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                Enviar Solicitação de Orçamento
              </Button>
              <p className="text-center text-sm text-gray-400 mt-4">
                Ao enviar, você será redirecionado para o WhatsApp com suas informações preenchidas.
              </p>
            </div>
          </form>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-700 text-center">
            <div className="bg-green-900 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
            <h4 className="font-bold text-white mb-2">Visita Técnica Gratuita</h4>
            <p className="text-gray-300 text-sm">Análise completa do seu espaço sem custo</p>
          </div>
          
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-700 text-center">
            <div className="bg-blue-900 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Calculator className="h-6 w-6 text-blue-400" />
            </div>
            <h4 className="font-bold text-white mb-2">Orçamento Detalhado</h4>
            <p className="text-gray-300 text-sm">Projeto 3D e valores transparentes</p>
          </div>
          
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-700 text-center">
            <div className="bg-purple-900 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Phone className="h-6 w-6 text-purple-400" />
            </div>
            <h4 className="font-bold text-white mb-2">Atendimento Personalizado</h4>
            <p className="text-gray-300 text-sm">Acompanhamento em todas as etapas</p>
          </div>
        </div>
      </div>
    </div>
  );
}