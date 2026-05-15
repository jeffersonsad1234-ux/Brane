import env from "./blivreEnv";

const SEO = {
  default: {
    title: env.NAME,
    titleTemplate: `%s — ${env.NAME}`,
    description: env.DESCRIPTION,
  },
  pages: {
    home: {
      title: env.NAME,
      titleTemplate: `${env.NAME} — ${env.TAGLINE}`,
      description: env.DESCRIPTION,
    },
    login: {
      title: "Entrar",
      description: "Faça login na sua conta B Livre para gerenciar seus anúncios.",
    },
    register: {
      title: "Criar conta",
      description: "Crie sua conta gratuita na B Livre e comece a anunciar.",
    },
    messages: {
      title: "Mensagens",
      description: "Suas conversas na B Livre.",
    },
    postDetail: {
      title: "Anúncio",
      description: "Veja detalhes do anúncio na B Livre.",
    },
  },
};

export function applyBLivreSEO(page = "default", overrides = {}) {
  const config = SEO.pages[page] || SEO.default;
  const title = overrides.title || config.title || SEO.default.title;
  const fullTitle = config.titleTemplate
    ? config.titleTemplate.replace("%s", title)
    : title;
  const description = overrides.description || config.description || SEO.default.description;

  document.title = fullTitle;

  setMeta("description", description);
  setMeta("og:title", fullTitle);
  setMeta("og:description", description);
  setMeta("og:type", "website");
  setMeta("og:site_name", env.NAME);
  setMeta("theme-color", env.THEME_COLOR);

  setLink("icon", env.FAVICON);
  setLink("manifest", env.MANIFEST);
  setLink("apple-touch-icon", env.FAVICON);
}

function setMeta(name, content) {
  let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    if (name.startsWith("og:")) el.setAttribute("property", name);
    else el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export default SEO;
