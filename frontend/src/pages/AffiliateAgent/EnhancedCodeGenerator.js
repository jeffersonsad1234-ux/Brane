import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const PREMADE = [
  {
    id: "chat-1",
    title: "React component generator",
    messages: [
      { role: "user", content: "create a react button component with hover effects and loading state", timestamp: Date.now() - 3600000 },
      { role: "assistant", content: "```jsx\nimport React, { useState } from 'react';\n\nexport default function Button({ children, onClick, variant = 'primary', loading = false }) {\n  const [hovered, setHovered] = useState(false);\n\n  const base = 'inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';\n  const variants = {\n    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',\n    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400',\n    outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400',\n  };\n\n  return (\n    <button\n      onClick={onClick}\n      disabled={loading}\n      onMouseEnter={() => setHovered(true)}\n      onMouseLeave={() => setHovered(false)}\n      className={`${base} ${variants[variant] || variants.primary} ${loading ? 'opacity-60 cursor-not-allowed' : ''} ${hovered ? 'scale-[1.02]' : 'scale-100'}`}\n    >\n      {loading && <svg className=\"animate-spin -ml-1 mr-2 h-4 w-4\" fill=\"none\" viewBox=\"0 0 24 24\"><circle className=\"opacity-25\" cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" strokeWidth=\"4\" /></svg>}\n      {children}\n    </button>\n  );\n}\n```", timestamp: Date.now() - 3500000 },
    ],
  },
  {
    id: "chat-2",
    title: "API endpoint",
    messages: [
      { role: "user", content: "create a fastapi endpoint for user registration with email and password", timestamp: Date.now() - 7200000 },
      { role: "assistant", content: "```python\nfrom fastapi import FastAPI, HTTPException, Depends\nfrom pydantic import BaseModel, EmailStr\nfrom passlib.hash import bcrypt\nfrom sqlalchemy.orm import Session\n\napp = FastAPI()\n\nclass RegisterRequest(BaseModel):\n    email: EmailStr\n    password: str\n    name: str\n\n@app.post('/api/auth/register')\nasync def register(req: RegisterRequest, db: Session = Depends(get_db)):\n    existing = db.query(User).filter(User.email == req.email).first()\n    if existing:\n        raise HTTPException(status_code=400, detail='Email already registered')\n    hashed = bcrypt.hash(req.password)\n    user = User(email=req.email, password_hash=hashed, name=req.name)\n    db.add(user)\n    db.commit()\n    db.refresh(user)\n    token = create_access_token({'sub': str(user.id)})\n    return {'access_token': token, 'token_type': 'bearer', 'user': {'id': user.id, 'email': user.email, 'name': user.name}}\n```", timestamp: Date.now() - 7100000 },
    ],
  },
  {
    id: "chat-3",
    title: "CSS animation",
    messages: [
      { role: "user", content: "create a css keyframe animation for a floating/pulsing notification bell", timestamp: Date.now() - 10800000 },
      { role: "assistant", content: "```css\n@keyframes bell-ring {\n  0% { transform: rotate(0deg); }\n  10% { transform: rotate(15deg); }\n  20% { transform: rotate(-15deg); }\n  30% { transform: rotate(10deg); }\n  40% { transform: rotate(-10deg); }\n  50% { transform: rotate(5deg); }\n  60% { transform: rotate(-5deg); }\n  70%, 100% { transform: rotate(0deg); }\n}\n\n@keyframes pulse-glow {\n  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }\n  50% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }\n}\n\n.notification-bell {\n  display: inline-flex;\n  cursor: pointer;\n  animation: pulse-glow 2s infinite;\n  transition: transform 0.2s ease;\n}\n\n.notification-bell:hover {\n  animation: bell-ring 0.6s ease-in-out;\n}\n\n.bell-badge {\n  position: absolute;\n  top: -4px;\n  right: -4px;\n  width: 18px;\n  height: 18px;\n  font-size: 10px;\n  background: #ef4444;\n  color: white;\n  border-radius: 50%;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  animation: pulse-glow 2s infinite;\n}\n```", timestamp: Date.now() - 10700000 },
    ],
  },
];

