import NavBar from "@/components/NavBar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import AnalysisTool from "@/components/AnalysisTool";
import SupportedGenesDrugs from "@/components/SupportedGenesDrugs";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#0b1e40] overflow-x-hidden">
      <NavBar />
      <HeroSection />
      <HowItWorks />
      <AnalysisTool />
      <SupportedGenesDrugs />
      <Footer />
    </main>
  );
}
