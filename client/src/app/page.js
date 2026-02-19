import NavBar from "@/components/NavBar";
import HeroSection from "@/components/HeroSection";
import PageLoader from "@/components/PageLoader";
import HowItWorks from "@/components/HowItWorks";
import FeaturesSection from "@/components/FeaturesSection";
import AnalysisTool from "@/components/AnalysisTool";
import SupportedGenesDrugs from "@/components/SupportedGenesDrugs";
import IVFSection from "@/components/IVFSection";
import Footer from "@/components/Footer";
import ContactSection from "@/components/ContactSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#0b1e40] overflow-x-hidden">
      <PageLoader />
      <NavBar />
      <HeroSection />
      <AnalysisTool />
      <HowItWorks />
      <FeaturesSection />
     
     <SupportedGenesDrugs />
      <Footer />
    </main>
  );
}
