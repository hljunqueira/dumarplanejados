// IMPORTS AUTOMÁTICOS GERADOS
import cozinha from "../assets/cozinha.jpeg";
import cozinha1 from "../assets/cozinha1.jpeg";
import cozinha2 from "../assets/cozinha2.jpeg";
import cozinha3 from "../assets/cozinha3.jpeg";
import cozinha4 from "../assets/cozinha4.jpeg";
import cozinha5 from "../assets/cozinha5.jpeg";
import cozinha6 from "../assets/cozinha6.jpeg";
import cozinha7 from "../assets/cozinha7.jpeg";
import cozinha8 from "../assets/cozinha8.jpeg";
import sala from "../assets/sala.jpeg";
import sala1 from "../assets/sala1.jpeg";
import sala2 from "../assets/sala2.jpeg";
import sala3 from "../assets/sala 3.jpeg";
import banheiro from "../assets/banheiro.jpeg";
import quarto from "../assets/quarto.jpeg";
import quarto1 from "../assets/quarto1.jpeg";
import quartoBeliche from "../assets/quarto-beliche.jpeg";

export interface PortfolioItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'cozinha' | 'closet' | 'banheiro' | 'sala' | 'outro';
  image: string;
  description: string;
}

export const portfolioItems: PortfolioItem[] = [
  {
    id: 'cozinha',
    title: 'Cozinha Planejada',
    subtitle: 'Ambiente funcional e moderno',
    category: 'cozinha',
    image: cozinha,
    description: 'Cozinha planejada com móveis sob medida, otimizando espaço e praticidade.'
  },
  {
    id: 'cozinha1',
    title: 'Cozinha Compacta',
    subtitle: 'Design inteligente para pequenos espaços',
    category: 'cozinha',
    image: cozinha1,
    description: 'Cozinha compacta, perfeita para apartamentos e ambientes reduzidos.'
  },
  {
    id: 'cozinha2',
    title: 'Cozinha Gourmet',
    subtitle: 'Espaço para quem ama cozinhar',
    category: 'cozinha',
    image: cozinha2,
    description: 'Cozinha gourmet com bancada ampla e armários personalizados.'
  },
  {
    id: 'cozinha3',
    title: 'Cozinha Clean',
    subtitle: 'Ambiente claro e sofisticado',
    category: 'cozinha',
    image: cozinha3,
    description: 'Cozinha com acabamento clean, ideal para quem busca elegância.'
  },
  {
    id: 'cozinha4',
    title: 'Cozinha Integrada',
    subtitle: 'Integração com sala de jantar',
    category: 'cozinha',
    image: cozinha4,
    description: 'Cozinha integrada à sala, promovendo convivência e praticidade.'
  },
  {
    id: 'cozinha5',
    title: 'Cozinha com Ilha',
    subtitle: 'Destaque para a ilha central',
    category: 'cozinha',
    image: cozinha5,
    description: 'Cozinha planejada com ilha central, perfeita para receber amigos.'
  },
  {
    id: 'cozinha6',
    title: 'Cozinha Minimalista',
    subtitle: 'Linhas retas e poucos elementos',
    category: 'cozinha',
    image: cozinha6,
    description: 'Cozinha minimalista, priorizando funcionalidade e beleza.'
  },
  {
    id: 'cozinha7',
    title: 'Cozinha Clássica',
    subtitle: 'Detalhes tradicionais',
    category: 'cozinha',
    image: cozinha7,
    description: 'Cozinha com detalhes clássicos e acabamento refinado.'
  },
  {
    id: 'cozinha8',
    title: 'Cozinha Moderna',
    subtitle: 'Tendências atuais de design',
    category: 'cozinha',
    image: cozinha8,
    description: 'Cozinha moderna, com materiais de alta qualidade.'
  },
  {
    id: 'sala',
    title: 'Sala de Estar',
    subtitle: 'Ambiente aconchegante',
    category: 'sala',
    image: sala,
    description: 'Sala de estar planejada para conforto e elegância.'
  },
  {
    id: 'sala1',
    title: 'Sala Integrada',
    subtitle: 'Integração de ambientes',
    category: 'sala',
    image: sala1,
    description: 'Sala integrada com móveis sob medida.'
  },
  {
    id: 'sala2',
    title: 'Sala Moderna',
    subtitle: 'Design contemporâneo',
    category: 'sala',
    image: sala2,
    description: 'Sala moderna com móveis planejados.'
  },
  {
    id: 'sala3',
    title: 'Sala Compacta',
    subtitle: 'Aproveitamento de espaço',
    category: 'sala',
    image: sala3,
    description: 'Sala compacta, ideal para apartamentos.'
  },
  {
    id: 'banheiro',
    title: 'Banheiro Planejado',
    subtitle: 'Funcionalidade e beleza',
    category: 'banheiro',
    image: banheiro,
    description: 'Banheiro planejado com armários sob medida.'
  },
  {
    id: 'quarto',
    title: 'Quarto Casal',
    subtitle: 'Conforto e organização',
    category: 'outro',
    image: quarto,
    description: 'Quarto de casal com móveis planejados.'
  },
  {
    id: 'home-office',
    title: 'Home Office',
    subtitle: 'Praticidade e sofisticação',
    category: 'outro',
    image: quarto1,
    description: 'Home Office planejado sob medida, aliando ergonomia, organização e design sofisticado.'
  },
  {
    id: 'quarto-solteiro',
    title: 'Quarto Solteiro',
    subtitle: 'Praticidade e conforto',
    category: 'outro',
    image: quartoBeliche,
    description: 'Quarto de solteiro planejado sob medida com excelente aproveitamento de espaço e design acolhedor.'
  }
];
