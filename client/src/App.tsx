import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import AboutSection from "@/components/about-section";
import PortfolioSection from "@/components/portfolio-section";
import ContactSection from "@/components/contact-section";
import Footer from "@/components/footer";
import WhatsAppButton from "@/components/whatsapp-button";

export default function App() {
  return (
    <div className="min-h-screen w-full">
      <Header />
      <HeroSection />
      <div id="sobre">
        <AboutSection />
      </div>
      <div id="portfolio">
        <PortfolioSection />
      </div>
      <div id="contato">
        <ContactSection />
      </div>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
