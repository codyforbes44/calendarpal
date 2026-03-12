

# Custom Booking Questions — Calendly-Style Intake Forms

The screenshots show Calendly's **custom intake questions** on the booking form: phone number, multi-select checkboxes ("purpose of call"), single-select checkboxes ("how did you hear about us"), and conditional "Other" text fields. Your platform currently only collects Name, Email, and free-text Notes.

## What to Build

A system where hosts can define **custom questions** per event type, and guests see those questions on the booking form. Answers are stored with the booking and visible to the host.

### Question Types to Support
- **Text** — short answer (e.g., phone number)
- **Textarea** — long answer
- **Single Select** — radio buttons / dropdown
- **Multi Select** — checkboxes (like "purpose of call")
- **Checkbox with "Other"** — select options + conditional text input for "Other, please specify"

### Database Changes

**New table: `booking_questions`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| event_type_id | uuid | FK → event_types |
| label | text | Question text |
| type | text | `text`, `textarea`, `select`, `multiselect` |
| options | jsonb | Array of option strings (for select/multiselect) |
| is_required | boolean | Default false |
| include_other | boolean | Show "Other, please specify" option |
| sort_order | integer | Display order |
| created_at | timestamptz | |

**New table: `booking_answers`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| booking_id | uuid | FK → bookings |
| question_id | uuid | FK → booking_questions |
| answer | jsonb | String or array of strings |
| created_at | timestamptz | |

RLS: Questions readable by anyone (public booking page needs them), writable by the event owner. Answers insertable by anyone (guests), readable by the host.

### UI Changes

1. **Event Form** (`EventForm.tsx` / `EventFormFields.tsx`) — Add a "Custom Questions" section where hosts can add/edit/reorder questions with a drag-friendly list. Each question has: label, type selector, options editor (for select types), required toggle, "include Other" toggle.

2. **Public Booking Form** (`PublicBooking.tsx` + `EmbedBooking.tsx`) — In the "details" step, after Name/Email/Notes, dynamically render the custom questions. Text → Input, Textarea → Textarea, Select → RadioGroup, MultiSelect → Checkboxes. Validate required fields before submission.

3. **Booking Detail Modal** (`BookingDetailModal.tsx`) — Show the guest's answers alongside the booking details so hosts can review them.

4. **Booking Emails** — Include answers in the confirmation email body.

### Files to Create/Modify

| File | Change |
|------|--------|
| Migration | Create `booking_questions` + `booking_answers` tables with RLS |
| `src/components/event-form/CustomQuestionsEditor.tsx` | **New** — UI for hosts to manage questions |
| `src/components/event-form/EventFormFields.tsx` | Add CustomQuestionsEditor section |
| `src/components/booking/CustomQuestionsForm.tsx` | **New** — Dynamic question renderer for guests |
| `src/pages/PublicBooking.tsx` | Fetch questions, render CustomQuestionsForm, save answers |
| `src/pages/EmbedBooking.tsx` | Same as PublicBooking |
| `src/components/booking/BookingDetailModal.tsx` | Display answers |
| `supabase/functions/send-booking-email/index.ts` | Include answers in email template |

This is a significant feature. Want me to proceed with implementation?

