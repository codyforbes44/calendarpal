import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "BookMe.Bet completely transformed how I manage client meetings. The timezone handling is flawless — I've never had a missed appointment since switching.",
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
      "As a freelancer, time is money. The custom booking page makes me look incredibly professional and the setup took under 5 minutes. Worth every penny.",
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
      "We onboarded our entire sales team in a single afternoon. Booking rates went up 40% in the first month. The analytics dashboard is genuinely useful.",
    name: "Jennifer Chen",
    role: "Sales Director, TechCorp",
    initials: "JC",
    stars: 5,
    accent: "from-primary/20 to-accent/5",
    ring: "ring-primary/20",
    avatarBg: "bg-gradient-to-br from-primary/20 to-accent/20",
    avatarText: "text-foreground",
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
        <div className="text-center mb-14 sm:mb-16">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            Loved by professionals
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            What our users are saying
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            Join thousands of professionals who've simplified their scheduling.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-2xl border border-border bg-gradient-to-br ${t.accent} p-6 sm:p-7 flex flex-col gap-5 ring-1 ${t.ring} backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star
                    key={i}
                    size={15}
                    className="text-accent fill-accent"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground/90 text-sm sm:text-base leading-relaxed flex-1">
                "{t.quote}"
              </p>

              {/* Author */}
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
        <div className="mt-12 flex flex-wrap justify-center items-center gap-6 sm:gap-10 text-muted-foreground text-sm">
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
            <span>1,000+ professionals</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={13} className="text-accent fill-accent" />
              ))}
            </div>
            <span>4.9 average rating</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
