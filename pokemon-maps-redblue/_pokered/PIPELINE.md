# Pipeline autoritativo de mapas (pokered) — rama claude/gb-maps-redesign

Fuente de verdad para dimensiones, colisión, warps y conexiones de TODOS los
mapas Game Boy: la desensamblación [pret/pokered](https://github.com/pret/pokered).
Datos vendados aquí (subconjunto) para reproducibilidad sin re-clonar.

## Por qué pokered (no heurística por imagen)
La auto-derivación de colisión desde la imagen funciona en mapas de suelo
uniforme (pueblos, interiores) pero FALLA en rutas/cuevas (no separa
camino/hierba/árbol por color). pokered da la colisión EXACTA del juego original.

## Datos vendados (`_pokered/`)
- `maps/*.blk` — 225 mapas; bytes = ids de bloque (Wb×Hb, row-major).
- `blocksets/*.bst` — 19 blocksets; cada bloque = 16 bytes = 4×4 tile-ids de 8px.
- `headers/*.asm` — `map_header Camel, CONST, TILESET, dirs` + `connection dir, Map, CONST, offset`.
- `objects/*.asm` — `warp_event x,y,DEST,id` · `bg_event` (signs) · `object_event` (NPCs del original; el proyecto usa los suyos).
- `data/collision_tile_ids.asm` — `<Tileset>_Coll` = tile-ids 8px TRANSITABLES (labels compartidos).
- `data/tileset_headers.asm` + `data/tilesets.asm` — orden de tilesets y `<Tileset>_Block` → `.bst`.
- `constants/map_constants.asm` — `map_const CONST, Wb, Hb` (bloques de 32px).
- `constants/tileset_constants.asm` — orden de consts de tileset (índice).

## Regla de colisión Gen 1 (VALIDADA contra Pallet)
1. dims tiles 16px = (Wb×2, Hb×2). 1 bloque (32px) = 2×2 tiles de 16px = 4×4 tiles de 8px.
2. Construir tilemap de 8px desde blk+blockset.
3. Un tile 16px (x,y) es **transitable si su sub-tile 8px INFERIOR-IZQUIERDO**
   `tmap[2y+1][2x]` está en la lista `<Tileset>_Coll`. Si no → `walls`.
   (Validado: las puertas quedan transitables, edificios sólidos. Pallet = 139 walls.)

## Coordenadas
warps y objects de pokered ya están en tiles de 16px y COINCIDEN con el sistema
del proyecto (Pallet: warps 5,5 / 13,5 / 12,11 idénticos a los .ts actuales).

## Uso
`pokered_parse.py` → `map_info('PalletTown')` devuelve
`{tiles, tileset, walls:set, warps:[(x,y,DEST,id)], signs, npcs, connections:[(dir,Camel,CONST,offset)]}`.

## Pendiente (siguiente fase)
- Tabla de correspondencia: nombre pokered (Camel/CONST) ↔ id del proyecto ↔ recorte del sheet GB.
- Generación: por cada mapa, fijar dims + walls (pokered), traducir warps/conexiones a
  los MapId del proyecto en el campo `maps`/`teleports`, recortar imagen GB, y
  CONSERVAR narrativa (text, trainers, quests). Verificar con BFS (reskin_tool.verify).
- Migración de saves en `loadFromState` (pos en muro/fuera de rango → start).
