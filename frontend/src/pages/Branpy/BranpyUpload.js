import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadVideo, updateVideo } from "./BranpyAPI";
import { useAuth } from "../../contexts/AuthContext";

export default function BranpyUpload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [category, setCategory] = useState("general");
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  if (!user) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh", color: "rgba(255,255,255,0.4)", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 40 }}>🔒</div>
        <div style={{ fontSize: 16 }}>Faca login para fazer upload</div>
      </div>
    );
  }

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      setError("Selecione um arquivo de video");
      return;
    }
    if (f.size > 200 * 1024 * 1024) {
      setError("Video muito grande (max 200MB)");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ""));
  };

  const handleUpload = async () => {
    if (!file) { setError("Selecione um video"); return; }
    if (!title.trim()) { setError("Adicione um titulo"); return; }
    setUploading(true);
    setError(null);
    try {
      const tagList = hashtags.split(",").map((h) => h.trim().replace(/^#/, "").toLowerCase()).filter(Boolean);
      const result = await uploadVideo(file);
      setProgress(100);
      await updateVideo(result.video_id, {
        title: title.trim(),
        description: description.trim(),
        hashtags: tagList,
        category,
      });
      setUploaded(result);
      setTimeout(() => navigate(`/branpy/video/${result.video_id}`), 1500);
    } catch (e) {
      setError(e.response?.data?.detail || "Erro ao fazer upload");
    } finally {
      setUploading(false);
    }
  };

  const categories = ["general", "music", "dance", "comedy", "educational", "gaming", "sports", "news", "art", "fashion", "food", "travel", "animals", "technology"];

  if (uploaded) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "50vh", gap: 16, color: "rgba(255,255,255,0.8)" }}>
        <div style={{ fontSize: 48 }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 600 }}>Upload concluido!</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Redirecionando para o video...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: 20 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, textAlign: "center" }}>Upload de Video</h2>

      {error && (
        <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.12)", borderRadius: 8, marginBottom: 16, fontSize: 13, color: "rgba(239,68,68,0.8)" }}>
          {error}
          <button onClick={() => setError(null)} style={{ float: "right", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 13 }}>✕</button>
        </div>
      )}

      <div onClick={() => fileRef.current?.click()} style={{
        border: "2px dashed rgba(255,255,255,0.15)", borderRadius: 12, padding: 40,
        textAlign: "center", cursor: "pointer", marginBottom: 20,
        background: preview ? "transparent" : "rgba(255,255,255,0.02)",
        transition: "border-color 0.2s",
      }}>
        <input ref={fileRef} type="file" accept="video/*" onChange={handleFile} style={{ display: "none" }} />
        {preview ? (
          <video src={preview} style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 8 }} controls />
        ) : (
          <div style={{ color: "rgba(255,255,255,0.4)" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📹</div>
            <div style={{ fontSize: 14 }}>Clique para selecionar um video</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>MP4, MOV, WebM — max 200MB</div>
          </div>
        )}
      </div>

      {file && (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 16, textAlign: "center" }}>
          {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4, display: "block" }}>Titulo</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14, outline: "none" }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4, display: "block" }}>Descricao</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit" }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4, display: "block" }}>Hashtags (separadas por virgula)</label>
          <input value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="ex: tecnologia,musica,dance"
            style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13, outline: "none" }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4, display: "block" }}>Categoria</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,15,20)", color: "#fff", fontSize: 13, outline: "none", fontFamily: "inherit" }}
          >
            {categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>

        {uploading && (
          <div style={{ margin: "8px 0" }}>
            <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#8A2CFF,#FF2D55)", borderRadius: 2, transition: "width 0.3s" }} />
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4, textAlign: "center" }}>Uploading... {progress}%</div>
          </div>
        )}

        <button onClick={handleUpload} disabled={uploading || !file}
          style={{
            width: "100%", padding: "12px", borderRadius: 8, border: "none",
            background: uploading ? "rgba(138,44,255,0.4)" : "linear-gradient(135deg,#8A2CFF,#5B1BA6)",
            color: "#fff", fontSize: 15, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer",
            marginTop: 8, transition: "opacity 0.2s",
          }}
        >
          {uploading ? "Enviando..." : "Publicar Video"}
        </button>
      </div>
    </div>
  );
}
