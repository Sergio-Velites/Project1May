import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fuerza a incluir public/editor/ en el bundle Lambda de la API route.
  // Sin esto, fs.readFileSync no encuentra el archivo en Vercel serverless.
  outputFileTracingIncludes: {
    "/api/admin/map-data": ["./public/editor/**/*"],
    // El editor sirve las imágenes de mapa desde la fuente única del juego.
    "/api/admin/map-image/[file]": ["./game-src/src/assets/map/**/*"],
  },
};

export default nextConfig;
