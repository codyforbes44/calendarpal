import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import BookingPreview from "@/components/BookingPreview";
import CTA from "@/components/CTA";
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
        structuredData={[organizationSchema, webApplicationSchema, breadcrumbSchema]}
      />
      <Navigation />
      <Hero />
      <Navigation />
      <Hero />
      <Features />
      <BookingPreview />
      <CTA />
      
      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2025 CalendarPal. Built with love for better scheduling.
            </div>
            <div className="flex gap-6 text-sm">
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link to="/support" className="text-muted-foreground hover:text-foreground transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
