import { Button } from "@/components/ui/button";
import { Settings, UserCheck, Star } from "lucide-react";

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
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://images.unsplash.com/photo-1556912173-3bb406ef7e77?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2000&h=1200')`
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <Settings className="h-12 w-12 mb-4 text-yellow-400 mx-auto" />
            <h3 className="font-bold text-lg mb-2">Tecnologia Exclusiva</h3>
            <p className="text-white/80">Equipamentos de última geração para precisão milimétrica</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <UserCheck className="h-12 w-12 mb-4 text-yellow-400 mx-auto" />
            <h3 className="font-bold text-lg mb-2">Atendimento Personalizado</h3>
            <p className="text-white/80">Consultoria completa do projeto à instalação</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <Star className="h-12 w-12 mb-4 text-yellow-400 mx-auto" />
            <h3 className="font-bold text-lg mb-2">Alta Qualidade e Design</h3>
            <p className="text-white/80">Materiais premium e design exclusivo para cada cliente</p>
          </div>
        </div>
      </div>
    </section>
  );
}
