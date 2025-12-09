import { Button } from "@/components/ui/button";
import { Calendar, Clock, Zap, Users, Play, Shield, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-subtle">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10 pt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Zap className="w-4 h-4" />
              <span>Better than Calendly</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              Scheduling
              <br />
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
              Transform how you manage meetings. Beautiful, intuitive scheduling that saves time and impresses clients.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button variant="hero" size="lg" className="text-base px-8 group" asChild>
                <a href="/auth">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button variant="outline" size="lg" className="text-base group" asChild>
                <a href="/booking">
                  <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  See How It Works
                </a>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-primary" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-primary" />
                <span>Setup in 2 minutes</span>
              </div>
            </div>

            {/* Logo cloud */}
            <div className="pt-6">
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Integrates with</p>
              <div className="flex flex-wrap gap-6 items-center opacity-60">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">G</div>
                  Google Calendar
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">Z</div>
                  Zoom
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">M</div>
                  Teams
                </div>
              </div>
            </div>
          </div>

          {/* Right content - Hero image with overlay */}
          <div className="relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="relative rounded-2xl overflow-hidden shadow-lg">
              <img 
                src={heroImage} 
                alt="Modern scheduling interface preview" 
                className="w-full h-auto"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              
              {/* Floating cards */}
              <div className="absolute top-8 right-8 bg-card/90 backdrop-blur-sm rounded-xl p-4 shadow-lg animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Meeting Confirmed</div>
                    <div className="text-xs text-muted-foreground">in 30 minutes</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-8 left-8 bg-card/90 backdrop-blur-sm rounded-xl p-4 shadow-lg animate-float" style={{ animationDelay: "1.5s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">3 New Bookings</div>
                    <div className="text-xs text-muted-foreground">This week</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
