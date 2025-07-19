export interface PortfolioItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'cozinha' | 'closet' | 'banheiro' | 'sala';
  image: string;
  description: string;
}

export const portfolioItems: PortfolioItem[] = [
  {
    id: 'modal1',
    title: 'Cozinha Moderna com Ilha',
    subtitle: 'Projeto completo com marcenaria sob medida',
    category: 'cozinha',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=800',
    description: 'Projeto completo de cozinha moderna com ilha central, bancada em quartzo, armários sob medida com acabamento em laca branca e sistema de iluminação LED integrado. Eletrodomésticos embutidos e aproveitamento máximo do espaço.'
  },
  {
    id: 'modal2',
    title: 'Closet de Luxo',
    subtitle: 'Organização e sofisticação em cada detalhe',
    category: 'closet',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=800',
    description: 'Closet luxuoso com sistema de organização personalizado, cabideiros múltiplos, gavetas com divisórias, sapateiras e iluminação LED. Acabamento em madeira nobre com detalhes em vidro fumê.'
  },
  {
    id: 'modal3',
    title: 'Banheiro Completo',
    subtitle: 'Funcionalidade e design integrados',
    category: 'banheiro',
    image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=800',
    description: 'Banheiro completo com móveis planejados incluindo gabinete suspenso, espelheira com iluminação LED, nichos embutidos e aproveitamento inteligente dos espaços. Materiais resistentes à umidade.'
  },
  {
    id: 'modal4',
    title: 'Sala de Estar Integrada',
    subtitle: 'Ambiente completo com home theater',
    category: 'sala',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=800',
    description: 'Ambiente integrado com painel para TV, estantes modulares, home office e sistema de armazenamento oculto. Design clean com materiais nobres e funcionalidade máxima.'
  },
  {
    id: 'modal5',
    title: 'Cozinha Minimalista',
    subtitle: 'Design clean com alta funcionalidade',
    category: 'cozinha',
    image: 'https://images.unsplash.com/photo-1556185781-a47769abb7aa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=800',
    description: 'Cozinha com design minimalista, armários sem puxadores com sistema push-pull, cores neutras e linhas retas. Funcionalidade máxima com visual clean e contemporâneo.'
  },
  {
    id: 'modal6',
    title: 'Closet Master Suite',
    subtitle: 'Elegância e organização premium',
    category: 'closet',
    image: 'https://images.unsplash.com/photo-1571508601891-ca5e7a713859?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=800',
    description: 'Closet master suite com portas de vidro, sistema de organização premium, ilha central com gavetas, espelho de corpo inteiro e iluminação automatizada. Máxima elegância e funcionalidade.'
  }
];
