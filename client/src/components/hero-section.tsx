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

        {/* LADO DIREITO: Texto Centralizado e Formatado */}
        <div className="w-full lg:w-2/5 bg-black flex flex-col items-center justify-center text-center p-8 sm:p-12 lg:p-16 space-y-7 border-l border-white/5">
          
          <div className="space-y-3">
            <span className="inline-block text-[#f97316] text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] opacity-0 animate-fade-in-up [animation-delay:150ms]">
              Móveis Sob Medida
            </span>

            {/* Título com Foco no Benefício e no Espaço do Cliente */}
            <h1 className="text-2xl sm:text-3xl lg:text-[2.15rem] xl:text-[2.4rem] font-extrabold tracking-tight leading-[1.2] text-white opacity-0 animate-fade-in-up [animation-delay:350ms]">
              Móveis planejados para aproveitar melhor cada espaço da sua casa.
            </h1>
          </div>

          {/* Descrição Empática e Clara */}
          <p className="text-xs sm:text-sm lg:text-base text-neutral-300 leading-relaxed max-w-md mx-auto opacity-0 animate-fade-in-up [animation-delay:650ms]">
            Projetos desenhados para unir durabilidade, circulação inteligente e a forma como a sua família realmente vive cada ambiente.
          </p>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center w-full pt-1 opacity-0 animate-fade-in-up [animation-delay:950ms]">
            <Button 
              size="lg"
              className="w-full sm:w-auto bg-[#f97316] hover:bg-[#ea580c] text-white font-extrabold px-7 py-4 rounded-xl transition-all duration-300 shadow-lg hover:scale-[1.02] h-auto text-xs uppercase tracking-wider"
              asChild
            >
              <a href="#contato" className="flex items-center justify-center gap-2">
                Quero conversar sobre meu projeto
              </a>
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-white/25 bg-transparent text-white hover:bg-white hover:text-black font-bold px-7 py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] h-auto text-xs uppercase tracking-wider"
              asChild
            >
              <a href="#portfolio" className="flex items-center justify-center">
                Conhecer nossos projetos
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
