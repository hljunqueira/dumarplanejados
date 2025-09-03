import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { ArrowLeft, Phone, Mail, MapPin, Clock, Send, CheckCircle, MessageCircle, Instagram } from "lucide-react";
import { Link } from "wouter";

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

  const onSubmit = (data: ContactFormData) => {
    console.log(data);
    
    // Criar mensagem para WhatsApp
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
    { value: "duvidas", label: "Dúvidas sobre Produtos" },
    { value: "pos-venda", label: "Pós-venda/Garantia" },
    { value: "parceria", label: "Parcerias" },
    { value: "outros", label: "Outros Assuntos" }
  ];

  const contactPreferences = [
    { value: "whatsapp", label: "WhatsApp" },
    { value: "telefone", label: "Ligação Telefônica" },
    { value: "email", label: "Email" },
    { value: "qualquer", label: "Qualquer um" }
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 rounded-2xl shadow-2xl p-8 text-center border border-gray-800">
          <div className="bg-blue-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Mensagem Enviada!</h2>
          <p className="text-gray-300 mb-6">
            Sua mensagem foi enviada com sucesso. Nossa equipe entrará em contato em breve.
          </p>
          <div className="space-y-3">
            <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
              <a href="https://wa.me/5548988486827">
                <MessageCircle className="mr-2 h-4 w-4" />
                Continuar no WhatsApp
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-6 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao início
          </Link>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Fale Conosco
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Entre em contato conosco. Estamos prontos para atender você da melhor forma!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Informações de Contato */}
          <div className="space-y-8">
            <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Nossos Contatos</h2>
              
              <div className="space-y-6">
                {/* WhatsApp */}
                <div className="flex items-start space-x-4 p-4 bg-green-900 rounded-xl hover:bg-green-800 transition-colors">
                  <div className="bg-green-600 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">WhatsApp</h3>
                    <p className="text-gray-300 text-sm mb-2">Atendimento rápido e direto</p>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" asChild>
                      <a href="https://wa.me/5548988486827" target="_blank" rel="noopener noreferrer">
                        (48) 98848-6827
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Telefone */}
                <div className="flex items-start space-x-4 p-4 bg-blue-900 rounded-xl">
                  <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">Telefone</h3>
                    <p className="text-gray-300 text-sm mb-2">Ligação direta</p>
                    <p className="font-medium text-blue-400">(48) 98848-6827</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start space-x-4 p-4 bg-purple-900 rounded-xl">
                  <div className="bg-purple-600 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">Email</h3>
                    <p className="text-gray-300 text-sm mb-2">Envie sua mensagem</p>
                    <p className="font-medium text-purple-400">contato@dumarplanejados.com.br</p>
                  </div>
                </div>

                {/* Instagram */}
                <div className="flex items-start space-x-4 p-4 bg-pink-900 rounded-xl hover:bg-pink-800 transition-colors">
                  <div className="bg-gradient-to-r from-pink-600 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Instagram className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">Instagram</h3>
                    <p className="text-gray-300 text-sm mb-2">Veja nossos projetos</p>
                    <Button size="sm" variant="outline" className="border-pink-400 text-pink-400 hover:bg-pink-900" asChild>
                      <a href="https://instagram.com/dumarplanejados" target="_blank" rel="noopener noreferrer">
                        @dumarplanejados
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Horário de Funcionamento */}
            <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Clock className="mr-3 h-6 w-6 text-blue-400" />
                Horário de Atendimento
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="font-medium text-gray-300">Segunda a Sexta</span>
                  <span className="text-gray-400">08:00 - 18:00</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="font-medium text-gray-300">Sábado</span>
                  <span className="text-gray-400">08:00 - 12:00</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium text-gray-300">Domingo</span>
                  <span className="text-red-400">Fechado</span>
                </div>
              </div>
            </div>

            {/* Localização */}
            <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <MapPin className="mr-3 h-6 w-6 text-blue-400" />
                Nossa Localização
              </h2>
              <div className="space-y-4">
                <p className="text-gray-300">
                  <strong className="text-white">Dumar Planejados</strong><br />
                  Balneário Arroio do Silva - SC<br />
                  Atendemos toda a região
                </p>
                <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800" asChild>
                  <a href="https://maps.google.com/?q=Balneário+Arroio+do+Silva+SC" target="_blank" rel="noopener noreferrer">
                    <MapPin className="mr-2 h-4 w-4" />
                    Ver no Google Maps
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Formulário de Contato */}
          <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Envie sua Mensagem</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Nome e Telefone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nome Completo *</label>
                  <Input
                    {...register("name", { required: "Nome é obrigatório" })}
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-800 text-white rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-900 transition-all placeholder-gray-400"
                  />
                  {errors.name && <span className="text-red-400 text-sm mt-1">{errors.name.message}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Telefone/WhatsApp *</label>
                  <Input
                    type="tel"
                    {...register("phone", { required: "Telefone é obrigatório" })}
                    placeholder="(48) 99999-9999"
                    className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-800 text-white rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-900 transition-all placeholder-gray-400"
                  />
                  {errors.phone && <span className="text-red-400 text-sm mt-1">{errors.phone.message}</span>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <Input
                  type="email"
                  {...register("email")}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-800 text-white rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-900 transition-all placeholder-gray-400"
                />
              </div>

              {/* Assunto */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Assunto *</label>
                <select
                  {...register("subject", { required: "Assunto é obrigatório" })}
                  className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-800 text-white rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-900 transition-all"
                >
                  <option value="" className="bg-gray-800 text-gray-400">Selecione o assunto</option>
                  {subjects.map((subject) => (
                    <option key={subject.value} value={subject.label} className="bg-gray-800 text-white">
                      {subject.label}
                    </option>
                  ))}
                </select>
                {errors.subject && <span className="text-red-400 text-sm mt-1">{errors.subject.message}</span>}
              </div>

              {/* Preferência de Contato */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Como prefere ser contatado? *</label>
                <select
                  {...register("contactPreference", { required: "Preferência de contato é obrigatória" })}
                  className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-800 text-white rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-900 transition-all"
                >
                  <option value="" className="bg-gray-800 text-gray-400">Selecione sua preferência</option>
                  {contactPreferences.map((pref) => (
                    <option key={pref.value} value={pref.label} className="bg-gray-800 text-white">
                      {pref.label}
                    </option>
                  ))}
                </select>
                {errors.contactPreference && <span className="text-red-400 text-sm mt-1">{errors.contactPreference.message}</span>}
              </div>

              {/* Mensagem */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sua Mensagem *</label>
                <Textarea
                  {...register("message", { required: "Mensagem é obrigatória" })}
                  placeholder="Descreva sua necessidade, dúvida ou solicitação..."
                  className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-800 text-white rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-900 transition-all min-h-[120px] placeholder-gray-400"
                />
                {errors.message && <span className="text-red-400 text-sm mt-1">{errors.message.message}</span>}
              </div>

              {/* Botão de Envio */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-4 px-8 rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-xl hover:scale-105 group"
                >
                  <Send className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  Enviar Mensagem
                </Button>
                <p className="text-center text-sm text-gray-400 mt-4">
                  Ao enviar, você será redirecionado para o WhatsApp para continuarmos a conversa.
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Chamada para Ação */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white border border-gray-700">
          <h2 className="text-2xl font-bold mb-4">Precisa de Atendimento Imediato?</h2>
          <p className="text-blue-200 mb-6 max-w-2xl mx-auto">
            Para atendimento mais rápido, entre em contato diretamente pelo WhatsApp. 
            Estamos online e prontos para ajudar!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white" asChild>
              <a href="https://wa.me/5548988486827?text=Olá! Preciso de atendimento imediato.">
                <MessageCircle className="mr-2 h-5 w-5" />
                WhatsApp Direto
              </a>
            </Button>
            <Button size="lg" variant="outline" className="bg-gray-800 text-blue-400 border-blue-400 hover:bg-gray-700" asChild>
              <Link href="/orcamento">
                Solicitar Orçamento
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}