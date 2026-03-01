import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import LogoCloud from "@/components/LogoCloud";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import Stats from "@/components/Stats";
import Testimonials from "@/components/Testimonials";
import BookingPreview from "@/components/BookingPreview";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { pageSEO, organizationSchema, webApplicationSchema, siteConfig } from "@/lib/seo-config";

const Index = () => {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [{
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": siteConfig.url
    }]
  };

  const speakableSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": pageSEO.home.title,
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": [".hero-headline", ".hero-description"]
    },
    "url": siteConfig.url
  };

  return (
    <div className="min-h-screen scroll-smooth">
      <SEO
        title={pageSEO.home.title}
        description={pageSEO.home.description}
        keywords={pageSEO.home.keywords}
        canonical={siteConfig.url}
        ogImage={`${siteConfig.url}${siteConfig.ogImages.home}`}
        structuredData={[organizationSchema, webApplicationSchema, breadcrumbSchema, speakableSchema]}
      />
      <Navigation />
      <section id="hero"><Hero /></section>
      <section id="integrations"><LogoCloud /></section>
      <section id="how-it-works"><HowItWorks /></section>
      <section id="features"><Features /></section>
      <section id="stats"><Stats /></section>
      <section id="testimonials"><Testimonials /></section>
      <section id="preview"><BookingPreview /></section>
      <section id="cta"><CTA /></section>
      <Footer />
    </div>
  );
};

export default Index;
