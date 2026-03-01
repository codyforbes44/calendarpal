import { Brain, Bell, Palette, RefreshCw, Users, BarChart3, CreditCard, MessageSquare, Sparkles, Code, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import AnimatedSection from "@/components/ui/animated-section";

const coreFeatures = [
  {
    icon: Brain,
    title: "Smart Scheduling Engine",
    description: "AI finds optimal meeting times across calendars and time zones — no manual coordination needed.",
  },
  {
    icon: Bell,
    title: "Automated Reminders",
    description: "Email and calendar reminders that reduce no-shows by 90%. Set once, never worry again.",
  },
  {
    icon: Palette,
    title: "Branded Booking Pages",
    description: "Custom pages with your colors, logo, and domain. Look professional from day one.",
  },
  {
    icon: CreditCard,
    title: "Payment Collection",
    description: "Accept payments at booking via Stripe. Automate invoicing, refunds, and payment confirmations.",
  },
];

const advancedFeatures = [
  {
    icon: RefreshCw,
    title: "Recurring Meetings",
    description: "Set it once, let it repeat automatically.",
  },
  {
    icon: MessageSquare,
    title: "Slack & Calendar Sync",
    description: "Two-way Google Calendar sync and Slack booking alerts.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track booking rates, popular times, and conversion funnels.",
  },
  {
    icon: Sparkles,
    title: "AI Assistant",
    description: "AI-powered event creation, search, and dashboard chatbot.",
  },
  {
    icon: Code,
    title: "Embeddable Widget",
    description: "Embed your booking page on any website with iframe or JS snippet.",
  },
  {
    icon: UserCheck,
    title: "Client Directory",
    description: "CRM-style client tracking with meeting history and stats.",
  },
];

const Features = () => {
  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-10 sm:mb-16 space-y-3 sm:space-y-4">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            Core automation
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold">
            Everything runs on
            <br />
            <span className="text-primary">autopilot</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Powerful automation that eliminates scheduling busywork, wrapped in an interface you'll love.
          </p>
        </AnimatedSection>

        {/* Core features - large cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8 mb-8 sm:mb-12">
          {coreFeatures.map((feature, index) => (
            <AnimatedSection key={index} delay={index * 120} animation="fade-up">
              <Card className="p-6 sm:p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border bg-card group h-full">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-5 sm:mb-6 group-hover:shadow-glow transition-shadow">
                  <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            </AnimatedSection>
          ))}
        </div>

        {/* Advanced features - compact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {advancedFeatures.map((feature, index) => (
            <AnimatedSection key={index} delay={index * 100 + 300} animation="fade-up">
              <Card className="p-4 sm:p-5 border-border bg-muted/30 hover:bg-muted/50 transition-all duration-300 group h-full flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold mb-1">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
