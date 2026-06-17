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
    const { userId, amount = 1 } = await request.json();
    if (!userId || amount < 1 || amount > 5)
      return Response.json({ error: "Invalid request" }, { status: 400 });

    const { data: ledger, error: fetchErr } = await db
      .from("user_monetization_ledger")
      .select("token_balance")
      .eq("user_id", userId).single();

    if (fetchErr && fetchErr.code === "PGRST116") {
      await db.from("user_monetization_ledger").insert({ user_id: userId, token_balance: amount });
      return Response.json({ balance: amount });
    }

    const newBalance = (ledger?.token_balance || 0) + amount;
    await db.from("user_monetization_ledger").update({ token_balance: newBalance }).eq("user_id", userId);
    return Response.json({ balance: newBalance });
  } catch (e) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
