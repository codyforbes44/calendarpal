import { Star } from "lucide-react";
import AnimatedSection from "@/components/ui/animated-section";

const testimonials = [
  {
    quote:
      "Bᴏᴏᴋᴍᴇ.ʙᴇᴛ automated everything — confirmations, reminders, timezone conversion. I haven't touched a scheduling email in months.",
    name: "Sarah Kim",
    role: "Marketing Consultant",
    initials: "SK",
    stars: 5,
    accent: "from-primary/20 to-primary/5",
    ring: "ring-primary/30",
    avatarBg: "bg-primary/20",
    avatarText: "text-primary",
  },
  {
    quote:
      "Setup took 2 minutes. Within the first week, I saved 5 hours of back-and-forth emails. The ROI is insane for a free tool.",
    name: "Marcus Rodriguez",
    role: "Freelance Designer",
    initials: "MR",
    stars: 5,
    accent: "from-accent/20 to-accent/5",
    ring: "ring-accent/30",
    avatarBg: "bg-accent/20",
    avatarText: "text-accent",
  },
  {
    quote:
      "Our no-show rate dropped from 25% to under 3% with smart reminders. We onboarded the entire sales team in one afternoon.",
    name: "Jennifer Chen",
    role: "Sales Director, TechCorp",
    initials: "JC",
    stars: 5,
    accent: "from-primary/20 to-accent/5",
    ring: "ring-primary/20",
    avatarBg: "bg-gradient-to-br from-primary/20 to-accent/20",
    avatarText: "text-foreground",
  },
  {
    quote:
      "Recurring meetings run themselves now. Clients just book, the system handles the rest — I show up and focus on coaching.",
    name: "David Park",
    role: "Executive Coach",
    initials: "DP",
    stars: 5,
    accent: "from-accent/15 to-primary/5",
    ring: "ring-accent/20",
    avatarBg: "bg-accent/15",
    avatarText: "text-accent",
  },
];

const Testimonials = () => {
  return (
    <section className="py-20 sm:py-28 bg-background relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <AnimatedSection className="text-center mb-14 sm:mb-16">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            Loved by professionals
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            What our users are saying
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            Join thousands who've automated their scheduling and reclaimed their time.
          </p>
        </AnimatedSection>

        {/* Cards - 2x2 grid on desktop, horizontal scroll on mobile */}
        <div className="hidden md:grid md:grid-cols-2 gap-6">
          {testimonials.map((t, index) => (
            <AnimatedSection key={t.name} delay={index * 120} animation="fade-up">
              <div
                className={`relative rounded-2xl border border-border bg-gradient-to-br ${t.accent} p-6 sm:p-7 flex flex-col gap-5 ring-1 ${t.ring} backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg h-full`}
              >
                <div className="flex gap-1">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} size={15} className="text-accent fill-accent" />
                  ))}
                </div>
                <p className="text-foreground/90 text-sm sm:text-base leading-relaxed flex-1">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 pt-1 border-t border-border/50">
                  <div
                    className={`w-10 h-10 rounded-full ${t.avatarBg} flex items-center justify-center font-bold text-sm ${t.avatarText} shrink-0`}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{t.name}</p>
                    <p className="text-muted-foreground text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Mobile: horizontal scroll */}
        <div className="md:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-2xl border border-border bg-gradient-to-br ${t.accent} p-6 flex flex-col gap-5 ring-1 ${t.ring} backdrop-blur-sm min-w-[300px] snap-center shrink-0`}
            >
              <div className="flex gap-1">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} size={15} className="text-accent fill-accent" />
                ))}
              </div>
              <p className="text-foreground/90 text-sm leading-relaxed flex-1">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3 pt-1 border-t border-border/50">
                <div
                  className={`w-10 h-10 rounded-full ${t.avatarBg} flex items-center justify-center font-bold text-sm ${t.avatarText} shrink-0`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-muted-foreground text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Social proof bar */}
        <AnimatedSection delay={300} className="mt-12 flex flex-wrap justify-center items-center gap-6 sm:gap-10 text-muted-foreground text-sm">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {["AK", "BL", "CM", "DN", "EO"].map((init) => (
                <div
                  key={init}
                  className="w-7 h-7 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary"
                >
                  {init}
                </div>
              ))}
            </div>
            <span>50,000+ professionals</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={13} className="text-accent fill-accent" />
              ))}
            </div>
            <span>4.9 average rating</span>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default Testimonials;
