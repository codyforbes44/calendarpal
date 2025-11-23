import { Button } from "@/components/ui/button";
import { Calendar, Clock, Zap, Users } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-subtle">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Zap className="w-4 h-4" />
              <span>Better than Calendly</span>
            </div>
            
            <h1 className="text-6xl lg:text-7xl font-bold leading-tight">
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
              <Button variant="hero" size="lg" className="text-base px-8">
                Get Started Free
              </Button>
              <Button variant="outline" size="lg" className="text-base">
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-8 border-t border-border">
              <div>
                <div className="text-3xl font-bold text-primary">10k+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">500k+</div>
                <div className="text-sm text-muted-foreground">Meetings Booked</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
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
