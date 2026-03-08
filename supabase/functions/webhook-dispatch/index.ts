import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function hmacSign(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

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

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { event_type, organization_id, payload } = body;

    if (!event_type || !organization_id) {
      return new Response(
        JSON.stringify({
          error: { code: "VALIDATION_ERROR", message: "event_type and organization_id required" },
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: endpoints } = await adminClient
      .from("webhook_endpoints")
      .select("*")
      .eq("organization_id", organization_id)
      .eq("active", true)
      .contains("events", [event_type]);

    if (!endpoints || endpoints.length === 0) {
      return new Response(
        JSON.stringify({
          data: { deliveries: 0, message: "No matching endpoints" },
          meta: { timestamp: new Date().toISOString() },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const deliveryResults = [];

    for (const endpoint of endpoints) {
      const payloadStr = JSON.stringify({
        event: event_type,
        timestamp: new Date().toISOString(),
        data: payload,
      });

      const signature = await hmacSign(endpoint.secret, payloadStr);

      const { data: delivery } = await adminClient
        .from("webhook_deliveries")
        .insert({
          endpoint_id: endpoint.id,
          event_type,
          payload: JSON.parse(payloadStr),
          attempts: 1,
        })
        .select("id")
        .single();

      try {
        const response = await fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": `sha256=${signature}`,
            "X-Webhook-Event": event_type,
            "X-Webhook-Delivery": delivery?.id || "",
          },
          body: payloadStr,
          signal: AbortSignal.timeout(10000),
        });

        await adminClient
          .from("webhook_deliveries")
          .update({
            response_status: response.status,
            response_body: (await response.text()).slice(0, 1000),
            delivered_at: response.ok ? new Date().toISOString() : null,
            next_retry_at: response.ok ? null : new Date(Date.now() + 60000).toISOString(),
          })
          .eq("id", delivery?.id);

        deliveryResults.push({
          endpoint_id: endpoint.id,
          delivery_id: delivery?.id,
          status: response.status,
          success: response.ok,
        });
      } catch (fetchErr) {
        await adminClient
          .from("webhook_deliveries")
          .update({
            response_status: 0,
            response_body: (fetchErr as Error).message,
            next_retry_at: new Date(Date.now() + 60000).toISOString(),
          })
          .eq("id", delivery?.id);

        deliveryResults.push({
          endpoint_id: endpoint.id,
          delivery_id: delivery?.id,
          status: 0,
          success: false,
          error: (fetchErr as Error).message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        data: { deliveries: deliveryResults },
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
