import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fuerza a incluir public/editor/ en el bundle Lambda de la API route.
  // Sin esto, fs.readFileSync no encuentra el archivo en Vercel serverless.
  outputFileTracingIncludes: {
    "/api/admin/map-data": ["./public/editor/**/*"],
  },
};

export default nextConfig;
