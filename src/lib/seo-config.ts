export const siteConfig = {
  name: "CalendarPal",
  url: "https://calendarpal.com",
  description: "Best scheduling software for professionals. Book meetings effortlessly with automated timezone handling, calendar sync, and beautiful booking pages.",
  author: "CalendarPal",
  twitterHandle: "@calendarpal",
  themeColor: "#4F46E5",
  logo: "/calendarpal-logo.png",
  ogImages: {
    home: "/og-home.png",
    pricing: "/og-pricing.png",
    support: "/og-support.png",
  },
};

export const defaultSEO = {
  title: "CalendarPal - Scheduling Made Simple",
  description: siteConfig.description,
  keywords: "scheduling app, appointment booking, calendar scheduling, meeting scheduler, online booking, time management, professional scheduling",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: siteConfig.name,
  },
};

export const pageSEO = {
  home: {
    title: "CalendarPal - Scheduling Made Simple",
    description: "Best scheduling software for professionals. Book meetings effortlessly with automated timezone handling, calendar sync, and beautiful booking pages.",
    keywords: "scheduling app, appointment booking, calendar scheduling, meeting scheduler, online booking software",
  },
  pricing: {
    title: "Pricing Plans | CalendarPal",
    description: "Affordable scheduling plans starting free. Compare Free, Pro & Enterprise features. No hidden fees, cancel anytime.",
    keywords: "scheduling software pricing, appointment booking cost, calendar app pricing, meeting scheduler plans",
  },
  auth: {
    title: "Sign In | CalendarPal",
    description: "Create your free CalendarPal account or sign in to manage your bookings and scheduling. Get started in seconds.",
    keywords: "sign up scheduling app, login booking software, create scheduling account",
  },
  terms: {
    title: "Terms of Service | CalendarPal",
    description: "CalendarPal terms of service. Read our legal terms and conditions for using our scheduling platform.",
    keywords: "terms of service scheduling, booking software terms, calendar app legal",
  },
  privacy: {
    title: "Privacy Policy | CalendarPal",
    description: "Learn how CalendarPal protects your data. GDPR compliant scheduling software with enterprise-grade security.",
    keywords: "privacy policy scheduling app, data protection booking software, GDPR scheduling",
  },
  support: {
    title: "Help & Support | CalendarPal",
    description: "Get help with CalendarPal. Browse FAQs, read documentation, or contact our support team for assistance.",
    keywords: "scheduling app help, booking software support, calendar app FAQ",
  },
  notFound: {
    title: "Page Not Found | CalendarPal",
    description: "The page you're looking for doesn't exist. Return to CalendarPal homepage.",
    noindex: true,
  },
  onboarding: {
    title: "Get Started | CalendarPal",
    description: "Set up your CalendarPal account in minutes. Create your profile, set availability, and start accepting bookings.",
    keywords: "setup scheduling account, create booking profile, get started scheduling",
  },
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CalendarPal",
  url: siteConfig.url,
  logo: `${siteConfig.url}${siteConfig.logo}`,
  description: siteConfig.description,
  sameAs: [
    "https://twitter.com/calendarpal",
    "https://linkedin.com/company/calendarpal",
  ],
};

export const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "CalendarPal",
  url: siteConfig.url,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "1250",
  },
};
