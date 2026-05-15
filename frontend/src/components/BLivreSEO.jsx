import { useEffect } from "react";
import { applyBLivreSEO } from "../services/blivreSEO";

export default function BLivreSEO({ page, title, description }) {
  useEffect(() => {
    applyBLivreSEO(page, { title, description });
  }, [page, title, description]);
  return null;
}
