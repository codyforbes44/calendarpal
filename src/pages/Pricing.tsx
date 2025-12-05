import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Minus } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for getting started",
    features: [
      "1 event type",
      "Unlimited bookings",
      "Basic calendar integration",
      "Email notifications",
      "7-day scheduling window",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/month",
    description: "For professionals and small teams",
    features: [
      "Unlimited event types",
      "Unlimited bookings",
      "Google Calendar sync",
      "Custom branding",
      "Priority support",
      "Unlimited scheduling window",
      "Team scheduling",
      "Analytics dashboard",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations",
    features: [
      "Everything in Pro",
      "SSO authentication",
      "Advanced security",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
      "API access",
      "White-label solution",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-muted-foreground">
              Choose the plan that fits your needs. Start free and scale as you grow.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.name}
                className={`relative flex flex-col ${
                  plan.popular 
                    ? "border-primary shadow-lg shadow-primary/10 scale-105" 
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="text-center flex-1">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  
                  <ul className="space-y-3 text-left">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <a href="/auth">{plan.cta}</a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Feature Comparison Table */}
          <div className="mt-24 max-w-5xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-center mb-12">
              Compare Plans
            </h2>
            
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[280px] font-semibold">Features</TableHead>
                    <TableHead className="text-center font-semibold">Free</TableHead>
                    <TableHead className="text-center font-semibold bg-primary/5">Pro</TableHead>
                    <TableHead className="text-center font-semibold">Enterprise</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Scheduling */}
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={4} className="font-semibold text-sm">Scheduling</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Event types</TableCell>
                    <TableCell className="text-center">1</TableCell>
                    <TableCell className="text-center bg-primary/5">Unlimited</TableCell>
                    <TableCell className="text-center">Unlimited</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Bookings per month</TableCell>
                    <TableCell className="text-center">Unlimited</TableCell>
                    <TableCell className="text-center bg-primary/5">Unlimited</TableCell>
                    <TableCell className="text-center">Unlimited</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Scheduling window</TableCell>
                    <TableCell className="text-center">7 days</TableCell>
                    <TableCell className="text-center bg-primary/5">Unlimited</TableCell>
                    <TableCell className="text-center">Unlimited</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Buffer times</TableCell>
                    <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Minimum notice</TableCell>
                    <TableCell className="text-center">24 hours</TableCell>
                    <TableCell className="text-center bg-primary/5">Custom</TableCell>
                    <TableCell className="text-center">Custom</TableCell>
                  </TableRow>

                  {/* Integrations */}
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={4} className="font-semibold text-sm">Integrations</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Google Calendar</TableCell>
                    <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Outlook Calendar</TableCell>
                    <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Zoom integration</TableCell>
                    <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Custom integrations</TableCell>
                    <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>API access</TableCell>
                    <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  </TableRow>

                  {/* Customization */}
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={4} className="font-semibold text-sm">Customization</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Custom branding</TableCell>
                    <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Remove MeetFlow branding</TableCell>
                    <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>White-label solution</TableCell>
                    <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  </TableRow>

                  {/* Team Features */}
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={4} className="font-semibold text-sm">Team Features</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Team members</TableCell>
                    <TableCell className="text-center">1</TableCell>
                    <TableCell className="text-center bg-primary/5">Up to 10</TableCell>
                    <TableCell className="text-center">Unlimited</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Round-robin scheduling</TableCell>
                    <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Collective scheduling</TableCell>
                    <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  </TableRow>

                  {/* Analytics & Reporting */}
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={4} className="font-semibold text-sm">Analytics & Reporting</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Basic analytics</TableCell>
                    <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Advanced reporting</TableCell>
                    <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  </TableRow>

                  {/* Support & Security */}
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={4} className="font-semibold text-sm">Support & Security</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Email support</TableCell>
                    <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Priority support</TableCell>
                    <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Dedicated support</TableCell>
                    <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>SSO authentication</TableCell>
                    <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>SLA guarantee</TableCell>
                    <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-24 max-w-3xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              <div className="border-b border-border pb-6">
                <h3 className="font-semibold mb-2">Can I switch plans anytime?</h3>
                <p className="text-muted-foreground text-sm">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </div>
              
              <div className="border-b border-border pb-6">
                <h3 className="font-semibold mb-2">Is there a free trial?</h3>
                <p className="text-muted-foreground text-sm">
                  Yes, the Pro plan comes with a 14-day free trial. No credit card required.
                </p>
              </div>
              
              <div className="border-b border-border pb-6">
                <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
                <p className="text-muted-foreground text-sm">
                  We accept all major credit cards, PayPal, and bank transfers for annual plans.
                </p>
              </div>
              
              <div className="pb-6">
                <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
                <p className="text-muted-foreground text-sm">
                  Absolutely. You can cancel your subscription at any time with no questions asked.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2024 MeetFlow. Built with love for better scheduling.
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
