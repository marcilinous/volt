import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

export async function POST(request) {
  try {
    const db = getAdmin();
    const { action, call_id, user_id, reason } = await request.json();

    switch (action) {
      case "answer": {
        await db.from("calls").update({ status: "active", answered_at: new Date().toISOString() }).eq("id", call_id);
        return Response.json({ ok: true });
      }

      case "decline": {
        await db.from("calls").update({
          status: "declined", ended_at: new Date().toISOString(), end_reason: "receiver_hangup",
        }).eq("id", call_id);
        return Response.json({ ok: true });
      }

      case "missed": {
        await db.from("calls").update({
          status: "missed", ended_at: new Date().toISOString(), end_reason: "timeout",
        }).eq("id", call_id);
        return Response.json({ ok: true });
      }

      case "hangup": {
        const { data: call } = await db.from("calls").select("caller_id").eq("id", call_id).single();
        const isCaller = call?.caller_id === user_id;
        await db.from("calls").update({
          status: "ended", ended_at: new Date().toISOString(),
          end_reason: isCaller ? "caller_hangup" : "receiver_hangup",
        }).eq("id", call_id);
        // Signal peer
        await db.from("call_signals").insert({
          call_id, sender: isCaller ? "caller" : "receiver", signal_type: "hangup", payload: {},
        });
        return Response.json({ ok: true });
      }

      case "report": {
        await db.from("calls").update({ reported: true, report_reason: reason || "Reported" }).eq("id", call_id);
        return Response.json({ ok: true });
      }

      case "check-incoming": {
        if (!user_id) return Response.json({ error: "user_id required" }, { status: 400 });
        const { data } = await db
          .from("calls")
          .select("id, caller_id, call_type, match_id, started_at")
          .eq("receiver_id", user_id)
          .eq("status", "ringing")
          .order("created_at", { ascending: false })
          .limit(1);

        if (data?.length > 0) {
          const { data: caller } = await db
            .from("profiles")
            .select("display_name, photos_urls")
            .eq("id", data[0].caller_id)
            .single();

          return Response.json({
            incoming: true,
            call: {
              ...data[0],
              caller_name: caller?.display_name || "Someone",
              caller_photo: caller?.photos_urls?.[0] || null,
            },
          });
        }
        return Response.json({ incoming: false });
      }

      default:
        return Response.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
