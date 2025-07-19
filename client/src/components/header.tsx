import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import dumarLogo from "@assets/logo_dumar_1752931725312.png";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-black/90 backdrop-blur-lg border-b border-gray-700 shadow-lg' 
          : 'bg-black/70 backdrop-blur-sm'
      }`}
    >
      <nav className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img 
                src={dumarLogo} 
                alt="Dumar Móveis Planejados" 
                className="h-12 w-auto object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-bold text-xl tracking-tight">Dumar</div>
              <div className="text-gray-300 text-sm font-medium">Móveis Planejados</div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <a 
              href="#inicio" 
              className="relative text-gray-300 hover:text-white transition-colors font-medium group"
            >
              Início
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
            </a>
            <a 
              href="#sobre" 
              className="relative text-gray-300 hover:text-white transition-colors font-medium group"
            >
              Sobre
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
            </a>
            <a 
              href="#portfolio" 
              className="relative text-gray-300 hover:text-white transition-colors font-medium group"
            >
              Portfólio
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
            </a>
            <a 
              href="#contato" 
              className="relative text-gray-300 hover:text-white transition-colors font-medium group"
            >
              Contato
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
            </a>
          </div>

          {/* CTA Button & Mobile Menu */}
          <div className="flex items-center space-x-4">
            <Button 
              asChild 
              className="hidden sm:flex bg-green-500 text-white hover:bg-green-600 px-6 py-2.5 rounded-lg font-medium transition-all duration-300 hover:shadow-lg"
            >
              <a 
                href="https://wa.me/554898486827?text=Olá! Gostaria de conhecer mais sobre os móveis planejados da Dumar."
                className="flex items-center space-x-2"
              >
                <SiWhatsapp className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-gray-700 rounded-lg"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? 
                <X className="h-6 w-6 text-gray-300" /> : 
                <Menu className="h-6 w-6 text-gray-300" />
              }
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-black/95 backdrop-blur-lg border-t border-gray-700 absolute left-0 right-0 top-20 shadow-lg">
            <div className="container mx-auto px-4 py-6">
              <div className="flex flex-col space-y-4">
                <a 
                  href="#inicio" 
                  className="text-gray-300 hover:text-white transition-colors font-medium py-2 border-b border-gray-700"
                  onClick={handleLinkClick}
                >
                  Início
                </a>
                <a 
                  href="#sobre" 
                  className="text-gray-300 hover:text-white transition-colors font-medium py-2 border-b border-gray-700"
                  onClick={handleLinkClick}
                >
                  Sobre
                </a>
                <a 
                  href="#portfolio" 
                  className="text-gray-300 hover:text-white transition-colors font-medium py-2 border-b border-gray-700"
                  onClick={handleLinkClick}
                >
                  Portfólio
                </a>
                <a 
                  href="#contato" 
                  className="text-gray-300 hover:text-white transition-colors font-medium py-2 border-b border-gray-700"
                  onClick={handleLinkClick}
                >
                  Contato
                </a>
                <Button 
                  asChild 
                  className="bg-black text-white hover:bg-gray-800 mt-4 w-full rounded-lg font-medium"
                >
                  <a 
                    href="https://wa.me/554898486827?text=Olá! Gostaria de conhecer mais sobre os móveis planejados da Dumar."
                    className="flex items-center justify-center space-x-2"
                    onClick={handleLinkClick}
                  >
                    <SiWhatsapp className="h-4 w-4" />
                    <span>Falar no WhatsApp</span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
