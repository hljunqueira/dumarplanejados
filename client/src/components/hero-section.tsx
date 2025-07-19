import { Button } from "@/components/ui/button";
import { Settings, UserCheck, Star, Award, Clock, Sparkles } from "lucide-react";
import heroImage from "@assets/WhatsApp Image 2025-07-19 at 10.07.32_1752931725313.jpeg";

export default function HeroSection() {
  return (
    <section 
      id="inicio" 
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.3)), url(${heroImage})`
        }}
      />
      
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          Transforme seu ambiente<br />
          <span className="text-white/90">com móveis planejados</span><br />
          <span className="text-yellow-400">sob medida</span>
        </h1>
        
        <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed">
          Tecnologia exclusiva, atendimento personalizado e alta qualidade em cada projeto. 
          Especializados em cozinhas, closets, banheiros e ambientes completos.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center border border-white/20 hover:bg-white/15 transition-all duration-300 group">
            <div className="bg-yellow-400/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <Settings className="h-8 w-8 text-yellow-400" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-white">Tecnologia Exclusiva</h3>
            <p className="text-white/90 leading-relaxed">Equipamentos de última geração para precisão milimétrica em cada corte e acabamento</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center border border-white/20 hover:bg-white/15 transition-all duration-300 group">
            <div className="bg-yellow-400/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <Award className="h-8 w-8 text-yellow-400" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-white">Mais de 10 Anos</h3>
            <p className="text-white/90 leading-relaxed">Experiência consolidada no mercado com centenas de projetos executados</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center border border-white/20 hover:bg-white/15 transition-all duration-300 group">
            <div className="bg-yellow-400/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="h-8 w-8 text-yellow-400" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-white">Design Exclusivo</h3>
            <p className="text-white/90 leading-relaxed">Projetos únicos desenvolvidos especialmente para cada cliente</p>
          </div>
        </div>
      </div>
    </section>
  );
}
