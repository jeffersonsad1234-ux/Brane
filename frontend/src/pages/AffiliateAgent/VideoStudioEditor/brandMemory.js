import React, { useState } from "react";
import { S, I, UID } from "./utils";

export default function BrandMemoryPanel({ memories, setMemories, onApplyMemory }) {
  const [showForm, setShowForm] = useState(false);
  const [memName, setMemName] = useState("");
  const [applying, setApplying] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!memName.trim()) return;
    setSaving(true);
    const newMem = {
      id: UID(),
      name: memName.trim(),
      date: new Date().toLocaleDateString(),
      style: { captionStyle: "classic", zoomPattern: "dynamic", transitionStyle: "smooth", colorGrade: "warm" },
      preview: "🎬",
    };
    setTimeout(() => {
      setMemories((prev) => [newMem, ...prev]);
      setMemName("");
      setShowForm(false);
      setSaving(false);
    }, 1500);
  };

  const handleApply = (mem) => {
    setApplying(mem.id);
    setTimeout(() => {
      onApplyMemory(mem);
      setApplying(null);
    }, 2000);
  };

  return (
    <div style={{ padding: "6px 8px" }}>
      {!showForm && (
        <button onClick={() => setShowForm(true)}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 6,
            padding: "6px 8px", borderRadius: 6,
            background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.12)",
            cursor: "pointer", fontFamily: "inherit",
            transition: "background 0.1s",
          }}
          className="cs-hover-soft"
        >
          <div style={{
            width: 24, height: 24, borderRadius: "50%",
            background: "rgba(59,130,246,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11,
          }}>
            🧠
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 11, color: "rgba(59,130,246,0.7)" }}>Create Memory</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>Save current edit style</div>
          </div>
        </button>
      )}

      {showForm && (
        <div style={{
          borderRadius: 6, background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)", padding: "8px",
        }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>Save Editing Memory</div>
          <input value={memName} onChange={(e) => setMemName(e.target.value)}
            placeholder="e.g. Product Review Style"
            style={{
              width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 4, padding: "4px 6px", fontSize: 11, color: "rgba(255,255,255,0.55)",
              outline: "none", fontFamily: "inherit", marginBottom: 4,
            }}
            autoFocus
          />
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={handleSave} disabled={saving || !memName.trim()}
              style={{
                flex: 1, fontSize: 11, padding: "4px 8px", borderRadius: 4,
                border: "none", cursor: saving ? "wait" : "pointer", fontFamily: "inherit",
                background: saving ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.5)",
                color: saving ? "rgba(59,130,246,0.3)" : "white",
                transition: "background 0.1s",
              }}
            >{saving ? "⏳ Saving..." : "Save Memory"}</button>
            <button onClick={() => setShowForm(false)}
              style={{
                fontSize: 11, padding: "4px 8px", borderRadius: 4, border: "none",
                cursor: "pointer", background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.4)", fontFamily: "inherit",
              }}
              className="cs-hover-soft"
            >Cancel</button>
          </div>
        </div>
      )}

      <div style={{
        fontSize: 11, color: "rgba(255,255,255,0.3)",
        textTransform: "uppercase", letterSpacing: "0.1em",
        marginTop: 8, marginBottom: 4, fontWeight: 500,
      }}>
        Saved Memories
      </div>

      {memories.length === 0 ? (
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <div style={{ fontSize: 18, opacity: 0.08, marginBottom: 4 }}>🧠</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>No saved memories yet</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", marginTop: 2 }}>Edit a video and save your style</div>
        </div>
      ) : (
        memories.map((mem) => (
          <div key={mem.id} style={{
            borderRadius: 6, background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)", padding: "6px 8px",
            marginBottom: 4, transition: "background 0.1s",
          }} className="cs-hover-soft">
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 4,
                background: "rgba(59,130,246,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, flexShrink: 0,
              }}>
                {mem.preview || "🎬"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 11, color: "rgba(255,255,255,0.55)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500,
                }}>{mem.name}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{mem.date}</div>
              </div>
              <button onClick={() => handleApply(mem)} disabled={applying === mem.id}
                style={{
                  fontSize: 10, padding: "3px 8px", borderRadius: 4, border: "none",
                  cursor: applying === mem.id ? "wait" : "pointer",
                  background: applying === mem.id ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.1)",
                  color: applying === mem.id ? "rgba(59,130,246,0.4)" : "rgba(59,130,246,0.6)",
                  fontFamily: "inherit", fontWeight: 500,
                  transition: "background 0.1s",
                }}
                className={applying !== mem.id ? "cs-hover-soft" : ""}
              >
                {applying === mem.id ? "⏳" : "Apply"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 2, marginTop: 3, marginLeft: 34, flexWrap: "wrap" }}>
              {Object.entries(mem.style || {}).slice(0, 3).map(([key, val]) => (
                <span key={key} style={{
                  fontSize: 9, padding: "1px 6px", borderRadius: 4,
                  background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)",
                }}>{val}</span>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
