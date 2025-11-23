import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

const benefits = [
  "Free forever for basic features",
  "No credit card required",
  "Set up in under 5 minutes",
  "Cancel anytime"
];

const CTA = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-primary opacity-5" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl lg:text-6xl font-bold">
            Ready to simplify
            <br />
            your scheduling?
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of professionals who've already made the switch to smarter scheduling.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button variant="hero" size="lg" className="text-base px-8">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" size="lg" className="text-base">
              Talk to Sales
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-12">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 justify-center text-sm text-muted-foreground"
              >
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
