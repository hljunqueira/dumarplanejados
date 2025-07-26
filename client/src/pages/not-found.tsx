import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft, AlertTriangle } from "lucide-react";

export default function NotFound() {
  const [countdown, setCountdown] = useState(10);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    // Contador regressivo
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Mostrar mensagem após 2 segundos
    const messageTimer = setTimeout(() => {
      setShowMessage(true);
    }, 2000);

    return () => {
      clearInterval(timer);
      clearTimeout(messageTimer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-blue-900 flex items-center justify-center overflow-hidden relative">
      {/* Partículas animadas */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${1 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Círculos decorativos */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-red-500/20 rounded-full animate-blob"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500/20 rounded-full animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/5 rounded-full animate-pulse"></div>

      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        {/* Ícone de erro animado */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-full p-8 animate-bounce">
            <AlertTriangle className="h-20 w-20 text-red-400" />
          </div>
        </div>

        {/* Número 404 animado */}
        <div className="mb-8">
          <h1 className="text-8xl sm:text-9xl font-bold text-white mb-4 animate-pulse">
            <span className="bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent">
              4
            </span>
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              0
            </span>
            <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              4
            </span>
          </h1>
        </div>

        {/* Título */}
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          Página não encontrada
        </h2>

        {/* Mensagem animada */}
        <div className="mb-8">
          <p className="text-xl sm:text-2xl text-white/80 mb-4">
            Ops! Parece que você se perdeu no espaço digital.
          </p>
          {showMessage && (
            <p className="text-lg text-white/70 animate-fade-in">
              Não se preocupe, vamos te ajudar a encontrar o caminho de volta!
            </p>
          )}
        </div>

        {/* Contador regressivo */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-full p-4 inline-block">
            <p className="text-white/80 text-sm">
              Redirecionando em <span className="text-yellow-400 font-bold">{countdown}</span> segundos
            </p>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button 
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-bold transition-all duration-300 hover:scale-105 shadow-xl"
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
            <a href="/#portfolio">
              <Search className="mr-2 h-5 w-5" />
              Ver Portfólio
            </a>
          </Button>
        </div>

        {/* Sugestões */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4">Onde você gostaria de ir?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a 
              href="/#inicio" 
              className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-all duration-300 hover:scale-105"
            >
              <div className="text-white font-medium">🏠 Página Inicial</div>
              <div className="text-white/60 text-sm">Conheça nossos serviços</div>
            </a>
            <a 
              href="/#sobre" 
              className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-all duration-300 hover:scale-105"
            >
              <div className="text-white font-medium">ℹ️ Sobre Nós</div>
              <div className="text-white/60 text-sm">Conheça nossa história</div>
            </a>
            <a 
              href="/#portfolio" 
              className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-all duration-300 hover:scale-105"
            >
              <div className="text-white font-medium">📋 Portfólio</div>
              <div className="text-white/60 text-sm">Veja nossos projetos</div>
            </a>
            <a 
              href="/#contato" 
              className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-all duration-300 hover:scale-105"
            >
              <div className="text-white font-medium">📞 Contato</div>
              <div className="text-white/60 text-sm">Fale conosco</div>
            </a>
          </div>
        </div>

        {/* Informações de contato */}
        <div className="mt-8 text-white/60">
          <p className="text-sm">
            Precisa de ajuda? Entre em contato:{" "}
            <a 
              href="https://wa.me/554898486827?text=Olá! Preciso de ajuda com o site." 
              className="text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              WhatsApp
            </a>
          </p>
        </div>
      </div>

      {/* Efeito de partículas flutuantes */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${4 + Math.random() * 3}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}