const QUICK_ACTIONS = [
  { label: "React Component", prompt: "create a react component for a modal dialog with transition animations", icon: "⚛️" },
  { label: "API Route", prompt: "create a REST API route for product CRUD with validation", icon: "🔌" },
  { label: "SQL Query", prompt: "write a SQL query to find top 10 customers by purchase value in the last 30 days", icon: "🗃️" },
  { label: "CSS Style", prompt: "create a glassmorphism card component with backdrop blur and gradient border", icon: "🎨" },
  { label: "Python Function", prompt: "write a python function that validates and formats a brazilian phone number", icon: "🐍" },
  { label: "Node Script", prompt: "create a node.js script to batch resize images in a directory using sharp", icon: "📜" },
];

const MOCK_RESPONSES = {
  react: "```jsx\nimport React, { useState, useEffect, useRef } from 'react';\n\nexport default function Modal({ open, onClose, title, children }) {\n  const overlayRef = useRef(null);\n\n  useEffect(() => {\n    if (open) document.body.style.overflow = 'hidden';\n    else document.body.style.overflow = '';\n    return () => { document.body.style.overflow = ''; };\n  }, [open]);\n\n  if (!open) return null;\n\n  return (\n    <div\n      ref={overlayRef}\n      onClick={(e) => e.target === overlayRef.current && onClose()}\n      className=\"fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm\"\n    >\n      <div className=\"bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden\">\n        <div className=\"flex items-center justify-between px-6 py-4 border-b\">\n          <h2 className=\"text-lg font-semibold\">{title}</h2>\n          <button onClick={onClose} className=\"p-1 rounded-lg hover:bg-gray-100 transition-colors\">✕</button>\n        </div>\n        <div className=\"p-6\">{children}</div>\n      </div>\n    </div>\n  );\n}\n```",
  api: "```javascript\nimport express from 'express';\nimport { PrismaClient } from '@prisma/client';\nimport { z } from 'zod';\n\nconst router = express.Router();\nconst prisma = new PrismaClient();\n\nconst productSchema = z.object({\n  name: z.string().min(1).max(200),\n  price: z.number().positive(),\n  description: z.string().optional(),\n  category: z.string().optional(),\n  stock: z.number().int().nonnegative().default(0),\n});\n\nrouter.get('/products', async (req, res) => {\n  const { category, page = 1, limit = 20 } = req.query;\n  const where = category ? { category } : {};\n  const [products, total] = await Promise.all([\n    prisma.product.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),\n    prisma.product.count({ where }),\n  ]);\n  res.json({ products, total, page, totalPages: Math.ceil(total / limit) });\n});\n\nrouter.post('/products', async (req, res) => {\n  const data = productSchema.parse(req.body);\n  const product = await prisma.product.create({ data });\n  res.status(201).json(product);\n});\n\nrouter.put('/products/:id', async (req, res) => {\n  const data = productSchema.partial().parse(req.body);\n  const product = await prisma.product.update({ where: { id: req.params.id }, data });\n  res.json(product);\n});\n\nrouter.delete('/products/:id', async (req, res) => {\n  await prisma.product.delete({ where: { id: req.params.id } });\n  res.status(204).send();\n});\n\nexport default router;\n```",
  sql: "```sql\nWITH customer_purchases AS (\n  SELECT\n    c.id,\n    c.name AS customer_name,\n    c.email,\n    SUM(o.total_amount) AS total_spent,\n    COUNT(o.id) AS order_count,\n    MAX(o.created_at) AS last_order_date\n  FROM customers c\n  JOIN orders o ON c.id = o.customer_id\n  WHERE o.created_at >= NOW() - INTERVAL '30 days'\n    AND o.status = 'completed'\n  GROUP BY c.id, c.name, c.email\n)\nSELECT\n  customer_name,\n  email,\n  total_spent,\n  order_count,\n  ROUND(total_spent / NULLIF(order_count, 0), 2) AS avg_order_value,\n  last_order_date\nFROM customer_purchases\nORDER BY total_spent DESC\nLIMIT 10;\n```",
  css: "```css\n.glass-card {\n  position: relative;\n  background: rgba(255, 255, 255, 0.08);\n  backdrop-filter: blur(20px);\n  -webkit-backdrop-filter: blur(20px);\n  border-radius: 1.25rem;\n  border: 1px solid rgba(255, 255, 255, 0.12);\n  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);\n  padding: 1.5rem;\n  overflow: hidden;\n  transition: transform 0.3s ease, box-shadow 0.3s ease;\n}\n\n.glass-card::before {\n  content: '';\n  position: absolute;\n  inset: 0;\n  border-radius: inherit;\n  padding: 2px;\n  background: linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(139, 92, 246, 0.3));\n  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);\n  -webkit-mask-composite: xor;\n  mask-composite: exclude;\n  pointer-events: none;\n}\n\n.glass-card:hover {\n  transform: translateY(-4px);\n  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);\n}\n```",
  python: "```python\nimport re\n\ndef validate_and_format_phone(phone: str) -> str:\n    cleaned = re.sub(r'\\D', '', phone)\n    if len(cleaned) == 11 and cleaned[2] in '79':\n        return f'({cleaned[:2]}) {cleaned[2:7]}-{cleaned[7:]}'\n    elif len(cleaned) == 10:\n        return f'({cleaned[:2]}) {cleaned[2:6]}-{cleaned[6:]}'\n    raise ValueError(f'Invalid phone number: {phone}')\n\ndef validate_and_format_phone_br(phone: str) -> str:\n    cleaned = re.sub(r'\\D', '', phone)\n    if len(cleaned) == 13 and cleaned.startswith('55'):\n        cleaned = cleaned[2:]\n    if len(cleaned) == 11 and cleaned[2] in '79':\n        return f'+55 ({cleaned[:2]}) {cleaned[2:7]}-{cleaned[7:]}'\n    elif len(cleaned) == 10:\n        return f'+55 ({cleaned[:2]}) {cleaned[2:6]}-{cleaned[6:]}'\n    raise ValueError(f'Número inválido: {phone}')\n```",
  node: "```javascript\nimport sharp from 'sharp';\nimport fs from 'fs/promises';\nimport path from 'path';\n\nasync function batchResize(inputDir, outputDir, width = 800) {\n  await fs.mkdir(outputDir, { recursive: true });\n  const files = await fs.readdir(inputDir);\n  const images = files.filter(f => /\\.(jpg|jpeg|png|webp)$/i.test(f));\n\n  for (const file of images) {\n    const inputPath = path.join(inputDir, file);\n    const ext = path.extname(file);\n    const name = path.basename(file, ext);\n    const outputPath = path.join(outputDir, `${name}_${width}w${ext}`);\n\n    await sharp(inputPath)\n      .resize(width, undefined, { fit: 'inside', withoutEnlargement: true })\n      .toFile(outputPath);\n\n    console.log(`Resized: ${file} -> ${outputPath}`);\n  }\n\n  console.log(`Done! Processed ${images.length} images.`);\n}\n\nconst [inputDir, outputDir, width] = process.argv.slice(2);\nif (!inputDir || !outputDir) {\n  console.log('Usage: node resize.mjs <input-dir> <output-dir> [width]');\n  process.exit(1);\n}\nbatchResize(inputDir, outputDir, width ? parseInt(width) : 800).catch(console.error);\n```",
};

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function detectLanguage(code) {
  if (code.startsWith("```jsx") || code.startsWith("```javascript")) return "JSX";
  if (code.startsWith("```python") || code.startsWith("```py")) return "Python";
  if (code.startsWith("```css")) return "CSS";
  if (code.startsWith("```sql")) return "SQL";
  if (code.startsWith("```html")) return "HTML";
  if (code.startsWith("```json")) return "JSON";
  if (code.startsWith("```bash") || code.startsWith("```sh")) return "Bash";
  if (code.startsWith("```")) {
    const m = code.match(/^```(\w+)/);
    return m ? m[1].charAt(0).toUpperCase() + m[1].slice(1) : "Code";
  }
  return "Code";
}

function extractCode(text) {
  const m = text.match(/```[\s\S]*?```/);
  return m ? m[0] : null;
}

function MessageBubble({ msg }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === "user";
  const codeBlock = extractCode(msg.content);
  const lang = codeBlock ? detectLanguage(codeBlock) : null;
  const display = codeBlock ? msg.content.replace(codeBlock, "").trim() : msg.content;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeBlock.replace(/^```\w*\n?/, "").replace(/\n?```$/, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [codeBlock]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div className={`max-w-[85%] ${isUser ? "order-1" : "order-1"}`}>
        {display && (
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isUser ? "bg-cyan-600/20 text-white/80 rounded-br-md" : "bg-white/[0.04] text-white/70 rounded-bl-md"}`}>
            {display}
          </div>
        )}
        {codeBlock && (
          <div className={`mt-2 rounded-xl overflow-hidden border border-white/[0.06] ${isUser ? "ml-8" : "mr-8"}`} style={{ background: "#060606" }}>
            <div className="flex items-center justify-between px-4 h-9 border-b border-white/[0.06]" style={{ background: "#0a0a0a" }}>
              <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#06b6d4" }}>{lang}</span>
              <button
                onClick={handleCopy}
                className="text-[10px] px-2 py-1 rounded-md transition-colors cursor-pointer"
                style={{ color: copied ? "rgba(16,185,129,0.8)" : "rgba(255,255,255,0.25)", background: copied ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)", border: "none" }}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono scrollbar-thin" style={{ color: "rgba(255,255,255,0.55)", background: "#060606" }}>
              <code>{codeBlock.replace(/^```\w*\n?/, "").replace(/\n?```$/, "")}</code>
            </pre>
          </div>
        )}
        <div className={`flex items-center gap-2 mt-1.5 ${isUser ? "justify-end" : "justify-start"} px-1`}>
          <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.12)" }}>{formatTime(msg.timestamp)}</span>
        </div>
      </div>
    </motion.div>
  );
}

