import { Button } from "@/components/ui/button";
import { CheckCircle, MapPin } from "lucide-react";

export default function AboutSection() {
  return (
    <section id="sobre" className="py-20 dumar-light">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Sobre a Dumar</h2>
            <p className="text-lg dumar-accent mb-6 leading-relaxed">
              A Dumar Móveis Planejados é especializada em criar ambientes únicos e funcionais, 
              transformando sonhos em realidade através de móveis sob medida de alto padrão.
            </p>
            <p className="text-lg dumar-accent mb-6 leading-relaxed">
              Com experiência consolidada no mercado, utilizamos tecnologia exclusiva e oferecemos 
              atendimento personalizado para cada projeto, garantindo qualidade superior e design 
              inovador em cada detalhe.
            </p>
            
            {/* Features List */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-lg">Mais de 10 anos de experiência</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-lg">Tecnologia de ponta em marcenaria</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-lg">Garantia total em todos os projetos</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-lg">Atendimento em toda a região</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button asChild className="bg-black text-white hover:bg-gray-700">
                <a href="https://www.instagram.com/dumar_moveis_planejados/" target="_blank" rel="noopener noreferrer">
                  Siga no Instagram
                </a>
              </Button>
              <Button variant="outline" asChild className="border-black text-black hover:bg-black hover:text-white">
                <a href="https://wa.me/554898486827">
                  WhatsApp
                </a>
              </Button>
            </div>
          </div>

          <div>
            {/* Company Image */}
            <img 
              src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
              alt="Escritório elegante com móveis planejados" 
              className="rounded-2xl shadow-2xl w-full h-auto mb-8"
            />
            
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
