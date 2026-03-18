
import Navbar from "../components/navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import HowItWorks from "../components/HowItWorks";
import ContactUs from "../components/ContactUs";
import TrustSafety from "../components/TrustSafety";
import FAQ from "../components/FAQ";
import Seo from "../components/Seo";

export default function LandingPage() {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Doabli",
    url: "https://doabli.com",
    logo: "https://doabli.com/Doabli-logo-darkpng.png",
    sameAs: [
      "https://www.instagram.com/doabliapp?igsh=YW5tc3BhNmJqbGZu&utm_source=qr",
      "https://x.com/doabliapp?s=21",
      "https://www.facebook.com/share/18MC368Shp/?mibextid=LQQJ4d"
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Doabli",
    url: "https://doabli.com"
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What kinds of tasks can I post?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Errands, home services, tech and digital work, academic support, business admin, transport, creative work, lifestyle services, skilled trades, and more - anything reasonable within platform policies."
        }
      },
      {
        "@type": "Question",
        name: "How do payments work?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Clients fund the task upfront. Funds are held in escrow and released only after the client confirms completion."
        }
      },
      {
        "@type": "Question",
        name: "When are contact details shared?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Contact details are only shared inside active tasks when it is necessary to complete the job."
        }
      }
    ]
  };

  return (
    <>
    <Seo
      title="Doabli - Tasks, Services, and Skilled Work"
      description="Doabli connects clients with trusted people for errands, home services, tech and digital work, creative gigs, and more. Post a job, hire a runner, and get tasks done with secure payments."
      path="/"
      schema={[orgSchema, websiteSchema, faqSchema]}
    />
    <Navbar/>
    <Hero/>
    <Features/>
    <TrustSafety/>
    <HowItWorks/>
    <FAQ/>
    <ContactUs/>
    </>
  );
}
