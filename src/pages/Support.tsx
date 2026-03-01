import Navigation from "@/components/Navigation";
import AISearchBox from "@/components/support/AISearchBox";
import DocumentationSection from "@/components/support/DocumentationSection";
import FAQSection, { getAllFAQs } from "@/components/support/FAQSection";
import FeatureRequestSection from "@/components/support/FeatureRequestSection";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, FileText, MessageSquare, Lightbulb } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { pageSEO, siteConfig } from "@/lib/seo-config";
import HeroBackground from "@/components/HeroBackground";

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

  const allFaqs = getAllFAQs();
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": allFaqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={pageSEO.support.title}
        description={pageSEO.support.description}
        keywords={pageSEO.support.keywords}
        canonical={`${siteConfig.url}/support`}
        ogImage={siteConfig.ogImages.support}
        structuredData={faqSchema}
      />
      <Navigation />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12 sm:pb-20">
        <div className="relative text-center max-w-3xl mx-auto mb-10 sm:mb-16 py-10 sm:py-14 lg:py-16 overflow-hidden rounded-2xl">
          <HeroBackground page="support" opacity={0.3} />
          <h1 className="relative z-10 text-3xl sm:text-4xl font-bold mb-4">How can we help?</h1>
          <p className="relative z-10 text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Browse our documentation, find answers to common questions, or suggest new features.
          </p>
        </div>

        <AISearchBox />

        <Tabs defaultValue="docs" className="mb-12 sm:mb-16">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
            <TabsTrigger value="docs" className="gap-1.5">
              <FileText className="h-4 w-4 hidden sm:block" />
              Docs
            </TabsTrigger>
            <TabsTrigger value="faq" className="gap-1.5">
              <MessageSquare className="h-4 w-4 hidden sm:block" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-1.5">
              <Lightbulb className="h-4 w-4 hidden sm:block" />
              Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="docs">
            <DocumentationSection />
          </TabsContent>

          <TabsContent value="faq">
            <div className="max-w-3xl mx-auto">
              <FAQSection />
            </div>
          </TabsContent>

          <TabsContent value="requests">
            <div className="max-w-4xl mx-auto">
              <FeatureRequestSection />
            </div>
          </TabsContent>
        </Tabs>

        {/* Contact Form */}
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

      <Footer />
    </div>
  );
};

export default Support;
