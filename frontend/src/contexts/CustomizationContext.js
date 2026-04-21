import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const CustomizationContext = createContext(null);

const DEFAULTS = {
  social_primary: "#7C3AED",
  social_accent: "#A855F7",
  social_bg: "#0A0A0F",
  social_surface: "#14141F",
  social_text: "#F5F5FA",
  social_muted: "#9CA3AF",
  social_button: "#7C3AED",
  social_button_text: "#FFFFFF",
  username_color: "#A855F7",
  title_color: "#F5F5FA",
  menu_color: "#C4B5FD",
  theme_mode: "dark",
  contrast_level: "normal",
  card_size: "medium",
  card_size_custom: 240,
  products_per_row: 4,
  profile_layout: "modern",
  profile_accent: "#A855F7",
  social_ad_every: 5,
  social_ads_enabled: true,
};

export function CustomizationProvider({ children }) {
  const [custom, setCustom] = useState(DEFAULTS);

  const refresh = useCallback(() => {
    axios.get(`${API}/customization`)
      .then(r => setCustom(prev => ({ ...prev, ...r.data })))
      .catch(() => {});
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(custom).forEach(([k, v]) => {
      if (typeof v === 'string' && v.startsWith('#')) {
        root.style.setProperty(`--${k.replace(/_/g, '-')}`, v);
      }
    });
    // Social theme vars
    root.style.setProperty('--social-primary', custom.social_primary);
    root.style.setProperty('--social-accent', custom.social_accent);
    root.style.setProperty('--social-bg', custom.social_bg);
    root.style.setProperty('--social-surface', custom.social_surface);
    root.style.setProperty('--social-text', custom.social_text);
    root.style.setProperty('--social-muted', custom.social_muted);
    root.style.setProperty('--social-button', custom.social_button);
    root.style.setProperty('--social-button-text', custom.social_button_text);
    root.style.setProperty('--username-color', custom.username_color);
    root.style.setProperty('--title-color', custom.title_color);
    root.style.setProperty('--menu-color', custom.menu_color);
    // Profile
    root.style.setProperty('--profile-accent', custom.profile_accent);
    // Marketplace layout
    const cardSizePx = custom.card_size === 'small' ? 180 : custom.card_size === 'large' ? 300 : custom.card_size === 'custom' ? custom.card_size_custom : 240;
    root.style.setProperty('--product-card-size', `${cardSizePx}px`);
    root.style.setProperty('--products-per-row', custom.products_per_row);
  }, [custom]);

  return (
    <CustomizationContext.Provider value={{ custom, setCustom, refresh }}>
      {children}
    </CustomizationContext.Provider>
  );
}

export function useCustomization() {
  const ctx = useContext(CustomizationContext);
  if (!ctx) return { custom: DEFAULTS, setCustom: () => {}, refresh: () => {} };
  return ctx;
}
