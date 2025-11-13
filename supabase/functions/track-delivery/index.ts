import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trackingNo } = await req.json();

    const professionalCourierApiKey = Deno.env.get("PROFESSIONAL_COURIER_API_KEY");
    const professionalCourierApiUrl = Deno.env.get("PROFESSIONAL_COURIER_API_URL");

    if (!professionalCourierApiKey || !professionalCourierApiUrl) {
      console.log("Professional Courier API credentials not configured");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Tracking API not configured. Please add PROFESSIONAL_COURIER_API_KEY and PROFESSIONAL_COURIER_API_URL in secrets.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Call Professional Courier API
    const response = await fetch(`${professionalCourierApiUrl}/track`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${professionalCourierApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tracking_number: trackingNo,
      }),
    });

    const trackingData = await response.json();

    if (!response.ok) {
      throw new Error(trackingData.error || "Failed to fetch tracking data");
    }

    console.log("Tracking data fetched successfully:", trackingNo);

    return new Response(
      JSON.stringify({
        success: true,
        data: trackingData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error tracking delivery:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error?.message || "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
