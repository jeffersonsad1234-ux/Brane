import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

/* ── Constants ─────────────────────────────────────────────── */

const CHANNELS = [
  { id: "general", topic: "Team updates & announcements" },
  { id: "random", topic: "Off-topic & watercooler" },
  { id: "design", topic: "Design discussions & feedback" },
  { id: "dev", topic: "Engineering & code reviews" },
  { id: "marketing", topic: "Campaigns & growth" },
];

const MOCK_MESSAGES = {
  general: [
    { id: "g1", user: "Alex", content: "Hey team! Welcome to the new BRANPY workspace \u{1F680} Really excited about what we're building together.", timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id: "g2", user: "Sarah", content: "Thanks Alex! The new platform is looking incredible. Can't wait to dive into the affiliate tools.", timestamp: new Date(Date.now() - 82800000).toISOString() },
    { id: "g3", user: "Mike", content: "Has everyone seen the new dashboard update? The analytics section is finally live.", timestamp: new Date(Date.now() - 43200000).toISOString() },
    { id: "g4", user: "Emma", content: "Just reviewed it \u{2014} the conversion metrics are beautifully displayed. Great work dev team!", timestamp: new Date(Date.now() - 42000000).toISOString() },
  ],
  random: [
    { id: "r1", user: "Lisa", content: "Anyone tried the new coffee shop downtown? Their cold brew is unreal.", timestamp: new Date(Date.now() - 72000000).toISOString() },
    { id: "r2", user: "James", content: "Yes! The pour-over is amazing too. We should do a team outing there.", timestamp: new Date(Date.now() - 71400000).toISOString() },
    { id: "r3", user: "Rachel", content: "Count me in! Friday afternoons work best for me.", timestamp: new Date(Date.now() - 70800000).toISOString() },
  ],
  design: [
    { id: "d1", user: "Emma", content: "Pushed the new mockups for the landing page redesign. Check the Figma board when you get a chance.", timestamp: new Date(Date.now() - 54000000).toISOString() },
    { id: "d2", user: "Mike", content: "Looking sharp! The new color palette works perfectly with the brand guidelines.", timestamp: new Date(Date.now() - 53400000).toISOString() },
    { id: "d3", user: "Alex", content: "Can we iterate on the hero section one more time? I'm thinking we need a stronger CTA.", timestamp: new Date(Date.now() - 52800000).toISOString() },
    { id: "d4", user: "Emma", content: "Absolutely. I'll have a new variant ready by EOD.", timestamp: new Date(Date.now() - 52200000).toISOString() },
  ],
  dev: [
    { id: "dv1", user: "David", content: "Merged the authentication PR. Ready for review on the develop branch.", timestamp: new Date(Date.now() - 36000000).toISOString() },
    { id: "dv2", user: "Rachel", content: "I'll review it after lunch. Also finished the API rate limiting middleware \u{2014} tests are passing.", timestamp: new Date(Date.now() - 35400000).toISOString() },
    { id: "dv3", user: "James", content: "Great work both. Let's sync on the deployment pipeline tomorrow morning.", timestamp: new Date(Date.now() - 34800000).toISOString() },
  ],
  marketing: [
    { id: "m1", user: "Sarah", content: "Campaign metrics for this week are looking solid. Conversion rate is up 12% week-over-week.", timestamp: new Date(Date.now() - 18000000).toISOString() },
    { id: "m2", user: "Lisa", content: "The email open rate jumped 15% after the redesign. The new template is performing really well.", timestamp: new Date(Date.now() - 17400000).toISOString() },
    { id: "m3", user: "Mike", content: "Let's double down on the LinkedIn campaign. That channel has the highest ROI right now.", timestamp: new Date(Date.now() - 16800000).toISOString() },
    { id: "m4", user: "Sarah", content: "Agreed. I'll prepare the budget proposal for next month.", timestamp: new Date(Date.now() - 16200000).toISOString() },
  ],
};

