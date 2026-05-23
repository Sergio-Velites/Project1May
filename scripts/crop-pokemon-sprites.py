#!/usr/bin/env python3
"""
Recorta/encuadra todas las imágenes de game-src/src/assets/pokemon/front/
a exactamente 56x56 píxeles, centrando el contenido sin escalar.
- Si la imagen es mayor de 56x56: recorta desde el centro.
- Si la imagen es menor de 56x56: la centra sobre un canvas 56x56 transparente.
"""

from PIL import Image
import os
import sys

TARGET_W, TARGET_H = 56, 56

folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 
                      "..", "game-src", "src", "assets", "pokemon", "front")

files = [f for f in os.listdir(folder) if f.lower().endswith(".png")]
print(f"Procesando {len(files)} imágenes en {folder}")

ok = 0
skipped = 0
for filename in sorted(files, key=lambda x: int(x.split(".")[0]) if x.split(".")[0].isdigit() else 9999):
    path = os.path.join(folder, filename)
    try:
        img = Image.open(path).convert("RGBA")
        w, h = img.size

        if w == TARGET_W and h == TARGET_H:
            skipped += 1
            continue

        # Crear canvas destino transparente
        canvas = Image.new("RGBA", (TARGET_W, TARGET_H), (0, 0, 0, 0))

        # Calcular offset para centrar
        paste_x = (TARGET_W - w) // 2
        paste_y = (TARGET_H - h) // 2

        # Si la imagen es más grande, recortamos antes de pegar
        src_x = max(0, -paste_x)
        src_y = max(0, -paste_y)
        src_w = min(w, TARGET_W + src_x) - src_x
        src_h = min(h, TARGET_H + src_y) - src_y

        crop = img.crop((src_x, src_y, src_x + src_w, src_y + src_h))

        dest_x = max(0, paste_x)
        dest_y = max(0, paste_y)

        canvas.paste(crop, (dest_x, dest_y), crop)
        canvas.save(path, "PNG")
        ok += 1
    except Exception as e:
        print(f"  ERROR {filename}: {e}")

print(f"Listo: {ok} modificadas, {skipped} ya eran 56x56.")
