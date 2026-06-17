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
    const { userId } = await request.json();
    if (!userId) return Response.json({ error: "Missing userId" }, { status: 400 });

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72);

    const { error } = await db
      .from("user_monetization_ledger")
      .upsert({ user_id: userId, premium_expires_at: expiresAt.toISOString() }, { onConflict: "user_id" });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ premium: true, expires_at: expiresAt.toISOString() });
  } catch (e) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
