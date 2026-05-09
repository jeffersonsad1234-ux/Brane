import { useEffect, useState } from "react";
import { Download, X, Smartphone, Share2, Plus as PlusIcon, MoreVertical } from "lucide-react";

/**
 * Botão "Instalar App" — discreto, dourado premium 3D.
 *
 * Comportamento:
 *  - Se o navegador disparar `beforeinstallprompt` (Android Chrome / Edge / Desktop Chrome): clique aciona prompt nativo.
 *  - Em iOS Safari ou navegadores que NÃO suportam beforeinstallprompt: clique abre modal com instruções
 *    visuais para "Adicionar à Tela de Início".
 *  - Mostra-se SEMPRE (até instalar/dispensar definitivamente), com pulso periódico.
 *  - Após instalar (`appinstalled` event ou display-mode standalone) o botão some.
 *
 * Props:
 *  - className?: string
 *  - size?: "sm" | "md"
 */
const STORAGE_KEY = "blivre_pwa_state";

function readState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}
function writeState(next) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
  catch { /* ignore */ }
}

function detectPlatform() {
  if (typeof window === "undefined") return "other";
  const ua = (navigator.userAgent || "").toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const isSafari = /safari/.test(ua) && !/chrome|crios|fxios|edg/.test(ua);
  if (isIOS) return "ios";
  if (isAndroid) return "android";
  if (isSafari) return "safari";
  return "desktop";
}

