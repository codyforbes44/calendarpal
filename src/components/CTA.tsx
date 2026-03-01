import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import AnimatedSection from "@/components/ui/animated-section";

const benefits = [
  "AI-powered scheduling",
  "Collect payments automatically",
  "Slack & Google Calendar sync",
  "Free forever plan"
];

const CTA = () => {
  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-primary opacity-5" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatedSection className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-6xl font-bold">
            Stop Scheduling.
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">Start Automating.</span>
          </h2>
          
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Join 50,000+ professionals who've eliminated scheduling busywork forever.
          </p>

          <div className="flex justify-center pt-2 sm:pt-4">
            <Button variant="hero" size="lg" className="text-base px-8 w-full sm:w-auto group" asChild>
              <a href="/get-started">
                Start Automating Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-8 sm:pt-12">
            {benefits.map((benefit, index) => (
              <AnimatedSection 
                key={index}
                delay={index * 100}
                animation="fade-up"
                className="flex items-center gap-2 justify-center text-sm text-muted-foreground"
              >
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                <span>{benefit}</span>
              </AnimatedSection>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default CTA;
