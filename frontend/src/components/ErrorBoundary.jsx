import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error: error?.message || "Erro desconhecido" };
  }

  componentDidCatch(error, info) {
    this.setState({ info: info?.componentStack || "" });
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#050608] flex items-center justify-center p-8">
          <div className="max-w-lg w-full rounded-2xl border border-red-500/20 bg-[#121216]/80 backdrop-blur-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-400 text-2xl font-black">!</span>
            </div>
            <h1 className="text-xl font-black text-white mb-2">Erro no Painel Admin</h1>
            <p className="text-sm text-[#8C8F9A] mb-4 font-mono bg-[#0A0A0C] p-4 rounded-xl text-left overflow-auto max-h-40">
              {this.state.error}
            </p>
            {this.state.info && (
              <details className="text-left mb-4">
                <summary className="text-[11px] text-[#D4A24C] cursor-pointer font-semibold">Stack trace</summary>
                <pre className="text-[10px] text-[#5C5F6A] mt-2 bg-[#0A0A0C] p-3 rounded-xl overflow-auto max-h-60">
                  {this.state.info}
                </pre>
              </details>
            )}
            <button onClick={() => window.location.reload()}
              className="h-10 px-6 bg-[#D4A24C] text-black font-bold rounded-xl hover:bg-[#C49542]">
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
