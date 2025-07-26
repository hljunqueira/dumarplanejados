import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import AboutSection from "@/components/about-section";
import PortfolioSection from "@/components/portfolio-section";
import ContactSection from "@/components/contact-section";
import Footer from "@/components/footer";
import WhatsAppButton from "@/components/whatsapp-button";
import ProcessSection from "@/components/process-section";

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      <Header />
      <HeroSection />
      <AboutSection />
      <ProcessSection />
      <PortfolioSection />
      <ContactSection />
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
