import Navigation from "@/components/Navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare, FileText, Lightbulb } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Support = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent! We'll get back to you within 24 hours.");
    setName("");
    setEmail("");
    setMessage("");
  };

  const faqs = [
    {
      question: "How do I create my first event type?",
      answer: "After signing in, go to your Dashboard and click 'Create Event'. Fill in the event details like title, duration, and description, then save. Your event will be ready for guests to book."
    },
    {
      question: "How do I set my availability?",
      answer: "Navigate to the Availability page from your dashboard. You can set your working hours for each day of the week. Toggle days on or off and adjust start and end times as needed."
    },
    {
      question: "How do I share my booking link?",
      answer: "On your Dashboard or Profile Settings page, click the 'Share' button next to your booking link. You can copy the link, share via social media, email, or download a QR code."
    },
    {
      question: "Can guests reschedule or cancel bookings?",
      answer: "Yes! Guests receive a confirmation email with a secure link to manage their booking. They can use this link to reschedule or cancel. You can also manage all bookings from your dashboard."
    },
    {
      question: "How does the Pro subscription work?",
      answer: "Pro unlocks unlimited bookings, recurring meetings, buffer times, and priority support. You can subscribe monthly ($12/month) or annually ($114/year for ~21% savings). Manage your subscription anytime from the Subscription page."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "Go to the Subscription page in your dashboard and click 'Manage Subscription'. This will open the billing portal where you can cancel, update payment methods, or view invoices."
    },
    {
      question: "What timezone does MeetFlow use?",
      answer: "MeetFlow automatically detects and displays times in each user's local timezone. When a guest books, they see times in their timezone while you see them in yours. All conversions are handled automatically."
    },
    {
      question: "Is my data secure?",
      answer: "Yes! We use industry-standard encryption and security practices. Payment information is processed securely through Stripe. We never sell your data to third parties."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">How can we help?</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions or reach out to our team for personalized support.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Documentation</CardTitle>
              <CardDescription>Browse our guides and tutorials</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Learn how to get the most out of MeetFlow with step-by-step guides.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>FAQ</CardTitle>
              <CardDescription>Quick answers to common questions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Find instant answers to frequently asked questions below.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Feature Requests</CardTitle>
              <CardDescription>Share your ideas with us</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Have a suggestion? We'd love to hear how we can improve MeetFlow.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl font-semibold mb-6 text-center">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="max-w-xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Still need help?</CardTitle>
              <CardDescription>
                Send us a message and we'll get back to you within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we help you?"
                    rows={4}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border py-8 bg-muted/30">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2025 MeetFlow. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Support;