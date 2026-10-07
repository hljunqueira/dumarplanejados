import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import TrustBar from "@/components/trust-bar";
import AboutSection from "@/components/about-section";
import EnvironmentsSection from "@/components/environments-section";
import PortfolioSection from "@/components/portfolio-section";
import ProcessSection from "@/components/process-section";
import VideosSection from "@/components/videos-section";
import FAQSection from "@/components/faq-section";
import ContactSection from "@/components/contact-section";
import Footer from "@/components/footer";
import WhatsAppButton from "@/components/whatsapp-button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Header />
      <main>
        <div id="inicio">
          <HeroSection />
        </div>
        <TrustBar />
        <div id="sobre">
          <AboutSection />
        </div>
        <div id="ambientes">
          <EnvironmentsSection />
        </div>
        <div id="portfolio">
          <PortfolioSection />
        </div>
        <div id="processo">
          <ProcessSection />
        </div>
        <div id="videos">
          <VideosSection />
        </div>
        <div id="faq">
          <FAQSection />
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