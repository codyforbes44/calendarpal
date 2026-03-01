import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are CalendarPal Assistant, a helpful AI for CalendarPal (also known as Bᴏᴏᴋᴍᴇ.ʙᴇᴛ), a scheduling and booking platform. You help users with:
- Setting up and managing their availability
- Creating and configuring event types
- Managing bookings and calendar
- Sharing booking links
- Subscription and billing questions
- Scheduling best practices and productivity tips

Be concise, friendly, and actionable. Use markdown formatting for clarity. If a question is unrelated to scheduling or productivity, politely redirect. Keep answers under 250 words.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!apiKey) {
      throw new Error("PERPLEXITY_API_KEY is not configured");
    }

    const body = await req.json();

    // Support both single query (Support page) and multi-turn chat (Dashboard)
    let messages: { role: string; content: string }[];

    if (body.messages && Array.isArray(body.messages)) {
      // Multi-turn chat mode
      messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...body.messages,
      ];
    } else if (body.query && typeof body.query === "string") {
      // Single query mode (backward compatible)
      if (body.query.trim().length < 3) {
        return new Response(
          JSON.stringify({ error: "Query must be at least 3 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      messages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: body.query },
      ];
    } else {
      return new Response(
        JSON.stringify({ error: "Provide either 'query' or 'messages'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages,
        max_tokens: 500,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`Perplexity API error [${response.status}]: ${errBody}`);
      throw new Error(`Perplexity API call failed [${response.status}]`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content ?? "No answer available.";
    const citations: string[] = data.citations ?? [];

    return new Response(
      JSON.stringify({ answer, citations }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("AI search error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
