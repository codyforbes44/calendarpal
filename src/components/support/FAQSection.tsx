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
        answer: "From your dashboard, click \"Create Event\" in the Quick Actions section. Fill in the title, duration, location type (video, phone, or in-person), and an optional description. You can also use the AI Generate button to auto-create a professional title and description. Choose a color label and click \"Create Event Type\" to publish it."
      }
    ]
  },
  {
    label: "Bookings",
    faqs: [
      {
        question: "How does the booking process work for guests?",
        answer: "Guests visit your booking link, select an event type, choose an available date and time slot (displayed in their local timezone), enter their name, email, and optional notes, then confirm the booking. If the event type has a price, payment is collected at booking via Stripe. Both you and the guest receive confirmation emails."
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
        answer: "You receive in-app notifications (bell icon) for new bookings, reschedules, and cancellations. You can also enable Slack notifications to receive booking alerts directly in a Slack channel. Customize notification preferences in Profile Settings."
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
        answer: "The Free plan includes 1 active event type, unlimited bookings, basic calendar integration, and email notifications. Pro unlocks unlimited event types, buffer times, Google Calendar two-way sync, Slack notifications, payment collection, embeddable booking widget, AI assistant, client directory, advanced analytics (popular times, conversion funnel), and priority support."
      },
      {
        question: "Can I collect payments for bookings?",
        answer: "Yes — Pro users can set a price on any event type. Payments are collected automatically via Stripe when guests book. You can track payment status on your Bookings page and manage refunds as needed."
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
    label: "Integrations",
    faqs: [
      {
        question: "How does Google Calendar sync work?",
        answer: "Connect your Google Calendar in Settings to enable two-way sync. Your Google Calendar events are checked for conflicts so guests can't double-book you. New bookings are automatically added to your Google Calendar. Busy-time detection works in real time."
      },
      {
        question: "How do I set up Slack notifications?",
        answer: "Go to Settings → Slack, enable Slack notifications, and enter your Slack channel ID. You'll receive instant alerts for new bookings, reschedules, and cancellations. Use the \"Send Test Notification\" button to verify your setup works."
      },
      {
        question: "Can I embed my booking page on my website?",
        answer: "Yes — Pro users can embed their booking page using an iframe or JavaScript snippet. Go to Settings → Embed to generate the code, customize the dimensions, and preview the result. The embedded widget supports booking confirmations and QR code sharing."
      },
      {
        question: "What integrations are supported?",
        answer: "Bᴏᴏᴋᴍᴇ.ʙᴇᴛ integrates with Google Calendar (two-way sync), Slack (booking alerts), Stripe (payment collection), Zoom, Microsoft Teams, and Outlook. More integrations are coming soon."
      }
    ]
  },
  {
    label: "AI & Advanced",
    faqs: [
      {
        question: "What can the AI assistant do?",
        answer: "The AI assistant helps in three ways: (1) Generate professional event titles and descriptions when creating event types, (2) Answer questions about your schedule and bookings via the dashboard chatbot, and (3) Power the AI search on the Support page for instant answers."
      },
      {
        question: "What is the Client Directory?",
        answer: "The Client Directory (Pro) is a CRM-style page that shows all guests who've booked with you, their total meetings, first and last meeting dates, and contact info. It's automatically populated from your booking history — no manual entry needed."
      },
      {
        question: "How does the embeddable widget work?",
        answer: "Pro users can embed their booking page on any website. Go to Settings → Embed to get an iframe or JavaScript code snippet. The widget is responsive, supports all event types, and sends a postMessage event when a booking is confirmed so your site can react to it."
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
