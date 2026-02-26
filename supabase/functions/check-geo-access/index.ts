import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// OFAC Sanctioned and blocked countries for US business compliance
const BLOCKED_COUNTRIES = ['CU', 'IR', 'KP', 'SY', 'RU', 'BY'];

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-GEO-ACCESS] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Checking geo access");

    // Get country from various headers (Cloudflare, Vercel, or custom proxy headers)
    const cfCountry = req.headers.get('cf-ipcountry');
    const vercelCountry = req.headers.get('x-vercel-ip-country');
    const customCountry = req.headers.get('x-country-code');
    
    // Use the first available country code, fallback to allowing access
    const country = (cfCountry || vercelCountry || customCountry || '').toUpperCase();
    
    logStep("Country detected", { country, source: cfCountry ? 'cloudflare' : vercelCountry ? 'vercel' : customCountry ? 'custom' : 'none' });

    // If no country detected, allow access (don't block legitimate users due to detection failure)
    if (!country) {
      logStep("No country detected, allowing access");
      return new Response(
        JSON.stringify({ 
          blocked: false, 
          country: null,
          reason: null,
          message: null
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    const isBlocked = BLOCKED_COUNTRIES.includes(country);
    
    logStep("Access check complete", { country, isBlocked });

    return new Response(
      JSON.stringify({ 
        blocked: isBlocked, 
        country,
        reason: isBlocked ? 'regulatory_compliance' : null,
        message: isBlocked 
          ? 'Bookme.bet is not available in your region due to regulatory requirements.' 
          : null
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message: errorMessage });
    
    // On error, allow access (fail open to not block legitimate users)
    return new Response(
      JSON.stringify({ 
        blocked: false, 
        country: null,
        reason: null,
        message: null,
        error: errorMessage
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  }
});
