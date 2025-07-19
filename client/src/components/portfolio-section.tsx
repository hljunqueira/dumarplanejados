import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { portfolioItems, type PortfolioItem } from "@/lib/portfolio-data";
import PortfolioModal from "./portfolio-modal";

type FilterType = 'all' | 'cozinha' | 'closet' | 'banheiro' | 'sala';

export default function PortfolioSection() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  const filteredItems = activeFilter === 'all' 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === activeFilter);

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

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <Button
            onClick={() => handleFilterChange('all')}
            className={`px-6 py-3 font-medium transition-all ${
              activeFilter === 'all' 
                ? 'bg-black text-white' 
                : 'bg-gray-200 text-black hover:bg-black hover:text-white'
            }`}
          >
            Todos os Projetos
          </Button>
          <Button
            onClick={() => handleFilterChange('cozinha')}
            className={`px-6 py-3 font-medium transition-all ${
              activeFilter === 'cozinha' 
                ? 'bg-black text-white' 
                : 'bg-gray-200 text-black hover:bg-black hover:text-white'
            }`}
          >
            Cozinhas
          </Button>
          <Button
            onClick={() => handleFilterChange('closet')}
            className={`px-6 py-3 font-medium transition-all ${
              activeFilter === 'closet' 
                ? 'bg-black text-white' 
                : 'bg-gray-200 text-black hover:bg-black hover:text-white'
            }`}
          >
            Closets
          </Button>
          <Button
            onClick={() => handleFilterChange('banheiro')}
            className={`px-6 py-3 font-medium transition-all ${
              activeFilter === 'banheiro' 
                ? 'bg-black text-white' 
                : 'bg-gray-200 text-black hover:bg-black hover:text-white'
            }`}
          >
            Banheiros
          </Button>
          <Button
            onClick={() => handleFilterChange('sala')}
            className={`px-6 py-3 font-medium transition-all ${
              activeFilter === 'sala' 
                ? 'bg-black text-white' 
                : 'bg-gray-200 text-black hover:bg-black hover:text-white'
            }`}
          >
            Salas
          </Button>
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
            <div 
              key={item.id}
              className="group cursor-pointer"
              onClick={() => openModal(item)}
            >
              <div className="relative overflow-hidden rounded-2xl bg-gray-100 aspect-square">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                  <Search className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="dumar-accent">{item.subtitle}</p>
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
            <a href="https://wa.me/554898486827?text=Olá! Vi os projetos no site e gostaria de um orçamento personalizado.">
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
