# Auditoría de movimientos vs Gen II canonical (Crystal / Bulbapedia)

> **Alcance**: los **83 movimientos distintos** que algún enemigo del juego usa de hecho en la narrativa actual (calculado a partir de las learnsets y los niveles reales de los 168 unidades enemigas en mapas).
> **Fuente de verdad**: Bulbapedia (Gen II) + PokéAPI `past_values` cuando coincide.
> **Estado**: lectura completa de `move-helper.ts` (1042 líneas) y `move-metadata.ts` (entradas relevantes).

## Resumen ejecutivo

| Severidad | Nº casos | Acción |
|---|---|---|
| 🔴 **Crítico** (NaN/cuelgue) | 1 | Aplicar ya |
| 🟠 **Alto** (valor numérico Gen II ≠ local, impacto en daño/tipo) | 9 | Aplicar ya |
| 🟡 **Medio** (mecánica Gen II ausente, efecto observable) | 5 | Recomendado |
| 🟢 **Bajo** (simplificación aceptable o move no Gen II) | 4 | Decidir |
| ✅ **Sin cambios** (Gen II canonical = local) | resto (~65) | — |

---

## 🔴 CRÍTICO — 1 caso

### 1. `low-kick` — `power: null` produce daño NaN

- **Local** (`move-metadata.ts`): `type: "fighting"`, `power: null`, `accuracy: 100`, `pp: 20`, sin handler especial en `move-helper.ts`.
- **Gen II canonical** (Bulbapedia): potencia fija **50**, accuracy **90**, **30% flinch**. (La fórmula variable por peso del rival se introdujo en Gen III.)
- **Bug**: al caer al cálculo de daño con `effectivePower = undefined`, `Math.floor(... * undefined ...) = NaN`. La HP del jugador puede acabar `NaN`. Cualquier comparación posterior se rompe.
- **Aparición real**: 1× — Sergio (líder Pewter) lvl 14 lo conoce vía learnset. Probabilidad de salir como uno de los 4 movimientos: alta.
- **Fix**: en `move-metadata.ts` cambiar `low-kick` a `power: 50, accuracy: 90, meta.flinchChance: 30, meta.ailmentChance: 0`. Coincide con Gen II y evita el NaN.

---

## 🟠 ALTO — 9 casos (valor incorrecto, impacto directo en mecánica)

Frecuencia = nº de unidades enemigas que pueden usar el move en la narrativa.

### 2. `bite` — tipo `normal` debería ser `dark`

- **Local**: `type: "normal"`, P=60, acc=100, 30% flinch ✅ (numérico OK).
- **Gen II canonical**: **`dark`** (cambió en Gen II). En Pokémon Crystal y Stadium 2 ya aparece como Dark.
- **Impacto**: STAB y type-effectiveness mal. Bite es super-eficaz contra Psychic/Ghost en Gen II; local lo trata como Normal (×1 vs psy/ghost; ×0.5 vs rock/steel). Cambia el daño en muchísimos casos.
- **Aparición real**: **14×** entre starters evolucionados y Pokémon comunes (Charmeleon, Krabby, Goldeen, Spearow, Sandshrew, varios).
- **Fix**: cambiar `type` a `"dark"` en `move-metadata.ts`. **Nota**: el juego tiene la tabla Gen II con Dark (confirmado en `type-effectiveness.ts`), así que el cambio es seguro.

### 3. `dig` — `power: 80` debería ser `60`

- **Local**: P=80, acc=100. (Valor Gen IV+.)
- **Gen II canonical**: **P=60**, acc=100. ⚠️ Corrección: PokéAPI etiquetó erróneamente el valor Gen I (100) como `gold-silver`. El valor real en GSC/Crystal es **60** (Gen I=100, Gen II-III=60, Gen IV+=80). Verificado contra Pokémon Showdown gen2.
- **Aparición real**: 1× — Bellsprout lvl 25 lo aprende; puede salirle a Marta (líder Pewter).
- **Fix**: `power: 60`.

### 4. `lick` — `power: 30` debería ser `20`

