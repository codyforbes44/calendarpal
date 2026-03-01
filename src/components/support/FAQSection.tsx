import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface FAQ {
  question: string;
  answer: string;
}

interface FAQCategory {
  label: string;
  faqs: FAQ[];
}

const faqCategories: FAQCategory[] = [
  {
    label: "Getting Started",
    faqs: [
      {
        question: "How do I create an account?",
        answer: "Click \"Get Started\" on the homepage or navigate to the sign-up page. Enter your email and a strong password, then verify your email via the confirmation link sent to your inbox. Once verified, you can sign in and start using the platform."
      },
      {
        question: "What happens during onboarding?",
        answer: "After your first sign-in, the onboarding wizard guides you through four steps: setting up your profile (name, bio, avatar), creating your first event type, configuring your weekly availability, and reviewing a summary before launching your booking page."
      },
      {
        question: "How do I customize my profile?",
        answer: "Go to Profile Settings from your dashboard. You can upload an avatar (JPG, PNG, or WebP up to 2 MB), set your display name, write a short bio, choose your timezone, and customize your booking link slug."
      },
      {
        question: "What is my booking link and how do I find it?",
        answer: "Your booking link is a unique URL (e.g., calendarpal.lovable.app/book/your-username) where guests can view your event types and book time with you. Find it on your dashboard or in Profile Settings. Click \"Share\" to copy, share socially, or download a QR code."
      },
      {
        question: "How do I create my first event type?",
        answer: "From your dashboard, click \"Create Event\" in the Quick Actions section. Fill in the title, duration, location type (video, phone, or in-person), and an optional description. Choose a color label and click \"Create Event Type\" to publish it."
      }
    ]
  },
  {
    label: "Bookings",
    faqs: [
      {
        question: "How does the booking process work for guests?",
        answer: "Guests visit your booking link, select an event type, choose an available date and time slot (displayed in their local timezone), enter their name, email, and optional notes, then confirm the booking. Both you and the guest receive confirmation emails."
      },
      {
        question: "What does the guest experience look like?",
        answer: "Guests see a clean booking page with your profile info, available event types, a calendar showing open dates, and time slots for their selected day. The experience is mobile-friendly and requires no account creation from the guest."
      },
      {
        question: "Can I or my guest reschedule or cancel a booking?",
        answer: "Yes. You can reschedule or cancel any booking from your Bookings page via the three-dot menu. Guests receive a \"Manage Booking\" link in their confirmation email that lets them reschedule to a new available slot or cancel entirely."
      },
      {
        question: "How do notifications work?",
        answer: "You receive in-app notifications (bell icon) for new bookings, reschedules, and cancellations. You can customize notification preferences in Profile Settings to control which events trigger notifications."
      },
      {
        question: "Do guests receive confirmation emails?",
        answer: "Yes. When a booking is confirmed, both you and the guest receive an email with the meeting details, including date, time (in both timezones), location/meeting link, and a link for the guest to manage their booking."
      }
    ]
  },
  {
    label: "Billing & Subscription",
    faqs: [
      {
        question: "What's the difference between Free and Pro plans?",
        answer: "The Free plan includes up to 5 active event types, basic booking management, and email notifications. Pro unlocks unlimited event types, buffer times between meetings, booking analytics, priority support, and the AI assistant for event creation."
      },
      {
        question: "Is there a free trial for Pro?",
        answer: "We don't currently offer a time-limited trial, but the Free plan is fully functional for basic scheduling needs. You can upgrade to Pro at any time and your existing data carries over seamlessly."
      },
      {
        question: "What payment methods are accepted?",
        answer: "We accept all major credit and debit cards (Visa, Mastercard, American Express, Discover) through our secure payment processor, Stripe. All transactions are encrypted and PCI-compliant."
      },
      {
        question: "How do I cancel my Pro subscription?",
        answer: "Navigate to the Subscription page, click \"Manage Subscription\" to open the billing portal, then click \"Cancel Subscription.\" You'll retain Pro access until the end of your current billing period. You can resubscribe anytime."
      },
      {
        question: "What is your refund policy?",
        answer: "If you cancel within the first 7 days of your initial Pro subscription, you can request a full refund by contacting support. After 7 days, cancellation takes effect at the end of the billing cycle with no partial refunds."
      }
    ]
  },
  {
    label: "Privacy & Security",
    faqs: [
      {
        question: "How is my data secured?",
        answer: "We use industry-standard TLS encryption for all data in transit and AES-256 encryption for data at rest. Our infrastructure is hosted on secure cloud providers with SOC 2 compliance. Payment data is handled entirely by Stripe and never stored on our servers."
      },
      {
        question: "Is the platform GDPR compliant?",
        answer: "Yes. We follow GDPR principles including data minimization, purpose limitation, and right to erasure. You can export or delete your data at any time from Profile Settings. We do not sell personal data to third parties."
      },
      {
        question: "Can I export or delete my data?",
        answer: "Yes. You can delete your entire account and all associated data from Profile Settings. Account deletion is permanent and removes all bookings, event types, and personal information from our systems within 30 days."
      }
    ]
  },
  {
    label: "Technical",
    faqs: [
      {
        question: "What browsers are supported?",
        answer: "We support the latest two versions of Chrome, Firefox, Safari, and Edge. The application is also fully functional on mobile browsers including Chrome for Android and Safari on iOS."
      },
      {
        question: "How does timezone handling work?",
        answer: "Your default timezone is set in Profile Settings. When guests visit your booking page, their timezone is auto-detected and all available times are displayed in their local time. Confirmation emails include times in both timezones. Daylight saving time is handled automatically."
      },
      {
        question: "Is there a mobile app?",
        answer: "We don't have a native mobile app yet, but the web application is a Progressive Web App (PWA) — you can add it to your home screen on iOS or Android for an app-like experience with offline support and push notifications."
      }
    ]
  }
];

export const getAllFAQs = () =>
  faqCategories.flatMap(cat => cat.faqs);

const FAQSection = () => {
  const [activeCategory, setActiveCategory] = useState(faqCategories[0].label);
  const current = faqCategories.find(c => c.label === activeCategory) ?? faqCategories[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 mb-4">
        {faqCategories.map(cat => (
          <Badge
            key={cat.label}
            variant={activeCategory === cat.label ? "default" : "outline"}
            className="cursor-pointer px-3 py-1.5 text-sm"
            onClick={() => setActiveCategory(cat.label)}
          >
            {cat.label} ({cat.faqs.length})
          </Badge>
        ))}
      </div>

      <Accordion type="single" collapsible className="w-full">
        {current.faqs.map((faq, idx) => (
          <AccordionItem key={idx} value={`faq-${idx}`}>
            <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default FAQSection;
