import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { ArrowLeft, Calendar, Phone, Send, CheckCircle, Clock, MapPin, User } from "lucide-react";
import { Link } from "wouter";

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

  const onSubmit = (data: AppointmentFormData) => {
    console.log(data);
    
    // Criar mensagem para WhatsApp
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
    { value: "apresentacao-projeto", label: "Apresentação de Projeto" },
    { value: "instalacao", label: "Instalação de Móveis" },
    { value: "manutencao", label: "Manutenção/Reparo" },
    { value: "consultoria", label: "Consultoria de Design" }
  ];

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
  ];

  // Função para obter data mínima (hoje)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Função para obter data máxima (3 meses à frente)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 rounded-2xl shadow-2xl p-8 text-center border border-gray-700">
          <div className="bg-green-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Agendamento Enviado!</h2>
          <p className="text-gray-300 mb-6">
            Sua solicitação de agendamento foi enviada com sucesso. Nossa equipe entrará em contato para confirmar o horário.
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
          <Link href="/" className="inline-flex items-center text-orange-400 hover:text-orange-300 mb-6 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao início
          </Link>
          <div className="bg-gradient-to-r from-orange-500 to-yellow-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Agendar Atendimento
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Agende uma visita técnica gratuita ou outro tipo de atendimento. Nossa equipe irá até você!
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-8 sm:p-12">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Dados Pessoais */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <div className="bg-orange-900 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                  <User className="h-4 w-4 text-orange-400" />
                </div>
                Seus Dados
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nome Completo *</label>
                  <Input
                    {...register("name", { required: "Nome é obrigatório" })}
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-white placeholder-gray-400"
                  />
                  {errors.name && <span className="text-red-400 text-sm mt-1">{errors.name.message}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Telefone/WhatsApp *</label>
                  <Input
                    type="tel"
                    {...register("phone", { required: "Telefone é obrigatório" })}
                    placeholder="(48) 99999-9999"
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-white placeholder-gray-400"
                  />
                  {errors.phone && <span className="text-red-400 text-sm mt-1">{errors.phone.message}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <Input
                    type="email"
                    {...register("email")}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Endereço Completo *</label>
                  <Input
                    {...register("address", { required: "Endereço é obrigatório" })}
                    placeholder="Rua, número, bairro, cidade"
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-white placeholder-gray-400"
                  />
                  {errors.address && <span className="text-red-400 text-sm mt-1">{errors.address.message}</span>}
                </div>
              </div>
            </div>

            {/* Tipo de Serviço */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <div className="bg-yellow-900 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                  <MapPin className="h-4 w-4 text-yellow-400" />
                </div>
                Tipo de Atendimento
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Selecione o tipo de serviço *</label>
                <select
                  {...register("serviceType", { required: "Tipo de serviço é obrigatório" })}
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-white"
                >
                  <option value="" className="bg-gray-800 text-gray-400">Escolha o tipo de atendimento</option>
                  {serviceTypes.map((service) => (
                    <option key={service.value} value={service.label} className="bg-gray-800 text-white">
                      {service.label}
                    </option>
                  ))}
                </select>
                {errors.serviceType && <span className="text-red-400 text-sm mt-1">{errors.serviceType.message}</span>}
              </div>
            </div>

            {/* Agendamento */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <div className="bg-blue-900 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                  <Clock className="h-4 w-4 text-blue-400" />
                </div>
                Data e Horário
              </h3>
              
              <div className="space-y-6">
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                  <h4 className="font-semibold text-white mb-4">Opção Preferencial *</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Data Preferencial *</label>
                      <Input
                        type="date"
                        min={getMinDate()}
                        max={getMaxDate()}
                        {...register("preferredDate", { required: "Data preferencial é obrigatória" })}
                        className="w-full px-4 py-3 bg-gray-600 border-2 border-gray-500 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-white [color-scheme:dark]"
                      />
                      {errors.preferredDate && <span className="text-red-400 text-sm mt-1">{errors.preferredDate.message}</span>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Horário Preferencial *</label>
                      <select
                        {...register("preferredTime", { required: "Horário preferencial é obrigatório" })}
                        className="w-full px-4 py-3 bg-gray-600 border-2 border-gray-500 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-white"
                      >
                        <option value="" className="bg-gray-600 text-gray-300">Selecione um horário</option>
                        {timeSlots.map((time) => (
                          <option key={time} value={time} className="bg-gray-600 text-white">
                            {time}
                          </option>
                        ))}
                      </select>
                      {errors.preferredTime && <span className="text-red-400 text-sm mt-1">{errors.preferredTime.message}</span>}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                  <h4 className="font-semibold text-white mb-4">Opção Alternativa (opcional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Data Alternativa</label>
                      <Input
                        type="date"
                        min={getMinDate()}
                        max={getMaxDate()}
                        {...register("alternativeDate")}
                        className="w-full px-4 py-3 bg-gray-600 border-2 border-gray-500 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-white [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Horário Alternativo</label>
                      <select
                        {...register("alternativeTime")}
                        className="w-full px-4 py-3 bg-gray-600 border-2 border-gray-500 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-white"
                      >
                        <option value="" className="bg-gray-600 text-gray-300">Selecione um horário</option>
                        {timeSlots.map((time) => (
                          <option key={time} value={time} className="bg-gray-600 text-white">
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Observações</label>
                  <Textarea
                    {...register("notes")}
                    placeholder="Informações adicionais, instruções de acesso, preferências de horário..."
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all min-h-[100px] text-white placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Botão de Envio */}
            <div className="pt-6 border-t border-gray-700">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white py-4 px-8 rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-xl hover:scale-105 group"
              >
                <Send className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                Solicitar Agendamento
              </Button>
              <p className="text-center text-sm text-gray-400 mt-4">
                Ao enviar, você será redirecionado para o WhatsApp para confirmação do agendamento.
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
            <h4 className="font-bold text-white mb-2">Atendimento Gratuito</h4>
            <p className="text-gray-300 text-sm">Visita técnica sem custo algum</p>
          </div>
          
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-700 text-center">
            <div className="bg-orange-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <h4 className="font-bold text-white mb-2">Horário Flexível</h4>
            <p className="text-gray-300 text-sm">Atendemos de segunda a sábado</p>
          </div>
          
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-700 text-center">
            <div className="bg-blue-900 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-6 w-6 text-blue-400" />
            </div>
            <h4 className="font-bold text-white mb-2">Atendimento Local</h4>
            <p className="text-gray-300 text-sm">Balneário Arroio do Silva e região</p>
          </div>
        </div>
      </div>
    </div>
  );
}