- **Local**: ghost, P=30, 30% paralysis.
- **Gen II canonical**: **P=20**, 30% paralysis (Bulbapedia: Lick Gen I-VII = 20 P).
- **Aparición real**: 2×.
- **Fix**: `power: 20`.

### 5. `smog` — `power: 30` debería ser `20`

- **Local**: poison, P=30, acc=70, 40% poison.
- **Gen II canonical**: **P=20**, acc=70, 40% poison (Bulbapedia: Smog Gen I-V = 20).
- **Aparición real**: 3×.
- **Fix**: `power: 20`.

### 6. `thrash` — `power: 120` debería ser `90`

- **Local**: normal, P=120, acc=100.
- **Gen II canonical**: **P=90**, acc=100 (Bulbapedia: Thrash Gen I-III = 90 P).
- **Aparición real**: 2×.
- **Fix**: `power: 90`.

### 7. `leech-life` — `power: 80` debería ser `20`

- **Local**: bug, P=80, drain 50%.
- **Gen II canonical**: **P=20**, drain 50% (Bulbapedia: Gen I-VI = 20 P; subido a 80 en Gen VII).
- **Aparición real**: 4×.
- **Fix**: `power: 20`. (El drain del 50% sigue siendo el mismo.)

### 8. `thunder-wave` — `accuracy: 90` debería ser `100`

- **Local**: acc=90.
- **Gen II canonical**: **acc=100** (Bulbapedia: 100 en Gen I-V; 90 desde Gen VI). El check anti-Ground ya está implementado correctamente en `move-helper.ts`.
- **Aparición real**: 2×.
- **Fix**: `accuracy: 100`.

### 9. `glare` — `accuracy: 100` debería ser `75`

- **Local**: acc=100.
- **Gen II canonical**: **acc=75** (Bulbapedia: 75 en Gen I-IV; 90 en Gen V; 100 desde Gen VI).
- **Aparición real**: 3×.
- **Fix**: `accuracy: 75`.

### 10. `poison-gas` — `accuracy: 90` debería ser `55`

- **Local**: acc=90.
- **Gen II canonical**: **acc=55** (Bulbapedia: 55 en Gen I-IV; 80 en Gen V; 90 desde Gen VI).
- **Aparición real**: 1×.
- **Fix**: `accuracy: 55`.

---

## 🟡 MEDIO — 5 casos (mecánica Gen II)

### 11. `string-shot` — `-2` velocidad debería ser `-1`

- **Local** (`move-helper.ts`): `{stat: "speed", delta: -2}`.
- **Gen II canonical**: **-1 velocidad** (subió a -2 desde Gen VI).
- **Aparición real**: 8× (muchísimos bichos del Bosquecillo).
- **Fix**: en `STATUS_MOVE_EFFECTS` cambiar a `delta: -1`.

### 12. `minimize` — `+2` evasión debería ser `+1`

- **Local**: `{stat: "evasion", delta: +2}`.
- **Gen II canonical**: **+1 evasión** (Gen I-IV = +1; Gen V+ = +2).
- **Aparición real**: 3×.
- **Fix**: cambiar a `delta: +1`.

### 13. `focus-energy` — marcado NO_EFFECT, debería dar `+1` crit ratio

- **Local**: en `NO_EFFECT_MOVES` con comentario "bug Gen I — reduce crits ÷4".
- **Gen II canonical**: **+1 escalón de crit ratio**. El bug Gen I fue arreglado en Gen II. ⚠️ Corrección: Pokémon Showdown gen2 lo implementa como `onModifyCritRatio(critRatio) { return critRatio + 1; }` (es decir **+1**, no +2 como decía el borrador inicial de este informe).
- **Aparición real**: **7×** — Rattata, Spearow, Mankey, Nidoran etc lo aprenden temprano.
- **Fix**: quitar de `NO_EFFECT_MOVES` y añadir manejo: sumar `+1` al crit ratio efectivo (flag `attackerFocusEnergy` en `MoveContext`). Alternativa simple: dispatch visual sin efecto numérico.

