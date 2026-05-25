import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import ToolCard3D from "./ToolCard3D";

export default function ToolsGrid3D({ apps, onAppOpen, favorites, onToggleFavorite, search }) {
  if (!apps || apps.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-24"
      >
        <div className="text-center">
          <div className="text-3xl mb-3 opacity-20">🔍</div>
          <div className="text-sm" style={{ color: "rgba(255,255,255,0.15)" }}>
            {search ? (
              <>No results for "<span style={{ color: "rgba(255,255,255,0.3)" }}>{search}</span>"</>
            ) : (
              "Nenhuma ferramenta encontrada"
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 pb-6">
      <AnimatePresence mode="popLayout">
        {apps.map((app, i) => (
          <ToolCard3D
            key={app.id}
            app={app}
            index={i}
            onClick={() => onAppOpen(app.id)}
            isFavorite={favorites?.includes(app.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
