import { Calendar, Clock, Globe, Bell, Shield, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "AI-powered calendar that finds the perfect time for everyone automatically."
  },
  {
    icon: Clock,
    title: "Time Zone Magic",
    description: "Automatically handles time zones so you never have to think about it."
  },
  {
    icon: Globe,
    title: "Custom Booking Pages",
    description: "Beautiful, branded pages that reflect your personality and business."
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Automated reminders via email and SMS to reduce no-shows by 90%."
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level encryption and compliance with SOC 2 and GDPR standards."
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized performance ensures instant booking with zero lag time."
  }
];

const Features = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold">
            Everything you need,
            <br />
            <span className="text-primary">nothing you don't</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features that make scheduling effortless, wrapped in an interface you'll love to use.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border bg-card group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:shadow-glow transition-shadow">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
