import React from "react";
import { ArrowRight } from "lucide-react";
import fotoCozinha from "@/assets/cozinha1.jpeg";
import fotoQuarto from "@/assets/quarto.jpeg";
import fotoSala from "@/assets/sala1.jpeg";
import fotoBanheiro from "@/assets/banheiro.jpeg";
import fotoCloset from "@/assets/quarto1.jpeg";
import fotoIntegrado from "@/assets/sala2.jpeg";

const ENVIRONMENTS = [
  {
    title: "Cozinhas",
    desc: "Armazenamento inteligente, bancadas na altura certa e proteção reforçada contra umidade.",
    image: fotoCozinha,
    tag: "Área Gourmet & Cozinha"
  },
  {
    title: "Dormitórios & Suítes",
    desc: "Guarda-roupas funcionais, bancadas de estudo e iluminação que valoriza o descanso.",
    image: fotoQuarto,
    tag: "Conforto & Organização"
  },
  {
    title: "Salas & Livings",
    desc: "Painéis ripados, estantes elegantes e soluções para ocultar toda a fiação dos aparelhos.",
    image: fotoSala,
    tag: "Integração & Estética"
  },
  {
    title: "Banheiros & Lavabos",
    desc: "Aproveitamento máximo em metragens compactas com ferragens anticorrosivas.",
    image: fotoBanheiro,
    tag: "Funcionalidade Compacta"
  },
  {
    title: "Closets",
    desc: "Divisões pensadas para sapatos, vestidos longos, camisas e gaveteiros sob medida.",
    image: fotoCloset,
    tag: "Planejamento Pessoal"
  },
  {
    title: "Home Office & Ambientes Corporativos",
    desc: "Bancadas ergonômicas e estações planejadas para produtividade no dia a dia.",
    image: fotoIntegrado,
    tag: "Produtividade & Foco"
  }
];

export default function EnvironmentsSection() {
  return (
    <section id="ambientes" className="py-24 md:py-32 bg-[#0c0c0c] text-white border-t border-neutral-800">
      <div className="container mx-auto px-4 lg:px-8">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-3">
            <span className="text-[#f97316] text-xs font-bold uppercase tracking-[0.2em] block">
              Soluções Sob Medida
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              Qual ambiente você quer <br />
              <span className="text-[#f97316]">transformar?</span>
            </h2>
          </div>
          <div className="max-w-md">
            <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
              Atendemos desde um cômodo específico até o projeto completo da sua casa, sempre com a mesma precisão e acabamento fino.
            </p>
          </div>
        </div>

        {/* Grid dos Ambientes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {ENVIRONMENTS.map((env, index) => (
            <div 
              key={index}
              className="group relative rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 hover:border-[#f97316]/50 transition-all duration-500 shadow-xl flex flex-col min-h-[380px]"
            >
              {/* Imagem de Fundo com Overlay */}
              <div className="absolute inset-0 z-0 overflow-hidden">
                <img 
                  src={env.image} 
                  alt={`Ambiente planejado Dumar: ${env.title}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-40"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
              </div>

              {/* Tag Superior */}
              <div className="relative z-10 p-6 flex justify-between items-start">
                <span className="text-[11px] font-bold text-[#f97316] uppercase tracking-wider bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                  {env.tag}
                </span>
              </div>

              {/* Conteúdo Inferior */}
              <div className="relative z-10 p-6 mt-auto">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#f97316] transition-colors duration-300">
                  {env.title}
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed mb-4">
                  {env.desc}
                </p>
                <a 
                  href="#contato"
                  className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-[#f97316] group-hover:text-white transition-colors gap-1.5"
                >
                  <span>Planejar este ambiente</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
