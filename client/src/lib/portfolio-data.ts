import cozinha1 from "@assets/WhatsApp Image 2025-07-19 at 10.07.32_1752931725313.jpeg";
import cozinha2 from "@assets/WhatsApp Image 2025-07-19 at 10.07.34_1752931725313.jpeg";
import closet1 from "@assets/WhatsApp Image 2025-07-19 at 10.07.35 (1)_1752931725314.jpeg";
import closet2 from "@assets/WhatsApp Image 2025-07-19 at 10.07.35_1752931725314.jpeg";
import banheiro1 from "@assets/WhatsApp Image 2025-07-19 at 10.07.36_1752931725314.jpeg";
import ambiente1 from "@assets/WhatsApp Image 2025-07-19 at 10.07.37 (1)_1752931725314.jpeg";
import ambiente2 from "@assets/WhatsApp Image 2025-07-19 at 10.07.37_1752931725315.jpeg";
import closet3 from "@assets/WhatsApp Image 2025-07-19 at 10.07.38_1752931725315.jpeg";
import projeto1 from "@assets/WhatsApp Image 2025-07-19 at 10.07.39 (1)_1752931725315.jpeg";

// Novas imagens do portfólio
import nova1 from "@assets/WhatsApp Image 2025-07-19 at 10.07.39_1752933770575.jpeg";
import nova2 from "@assets/WhatsApp Image 2025-07-19 at 10.07.40_1752933770576.jpeg";
import nova3 from "@assets/WhatsApp Image 2025-07-19 at 10.07.41 (1)_1752933770576.jpeg";
import nova4 from "@assets/WhatsApp Image 2025-07-19 at 10.07.41_1752933770576.jpeg";
import nova5 from "@assets/WhatsApp Image 2025-07-19 at 10.07.42_1752933770576.jpeg";
import nova6 from "@assets/WhatsApp Image 2025-07-19 at 10.07.43 (1)_1752933770577.jpeg";
import nova7 from "@assets/WhatsApp Image 2025-07-19 at 10.07.43_1752933770577.jpeg";
import nova8 from "@assets/WhatsApp Image 2025-07-19 at 10.07.44_1752933770577.jpeg";
import nova9 from "@assets/WhatsApp Image 2025-07-19 at 10.07.45_1752933770577.jpeg";
import nova10 from "@assets/WhatsApp Image 2025-07-19 at 10.07.46_1752933770578.jpeg";

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
  },
  {
    id: 'dumar10',
    title: 'Cozinha Moderna Compacta',
    subtitle: 'Otimização inteligente de espaços pequenos',
    category: 'cozinha',
    image: nova1,
    description: 'Cozinha planejada compacta com aproveitamento máximo do espaço, armários funcionais, bancada em L e soluções inteligentes de armazenamento. Design moderno que prova que espaços pequenos podem ser altamente funcionais.'
  },
  {
    id: 'dumar11',
    title: 'Closet Walk-in Premium',
    subtitle: 'Espaço de vestir com acabamento luxuoso',
    category: 'closet',
    image: nova2,
    description: 'Closet walk-in com design premium, sistema de organização completo, iluminação LED integrada, gavetas com soft close e espelhos de corpo inteiro. O sonho de qualquer amante da moda.'
  },
  {
    id: 'dumar12',
    title: 'Banheiro Sob Medida',
    subtitle: 'Móveis resistentes e design contemporâneo',
    category: 'banheiro',
    image: nova3,
    description: 'Banheiro com móveis planejados em materiais resistentes à umidade, gabinete suspenso, nichos embutidos e design limpo. Funcionalidade e durabilidade em perfeita harmonia.'
  },
  {
    id: 'dumar13',
    title: 'Closet Integrado ao Quarto',
    subtitle: 'Solução elegante para quartos de casal',
    category: 'closet',
    image: nova4,
    description: 'Closet integrado ao quarto principal com portas de correr, sistema de organização dual, gavetas individualizadas e design que se harmoniza perfeitamente com a decoração do ambiente.'
  },
  {
    id: 'dumar14',
    title: 'Cozinha Gourmet Completa',
    subtitle: 'Para quem ama cozinhar e receber',
    category: 'cozinha',
    image: nova5,
    description: 'Cozinha gourmet com ilha central ampla, coifa embutida, armários até o teto, adega climatizada integrada e área de apoio completa. Ideal para momentos especiais em família.'
  },
  {
    id: 'dumar15',
    title: 'Home Office Integrado',
    subtitle: 'Produtividade em casa com estilo',
    category: 'sala',
    image: nova6,
    description: 'Home office planejado integrado à sala, mesa sob medida, estantes modulares, sistema de cabos oculto e iluminação adequada para trabalho. Ambiente profissional no conforto de casa.'
  },
  {
    id: 'dumar16',
    title: 'Quarto Infantil Temático',
    subtitle: 'Diversão e organização para os pequenos',
    category: 'sala',
    image: nova7,
    description: 'Quarto infantil com móveis planejados temáticos, cama com gavetas embutidas, escrivaninha ajustável, estantes lúdicas e área de brinquedos organizada. Crescendo junto com a criança.'
  },
  {
    id: 'dumar17',
    title: 'Lavanderia Funcional',
    subtitle: 'Organização total em área de serviço',
    category: 'banheiro',
    image: nova8,
    description: 'Lavanderia planejada com armários para produtos de limpeza, tanque embutido, varal retrátil, prateleiras para roupas e sistema de organização completo. Praticidade no dia a dia.'
  },
  {
    id: 'dumar18',
    title: 'Sala de TV Aconchegante',
    subtitle: 'Entretenimento familiar em ambiente acolhedor',
    category: 'sala',
    image: nova9,
    description: 'Sala de TV com painel personalizado, nichos para equipamentos, sistema de som integrado, poltronas reclináveis sob medida e iluminação ambiente. Perfeita para noites de cinema em casa.'
  },
  {
    id: 'dumar19',
    title: 'Escritório Executivo',
    subtitle: 'Ambiente profissional de alto padrão',
    category: 'sala',
    image: nova10,
    description: 'Escritório executivo com mesa presidencial sob medida, estantes para livros, sistema de arquivos integrado, sala de reunião adjacente e acabamentos em madeira nobre. Sofisticação e funcionalidade.'
  }
];
