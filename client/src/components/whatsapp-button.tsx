import { Button } from "@/components/ui/button";
import { SiWhatsapp } from "react-icons/si";

export default function WhatsAppButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        size="icon"
        className="bg-yellow-400 hover:bg-yellow-500 text-black w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
        asChild
      >
        <a 
          href="https://wa.me/554898486827?text=Olá! Gostaria de agendar um atendimento para móveis planejados."
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Entrar em contato via WhatsApp"
        >
          <SiWhatsapp className="h-6 w-6" />
        </a>
      </Button>
    </div>
  );
}