### 14. `self-destruct` / `explosion` — falta el "halve target Defense" de Gen II

- **Local**: aplica `selfDestructs` (HP=0) ✅, pero no divide la defensa del rival.
- **Gen II canonical**: aparte de noquearse, **divide a la mitad la defensa del objetivo** antes del cálculo (Bulbapedia: introducido en Gen II como compensación; en Gen V se eliminó).
- **Aparición real**: 3× (Voltorb, Electrode, Geodude, Graveler en bosque o cueva).
- **Fix**: en `move-helper.ts`, si `move === "self-destruct" || move === "explosion"`, dividir `rawDef` por 2 antes del cálculo.

### 15. `scary-face` — move introducido en Gen III, **no existe en Gen II**

- **Local**: presente con `delta: -2` velocidad.
- **Gen II canonical**: **no existe**. (Bulbapedia: Scary Face fue introducido en Gen III.)
- **Aparición real**: 2× (algún Pokémon lo aprende en la learnset Gen II forzada).
- **Decisión de diseño**: o quitar la entrada del move (y rotar a otro move en su lugar via learnset), o dejarlo como excepción "ampliación" del proyecto. **Recomendación**: dejarlo, mencionando que es excepción consciente (el juego ya mezcla narrativa propia con sprites/IDs Pokémon).

---

## 🟢 BAJO — 4 casos (simplificación aceptable / decisión)

### 16. `bind` — `accuracy: 85` debería ser `75`

- **Local**: P=15, acc=85, trap 2-5 turnos ✅.
- **Gen II canonical**: acc=75 (Gen I-IV); subió a 85 en Gen V.
- **Aparición real**: 1× (Snake-y Pokémon — Onix lvl 12 lo conoce).
- **Fix opcional**: `accuracy: 75`.

### 17. `rage` — falta el "rage mode" (atk +1 cada vez que recibe daño)

- **Local**: 20 P normal puro, sin rage-mode.
- **Gen II canonical**: tras usar Rage, mientras siga seleccionado, el usuario sube +1 atk cada vez que recibe daño.
- **Aparición real**: 2×.
- **Decisión**: implementar el modo requiere ~30 líneas + estado en `PokemonEncounter`. Dado el bajo uso, **dejar como simplificación** (sigue siendo daño coherente, solo no escala).

### 18. `roar` / `whirlwind` — Gen II forzaría switch en trainer; local termina combate

- **Local**: ambos → `forceFlee: true` (termina combate).
- **Gen II canonical**: vs salvaje termina combate (igual que local ✅); vs entrenador fuerza al rival a sacar otro Pokémon al azar.
- **Aparición real**: 6× whirlwind + 3× roar (Spearow, Pidgey, Growlithe líder).
- **Decisión**: implementar el switch en trainer requiere lógica nueva en `PokemonEncounter`. **Aceptable** dejar `forceFlee` también en trainer (terminaría la batalla a favor del jugador, lo cual es un regalo, pero coherente narrativamente).

### 19. `teleport` — Gen II huye del combate salvaje; local es NO_EFFECT silencioso

- **Local**: marcado como NO_EFFECT.
- **Gen II canonical**: en combate salvaje hace huir al usuario; sin efecto vs entrenadores.
- **Aparición real**: 2× (Abra y demás).
- **Decisión**: si un Abra enemigo usa teleport, ahora dice "no pasa nada". **Aceptable** (el jugador no tiene que ser informado de la huida del rival). Si se quiere bonito: tratar como `forceFlee` igual que roar/whirlwind en wild.

---

## ✅ Sin cambios (verificados Gen II = local)