function ChatArea({ messages, onSend, input, setInput }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}
        </AnimatePresence>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.04)" }}>{"</>"}</div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.1)" }}>
              Ask me to generate code, queries, or scripts
            </p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex-shrink-0 px-6 py-4 border-t border-white/[0.06]" style={{ background: "#0c0c0c" }}>
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            rows={1}
            className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/60 outline-none resize-none transition-colors placeholder-white/20"
            style={{ minHeight: 42, maxHeight: 120 }}
          />
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onSend}
            className="flex-shrink-0 h-[42px] px-5 rounded-xl text-sm font-medium transition-all cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #06b6d4, #0891b2)",
              color: "white",
              border: "none",
              opacity: input.trim() ? 1 : 0.4,
            }}
            disabled={!input.trim()}
          >
            Generate
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default function EnhancedCodeGenerator() {
  const [conversations, setConversations] = useLocalStorage("enhanced_codegen_conversations", PREMADE);
  const [activeChat, setActiveChat] = useState(conversations[0]?.id || null);
  const [input, setInput] = useState("");

  const currentChat = conversations.find((c) => c.id === activeChat);
  const messages = currentChat?.messages || [];

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || !activeChat) return;

    const userMsg = { role: "user", content: text, timestamp: Date.now() };
    const lower = text.toLowerCase();

    let responseCode = "";
    if (lower.includes("modal") || lower.includes("dialog") || (lower.includes("react") && lower.includes("component"))) responseCode = MOCK_RESPONSES.react;
    else if (lower.includes("api") || lower.includes("route") || lower.includes("crud") || lower.includes("rest")) responseCode = MOCK_RESPONSES.api;
    else if (lower.includes("sql") || lower.includes("query") || lower.includes("database") || lower.includes("table")) responseCode = MOCK_RESPONSES.sql;
    else if (lower.includes("css") || lower.includes("style") || lower.includes("glass") || lower.includes("animation")) responseCode = MOCK_RESPONSES.css;
    else if (lower.includes("python") || lower.includes("def ") || lower.includes("function") || lower.includes("validate")) responseCode = MOCK_RESPONSES.python;
    else if (lower.includes("node") || lower.includes("script") || lower.includes("sharp") || lower.includes("resize")) responseCode = MOCK_RESPONSES.node;
    else responseCode = MOCK_RESPONSES.react;

    const assistantMsg = { role: "assistant", content: responseCode, timestamp: Date.now() + 100 };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChat ? { ...c, messages: [...c.messages, userMsg, assistantMsg] } : c
      )
    );
    setInput("");
  }, [input, activeChat, setConversations]);

  const handleQuickAction = useCallback((prompt) => {
    setInput(prompt);
  }, []);

  const handleNewChat = useCallback(() => {
    const id = `chat-${Date.now()}`;
    const chat = { id, title: `New conversation`, messages: [] };
    setConversations((prev) => [chat, ...prev]);
    setActiveChat(id);
  }, [setConversations]);

  const handleSelectChat = useCallback((id) => {
    setActiveChat(id);
    setInput("");
  }, []);

  return (
    <div className="h-full flex flex-col" style={{ background: "#0a0a0a", color: "white" }}>
      <div className="h-10 flex items-center px-5 border-b border-white/[0.06] flex-shrink-0" style={{ background: "#0c0c0c" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded flex items-center justify-center text-[10px]" style={{ background: "rgba(6,182,212,0.15)", color: "#06b6d4" }}>
            {"</>"}
          </div>
          <span className="text-[11px] font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.4)" }}>Enhanced Code Generator</span>
        </div>
        <div className="flex-1" />
        <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.12)" }}>BRANPY Dev Agent</span>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="w-52 flex-shrink-0 border-r border-white/[0.06] flex flex-col" style={{ background: "#0c0c0c" }}>
          <div className="h-10 flex items-center justify-between px-4 border-b border-white/[0.06] flex-shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.2)" }}>History</span>
            <button onClick={handleNewChat} className="text-[10px] w-5 h-5 flex items-center justify-center rounded cursor-pointer transition-colors" style={{ color: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.04)", border: "none" }}>
              +
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
            {conversations.map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                className="w-full text-left px-4 py-2.5 transition-colors cursor-pointer"
                style={{
                  background: activeChat === chat.id ? "rgba(255,255,255,0.04)" : "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                }}
              >
                <div className="text-[11px] truncate" style={{ color: activeChat === chat.id ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)" }}>
                  {chat.title}
                </div>
                <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.1)" }}>
                  {chat.messages.length} messages
                </div>
              </button>
            ))}
          </div>
        </div>

        <ChatArea messages={messages} onSend={handleSend} input={input} setInput={setInput} />

        <div className="w-44 flex-shrink-0 border-l border-white/[0.06] flex flex-col" style={{ background: "#0c0c0c" }}>
          <div className="h-10 flex items-center px-4 border-b border-white/[0.06] flex-shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.2)" }}>Quick Actions</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 scrollbar-thin">
            {QUICK_ACTIONS.map((action) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleQuickAction(action.prompt)}
                className="w-full text-left px-3 py-2.5 rounded-xl text-[10px] transition-all cursor-pointer border"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  color: "rgba(255,255,255,0.4)",
                  borderColor: "rgba(255,255,255,0.06)",
                }}
              >
                <span className="mr-1.5 text-xs">{action.icon}</span>
                {action.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
