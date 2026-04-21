import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ThemeContext = createContext(null);

const DEFAULTS = {
  primary_color: "#B38B36",
  price_color: "#0F1111",
  price_cents_color: "#0F1111",
  button_color: "#F0C14B",
  button_text_color: "#0F1111",
  buy_now_color: "#FF8C00",
  star_color: "#FFA41C",
  free_shipping_color: "#067D62",
  navbar_bg: "#0A0A0A",
  navbar_text: "#FFFFFF",
  card_bg: "#FFFFFF",
  card_border: "#E0E0E0",
  page_bg: "#EAEDED",
  category_text_color: "#B38B36",
  category_bg_color: "#1A1A1A",
  menu_text_color: "#CCCCCC",
  nav_link_color: "#888888",
  nav_link_hover_color: "#B38B36",
  title_color: "#B38B36",
  product_card_size: "medium",
  platform_name: "BRANE",
  platform_slogan: "Marketplace Premium",
  show_stars: true,
  show_free_shipping: true,
  show_installments: true,
  installment_count: 12
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(DEFAULTS);

  useEffect(() => {
    axios.get(`${API}/theme`)
      .then(r => setTheme(prev => ({ ...prev, ...r.data })))
      .catch(() => {});
  }, []);

  // Apply CSS variables whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primary_color);
    root.style.setProperty('--price-color', theme.price_color);
    root.style.setProperty('--button-color', theme.button_color);
    root.style.setProperty('--button-text-color', theme.button_text_color);
    root.style.setProperty('--buy-now-color', theme.buy_now_color);
    root.style.setProperty('--star-color', theme.star_color);
    root.style.setProperty('--free-shipping-color', theme.free_shipping_color);
    root.style.setProperty('--navbar-bg', theme.navbar_bg);
    root.style.setProperty('--navbar-text', theme.navbar_text);
    root.style.setProperty('--card-bg', theme.card_bg);
    root.style.setProperty('--card-border', theme.card_border);
    root.style.setProperty('--page-bg', theme.page_bg);
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
