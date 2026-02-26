import AnimatedSection from "@/components/ui/animated-section";

const integrations = [
  { name: "Google Calendar", letter: "G" },
  { name: "Zoom", letter: "Z" },
  { name: "Microsoft Teams", letter: "T" },
  { name: "Outlook", letter: "O" },
  { name: "Slack", letter: "S" },
];

const LogoCloud = () => {
  return (
    <section className="py-10 sm:py-14 border-y border-border bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center">
          <p className="text-xs sm:text-sm text-muted-foreground mb-5 sm:mb-6 uppercase tracking-wider font-medium">
            Works with the tools you already use
          </p>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 items-center">
            {integrations.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-2 sm:gap-2.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-muted border border-border flex items-center justify-center text-xs sm:text-sm font-bold">
                  {item.letter}
                </div>
                <span className="text-sm sm:text-base font-medium">{item.name}</span>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default LogoCloud;
