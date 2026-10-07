import React from "react";
import { Ruler, Eye, MapPin, CheckCircle2 } from "lucide-react";

const TRUST_ITEMS = [
  {
    icon: Ruler,
    title: "Projeto no seu espaço",
    desc: "Soluções pensadas para as medidas reais do seu imóvel."
  },
  {
    icon: Eye,
    title: "Projeto 3D detalhado",
    desc: "Você visualiza e ajusta cada detalhe antes de produzir."
  },
  {
    icon: MapPin,
    title: "Medição no local sem custo",
    desc: "Nossa equipe técnica vai até a obra conferir cada centímetro."
  },
  {
    icon: CheckCircle2,
    title: "Montagem especializada",
    desc: "Marceneiros experientes e cuidado fino até a entrega."
  }
];

export default function TrustBar() {
  return (
    <section className="bg-[#111111] text-white py-8 border-y border-neutral-800">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {TRUST_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#f97316]/40 transition-all duration-300 group"
              >
                <div className="w-11 h-11 rounded-lg bg-[#f97316]/10 border border-[#f97316]/20 flex items-center justify-center flex-shrink-0 text-[#f97316] group-hover:bg-[#f97316] group-hover:text-white transition-all duration-300">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-[#f97316] transition-colors duration-200">
                    {item.title}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
