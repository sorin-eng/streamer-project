import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const { action, entity_type, entity_id, country } = body;

    // Use service role for checking
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check user compliance status
    const { data: compliance } = await adminClient.rpc("check_user_compliance", {
      _user_id: userId,
    });

    const result: any = {
      user_compliance: compliance,
      geo_allowed: true,
      gate_passed: true,
      blockers: [],
    };

    // Check age gate
    if (!compliance?.age_verified) {
      result.gate_passed = false;
      result.blockers.push("age_verification_required");
    }

    // Check terms acceptance
    if (!compliance?.terms_accepted) {
      result.gate_passed = false;
      result.blockers.push("terms_acceptance_required");
    }

    if (!compliance?.privacy_accepted) {
      result.gate_passed = false;
      result.blockers.push("privacy_acceptance_required");
    }

    // For actions that require KYC (deal signing, contract, reports)
    const kycRequiredActions = ["sign_contract", "upload_report", "create_deal", "submit_application"];
    if (kycRequiredActions.includes(action) && compliance?.kyc_status !== "verified") {
      result.gate_passed = false;
      result.blockers.push(`kyc_${compliance?.kyc_status || "unverified"}`);
    }

    // Geo restriction check
    if (country && entity_type && entity_id) {
      const { data: geoBlock } = await adminClient
        .from("geo_restrictions")
        .select("id")
        .eq("entity_type", entity_type)
        .eq("entity_id", entity_id)
        .eq("blocked_country", country.toUpperCase())
        .maybeSingle();

      if (geoBlock) {
        result.geo_allowed = false;
        result.gate_passed = false;
        result.blockers.push(`geo_blocked_${country}`);
      }
    }

    // Log compliance check
    const eventType = result.gate_passed ? "compliance.verified" : "compliance.blocked";
    await adminClient.rpc("log_compliance_event", {
      _event_type: eventType,
      _entity_type: entity_type || "user",
      _entity_id: entity_id || null,
      _details: { action, country, blockers: result.blockers },
      _severity: result.gate_passed ? "info" : "warning",
    });

    return new Response(
      JSON.stringify({
        data: result,
        meta: { timestamp: new Date().toISOString() },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: { code: "INTERNAL_ERROR", message: (err as Error).message },
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
