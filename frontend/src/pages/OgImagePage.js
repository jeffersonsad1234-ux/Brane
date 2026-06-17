import React, { useState } from "react";

const API = process.env.REACT_APP_BACKEND_URL || "";

const STYLES = [
  { id: "minimal", name: "Minimal", color: "#0f0f0f" },
  { id: "dark", name: "Dark", color: "#0a1932" },
  { id: "gradient", name: "Gradient", color: "#581c87" },
  { id: "bold", name: "Bold", color: "#dc2626" },
];

export default function OgImagePage() {
  const [title, setTitle] = useState("How to build a SaaS in 48 hours");
  const [style, setStyle] = useState("minimal");
  const [loading, setLoading] = useState(false);
  const [imgUrl, setImgUrl] = useState(null);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);

  const generate = async () => {
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    setImgUrl(null);
    const start = Date.now();
    try {
      const res = await fetch(`${API}/api/og`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, style }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || `Error ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setImgUrl(url);
      setMeta(`${(blob.size / 1024).toFixed(1)}KB • ${Date.now() - start}ms`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!imgUrl) return;
    const a = document.createElement("a");
    a.href = imgUrl;
    a.download = "og-image.png";
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full mb-4">
            Social Preview Generator
          </span>
          <h1 className="text-4xl font-bold mb-3">
            Make your links look <span className="text-purple-400">professional</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Title → PNG in 3 seconds. No design. No Canva.
          </p>
        </div>

        {/* Demo */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-8 mb-8">
          <h2 className="text-xl font-semibold mb-4">Try it now</h2>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
            placeholder="Enter your title..."
            className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white text-lg focus:outline-none focus:border-purple-500 mb-4"
          />

          <div className="flex flex-wrap gap-3 items-center">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  style === s.id
                    ? "bg-purple-600 text-white"
                    : "bg-[#1a1a1a] border border-[#333] text-gray-400 hover:border-purple-500"
                }`}
              >
                {s.name}
              </button>
            ))}

            <button
              onClick={generate}
              disabled={loading || !title.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-[#333] disabled:text-gray-600 transition-all ml-auto"
            >
              {loading ? "Generating..." : "Generate"}
            </button>

            {imgUrl && (
              <button
                onClick={download}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
              >
                Download PNG
              </button>
            )}
          </div>

          {error && <p className="text-red-400 mt-3">{error}</p>}

          {imgUrl && (
            <div className="mt-6">
              <img src={imgUrl} alt="OG Preview" className="w-full rounded-lg border border-[#333]" />
              {meta && <p className="text-gray-500 text-xs mt-2">{meta}</p>}
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="bg-[#111] border border-[#222] rounded-xl p-6 text-center">
            <h3 className="text-white font-semibold mb-1">3 Seconds</h3>
            <p className="text-gray-500 text-sm">Title → PNG instantly</p>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-xl p-6 text-center">
            <h3 className="text-white font-semibold mb-1">No Design</h3>
            <p className="text-gray-500 text-sm">Professional results without Canva</p>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-xl p-6 text-center">
            <h3 className="text-white font-semibold mb-1">Twitter Ready</h3>
            <p className="text-gray-500 text-sm">1200x630 optimized PNG</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm">
          OJIMAGE © 2025 — Every link you share becomes marketing.
        </p>
      </div>
    </div>
  );
}
