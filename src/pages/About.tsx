import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, Shield, Globe, Zap, Users, Clock } from "lucide-react";
import HeroBackground from "@/components/HeroBackground";

const steps = [
  {
    icon: Calendar,
    title: "Set Your Availability",
    description: "Define when you're free. Set working hours, buffer times, and timezone preferences in minutes.",
  },
  {
    icon: Zap,
    title: "Create Event Types",
    description: "Build custom meeting types — 15-min calls, 1-hour demos, or anything you need. Each gets a unique booking link.",
  },
  {
    icon: Globe,
    title: "Share Your Link",
    description: "Send your personal booking page to clients. They pick a time that works — no back-and-forth emails.",
  },
  {
    icon: Users,
    title: "Get Booked",
    description: "Confirmations, reminders, and calendar files are sent automatically. You just show up.",
  },
];

const values = [
  {
    icon: Clock,
    title: "Time is Precious",
    description: "We believe scheduling should take seconds, not minutes. Every feature is designed to eliminate friction.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your data stays yours. We use enterprise-grade encryption and never sell personal information.",
  },
  {
    icon: Globe,
    title: "Built for Everyone",
    description: "Automatic timezone detection, multi-language support, and accessible design ensure nobody is left behind.",
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="About | Bᴏᴏᴋᴍᴇ.ʙᴇᴛ"
        description="Learn how Bᴏᴏᴋᴍᴇ.ʙᴇᴛ works. Simple, modern scheduling for professionals — set availability, share your link, get booked."
        keywords="how it works, about bookme, scheduling platform, appointment booking"
      />
      <Navigation />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Hero */}
        <section className="relative text-center max-w-3xl mx-auto mb-16 sm:mb-20 py-12 sm:py-16 lg:py-20 overflow-hidden rounded-2xl">
          <HeroBackground page="about" opacity={0.3} />
          <h1 className="relative z-10 font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            Scheduling, <span className="text-primary">simplified</span>.
          </h1>
          <p className="relative z-10 text-lg sm:text-xl text-foreground/80 leading-relaxed px-4">
            Bᴏᴏᴋᴍᴇ.ʙᴇᴛ removes the back-and-forth from meeting coordination. 
            Set your availability once, share a link, and let others book time with you effortlessly.
          </p>
        </section>

        {/* How It Works */}
        <section className="mb-16 sm:mb-20">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-10 sm:mb-12">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <Card key={step.title} className="p-6 text-center relative overflow-hidden group hover:border-primary/30 transition-colors">
                <div className="absolute top-3 right-4 text-6xl font-display font-bold text-muted/30 select-none">
                  {i + 1}
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-base mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Our Values */}
        <section className="mb-16 sm:mb-20">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-10 sm:mb-12">
            What We Stand For
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-base mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12 sm:py-16 rounded-2xl bg-muted/50 border border-border">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
            Ready to simplify your schedule?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Join thousands of professionals who trust Bᴏᴏᴋᴍᴇ.ʙᴇᴛ to handle their bookings.
          </p>
          <Link to="/auth">
            <Button size="lg" className="font-semibold">
              Get Started — It's Free
            </Button>
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
