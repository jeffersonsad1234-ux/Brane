import React, { useState } from "react";
import { motion } from "framer-motion";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

export default function AIVideoGenerator() {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setGenerating(true);
    setError(null);
    setVideoUrl(null);

    try {
      const response = await fetch(`${API_URL}/api/generate-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          duration: duration
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate video");
      }

      const data = await response.json();
      
      if (data.success) {
        setVideoUrl(data.video);
        setHistory((prev) => [
          {
            id: Date.now(),
            prompt: prompt.trim(),
            video: data.video,
            timestamp: new Date().toLocaleTimeString()
          },
          ...prev.slice(0, 9)
        ]);
      } else {
        setError(data.message || "Video generation not available");
      }
    } catch (err) {
      setError(err.message);
      console.error("Video generation error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `brandpy-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]">
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/[0.06]">
        <h1 className="text-2xl font-bold text-white/90">AI Video Generator</h1>
        <p className="text-sm text-white/40 mt-1">Generate videos from text prompts</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-[10px] text-white/30 uppercase tracking-wider">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A astronaut riding a horse on Mars..."
              className="w-full h-24 bg-white/[0.04] border border-white/[0.06] rounded-lg px-4 py-3 text-[12px] text-white/60 outline-none placeholder:text-white/15 focus:border-white/[0.15] resize-none"
            />
          </div>

          {/* Duration Slider */}
          <div className="space-y-2">
            <label className="text-[10px] text-white/30 uppercase tracking-wider">
              Duration: {duration}s
            </label>
            <input
              type="range"
              min="2"
              max="5"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Generate Button */}
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 py-3 rounded-lg bg-gradient-to-r from-purple-500/80 to-pink-500/80 hover:from-purple-500 hover:to-pink-500 text-white text-[11px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? "Generating Video..." : "🎬 Generate Video"}
            </motion.button>

            {videoUrl && (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleDownload}
                className="px-4 py-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white/60 text-[11px] transition-all"
              >
                ⬇ Download
              </motion.button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px]">
              {error}
            </div>
          )}

          {/* Loading */}
          {generating && (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <p className="text-[10px] text-white/40">Generating video... This may take 30-60 seconds</p>
            </div>
          )}

          {/* Generated Video */}
          {videoUrl && !generating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3"
            >
              <div className="text-[10px] text-white/40 uppercase tracking-wider">✅ Generated Video</div>
              <div className="relative rounded-xl overflow-hidden border border-white/[0.1]">
                <video controls src={videoUrl} className="w-full h-auto" />
              </div>
            </motion.div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="space-y-3 mt-8">
              <div className="text-[10px] text-white/40 uppercase tracking-wider">Recent Generations</div>
              <div className="grid grid-cols-2 gap-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setVideoUrl(item.video)}
                    className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] cursor-pointer hover:border-white/[0.15] transition-all"
                  >
                    <p className="text-[10px] text-white/60 line-clamp-2">{item.prompt}</p>
                    <p className="text-[9px] text-white/30 mt-2">{item.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
