import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const prompts: Record<string, string> = {
  home: "Generate a 1920x1080 abstract background image for a scheduling platform hero section. Flowing calendar and clock shapes dissolving into particles. Deep indigo (#312e81) to purple (#581c87) gradient base with subtle coral (#f97316) accent highlights. Ethereal, modern, slightly translucent geometric shapes floating in space. No text, no logos. Ultra high resolution, soft ambient lighting, cinematic depth of field.",

  about: "Generate a 1920x1080 abstract background image representing connection and teamwork. Soft interconnected nodes and gentle human silhouettes made of light particles. Deep indigo (#312e81) tones with warm golden light rays breaking through. Abstract, ethereal, modern aesthetic. No text, no logos. Ultra high resolution, soft focus, dreamy atmosphere.",

  pricing: "Generate a 1920x1080 abstract background image representing value and growth tiers. Abstract geometric ascending steps or crystalline tier structures. Deep indigo (#312e81) gradient base with coral (#f97316) accent glow on edges. Modern, premium feel with subtle glass morphism effects. No text, no logos. Ultra high resolution, elegant lighting.",

  support: "Generate a 1920x1080 abstract background image representing help and community. Soft floating chat bubble shapes and gentle light rays emanating outward. Warm indigo (#312e81) base with friendly soft coral (#f97316) light accents. Welcoming, supportive atmosphere. No text, no logos. Ultra high resolution, soft diffused lighting.",

  auth: "Generate a 1920x1080 abstract background image for a professional login page. Deep indigo (#312e81) base with subtle geometric patterns creating depth and parallax feel. Minimal, sophisticated, with faint luminous lines forming abstract grid patterns. Dark and moody with subtle highlights. No text, no logos. Ultra high resolution, dramatic ambient lighting.",
};

const validPages = ["home", "about", "pricing", "support", "auth"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { page } = await req.json();

    if (!page || !validPages.includes(page)) {
      return new Response(
        JSON.stringify({ error: `Invalid page. Must be one of: ${validPages.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    console.log(`Generating hero image for page: ${page}`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: prompts[page] }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", status, errorText);
      throw new Error(`AI gateway returned ${status}`);
    }

    const aiData = await aiResponse.json();
    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No image returned from AI model");
    }

    // Decode base64 image
    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // Upload to storage
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const fileName = `hero-${page}.png`;

    const { error: uploadError } = await supabase.storage
      .from("hero-images")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from("hero-images")
      .getPublicUrl(fileName);

    // Add cache-busting param
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    console.log(`Hero image generated and uploaded: ${publicUrl}`);

    return new Response(
      JSON.stringify({ success: true, page, publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-hero-images error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
