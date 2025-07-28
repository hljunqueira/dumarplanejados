import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { portfolioItems, type PortfolioItem } from "@/lib/portfolio-data";
import PortfolioModal from "./portfolio-modal";

// Adiciona filtro especial para closets/quartos
function filterItems(items: PortfolioItem[], filter: FilterType) {
  if (filter === 'all') return items;
  if (filter === 'closet') {
    // Mostra todos os quartos e closets
    return items.filter(item =>
      item.category === 'closet' ||
      (item.category === 'outro' && /quarto|closet/i.test(item.title))
    );
  }
  return items.filter(item => item.category === filter);
}

type FilterType = 'all' | 'cozinha' | 'closet' | 'banheiro' | 'sala';

export default function PortfolioSection() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  const filteredItems = filterItems(portfolioItems, activeFilter);

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const openModal = (item: PortfolioItem) => {
    setSelectedItem(item);
  };

  const closeModal = () => {
    setSelectedItem(null);
  };

  return (
    <section id="portfolio" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Nosso Portfólio</h2>
          <p className="text-xl dumar-accent max-w-3xl mx-auto">
            Conheça alguns dos nossos projetos realizados. Cada ambiente é único e desenvolvido 
            com atenção aos mínimos detalhes para superar expectativas.
          </p>
        </div>

        {/* Category Filters - agora horizontal */}
        <div className="flex flex-wrap flex-row justify-center gap-2 sm:gap-4 mb-8 sm:mb-12 w-full max-w-2xl mx-auto">
          <Button
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-3 text-base font-medium transition-all ${
              activeFilter === 'all' 
                ? 'bg-black text-white' 
                : 'bg-gray-200 text-black hover:bg-black hover:text-white'
            }`}
          >
            Todos os Projetos
          </Button>
          <Button
            onClick={() => handleFilterChange('cozinha')}
            className={`px-4 py-3 text-base font-medium transition-all ${
              activeFilter === 'cozinha' 
                ? 'bg-black text-white' 
                : 'bg-gray-200 text-black hover:bg-black hover:text-white'
            }`}
          >
            Cozinhas
          </Button>
          <Button
            onClick={() => handleFilterChange('closet')}
            className={`px-4 py-3 text-base font-medium transition-all ${
              activeFilter === 'closet' 
                ? 'bg-black text-white' 
                : 'bg-gray-200 text-black hover:bg-black hover:text-white'
            }`}
          >
            Closets/Quartos
          </Button>
          <Button
            onClick={() => handleFilterChange('banheiro')}
            className={`px-4 py-3 text-base font-medium transition-all ${
              activeFilter === 'banheiro' 
                ? 'bg-black text-white' 
                : 'bg-gray-200 text-black hover:bg-black hover:text-white'
            }`}
          >
            Banheiros
          </Button>
          <Button
            onClick={() => handleFilterChange('sala')}
            className={`px-4 py-3 text-base font-medium transition-all ${
              activeFilter === 'sala' 
                ? 'bg-black text-white' 
                : 'bg-gray-200 text-black hover:bg-black hover:text-white'
            }`}
          >
            Salas
          </Button>
        </div>

        {/* Portfolio Grid - estilo Aceternity UI */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
            <div 
              key={item.id}
              className="group relative cursor-pointer rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-gradient-to-br from-gray-100 to-gray-200"
              onClick={() => openModal(item)}
              tabIndex={0}
              role="button"
              aria-label={`Ver detalhes do projeto ${item.title}`}
            >
              <img 
                src={item.image} 
                alt={item.title}
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              {/* Overlay glassmorphism */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end">
                <div className="w-full p-6 pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-md rounded-b-2xl bg-white/20">
                  <h3 className="text-lg sm:text-xl font-bold text-white drop-shadow mb-1">{item.title}</h3>
                  <p className="text-sm text-white/80 mb-2">{item.subtitle}</p>
                  <Button
                    size="sm"
                    className="bg-yellow-400 text-black font-bold px-4 py-2 rounded shadow hover:bg-yellow-500 transition"
                  >
                    Ver detalhes
                  </Button>
                </div>
              </div>
              {/* Botão flutuante de lupa */}
              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-white/80 rounded-full p-2 shadow-lg backdrop-blur-md">
                  <Search className="h-6 w-6 text-black" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <p className="text-xl dumar-accent mb-6">
            Gostou dos nossos projetos? Entre em contato e crie seu ambiente ideal!
          </p>
          <Button 
            size="lg"
            className="bg-black text-white px-8 py-4 text-lg font-bold hover:bg-gray-700"
            asChild
          >
            <a href="https://wa.me/5548988486827?text=Olá! Vi os projetos no site e gostaria de um orçamento personalizado.">
              Solicitar Orçamento Personalizado
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