Los **~65 movimientos restantes** del top 83 (tackle, scratch, growl, leer, tail-whip, ember, water-gun, quick-attack, pound, peck, hyper-fang, screech, supersonic, sand-attack, harden, defense-curl, swords-dance, agility, mist, barrier, leech-seed, sleep-powder, stun-spore, poison-powder, confuse-ray, sing, thunder-shock, confusion, body-slam, take-down, double-edge, twineedle, pay-day, night-shade, seismic-toss, sonic-boom, guillotine, fury-attack, fury-swipes, double-slap, slash, razor-leaf, karate-chop, low-kick²[ver crítico], wing-attack, rock-throw, ice-punch, horn-attack, vice-grip, fury-attack, acid, bubble, sludge, gust, flame-wheel, synthesis, metronome, splash, disable, reflect, light-screen, rest, recover, soft-boiled, flame-wheel)** coinciden con Gen II canonical.

**Confirmaciones adicionales**:
- `Reflect`/`Light Screen` duran 5 turnos en el código ✅ (Gen II).
- Drain/recoil (`leech-life` drena 50%, `take-down` recoil 25%, `double-edge` recoil 33%) ✅.
- Multi-hit (Double Slap, Fury Attack, Fury Swipes, Pin Missile) usa distribución Gen I 37.5/37.5/12.5/12.5 ✅ (no cambia entre Gen I/II).
- Trap moves (Bind, Wrap, Fire-Spin) 2-5 turnos ✅.
- OHKO (Guillotine, Horn Drill, Fissure) falla si rival > nivel ✅.
- Fixed damage (Seismic-toss, Night-shade = lv; Dragon-rage = 40; Sonic-boom = 20) ✅.

---

## Plan de aplicación recomendado (por lotes)

Cada lote es independiente; aplica los que apruebes.

### Lote A — Crítico ✅ APLICADO (1 cambio, archivo `move-metadata.ts`)
- `low-kick`: power 50, acc 90, flinch 30%

### Lote B — Numéricos de alto impacto ✅ APLICADO (10 cambios, `move-metadata.ts`)
- `bite` type → `"dark"`
- `dig` power → 60 ⚠️ (corregido desde el 100 erróneo del borrador; valor real GSC = 60)
- `lick` power → 20
- `smog` power → 20
- `thrash` power → 90
- `leech-life` power → 20
- `thunder-wave` acc → 100
- `glare` acc → 75
- `poison-gas` acc → 55
- `double-edge` recoil → 25% (drain `-33` → `-25`) ✅ NUEVO — Showdown gen2 `recoil:[25,100]`

### Lote C — Mecánicas Gen II (4-5 cambios en `move-helper.ts`)
- `string-shot` → -1 spe (en `STATUS_MOVE_EFFECTS`)
- `minimize` → +1 eva (en `STATUS_MOVE_EFFECTS`)
- `focus-energy` → quitar de `NO_EFFECT_MOVES` + añadir flag de crit (~20 líneas)
- `self-destruct`/`explosion` → halve target Def en cálculo de daño (~5 líneas)

### Lote D — Refinamientos opcionales (sin urgencia)
- `bind` acc → 75
- `rage` rage-mode (sería un mini-feature)
- `teleport` → forceFlee en wild
- `roar`/`whirlwind` en trainer (force-switch)
- Decidir si quitar `scary-face` o mantener como excepción

---

## Verificaciones futuras (fuera del alcance — no usadas hoy en el juego)

8 movimientos canónicos Gen II ausentes de la metadata local: `struggle`, `sketch`, `triple-kick`, `spider-web`, `aeroblast`, `cotton-spore`, `milk-drink`, `sacred-fire`. Ninguno aparece en los 83 reales — no requiere acción. Único de interés futuro: **`struggle`** (fallback cuando un Pokémon agota PP) — comprobar si el juego ya gestiona "0 PP en todos los moves" o si se cuelga.

---

**Métodos**:
- Aparición real calculada por `/tmp/build-realmoves.mjs` parseando learnsets en `pokemon-metadata.ts` y enemigos en `maps/*.ts` (168 unidades), aplicando la regla "4 movimientos más recientemente aprendidos hasta el nivel del enemigo" (idéntica a `pokemon-encounter-helper.ts`).
- Canonical Gen II contrastado con Bulbapedia y, en valores numéricos no ambiguos, con PokéAPI `past_values[gold-silver]`.