const MEMBERS = [
  { name: "Alex", status: "online" },
  { name: "Sarah", status: "online" },
  { name: "Mike", status: "away" },
  { name: "Emma", status: "online" },
  { name: "James", status: "busy" },
  { name: "Lisa", status: "online" },
  { name: "David", status: "away" },
  { name: "Rachel", status: "online" },
];

const STATUS_COLORS = { online: "#22c55e", away: "#f59e0b", busy: "#ef4444" };

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/* ── Component ────────────────────────────────────────────── */

export default function TeamChatView() {
  const [selectedChannel, setSelectedChannel] = useState("general");
  const [channelMessages, setChannelMessages] = useLocalStorage("teamchat_messages", MOCK_MESSAGES);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  const channel = CHANNELS.find((c) => c.id === selectedChannel);
  const messages = channelMessages[selectedChannel] || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const newMsg = {
      id: `${selectedChannel}-${Date.now()}`,
      user: "You",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setChannelMessages((prev) => ({
      ...prev,
      [selectedChannel]: [...(prev[selectedChannel] || []), newMsg],
    }));
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onlineCount = MEMBERS.filter((m) => m.status === "online").length;

  return (
    <div className="flex h-full w-full bg-[#0a0a0a] text-white/50">

      {/* ── Left Sidebar — Channels ── */}
      <div className="w-56 shrink-0 border-r border-white/[0.06] flex flex-col">
        <div className="px-4 pt-5 pb-3 text-[11px] font-semibold uppercase tracking-widest text-white/30">
          Channels
        </div>
        <nav className="flex-1 px-2 space-y-0.5">
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setSelectedChannel(ch.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                selectedChannel === ch.id
                  ? "bg-white/[0.08] text-white font-medium"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
              }`}
            >
              # {ch.id}
            </button>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-white/[0.06] text-xs text-white/20">
          BRANPY Ecosystem
        </div>
      </div>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Bar */}
        <div className="shrink-0 px-6 py-3 border-b border-white/[0.06] flex items-center gap-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-semibold text-white">
              # {channel?.id}
            </h2>
            {channel?.topic && (
              <span className="hidden sm:inline text-xs text-white/20">
                {channel.topic}
              </span>
            )}
          </div>
          <span className="ml-auto text-xs text-white/30">
            {onlineCount} online
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-white/20 text-sm">
                No messages yet. Start the conversation!
              </div>
            )}
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex items-start gap-3 group"
              >
                <div className="shrink-0 w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-xs font-semibold text-white/70">
                  {msg.user[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-white/80">
                      {msg.user}
                    </span>
                    <span className="text-[11px] text-white/20 group-hover:text-white/30 transition-colors">
                      {formatDate(msg.timestamp)} at {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-white/50 mt-0.5 leading-relaxed break-words">
                    {msg.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div className="shrink-0 px-6 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 bg-white/[0.04] rounded-xl px-4 py-2.5 border border-white/[0.06] focus-within:border-white/[0.12] transition-colors">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${channel?.id}`}
              className="flex-1 bg-transparent text-sm text-white/70 placeholder-white/20 outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] disabled:opacity-30 disabled:cursor-not-allowed text-xs font-medium text-white/60 hover:text-white/80 transition-all duration-200"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* ── Right Sidebar — Members ── */}
      <div className="w-56 shrink-0 border-l border-white/[0.06] flex flex-col">
        <div className="px-4 pt-5 pb-3 text-[11px] font-semibold uppercase tracking-widest text-white/30">
          Members — {MEMBERS.length}
        </div>
        <div className="flex-1 px-2 space-y-0.5 overflow-y-auto">
          {MEMBERS.map((member) => (
            <div
              key={member.name}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-default"
            >
              <div className="relative shrink-0">
                <div className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-xs font-semibold text-white/70">
                  {member.name[0]}
                </div>
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0a]"
                  style={{ backgroundColor: STATUS_COLORS[member.status] }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-white/60 truncate leading-tight">
                  {member.name}
                </div>
                <div className="text-[11px] capitalize" style={{ color: STATUS_COLORS[member.status] }}>
                  {member.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
