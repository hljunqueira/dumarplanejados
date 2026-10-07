import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown } from "lucide-react";
import { portfolioItems, type PortfolioItem } from "@/lib/portfolio-data";
import PortfolioModal from "./portfolio-modal";

// Adiciona filtro refinado para closets/quartos e salas/home office
function filterItems(items: PortfolioItem[], filter: FilterType) {
  if (filter === 'all') return items;
  if (filter === 'closet') {
    return items.filter(item =>
      item.category === 'closet' ||
      (item.category === 'outro' && /quarto|closet|dormitório/i.test(item.title))
    );
  }
  if (filter === 'sala') {
    return items.filter(item =>
      item.category === 'sala' ||
      (item.category === 'outro' && /home|office|estar/i.test(item.title))
    );
  }
  return items.filter(item => item.category === filter);
}

type FilterType = 'all' | 'cozinha' | 'closet' | 'banheiro' | 'sala';

export default function PortfolioSection() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(3); // Exibe 3 inicialmente

  const filteredItems = filterItems(portfolioItems, activeFilter);
  const visibleItems = filteredItems.slice(0, visibleCount);

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setVisibleCount(3); // Reseta a contagem para 3 ao trocar filtro
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 3);
  };

  const closeModal = () => {
    setSelectedItem(null);
  };

  const filterButtons: { type: FilterType; label: string }[] = [
    { type: 'all', label: "Todos" },
    { type: 'cozinha', label: "Cozinhas" },
    { type: 'closet', label: "Closets & Quartos" },
    { type: 'banheiro', label: "Banheiros" },
    { type: 'sala', label: "Salas & Home" }
  ];

  return (
    <section id="portfolio" className="py-24 md:py-32 bg-black text-white border-t border-white/10">
      <div className="container mx-auto px-4 lg:px-8">
        
        {/* Cabeçalho de Seção */}
        <div className="text-center mb-16">
          <span className="text-[#f97316] text-xs font-bold uppercase tracking-[0.2em] block mb-3">
            Portfólio Real
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 text-white">
            Projetos que unem <span className="text-[#f97316]">estética e rotina.</span>
          </h2>
          <p className="text-neutral-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Cada espaço abaixo foi desenhado para resolver um desafio real: mais armazenamento, circulação confortável e materiais duráveis.
          </p>
        </div>

        {/* Filtros de Categoria */}
        <div className="flex flex-wrap justify-center gap-3 mb-16 max-w-3xl mx-auto">
          {filterButtons.map((btn) => (
            <button
              key={btn.type}
              onClick={() => handleFilterChange(btn.type)}
              className={`px-6 py-3 rounded-full text-xs md:text-sm font-bold tracking-wider uppercase transition-all duration-300 border cursor-pointer ${
                activeFilter === btn.type
                  ? 'bg-white text-black border-white shadow-lg'
                  : 'bg-white/5 text-neutral-400 border-white/10 hover:border-white/30 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Portfolio Grid (3 por linha no desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {visibleItems.map((item) => (
            <div 
              key={item.id}
              className="group relative cursor-pointer rounded-2xl overflow-hidden shadow-2xl bg-neutral-900 border border-white/10 transition-all duration-500 hover:-translate-y-2 hover:border-[#f97316]/50"
              onClick={() => setSelectedItem(item)}
              tabIndex={0}
              role="button"
              aria-label={`Ver detalhes do projeto ${item.title}`}
            >
              {/* Box da imagem */}
              <div className="w-full aspect-[4/3] overflow-hidden bg-neutral-950">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Informações */}
              <div className="p-6 flex justify-between items-center bg-neutral-900 border-t border-white/10">
                <div>
                  <h3 className="text-white font-bold text-base sm:text-lg tracking-tight mb-1 group-hover:text-[#f97316] transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-xs text-neutral-400 font-medium">
                    {item.subtitle}
                  </p>
                </div>
                
                {/* Lupa */}
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-[#f97316] group-hover:text-black transition-all duration-300 text-white">
                  <Search className="h-4 w-4" />
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Botão Ver Mais */}
        {visibleCount < filteredItems.length && (
          <div className="text-center mt-12">
            <Button
              onClick={handleLoadMore}
              variant="outline"
              className="bg-white/5 hover:bg-white text-white hover:text-black font-extrabold px-8 py-6 rounded-xl border border-white/20 transition-all duration-300 gap-2 cursor-pointer shadow-xl"
            >
              <span>Ver Mais Projetos ({filteredItems.length - visibleCount} restantes)</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* CTA Minimalista de Orçamento */}
        <div className="text-center mt-20 border-t border-white/10 pt-12">
          <p className="text-neutral-400 text-sm md:text-base mb-6 max-w-xl mx-auto">
            Quer ver como ficaria o seu ambiente antes de tomar qualquer decisão? Nossa equipe desenha a proposta tridimensional no seu espaço.
          </p>
          <Button 
            size="lg"
            className="bg-[#f97316] text-white hover:bg-[#ea580c] font-extrabold px-8 py-5 rounded-xl transition-all duration-300 hover:scale-105 shadow-xl cursor-pointer uppercase tracking-wider text-xs md:text-sm"
            asChild
          >
            <a href="https://wa.me/5548988486827?text=Ol%C3%A1!%20Vi%20o%20portf%C3%B3lio%20no%20site%20e%20gostaria%20de%20ver%20uma%20proposta%20para%20o%20meu%20espa%C3%A7o." target="_blank" rel="noopener noreferrer">
              Quero ver uma proposta para meu espaço
            </a>
          </Button>
        </div>
      </div>

      {/* Portfolio Modal */}
      {selectedItem && (
        <PortfolioModal 
          item={selectedItem} 
          onClose={closeModal} 
        />
      )}
    </section>
  );
}
