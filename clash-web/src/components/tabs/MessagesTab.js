"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Image as ImageIcon, Send, MapPin, Mic, X } from "lucide-react";

const SPARK_COLORS = ["#1A1A2E", "#2D1B69", "#0D2137", "#1B2D1B", "#2E1A1A"];
const CHAT_BUCKET = "chat-photos";
const MAX_SIZE = 5 * 1024 * 1024;

function BadgePill({ type }) {
  if (type === "clash")
    return <span className="text-[9px] font-bold tracking-wider bg-accent/15 text-accent px-1.5 py-0.5 rounded-sm">CLASH</span>;
  if (type === "spark")
    return <span className="text-[9px] font-bold tracking-wider bg-amber-500/15 text-amber-500 px-1.5 py-0.5 rounded-sm">SPARK</span>;
  return null;
}

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now - d) / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return d.toLocaleDateString();
}

function formatTimestamp(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function uploadChatPhoto(file, userId, matchId) {
  if (!file.type.startsWith("image/")) return { error: "Only image files allowed" };
  if (file.size > MAX_SIZE) return { error: "File must be under 5MB" };

  const ext = file.name.split(".").pop();
  const path = `${matchId}/${userId}-${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(CHAT_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) return { error: error.message };

  const { data: urlData } = supabase.storage.from(CHAT_BUCKET).getPublicUrl(data.path);
  return { url: urlData.publicUrl, error: null };
}

export default function MessagesTab() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [lightboxImage, setLightboxImage] = useState(null);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);

  const fetchMatches = useCallback(async () => {
    if (!user) return;
    setLoadingMatches(true);

    const { data: matchesData } = await supabase
      .from("matches")
      .select("*")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order("matched_at", { ascending: false });

    if (!matchesData || matchesData.length === 0) {
      setMatches([]);
      setLoadingMatches(false);
      return;
    }

    const otherIds = matchesData.map((m) => (m.user_a === user.id ? m.user_b : m.user_a));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, photos_urls")
      .in("id", otherIds);

    const enriched = await Promise.all(
      matchesData.map(async (m) => {
        const otherId = m.user_a === user.id ? m.user_b : m.user_a;
        const otherProfile = profiles?.find((p) => p.id === otherId);

        const { data: lastMsg } = await supabase
          .from("messages")
          .select("content, image_url, created_at")
          .eq("match_id", m.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const preview = lastMsg?.image_url ? "📷 Photo" : (lastMsg?.content || "Say hi 👋");

        return {
          id: m.id,
          matchType: m.match_type,
          name: otherProfile?.display_name || "Unknown",
          avatar: otherProfile?.photos_urls?.[0] || null,
          lastMsg: preview,
          time: lastMsg ? formatTime(lastMsg.created_at) : formatTime(m.matched_at),
          otherId,
        };
      })
    );

    setMatches(enriched);
    setLoadingMatches(false);
  }, [user]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  useEffect(() => {
    if (!activeChat) return;
    let cancelled = false;
    setUploadError("");

    async function loadMessages() {
      setLoadingMessages(true);
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", activeChat.id)
        .order("created_at", { ascending: true });
      if (!cancelled) {
        setMessages(data || []);
        setLoadingMessages(false);
      }
    }

    loadMessages();
    return () => { cancelled = true; };
  }, [activeChat]);

  useEffect(() => {
    if (!activeChat) return;
    const channel = supabase
      .channel(`messages:${activeChat.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `match_id=eq.${activeChat.id}`,
      }, (payload) => {
        setMessages((prev) => {
          if (prev.find((m) => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [activeChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  const sendMessage = async () => {
    if (!input.trim() || !activeChat || !user) return;
    const content = input.trim();
    setInput("");

    const { data, error } = await supabase
      .from("messages")
      .insert([{ match_id: activeChat.id, sender_id: user.id, content }])
      .select()
      .single();

    if (error) {
      console.error("Send failed:", error);
      setInput(content);
      return;
    }
    if (data) {
      setMessages((prev) => {
        if (prev.find((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
    }
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat || !user) return;
    e.target.value = "";
    setUploading(true);
    setUploadError("");

    const { url, error } = await uploadChatPhoto(file, user.id, activeChat.id);
    if (error) {
      setUploadError(error);
      setUploading(false);
      return;
    }

    const { data, error: msgError } = await supabase
      .from("messages")
      .insert([{ match_id: activeChat.id, sender_id: user.id, image_url: url }])
      .select()
      .single();

    setUploading(false);
    if (msgError) {
      setUploadError("Failed to send photo: " + msgError.message);
      return;
    }

    if (data) {
      setMessages((prev) => {
        if (prev.find((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
    }
  };

  if (activeChat) {
    const isSpark = activeChat.matchType === "spark";
    const canMedia = activeChat.matchType === "clash" || activeChat.matchType === "normal";

    return (
      <>
        <div className="h-full flex flex-col">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border)]">
            <button onClick={() => setActiveChat(null)} className="text-[var(--muted)] hover:text-[var(--text)] cursor-pointer">
              <ArrowLeft size={20} />
            </button>
            {isSpark ? (
              <Mic size={16} className="text-amber-500" />
            ) : activeChat.avatar ? (
              <img src={activeChat.avatar} alt="" className="w-8 h-8 rounded-[var(--radius)] object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--surface)] border border-[var(--border)]" />
            )}
            <div className="flex items-center gap-2 flex-1">
              <span className="font-semibold">{activeChat.name}</span>
              <BadgePill type={activeChat.matchType} />
            </div>
            <button className="text-[var(--muted)] hover:text-[var(--text)] cursor-pointer" title="Plan a date">
              <MapPin size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
            {loadingMessages ? (
              <div className="text-center text-sm text-[var(--muted)] py-8">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-sm text-[var(--muted)] py-8">
                No messages yet. Send the first one!
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.sender_id === user.id;
                const isImage = !!msg.image_url;

                if (isImage) {
                  return (
                    <div key={msg.id} className={`max-w-[78%] ${isMe ? "ml-auto" : ""}`}>
                      <div
                        className={`rounded-[var(--radius)] overflow-hidden cursor-pointer border ${
                          isMe ? "border-accent" : "border-[var(--border)]"
                        }`}
                        onClick={() => setLightboxImage(msg.image_url)}
                      >
                        <img src={msg.image_url} alt="Shared photo" className="max-w-full max-h-[300px] object-cover" />
                      </div>
                      <p className={`text-[10px] mt-1 px-1 ${isMe ? "text-right" : ""} text-[var(--muted)]`}>
                        {formatTimestamp(msg.created_at)}
                      </p>
                    </div>
                  );
                }

                if (isSpark) {
                  return (
                    <div
                      key={msg.id}
                      className={`max-w-[78%] px-4 py-3 rounded-[var(--radius)] ${isMe ? "ml-auto" : ""}`}
                      style={{ backgroundColor: isMe ? "#E30613" : SPARK_COLORS[i % SPARK_COLORS.length] }}
                    >
                      <p className="text-white text-sm">{msg.content}</p>
                      <p className="text-white/50 text-xs text-right mt-1">{formatTimestamp(msg.created_at)}</p>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`max-w-[78%] px-4 py-2.5 rounded-[var(--radius)] ${
                      isMe ? "ml-auto bg-accent text-white" : "bg-[var(--surface)] border border-[var(--border)]"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs text-right mt-1 ${isMe ? "text-white/60" : "text-[var(--muted)]"}`}>
                      {formatTimestamp(msg.created_at)}
                    </p>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {uploadError && (
            <div className="mx-5 mb-2 p-2 bg-red-50 border border-red-200 rounded-[var(--radius)] text-red-700 text-xs">
              {uploadError}
            </div>
          )}

          <div className="flex items-end gap-2 px-5 py-3 border-t border-[var(--border)]">
            {canMedia && (
              <>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-10 h-10 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] cursor-pointer disabled:opacity-40"
                  title="Send photo"
                >
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ImageIcon size={20} />
                  )}
                </button>
              </>
            )}
            <input
              className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] px-4 py-2.5 text-sm outline-none text-[var(--text)] placeholder:text-[var(--muted)]"
              placeholder={isSpark ? "Text only in Spark chats..." : "Type a message..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                input.trim() ? "bg-accent text-white" : "bg-[var(--surface)] text-[var(--muted)]"
              }`}
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {lightboxImage && (
          <div
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
          >
            <button className="absolute top-4 right-4 text-white p-2 hover:opacity-70">
              <X size={24} />
            </button>
            <img
              src={lightboxImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 py-4">
        <h2 className="text-2xl font-bold">Messages</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loadingMatches ? (
          <div className="text-center text-sm text-[var(--muted)] py-12">Loading matches...</div>
        ) : matches.length === 0 ? (
          <div className="text-center px-10 py-12">
            <p className="text-lg font-semibold">No matches yet</p>
            <p className="text-sm text-[var(--muted)] mt-2">
              Like profiles in Discovery to start matching.
            </p>
          </div>
        ) : (
          matches.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              className="w-full flex items-center gap-3 px-5 py-3.5 border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors text-left cursor-pointer"
            >
              {chat.avatar ? (
                <img src={chat.avatar} alt="" className="w-12 h-12 rounded-[var(--radius)] object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center shrink-0">
                  {chat.matchType === "spark" ? (
                    <Mic size={18} className="text-amber-500" />
                  ) : (
                    <span className="text-[var(--muted)] text-lg">?</span>
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{chat.name}</span>
                  <BadgePill type={chat.matchType} />
                  <span className="text-xs text-[var(--muted)] ml-auto shrink-0">{chat.time}</span>
                </div>
                <p className="text-sm text-[var(--muted)] truncate mt-0.5">{chat.lastMsg}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
