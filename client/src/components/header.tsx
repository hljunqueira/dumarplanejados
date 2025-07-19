import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-black font-bold text-xl">Dumar</div>
              <div className="text-gray-600 text-sm">Móveis Planejados</div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#inicio" className="text-black hover:text-gray-600 transition-colors font-medium">
              Início
            </a>
            <a href="#sobre" className="text-black hover:text-gray-600 transition-colors font-medium">
              Sobre
            </a>
            <a href="#portfolio" className="text-black hover:text-gray-600 transition-colors font-medium">
              Portfólio
            </a>
            <a href="#contato" className="text-black hover:text-gray-600 transition-colors font-medium">
              Contato
            </a>
            <Button asChild className="bg-black text-white hover:bg-gray-700">
              <a href="https://wa.me/554898486827?text=Olá! Gostaria de conhecer mais sobre os móveis planejados da Dumar.">
                WhatsApp
              </a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 mt-4 py-4">
            <div className="flex flex-col space-y-4">
              <a 
                href="#inicio" 
                className="text-black hover:text-gray-600 transition-colors font-medium"
                onClick={handleLinkClick}
              >
                Início
              </a>
              <a 
                href="#sobre" 
                className="text-black hover:text-gray-600 transition-colors font-medium"
                onClick={handleLinkClick}
              >
                Sobre
              </a>
              <a 
                href="#portfolio" 
                className="text-black hover:text-gray-600 transition-colors font-medium"
                onClick={handleLinkClick}
              >
                Portfólio
              </a>
              <a 
                href="#contato" 
                className="text-black hover:text-gray-600 transition-colors font-medium"
                onClick={handleLinkClick}
              >
                Contato
              </a>
              <Button asChild className="bg-black text-white hover:bg-gray-700 w-full">
                <a href="https://wa.me/554898486827?text=Olá! Gostaria de conhecer mais sobre os móveis planejados da Dumar.">
                  WhatsApp
                </a>
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
