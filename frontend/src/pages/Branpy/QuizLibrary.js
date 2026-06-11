import { useState } from "react";
import CATEGORIES, { QUIZ_MODES } from "../../data/quizLibrary/categories";

const COLORS = {
  bg: "#050608",
  primary: "#8A2CFF",
  secondary: "#5B1BA6",
  accent: "#00E5FF",
  text: "#FFFFFF",
  muted: "rgba(255,255,255,0.5)",
};

const cardStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: "14px 16px",
  cursor: "pointer",
  userSelect: "none",
  WebkitUserSelect: "none",
  transition: "all 0.15s",
};

const selectedCard = {
  ...cardStyle,
  border: `1px solid ${COLORS.primary}`,
  background: `${COLORS.primary}15`,
};

const btnStyle = {
  display: "block",
  width: "100%",
  padding: "12px 14px",
  background: COLORS.primary,
  border: "none",
  borderRadius: 8,
  color: "#fff",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  textAlign: "center",
  WebkitTapHighlightColor: "transparent",
  transition: "opacity 0.15s",
};

export default function QuizLibrary({ onStart }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMode, setSelectedMode] = useState(QUIZ_MODES[0]);

  const handleStart = () => {
    if (!selectedCategory || !selectedMode) return;
    const modeValue = selectedMode.id === "infinito" ? null : parseInt(selectedMode.id, 10);
    onStart({
      categoryId: selectedCategory.id,
      categoryName: selectedCategory.name,
      mode: selectedMode.id,
      count: modeValue,
    });
  };

  return (
    <div style={{ fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <div style={{
        fontSize: 13,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: 1,
        color: COLORS.primary,
        marginBottom: 12,
      }}>
        📚 Biblioteca de Quizzes
      </div>

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        marginBottom: 16,
        maxHeight: "calc(100vh - 320px)",
        overflowY: "auto",
        paddingRight: 4,
      }}>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory?.id === cat.id;
          return (
            <div
              key={cat.id}
              onClick={() => setSelectedCategory(cat)}
              style={isSelected ? selectedCard : cardStyle}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{cat.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.text,
                  }}>
                    {cat.name}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: COLORS.muted,
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {cat.description}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedCategory && (
        <>
          <div style={{
            fontSize: 10,
            color: COLORS.muted,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 6,
          }}>
            Modo de jogo
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 14 }}>
            {QUIZ_MODES.map((mode) => {
              const isActive = selectedMode?.id === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode)}
                  style={{
                    ...btnStyle,
                    background: isActive ? COLORS.primary : "rgba(255,255,255,0.06)",
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 400,
                    padding: "8px 6px",
                    border: isActive ? "none" : "1px solid rgba(255,255,255,0.1)",
                    opacity: isActive ? 1 : 0.7,
                  }}
                >
                  <div style={{ fontSize: 11, marginBottom: 1 }}>{mode.label}</div>
                  <div style={{ fontSize: 9, opacity: 0.7 }}>{mode.description}</div>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleStart}
            style={{
              ...btnStyle,
              fontSize: 15,
              padding: "14px",
            }}
          >
            ▶ Iniciar Quiz — {selectedCategory.name}
          </button>
        </>
      )}
    </div>
  );
}
