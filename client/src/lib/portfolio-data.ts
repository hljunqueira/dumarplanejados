import cozinha1 from "@assets/WhatsApp Image 2025-07-19 at 10.07.32_1752931725313.jpeg";
import cozinha2 from "@assets/WhatsApp Image 2025-07-19 at 10.07.34_1752931725313.jpeg";
import closet1 from "@assets/WhatsApp Image 2025-07-19 at 10.07.35 (1)_1752931725314.jpeg";
import closet2 from "@assets/WhatsApp Image 2025-07-19 at 10.07.35_1752931725314.jpeg";
import banheiro1 from "@assets/WhatsApp Image 2025-07-19 at 10.07.36_1752931725314.jpeg";
import ambiente1 from "@assets/WhatsApp Image 2025-07-19 at 10.07.37 (1)_1752931725314.jpeg";
import ambiente2 from "@assets/WhatsApp Image 2025-07-19 at 10.07.37_1752931725315.jpeg";
import closet3 from "@assets/WhatsApp Image 2025-07-19 at 10.07.38_1752931725315.jpeg";
import projeto1 from "@assets/WhatsApp Image 2025-07-19 at 10.07.39 (1)_1752931725315.jpeg";

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
    id: 'dumar1',
    title: 'Cozinha Planejada Premium',
    subtitle: 'Projeto executado com materiais de primeira linha',
    category: 'cozinha',
    image: cozinha1,
    description: 'Cozinha planejada completa com acabamentos em madeira nobre, bancada em granito, armários com design exclusivo e aproveitamento inteligente do espaço. Projeto executado com a qualidade e precisão características da Dumar.'
  },
  {
    id: 'dumar2',
    title: 'Cozinha Moderna Integrada',
    subtitle: 'Funcionalidade e estilo em perfeita harmonia',
    category: 'cozinha',
    image: cozinha2,
    description: 'Ambiente moderno com marcenaria sob medida, ilha central funcional, sistema de armazenamento otimizado e design contemporâneo. Cada detalhe pensado para máxima praticidade no dia a dia.'
  },
  {
    id: 'dumar3',
    title: 'Closet Sob Medida',
    subtitle: 'Organização personalizada para seu estilo de vida',
    category: 'closet',
    image: closet1,
    description: 'Closet personalizado com sistema de organização inteligente, cabideiros ajustáveis, gavetas com divisórias, prateleiras modulares e iluminação estratégica. Design pensado para otimizar o espaço e facilitar o uso diário.'
  },
  {
    id: 'dumar4',
    title: 'Closet Elegante',
    subtitle: 'Sofisticação e funcionalidade em cada detalhe',
    category: 'closet',
    image: closet2,
    description: 'Projeto de closet com acabamentos elegantes, sistema de organização premium, espelhos integrados e aproveitamento total do espaço disponível. Qualidade Dumar em cada componente.'
  },
  {
    id: 'dumar5',
    title: 'Banheiro Planejado',
    subtitle: 'Móveis sob medida para ambientes úmidos',
    category: 'banheiro',
    image: banheiro1,
    description: 'Banheiro com móveis planejados resistentes à umidade, gabinete sob medida, nichos integrados e design funcional. Materiais selecionados especialmente para ambientes molhados, garantindo durabilidade e beleza.'
  },
  {
    id: 'dumar6',
    title: 'Ambiente Integrado',
    subtitle: 'Sala completa com móveis planejados',
    category: 'sala',
    image: ambiente1,
    description: 'Projeto de sala integrada com painel para TV, estantes modulares, mesa de centro sob medida e sistema de armazenamento discreto. Design moderno que combina funcionalidade e elegância.'
  },
  {
    id: 'dumar7',
    title: 'Living Personalizado',
    subtitle: 'Ambiente aconchegante e funcional',
    category: 'sala',
    image: ambiente2,
    description: 'Living room com móveis planejados incluindo rack personalizado, prateleiras integradas, mesa lateral sob medida e aproveitamento inteligente dos cantos. Cada peça desenhada especialmente para o ambiente.'
  },
  {
    id: 'dumar8',
    title: 'Closet Compacto',
    subtitle: 'Máximo aproveitamento em espaços reduzidos',
    category: 'closet',
    image: closet3,
    description: 'Closet compacto com design inteligente, gavetas deslizantes, cabideiros otimizados e prateleiras ajustáveis. Prova de que é possível ter organização e estilo mesmo em espaços pequenos.'
  },
  {
    id: 'dumar9',
    title: 'Projeto Residencial Completo',
    subtitle: 'Ambientes integrados com design único',
    category: 'sala',
    image: projeto1,
    description: 'Projeto residencial completo com móveis planejados em diversos ambientes, mantendo harmonia no design e qualidade superior em todos os detalhes. Exemplo da capacidade da Dumar em criar ambientes únicos e funcionais.'
  }
];
