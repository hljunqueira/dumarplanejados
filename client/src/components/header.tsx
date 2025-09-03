import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone } from "lucide-react";
import { Link } from "wouter";
import logoDumarWhite from "@/assets/logo1.jpeg";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-black/95 backdrop-blur-md shadow-lg' 
          : 'bg-black/80 backdrop-blur-sm'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-lg flex items-center justify-center">
              <img 
                src={logoDumarWhite} 
                alt="Dumar Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-bold text-lg sm:text-xl">Dumar</div>
              <div className="text-white/80 text-xs sm:text-sm">Móveis Planejados</div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a 
              href="#inicio" 
              className="text-white/90 hover:text-white font-medium transition-colors duration-200 relative group"
            >
              Início
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a 
              href="#sobre" 
              className="text-white/90 hover:text-white font-medium transition-colors duration-200 relative group"
            >
              Sobre
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a 
              href="#portfolio" 
              className="text-white/90 hover:text-white font-medium transition-colors duration-200 relative group"
            >
              Portfólio
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a 
              href="#videos" 
              className="text-white/90 hover:text-white font-medium transition-colors duration-200 relative group"
            >
              Vídeos
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a 
              href="#contato" 
              className="text-white/90 hover:text-white font-medium transition-colors duration-200 relative group"
            >
              Contato
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 transition-all duration-300 group-hover:w-full"></span>
            </a>
          </nav>



          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white p-2"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-md rounded-lg mt-2 p-4 shadow-xl border border-white/10">
            <nav className="flex flex-col space-y-4">
              <a 
                href="#inicio" 
                className="text-white/90 hover:text-white font-medium transition-colors duration-200 py-2 border-b border-white/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Início
              </a>
              <a 
                href="#sobre" 
                className="text-white/90 hover:text-white font-medium transition-colors duration-200 py-2 border-b border-white/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sobre
              </a>
              <a 
                href="#portfolio" 
                className="text-white/90 hover:text-white font-medium transition-colors duration-200 py-2 border-b border-white/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Portfólio
              </a>
              <a 
                href="#videos" 
                className="text-white/90 hover:text-white font-medium transition-colors duration-200 py-2 border-b border-white/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Vídeos
              </a>
              <a 
                href="#contato" 
                className="text-white/90 hover:text-white font-medium transition-colors duration-200 py-2 border-b border-white/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contato
              </a>

            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
