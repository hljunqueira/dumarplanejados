import { MapPin, Instagram, Phone, ExternalLink } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import logoDumarWhite from "@/assets/logo1.jpeg";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative">
                  <img 
                    src={logoDumarWhite} 
                    alt="Dumar Móveis Planejados" 
                    className="h-12 w-auto object-contain"
                  />
                </div>
                <div>
                  <div className="text-white font-bold text-2xl tracking-tight">Dumar</div>
                  <div className="text-white/70 text-sm font-medium">Móveis Planejados</div>
                </div>
              </div>
              <p className="text-white/80 leading-relaxed text-lg mb-8 max-w-md">
                Especialistas em móveis planejados de alto padrão, transformando ambientes 
                com tecnologia exclusiva e atendimento personalizado. Nossa equipe experiente 
                garante qualidade e excelência em cada projeto.
              </p>
              {/* CTA Button */}
              <Button 
                asChild 
                className="bg-[#5dc722] text-white hover:bg-green-600 px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg"
              >
                <Link 
                  href="/orcamento"
                  className="flex items-center space-x-2"
                >
                  <SiWhatsapp className="h-5 w-5" />
                  <span>Solicitar Orçamento</span>
                </Link>
              </Button>
            </div>
            {/* Quick Links */}
            <div>
              <h4 className="text-xl font-bold mb-6 text-white">Navegação</h4>
              <div className="space-y-3">
                <a 
                  href="#inicio" 
                  className="block text-white/70 hover:text-white transition-colors text-lg hover:translate-x-1 transform duration-200"
                >
                  Início
                </a>
                <a 
                  href="#sobre" 
                  className="block text-white/70 hover:text-white transition-colors text-lg hover:translate-x-1 transform duration-200"
                >
                  Sobre Nós
                </a>
                <a 
                  href="#portfolio" 
                  className="block text-white/70 hover:text-white transition-colors text-lg hover:translate-x-1 transform duration-200"
                >
                  Portfólio
                </a>
                <a 
                  href="#contato" 
                  className="block text-white/70 hover:text-white transition-colors text-lg hover:translate-x-1 transform duration-200"
                >
                  Contato
                </a>
              </div>
            </div>
            {/* Contact Info */}
            <div>
              <h4 className="text-xl font-bold mb-6 text-white">Contato</h4>
              <div className="space-y-4">
                <div className="flex items-center group cursor-pointer">
                  <div className="bg-white/10 p-2 rounded-lg mr-4 group-hover:bg-white/20 transition-colors">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">WhatsApp</p>
                    <a 
                      href="https://wa.me/5548988486827"
                      className="text-white/70 hover:text-white transition-colors"
                    >
                      (48) 98848-6827
                    </a>
                  </div>
                </div>
                <div className="flex items-center group">
                  <div className="bg-white/10 p-2 rounded-lg mr-4 group-hover:bg-white/20 transition-colors">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Localização</p>
                    <p className="text-white/70">Balneário Arroio do Silva</p>
                  </div>
                </div>
                <div className="flex items-center group">
                  <div className="bg-white/10 p-2 rounded-lg mr-4 group-hover:bg-white/20 transition-colors">
                    <Instagram className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Instagram</p>
                    <a 
                      href="https://www.instagram.com/dumar_moveis_planejados/" 
                      className="text-white/70 hover:text-white transition-colors flex items-center"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      @dumar_moveis_planejados
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Bottom Bar */}
        <div className="border-t border-white/20 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-white/60 text-sm mb-4 md:mb-0">
              © 2025 Dumar Móveis Planejados Ltda. Todos os direitos reservados. Desenvolvedor Henrique Junqueira
            </p>
            <div className="flex items-center space-x-6">
              <a 
                href="https://www.instagram.com/dumar_moveis_planejados/" 
                className="text-white/60 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://wa.me/5548988486827" 
                className="text-white/60 hover:text-white transition-colors"
                aria-label="WhatsApp"
              >
                <SiWhatsapp className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
