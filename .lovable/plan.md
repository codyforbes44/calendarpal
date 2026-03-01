# Best Practices Refactor: AI Backend Architecture

## Current State

The project has **3 AI use cases** all funneled through a single `ai-search` edge function that calls Perplexity's `sonar` model:

1. **Support page search** (AISearchBox) -- web-grounded Q&A with citations
2. **Dashboard chatbot** (AIChatbot) -- multi-turn conversational assistant
3. **Event form generation** (AIGenerateButton) -- title/description suggestions

A separate `generate-og-images` function uses Lovable AI Gateway (Gemini) for image generation.

The `GEMINI_API_KEY` secret exists but is unused. The `LOVABLE_API_KEY` is already available.

## Problems Identified

1. **Wrong model for the job**: Perplexity Sonar is a *search-grounded* model designed for web lookups. Using it for creative text generation (event titles/descriptions) is wasteful and slow -- it searches the web when no search is needed.
2. **Single function bottleneck**: All 3 use cases share one function, making it harder to tune prompts, rate-limit independently, or evolve features.
3. **No streaming**: The dashboard chatbot waits for the full response before displaying, causing perceived slowness.
4. **Missing error handling on the client**: Rate limit (429) and credit (402) errors from Perplexity are not surfaced to users.

## Proposed Architecture

Split AI responsibilities by choosing the right model for each use case:

```text
Use Case              Model                    Why
-------------------------------------------------------------------
Support search        Perplexity sonar         Needs web-grounded citations
Dashboard chatbot     Direct API AI (Gemini)      Conversational, no web search needed
Event form generate   Direct API (Gemini)      Creative text, fast, no search needed
OG image generation   Direct API (Gemini)      Already working -- no change
```

## Implementation Steps

### 1. Create a new `ai-generate` edge function for event form suggestions

- Uses Direct API (`google/gemini-3-flash-preview`) via `GEMINI_API_KEY`
- Accepts a `prompt` string, returns `{ suggestion: string }`
- Tailored system prompt for generating concise event titles and descriptions
- Handles 429/402 errors with user-friendly messages
- Add to `config.toml` with `verify_jwt = false`

### 2. Create a new `ai-chat` edge function for the dashboard chatbot

- Uses Direct API (`google/gemini-3-flash-preview`) via `GEMINI_API_KEY`
- Accepts `{ messages }` array, returns SSE stream for token-by-token rendering
- CalendarPal system prompt stays on the backend
- Handles 429/402 with proper status codes

### 3. Keep `ai-search` for Perplexity-only use (Support page)

- Remove multi-turn chat support (no longer needed)
- Keep single `query` mode for web-grounded search with citations
- Add 429/402 error handling

### 4. Update frontend components

- **AIGenerateButton**: Call `ai-generate` instead of `ai-search`
- **AIChatbot**: Call `ai-chat` with streaming; render tokens as they arrive using the SSE pattern
- **AISearchBox**: No change (already uses `ai-search` correctly)
- All 3 components: Surface rate-limit and credit errors via toast notifications

### 5. Disable unused `LOVABLE_API_KEY`

Since `GEMINI_API_KEY` is the correct way to access Gemini, the`LOVABLE_API_KEY` is unnecessary and can be disabled to avoid confusion.

## Technical Details

### New edge function: `supabase/functions/ai-generate/index.ts`

- Model: `google/gemini-3-flash-preview`
- System prompt focused on generating professional scheduling-related text
- `max_tokens: 150`, `temperature: 0.7` (creative but controlled)

### New edge function: `supabase/functions/ai-chat/index.ts`

- Streaming SSE call to Direct GEMINI_API_KEY
- Model: `google/gemini-3-flash-preview`
- Passes `stream: true`, returns `response.body` directly
- CalendarPal system prompt baked in

### Frontend streaming (AIChatbot)

- Uses `fetch()` with the full function URL for streaming
- Parses SSE line-by-line, updates assistant message progressively
- Shows tokens as they arrive instead of a "Thinking..." spinner

### Error handling (all components)

- 429 -> toast: "Too many requests. Please wait a moment."
- 402 -> toast: "AI credits exhausted. Contact your admin."
- Generic errors -> existing fallback messages

## Files Changed


| File                                             | Action                       |
| ------------------------------------------------ | ---------------------------- |
| `supabase/functions/ai-generate/index.ts`        | Create                       |
| `supabase/functions/ai-chat/index.ts`            | Create                       |
| `supabase/functions/ai-search/index.ts`          | Simplify (remove multi-turn) |
| `supabase/config.toml`                           | Add 2 new function entries   |
| `src/components/event-form/AIGenerateButton.tsx` | Point to `ai-generate`       |
| `src/components/dashboard/AIChatbot.tsx`         | Stream from `ai-chat`        |
| `src/components/support/AISearchBox.tsx`         | Add error handling           |
