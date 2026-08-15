import { Button } from "@/components/ui/button";
import { MapPin, Instagram, Users, Shield, Phone, X } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useState } from "react";
import fotoSobre from "@/assets/cozinha2.jpeg";

export default function AboutSection() {
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  return (
    <section id="sobre" className="relative py-24 md:py-32 bg-[#FDFBF7] text-[#1A1A1A] overflow-hidden border-t border-neutral-200">
      {/* Elementos de design sutis */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-80 h-80 bg-amber-200/30 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 lg:px-8">
        
        {/* Cabeçalho de Seção Minimalista */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 md:mb-24 gap-6">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1A1A1A]">
              Especialistas em <br />
              <span className="text-[#f97316]">Móveis de Alto Padrão</span>
            </h2>
          </div>
          <div className="max-w-md">
            <p className="text-neutral-600 text-base md:text-lg leading-relaxed">
              Aliamos design contemporâneo, matérias-primas nobres e precisão industrial para dar vida a ambientes residenciais e comerciais inconfundíveis.
            </p>
          </div>
        </div>

        {/* Grade de Conteúdo Assimétrica */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Lado Esquerdo: Imagem Conceitual com Moldura Elegante */}
          <div className="lg:col-span-5 relative group">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 aspect-[4/5]">
              <img 
                src={fotoSobre} 
                alt="Detalhe de marcenaria fina da Dumar" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
              
              <div className="absolute bottom-6 left-6 right-6 p-6 bg-white/95 backdrop-blur-md rounded-xl border border-neutral-200 shadow-xl">
                <span className="text-xs font-bold text-[#f97316] uppercase tracking-widest block mb-1">Qualidade sem concessões</span>
                <p className="text-xs text-neutral-600">Cada junção, puxador e acabamento é inspecionado sob o mais alto padrão de exigência.</p>
              </div>
            </div>
          </div>

          {/* Lado Direito: Filosofia & Diferenciais */}
          <div className="lg:col-span-7 space-y-8 lg:pl-6">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Nossa Filosofia</h3>
              <p className="text-neutral-700 leading-relaxed">
                Acreditamos que o mobiliário planejado não deve apenas ocupar um espaço, mas sim valorizá-lo. Cada projeto assinado pela Dumar é concebido de forma única, respeitando a ergonomia, a funcionalidade do cotidiano e a estética de alta decoração.
              </p>
            </div>

            {/* Grid de Atributos Minimalista */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center mb-3">
                  <Users className="h-5 w-5 text-[#f97316]" />
                </div>
                <h4 className="font-bold text-[#1A1A1A] mb-1 text-base">Atendimento Técnico</h4>
                <p className="text-xs text-neutral-600">Consultores com profundo conhecimento de marcenaria de ponta.</p>
              </div>

              <div className="p-6 bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center mb-3">
                  <Shield className="h-5 w-5 text-[#f97316]" />
                </div>
                <h4 className="font-bold text-[#1A1A1A] mb-1 text-base">Garantia Assistida</h4>
                <p className="text-xs text-neutral-600">Suporte pós-venda completo para garantir sua total satisfação.</p>
              </div>
            </div>

            {/* Ações e Links */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-neutral-200">
              <Button 
                asChild 
                className="bg-black hover:bg-neutral-800 text-white font-extrabold px-6 py-5 rounded-xl transition-all duration-300 shadow-lg"
              >
                <a 
                  href="https://www.instagram.com/dumar_moveis_planejados/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <Instagram className="h-4 w-4 mr-2" />
                  <span>Instagram</span>
                </a>
              </Button>
              <Button 
                variant="outline" 
                asChild 
                className="border-neutral-300 bg-white text-[#1A1A1A] hover:bg-neutral-100 font-bold px-6 py-5 rounded-xl transition-all duration-300"
              >
                <a 
                  href="https://wa.me/5548988486827"
                  className="flex items-center"
                >
                  <SiWhatsapp className="h-4 w-4 mr-2" />
                  <span>WhatsApp</span>
                </a>
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsLocationModalOpen(true)}
                className="text-neutral-700 hover:text-black font-semibold transition-colors duration-300"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Ver Showroom
              </Button>
            </div>

          </div>

        </div>
      </div>

      {/* Modal de Localização */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto text-[#1A1A1A]">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mr-4 border border-amber-500/20">
                    <MapPin className="h-6 w-6 text-[#f97316]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#1A1A1A]">Nossa Localização</h3>
                    <p className="text-xs text-neutral-500">Balneário Arroio do Silva, Santa Catarina</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="text-neutral-500 hover:text-black"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-neutral-100 p-4 rounded-xl border border-neutral-200 space-y-2">
                <h4 className="font-bold text-sm text-[#1A1A1A]">Endereço Showroom & Fábrica:</h4>
                <p className="text-sm text-neutral-700">
                  Av. Santa Catarina, 551 sala 205<br />
                  Centro - Balneário Arroio do Silva - SC
                </p>
              </div>

              <div className="w-full h-80 rounded-2xl overflow-hidden border border-neutral-200 shadow-inner">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3488.223842183204!2d-49.421689!3d-28.983796!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95222e8964722883%3A0xb36b5ec632551a02!2sR.%20Manuel%20Teodoro%20de%20In%C3%A1cio%2C%20477%20-%20Centro%2C%20Balne%C3%A1rio%20Arroio%20do%20Silva%20-%20SC%2C%2088914-000!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 bg-neutral-50 flex justify-end">
              <Button 
                onClick={() => setIsLocationModalOpen(false)}
                className="bg-black hover:bg-neutral-800 text-white font-bold px-6"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
