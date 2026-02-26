import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, Video, Check } from "lucide-react";
import AnimatedSection from "@/components/ui/animated-section";

const timeSlots = [
  "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"
];

const BookingPreview = () => {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  return (
    <section id="preview" className="py-16 sm:py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-10 sm:mb-16 space-y-3 sm:space-y-4">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold">
            Book in <span className="text-accent">seconds</span>,
            <br />
            not minutes
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            See how simple and beautiful the booking experience is for your clients.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={200} className="max-w-4xl mx-auto">
          <Card className="overflow-hidden border-border shadow-lg">
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
              {/* Left side - Event info */}
              <div className="p-5 sm:p-8 space-y-5 sm:space-y-6">
                <div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold mb-2">30 Minute Meeting</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Let's discuss your project and see how we can help
                  </p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">30 minutes</div>
                      <div className="text-muted-foreground text-xs">Duration</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <Video className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                    </div>
                    <div>
                      <div className="font-medium">Google Meet</div>
                      <div className="text-muted-foreground text-xs">Video Conference</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Monday, Dec 18</div>
                      <div className="text-muted-foreground text-xs">Selected Date</div>
                    </div>
                  </div>
                </div>

                <div className={`pt-4 sm:pt-6 border-t border-border transition-all duration-500 ${selectedTime ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                  <Button variant="hero" size="lg" className="w-full" asChild>
                    <a href="/auth">Get Started Free</a>
                  </Button>
                </div>
              </div>

              {/* Right side - Time slots */}
              <div className="p-5 sm:p-8 bg-muted/50">
                <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Select a time</h4>
                <div className="space-y-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 touch-target flex items-center justify-between ${
                        selectedTime === time
                          ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                          : "bg-background hover:bg-muted border border-border hover:border-primary/50"
                      }`}
                    >
                      <span>{time}</span>
                      {selectedTime === time && (
                        <Check className="w-4 h-4 animate-scale-in" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default BookingPreview;
