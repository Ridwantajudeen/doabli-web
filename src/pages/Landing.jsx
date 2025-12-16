import Navbar from "../components/navbar";

import Features from "../components/Features";
import HowItWorks from "../components/HowItWorks";
import Footer from "../components/Footer";
import Hero from "../components/Hero";

export default function Landing() {
  return (
    <>
    
      <Navbar />
      <Hero/>
      <Features />
      <HowItWorks />
      <Footer />
    </>
  );
}
