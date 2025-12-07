import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Home } from "lucide-react";
import SEO from "@/components/SEO";
import { pageSEO } from "@/lib/seo-config";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <SEO
        title={pageSEO.notFound.title}
        description={pageSEO.notFound.description}
        noindex={true}
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      </div>

      <div className="text-center px-6 relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Calendar className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-2xl">CalendarPal</span>
        </div>

        {/* 404 Display */}
        <div className="mb-6">
          <h1 className="text-8xl md:text-9xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            404
          </h1>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold mb-4">Page Not Found</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          Looks like you've wandered off the calendar. The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button variant="hero" size="lg" asChild>
            <a href="/">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </a>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="/dashboard">
              <Calendar className="w-4 h-4 mr-2" />
              Go to Dashboard
            </a>
          </Button>
        </div>

        {/* Quick Links */}
        <div className="border-t border-border pt-8">
          <p className="text-sm text-muted-foreground mb-4">Or try one of these:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/pricing"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View Pricing
            </a>
            <span className="text-border">•</span>
            <a
              href="/booking"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Book a Demo
            </a>
            <span className="text-border">•</span>
            <a
              href="/auth"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default NotFound;
