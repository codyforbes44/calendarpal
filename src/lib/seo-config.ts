export const siteConfig = {
  name: "BookMe.Bet",
  url: "https://bookme.bet",
  description: "Best scheduling software for professionals. Book meetings effortlessly with automated timezone handling, calendar sync, and beautiful booking pages.",
  author: "BookMe.Bet",
  twitterHandle: "@bookme_bet",
  themeColor: "#4F46E5",
  logo: "/bookme-logo.png",
  ogImages: {
    home: "https://mscixhmmskdsjaajcafn.supabase.co/storage/v1/object/public/og-images/og-home.png",
    pricing: "https://mscixhmmskdsjaajcafn.supabase.co/storage/v1/object/public/og-images/og-pricing.png",
    support: "https://mscixhmmskdsjaajcafn.supabase.co/storage/v1/object/public/og-images/og-support.png",
  },
};

export const defaultSEO = {
  title: "BookMe.Bet - Scheduling Made Simple",
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
    title: "BookMe.Bet - Scheduling Made Simple",
    description: "Best scheduling software for professionals. Book meetings effortlessly with automated timezone handling, calendar sync, and beautiful booking pages.",
    keywords: "scheduling app, appointment booking, calendar scheduling, meeting scheduler, online booking software",
  },
  pricing: {
    title: "Pricing Plans | BookMe.Bet",
    description: "Affordable scheduling plans starting free. Compare Free, Pro & Enterprise features. No hidden fees, cancel anytime.",
    keywords: "scheduling software pricing, appointment booking cost, calendar app pricing, meeting scheduler plans",
  },
  auth: {
    title: "Sign In | BookMe.Bet",
    description: "Create your free BookMe.Bet account or sign in to manage your bookings and scheduling. Get started in seconds.",
    keywords: "sign up scheduling app, login booking software, create scheduling account",
  },
  terms: {
    title: "Terms of Service | BookMe.Bet",
    description: "BookMe.Bet terms of service. Read our legal terms and conditions for using our scheduling platform.",
    keywords: "terms of service scheduling, booking software terms, calendar app legal",
  },
  privacy: {
    title: "Privacy Policy | BookMe.Bet",
    description: "Learn how BookMe.Bet protects your data. GDPR compliant scheduling software with enterprise-grade security.",
    keywords: "privacy policy scheduling app, data protection booking software, GDPR scheduling",
  },
  support: {
    title: "Help & Support | BookMe.Bet",
    description: "Get help with BookMe.Bet. Browse FAQs, read documentation, or contact our support team for assistance.",
    keywords: "scheduling app help, booking software support, calendar app FAQ",
  },
  notFound: {
    title: "Page Not Found | BookMe.Bet",
    description: "The page you're looking for doesn't exist. Return to BookMe.Bet homepage.",
    noindex: true,
  },
  onboarding: {
    title: "Get Started | BookMe.Bet",
    description: "Set up your BookMe.Bet account in minutes. Create your profile, set availability, and start accepting bookings.",
    keywords: "setup scheduling account, create booking profile, get started scheduling",
  },
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "BookMe.Bet",
  url: siteConfig.url,
  logo: `${siteConfig.url}${siteConfig.logo}`,
  description: siteConfig.description,
  sameAs: [
    "https://twitter.com/bookme_bet",
    "https://linkedin.com/company/bookme-bet",
  ],
};

export const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "BookMe.Bet",
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
