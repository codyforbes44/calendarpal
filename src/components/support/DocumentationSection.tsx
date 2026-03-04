import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus, UserCog, CalendarPlus, Clock,
  LayoutDashboard, Settings2, Share2, MailOpen,
  Timer, Sparkles, Globe, BarChart3,
  CreditCard, Trash2,
  MessageSquare, Code, UserCheck, Calendar
} from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Guide {
  icon: LucideIcon;
  title: string;
  description: string;
  steps: string[];
}

interface GuideCategory {
  label: string;
  guides: Guide[];
}

const categories: GuideCategory[] = [
  {
    label: "Getting Started",
    guides: [
      {
        icon: UserPlus,
        title: "Creating Your Account",
        description: "Sign up with an invitation code and complete the onboarding wizard.",
        steps: [
          "Obtain an invitation code from an existing CalendarPal user or admin.",
          "Click \"Get Started\" on the homepage or navigate to the sign-up page.",
          "Enter your invitation code, email address, and create a secure password.",
          "Check your inbox for a verification email and click the confirmation link.",
          "Once verified, you'll be guided through the onboarding wizard to set up your profile, create your first event, and configure your availability.",
          "After completing onboarding, you'll land on your personalized dashboard."
        ]
      },
      {
        icon: UserCog,
        title: "Setting Up Your Profile",
        description: "Customize your name, bio, avatar, and booking link slug.",
        steps: [
          "Navigate to Profile Settings from the dashboard sidebar or bottom navigation.",
          "Upload a profile photo — supported formats are JPG, PNG, and WebP (max 2 MB).",
          "Enter your full name and a short bio that guests will see on your booking page.",
          "Set your booking link slug (e.g., calendarpal.lovable.app/book/your-name).",
          "Choose your default timezone from the dropdown.",
          "Click \"Save Changes\" to apply your profile updates."
        ]
      },
      {
        icon: CalendarPlus,
        title: "Creating Your First Event Type",
        description: "Define the title, duration, location, and description for an event.",
        steps: [
          "From your dashboard, click \"Create Event\" in the Quick Actions section.",
          "Enter a descriptive title or use the AI Generate button for suggestions.",
          "Select a duration — common options are 15, 30, 45, or 60 minutes.",
          "Choose a location type: Video Call, Phone, or In Person.",
          "Optionally set a price to collect payment at booking.",
          "Add an optional description to let guests know what to expect.",
          "Pick a color label to visually distinguish this event type.",
          "Click \"Create Event Type\" to save."
        ]
      },
      {
        icon: Clock,
        title: "Setting Your Weekly Availability",
        description: "Define working hours for each day of the week.",
        steps: [
          "Navigate to the Availability page from the dashboard.",
          "Each day of the week is listed with a toggle to enable or disable it.",
          "For enabled days, set your start and end times using the time pickers.",
          "Disabled days will show as unavailable to guests.",
          "Click \"Save Availability\" to confirm your schedule."
        ]
      }
    ]
  },
  {
    label: "Booking Management",
    guides: [
      {
        icon: LayoutDashboard,
        title: "Understanding Your Bookings Dashboard",
        description: "Navigate filters, views, and booking statuses.",
        steps: [
          "Open the Bookings page to see all your appointments.",
          "Use the status filter tabs (Upcoming, Past, Cancelled) to narrow results.",
          "Switch between List view and Calendar view using the toggle.",
          "Click any booking to open a detail modal with guest info, timing, and actions.",
          "Booking statuses include: Confirmed, Pending, Cancelled, and Completed."
        ]
      },
      {
        icon: Settings2,
        title: "Managing Incoming Bookings",
        description: "Confirm, reschedule, or cancel appointments.",
        steps: [
          "From the Bookings page, click the three-dot menu on any booking.",
          "Select \"Reschedule\" to propose a new date and time.",
          "Select \"Cancel\" to cancel — a cancellation email is sent automatically.",
          "You'll receive in-app notifications for booking changes.",
          "Use the booking detail modal to view guest notes and meeting link."
        ]
      },
      {
        icon: Share2,
        title: "Sharing Your Booking Link",
        description: "Copy, share via social media, QR code, or embed.",
        steps: [
          "Click the \"Share\" button on your dashboard.",
          "Copy the direct link with one click.",
          "Share directly to Twitter/X, Facebook, LinkedIn, or WhatsApp.",
          "Download a QR code image for printed materials.",
          "Your booking link format: calendarpal.lovable.app/book/your-username"
        ]
      },
      {
        icon: MailOpen,
        title: "Guest Self-Service",
        description: "How guests reschedule or cancel via their email link.",
        steps: [
          "When a guest books, they receive a confirmation email.",
          "The email contains a secure \"Manage Booking\" link.",
          "Guests can reschedule to a different available time slot.",
          "Guests can also cancel — you'll be notified via email and in-app.",
          "The manage link remains active until the booking date passes."
        ]
      }
    ]
  },
  {
    label: "Integrations",
    guides: [
      {
        icon: Calendar,
        title: "Google Calendar Sync",
        description: "Connect your Google Calendar for two-way sync and busy-time detection.",
        steps: [
          "Navigate to Settings from your dashboard.",
          "Click \"Connect Google Calendar\" and sign in with your Google account.",
          "Once connected, Google Calendar events are checked for conflicts.",
          "New bookings are automatically added to your Google Calendar.",
          "To disconnect, click \"Disconnect\" in the same settings section."
        ]
      },
      {
        icon: MessageSquare,
        title: "Slack Notifications",
        description: "Receive instant booking alerts in your Slack workspace.",
        steps: [
          "Navigate to Settings → Slack section.",
          "Toggle \"Enable Slack Notifications\" on.",
          "Enter your Slack channel ID.",
          "Click \"Save Slack Settings\" to activate.",
          "Use \"Send Test Notification\" to verify the setup."
        ]
      },
      {
        icon: CreditCard,
        title: "Payment Collection with Stripe",
        description: "Accept payments when guests book meetings.",
        steps: [
          "When creating or editing an event type, scroll to the pricing section.",
          "Enter a price amount and choose a currency.",
          "Guests will be prompted to pay via Stripe's secure checkout.",
          "Payment status is tracked on your Bookings page."
        ]
      },
      {
        icon: Code,
        title: "Embeddable Booking Widget",
        description: "Add your booking page to any website with a code snippet.",
        steps: [
          "Navigate to Settings → Embed from your dashboard.",
          "Choose between iframe embed or JavaScript widget.",
          "Customize the width and height to fit your website.",
          "Copy the generated code and paste it into your website's HTML."
        ]
      }
    ]
  },
  {
    label: "Advanced Features",
    guides: [
      {
        icon: Timer,
        title: "Configuring Buffer Times",
        description: "Add padding before and after meetings.",
        steps: [
          "Open the event type you want to configure.",
          "Scroll to the \"Buffer Time\" section.",
          "Set \"Buffer Before\" and \"Buffer After\" minutes.",
          "Buffer times are reflected in available time slots."
        ]
      },
      {
        icon: Sparkles,
        title: "Using the AI Assistant",
        description: "Let AI generate event titles, descriptions, and answer your questions.",
        steps: [
          "When creating an event, look for the \"AI Generate\" button.",
          "Click it to have AI suggest a professional title and description.",
          "The AI chatbot on your dashboard can answer scheduling questions.",
          "Use AI search on the Support page for instant answers."
        ]
      },
      {
        icon: Globe,
        title: "Timezone Handling",
        description: "How international scheduling works seamlessly.",
        steps: [
          "Set your default timezone in Profile Settings.",
          "Times are automatically converted to guest's local timezone.",
          "Booking confirmation emails display times in both timezones.",
          "Daylight saving time transitions are handled automatically."
        ]
      },
      {
        icon: BarChart3,
        title: "Analytics & Popular Times",
        description: "Track booking trends, popular times, and conversion funnels.",
        steps: [
          "View booking statistics on your dashboard.",
          "The calendar heatmap shows booking density.",
          "The Popular Times chart shows your busiest hours.",
          "The Conversion Funnel tracks page views vs. bookings.",
          "Analytics data updates in real-time."
        ]
      },
      {
        icon: UserCheck,
        title: "Client Directory",
        description: "View and manage all guests who've booked with you.",
        steps: [
          "Navigate to the Clients page from your sidebar.",
          "The directory automatically aggregates all guests.",
          "Each client shows name, email, meeting count, and dates.",
          "Use search and sorting to find specific clients."
        ]
      }
    ]
  },
  {
    label: "Account",
    guides: [
      {
        icon: Trash2,
        title: "Profile Settings & Account Deletion",
        description: "Update your details or permanently delete your account.",
        steps: [
          "Navigate to Profile Settings to update your info.",
          "Change your booking link slug if needed.",
          "To delete your account, scroll to the bottom of Profile Settings.",
          "Click \"Delete Account\" and confirm — this is permanent."
        ]
      }
    ]
  }
];

const DocumentationSection = () => {
  const [activeCategory, setActiveCategory] = useState(categories[0].label);
  const current = categories.find(c => c.label === activeCategory) ?? categories[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <Badge
            key={cat.label}
            variant={activeCategory === cat.label ? "default" : "outline"}
            className="cursor-pointer px-3 py-1.5 text-sm"
            onClick={() => setActiveCategory(cat.label)}
          >
            {cat.label}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {current.guides.map((guide, idx) => {
          const Icon = guide.icon;
          return (
            <Card key={idx} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">{guide.title}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">{guide.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex-1">
                <Accordion type="single" collapsible>
                  <AccordionItem value="steps" className="border-0">
                    <AccordionTrigger className="py-2 text-sm text-primary hover:no-underline">
                      Step-by-step guide
                    </AccordionTrigger>
                    <AccordionContent>
                      <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                        {guide.steps.map((step, i) => (
                          <li key={i} className="leading-relaxed">{step}</li>
                        ))}
                      </ol>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentationSection;
