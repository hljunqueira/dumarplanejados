import { Button } from "@/components/ui/button";
import { CheckCircle, MapPin, Instagram } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import aboutImage from "@assets/WhatsApp Image 2025-07-19 at 10.07.37_1752931725315.jpeg";

export default function AboutSection() {
  return (
    <section id="sobre" className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="mb-8">
              <h2 className="text-5xl md:text-6xl font-bold mb-8 text-gray-900 leading-tight">
                Sobre a <span className="text-gray-600">Dumar</span>
              </h2>
              <p className="text-xl text-gray-700 mb-6 leading-relaxed">
                A Dumar Móveis Planejados é especializada em criar ambientes únicos e funcionais, 
                transformando sonhos em realidade através de móveis sob medida de alto padrão.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">Com experiência consolidada no mercado, utilizamos tecnologia exclusiva e oferecemos atendimento personalizado para cada projeto, garantindo qualidade superior e design inovador em cada detalhe.</p>
            </div>
            
            {/* Features List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              <div className="flex items-center bg-white rounded-lg p-4 shadow-sm">
                <CheckCircle className="h-6 w-6 text-green-500 mr-4 flex-shrink-0" />
                <span className="text-gray-800 font-medium">Mais de 10 anos de experiência</span>
              </div>
              <div className="flex items-center bg-white rounded-lg p-4 shadow-sm">
                <CheckCircle className="h-6 w-6 text-green-500 mr-4 flex-shrink-0" />
                <span className="text-gray-800 font-medium">Tecnologia de ponta</span>
              </div>
              <div className="flex items-center bg-white rounded-lg p-4 shadow-sm">
                <CheckCircle className="h-6 w-6 text-green-500 mr-4 flex-shrink-0" />
                <span className="text-gray-800 font-medium">Garantia total</span>
              </div>
              <div className="flex items-center bg-white rounded-lg p-4 shadow-sm">
                <CheckCircle className="h-6 w-6 text-green-500 mr-4 flex-shrink-0" />
                <span className="text-gray-800 font-medium">Atendimento regional</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                asChild 
                className="bg-black text-white hover:bg-gray-800 px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg"
              >
                <a 
                  href="https://www.instagram.com/dumar_moveis_planejados/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2"
                >
                  <Instagram className="h-5 w-5" />
                  <span>Siga no Instagram</span>
                </a>
              </Button>
              <Button 
                variant="outline" 
                asChild 
                className="border-2 border-black text-black hover:bg-black hover:text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300"
              >
                <a 
                  href="https://wa.me/554898486827"
                  className="flex items-center space-x-2"
                >
                  <SiWhatsapp className="h-5 w-5" />
                  <span>WhatsApp</span>
                </a>
              </Button>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            {/* Company Image */}
            <div className="relative">
              <img 
                src={aboutImage}
                alt="Projeto Dumar - Ambiente planejado com móveis sob medida" 
                className="rounded-2xl shadow-2xl w-full h-auto object-cover"
              />
              <div className="absolute -bottom-6 -left-6 bg-black text-white p-6 rounded-xl shadow-xl">
                <p className="text-2xl font-bold">10+</p>
                <p className="text-sm">Anos de Experiência</p>
              </div>
            </div>
            
            {/* Location Map */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold mb-4">Nossa Localização</h3>
              <p className="dumar-accent mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Balneário Arroio do Silva e região
              </p>
              
              {/* Google Maps Embed */}
              <div className="rounded-lg overflow-hidden">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3598.9810786!2d-49.4223242!3d-28.9810786!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x952233f170c4dd17%3A0xbace300c22b9a705!2sDumar%20M%C3%B3veis%20Planejados%20Ltda!5e0!3m2!1spt!2sbr!4v1642789123456!5m2!1spt!2sbr" 
                  width="100%" 
                  height="250" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localização da Dumar Móveis Planejados"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
