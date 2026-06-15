# Mapas Game Boy (Pokémon Rojo/Azul) — material fuente

Carpeta de **staging** (NO es la carpeta de assets del juego). Aquí viven los
rips originales descargados de The Spriters Resource para rehacer el arte de los
mapas en estilo Game Boy clásico (Rojo/Azul), sustituyendo a los actuales
FRLG/Advance. Nada de esta carpeta afecta al juego hasta que se procese y se
copie a `game-src/src/assets/map/`.

## Procedencia
- Fuente: The Spriters Resource, sección `game_boy_gbc/pokemonredblue`.
- Descarga directa de imagen: `https://www.spriters-resource.com/media/assets/<SHARD>/<ASSET_ID>.png`
  (User-Agent de navegador; WebFetch da 403). 53 sheets + tilesets.

## ⚠️ Hallazgo crítico (leer antes de integrar)
Estos sheets **NO son un mapa por archivo**. Son *hojas compuestas y anotadas*:
- Un solo `.png` (p.ej. `pallet-town.png`) contiene VARIOS sub-mapas
  (Pallet Town + Casa del jugador 1F/2F + Casa del rival + Lab. de Oak) MÁS
  rótulos de texto y una leyenda de paleta "GB/SGB".
- Por eso las dimensiones son impares (776×359, etc.) y NO múltiplos de 16.

El motor necesita **un PNG por mapa, alineado a rejilla de 16px**, de tamaño
exacto `width*16 × height*16`. Por tanto cada sub-mapa hay que:
1. Recortarlo del sheet (sin rótulos ni leyenda).
2. Alinearlo a múltiplo de 16px.
3. Darle su `.ts` (dimensiones, walls, teleports, NPCs, encounters) y registrarlo.
4. Regenerar `public/editor/map-data.json` (`node scripts/setup-editor.mjs`).

## `_tilesets/`
- `tileset-redblue.png` — tileset GB Rojo/Azul (para construir casas/gimnasios
  que no vienen rippeados como mapa).
- `characters-overworld.png` / `characters-battle.png` — sprites.

## NOTA PENDIENTE — migración de puntos de guardado (NO hacer aún)
Al cambiar los mapas, las coordenadas (`start`, posiciones, exits) cambiarán.
Las **partidas guardadas** almacenan `map` (MapId) + `pos {x,y}` + `lastHealLocation`.
Si un mapa cambia de geometría, un save antiguo puede aparecer dentro de un muro
o fuera de rango. Cuando se integre el rediseño habrá que añadir, en
`loadFromState` (game-src/src/state/gameSlice.ts), un paso de **saneo/migración**:
si `pos` cae en muro/fuera de límites del mapa nuevo, reubicar al `start` del
mapa (o al `recoverLocation`). Pendiente; no tocar mientras trabajamos en rama
aparte sobre el map-editor.
