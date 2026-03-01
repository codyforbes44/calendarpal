import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus, UserCog, CalendarPlus, Clock,
  LayoutDashboard, Settings2, Share2, MailOpen,
  Timer, Sparkles, Globe, BarChart3,
  CreditCard, Receipt, Trash2
} from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Guide {
  icon: LucideIcon;
  title: string;
  description: string;
  steps: string[];
  pro?: boolean;
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
        description: "Sign up and complete the onboarding wizard to get started.",
        steps: [
          "Click \"Get Started\" on the homepage or navigate to the sign-up page.",
          "Enter your email address and create a secure password (minimum 8 characters with uppercase, lowercase, and a number).",
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
          "Upload a profile photo by clicking the avatar placeholder — supported formats are JPG, PNG, and WebP (max 2 MB).",
          "Enter your full name and a short bio that guests will see on your booking page.",
          "Set your booking link slug (e.g., calendarpal.lovable.app/book/your-name). This must be unique.",
          "Choose your default timezone from the dropdown — this is used for all scheduling.",
          "Click \"Save Changes\" to apply your profile updates."
        ]
      },
      {
        icon: CalendarPlus,
        title: "Creating Your First Event Type",
        description: "Define the title, duration, location, and description for an event.",
        steps: [
          "From your dashboard, click \"Create Event\" in the Quick Actions section.",
          "Enter a descriptive title (e.g., \"30-Minute Discovery Call\").",
          "Select a duration — common options are 15, 30, 45, or 60 minutes.",
          "Choose a location type: Video Call (auto-generates a meeting link), Phone, or In Person.",
          "Add an optional description to let guests know what to expect.",
          "Pick a color label to visually distinguish this event type on your calendar.",
          "Click \"Create Event Type\" to save. The event is now live on your booking page."
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
          "Disabled days (e.g., weekends) will show as unavailable to guests.",
          "Your availability applies across all event types by default.",
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
          "Open the Bookings page from your dashboard to see all your appointments.",
          "Use the status filter tabs (Upcoming, Past, Cancelled) to narrow results.",
          "Switch between List view and Calendar view using the toggle at the top.",
          "Calendar view shows a monthly heatmap — darker cells indicate more bookings.",
          "Click any booking to open a detail modal with guest info, timing, and actions.",
          "Booking statuses include: Confirmed (green), Pending, Cancelled (red), and Completed."
        ]
      },
      {
        icon: Settings2,
        title: "Managing Incoming Bookings",
        description: "Confirm, reschedule, or cancel appointments.",
        steps: [
          "From the Bookings page, click the three-dot menu (⋯) on any booking.",
          "Select \"Reschedule\" to propose a new date and time — the guest is notified via email.",
          "Select \"Cancel\" to cancel the booking — a cancellation email is sent to the guest automatically.",
          "You'll receive in-app notifications for new bookings, reschedules, and cancellations.",
          "Use the booking detail modal to view guest notes and meeting link."
        ]
      },
      {
        icon: Share2,
        title: "Sharing Your Booking Link",
        description: "Copy, share via social media, QR code, or embed.",
        steps: [
          "Click the \"Share\" button on your dashboard or profile settings page.",
          "Copy the direct link to your booking page with one click.",
          "Share directly to Twitter/X, Facebook, LinkedIn, or WhatsApp using the social buttons.",
          "Download a QR code image that links to your booking page — perfect for printed materials.",
          "Use the native device share option on mobile for additional sharing methods.",
          "Your booking link format: calendarpal.lovable.app/book/your-username"
        ]
      },
      {
        icon: MailOpen,
        title: "Guest Self-Service",
        description: "How guests reschedule or cancel via their email link.",
        steps: [
          "When a guest books a meeting, they receive a confirmation email.",
          "The email contains a secure \"Manage Booking\" link unique to that appointment.",
          "Clicking the link opens a page where the guest can view booking details.",
          "Guests can reschedule to a different available time slot without contacting you.",
          "Guests can also cancel the booking — you'll be notified via email and in-app notification.",
          "The manage link remains active until the booking date passes."
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
        description: "Add padding before and after meetings to avoid back-to-back scheduling.",
        pro: true,
        steps: [
          "Open the event type you want to configure (edit mode).",
          "Scroll to the \"Buffer Time\" section in the event form.",
          "Set \"Buffer Before\" to add minutes before each meeting (e.g., 5 or 10 minutes).",
          "Set \"Buffer After\" to add minutes after each meeting for wrap-up or notes.",
          "Buffer times are reflected in available time slots — guests won't see slots within buffer windows.",
          "This feature requires a Pro subscription."
        ]
      },
      {
        icon: Sparkles,
        title: "Using the AI Assistant",
        description: "Let AI generate event titles, descriptions, and more.",
        steps: [
          "When creating or editing an event type, look for the \"AI Generate\" button.",
          "Click it to have AI suggest a professional title and description based on your input.",
          "Review the generated content and edit as needed before saving.",
          "The AI assistant is also available on the dashboard for quick help and suggestions.",
          "Use the AI search on the Support page to get instant answers to your questions."
        ]
      },
      {
        icon: Globe,
        title: "Timezone Handling",
        description: "How international scheduling works seamlessly.",
        steps: [
          "Set your default timezone in Profile Settings — all your availability is based on this.",
          "When guests visit your booking page, times are automatically converted to their local timezone.",
          "The timezone selector on the booking page lets guests confirm or change their detected timezone.",
          "Booking confirmation emails display times in both the host's and guest's timezones.",
          "Daylight saving time transitions are handled automatically."
        ]
      },
      {
        icon: BarChart3,
        title: "Booking Analytics & Calendar Heatmap",
        description: "Track booking trends and visualize your schedule density.",
        steps: [
          "View the booking statistics chart on your dashboard for weekly and monthly trends.",
          "The calendar heatmap shows booking density — hover over any day to see the count.",
          "Dashboard stats cards show total bookings, upcoming meetings, and completion rates.",
          "Use the \"Today's Schedule\" section for a quick view of your day's appointments.",
          "Analytics data updates in real-time as new bookings come in."
        ]
      }
    ]
  },
  {
    label: "Account & Billing",
    guides: [
      {
        icon: CreditCard,
        title: "Upgrading to Pro",
        description: "Compare plans and complete the checkout flow.",
        steps: [
          "Navigate to the Subscription page from your dashboard.",
          "Compare Free and Pro plan features side by side.",
          "Choose between monthly ($8/month) or annual billing ($84/year — save ~13%).",
          "Click \"Upgrade to Pro\" to be redirected to the secure Stripe checkout page.",
          "Enter your payment details and confirm — your Pro features activate instantly.",
          "You'll receive a confirmation email with your invoice."
        ]
      },
      {
        icon: Receipt,
        title: "Managing Your Subscription",
        description: "Access the billing portal, view invoices, and cancel.",
        steps: [
          "Go to the Subscription page and click \"Manage Subscription\".",
          "The billing portal opens where you can update your payment method.",
          "View and download past invoices from the billing history section.",
          "To cancel, click \"Cancel Subscription\" in the portal — you'll retain Pro access until the end of your billing period.",
          "You can resubscribe anytime from the Subscription page."
        ]
      },
      {
        icon: Trash2,
        title: "Profile Settings & Account Deletion",
        description: "Update your details or permanently delete your account.",
        steps: [
          "Navigate to Profile Settings to update your name, bio, avatar, or timezone.",
          "Change your booking link slug if needed — note that old links will stop working.",
          "To delete your account, scroll to the bottom of Profile Settings.",
          "Click \"Delete Account\" and confirm — this action is permanent and cannot be undone.",
          "All your data, bookings, and event types will be permanently removed."
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
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{guide.title}</CardTitle>
                      {guide.pro && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Pro</Badge>}
                    </div>
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
