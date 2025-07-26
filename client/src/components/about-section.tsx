import { Button } from "@/components/ui/button";
import { CheckCircle, MapPin, Instagram, Users, Clock, Shield, Star, Phone, Calendar, Truck, CheckSquare } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

export default function AboutSection() {
  return (
    <section id="sobre" className="relative py-20 sm:py-32 bg-gradient-to-br from-gray-50 via-white to-slate-50">
      {/* Elementos decorativos sutis */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-100 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium mb-6">
            <Star className="w-4 h-4 mr-2" />
            Sobre a Dumar
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
            Especialistas em <span className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">Móveis Planejados</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Transformando sonhos em realidade através de móveis sob medida de alto padrão, 
            com tecnologia exclusiva e atendimento personalizado.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">
                  Nossa Missão
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  Criar ambientes únicos e funcionais que superem as expectativas de nossos clientes, 
                  oferecendo soluções personalizadas que combinam design, funcionalidade e qualidade.
                </p>
                
                {/* Destaque sobre a empresa */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-6 border border-yellow-200">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm mr-3">
                      Nova Empresa
                    </span>
                    Empresa Criada em 2025
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    A Dumar foi criada em 2025, mas nossa equipe é formada por especialistas 
                    com anos de experiência no mercado de móveis planejados. Combinamos a 
                    inovação de uma empresa nova com a expertise de profissionais experientes.
                  </p>
                </div>
                
                <p className="text-base text-gray-600 leading-relaxed">
                  Utilizamos tecnologia exclusiva e oferecemos atendimento personalizado para cada projeto, 
                  garantindo qualidade superior e design inovador em cada detalhe.
                </p>
              </div>
              
              {/* Features Grid - Design moderno */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Especialistas Experientes</h4>
                    <p className="text-sm text-gray-600">Equipe com anos de experiência no mercado</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Garantia Total</h4>
                    <p className="text-sm text-gray-600">Qualidade garantida em todos os projetos</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Atendimento Regional</h4>
                    <p className="text-sm text-gray-600">Balneário Arroio do Silva e região</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Design Exclusivo</h4>
                    <p className="text-sm text-gray-600">Projetos únicos para cada cliente</p>
                  </div>
                </div>
              </div>

              {/* Social Links - Design moderno */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button 
                  asChild 
                  className="group bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg shadow-md"
                >
                  <a 
                    href="https://www.instagram.com/dumar_moveis_planejados/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center"
                  >
                    <Instagram className="h-5 w-5 mr-2" />
                    <span>Siga no Instagram</span>
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  asChild 
                  className="group border-2 border-gray-800 bg-white text-gray-800 hover:bg-gray-900 hover:text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-md"
                >
                  <a 
                    href="https://wa.me/554898486827"
                    className="flex items-center justify-center"
                  >
                    <SiWhatsapp className="h-5 w-5 mr-2" />
                    <span>Falar no WhatsApp</span>
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            {/* Location Card - Design moderno */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Nossa Localização</h3>
                <p className="text-gray-600 font-medium">
                  Balneário Arroio do Silva e região
                </p>
              </div>
              
              {/* Google Maps Embed */}
              <div className="rounded-xl overflow-hidden shadow-lg">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3598.9810786!2d-49.4223242!3d-28.9810786!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x952233f170c4dd17%3A0xbace300c22b9a705!2sDumar%20M%C3%B3veis%20Planejados%20Ltda!5e0!3m2!1spt!2sbr!4v1642789123456!5m2!1spt!2sbr" 
                  width="100%" 
                  height="250" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localização da Dumar Móveis Planejados"
                  className="rounded-xl"
                />
              </div>
              
              {/* Informações adicionais */}
              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-2">Atendimento Personalizado</h4>
                <p className="text-sm text-gray-600">
                  Visita técnica gratuita para análise do seu espaço e elaboração do projeto sob medida.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
