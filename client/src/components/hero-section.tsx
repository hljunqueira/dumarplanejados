import { Button } from "@/components/ui/button";
import { Settings, Award, Sparkles, ArrowRight, CheckCircle, Ruler, Clock } from "lucide-react";
import "../index.css";
import fundoPlanejar from "../../assets/fundoplanejar-Ca5UjkM1.png";

export default function HeroSection() {
  return (
    <section 
      id="inicio" 
      className="relative min-h-screen flex items-center justify-center overflow-hidden w-full bg-page-background"
      style={{
        backgroundImage: `url(${fundoPlanejar})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay mais escuro para melhor legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/80"></div>
      
      {/* Fundo semi-transparente para destacar o conteúdo */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40"></div>
      
      {/* Elementos decorativos sutis */}
      <div className="absolute inset-0">
        {/* Círculos decorativos - mais sutis */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        <h1 className="text-4xl xs:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 leading-tight max-w-6xl mx-auto">
          <span className="text-white drop-shadow-2xl font-extrabold">SEU SONHO</span><br />
          <span className="text-white drop-shadow-2xl font-extrabold">NOSSA MISSÃO</span><br />
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent drop-shadow-2xl font-extrabold">
            MÓVEIS PLANEJADOS
          </span><br />
          <span className="text-white text-3xl xs:text-4xl md:text-5xl drop-shadow-2xl font-extrabold">QUE TRANSFORMAM VIDAS</span>
        </h1>
        
        <p className="text-lg xs:text-xl md:text-2xl text-white font-semibold mb-8 sm:mb-10 max-w-5xl mx-auto leading-relaxed drop-shadow-2xl">
          Tecnologia exclusiva, atendimento personalizado e alta qualidade em cada projeto. 
          Especializados em cozinhas, closets, banheiros e ambientes completos.
        </p>
        
        {/* Destaque de qualidade - Melhorado */}
        <div className="flex flex-wrap justify-center gap-4 mb-8 sm:mb-10">
          <div className="flex items-center bg-black/80 backdrop-blur-sm rounded-full px-6 py-3 border-2 border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
            <Ruler className="h-5 w-5 text-yellow-400 mr-3" />
            <span className="text-sm font-bold text-white">Precisão Milimétrica</span>
          </div>
          <div className="flex items-center bg-black/80 backdrop-blur-sm rounded-full px-6 py-3 border-2 border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
            <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
            <span className="text-sm font-bold text-white">Garantia Total</span>
          </div>
          <div className="flex items-center bg-black/80 backdrop-blur-sm rounded-full px-6 py-3 border-2 border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
            <Clock className="h-5 w-5 text-blue-400 mr-3" />
            <span className="text-sm font-bold text-white">Entrega Pontual</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 sm:mb-16">
          <Button 
            size="lg"
            className="group bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-10 py-5 text-xl font-bold transition-all duration-300 hover:shadow-2xl hover:scale-110 shadow-xl border-2 border-yellow-400/30"
            asChild
          >
            <a href="https://wa.me/554898486827?text=Olá! Quero um orçamento para móveis planejados sob medida." className="flex items-center">
              🚀 Solicitar Orçamento Grátis
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
            </a>
          </Button>
          <Button 
            variant="outline"
            size="lg"
            className="group border-3 border-white bg-white/20 backdrop-blur-sm text-white hover:bg-white hover:text-gray-900 px-8 py-5 text-lg font-bold transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
            asChild
          >
            <a href="#portfolio" className="flex items-center">
              📋 Ver Nossos Projetos
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </Button>
        </div>
        
        {/* Key Features - Design moderno */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
          <div className="group bg-white/95 backdrop-blur-sm rounded-2xl p-6 sm:p-8 text-center border border-white/30 hover:border-yellow-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 shadow-lg">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Settings className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <h3 className="font-bold text-xl sm:text-2xl mb-2 text-gray-900">Tecnologia Exclusiva</h3>
            <p className="text-gray-600 leading-relaxed">Equipamentos de última geração para precisão milimétrica</p>
          </div>
          
          <div className="group bg-white/95 backdrop-blur-sm rounded-2xl p-6 sm:p-8 text-center border border-white/30 hover:border-yellow-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 shadow-lg">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Award className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <h3 className="font-bold text-xl sm:text-2xl mb-2 text-gray-900">Especialistas Experientes</h3>
            <p className="text-gray-600 leading-relaxed">Equipe com anos de experiência em móveis planejados</p>
          </div>
          
          <div className="group bg-white/95 backdrop-blur-sm rounded-2xl p-6 sm:p-8 text-center border border-white/30 hover:border-yellow-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 shadow-lg">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <h3 className="font-bold text-xl sm:text-2xl mb-2 text-gray-900">Design Exclusivo</h3>
            <p className="text-gray-600 leading-relaxed">Projetos únicos para cada cliente</p>
          </div>
        </div>
      </div>
    </section>
  );
}
