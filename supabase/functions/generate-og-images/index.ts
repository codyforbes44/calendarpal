import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const prompts: Record<string, string> = {
  home: `Create a professional Open Graph image at 1200x630 pixels for a scheduling app called "BookMe.cool".
Design specs:
- Dark background gradient from deep slate (#0F172A) to dark indigo (#1E1B4B), filling the entire canvas
- Top-left: small calendar icon (white) next to bold "BookMe.cool" wordmark in white, subtitle "Scheduling Made Simple" in indigo/purple
- Center: large bold white headline text "Scheduling Made Simple" on two lines
- Below headline: lighter grey subtext "Book meetings in seconds. No back-and-forth."
- Right side: two overlapping rounded UI cards floating at a slight angle — one showing a calendar date picker, one showing a booking confirmation with a green checkmark and a person's name "Sarah Johnson - 30 min call"
- Bottom-right: soft indigo/purple radial glow effect
- Bottom-left: small "bookme.cool" URL in muted grey
- Style: modern, clean, dark SaaS aesthetic, professional`,

  pricing: `Create a professional Open Graph image at 1200x630 pixels for the Pricing page of "BookMe.cool", a scheduling app.
Design specs:
- Dark background gradient from deep slate (#0F172A) to dark indigo (#1E1B4B)
- Top area: bold white headline "Simple, honest pricing." centered
- Below: three pricing card mockups side by side: "Free $0/mo", "Pro $12/mo" (highlighted with indigo border and "Most Popular" badge), "Enterprise Custom"
- Each card has a checkmark list of 3 features in small white text
- The Pro card glows with an indigo halo effect
- Top-left: "BookMe.cool" wordmark in white
- Bottom: soft tagline "No hidden fees. Cancel anytime." in muted text
- Style: modern dark SaaS, clean layout`,

  support: `Create a professional Open Graph image at 1200x630 pixels for the Help & Support page of "BookMe.cool", a scheduling app.
Design specs:
- Dark background gradient from deep slate (#0F172A) to dark indigo (#1E1B4B)
- Center-left: large bold white headline "We're here to help." on two lines
- Below headline: subtitle "Get answers fast. 24/7 support for BookMe.cool users."
- Right side: an illustration of a chat interface with speech bubbles — one blue bubble "How do I reschedule?" and one indigo/purple bubble reply "Sure! Here's how..." with a friendly assistant icon
- Top-left: "BookMe.cool" wordmark in white with a small support/headset icon
- Subtle FAQ list items visible in the background (blurred/faded): "How do I..." style questions
- Style: modern, warm, approachable, dark SaaS aesthetic`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { page } = await req.json();

    if (!page || !["home", "pricing", "support"].includes(page)) {
      return new Response(
        JSON.stringify({ error: 'Invalid page. Must be "home", "pricing", or "support".' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    console.log(`Generating OG image for page: ${page}`);

    // Call AI image generation
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: prompts[page],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Insufficient credits. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway returned ${aiResponse.status}: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const images = aiData.choices?.[0]?.message?.images;

    if (!images || images.length === 0) {
      throw new Error("No image returned from AI model");
    }

    const imageDataUrl: string = images[0].image_url.url;
    // Strip the data:image/...;base64, prefix
    const base64Data = imageDataUrl.split(",")[1];
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // Upload to storage using service role client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const fileName = `og-${page}.png`;
    const { error: uploadError } = await supabase.storage
      .from("og-images")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("og-images").getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    console.log(`Successfully generated and uploaded OG image for ${page}: ${publicUrl}`);

    return new Response(
      JSON.stringify({ success: true, page, publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-og-images error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
