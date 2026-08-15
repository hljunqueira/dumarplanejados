import { Phone, Calendar, Ruler, Palette, Wrench, CheckSquare, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function ProcessSection() {
  const steps = [
    {
      icon: Phone,
      title: "Contato Inicial",
      description: "Entendimento preliminar do escopo e alinhamento de expectativas via WhatsApp ou chamada técnica."
    },
    {
      icon: Calendar,
      title: "Estudo & Medição",
      description: "Visita ao local para levantamento minucioso das dimensões físicas e particularidades estruturais."
    },
    {
      icon: Palette,
      title: "Apresentação 3D",
      description: "Desenvolvimento do projeto tridimensional focado em estética de alta decoração e ergonomia."
    },
    {
      icon: Ruler,
      title: "Engenharia & Produção",
      description: "Detalhamento construtivo e fabricação automatizada utilizando maquinários de padrão europeu."
    },
    {
      icon: Wrench,
      title: "Montagem Especializada",
      description: "Instalação final executada por nossa equipe própria de marceneiros especialistas, com total discrição."
    },
    {
      icon: CheckSquare,
      title: "Entrega Técnica",
      description: "Vistoria final acompanhada para assegurar que cada milímetro e acabamento atenda às suas expectativas."
    }
  ];

  return (
    <section id="processo" className="py-24 md:py-32 bg-[#FDFBF7] text-[#1A1A1A] relative border-t border-neutral-200 overflow-hidden">
      
      {/* Background Subtle Glow */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-amber-200/30 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 lg:px-8">
        
        {/* Cabeçalho */}
        <div className="text-center mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-[#1A1A1A]">
            Como Transformamos <br />
            <span className="text-[#f97316]">Sua Ideia em Realidade</span>
          </h2>
          <p className="text-neutral-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Nossa metodologia integrada assegura um fluxo contínuo e sem atritos, priorizando a precisão técnica e a excelência estética em cada etapa.
          </p>
        </div>

        {/* Timeline Grid */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="group relative bg-white rounded-2xl p-8 border border-neutral-200 hover:border-[#f97316]/60 transition-all duration-500 flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-2"
            >
              
              <div>
                {/* Cabeçalho do Card com Número Grande 01, 02... */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-neutral-100">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:bg-[#f97316] group-hover:text-white transition-all duration-300 text-[#f97316]">
                    <step.icon className="h-5 w-5" />
                  </div>
                  
                  {/* Número Index 01, 02... */}
                  <span className="text-4xl font-black text-neutral-300 group-hover:text-[#f97316] transition-colors duration-300 font-mono">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Conteúdo */}
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-3 group-hover:text-[#f97316] transition-colors duration-300">
                  {step.title}
                </h3>
                
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {step.description}
                </p>
              </div>

            </div>
          ))}
        </div>

        {/* CTA Banner em Fundo Escuro para Contraste */}
        <div className="text-center mt-20 max-w-4xl mx-auto">
          <div className="relative rounded-3xl p-8 md:p-12 overflow-hidden border border-white/10 bg-black text-white shadow-2xl">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Deseja Agendar uma Reunião de Briefing?
            </h3>
            <p className="text-neutral-400 text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed">
              Traga as dimensões prévias ou planta do seu espaço e receba uma assessoria inicial de um de nossos especialistas.
            </p>
            
            <div className="flex justify-center">
              <Button 
                asChild 
                className="bg-white text-black hover:bg-neutral-200 font-extrabold px-8 py-5 rounded-xl transition-all duration-300 hover:scale-105 shadow-xl cursor-pointer"
              >
                <Link href="/agendamento" className="flex items-center text-sm md:text-base">
                  Solicitar Estudo de Layout
                  <ArrowRight className="ml-3 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}