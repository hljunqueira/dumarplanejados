import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type PortfolioItem } from "@/lib/portfolio-data";
import { Check } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

interface PortfolioModalProps {
  item: PortfolioItem;
  onClose: () => void;
}

export default function PortfolioModal({ item, onClose }: PortfolioModalProps) {
  const whatsappText = encodeURIComponent(
    `Olá! Vi o projeto "${item.title} (${item.subtitle})" no portfólio de vocês e achei incrível. Gostaria de entender quanto custaria um projeto personalizado com as mesmas características para minha casa.`
  );

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] bg-[#121212] border border-white/10 text-white p-0 overflow-y-auto rounded-3xl shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-0">
          
          {/* Lado Esquerdo: Imagem Ampliada do Projeto */}
          <div className="lg:col-span-7 relative bg-black flex items-center justify-center min-h-[280px] lg:min-h-[450px]">
            <img 
              src={item.image} 
              alt={item.title} 
              className="w-full h-full object-cover max-h-[550px]"
            />
            <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider z-10">
              {item.category === 'cozinha' && 'Cozinha Planejada'}
              {item.category === 'sala' && 'Sala & Home'}
              {item.category === 'banheiro' && 'Banheiro & Lavabo'}
              {item.category === 'closet' && 'Closet & Quarto'}
              {item.category === 'outro' && 'Ambiente Sob Medida'}
            </div>
          </div>

          {/* Lado Direito: Informações e Ações */}
          <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between space-y-6">
            <div>
              {/* Cabeçalho */}
              <DialogHeader className="mb-4 text-left">
                <span className="text-[10px] font-bold text-[#f97316] uppercase tracking-widest block">Galeria Dumar</span>
                <DialogTitle className="text-2xl font-extrabold text-white leading-tight tracking-tight mt-1">
                  {item.title}
                </DialogTitle>
                <span className="text-xs text-neutral-400 font-medium block">
                  {item.subtitle}
                </span>
              </DialogHeader>

              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-6">
                {item.description || "Ambiente completo projetado sob medida, maximizando o espaço útil e integrando materiais de primeira linha para durabilidade e sofisticação."}
              </p>

              {/* Destaques Construtivos */}
              <div className="mt-4 border-t border-white/10 pt-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-3">Destaques Construtivos</span>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-neutral-200 flex items-center">
                    <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-400" /> 100% MDF
                  </span>
                  <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-neutral-200 flex items-center">
                    <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-400" /> Puxador Usinado
                  </span>
                  <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-neutral-200 flex items-center">
                    <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-400" /> LED Integrado Warm 3000K
                  </span>
                </div>
              </div>
            </div>

            {/* Ação de Conversão */}
            <div className="pt-4 border-t border-white/10 mt-auto">
              <a
                href={`https://wa.me/5548988486827?text=${whatsappText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-white hover:bg-neutral-200 text-black font-extrabold py-3.5 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 text-sm shadow-xl cursor-pointer hover:scale-[1.02]"
              >
                <SiWhatsapp className="h-4 w-4" />
                <span>Solicitar Projeto Equivalente</span>
              </a>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
