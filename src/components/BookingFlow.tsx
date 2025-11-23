import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import TimeSlotPicker from "@/components/calendar/TimeSlotPicker";
import { Calendar, Clock, Video, User, Mail, MessageSquare, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// Mock data - in a real app, this would come from your backend
const generateTimeSlots = () => {
  const slots = [];
  const hours = [9, 10, 11, 13, 14, 15, 16, 17];
  
  for (const hour of hours) {
    slots.push({
      time: `${hour}:00 ${hour < 12 ? 'AM' : 'PM'}`,
      available: Math.random() > 0.3 // 70% availability
    });
    slots.push({
      time: `${hour}:30 ${hour < 12 ? 'AM' : 'PM'}`,
      available: Math.random() > 0.3
    });
  }
  
  return slots;
};

const BookingFlow = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<'selection' | 'details'>('selection');
  const [timeSlots] = useState(generateTimeSlots());
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    notes: ""
  });

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) return;
    setStep('details');
  };

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Meeting booked successfully!", {
      description: `${format(selectedDate!, "MMMM d, yyyy")} at ${selectedTime}`
    });
    // Reset form
    setStep('selection');
    setSelectedDate(null);
    setSelectedTime(null);
    setFormData({ name: "", email: "", notes: "" });
  };

  const handleBack = () => {
    setStep('selection');
  };

  if (step === 'details') {
    return (
      <Card className="max-w-2xl mx-auto overflow-hidden border-border shadow-lg">
        <div className="p-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Enter Details</h2>
            <p className="text-muted-foreground">
              You're booking a 30-minute meeting
            </p>
            
            {/* Selected time display */}
            <div className="flex items-center gap-4 mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-medium">{selectedDate && format(selectedDate, "MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                <span className="font-medium">{selectedTime}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleBooking} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Name *
              </Label>
              <Input
                id="name"
                required
                placeholder="Your full name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Anything you'd like to discuss?"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
              />
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full">
              Confirm Booking
            </Button>
          </form>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-5xl mx-auto overflow-hidden border-border shadow-lg">
      <div className="grid md:grid-cols-[2fr,1fr] divide-x divide-border">
        {/* Left side - Calendar and event info */}
        <div className="p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Schedule a Meeting</h2>
            <p className="text-muted-foreground">
              Select a date and time that works for you
            </p>
          </div>

          <div className="grid gap-6">
            {/* Event details */}
            <div className="space-y-3 pb-6 border-b border-border">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">30 minutes</div>
                  <div className="text-muted-foreground text-xs">Meeting duration</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Video className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="font-medium">Google Meet</div>
                  <div className="text-muted-foreground text-xs">Video conference link provided</div>
                </div>
              </div>
            </div>

            {/* Calendar */}
            <CalendarGrid
              selectedDate={selectedDate}
              onSelectDate={handleDateSelect}
            />
          </div>
        </div>

        {/* Right side - Time slots */}
        <div className="p-8 bg-muted/30">
          <TimeSlotPicker
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onSelectTime={setSelectedTime}
            timeSlots={timeSlots}
          />
          
          {selectedDate && selectedTime && (
            <div className="mt-6 pt-6 border-t border-border animate-fade-in">
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full"
                onClick={handleConfirm}
              >
                Continue
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default BookingFlow;
