import { Button } from "@/components/ui/button";
import { Play, Youtube, Instagram, Clock, Eye } from "lucide-react";
import { videosData, type VideoItem } from "@/lib/videos-data";

export default function VideosSection() {
  const openYouTubeChannel = () => {
    window.open('https://www.youtube.com/@DumarM%C3%B3veisPlanejados', '_blank');
  };

  return (
    <section id="videos" className="py-20 bg-gradient-to-br from-gray-50 via-white to-slate-50">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-100 text-red-800 text-sm font-medium mb-6">
            <Youtube className="w-4 h-4 mr-2" />
            Canal do YouTube
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
            Vídeos da <span className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">Dumar</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Acompanhe nossos projetos, processos e depoimentos de clientes satisfeitos. 
            Veja em movimento como transformamos ambientes.
          </p>
        </div>

        {/* Vídeos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-12">
          {videosData.map((video) => (
            <div 
              key={video.id}
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
            >
              {/* Thumbnail com overlay */}
              <div 
                className="relative aspect-video overflow-hidden cursor-pointer"
                onClick={() => window.open(`https://www.youtube.com/shorts/${video.youtubeId}`, '_blank')}
              >
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Overlay com botão play */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center">
                  <div className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 transition-all duration-300 group-hover:scale-110">
                    <Play className="h-8 w-8 ml-1" />
                  </div>
                </div>
                {/* Categoria */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700">
                    {video.category === 'projetos' && 'Projetos'}
                    {video.category === 'depoimentos' && 'Depoimentos'}
                    {video.category === 'processo' && 'Processo'}
                    {video.category === 'institucional' && 'Institucional'}
                  </span>
                </div>
                {/* Estatísticas do vídeo */}
                {video.duration && (
                  <div className="absolute bottom-4 right-4 flex items-center space-x-2">
                    <div className="flex items-center space-x-1 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      <Clock className="h-3 w-3" />
                      <span>{video.duration}</span>
                    </div>
                    {video.views && (
                      <div className="flex items-center space-x-1 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        <Eye className="h-3 w-3" />
                        <span>{video.views}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Conteúdo */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-yellow-600 transition-colors">
                  {video.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {video.description}
                </p>
                <Button
                  variant="outline"
                  className="w-full border-2 border-gray-200 text-gray-700 hover:border-red-500 hover:text-red-600 transition-all duration-300"
                  onClick={() => window.open(`https://www.youtube.com/shorts/${video.youtubeId}`, '_blank')}
                >
                  <Youtube className="h-4 w-4 mr-2" />
                  Assistir no YouTube
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-8 border border-red-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Inscreva-se no Nosso Canal
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Fique por dentro de todos os nossos projetos, dicas de decoração e novidades 
              do mundo dos móveis planejados. Inscreva-se e ative o sininho!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={openYouTubeChannel}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg"
              >
                <Youtube className="h-5 w-5 mr-2" />
                Ver Canal no YouTube
              </Button>
              <Button
                variant="outline"
                asChild
                className="border-2 border-gray-800 bg-white text-gray-800 hover:bg-gray-900 hover:text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300"
              >
                <a href="https://www.instagram.com/dumar_moveis_planejados/" target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-5 w-5 mr-2" />
                  Siga no Instagram
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
