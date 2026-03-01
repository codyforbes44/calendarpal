import { Button } from "@/components/ui/button";
import { Calendar, Clock, Zap, Bell, ArrowRight, Shield, Star, CheckCircle, Globe } from "lucide-react";
import AnimatedSection from "@/components/ui/animated-section";
import HeroBackground from "@/components/HeroBackground";

const Hero = () => {
  return (
    <section className="relative min-h-[85vh] sm:min-h-screen flex items-center justify-center overflow-hidden bg-gradient-subtle">
      <HeroBackground page="home" />
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
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium border border-primary/20">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>The Future of Booking Automation</span>
            </div>
            
            <h1 className="hero-headline font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight">
              Automate Your
              <br />
              Bookings.{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Reclaim Your Time.
              </span>
            </h1>
            
            <p className="hero-description text-base sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
              The intelligent booking platform that handles availability, reminders, time zones, and follow-ups — so you don't have to.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="lg" className="text-sm sm:text-base px-6 sm:px-8 group w-full sm:w-auto" asChild>
                <a href="/get-started">
                  Start Automating Free
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button variant="outline" size="lg" className="text-sm sm:text-base group w-full sm:w-auto" asChild>
                <a href="#preview" onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("preview")?.scrollIntoView({ behavior: "smooth" });
                }}>
                  Interactive Demo
                </a>
              </Button>
            </div>

            {/* Trust indicators */}
            <AnimatedSection delay={400} animation="fade-up" className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 sm:pt-2 justify-center lg:justify-start">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                <span>Free forever</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                <span>Live in 2 minutes</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                <span>5,000+ bookings automated</span>
              </div>
            </AnimatedSection>
          </div>

          {/* Right content - Product mockup */}
          <div className="relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
            {/* Mobile: Compact automation cards */}
            <div className="lg:hidden flex flex-col gap-3 max-w-sm mx-auto">
              <div className="bg-card border border-border rounded-xl p-4 shadow-md flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Booking Confirmed</div>
                  <div className="text-xs text-muted-foreground">Sent automatically</div>
                </div>
                <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
              </div>
              <div className="bg-card border border-border rounded-xl p-4 shadow-md flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Reminder Sent</div>
                  <div className="text-xs text-muted-foreground">24h before meeting</div>
                </div>
                <div className="ml-auto text-xs font-semibold text-accent">Auto</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 shadow-md flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Time Zone Detected</div>
                  <div className="text-xs text-muted-foreground">PST → EST converted</div>
                </div>
              </div>
            </div>

            {/* Desktop: Stylized product mockup */}
            <div className="hidden lg:block relative">
              <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-lg p-6 space-y-4">
                {/* Mini dashboard header */}
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Today's Overview</p>
                    <p className="font-display text-lg font-bold">3 meetings automated</p>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-primary/30" />
                    <div className="w-3 h-3 rounded-full bg-accent/30" />
                    <div className="w-3 h-3 rounded-full bg-muted" />
                  </div>
                </div>

                {/* Booking notification card */}
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">New Booking — Sarah K.</div>
                      <div className="text-xs text-muted-foreground">Tomorrow, 10:00 AM · 30 min</div>
                    </div>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Confirmed</span>
                  </div>
                </div>

                {/* Automation status row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-foreground">12</div>
                    <div className="text-xs text-muted-foreground">This week</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-accent">0</div>
                    <div className="text-xs text-muted-foreground">No-shows</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-primary">4h</div>
                    <div className="text-xs text-muted-foreground">Saved</div>
                  </div>
                </div>

                {/* Automation log */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Automation Log</p>
                  {[
                    { icon: CheckCircle, text: "Confirmation email sent to sarah@acme.co", time: "2m ago", color: "text-primary" },
                    { icon: Bell, text: "Reminder scheduled for 9:00 AM tomorrow", time: "2m ago", color: "text-accent" },
                    { icon: Globe, text: "Time zone auto-converted: PST → EST", time: "2m ago", color: "text-primary" },
                  ].map((log, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <log.icon className={`w-3.5 h-3.5 ${log.color} shrink-0`} />
                      <span className="flex-1">{log.text}</span>
                      <span>{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating card */}
              <div className="absolute -bottom-6 -left-2 bg-card/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-border animate-float" style={{ animationDelay: "1.5s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">90% fewer no-shows</div>
                    <div className="text-xs text-muted-foreground">with smart reminders</div>
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
