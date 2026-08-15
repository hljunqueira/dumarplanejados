import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

// Importando fotos do portfólio para a vitrine animada
import fotoCozinha1 from "@/assets/cozinha1.jpeg";
import fotoCozinha3 from "@/assets/cozinha3.jpeg";
import fotoSala1 from "@/assets/sala1.jpeg";
import fotoQuarto from "@/assets/quarto.jpeg";
import fotoBanheiro from "@/assets/banheiro.jpeg";

const SLIDE_IMAGES = [
  { url: fotoCozinha1, title: "Cozinha Integrada Premium" },
  { url: fotoSala1, title: "Home Theater Sofisticado" },
  { url: fotoCozinha3, title: "Cozinha Gourmet Luxo" },
  { url: fotoQuarto, title: "Quarto de Casal Confort" },
  { url: fotoBanheiro, title: "Sala de Banho Contemporânea" }
];

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDE_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section 
      id="inicio" 
      className="relative h-[calc(100vh-80px)] lg:h-[calc(100vh-96px)] mt-20 lg:mt-24 w-full overflow-hidden bg-black text-white"
    >
      <div className="w-full h-full flex flex-col lg:flex-row">
        {/* LADO ESQUERDO: Vitrine de Fotos (Nitidez máxima, sem zoom) */}
        <div className="w-full lg:w-3/5 h-[350px] lg:h-full relative overflow-hidden">
          {SLIDE_IMAGES.map((slide, index) => (
            <div
              key={slide.title}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <div 
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${slide.url})` }}
              >
                <div className="absolute inset-0 bg-black/10"></div>
              </div>
            </div>
          ))}
          
          {/* Marcadores de Slide Minimalistas */}
          <div className="absolute bottom-6 left-6 z-20 flex space-x-2">
            {SLIDE_IMAGES.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === currentSlide ? "w-6 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>

        {/* LADO DIREITO: Texto Centralizado e Formatado (Estilo Bartz com fundo preto) */}
        <div className="w-full lg:w-2/5 bg-black flex flex-col items-center justify-center text-center p-8 sm:p-12 lg:p-16 space-y-8 border-l border-white/5">
          
          {/* Título Centralizado com Delays de Animação e Espaçamento Apropriado */}
          <h1 className="text-3xl sm:text-4xl lg:text-4xl xl:text-[2.6rem] font-black tracking-tight uppercase leading-[1.25] text-white flex flex-col gap-1 sm:gap-2">
            <span className="block opacity-0 animate-fade-in-up [animation-delay:150ms]">SEU SONHO</span>
            <span className="block opacity-0 animate-fade-in-up [animation-delay:350ms]">NOSSA MISSÃO</span>
            <span className="block opacity-0 animate-fade-in-up [animation-delay:550ms] text-[#f97316] bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 bg-clip-text text-transparent">MÓVEIS PLANEJADOS</span>
            <span className="block opacity-0 animate-fade-in-up [animation-delay:750ms]">QUE TRANSFORMAM VIDAS</span>
          </h1>

          {/* Descrição Formatada com Margem para melhor leitura */}
          <p className="text-xs sm:text-sm lg:text-base text-gray-300 leading-relaxed max-w-md mx-auto opacity-0 animate-fade-in-up [animation-delay:950ms]">
            Tecnologia exclusiva, atendimento personalizado e alta qualidade em cada projeto. Especializados em cozinhas, closets, banheiros e ambientes comerciais.
          </p>

          {/* Botões de Ação Centralizados */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full pt-2 opacity-0 animate-fade-in-up [animation-delay:1150ms]">
            <Button 
              size="lg"
              className="w-full sm:w-auto bg-white hover:bg-neutral-200 text-black font-extrabold px-8 py-4 rounded-lg transition-all duration-300 shadow-md hover:scale-[1.02] h-auto text-xs"
              asChild
            >
              <Link href="/orcamento" className="flex items-center justify-center gap-2">
                Simular meu Projeto 3D
              </Link>
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-white/20 bg-transparent text-white hover:bg-white hover:text-black font-bold px-8 py-4 rounded-lg transition-all duration-300 hover:scale-[1.02] h-auto text-xs"
              asChild
            >
              <a href="#portfolio" className="flex items-center justify-center">
                Explorar Portfólio
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
