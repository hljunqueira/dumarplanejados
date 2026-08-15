import { Button } from "@/components/ui/button";
import { Play, Youtube, Instagram, Star } from "lucide-react";
import { videosData } from "@/lib/videos-data";

export default function VideosSection() {
  const openYouTubeChannel = () => {
    window.open('https://www.youtube.com/@DumarM%C3%B3veisPlanejados', '_blank');
  };

  return (
    <section id="videos" className="py-24 md:py-32 bg-black text-white relative border-t border-white/10">
      <div className="container mx-auto px-4 lg:px-8">
        
        <div className="text-center mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-white">
            Vídeos da <span className="text-[#f97316]">Dumar no YouTube</span>
          </h2>
          <p className="text-neutral-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Veja detalhes em vídeo de montagens, projetos finalizados em 3D, e entenda a real qualidade de cada ferragem e material utilizado.
          </p>
        </div>

        {/* Vídeos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {videosData.map((video) => (
            <div 
              key={video.id}
              className="group relative bg-neutral-900 rounded-2xl border border-white/10 hover:border-[#f97316]/40 transition-all duration-300 overflow-hidden shadow-2xl"
            >
              {/* Thumbnail com overlay */}
              <div 
                className="relative aspect-video overflow-hidden cursor-pointer"
                onClick={() => window.open(`https://www.youtube.com/shorts/${video.youtubeId}`, '_blank')}
              >
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {/* Overlay com botão play */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center group-hover:bg-[#f97316] group-hover:text-black group-hover:border-[#f97316] transition-all duration-300 text-white shadow-xl">
                    <Play className="h-6 w-6 fill-current ml-1" />
                  </div>
                </div>
              </div>

              {/* Informações */}
              <div className="p-6">
                <h3 className="text-white font-bold text-lg mb-2 group-hover:text-[#f97316] transition-colors">
                  {video.title}
                </h3>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  {video.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Call to action do canal */}
        <div className="text-center">
          <Button 
            onClick={openYouTubeChannel}
            className="bg-[#FF0000] hover:bg-[#CC0000] text-white font-extrabold px-8 py-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-xl gap-2 cursor-pointer"
          >
            <Youtube className="h-5 w-5" />
            <span>Inscrição no Canal Oficial</span>
          </Button>
        </div>

      </div>
    </section>
  );
}
