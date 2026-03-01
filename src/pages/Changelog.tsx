import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { siteConfig } from "@/lib/seo-config";
import HeroBackground from "@/components/HeroBackground";
import AnimatedSection from "@/components/ui/animated-section";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Sparkles, Zap, Shield, Bug, ArrowUpRight } from "lucide-react";

type ChangeType = "feature" | "improvement" | "fix" | "security";

interface ChangelogEntry {
  date: string;
  version: string;
  title: string;
  description: string;
  changes: {
    type: ChangeType;
    text: string;
  }[];
}

const typeConfig: Record<ChangeType, { label: string; icon: React.ComponentType<{ className?: string }>; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  feature: { label: "New", icon: Sparkles, variant: "default" },
  improvement: { label: "Improved", icon: Zap, variant: "secondary" },
  fix: { label: "Fixed", icon: Bug, variant: "outline" },
  security: { label: "Security", icon: Shield, variant: "destructive" },
};

const entries: ChangelogEntry[] = [
  {
    date: "2026-03-01",
    version: "2.4.0",
    title: "Content Refresh & SEO Overhaul",
    description: "Comprehensive update to all public pages to accurately reflect every platform capability.",
    changes: [
      { type: "feature", text: "Added changelog page for transparent platform updates" },
      { type: "improvement", text: "Expanded Features section with Payment Collection, AI Assistant, Embeddable Widget, and Client Directory" },
      { type: "improvement", text: "Updated FAQ with Integrations and AI & Advanced categories (28 total Q&As)" },
      { type: "improvement", text: "Added Stripe to LogoCloud integrations bar" },
      { type: "improvement", text: "Standardized social proof numbers across all pages (50,000+)" },
      { type: "improvement", text: "Enhanced CTA benefits to highlight AI, payments, and integrations" },
      { type: "improvement", text: "Updated SEO keywords for payment collection, Slack, and AI scheduling" },
    ],
  },
  {
    date: "2026-02-20",
    version: "2.3.0",
    title: "Client Directory & Advanced Analytics",
    description: "CRM-style client tracking and deeper booking analytics for Pro users.",
    changes: [
      { type: "feature", text: "Client Directory with aggregated meeting stats per guest" },
      { type: "feature", text: "Popular Times heatmap showing peak booking hours" },
      { type: "feature", text: "Conversion funnel tracking from page view to confirmed booking" },
      { type: "improvement", text: "Dashboard now shows booking stats chart with weekly trends" },
    ],
  },
  {
    date: "2026-02-10",
    version: "2.2.0",
    title: "AI Assistant & Smart Event Generation",
    description: "AI capabilities across the platform — from event creation to schedule Q&A.",
    changes: [
      { type: "feature", text: "AI-powered event title and description generation" },
      { type: "feature", text: "Dashboard chatbot for schedule questions and booking insights" },
      { type: "feature", text: "AI search on the Support page for instant answers" },
      { type: "improvement", text: "Smarter time slot suggestions based on booking patterns" },
    ],
  },
  {
    date: "2026-01-28",
    version: "2.1.0",
    title: "Embeddable Widget & QR Codes",
    description: "New ways to share your booking page — embed it anywhere or share a QR code.",
    changes: [
      { type: "feature", text: "Embeddable booking widget with iframe and JavaScript snippet options" },
      { type: "feature", text: "QR code generation for booking links in the Share modal" },
      { type: "improvement", text: "Share modal redesigned with copy, social share, and QR tabs" },
      { type: "fix", text: "Fixed embed preview not updating when dimensions changed" },
    ],
  },
  {
    date: "2026-01-15",
    version: "2.0.0",
    title: "Payments & Slack Notifications",
    description: "Accept payments at booking and get real-time Slack alerts for every booking event.",
    changes: [
      { type: "feature", text: "Stripe payment collection for paid event types" },
      { type: "feature", text: "Slack integration with channel-based booking notifications" },
      { type: "feature", text: "Test notification button for Slack setup verification" },
      { type: "security", text: "PCI-compliant payment handling — card data never touches our servers" },
      { type: "fix", text: "Fixed timezone offset in confirmation emails for DST transitions" },
    ],
  },
  {
    date: "2026-01-05",
    version: "1.9.0",
    title: "Google Calendar Two-Way Sync",
    description: "Full calendar sync so you're never double-booked.",
    changes: [
      { type: "feature", text: "Two-way Google Calendar sync with busy-time detection" },
      { type: "feature", text: "Automatic calendar event creation for new bookings" },
      { type: "improvement", text: "Real-time conflict checking during time slot selection" },
      { type: "fix", text: "Fixed refresh token expiry not triggering re-authentication" },
    ],
  },
  {
    date: "2025-12-20",
    version: "1.8.0",
    title: "Buffer Times & Recurring Meetings",
    description: "More control over your schedule with buffer times and repeating bookings.",
    changes: [
      { type: "feature", text: "Configurable buffer times before and after meetings" },
      { type: "feature", text: "Recurring meeting support with weekly, bi-weekly, and monthly patterns" },
      { type: "improvement", text: "Improved availability editor with drag-to-set time ranges" },
    ],
  },
];

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const changelogSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  "name": `${siteConfig.name} Changelog`,
  "description": "Platform updates, new features, and improvements for Bᴏᴏᴋᴍᴇ.ʙᴇᴛ scheduling platform.",
  "url": `${siteConfig.url}/changelog`,
  "blogPost": entries.map((entry) => ({
    "@type": "BlogPosting",
    "headline": `${entry.version}: ${entry.title}`,
    "datePublished": entry.date,
    "description": entry.description,
    "author": { "@type": "Organization", "name": siteConfig.name },
  })),
};

