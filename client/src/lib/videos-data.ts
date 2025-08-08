export interface VideoItem {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  thumbnail: string;
  category: 'projetos' | 'depoimentos' | 'processo' | 'institucional';
  duration?: string;
  views?: string;
  publishedAt?: string;
}

export const videosData: VideoItem[] = [
  {
    id: '1',
    title: 'Cozinha - Móveis Planejados Dumar',
    description: 'Cozinha com móveis planejados sob medida da Dumar. Transformamos seu ambiente com qualidade e design.',
    youtubeId: 'ZnOznHIhYJU', // ✅ ID real do vídeo da Dumar
    thumbnail: 'https://img.youtube.com/vi/ZnOznHIhYJU/maxresdefault.jpg',
    category: 'projetos',
    duration: '0:30', // Shorts geralmente têm 30-60 segundos
    views: '2.1k',
    publishedAt: '2024-01-20'
  },
  {
    id: '2',
    title: 'Recepção Academia Space W - Araranguá',
    description: 'Recepção da academia Space W em Araranguá. Projeto executado pela Dumar com móveis planejados sob medida.',
    youtubeId: 'VlQOuwlPwoc', // ✅ ID real do vídeo da Dumar
    thumbnail: 'https://img.youtube.com/vi/VlQOuwlPwoc/maxresdefault.jpg',
    category: 'projetos',
    duration: '0:45',
    views: '1.8k',
    publishedAt: '2024-01-18'
  },
  {
    id: '3',
    title: 'Ambiente Perfeito - Dumar Móveis',
    description: 'Vamos criar juntos o ambiente perfeito para você viver melhor todos os dias. Fale agora com nossa equipe e solicite um orçamento gratuito pelo fone (48) 98848-6827.',
    youtubeId: 'xoTf-xWHFRQ', // ✅ ID real do vídeo da Dumar
    thumbnail: 'https://img.youtube.com/vi/xoTf-xWHFRQ/maxresdefault.jpg',
    category: 'institucional',
    duration: '0:35',
    views: '1.5k',
    publishedAt: '2024-01-15'
  },
  {
    id: '4',
    title: 'Cozinha Luci - Móveis Planejados',
    description: 'Cozinha Luci - Projeto personalizado com móveis planejados da Dumar. Qualidade e funcionalidade em cada detalhe.',
    youtubeId: 'zdvcwv2maYM', // ✅ ID real do vídeo da Dumar
    thumbnail: 'https://img.youtube.com/vi/zdvcwv2maYM/maxresdefault.jpg',
    category: 'projetos',
    duration: '0:40',
    views: '1.2k',
    publishedAt: '2024-01-12'
  }
];

// Função para obter vídeos por categoria
export const getVideosByCategory = (category: VideoItem['category']) => {
  return videosData.filter(video => video.category === category);
};

// Função para obter vídeos mais recentes
export const getRecentVideos = (limit: number = 4) => {
  return videosData
    .sort((a, b) => new Date(b.publishedAt || '').getTime() - new Date(a.publishedAt || '').getTime())
    .slice(0, limit);
};

// Função para obter vídeos mais populares
export const getPopularVideos = (limit: number = 4) => {
  return videosData
    .sort((a, b) => {
      const viewsA = parseInt(a.views?.replace('k', '000').replace(',', '') || '0');
      const viewsB = parseInt(b.views?.replace('k', '000').replace(',', '') || '0');
      return viewsB - viewsA;
    })
    .slice(0, limit);
};
