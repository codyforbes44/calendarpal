import { lazy, Suspense } from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { pageSEO, organizationSchema, webApplicationSchema, siteConfig } from "@/lib/seo-config";

// Lazy-load below-the-fold sections for better LCP
const LogoCloud = lazy(() => import("@/components/LogoCloud"));
const HowItWorks = lazy(() => import("@/components/HowItWorks"));
const Features = lazy(() => import("@/components/Features"));
const Stats = lazy(() => import("@/components/Stats"));
const Testimonials = lazy(() => import("@/components/Testimonials"));
const BookingPreview = lazy(() => import("@/components/BookingPreview"));
const CTA = lazy(() => import("@/components/CTA"));

const SectionFallback = () => (
  <div className="py-16 sm:py-24" />
);

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
        ogImage={siteConfig.ogImages.home}
        structuredData={[organizationSchema, webApplicationSchema, breadcrumbSchema, speakableSchema]}
      />
      <Navigation />
      <section id="hero"><Hero /></section>
      <Suspense fallback={<SectionFallback />}>
        <section id="integrations"><LogoCloud /></section>
        <section id="how-it-works"><HowItWorks /></section>
        <section id="features"><Features /></section>
        <section id="stats"><Stats /></section>
        <section id="testimonials"><Testimonials /></section>
        <section id="preview"><BookingPreview /></section>
        <section id="cta"><CTA /></section>
      </Suspense>
      <Footer />
    </div>
  );
};

export default Index;
