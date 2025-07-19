import { MapPin, Instagram, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-xl">D</span>
              </div>
              <div>
                <div className="text-white font-bold text-xl">Dumar</div>
                <div className="text-white/70 text-sm">Móveis Planejados</div>
              </div>
            </div>
            <p className="text-white/80 leading-relaxed">
              Especialistas em móveis planejados de alto padrão, transformando ambientes 
              com tecnologia exclusiva e atendimento personalizado.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-4">Links Rápidos</h4>
            <div className="space-y-2">
              <a href="#inicio" className="block text-white/80 hover:text-white transition-colors">
                Início
              </a>
              <a href="#sobre" className="block text-white/80 hover:text-white transition-colors">
                Sobre
              </a>
              <a href="#portfolio" className="block text-white/80 hover:text-white transition-colors">
                Portfólio
              </a>
              <a href="#contato" className="block text-white/80 hover:text-white transition-colors">
                Contato
              </a>
              <a 
                href="https://www.instagram.com/dumar_moveis_planejados/" 
                className="block text-white/80 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-bold mb-4">Contato</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-3" />
                <span className="text-white/80">(48) 98848-6827</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-3" />
                <span className="text-white/80">Balneário Arroio do Silva</span>
              </div>
              <div className="flex items-center">
                <Instagram className="h-5 w-5 mr-3" />
                <span className="text-white/80">@dumar_moveis_planejados</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/20 mt-8 pt-8 text-center">
          <p className="text-white/70">
            © 2024 Dumar Móveis Planejados Ltda. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
