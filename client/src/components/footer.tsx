import { MapPin, Instagram, Phone, ExternalLink } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import logoDumar from "@/assets/logo1.jpeg";

export default function Footer() {
  return (
    <footer className="bg-black text-white border-t border-white/10">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Company Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center border border-white/20">
                  <img 
                    src={logoDumar} 
                    alt="Dumar Móveis Planejados" 
                    className="w-8 h-8 object-contain rounded-lg"
                  />
                </div>
                <div>
                  <div className="text-white font-bold text-xl tracking-tight">Dumar</div>
                  <div className="text-neutral-400 text-xs font-semibold uppercase tracking-wider">Móveis Planejados</div>
                </div>
              </div>
              
              <p className="text-neutral-400 leading-relaxed text-sm max-w-md">
                Especialistas em móveis planejados de alto padrão. Unimos marcenaria artesanal de alta costura a processos industriais de ponta para criar ambientes residenciais e comerciais de pura sofisticação.
              </p>
              
              {/* CTA Button */}
              <Button 
                asChild 
                className="bg-white text-black hover:bg-neutral-200 font-extrabold px-6 py-5 rounded-xl transition-all duration-300 shadow-lg cursor-pointer"
              >
                <Link 
                  href="/orcamento"
                  className="flex items-center space-x-2"
                >
                  <SiWhatsapp className="h-4 w-4" />
                  <span>Agendar Atendimento</span>
                </Link>
              </Button>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest mb-6 text-white">Navegação</h4>
              <div className="space-y-3 text-sm">
                <a 
                  href="#inicio" 
                  className="block text-neutral-400 hover:text-white transition-colors"
                >
                  Início
                </a>
                <a 
                  href="#sobre" 
                  className="block text-neutral-400 hover:text-white transition-colors"
                >
                  Sobre Nós
                </a>
                <a 
                  href="#portfolio" 
                  className="block text-neutral-400 hover:text-white transition-colors"
                >
                  Portfólio
                </a>
                <a 
                  href="#contato" 
                  className="block text-neutral-400 hover:text-white transition-colors"
                >
                  Contato
                </a>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest mb-6 text-white">Showroom</h4>
              <div className="space-y-4 text-sm">
                <div className="flex items-center group">
                  <div className="bg-white/5 p-2.5 rounded-lg mr-4 border border-white/10 group-hover:border-white/30 transition-all duration-300">
                    <Phone className="h-4 w-4 text-[#f97316]" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">WhatsApp</p>
                    <a 
                      href="https://wa.me/5548988486827"
                      className="text-white hover:text-[#f97316] font-medium transition-colors"
                    >
                      (48) 98848-6827
                    </a>
                  </div>
                </div>

                <div className="flex items-center group">
                  <div className="bg-white/5 p-2.5 rounded-lg mr-4 border border-white/10 group-hover:border-white/30 transition-all duration-300">
                    <MapPin className="h-4 w-4 text-[#f97316]" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Localização</p>
                    <p className="text-white font-medium">Balneário Arroio do Silva, SC</p>
                  </div>
                </div>

                <div className="flex items-center group">
                  <div className="bg-white/5 p-2.5 rounded-lg mr-4 border border-white/10 group-hover:border-white/30 transition-all duration-300">
                    <Instagram className="h-4 w-4 text-[#f97316]" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Instagram</p>
                    <a 
                      href="https://www.instagram.com/dumar_moveis_planejados/" 
                      className="text-white hover:text-[#f97316] font-medium transition-colors flex items-center"
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

        {/* Bottom Bar com Desenvolvido por HLJDEV */}
        <div className="border-t border-white/10 py-8 text-xs text-neutral-400 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-center md:text-left">
            © 2026 Dumar Móveis Planejados Ltda. Todos os direitos reservados.
          </p>
          
          <div className="flex items-center gap-6">
            <p className="text-neutral-400">
              Desenvolvido por{" "}
              <a 
                href="https://www.hljdev.com.br/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-bold text-white hover:text-[#f97316] underline underline-offset-4 transition-colors"
              >
                HLJDEV
              </a>
            </p>

            <div className="flex items-center space-x-4 border-l border-white/10 pl-6">
              <a 
                href="https://www.instagram.com/dumar_moveis_planejados/" 
                className="hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a 
                href="https://wa.me/5548988486827" 
                className="hover:text-white transition-colors"
                aria-label="WhatsApp"
              >
                <SiWhatsapp className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
