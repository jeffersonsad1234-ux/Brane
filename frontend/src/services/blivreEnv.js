const env = {
  // B Livre API
  get API_URL() {
    return process.env.REACT_APP_BLIVRE_API_URL || process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app";
  },
  get API_BASE() {
    return `${this.API_URL}/api`;
  },

  // B Livre identity
  get NAME() { return process.env.REACT_APP_BLIVRE_NAME || "B Livre"; },
  get TAGLINE() { return process.env.REACT_APP_BLIVRE_TAGLINE || "Compre, venda e desapegue"; },
  get DESCRIPTION() { return process.env.REACT_APP_BLIVRE_DESCRIPTION || "B Livre — plataforma de classificados gratuitos. Anuncie produtos, converse com vendedores e encontre ofertas perto de você."; },

  // Domain — change REACT_APP_BLIVRE_DOMAIN when moving to its own domain
  get DOMAIN() { return process.env.REACT_APP_BLIVRE_DOMAIN || window.location.hostname; },
  get BASE_PATH() { return process.env.REACT_APP_BLIVRE_BASE_PATH || "/blivre"; },

  // Theme
  get THEME_COLOR() { return process.env.REACT_APP_BLIVRE_THEME_COLOR || "#0A0A0C"; },
  get ACCENT_COLOR() { return process.env.REACT_APP_BLIVRE_ACCENT_COLOR || "#D4A24C"; },

  // Assets
  get FAVICON() { return process.env.REACT_APP_BLIVRE_FAVICON || "/blivre-assets/favicon.svg"; },
  get LOGO() { return process.env.REACT_APP_BLIVRE_LOGO || "/blivre-assets/logo.svg"; },
  get MANIFEST() { return process.env.REACT_APP_BLIVRE_MANIFEST || "/blivre-manifest.json"; },

  // PWA
  get DISPLAY() { return process.env.REACT_APP_BLIVRE_DISPLAY || "standalone"; },
  get BACKGROUND_COLOR() { return process.env.REACT_APP_BLIVRE_BACKGROUND_COLOR || "#050608"; },
};

export default env;
