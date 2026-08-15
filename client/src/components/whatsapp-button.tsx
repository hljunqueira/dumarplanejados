import { Button } from "@/components/ui/button";
import { SiWhatsapp } from "react-icons/si";
import { getStoredUtm, trackGoogleAdsConversion } from "@/lib/utm-tracker";

export default function WhatsAppButton() {
  const { utmSource } = getStoredUtm();
  const textMsg = encodeURIComponent(`Olá! Gostaria de agendar um atendimento para móveis planejados. [Origem: ${utmSource}]`);

  const handleClick = () => {
    trackGoogleAdsConversion("floating_whatsapp_button");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        size="icon"
        className="bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse cursor-pointer"
        asChild
      >
        <a 
          href={`https://wa.me/5548988486827?text=${textMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          aria-label="Entrar em contato via WhatsApp"
        >
          <SiWhatsapp className="h-6 w-6" />
        </a>
      </Button>
    </div>
  );
}
