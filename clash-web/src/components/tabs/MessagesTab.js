"use client";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Image as ImageIcon, Send, MapPin, Mic } from "lucide-react";

const SPARK_COLORS = ["#1A1A2E", "#2D1B69", "#0D2137", "#1B2D1B", "#2E1A1A"];

const STORIES = [
  { id: "1", name: "Ananya", avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=60&h=60&fit=crop", hasNew: true },
  { id: "2", name: "Meera", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop", hasNew: true },
  { id: "3", name: "Riya", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=60&h=60&fit=crop", hasNew: false },
];

const CHATS = [
  { id: "1", name: "Ananya", avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=60&h=60&fit=crop",
    lastMsg: "That sounds amazing! Let's plan it", time: "2m", unread: 2, matchType: "clash" },
  { id: "2", name: "Meera", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop",
    lastMsg: "Haha I love that answer", time: "1h", unread: 0, matchType: "normal" },
  { id: "3", name: "Anonymous Spark", avatar: null,
    lastMsg: "Hey! That call was fun", time: "3h", unread: 1, matchType: "spark" },
  { id: "4", name: "Shreya", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=60&h=60&fit=crop",
    lastMsg: "What do you do on weekends?", time: "1d", unread: 0, matchType: "normal" },
];

const MOCK_MESSAGES = [
  { id: "1", text: "Hey! Great answers on your prompts", sender: "them", time: "2:30 PM" },
  { id: "2", text: "Thanks! Your bio cracked me up", sender: "me", time: "2:31 PM" },
  { id: "3", text: "Haha which part?", sender: "them", time: "2:31 PM" },
  { id: "4", text: "The spontaneous road trip thing. I once drove to Coorg at 2am on a Tuesday", sender: "me", time: "2:32 PM" },
  { id: "5", text: "That sounds amazing! Let's plan it", sender: "them", time: "2:33 PM" },
];

function BadgePill({ type }) {
  if (type === "clash") return <span className="text-[9px] font-bold tracking-wider bg-accent/15 text-accent px-1.5 py-0.5 rounded-sm">CLASH</span>;
  if (type === "spark") return <span className="text-[9px] font-bold tracking-wider bg-amber-500/15 text-amber-500 px-1.5 py-0.5 rounded-sm">SPARK</span>;
  return null;
}

export default function MessagesTab() {
  const [activeChat, setActiveChat] = useState(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((p) => [...p, {
      id: Date.now().toString(), text: input.trim(), sender: "me",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }]);
    setInput("");
  };

  // Chat view
  if (activeChat) {
    const chat = CHATS.find((c) => c.id === activeChat);
    const isSpark = chat?.matchType === "spark";
    const canMedia = chat?.matchType === "clash" || chat?.matchType === "normal";

    return (
      <div className="h-full flex flex-col">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border)]">
          <button onClick={() => setActiveChat(null)} className="text-[var(--muted)] hover:text-[var(--text)] cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          {isSpark ? (
            <Mic size={16} className="text-amber-500" />
          ) : (
            <img src={chat?.avatar} alt="" className="w-8 h-8 rounded-[var(--radius)] object-cover" />
          )}
          <div className="flex items-center gap-2 flex-1">
            <span className="font-semibold">{chat?.name}</span>
            <BadgePill type={chat?.matchType} />
          </div>
          <button className="text-[var(--muted)] hover:text-[var(--text)] cursor-pointer" title="Plan a date">
            <MapPin size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {messages.map((msg, i) => {
            const isMe = msg.sender === "me";
            if (isSpark) {
              return (
                <div key={msg.id} className={`max-w-[78%] px-4 py-3 rounded-[var(--radius)] ${isMe ? "ml-auto" : ""}`}
                  style={{ backgroundColor: isMe ? "#E30613" : SPARK_COLORS[i % SPARK_COLORS.length] }}>
                  <p className="text-white text-sm">{msg.text}</p>
                  <p className="text-white/50 text-xs text-right mt-1">{msg.time}</p>
                </div>
              );
            }
            return (
              <div key={msg.id} className={`max-w-[78%] px-4 py-2.5 rounded-[var(--radius)] ${
                isMe ? "ml-auto bg-accent text-white" : "bg-[var(--surface)] border border-[var(--border)]"
              }`}>
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs text-right mt-1 ${isMe ? "text-white/60" : "text-[var(--muted)]"}`}>{msg.time}</p>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex items-end gap-2 px-5 py-3 border-t border-[var(--border)]">
          {canMedia && (
            <button className="w-10 h-10 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] cursor-pointer">
              <ImageIcon size={20} />
            </button>
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
    );
  }

  // Chat list view
  return (
    <div className="h-full flex flex-col">
      <div className="px-5 py-4">
        <h2 className="text-2xl font-bold">Messages</h2>
      </div>

      {/* Status row */}
      <div className="flex gap-4 px-5 pb-3 border-b border-[var(--border)] overflow-x-auto">
        {STORIES.map((s) => (
          <div key={s.id} className="flex flex-col items-center w-16 shrink-0 cursor-pointer">
            <div className={`w-14 h-14 rounded-full p-[2px] ${s.hasNew ? "border-2 border-accent" : "border-2 border-[var(--border)]"}`}>
              <img src={s.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            </div>
            <span className="text-xs mt-1.5 truncate w-full text-center">{s.name}</span>
          </div>
        ))}
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto">
        {CHATS.map((chat) => (
          <button
            key={chat.id}
            onClick={() => setActiveChat(chat.id)}
            className="w-full flex items-center gap-3 px-5 py-3.5 border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors text-left cursor-pointer"
          >
            {chat.avatar ? (
              <img src={chat.avatar} alt="" className="w-12 h-12 rounded-[var(--radius)] object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-full border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center shrink-0">
                <Mic size={18} className="text-amber-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold truncate">{chat.name}</span>
                <BadgePill type={chat.matchType} />
                <span className="text-xs text-[var(--muted)] ml-auto shrink-0">{chat.time}</span>
              </div>
              <div className="flex items-center mt-0.5">
                <p className="text-sm text-[var(--muted)] truncate flex-1">{chat.lastMsg}</p>
                {chat.unread > 0 && (
                  <span className="ml-2 min-w-[20px] h-5 bg-accent text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1.5">
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