export default function PWAInstallButton({ className = "", size = "md" }) {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [pulse, setPulse] = useState(true);
  const platform = detectPlatform();

  useEffect(() => {
    const state = readState();
    if (state.installed) { setInstalled(true); return; }

    const isStandalone =
      window.matchMedia &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true);
    if (isStandalone) {
      writeState({ ...state, installed: true });
      setInstalled(true);
      return;
    }

    // Sessão dispensou recentemente?
    if (state.dismissedAt && Date.now() - state.dismissedAt < 7 * 24 * 60 * 60 * 1000) {
      setDismissed(true);
    }

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      writeState({ ...readState(), installed: true });
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // Pulso periódico de 4s a cada 18s
    const t = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 4000);
    }, 18000);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      clearInterval(t);
    };
  }, []);

  if (installed || dismissed) return null;

  const handleClick = async () => {
    setPulse(false);
    if (deferred) {
      try {
        await deferred.prompt();
        const choice = await deferred.userChoice;
        if (choice && choice.outcome === "dismissed") {
          writeState({ ...readState(), dismissedAt: Date.now() });
          setDismissed(true);
        } else if (choice && choice.outcome === "accepted") {
          writeState({ ...readState(), installed: true });
          setInstalled(true);
        }
      } catch { /* ignore */ }
      finally { setDeferred(null); }
      return;
    }
    // Fallback: instruções por plataforma
    setShowHelp(true);
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    writeState({ ...readState(), dismissedAt: Date.now() });
    setDismissed(true);
  };

  const sizeClass =
    size === "sm"
      ? "h-9 px-2.5 text-[11px]"
      : "h-9 sm:h-11 px-2.5 sm:px-3.5 text-[11.5px] sm:text-[12.5px]";

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          "pwa-install-btn relative inline-flex items-center gap-1.5 rounded-2xl " +
          "pwa-gold-3d text-black font-extrabold tracking-tight " +
          "transition-all duration-300 " +
          sizeClass +
          " " +
          (pulse ? "pwa-pulse" : "") +
          " " +
          className
        }
        title="Instalar app"
        data-testid="pwa-install-btn"
      >
        <Download size={14} className="shrink-0" />
        <span className="hidden sm:inline">Instalar</span>
        <span className="sm:hidden">App</span>
        <span
          onClick={handleDismiss}
          role="button"
          tabIndex={-1}
          aria-label="Dispensar"
          className="ml-0.5 inline-flex w-4 h-4 rounded-full items-center justify-center text-black/60 hover:text-black/90 hover:bg-black/10"
          data-testid="pwa-install-dismiss"
        >
          <X size={10} />
        </span>

        <style>{`
          .pwa-gold-3d {
            background: linear-gradient(135deg,
              #8A4A00 0%, #B87333 14%, #D48A00 28%, #FFC107 48%,
              #FFEC8B 56%, #FFC107 66%, #B87333 84%, #5A3A00 100%);
            box-shadow:
              0 1px 0 rgba(255, 240, 200, 0.55) inset,
              0 -2px 4px rgba(0, 0, 0, 0.3) inset,
              0 4px 14px rgba(212, 162, 76, 0.32),
              0 0 18px rgba(212, 162, 76, 0.18);
            border: 1px solid rgba(255, 220, 130, 0.55);
            text-shadow: 0 1px 0 rgba(255, 240, 200, 0.4);
          }
          .pwa-gold-3d:hover {
            transform: translateY(-1px);
            box-shadow:
              0 1px 0 rgba(255, 240, 200, 0.7) inset,
              0 -2px 4px rgba(0, 0, 0, 0.32) inset,
              0 6px 22px rgba(212, 162, 76, 0.55),
              0 0 26px rgba(212, 162, 76, 0.32);
          }
          .pwa-gold-3d:active { transform: translateY(0); }
          @keyframes pwa-breathe {
            0%, 100% { box-shadow:
              0 1px 0 rgba(255, 240, 200, 0.55) inset,
              0 -2px 4px rgba(0, 0, 0, 0.3) inset,
              0 4px 14px rgba(212, 162, 76, 0.32),
              0 0 18px rgba(212, 162, 76, 0.18); }
            50% { box-shadow:
              0 1px 0 rgba(255, 240, 200, 0.75) inset,
              0 -2px 4px rgba(0, 0, 0, 0.3) inset,
              0 6px 24px rgba(212, 162, 76, 0.65),
              0 0 32px rgba(212, 162, 76, 0.5); }
          }
          .pwa-pulse { animation: pwa-breathe 2.6s ease-in-out infinite; }
        `}</style>
      </button>

      {showHelp && (
        <div
          className="fixed inset-0 z-[2147483600] flex items-center justify-center bg-black/85 backdrop-blur-md px-4 py-6"
          style={{ zIndex: 2147483600 }}
          onClick={() => setShowHelp(false)}
          data-testid="pwa-install-help-modal"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-3xl border border-[#D4A24C]/35 bg-[#0B0B12] p-5 sm:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.85)]"
            style={{ zIndex: 2147483601 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl border border-[#D4A24C]/30 bg-[#D4A24C]/10 flex items-center justify-center text-[#F1D28A]">
                  <Smartphone size={18} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                    Instalar B Livre
                  </h3>
                  <p className="text-[11px] text-[#8C8F9A] mt-0.5">
                    Acesso rápido pela tela inicial.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="w-8 h-8 rounded-full border border-white/10 bg-white/[0.04] text-[#C9CBD6] hover:bg-white/10 flex items-center justify-center"
                data-testid="pwa-help-close"
              >
                <X size={15} />
              </button>
            </div>

            {platform === "ios" && (
              <div className="space-y-3 text-[13px] text-[#C9CBD6]">
                <p className="text-[#A6A8B3]">No iPhone/iPad (Safari):</p>
                <Step n={1} icon={<Share2 size={14} />}>
                  Toque no botão <strong>Compartilhar</strong> da barra do navegador.
                </Step>
                <Step n={2} icon={<PlusIcon size={14} />}>
                  Escolha <strong>Adicionar à Tela de Início</strong>.
                </Step>
                <Step n={3} icon={<Download size={14} />}>
                  Toque em <strong>Adicionar</strong> no canto superior direito.
                </Step>
              </div>
            )}

            {platform === "android" && (
              <div className="space-y-3 text-[13px] text-[#C9CBD6]">
                <p className="text-[#A6A8B3]">No Android (Chrome / Edge):</p>
                <Step n={1} icon={<MoreVertical size={14} />}>
                  Toque no menu <strong>(três pontinhos)</strong> no topo do navegador.
                </Step>
                <Step n={2} icon={<Download size={14} />}>
                  Escolha <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.
                </Step>
              </div>
            )}

            {(platform === "desktop" || platform === "safari" || platform === "other") && (
              <div className="space-y-3 text-[13px] text-[#C9CBD6]">
                <p className="text-[#A6A8B3]">No computador (Chrome / Edge / Brave):</p>
                <Step n={1} icon={<Download size={14} />}>
                  Procure o ícone de <strong>instalar</strong> à direita da barra de endereço.
                </Step>
                <Step n={2} icon={<MoreVertical size={14} />}>
                  Ou abra o menu do navegador e clique em <strong>Instalar B Livre</strong>.
                </Step>
              </div>
            )}

            <button
              onClick={() => setShowHelp(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-[#D4A24C] text-black text-sm font-extrabold hover:bg-[#C49542]"
              data-testid="pwa-help-done"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Step({ n, icon, children }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="w-7 h-7 rounded-full bg-[#D4A24C]/15 border border-[#D4A24C]/30 flex items-center justify-center text-[#F1D28A] text-xs font-extrabold flex-shrink-0">
        {n}
      </div>
      <div className="flex-1 text-[13px] leading-relaxed">
        <div className="flex items-center gap-1.5 text-[#D4A24C] text-[11px] font-bold uppercase tracking-wider mb-0.5">
          {icon}
          Passo {n}
        </div>
        {children}
      </div>
    </div>
  );
}
