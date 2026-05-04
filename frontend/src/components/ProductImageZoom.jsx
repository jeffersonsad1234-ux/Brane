import { useEffect, useRef, useState } from "react";

export default function ProductImageZoom({
  src,
  alt,
  className = "",
  wrapperClassName = "",
  imageRef = null,
  mode = "card",
  zoomSize = 220,
  zoomPanelSize = 180,
  lensSize = 180,
  style = {}
}) {
  const [canZoom, setCanZoom] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [focus, setFocus] = useState({ x: 50, y: 50 });
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanZoom(mediaQuery.matches);

    update();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }

    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  const pointerRef = imageRef || wrapperRef;
  const detailMode = mode === "detailPro";
  const effectiveZoom = detailMode ? 300 : zoomSize;

  const handlePointerMove = (event) => {
    if (!canZoom) return;

    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));

    setFocus({ x: x * 100, y: y * 100 });
  };

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`} style={style}>
      <img
        ref={pointerRef}
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${className}`}
        loading="lazy"
        decoding="async"
        onMouseEnter={() => {
          if (detailMode) {
            setIsActive(true);
          } else {
            setShowZoom(true);
          }
        }}
        onMouseMove={(event) => {
          if (detailMode) {
            setIsActive(true);
          }
          handlePointerMove(event);
        }}
        onMouseLeave={() => {
          if (detailMode) {
            setIsActive(false);
          } else {
            setShowZoom(false);
          }
        }}
      />

      {canZoom && !detailMode && showZoom && (
        <div
          className="pointer-events-none absolute top-2 right-2 hidden lg:block rounded-3xl border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.28)] bg-no-repeat bg-cover"
          style={{
            width: zoomPanelSize,
            height: zoomPanelSize,
            backgroundImage: `url(${src})`,
            backgroundSize: `${zoomSize}%`,
            backgroundPosition: `${focus.x}% ${focus.y}%`
          }}
        />
      )}

      {detailMode && canZoom && (
        <>
          <div
            className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-0"}`}
            style={{ zIndex: 10 }}
          >
            <div
              className="pointer-events-none absolute rounded-full border border-[#B88CFF]/35 bg-white/10 backdrop-blur-xl shadow-[0_0_40px_rgba(92,33,204,0.24)]"
              style={{
                width: lensSize,
                height: lensSize,
                left: `calc(${focus.x}% - ${lensSize / 2}px)`,
                top: `calc(${focus.y}% - ${lensSize / 2}px)`,
                transition: "left 120ms ease, top 120ms ease, opacity 180ms ease",
                zIndex: 11
              }}
            />
          </div>

          <div
            className={`pointer-events-none absolute top-3 right-3 block rounded-[28px] border border-white/10 bg-[#050608]/90 p-2 shadow-[0_30px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-0"}`}
            style={{
              width: zoomPanelSize,
              height: zoomPanelSize,
              zIndex: 20
            }}
          >
            <div
              className="w-full h-full rounded-[24px] border border-white/10 overflow-hidden"
              style={{
                backgroundImage: `url(${src})`,
                backgroundSize: `${effectiveZoom}%`,
                backgroundPosition: `${focus.x}% ${focus.y}%`,
                backgroundRepeat: "no-repeat"
              }}
            />
          </div>

          <div
            className={`pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-[#0F0C16]/85 px-3 py-2 text-xs text-white/90 shadow-[0_14px_32px_rgba(0,0,0,0.22)] backdrop-blur transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-0"}`}
            style={{ zIndex: 20 }}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-[#A97CFF] shadow-[0_0_16px_rgba(169,124,255,0.45)]" />
            <span>Zoom BRANE Pro</span>
          </div>
        </>
      )}
    </div>
  );
}
