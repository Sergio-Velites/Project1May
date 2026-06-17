# Migración de jugadores tras el rediseño de mapas (DOCUMENTADO — NO EJECUTAR AÚN)

Al adoptar las dimensiones GB (pokered), muchos mapas cambiaron de tamaño y
geometría. Las **partidas guardadas** almacenan `map` (MapId) + `pos {x,y}` +
`lastHealLocation`. Un save antiguo puede quedar con el jugador **dentro de un
muro o fuera de los límites** del mapa nuevo.

## Qué habrá que hacer (al FINAL de toda la generación de mapas)

1. **Reubicar al jugador a un punto seguro del juego original.** En
   `game-src/src/state/gameSlice.ts` → `loadFromState`, tras cargar el estado:
   - Si `pos` cae en muro o fuera de rango del mapa nuevo (comprobar contra
     `walls`/`width`/`height` del mapa de destino), o por simplicidad SIEMPRE
     tras esta migración mayor: fijar `map` y `pos` al **punto de inicio
     canónico** (p. ej. Pueblo Paleta / casa del jugador, o el último centro
     Pokémon visitado si existe `lastHealLocation` válido).
   - Sanear también `lastHealLocation` (si su mapa/pos ya no es válido → limpiar).
   - Marcar el save con una bandera de versión de mapa (p. ej.
     `mapSchemaVersion`) para no re-migrar en cada carga.

2. **Mensaje del administrador al cargar una partida migrada.** Mostrar (vía
   `showText`/`showTextThenAction`) un aviso del estilo:
   > "¡KANTO ha sido reconstruido! Tu aventura te ha devuelto a [PUNTO]. ¡Sigue
   > explorando la región renovada!"
   Disparar solo una vez (cuando `mapSchemaVersion` del save < versión actual),
   y luego sellar la bandera para que no se repita.

3. **Comunicación a invitados ya jugando**: como el evento es una boda y hay
   partidas en curso, el mensaje del admin debe dejar claro que Kanto se ha
   completado/renovado para que continúen sus aventuras sin frustración.

## Por qué se documenta y no se ejecuta ahora
- Es la parte de mayor riesgo (puede afectar a partidas reales de invitados) y
  el usuario quiere abordarla **junto al usuario**, con cuidado, una vez toda la
  generación de mapas esté terminada y verificada.
- Requiere decidir el punto de reubicación exacto y el texto final del mensaje.
