import { Link2, Cog, UserCheck } from "lucide-react";
import AnimatedSection from "@/components/ui/animated-section";

const steps = [
  {
    icon: Link2,
    number: "01",
    title: "Share Your Link",
    description: "Send your personal booking page. Guests pick a time that works — no back-and-forth emails.",
  },
  {
    icon: Cog,
    number: "02",
    title: "We Handle the Rest",
    description: "Automatic confirmations, smart reminders, and timezone conversion happen instantly.",
  },
  {
    icon: UserCheck,
    number: "03",
    title: "You Show Up",
    description: "No no-shows. No surprises. Just productive meetings, every single time.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3 sm:space-y-4">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            How it works
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold">
            Three steps to{" "}
            <span className="text-primary">zero busywork</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Set it up once. Let automation handle the rest forever.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

          {steps.map((step, index) => (
            <AnimatedSection key={index} delay={index * 150} animation="fade-up">
              <div className="relative text-center space-y-4 sm:space-y-5">
                {/* Number badge */}
                <div className="relative inline-flex flex-col items-center">
                  <span className="text-[10px] font-bold text-primary/50 tracking-widest mb-2">{step.number}</span>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
                    <step.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
                  </div>
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold">{step.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
