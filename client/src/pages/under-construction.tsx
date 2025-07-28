import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Hammer, Wrench, Settings, Home } from "lucide-react";

export default function UnderConstruction() {
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState(0);
  
  const texts = [
    "Construindo algo incrível...",
    "Preparando a melhor experiência...",
    "Quase lá, mais um pouco...",
    "Finalizando os detalhes..."
  ];

  useEffect(() => {
    // Animação de progresso
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    // Animação de texto
    const textInterval = setInterval(() => {
      setCurrentText(prev => (prev + 1) % texts.length);
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(textInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center overflow-hidden relative">
      {/* Partículas animadas */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Círculos decorativos */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/20 rounded-full animate-blob"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500/20 rounded-full animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-indigo-500/10 rounded-full animate-pulse"></div>

      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        {/* Ícones animados */}
        <div className="flex justify-center items-center space-x-8 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 animate-bounce">
            <Hammer className="h-12 w-12 text-yellow-400" />
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 animate-bounce" style={{ animationDelay: '0.5s' }}>
            <Wrench className="h-12 w-12 text-blue-400" />
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 animate-bounce" style={{ animationDelay: '1s' }}>
            <Settings className="h-12 w-12 text-purple-400" />
          </div>
        </div>

        {/* Título principal */}
        <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Em
          </span>{" "}
          <span className="text-white">Desenvolvimento</span>
        </h1>

        {/* Texto animado */}
        <p className="text-xl sm:text-2xl text-white/80 mb-8 min-h-[2rem] transition-all duration-500">
          {texts[currentText]}
        </p>

        {/* Barra de progresso */}
        <div className="mb-8">
          <div className="bg-white/20 rounded-full h-4 overflow-hidden backdrop-blur-sm">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-white/60 mt-2 text-sm">{progress}% concluído</p>
        </div>

        {/* Mensagem */}
        <p className="text-white/70 mb-8 text-lg leading-relaxed">
          Estamos trabalhando para trazer a melhor experiência possível. 
          Em breve você poderá desfrutar de todas as funcionalidades!
        </p>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-4 text-lg font-bold transition-all duration-300 hover:scale-105 shadow-xl"
            asChild
          >
            <a href="/">
              <Home className="mr-2 h-5 w-5" />
              Voltar ao Início
            </a>
          </Button>
          
          <Button 
            variant="outline"
            className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-lg font-bold transition-all duration-300"
            asChild
          >
            <a href="https://wa.me/5548988486827?text=Olá! Quero saber mais sobre o desenvolvimento do site.">
              Falar Conosco
            </a>
          </Button>
        </div>

        {/* Informações adicionais */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-white/60">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400 mb-2">24/7</div>
            <div className="text-sm">Desenvolvimento</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400 mb-2">100%</div>
            <div className="text-sm">Qualidade</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400 mb-2">Em Breve</div>
            <div className="text-sm">Lançamento</div>
          </div>
        </div>
      </div>

      {/* Efeito de partículas flutuantes */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
} 