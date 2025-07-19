import { Button } from "@/components/ui/button";
import { Settings, UserCheck, Star, Award, Clock, Sparkles } from "lucide-react";
import heroImage from "@assets/WhatsApp Image 2025-07-19 at 10.07.32_1752931725313.jpeg";

export default function HeroSection() {
  return (
    <section 
      id="inicio" 
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
    >
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.4)), url(${heroImage})`,
          backgroundPosition: 'center 30%'
        }}
      />
      
      <div className="relative z-10 container mx-auto px-4 lg:px-8 text-center text-white py-16">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight max-w-4xl mx-auto">
          Transforme seu ambiente<br />
          <span className="text-white/95">com móveis planejados</span><br />
          <span className="text-yellow-400">sob medida</span>
        </h1>
        
        <p className="text-lg md:text-xl lg:text-2xl mb-10 text-white/95 max-w-4xl mx-auto leading-relaxed">
          Tecnologia exclusiva, atendimento personalizado e alta qualidade em cada projeto. 
          Especializados em cozinhas, closets, banheiros e ambientes completos.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button 
            size="lg"
            className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-4 text-lg font-bold transition-all duration-300 hover:shadow-xl hover:scale-105"
            asChild
          >
            <a href="https://wa.me/554898486827?text=Olá! Quero um orçamento para móveis planejados sob medida.">
              Solicitar Orçamento Grátis
            </a>
          </Button>
          <Button 
            variant="outline"
            size="lg"
            className="border-2 border-white text-white hover:bg-white hover:text-black px-8 py-4 text-lg font-bold"
            asChild
          >
            <a href="#portfolio">
              Ver Nossos Projetos
            </a>
          </Button>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20 hover:bg-white/15 transition-all duration-300 group">
            <div className="bg-yellow-400/20 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Settings className="h-7 w-7 text-yellow-400" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-white">Tecnologia Exclusiva</h3>
            <p className="text-white/90 leading-relaxed text-sm">Equipamentos de última geração para precisão milimétrica</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20 hover:bg-white/15 transition-all duration-300 group">
            <div className="bg-yellow-400/20 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Award className="h-7 w-7 text-yellow-400" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-white">Mais de 10 Anos</h3>
            <p className="text-white/90 leading-relaxed text-sm">Experiência consolidada com centenas de projetos</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20 hover:bg-white/15 transition-all duration-300 group">
            <div className="bg-yellow-400/20 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="h-7 w-7 text-yellow-400" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-white">Design Exclusivo</h3>
            <p className="text-white/90 leading-relaxed text-sm">Projetos únicos para cada cliente</p>
          </div>
        </div>
      </div>
    </section>
  );
}
