import { useEffect, useState } from "react";

export default function BraneAIAvatar({ state = "idle", isListening = false }) {
  const [mouthOpen, setMouthOpen] = useState(false);

  useEffect(() => {
    if (state !== "speaking") return;

    const interval = setInterval(() => {
      setMouthOpen((prev) => !prev);
    }, 150);

    return () => clearInterval(interval);
  }, [state]);

  const isWorking = state === "working";

  return (
    <div className="flex items-center justify-center h-full relative">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        @keyframes glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }

        @keyframes workingRotate {
          0% { transform: rotateY(0deg) rotateZ(-5deg); }
          25% { transform: rotateY(45deg) rotateZ(-8deg); }
          50% { transform: rotateY(90deg) rotateZ(0deg); }
          75% { transform: rotateY(45deg) rotateZ(8deg); }
          100% { transform: rotateY(0deg) rotateZ(-5deg); }
        }

        @keyframes armPulse {
          0% { transform: rotateZ(0deg); }
          25% { transform: rotateZ(-15deg); }
          50% { transform: rotateZ(15deg); }
          75% { transform: rotateZ(-10deg); }
          100% { transform: rotateZ(0deg); }
        }

        @keyframes headNod {
          0%, 100% { transform: rotateX(0deg); }
          50% { transform: rotateX(8deg); }
        }

        @keyframes pulseRing {
          0% { r: 45; opacity: 0.8; }
          100% { r: 65; opacity: 0; }
        }

        .avatar-container {
          animation: ${!isWorking ? "float 3s ease-in-out infinite" : "none"};
          perspective: 1000px;
        }

        .avatar-body {
          animation: ${isWorking ? "workingRotate 1.2s ease-in-out infinite" : "none"};
          transform-style: preserve-3d;
          transition: all 0.3s ease;
        }

        .avatar-arm-left {
          animation: ${isWorking ? "armPulse 1s ease-in-out infinite" : "none"};
          transform-origin: 30px 30px;
          transition: all 0.3s ease;
        }

        .avatar-arm-right {
          animation: ${isWorking ? "armPulse 1s ease-in-out infinite 0.2s" : "none"};
          transform-origin: 70px 30px;
          transition: all 0.3s ease;
        }

        .avatar-head {
          animation: ${state === "speaking" ? "headNod 0.6s ease-in-out" : "none"};
          animation-iteration-count: ${state === "speaking" ? "infinite" : "1"};
          transform-origin: 50px 25px;
        }

        .pulse-ring {
          animation: ${isListening ? "pulseRing 1.5s ease-out infinite" : "none"};
        }

        .glow-effect {
          animation: ${state !== "idle" ? "glow 2s ease-in-out infinite" : "none"};
        }
      `}</style>

      <svg
        width="280"
        height="280"
        viewBox="0 0 280 280"
        className="avatar-container"
        style={{ filter: state !== "idle" ? "drop-shadow(0 0 30px rgba(212, 162, 76, 0.4))" : "none" }}
      >
        {/* Background glow */}
        <circle
          cx="140"
          cy="140"
          r="130"
          fill="rgba(212, 162, 76, 0.05)"
          className="glow-effect"
        />

        {/* Pulse rings for listening */}
        <circle cx="140" cy="140" r="45" fill="none" stroke="rgba(212, 162, 76, 0.2)" strokeWidth="2" className="pulse-ring" />

        {/* Avatar body - holographic style */}
        <g className="avatar-body">
          {/* Core orb */}
          <circle cx="140" cy="140" r="35" fill="url(#coreGradient)" />

          {/* Body outline */}
          <path
            d="M 110 140 Q 110 165 125 180 L 155 180 Q 170 165 170 140"
            fill="none"
            stroke="rgba(212, 162, 76, 0.6)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Head */}
          <g className="avatar-head">
            <circle cx="140" cy="100" r="25" fill="url(#headGradient)" />

            {/* Eyes */}
            <g>
              <circle cx="130" cy="95" r="4" fill="#050608" />
              <circle cx="150" cy="95" r="4" fill="#050608" />
              {/* Eye glint */}
              <circle cx="131" cy="94" r="1.5" fill="rgba(255, 255, 255, 0.8)" />
              <circle cx="151" cy="94" r="1.5" fill="rgba(255, 255, 255, 0.8)" />
            </g>

            {/* Mouth */}
            <g>
              {mouthOpen && state === "speaking" ? (
                // Open mouth (speaking)
                <>
                  <ellipse cx="140" cy="110" rx="6" ry="4" fill="#A97CFF" opacity="0.7" />
                  <path d="M 134 110 Q 140 112 146 110" stroke="#A97CFF" strokeWidth="1.5" fill="none" />
                </>
              ) : (
                // Closed mouth (idle/working)
                <path d="M 134 110 Q 140 111 146 110" stroke="rgba(212, 162, 76, 0.6)" strokeWidth="1.5" fill="none" />
              )}
            </g>
          </g>

          {/* Left arm */}
          <g className="avatar-arm-left">
            <line x1="115" y1="130" x2="90" y2="120" stroke="rgba(212, 162, 76, 0.7)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="88" cy="118" r="4" fill="rgba(212, 162, 76, 0.8)" />
          </g>

          {/* Right arm */}
          <g className="avatar-arm-right">
            <line x1="165" y1="130" x2="190" y2="120" stroke="rgba(212, 162, 76, 0.7)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="192" cy="118" r="4" fill="rgba(212, 162, 76, 0.8)" />
          </g>

          {/* Status indicator */}
          <circle
            cx="165"
            cy="110"
            r="6"
            fill={state === "working" ? "#FF6B6B" : state === "speaking" ? "#A97CFF" : "#4ECDC4"}
            opacity="0.8"
          />
        </g>

        {/* Gradients */}
        <defs>
          <radialGradient id="coreGradient">
            <stop offset="0%" stopColor="rgba(212, 162, 76, 0.8)" />
            <stop offset="100%" stopColor="rgba(169, 124, 255, 0.4)" />
          </radialGradient>

          <radialGradient id="headGradient">
            <stop offset="0%" stopColor="rgba(212, 162, 76, 0.9)" />
            <stop offset="100%" stopColor="rgba(169, 124, 255, 0.5)" />
          </radialGradient>
        </defs>
      </svg>

      {/* State label */}
      <div className="absolute bottom-6 text-center">
        <p className="text-xs font-bold text-[#A97CFF] uppercase tracking-wide">
          {state === "working" ? "Gerando anúncio..." : state === "speaking" ? "Aguardando..." : "Pronto"}
        </p>
      </div>
    </div>
  );
}
