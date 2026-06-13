import fs from 'fs';
import path from 'path';

/**
 * Sirve las imágenes de mapa DIRECTAMENTE desde la única fuente del proyecto:
 * `game-src/src/assets/map/` (la misma que compila el juego). Así el editor y
 * el juego comparten exactamente el mismo PNG por mapa — no hay copia en
 * `public/editor/maps/` que pueda desincronizarse.
 *
 * Seguridad: solo se permiten nombres de fichero PNG simples (sin rutas ni
 * `..`) para evitar path traversal.
 */

const MAP_ASSETS_DIR = path.join(process.cwd(), 'game-src', 'src', 'assets', 'map');
const SAFE_NAME = /^[A-Za-z0-9_-]+\.png$/;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ file: string }> },
) {
  const { file } = await ctx.params;
  if (!file || !SAFE_NAME.test(file)) {
    return new Response('Nombre de imagen inválido', { status: 400 });
  }
  const filePath = path.join(MAP_ASSETS_DIR, file);
  // Defensa extra: el resultado normalizado debe seguir dentro del directorio.
  if (!filePath.startsWith(MAP_ASSETS_DIR + path.sep)) {
    return new Response('Ruta no permitida', { status: 400 });
  }
  try {
    const buf = fs.readFileSync(filePath);
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300, must-revalidate',
      },
    });
  } catch {
    return new Response('Imagen no encontrada', { status: 404 });
  }
}
