import { supabase } from "./supabase";

export async function recordSwipe(userId, targetId, action) {
  const { error } = await supabase.from("swipe_actions").upsert({
    user_id: userId, target_id: targetId, action,
  });
  if (error) return { matched: false, error };

  if (action === "like" || action === "super_like") {
    const { data: mutual } = await supabase
      .from("swipe_actions").select("id")
      .eq("user_id", targetId).eq("target_id", userId)
      .in("action", ["like", "super_like"]).single();

    if (mutual) {
      const { data: match } = await supabase
        .from("matches")
        .insert([{ user_a: userId, user_b: targetId, match_type: "normal" }])
        .select().single();
      return { matched: true, match, error: null };
    }
  }
  return { matched: false, error: null };
}

export async function getTodayClash(userId) {
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("daily_clashes").select("*")
    .eq("user_id", userId).eq("clash_date", today).single();
  return data;
}

export async function submitClash(userId, targetId, answers) {
  const today = new Date().toISOString().split("T")[0];
  return supabase.from("daily_clashes").upsert({
    user_id: userId, target_id: targetId,
    answers: JSON.stringify(answers), completed: true, clash_date: today,
  });
}

export async function getNearbyProfiles(lat, lng, radiusKm = 50) {
  return supabase.rpc("get_nearby_profiles", {
    user_lat: lat, user_lng: lng, radius_km: radiusKm,
  });
}

export async function getSwipeStack(userId, limit = 20) {
  const { data: swiped } = await supabase
    .from("swipe_actions").select("target_id").eq("user_id", userId);
  const exclude = [...(swiped || []).map((s) => s.target_id), userId];

  return supabase
    .from("profiles")
    .select("*, ai_prompt_responses(*)")
    .not("id", "in", `(${exclude.join(",")})`)
    .limit(limit);
}

export async function getTokenBalance(userId) {
  const { data } = await supabase
    .from("user_monetization_ledger")
    .select("token_balance, premium_expires_at")
    .eq("user_id", userId).single();
  return data;
}
