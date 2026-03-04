import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { pageSEO, siteConfig } from "@/lib/seo-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import HeroBackground from "@/components/HeroBackground";

const allFeatures = [
  "Unlimited event types",
  "Unlimited bookings",
  "Google Calendar two-way sync",
  "Slack booking notifications",
  "Payment collection via Stripe",
  "Embeddable booking widget",
  "AI event generation & chatbot",
  "Client directory / CRM",
  "Custom branding & themes",
  "Popular times & conversion analytics",
  "Buffer times & recurring bookings",
  "Timezone auto-detection",
  "Email confirmations & reminders",
  "Guest self-service (reschedule/cancel)",
  "QR code sharing",
];

const faqs = [
  { question: "Is CalendarPal really free?", answer: "Yes! All features are completely free during our early access period. We'll introduce optional premium add-ons in the future." },
  { question: "Do I need an invitation code?", answer: "Yes, CalendarPal is currently invite-only. You'll need a valid invitation code to create an account." },
  { question: "Will I lose access when paid plans launch?", answer: "No. Early users will always have access to core features. Future premium add-ons will be optional upgrades." },
  { question: "How do I get an invitation code?", answer: "Invitation codes are distributed by existing users and through our community channels. Ask a friend who already uses CalendarPal!" },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={pageSEO.pricing.title}
        description="CalendarPal is free for everyone. All features included."
        keywords={pageSEO.pricing.keywords}
        canonical={`${siteConfig.url}/pricing`}
        ogImage={siteConfig.ogImages.pricing}
      />
      <Navigation />
      
      <main className="pt-24 sm:pt-32 pb-16 sm:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="relative text-center max-w-3xl mx-auto mb-12 py-10 sm:py-14 lg:py-16 overflow-hidden rounded-2xl">
            <HeroBackground page="pricing" opacity={0.3} />
            <h1 className="relative z-10 font-display text-4xl md:text-5xl font-bold mb-6">
              Everything you need. Completely free.
            </h1>
            <p className="relative z-10 text-lg text-foreground/80 max-w-xl mx-auto">
              CalendarPal gives you professional scheduling tools with zero cost. No hidden fees, no feature limits, no credit card required.
            </p>
          </div>

          {/* Single Plan Card */}
          <div className="max-w-lg mx-auto mb-16">
            <Card className="border-primary shadow-lg shadow-primary/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 relative">
                <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Early Access
                </span>
              </div>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">CalendarPal</CardTitle>
                <p className="text-muted-foreground">All features included</p>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-5xl font-bold">$0</span>
                  <span className="text-muted-foreground">/forever</span>
                </div>
                <Button asChild size="lg" className="w-full mb-6">
                  <Link to="/auth">Get Started Free</Link>
                </Button>
                <ul className="space-y-3 text-left">
                  {allFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Trust */}
          <div className="flex justify-center mb-16">
            <div className="inline-flex items-center gap-3 px-6 py-4 bg-primary/5 border border-primary/20 rounded-2xl">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">No Credit Card Required</p>
                <p className="text-sm text-muted-foreground">Sign up with just an invitation code and start scheduling.</p>
              </div>
            </div>
          </div>

          {/* Future Add-ons teaser */}
          <div className="max-w-2xl mx-auto mb-16 text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Premium Add-ons Coming Soon</h2>
            </div>
            <p className="text-muted-foreground">
              We're building optional premium features like team scheduling, advanced analytics dashboards, white-label solutions, and API access. Early adopters will get exclusive pricing when they launch.
            </p>
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <Card key={faq.question} className="p-5">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Pricing;
