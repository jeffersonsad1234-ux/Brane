import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ThemeContext = createContext(null);

const DEFAULTS = {
  // Brand
  platform_name: "BRANE",
  platform_slogan: "Marketplace Premium",

  // Global colors
  primary_color: "#D4A24C",
  title_color: "#D4A24C",
  page_bg: "#050608",

  // Navbar
  navbar_bg: "#050608",
  navbar_text: "#F7F7FA",
  nav_link_color: "#A6A8B3",
  nav_link_hover_color: "#D4A24C",
  menu_text_color: "#F7F7FA",

  // Categories
  category_text_color: "#F7F7FA",
  category_bg_color: "#0B0D12",

  // Product card colors
  card_bg: "#0B0D12",
  card_border: "#1E2230",
  card_hover_border: "#D4A24C",
  product_title_color: "#F7F7FA",

  // Prices
  price_color: "#D4A24C",
  price_cents_color: "#D4A24C",

  // Buttons
  button_color: "#FFF3C4",
  button_text_color: "#0F1111",
  buy_now_color: "#6D28D9",

  // Rating / shipping
  star_color: "#D4A24C",
  free_shipping_color: "#10A875",

  // Card size/shape (the real visual layout controls)
  product_card_size: "medium",       // small | medium | large
  product_card_shape: "rounded",     // rounded | square | circle | minimal
  product_image_ratio: "square",     // square | portrait | landscape | auto
  product_grid_columns: "4",         // 2 | 3 | 4 | 5 | 6

  // Feature toggles
  show_stars: true,
  show_free_shipping: true,
  show_installments: true,
  installment_count: 12,
  show_category_icons: true,
};

// Size mapping — actual values used by CSS vars
const SIZE_MAP = {
  small:  { padding: "10px", radius: "12px", titleSize: "12px", priceSize: "16px", minHeight: "210px" },
  medium: { padding: "14px", radius: "16px", titleSize: "14px", priceSize: "20px", minHeight: "280px" },
  large:  { padding: "18px", radius: "20px", titleSize: "16px", priceSize: "24px", minHeight: "340px" },
};

const SHAPE_MAP = {
  rounded: { imgRadius: "12px", cardRadius: "16px" },
  square:  { imgRadius: "0px",  cardRadius: "4px" },
  circle:  { imgRadius: "50%",  cardRadius: "24px" },
  minimal: { imgRadius: "0px",  cardRadius: "0px" },
};

const RATIO_MAP = {
  square:    "1 / 1",
  portrait:  "3 / 4",
  landscape: "4 / 3",
  auto:      "auto",
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(DEFAULTS);

  useEffect(() => {
    axios.get(`${API}/theme`)
      .then(r => setTheme(prev => ({ ...prev, ...r.data })))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const size = SIZE_MAP[theme.product_card_size] || SIZE_MAP.medium;
    const shape = SHAPE_MAP[theme.product_card_shape] || SHAPE_MAP.rounded;
    const ratio = RATIO_MAP[theme.product_image_ratio] || RATIO_MAP.square;

    const map = {
      // colors
      '--primary-color': theme.primary_color,
      '--title-color': theme.title_color,
      '--page-bg': theme.page_bg,
      '--navbar-bg': theme.navbar_bg,
      '--navbar-text': theme.navbar_text,
      '--nav-link-color': theme.nav_link_color,
      '--nav-link-hover-color': theme.nav_link_hover_color,
      '--menu-text-color': theme.menu_text_color,
      '--category-text-color': theme.category_text_color,
      '--category-bg-color': theme.category_bg_color,
      '--card-bg': theme.card_bg,
      '--card-border': theme.card_border,
      '--card-hover-border': theme.card_hover_border,
      '--product-title-color': theme.product_title_color,
      '--price-color': theme.price_color,
      '--price-cents-color': theme.price_cents_color,
      '--button-color': theme.button_color,
      '--button-text-color': theme.button_text_color,
      '--buy-now-color': theme.buy_now_color,
      '--star-color': theme.star_color,
      '--free-shipping-color': theme.free_shipping_color,
      // sizes & shapes
      '--card-padding': size.padding,
      '--card-radius': shape.cardRadius || size.radius,
      '--card-img-radius': shape.imgRadius,
      '--card-img-ratio': ratio,
      '--card-title-size': size.titleSize,
      '--card-price-size': size.priceSize,
      '--card-min-height': size.minHeight,
    };
    Object.entries(map).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') root.style.setProperty(k, v); });

    // Grid columns as data attribute on body for CSS selection
    document.body.setAttribute('data-grid-cols', theme.product_grid_columns || '4');
    document.body.setAttribute('data-card-shape', theme.product_card_shape || 'rounded');
    document.body.setAttribute('data-card-size', theme.product_card_size || 'medium');
  }, [theme]);

  const refreshTheme = () => {
    axios.get(`${API}/theme`)
      .then(r => setTheme(prev => ({ ...prev, ...r.data })))
      .catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
