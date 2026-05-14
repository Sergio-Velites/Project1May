/**
 * Carga overrides de descripciones de Pokédex desde el endpoint público.
 *
 * - El JSON base (pokedex-flavor-es.json) está bundleado en el juego.
 * - El admin puede sobreescribir entradas vía /admin/pokedex-editor.
 * - Aquí intentamos fetch de /api/pokedex-flavor para obtener los overrides
 *   y los guardamos en una caché en memoria. Si falla (sin red, dev sin
 *   Next, etc.) usamos solo el JSON base.
 *
 * `getFlavor(id)` devuelve siempre el texto preferido (override > base > "").
 */

import baseFlavor from "./pokedex-flavor-es.json";

let overrides: Record<string, string> = {};
let loaded = false;
let loadPromise: Promise<void> | null = null;

const BASE = baseFlavor as Record<string, string>;

export const loadFlavorOverrides = (): Promise<void> => {
  if (loaded || loadPromise) return loadPromise ?? Promise.resolve();
  loadPromise = (async () => {
    try {
      const res = await fetch("/api/pokedex-flavor", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.overrides === "object") {
          overrides = data.overrides as Record<string, string>;
        }
      }
    } catch {
      // sin red: usamos solo base
    } finally {
      loaded = true;
    }
  })();
  return loadPromise;
};

export const getFlavor = (id: number): string => {
  const key = String(id);
  if (key in overrides) return overrides[key];
  return BASE[key] ?? "";
};
