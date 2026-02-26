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

  return (
    <div className="min-h-screen">
      <SEO
        title={pageSEO.home.title}
        description={pageSEO.home.description}
        keywords={pageSEO.home.keywords}
        canonical={siteConfig.url}
        ogImage={`${siteConfig.url}${siteConfig.ogImages.home}`}
        structuredData={[organizationSchema, webApplicationSchema, breadcrumbSchema]}
      />
      <Navigation />
      <Hero />
      <LogoCloud />
      <HowItWorks />
      <Features />
      <Stats />
      <Testimonials />
      <BookingPreview />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
