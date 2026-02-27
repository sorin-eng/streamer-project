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

    const body = await req.json();
    const { deal_id, rows } = body;

    if (!deal_id || !Array.isArray(rows) || rows.length === 0) {
      return new Response(
        JSON.stringify({
          error: { code: "VALIDATION_ERROR", message: "deal_id and rows[] required" },
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify deal access
    const { data: deal, error: dealErr } = await supabase
      .from("deals")
      .select("id, organization_id")
      .eq("id", deal_id)
      .single();

    if (dealErr || !deal) {
      return new Response(
        JSON.stringify({ error: { code: "NOT_FOUND", message: "Deal not found" } }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get org membership for RLS
    const { data: orgMember } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", deal.organization_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!orgMember) {
      return new Response(
        JSON.stringify({ error: { code: "FORBIDDEN", message: "Not an org member" } }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create report upload record
    const { data: upload, error: uploadErr } = await supabase
      .from("report_uploads")
      .insert({
        organization_id: deal.organization_id,
        uploaded_by: userId,
        file_name: `report_${deal_id}_${Date.now()}.json`,
        status: "processing",
        row_count: rows.length,
      })
      .select("id")
      .single();

    if (uploadErr) {
      return new Response(
        JSON.stringify({ error: { code: "DB_ERROR", message: uploadErr.message } }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse rows into conversion_events
    const events = rows.map((row: any) => ({
      deal_id,
      event_type: row.event_type || "ftd",
      event_date: row.event_date || new Date().toISOString().split("T")[0],
      amount: row.amount || 0,
      currency: row.currency || "USD",
      player_id: row.player_id || null,
      report_upload_id: upload.id,
      metadata: row.metadata || {},
    }));

    const { error: eventsErr } = await supabase
      .from("conversion_events")
      .insert(events);

    // Update upload status
    const finalStatus = eventsErr ? "failed" : "completed";
    await supabase
      .from("report_uploads")
      .update({
        status: finalStatus,
        error_message: eventsErr?.message || null,
      })
      .eq("id", upload.id);

    // Log compliance event
    await supabase.rpc("log_compliance_event", {
      _event_type: "report.uploaded",
      _entity_type: "report_upload",
      _entity_id: upload.id,
      _details: { deal_id, row_count: rows.length, status: finalStatus },
      _severity: eventsErr ? "warning" : "info",
    });

    // Log audit
    await supabase.rpc("log_audit", {
      _action: "UPLOAD_REPORT",
      _entity_type: "report_upload",
      _entity_id: upload.id,
      _details: { deal_id, row_count: rows.length },
    });

    return new Response(
      JSON.stringify({
        data: { upload_id: upload.id, events_count: rows.length, status: finalStatus },
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
