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
    const { match_id, caller_id, receiver_id, call_type } = await request.json();

    if (!match_id || !caller_id || !receiver_id || !call_type) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify match + participants
    const { data: match, error: matchErr } = await db
      .from("matches").select("user_a, user_b").eq("id", match_id).single();
    if (matchErr || !match) return Response.json({ error: "Match not found" }, { status: 404 });
    if (![match.user_a, match.user_b].includes(caller_id) || ![match.user_a, match.user_b].includes(receiver_id)) {
      return Response.json({ error: "Not in this match" }, { status: 403 });
    }

    // Rate limit
    const { data: allowed } = await db.rpc("check_call_rate_limit", { p_caller_id: caller_id });
    if (!allowed) return Response.json({ error: "Max 3 calls/hour" }, { status: 429 });

    // Missed call abuse
    const { data: missed } = await db.rpc("missed_call_count", { p_caller_id: caller_id, p_receiver_id: receiver_id });
    if (missed >= 2) return Response.json({ error: "Too many missed calls to this person" }, { status: 429 });

    // No active calls
    const { data: active } = await db
      .from("calls").select("id").eq("match_id", match_id).in("status", ["ringing", "active"]);
    if (active?.length > 0) return Response.json({ error: "Call already active" }, { status: 409 });

    // Insert
    const { data: call, error: insertErr } = await db
      .from("calls")
      .insert({ match_id, caller_id, receiver_id, call_type, status: "ringing" })
      .select("id").single();
    if (insertErr) return Response.json({ error: "DB error" }, { status: 500 });

    return Response.json({ call_id: call.id });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
