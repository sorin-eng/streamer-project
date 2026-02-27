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

    const body = await req.json();
    const { deal_id, period_start, period_end } = body;

    if (!deal_id) {
      return new Response(
        JSON.stringify({ error: { code: "VALIDATION_ERROR", message: "deal_id required" } }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for computation
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get deal
    const { data: deal, error: dealErr } = await adminClient
      .from("deals")
      .select("*")
      .eq("id", deal_id)
      .single();

    if (dealErr || !deal) {
      return new Response(
        JSON.stringify({ error: { code: "NOT_FOUND", message: "Deal not found" } }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get commission rules for the deal
    const { data: rules } = await adminClient
      .from("commission_rules")
      .select("*")
      .eq("deal_id", deal_id);

    if (!rules || rules.length === 0) {
      return new Response(
        JSON.stringify({
          data: { commissions: [], message: "No commission rules defined" },
          meta: { timestamp: new Date().toISOString() },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get conversion events for the period
    let eventsQuery = adminClient
      .from("conversion_events")
      .select("*")
      .eq("deal_id", deal_id);

    if (period_start) eventsQuery = eventsQuery.gte("event_date", period_start);
    if (period_end) eventsQuery = eventsQuery.lte("event_date", period_end);

    const { data: events } = await eventsQuery;

    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({
          data: { commissions: [], message: "No conversion events in period" },
          meta: { timestamp: new Date().toISOString() },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compute commissions
    const commissions: any[] = [];

    for (const rule of rules) {
      const applicableEvents = events.filter((e) =>
        (rule.applies_to as string[]).includes(e.event_type)
      );

      if (applicableEvents.length === 0) continue;

      let amount = 0;

      if (rule.rule_type === "cpa") {
        // CPA: fixed amount per qualifying event
        const qualifiedEvents = rule.min_deposit
          ? applicableEvents.filter((e) => (e.amount || 0) >= rule.min_deposit)
          : applicableEvents;
        amount = qualifiedEvents.length * (rule.cpa_amount || 0);
      } else if (rule.rule_type === "revshare") {
        // Revshare: percentage of net revenue
        const totalRevenue = applicableEvents.reduce(
          (sum, e) => sum + (e.amount || 0),
          0
        );
        amount = totalRevenue * ((rule.revshare_pct || 0) / 100);
      } else if (rule.rule_type === "hybrid") {
        // Hybrid: CPA + revshare
        const qualifiedEvents = rule.min_deposit
          ? applicableEvents.filter((e) => (e.amount || 0) >= rule.min_deposit)
          : applicableEvents;
        const cpaAmount = qualifiedEvents.length * (rule.cpa_amount || 0);
        const totalRevenue = applicableEvents.reduce(
          (sum, e) => sum + (e.amount || 0),
          0
        );
        const revshareAmount = totalRevenue * ((rule.revshare_pct || 0) / 100);
        amount = cpaAmount + revshareAmount;
      }

      if (amount > 0) {
        const { data: commission, error: commErr } = await adminClient
          .from("commissions")
          .insert({
            deal_id,
            streamer_id: deal.streamer_id,
            amount: Math.round(amount * 100) / 100,
            status: "pending",
            period_start: period_start || null,
            period_end: period_end || null,
          })
          .select("id, amount, status")
          .single();

        if (!commErr && commission) {
          commissions.push(commission);
        }
      }
    }

    // Log compliance
    await adminClient.rpc("log_compliance_event", {
      _event_type: "commission.computed",
      _entity_type: "deal",
      _entity_id: deal_id,
      _details: {
        commissions_created: commissions.length,
        total_amount: commissions.reduce((s, c) => s + c.amount, 0),
        period_start,
        period_end,
      },
    });

    return new Response(
      JSON.stringify({
        data: { commissions, events_processed: events.length },
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
