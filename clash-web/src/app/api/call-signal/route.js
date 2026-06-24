import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

// POST: store a WebRTC signal (SDP offer/answer/ICE)
export async function POST(request) {
  try {
    const db = getAdmin();
    const { call_id, sender, signal_type, payload } = await request.json();

    if (!call_id || !sender || !signal_type || !payload) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    const { data, error } = await db
      .from("call_signals")
      .insert({ call_id, sender, signal_type, payload })
      .select("id").single();

    if (error) return Response.json({ error: "Failed to store signal" }, { status: 500 });
    return Response.json({ ok: true, id: data.id });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// GET: poll for new signals from the other peer
export async function GET(request) {
  try {
    const db = getAdmin();
    const { searchParams } = new URL(request.url);
    const call_id = searchParams.get("call_id");
    const role = searchParams.get("role");
    const after = searchParams.get("after") || "0";

    if (!call_id || !role) {
      return Response.json({ error: "call_id and role required" }, { status: 400 });
    }

    const wantFrom = role === "caller" ? "receiver" : "caller";

    const { data, error } = await db
      .from("call_signals")
      .select("id, signal_type, payload")
      .eq("call_id", call_id)
      .eq("sender", wantFrom)
      .gt("id", parseInt(after))
      .order("id", { ascending: true });

    return Response.json({ signals: data || [] });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
