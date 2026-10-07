import React, { useState } from "react";
import { Plus, Minus, HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "A Dumar atende quais cidades?",
    answer: "Atendemos todo o Extremo Sul e Litoral Catarinense — incluindo Balneário Arroio do Silva, Araranguá, Criciúma, Tubarão, Laguna, Sombrio e municípios vizinhos —, além do Litoral Norte Gaúcho (Torres e região)."
  },
  {
    question: "Preciso ter a planta ou as medidas exatas para pedir um orçamento?",
    answer: "Não. Se você tiver a planta ou fotos, ótimo! Mas se não tiver, nossa equipe técnica vai até o seu imóvel para fazer todo o levantamento das medidas e conferir pontos elétricos e hidráulicos sem qualquer custo."
  },
  {
    question: "Vocês fazem apenas um ambiente ou somente a casa inteira?",
    answer: "Fazemos desde um único ambiente (como uma cozinha, closet, banheiro ou painel de sala) até projetos residenciais e comerciais completos, sempre com o mesmo padrão de acabamento."
  },
  {
    question: "Qual é o prazo médio de entrega e instalação?",
    answer: "O prazo varia conforme o tamanho do projeto, mas é fixado com total transparência no contrato. Se o seu imóvel ainda está em fase de obras, nós alinhamos o cronograma de fabricação e montagem diretamente com a previsão de entrega das suas chaves."
  },
  {
    question: "A Dumar também fornece pedras e bancadas de granito/quartzo?",
    answer: "Nosso foco exclusivo é a marcenaria sob medida de alto padrão, mas compatibilizamos o projeto técnico diretamente com a sua marmoraria para garantir encaixes milimétricos de cubas, torneiras e cooktops."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // Primeiro aberto por padrão

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 md:py-32 bg-[#FDFBF7] text-[#1A1A1A] border-t border-neutral-200">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start max-w-6xl mx-auto">
          
          {/* Lado Esquerdo: Título & Apoio */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[#f97316] text-xs font-bold uppercase tracking-[0.2em] block">
              Dúvidas Frequentes
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#1A1A1A] leading-[1.15]">
              Alguma dúvida antes de <br />
              <span className="text-[#f97316]">começar seu projeto?</span>
            </h2>
            <p className="text-neutral-600 text-sm md:text-base leading-relaxed pt-2">
              Reunimos as respostas para as perguntas mais comuns de quem está planejando móveis sob medida com a Dumar. Se ainda tiver qualquer outra questão, nossa equipe responde rapidamente pelo WhatsApp.
            </p>
            <div className="pt-4">
              <a 
                href="#contato"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1A1A1A] hover:text-[#f97316] transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-[#f97316]" />
                <span>Preciso tirar outra dúvida</span>
              </a>
            </div>
          </div>

          {/* Lado Direito: Accordion */}
          <div className="lg:col-span-7 space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div 
                  key={index}
                  className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm transition-all duration-300 hover:border-[#f97316]/40"
                >
                  <button
                    onClick={() => toggle(index)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-base md:text-lg text-[#1A1A1A] hover:text-[#f97316] transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <span className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0 text-[#f97316]">
                      {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
