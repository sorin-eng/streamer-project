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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { event_type, deal_id, title, body, entity_type, entity_id } = await req.json();

    if (!event_type || !title) {
      return new Response(JSON.stringify({ error: "event_type and title required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine recipients based on deal_id
    const recipientIds: string[] = [];

    if (deal_id) {
      const { data: deal } = await supabase
        .from("deals")
        .select("streamer_id, organization_id")
        .eq("id", deal_id)
        .single();

      if (deal) {
        // Add streamer
        if (deal.streamer_id !== user.id) {
          recipientIds.push(deal.streamer_id);
        }

        // Add org members (except sender)
        const { data: orgMembers } = await supabase
          .from("organization_members")
          .select("user_id")
          .eq("organization_id", deal.organization_id);

        for (const m of orgMembers || []) {
          if (m.user_id !== user.id && !recipientIds.includes(m.user_id)) {
            recipientIds.push(m.user_id);
          }
        }
      }
    }

    if (recipientIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, notified: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert notifications
    const notifications = recipientIds.map((uid) => ({
      user_id: uid,
      type: event_type,
      title,
      body: body || null,
      entity_type: entity_type || null,
      entity_id: entity_id || deal_id || null,
    }));

    const { error: insertErr } = await supabase
      .from("notifications")
      .insert(notifications);

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ ok: true, notified: recipientIds.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Notify error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
