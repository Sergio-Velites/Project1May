# WeddingBoy — Backlog de bugs e intentos de solución

Resumen de todo lo que se trabajó en la sesión anterior (hasta commit `4dd84c0`),
organizado por área. Punto de partida limpio: commit `d47f1a9`.

---

## 🎮 Combate (PokemonEncounter)

- **React error #310** — `useEffect` llamado después de un `return null` condicional → el número de hooks variaba entre renders.  
  _Solución anterior_: mover el `useEffect` antes del early return, añadir guard interno.

- **Switch voluntario de pokémon bloqueado en batalla** — el menú PKMN dejaba cambiar libremente (sin consumir turno).  
  _Solución anterior_: bloquear primero; luego restaurar correctamente consumiendo turno vía `throwPokeballThenEnemyTurn`, bloqueando el pokémon activo y los KO.

- **Stale closure en ataque enemigo tras switch** — `triggerEnemyAttackOnly` atacaba al pokémon viejo (el anterior al cambio) porque capturaba `active` por closure en el momento del schedule.  
  _Solución anterior_: `activeRef = useRef(active)` sincronizado con `useEffect` en cada render.

- **XP al huir** — `endEncounter_(true)` repartía XP aunque el jugador escapara.  
  _Solución anterior_: stage 12 (huida) llama directamente a `dispatch(endEncounter())` sin XP.

- **Crash al entrar en combate** — `processingPokemon.moves` era `undefined` porque `involvedPokemon` estaba vacío al inicio.

---

## ✍️ Textos y diálogos

- **Typewriter no bloqueaba avance** — el jugador podía saltar el texto antes de que acabara de escribirse.  
  _Pendiente de revisar_: verificar que `liveIndex < currentLine.length` bloquea correctamente el avance en `Text.tsx` y `TextThenAction.tsx`.

- **Tecla B no avanzaba texto** — solo A funcionaba. Se añadió `useEvent(Event.B, advance)`.

- **Cooldown post-cierre de texto (400 ms)** — sin espera mínima, el siguiente cuadro de texto se abría de golpe.

- **Texto cortado horizontalmente** — `overflow: hidden` en `StyledText` + unidades `px`/`vh` no proporcionales al contenedor.

---

## 📐 Layout y proporcionalidad (UI scaling)

- **Textos y marcos no escalaban con el GameBoy** — todo el CSS global usaba `px`, `vh`, `rem` y `@media` de viewport. Cuando la ventana cambiaba de tamaño, mapas/personajes escalaban (usan `cqw`) pero textos y marcos no.  
  _Objetivo_: migrar `.framed`, `button`, `.active-button::before`, `.stats` y sus pseudo-elementos a `cqw`.

- **`Text.tsx` con CSS propio incompatible** — tenía su propio `h1`, flechas con px fijos y media queries. Debería usar el componente `Frame` (que ya es correcto en `cqw`), igual que `TextThenAction.tsx`.

- **GameBoy no forzaba portrait 9:16** — en diferentes móviles el game se veía distinto verticalmente.

- **Overlays y modales no centrados** — componentes dentro de `BackgroundContainer` se desplazaban con el scroll del mapa (el `transform: translate` del contenedor arrastra todos sus hijos).

- **PokemonList superponía el Frame de texto** — el `Container` absoluto (bottom:0, height:20%) pisaba otros elementos. Se rediseñó con flexbox (`ListArea` + `InfoArea`).

---

## 🗺️ NPCs y mapas

- **Scientist NPC en centros Pokémon mal posicionado** — estaba en `y:2` pero la puerta/mostrador es `y:1`. Afecta a los 3 centros: Viridian, Pewter y Route-3.

- **NPCs en Viridian City dentro de zona arbolada** — posición incorrecta que los dejaba sobre tiles de hierba/árboles.

---

## 💾 Sistema de guardado / online

- **Bucle infinito en pantalla passkey** — cuando `webauthn-register-finish` fallaba, el estado volvía a `require-passkey` indefinidamente.  
  _Solución anterior_: tras primer fallo, `registrationFailed=true` → segunda opción cambia a "Jugar sin guardar".

- **Batallas online: columna incorrecta en `list-players`** — la Edge Function usaba `user_id` en lugar del campo correcto, devolviendo vacío.

- **Service worker bloqueaba actualizaciones** — los usuarios con caché no veían el nuevo bundle. Se desactivó el SW en `registerServiceWorker`.

- **WebAuthn-auth-finish: campo incorrecto** — la respuesta de Supabase se leía con un campo que no existía.

- **Auto-save en curación** — la partida no se guardaba automáticamente al curar en el centro Pokémon.

---

## 🎨 Visual / misc

- **Fuentes no uniformes** — distintos componentes usaban `rem`, `px` o `vh`. Objetivo: todo en `cqw`.

- **Flecha hueca en selección de swap** — al elegir pokémon para intercambiar (start menu), la flecha debía ser hueca (hollow) para diferenciarse de la selección normal.

- **Área táctil de controles GameBoy** — botones con delay táctil en móvil (falta `touch-action: manipulation` o similar).

- **PokéDex: color de fila activa incorrecto** — el texto no era visible sobre el fondo oscuro (`#181010`). Se necesita `color: #f9f2fa` en la fila activa y propagar con `& * { color: inherit }`.

- **Moves en PokéDex/PokemonSummary cortados** — nombres de movimientos largos sin `white-space: nowrap` se partían.

---

## 📋 Estado al volver a este punto (`d47f1a9`)

Los items marcados arriba son los que se intentaron solventar. Algunos pueden estar parcialmente aplicados en este commit (como los fixes de Pokédex, PokemonList y moves nowrap que son parte de este propio commit). Los que quedan por hacer se abordarán uno a uno desde aquí.
