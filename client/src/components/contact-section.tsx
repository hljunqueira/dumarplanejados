import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Phone, Send, MessageCircle, MapPin, Mail } from "lucide-react";
import { Link } from "wouter";

export default function ContactSection() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data: any) => {
    console.log(data);
    // Aqui você pode implementar o envio do formulário
  };

  return (
    <section id="contato" className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 via-white to-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header melhorado */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Quer um ambiente sob medida?
          </h2>
          <p className="text-xl sm:text-2xl text-gray-600 mb-6 font-medium">
            Fale conosco agora mesmo.
          </p>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Atendemos Balneário Arroio do Silva e região — consulte disponibilidade no WhatsApp
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
          {/* Formulário - Card melhorado */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-10 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center mr-4">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Envie sua mensagem</h3>
                <p className="text-gray-600">Preencha o formulário abaixo</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome completo *
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                  {...register("name", { required: true })}
                />
                {errors.name && <span className="text-red-500 text-sm">Nome é obrigatório</span>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone/WhatsApp *
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(48) 99999-9999"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                  {...register("phone", { required: true })}
                />
                {errors.phone && <span className="text-red-500 text-sm">Telefone é obrigatório</span>}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem
                </label>
                <Textarea
                  id="message"
                  placeholder="Conte-nos sobre seu projeto..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 min-h-[120px]"
                  {...register("message")}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-xl hover:scale-105 group"
              >
                <Send className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                Enviar Mensagem
              </Button>
            </form>
          </div>

          {/* WhatsApp Direto - Card melhorado */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 sm:p-10 text-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center mb-6">
              <div className="bg-white/20 backdrop-blur-sm w-12 h-12 rounded-xl flex items-center justify-center mr-4">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">WhatsApp Direto</h3>
                <p className="text-green-100 font-medium">Resposta rápida garantida</p>
              </div>
            </div>

            <p className="text-green-100 mb-8 leading-relaxed">
              Para atendimento imediato, fale diretamente conosco pelo WhatsApp. 
              Nossa equipe está pronta para tirar suas dúvidas e fazer seu orçamento.
            </p>

            <div className="space-y-4">
              <div className="space-y-3">
                <Button
                  className="w-full bg-white text-green-600 hover:bg-green-50 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-xl hover:scale-105 group"
                  asChild
                >
                  <a href="https://wa.me/5548988486827?text=Olá! Quero um orçamento para móveis planejados sob medida.">
                    <Phone className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    (48) 98848-6827
                  </a>
                </Button>
                <Button 
                  variant="outline"
                  className="w-full border-white/30 text-white hover:bg-white/10 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300"
                  asChild
                >
                  <Link href="/contato">
                    <Mail className="mr-2 h-5 w-5" />
                    Página de Contato
                  </Link>
                </Button>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-green-200" />
                  <span className="text-green-100">Balneário Arroio do Silva, SC</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="mt-12 sm:mt-16 text-center">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Atendimento Local</h4>
              <p className="text-gray-600 text-sm">Balneário Arroio do Silva e região</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Resposta Rápida</h4>
              <p className="text-gray-600 text-sm">WhatsApp com resposta imediata</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Orçamento Grátis</h4>
              <p className="text-gray-600 text-sm">Solicite sem compromisso</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
