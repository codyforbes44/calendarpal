import { Button } from "@/components/ui/button";
import { Calendar, Clock, Zap, Users, Play, Shield, ArrowRight, Star } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-subtle">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 sm:left-20 w-48 sm:w-72 h-48 sm:h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 sm:right-20 w-64 sm:w-96 h-64 sm:h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-16 sm:pt-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left content */}
          <div className="space-y-5 sm:space-y-7 animate-fade-in text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Better than Calendly</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
              Scheduling
              <br />
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
            
            <p className="text-base sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Transform how you manage meetings. Beautiful, intuitive scheduling that saves time and impresses clients.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="lg" className="text-sm sm:text-base px-6 sm:px-8 group w-full sm:w-auto" asChild>
                <a href="/auth">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button variant="outline" size="lg" className="text-sm sm:text-base group w-full sm:w-auto" asChild>
                <a href="#preview">
                  <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  See How It Works
                </a>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-5 pt-1 sm:pt-2 justify-center lg:justify-start">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                <span>Setup in 2 minutes</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                <span>1,000+ professionals</span>
              </div>
            </div>

            {/* Logo cloud */}
            <div className="pt-3 sm:pt-5">
              <p className="text-xs text-muted-foreground mb-2 sm:mb-3 uppercase tracking-wider">Integrates with</p>
              <div className="flex flex-wrap gap-4 sm:gap-6 items-center opacity-60 justify-center lg:justify-start">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-muted flex items-center justify-center text-xs">G</div>
                  <span>Google Calendar</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-muted flex items-center justify-center text-xs">Z</div>
                  <span>Zoom</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-muted flex items-center justify-center text-xs">M</div>
                  <span>Teams</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right content - visible on all screens, simplified on mobile */}
          <div className="relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
            {/* Mobile: Compact floating cards */}
            <div className="lg:hidden flex flex-col gap-3 max-w-sm mx-auto">
              <div className="bg-card border border-border rounded-xl p-4 shadow-md flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Meeting Confirmed</div>
                  <div className="text-xs text-muted-foreground">Tomorrow at 10:00 AM</div>
                </div>
                <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
              </div>
              <div className="bg-card border border-border rounded-xl p-4 shadow-md flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-sm font-semibold">3 New Bookings</div>
                  <div className="text-xs text-muted-foreground">This week</div>
                </div>
                <div className="ml-auto text-xs font-semibold text-accent">+3</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 shadow-md flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold">2h saved today</div>
                  <div className="text-xs text-muted-foreground">vs email scheduling</div>
                </div>
              </div>
            </div>

            {/* Desktop: Full image with floating cards */}
            <div className="hidden lg:block relative rounded-2xl overflow-hidden shadow-lg">
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
