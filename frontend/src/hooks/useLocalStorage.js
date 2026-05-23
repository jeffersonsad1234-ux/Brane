import { useState, useCallback } from "react";

export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const set = useCallback(
    (newValue) => {
      setValue((prev) => {
        const next = typeof newValue === "function" ? newValue(prev) : newValue;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [key]
  );

  return [value, set];
}

export function useArray(key, defaultValue) {
  const [items, setItems] = useLocalStorage(key, defaultValue);
  const add = useCallback(
    (item) => setItems((prev) => [...prev, item]),
    [setItems]
  );
  const remove = useCallback(
    (id) => setItems((prev) => prev.filter((_, i) => i !== id)),
    [setItems]
  );
  const update = useCallback(
    (id, patch) =>
      setItems((prev) =>
        prev.map((item, i) => (i === id ? { ...item, ...patch } : item))
      ),
    [setItems]
  );
  const clear = useCallback(() => setItems([]), [setItems]);
  return { items, set: setItems, add, remove, update, clear };
}
