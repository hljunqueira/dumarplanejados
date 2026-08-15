import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, User } from "lucide-react";
import { Link } from "wouter";
import logoDumar from "@/assets/logo1.jpeg";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const LINKS = [
    { label: "Início", href: "#inicio" },
    { label: "Sobre", href: "#sobre" },
    { label: "Portfólio", href: "#portfolio" },
    { label: "Vídeos", href: "#videos" },
    { label: "Contato", href: "#contato" },
  ];

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-[#FDFBF7]/95 backdrop-blur-xl border-b border-[#1A1A1A]/5 shadow-sm"
    >
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-20 md:h-24">
          
          {/* Logo */}
          <a href="#inicio" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-[#1A1A1A]/10">
              <img 
                src={logoDumar} 
                alt="Dumar Logo" 
                className="w-8 h-8 object-contain rounded-lg"
              />
            </div>
            <div>
              <div className="text-[#1A1A1A] font-extrabold text-lg tracking-tight">Dumar</div>
              <div className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Móveis Planejados</div>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-7 bg-[#FDFBF7]/85 backdrop-blur-md px-6 py-2.5 rounded-full border border-[#1A1A1A]/5 shadow-sm">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-body text-sm font-extrabold text-[#1A1A1A] hover:text-yellow-600 transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-yellow-600 hover:after:w-full after:transition-all after:duration-300"
              >
                {link.label}
              </a>
            ))}
            <div className="h-4 w-[1px] bg-[#1A1A1A]/10 mx-1" />
            <Link 
              href="/crm"
              className="inline-flex items-center gap-1.5 text-[#1A1A1A] font-body text-sm font-extrabold hover:text-yellow-600 transition-colors"
            >
              <User size={14} /> CRM
            </Link>
          </div>

          {/* Contact Button */}
          <a
            href="#contato"
            className="hidden lg:inline-flex items-center gap-2 bg-[#1A1A1A] text-[#FDFBF7] px-6 py-3 rounded-full font-body text-sm font-semibold hover:bg-yellow-600 hover:text-black transition-colors duration-300"
          >
            <Phone size={15} /> SOLICITAR ORÇAMENTO
          </a>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-[#1A1A1A] p-2"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden overflow-hidden bg-[#FDFBF7] border-t border-[#1A1A1A]/10 rounded-2xl shadow-xl mt-2 p-6">
            <nav className="flex flex-col space-y-4">
              {LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="font-display text-2xl font-bold tracking-tight text-[#1A1A1A]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <hr className="border-[#1A1A1A]/10 my-2" />
              <Link
                href="/crm"
                className="inline-flex items-center gap-2 font-body text-base font-bold text-yellow-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User size={18} /> Portal CRM
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