const Changelog = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`Changelog | ${siteConfig.name}`}
        description="See what's new in Bᴏᴏᴋᴍᴇ.ʙᴇᴛ. Latest features, improvements, and fixes for the booking automation platform."
        keywords="changelog, updates, new features, release notes, booking software updates"
        canonical={`${siteConfig.url}/changelog`}
        ogImage={siteConfig.ogImages.home}
        structuredData={changelogSchema}
      />
      <Navigation />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12 sm:pb-20">
        {/* Hero */}
        <div className="relative text-center max-w-3xl mx-auto mb-12 sm:mb-16 py-10 sm:py-14 lg:py-16 overflow-hidden rounded-2xl">
          <HeroBackground page="support" opacity={0.3} />
          <h1 className="relative z-10 font-display text-3xl sm:text-4xl font-bold mb-4">Changelog</h1>
          <p className="relative z-10 text-base sm:text-xl text-foreground/80 max-w-2xl mx-auto">
            Every improvement, new feature, and fix — shipped transparently.
          </p>
        </div>

        {/* Timeline */}
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border hidden sm:block" />

            <div className="space-y-10">
              {entries.map((entry, idx) => (
                <AnimatedSection key={entry.version} delay={idx * 80} animation="fade-up">
                  <div className="flex gap-4 sm:gap-6">
                    {/* Timeline dot */}
                    <div className="hidden sm:flex flex-col items-center pt-1.5">
                      <div className="w-[10px] h-[10px] rounded-full bg-primary ring-4 ring-background z-10 shrink-0" />
                    </div>

                    {/* Content */}
                    <Card className="flex-1 p-5 sm:p-6 hover:border-primary/30 transition-colors">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          v{entry.version}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(entry.date)}
                        </span>
                      </div>

                      <h2 className="font-display text-lg sm:text-xl font-bold mb-1.5">{entry.title}</h2>
                      <p className="text-sm text-muted-foreground mb-4">{entry.description}</p>

                      <ul className="space-y-2">
                        {entry.changes.map((change, i) => {
                          const config = typeConfig[change.type];
                          const Icon = config.icon;
                          return (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <Badge variant={config.variant} className="text-[10px] px-1.5 py-0 leading-5 shrink-0 mt-0.5">
                                <Icon className="w-3 h-3 mr-1" />
                                {config.label}
                              </Badge>
                              <span className="text-foreground/90">{change.text}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </Card>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Changelog;
