import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, Video } from "lucide-react";

const timeSlots = [
  "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"
];

const BookingPreview = () => {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold">
            Book in <span className="text-accent">seconds</span>,
            <br />
            not minutes
          </h2>
          <p className="text-lg text-muted-foreground">
            See how simple and beautiful the booking experience is for your clients.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden border-border shadow-lg">
            <div className="grid md:grid-cols-2 divide-x divide-border">
              {/* Left side - Event info */}
              <div className="p-8 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">30 Minute Meeting</h3>
                  <p className="text-muted-foreground">
                    Let's discuss your project and see how we can help
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">30 minutes</div>
                      <div className="text-muted-foreground text-xs">Duration</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Video className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <div className="font-medium">Google Meet</div>
                      <div className="text-muted-foreground text-xs">Video Conference</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Monday, Dec 18</div>
                      <div className="text-muted-foreground text-xs">Selected Date</div>
                    </div>
                  </div>
                </div>

                {selectedTime && (
                  <div className="pt-6 border-t border-border animate-fade-in">
                    <Button variant="hero" size="lg" className="w-full" asChild>
                      <a href="/booking">Try It Live</a>
                    </Button>
                  </div>
                )}
              </div>

              {/* Right side - Time slots */}
              <div className="p-8 bg-muted/50">
                <h4 className="font-semibold mb-4">Select a time</h4>
                <div className="space-y-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        selectedTime === time
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-background hover:bg-muted border border-border hover:border-primary/50"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default BookingPreview;
