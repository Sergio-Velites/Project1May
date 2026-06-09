# Vuelo futuro desde Map Editor

El juego no consume estos campos todavía. El Map Editor los guarda como metadatos editor-only en `public/editor/map-data.json` y en los `overrides` de Supabase:

- `flyable: boolean`: el mapa puede aparecer como destino de Vuelo.
- `flySpot: { x, y } | null`: tile donde aterriza el jugador al volar.
- `minimapPos: { x, y } | null`: posicion del mapa en `kanto_region.png` para UI de seleccion.

Implementacion recomendada en el juego:

1. Extender `MapType` con `flyable?: boolean` y `flySpot?: PosType`.
2. Crear un catalogo de destinos a partir de `mapData`, filtrando `map.flyable === true`.
3. Mostrar solo destinos cuyo `MapId` este en `state.visitedMaps`.
4. Al confirmar destino, usar `setMapWithPos({ map, pos: map.flySpot ?? map.start })`.
5. Si el mapa no tiene `flySpot`, usar `start` como fallback y registrar el warning en desarrollo.

Regla funcional: que un mapa sea `flyable` no lo desbloquea por si mismo. El desbloqueo real siempre debe depender de `visitedMaps`, igual que en Gen I.
