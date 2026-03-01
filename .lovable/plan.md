

# Comprehensive Support Page Overhaul

## Overview
Transform the Support page from placeholder cards and a basic FAQ into a fully fleshed-out help center with three rich, tabbed sections: Documentation guides, expanded FAQ (categorized), and a Feature Request board -- all built with existing UI components.

## Structure

The page will be reorganized using **Tabs** to let users navigate between three content sections, replacing the static placeholder cards.

### 1. Documentation Section
A grid of guide cards, each with an icon, title, description, and expandable step-by-step instructions using Accordion. Categories:

- **Getting Started** (4 guides)
  - Creating your account and completing onboarding
  - Setting up your profile (name, bio, avatar, booking link slug)
  - Creating your first event type (title, duration, location, description)
  - Setting your weekly availability schedule

- **Booking Management** (4 guides)
  - Understanding your bookings dashboard (filters, views, statuses)
  - Managing incoming bookings (confirm, reschedule, cancel)
  - Sharing your booking link (copy, social, QR code, embed)
  - Guest self-service (how guests reschedule/cancel via email link)

- **Advanced Features** (4 guides)
  - Configuring buffer times between meetings (Pro)
  - Using the AI assistant for event creation
  - Timezone handling and international scheduling
  - Viewing booking analytics and calendar heatmap

- **Account and Billing** (3 guides)
  - Upgrading to Pro (monthly vs annual, checkout flow)
  - Managing your subscription (portal, invoices, cancellation)
  - Updating profile settings and deleting your account

### 2. FAQ Section (Expanded and Categorized)
Reorganize into categorized groups with ~20 total questions:

- **Getting Started** (5 Qs): account creation, onboarding, profile setup, booking link, first event
- **Bookings** (5 Qs): how booking works, guest experience, reschedule/cancel, notifications, confirmation emails
- **Billing and Subscription** (5 Qs): free vs pro, trial, payment methods, cancel, refund policy
- **Privacy and Security** (3 Qs): data security, GDPR, data export/deletion
- **Technical** (3 Qs): supported browsers, timezone handling, mobile support

### 3. Feature Request Section
A structured form (separate from the contact form) with:
- Category dropdown (Scheduling, Integrations, UI/UX, Mobile, Billing, Other)
- Title field
- Description textarea
- Priority selector (Nice to have / Important / Critical)
- A "Popular Requests" section showing commonly requested features as static cards (Google Calendar two-way sync, team scheduling, Slack integration, recurring meetings, custom email templates)

### 4. Contact Form
Keep the existing "Still need help?" contact form at the bottom of the page, visible from all tabs.

## Technical Details

### New Components
- `src/components/support/DocumentationSection.tsx` -- guide cards with expandable accordion content
- `src/components/support/FAQSection.tsx` -- categorized FAQ with tab filtering by category
- `src/components/support/FeatureRequestSection.tsx` -- request form + popular requests display

### Modified Files
- `src/pages/Support.tsx` -- replace static cards with Tabs component containing the three new section components; keep AI search box at top and contact form at bottom
- Update FAQ schema to include all new FAQ items for SEO

### UI Components Used (all existing)
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` for section navigation
- `Accordion` for expandable guides and FAQ items
- `Card` for guide cards and popular feature request cards
- `Select` for category dropdown in feature request form
- `Badge` for category labels and vote counts
- `Button`, `Input`, `Textarea`, `Label` for the feature request form

### No backend changes needed
All content is static/hardcoded. The contact form and feature request form will show toast confirmations (matching the existing pattern). No database tables required.

