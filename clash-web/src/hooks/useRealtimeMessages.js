import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export function useRealtimeMessages(matchId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;
    async function fetch() {
      const { data } = await supabase
        .from("messages").select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
      setLoading(false);
    }
    fetch();
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `match_id=eq.${matchId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [matchId]);

  const sendMessage = useCallback(
    async (senderId, content) => {
      return supabase.from("messages").insert([{
        match_id: matchId, sender_id: senderId, content,
      }]);
    }, [matchId]
  );

  return { messages, loading, sendMessage };
}
