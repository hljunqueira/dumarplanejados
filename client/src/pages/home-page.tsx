import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import AboutSection from "@/components/about-section";
import PortfolioSection from "@/components/portfolio-section";
import ProcessSection from "@/components/process-section";
import VideosSection from "@/components/videos-section";
import ContactSection from "@/components/contact-section";
import Footer from "@/components/footer";
import WhatsAppButton from "@/components/whatsapp-button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <div id="inicio">
          <HeroSection />
        </div>
        <div id="sobre">
          <AboutSection />
        </div>
        <div id="portfolio">
          <PortfolioSection />
        </div>
        <ProcessSection />
        <div id="videos">
          <VideosSection />
        </div>
        <div id="contato">
          <ContactSection />
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}