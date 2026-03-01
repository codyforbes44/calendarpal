
# Refactor All Public Pages to Reflect Current Platform Capabilities

## Audit Summary

After reviewing every public-facing page and component against the actual codebase, here are the gaps and inconsistencies found:

---

## Issues Found

### 1. Features Section -- Missing Recent Capabilities
The homepage `Features.tsx` lists only 6 features. It omits several major capabilities that are already built:
- **Paid bookings / Stripe payments** (booking payments, refunds, webhook handling)
- **Slack notifications** (with test notification support)
- **Google Calendar sync** (two-way sync, busy-time detection)
- **Embeddable booking widget** (iframe and JS embed code generator)
- **AI-powered assistant** (dashboard chatbot, AI event generation, AI search)
- **Client directory** (CRM-style client tracking with aggregated stats)
- **QR code sharing** (share modal with QR generation)
- **Guest self-service** (reschedule/cancel via secure link)

**Fix**: Restructure features into 4 core + 6 advanced cards covering all current capabilities.

### 2. Pricing Page -- Feature Lists Are Incomplete
The Free and Pro plan feature lists are generic and don't mention:
- Slack notifications (Pro)
- Embeddable widget (Pro)
- AI event generation (Pro)
- Paid bookings / payment collection (Pro)
- Client directory / CRM (Pro)
- Conversion funnel and Popular Times analytics (Pro)

The feature comparison table is also missing rows for these capabilities.

**Fix**: Update plan feature bullets and comparison table rows.

### 3. About Page -- Generic, Missing Key Differentiators
The About page is very basic with generic steps. It doesn't mention:
- AI capabilities
- Payment collection
- Slack/Google Calendar integrations
- Embeddable widgets
- Client management

**Fix**: Add an "Integrations and AI" values card, update step descriptions to mention automation and payments.

### 4. FAQ Section -- Outdated and Missing Topics
- The "Free vs Pro" FAQ answer says Free has "up to 5 active event types" -- the pricing page says "1 event type". These are inconsistent.
- No FAQ about Slack integration, embeddable widgets, paid bookings, or AI features.
- No FAQ about Google Calendar sync.

**Fix**: Correct Free plan event type limit to match pricing, add FAQs for Slack, embed widget, paid bookings, Google Calendar, and AI assistant.

### 5. Documentation Section -- Missing Guides for Recent Features
No documentation guides for:
- Setting up Slack notifications (with test button)
- Collecting payments for bookings
- Using the embeddable booking widget
- Google Calendar sync setup
- Client directory usage

**Fix**: Add guides under "Advanced Features" and a new "Integrations" category.

### 6. LogoCloud -- Missing Stripe Integration Logo
Stripe is a core integration (payment processing) but isn't shown in the integrations bar.

**Fix**: Add Stripe logo/icon to the LogoCloud.

### 7. Homepage CTA Benefits -- Underselling
The CTA lists generic benefits: "Free forever plan", "No credit card required", "Live in 2 minutes", "Cancel anytime". These don't differentiate the platform.

**Fix**: Replace with value-driven benefits: "AI-powered scheduling", "Collect payments automatically", "Slack and Google Calendar sync", "Free forever plan".

### 8. Homepage Stats -- Inconsistent Numbers
Stats show "50,000+ Bookings Automated" but the hero says "5,000+ bookings automated" and testimonials say "5,000+ professionals". These should be consistent.

**Fix**: Align the stats numbers across all sections.

---

## Implementation Plan

### File 1: `src/components/Features.tsx`
- Expand `coreFeatures` to 4 items: Smart Scheduling, Automated Reminders, Branded Booking Pages, **Payment Collection**
- Expand `advancedFeatures` to 6 items: Recurring Meetings, **Slack and Calendar Sync**, Analytics Dashboard, **AI Assistant**, **Embeddable Widget**, **Client Directory**

### File 2: `src/components/LogoCloud.tsx`
- Add Stripe SVG icon to integrations array

### File 3: `src/components/CTA.tsx`
- Update benefits array to highlight differentiating capabilities

### File 4: `src/components/Stats.tsx`
- Change "5,000+ bookings automated" in hero to align with stats, or adjust stats value. Will standardize to "50,000+" across the board.

### File 5: `src/components/Hero.tsx`
- Update trust indicator from "5,000+ bookings automated" to "50,000+ bookings automated" for consistency with Stats section

### File 6: `src/components/Testimonials.tsx`
- Update social proof bar from "5,000+ professionals" to a consistent figure

### File 7: `src/pages/Pricing.tsx`
- Add Slack notifications, embed widget, AI generation, paid bookings, and client directory to Pro plan features
- Add corresponding rows to the comparison table

### File 8: `src/pages/About.tsx`
- Add an integrations/AI values card
- Update step descriptions to mention payments and AI

### File 9: `src/components/support/FAQSection.tsx`
- Fix Free plan event type count to "1"
- Add FAQs for: Slack integration, embeddable widgets, paid bookings, Google Calendar sync, AI assistant

### File 10: `src/components/support/DocumentationSection.tsx`
- Add new "Integrations" category with guides for: Google Calendar sync, Slack notifications, payment collection, embeddable widget
- Add AI assistant guide under "Advanced Features"

### File 11: `src/components/Footer.tsx`
- Add "Blog" placeholder and "API" link under Resources for better footer completeness

---

## Technical Notes

- All changes are purely presentational / static content updates -- no database migrations or backend changes needed
- SEO keywords in `seo-config.ts` should be updated to include "payment collection", "Slack integration", "AI scheduling" for the home and pricing pages
- Structured data in `webApplicationSchema` already has correct category ("BusinessApplication") so no change needed there
