import { Component } from "react";

export class AIChatErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error: error ? (error.message || "Erro no chat") : "Erro no chat" };
  }

  componentDidCatch(error) {
    console.error("[AIChat ErrorBoundary]", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 12, padding: 24,
          background: "#080808", color: "rgba(255,255,255,0.6)",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          fontSize: 13, textAlign: "center", minHeight: 200,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>!</div>
          <div style={{ fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>Erro no assistente</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", maxWidth: 300, lineHeight: "1.4" }}>
            Ocorreu um erro inesperado. O chat foi reiniciado automaticamente.
          </div>
          <button onClick={() => this.setState({ error: null }, () => window.location.reload())}
            style={{
              marginTop: 4, padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "inherit",
            }}
          >Recarregar</button>
        </div>
      );
    }
    return this.props.children;
  }
}
