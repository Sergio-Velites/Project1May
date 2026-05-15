# Catálogo técnico de movimientos en combate

> Fuente: `game-src/src/app/move-helper.ts`, `game-src/src/app/move-metadata.ts`, `game-src/src/components/PokemonEncounter.tsx`, `game-src/src/app/move-animations.ts`, `game-src/src/app/type-effectiveness.ts`, `game-src/src/app/constants.ts`.
>
> Alcance: los **145 movimientos** que algún Pokémon aprende por nivel en `pokemon-metadata.ts`, más `struggle` (Forcejeo, fallback automático cuando no quedan PP) y `surf` (presente en el mapa pero no aprendido por ningún Pokémon del juego). El resto de las ~770 entradas de `move-metadata.ts` solo son alcanzables a través de **Metrónomo** (que sortea sobre todo el diccionario).
>
> Cada ficha describe **lo que el código ejecuta hoy**, no lo que el movimiento «debería» hacer en Gen I. Los desvíos respecto a Gen I aparecen marcados como ⚠️ **Gap** o **Bug**.

---

## 1. Arquitectura del subsistema de combate

```
PokemonEncounter.tsx ──┐
                       │  attackId
                       ▼
            processBattle(attackId)               (game-src/src/components/PokemonEncounter.tsx)
              │
              ├─ Pre-proceso (gestionado FUERA de move-helper):
              │    · Hyper Beam recharge / mensaje «debe recargar»
              │    · Bide (acumulación o liberación)
              │    · Thrash / Petal Dance (forzar mismo movimiento N turnos)
              │    · Movimientos de carga (Solar Beam, Razor Wind, Sky Attack, Skull Bash) — T1
              │    · Movimientos de invulnerabilidad (Dig, Fly) — T1, oculta sprite
              │    · Mirror Move (sustituye attackId por lastEnemyMoveRef)
              │    · checkSkipTurn(): flinch, confusión (autogolpe 50%), sueño/parálisis/congelación
              │
              └─ processMove(us, them, move, isAttacking, stages, context)   (move-helper.ts)
                    │
                    ├─ reducePP (atacante consume 1 PP)
                    ├─ Tirada de precisión (con `accuracy` y stages de precisión/evasión)
                    ├─ Manejadores específicos en este ORDEN:
                    │     transform · metronome · counter · super-fang · splash/teleport/focus-energy
                    │     · confuse-ray/supersonic · reflect · light-screen · haze · mist
                    │     · conversion · bide · disable
                    │     · OHKO (guillotine/horn-drill/fissure)
                    │     · rest · curación (recover/softboiled/milk-drink)
                    │     · dream-eater (falla si no está dormido)
                    │     · daño fijo (seismic-toss/night-shade/dragon-rage/sonic-boom/psywave)
                    │     · status sin daño (STATUS_APPLY_TABLE) → estado al objetivo
                    │     · status sin daño (STATUS_MOVE_EFFECTS) → cambio de stat
                    │     · catch-all «debuff visual» (movimientos con power=null no listados)
                    │     · Daño estándar Gen I (rama final, para todo el resto)
                    │
                    └─ Devuelve MoveResult con flags + nuevos HP/PP

PokemonEncounter.processMoveResult(result, isAttacking, moveId)
              │   (decide animación, mensaje, despacha Redux, aplica refs de
              │    combate: confuse, isBide, isDisable, isHaze, isMist,
              │    fieldEffect, isConversion, isTransform, flinch, requiresRecharge)
              │
              └─ applyEndOfTurnStatus(us, them)
                    · burn / poison / badly-poisoned → 1/16 HP máx (badly-poisoned multiplica por turno)
                    · leech-seed → drena 1/16 HP máx al sembrado y cura al opuesto
```

### Flags del `MoveResult`

| Flag | Significado | Quién lo lee |
|---|---|---|
| `missed` | Falla la tirada de precisión, o OHKO contra nivel mayor, o Dream Eater contra rival despierto | `processMoveResult` (mensaje «falló») |
| `superEffective` / `notVeryEffective` | Eficacia de tipo > 1 / < 1 | mensaje «es muy efectivo» / «no es muy efectivo» |
| `critical` | Golpe crítico (×2, ignora stages) | mensaje «¡Golpe crítico!» |
| `isBuff` / `isDebuff` | Marca general (afecta animación) | animación + mensajes |
| `isTransform` | Transform — copia ID/moves/stages del rival | `setTransformedData`, `setPlayerStages` |
| `statChange` | uno o varios `{stat,target,delta}` | `applyStatChange` |
| `statusApply` | estado a aplicar (poison/burn/…/leech-seed) | `applyStatus` (mostrando mensaje + `dispatch(setPokemonStatus)`) |
| `drainHeal` | >0 cura al usuario, <0 recoil | el propio `processMove` ya escribe el nuevo HP en `us` |
| `flinch` | El objetivo no actúa este turno | `playerFlinchRef`/`enemyFlinchRef` |
| `confuse` | Confundir al objetivo | `playerConfusionTurnsRef`/`enemyConfusionTurnsRef = 2 + rand(4)` |
| `isHaze` | Reset stages | `setPlayerStages(DEFAULT_STAGES)` + `setEnemyStages(DEFAULT_STAGES)` |
| `isMist` | Activa Velo en el usuario | `playerMistRef`/`enemyMistRef = true` |
| `fieldEffect` | `"reflect"` o `"light-screen"` | `playerReflectRef`/`enemyReflectRef = 5` (igual con light-screen) |
| `isConversion` | Cambia el tipo del usuario al de uno de sus moves | guarda en `playerConvertedTypeRef` |
| `isBide` | Activa Bide | `playerBideTurnsRef=2`, `playerBideDmgRef=0` |
| `isDisable` | Inhabilitar último move del rival | `enemyDisabledMoveRef`, `enemyDisabledTurnsRef = 1 + rand(8)` |
| `requiresRecharge` | Hyper Beam — pierde el próximo turno | `playerHyperBeamRechargeRef = true` |
| `isNoEffect` | Splash / Teleport / Focus Energy | mensaje «¡Pero no pasó nada!» |

---

## 2. Fórmulas generales

### 2.1 Fórmula de daño Gen I (`processMove`, rama final)

```
baseDamage = floor(
    ( floor( ((2·L)/5 + 2) · Power · A/D ) / 50 + 2 )
    · STAB · TypeEff · CritMult · RND
)
RND        = randInt(217,255) / 255          ≈ 0.851 … 1.000
STAB       = 1.5 si el tipo del move ∈ tipos del atacante, si no 1.0
TypeEff    = producto de `type-effectiveness.ts` sobre los tipos del defensor
CritMult   = 2 si crítico, 1 si no
A / D      = atk · stageMult / def · stageMult     (físico ⇒ attack/defense, especial ⇒ special/special)
```

Daño total = `max(1, baseDamage) × hitCount` (hitCount > 1 solo en multi-hit).

### 2.2 Multiplicador de stage

`STAGE_MULT = [1/4, 2/7, 1/3, 2/5, 1/2, 2/3, 1, 3/2, 2, 5/2, 3, 7/2, 4]` (indexado por `stage+6`).

Aplica a **attack**, **defense**, **speed**, **special**, **accuracy** y **evasion**. Gen I correcto: `special` cubre tanto Sp. Atk como Sp. Def.

### 2.3 Tirada de precisión

```
effectiveAcc = move.accuracy · STAGE_MULT[accStage+6] / STAGE_MULT[evaStage+6]
miss         = (effectiveAcc < random()·100)
```

Si `move.accuracy === null`, la tirada se omite (siempre acierta — `swift`, `rest`, `transform`, `metronome`, `mirror-move`, las curaciones, todos los buffs/debuffs propios…).

### 2.4 Crítico (`constants.ts`)

```
CRITICAL_HIT_PERCENTAGE = 0.10   // 10% base
CRITICAL_HIT_MULTIPLIER = 2      // ×2 daño
highCrit (critRate=1)   → min(50%, 10% · 8) = 50%
```

> ⚠️ **Desvío Gen I**: el original calcula `BaseSpeed/512`, escalando con la velocidad base de la especie. Aquí es plano 10% / 50%. `focus-energy` (que en Gen I cuadruplica el ratio… mal, lo divide por 4 por bug) se trata como **no-op** intencionado (`NO_EFFECT_MOVES`).

### 2.5 Crítico ignora stages

Si `isCrit`, el cálculo recalcula `atk`/`def` con stage=0 (`atkStage = isCrit ? 0 : ...`). Coincide con Gen I.

### 2.6 Multi-hit (`genIMultiHitCount`)

| min-max | Distribución |
|---|---|
| 2-5 | 37.5% / 37.5% / 12.5% / 12.5% (2/3/4/5 golpes) — Gen I correcto |
| min == max | Siempre `min` golpes (Twineedle, Double Kick, Bonemerang) |
| otros | Uniforme entre `min` y `max` |

El `baseDamage` se calcula **una sola vez** y se multiplica por `hitCount`. El crítico es el mismo para todos los golpes (no se re-tira por golpe).

### 2.7 Drain / Recoil

```
drainPct = meta.drain      (// 50 = drena, -25 = recoil)
delta    = max(1, floor(totalDamage · |drainPct| / 100)) · sign(drainPct)
newHp    = min(maxHp, max(0, currentHp + delta))
```

Solo se lee `meta.drain`. **No se lee `meta.healing` para recoil** → ver bug de `struggle` (§ 7.4).

### 2.8 Flinch

```
flinchChance = meta.flinchChance / 100
flinch       = (Math.random() < flinchChance)
```

El flag se aplica vía `enemyFlinchRef`/`playerFlinchRef` y se consume en `checkSkipTurn`. Solo dura 1 turno. Funciona aunque el flincheado sea más rápido (Gen I correcto: pone el flag y se consume al elegir acción del rival/aliado en su turno).

### 2.9 Estado secundario tras movimiento de daño

Solo se aplica si el `move` está en `SECONDARY_STATUS_CHANCE` (16 entradas hardcodeadas). El motor ignora `meta.ailment`/`meta.ailmentChance` salvo para esos 16 movimientos. Esto deja **muchos movimientos sin su efecto secundario** — ver § 7.1.

### 2.10 Multi-status por golpe (Twineedle)

`twineedle` (Doble Ataque) lanza una tirada de veneno **por cada uno de los 2 golpes** (20% cada una) — distinto del resto, que tiran una sola vez para el conjunto.

### 2.11 Self-destruct / Explosion

`self-destruct` y `explosion` dejan al atacante a HP=0 inmediatamente tras infligir el daño. No aplica recoil clásico, simplemente fuerza `hp=0`.

---

## 3. Estados persistentes

| Estado | Origen | Efecto durante combate | Persiste fuera de combate |
|---|---|---|---|
| `poison` | poison-powder, poison-sting (30%), sludge (30%), smog (40%), twineedle (20% por golpe) | -1/16 HP máx al final de turno | Sí |
| `badly-poisoned` | toxic | -N/16 HP máx (N empieza en 1 y sube cada turno). N se reinicia a 1 al cambiar de Pokémon | Sí, pero con N=1 |
| `burn` | ember (10%), flamethrower (10%), fire-blast (30%), fire-punch (10%), body-slam (30% paralisis — no burn) | -1/16 HP máx al final de turno. **No reduce el ataque físico** (Gen I lo hacía a la mitad, aquí no) | Sí |
| `paralysis` | thunder-wave, stun-spore, body-slam (30%), lick (30%), thunder (10%), thunderbolt (10%), thunder-punch (10%) | 25% de fallar el turno. Velocidad ×0.5 en cálculo de prioridad | Sí |
| `sleep` | sleep-powder, spore, sing, hypnosis, lovely-kiss, rest | Turnos = `1 + rand(7)` (`rest` fuerza 2). No actúa. Al llegar a 0 turnos despierta | Sí |
| `freeze` | blizzard (10%), ice-beam (10%), ice-punch (10%) | No actúa. 20% por turno de descongelarse | Sí |
| `leech-seed` | leech-seed (no es realmente un estado persistente, sino una flag de combate `playerLeechSeededRef`/`enemyLeechSeededRef`) | -1/16 HP máx al sembrado y +1/16 HP máx al opuesto al final del turno | No (se limpia al salir del campo) |

---

## 4. Estados volátiles (solo combate)

| Estado | Origen | Duración | Efecto | Limpieza |
|---|---|---|---|---|
| `confusion` | confuse-ray, supersonic, fin de thrash/petal-dance | 2 + rand(3..4) | 50% de auto-golpearse con un Tackle ficticio (40 pot, ignora tipos/stages). 50% actúa normal | Al cambiar de Pokémon, al despertarse, o al expirar el contador (mensaje «superó la confusión») |
| `flinch` | meta.flinchChance > 0 | 1 turno | El flincheado salta su turno | Consumido en `checkSkipTurn` o limpiado al final del turno |
| `bide` | `bide` | 2 turnos acumulando + 1 turno de liberación | Al liberar: `2 × dmgAcumulado` directo (mín. 1), bypass de defensa/tipo | El timer es lineal, no se interrumpe |
| `thrash` / `petal-dance` | `thrash` o `petal-dance` | 2 + rand(2) = 2-3 turnos forzados | Repite el mismo movimiento. Al terminar, se aplica `confusion` automáticamente | Se decrementa por turno; no se interrumpe |
| `charging` | solar-beam, razor-wind, sky-attack, skull-bash | 2 turnos (carga + ataque) | T1 no daña, mensaje de carga; T2 ataca normal | Cambiar de Pokémon limpia `playerChargingMoveRef` |
| `invulnerable` | dig, fly | 2 turnos (oculto + ataque) | T1: invulnerable a cualquier ataque rival, sprite oculto. T2: ataca y reaparece | Igual que `charging` |
| `hyper-beam-recharge` | hyper-beam si el rival sobrevive | 1 turno | Mensaje «debe recargar», no actúa | Se consume en el turno siguiente |
| `disable` | `disable` | 1 + rand(8) turnos (rival) o 1 + rand(7) turnos (jugador) | Bloquea el último movimiento usado por el target en su selección aleatoria/del menú | Decrementa por turno |
| `transform` | `transform` | Hasta cambiar de Pokémon | Copia ID, sprites (vía ID), tipos, stats base, moves (PP=5 cada uno) y stages del rival | Cambio de Pokémon |
| `reflect` (5 turnos) | `reflect` | 5 turnos | `playerReflectRef = 5` **pero el contador no se decrementa ni se aplica reducción de daño** | ⚠️ **Sin efecto real en combate (gap)** |
| `light-screen` (5 turnos) | `light-screen` | 5 turnos | Igual que reflect | ⚠️ **Sin efecto real en combate (gap)** |
| `mist` | `mist` | Hasta cambiar de Pokémon | `playerMistRef = true`: cualquier `statChange` con `target='defender'` recibido por el usuario muestra «¡Pero Niebla lo protegió!» y se ignora | Cambio de Pokémon |
| `conversion` | `conversion` | Indefinida | `playerConvertedTypeRef` guarda el tipo elegido **pero no se usa en cálculos de tipo/STAB** | ⚠️ **Sin efecto real en combate (gap)** |

---

## 5. Prioridad

Solo 5 movimientos tienen `priority != 0`:

| Move | Prioridad |
|---|---|
| `quick-attack` | +1 (siempre va primero salvo contra otro +1) |
| `counter` | -5 |
| `roar`, `whirlwind`, `teleport` | -6 |

El cálculo: `getActiveMovesFirst()` compara `priority`, luego `speed · stageMult · paralysisMult` (paralysisMult=0.5 si paralizado), empate aleatorio 50/50.

---

## 6. Animaciones

`getMoveAnimType(moveId, moveType, damageClass)`:
1. Look-up directo en `ID_MAP` (137 entradas en `move-animations.ts`).
2. Fallback por tipo (`TYPE_FALLBACK`).
3. Si nada coincide y `damageClass === 'status'`, anima como `status-debuff`.
4. Else, `tackle` (parpadeo blanco).

El target de la animación se decide en `processMoveResult` con `isSelfTargetingStatusMove(moveId)` — devuelve `true` si la primera entrada de `STATUS_MOVE_EFFECTS[moveId]` apunta al atacante. Si no es self-target, anima sobre el lado contrario.

---

## 7. Resumen de bugs y desvíos conocidos respecto a Gen I

Las fichas individuales (§ 8) repiten estas notas allí donde aplican.

### 7.1 Efectos secundarios de estado no implementados (15 movimientos)

`SECONDARY_STATUS_CHANCE` en `move-helper.ts` solo tiene 16 entradas. Estos movimientos declaran efecto secundario en `meta.ailmentChance` pero el motor lo ignora:

| Move | Efecto declarado en metadata | Tratamiento real |
|---|---|---|
| `thunder-shock` | 10% paralisis | Solo daño |
| `confusion` (move) | 10% confusión | Solo daño |
| `psybeam` | 10% confusión | Solo daño |
| `dizzy-punch` | 20% confusión | Solo daño |
| `tri-attack` | 20% `unknown` (Gen I correcto: ninguno) | Solo daño |
| `bind` | 100% `trap` | Solo daño (sin trap multi-turno) |
| `wrap` | 100% `trap` | Solo daño |
| `fire-spin` | 100% `trap` | Solo daño |
| `clamp` | 100% `trap` | Solo daño |
| `skull-bash` | 100% `none` (subir def en Gen II) | Carga 2T + daño |

### 7.2 Bajadas de stat secundarias no implementadas (5 movimientos)

No hay tabla equivalente a `SECONDARY_STATUS_CHANCE` para `meta.statChance`:

| Move | Efecto declarado | Real |
|---|---|---|
| `acid` | 10% bajar special al objetivo | Solo daño |
| `aurora-beam` | 10% bajar attack al objetivo | Solo daño |
| `bubble` | 10% bajar speed al objetivo | Solo daño |
| `constrict` | 10% bajar speed al objetivo | Solo daño |
| `psychic` | 10% bajar special al objetivo | Solo daño |

### 7.3 Movimientos de estado SIN entrada en `STATUS_APPLY_TABLE`/`STATUS_MOVE_EFFECTS`

Caen al catch-all final («Movimiento de estado desconocido — tratar como debuff visual») y **no aplican nada**:

| Move | Efecto esperado | Real |
|---|---|---|
| `glare` | Paralizar al objetivo (100%) | Solo mensaje de uso + debuff visual |
| `poison-gas` | Envenenar al objetivo | Solo mensaje |
| `substitute` | Crear sustituto que absorbe daño hasta romperse | Solo mensaje |
| `roar` | Termina batallas salvajes / fuerza switch entrenador | Solo mensaje |
| `whirlwind` | Igual que `roar` | Solo mensaje |

### 7.4 Recoil/efecto de `meta.healing` no implementado

| Move | Esperado | Real |
|---|---|---|
| `struggle` | -25% del daño infligido como recoil (vía `meta.healing=-25`) | Daño se inflige pero el atacante **no pierde HP** |
| `jump-kick`, `high-jump-kick` | Si falla la tirada, recoil = ½ del daño que habría hecho | Si falla, no hay penalización |

### 7.5 Movimientos de daño con efecto adicional no implementado

| Move | Efecto adicional esperado | Real |
|---|---|---|
| `pay-day` | Genera monedas al ganar | Solo daño |
| `rage` | Bloquea al usuario y sube +1 atk cada vez que recibe daño | Solo daño |
| `bite` | Tipo Normal en Gen I (en metadata aparece como `dark`) | Daño tipo Dark — afecta a STAB y eficacia de tipo |

### 7.6 Otras desviaciones

| Sistema | Desvío |
|---|---|
| Crit rate | Gen I usa `BaseSpeed/512`. Aquí: 10% fijo, 50% si `critRate=1` |
| `thrash`/`petal-dance` | 2-3 turnos. Gen I: 3-4 turnos |
| `bide` | 2 turnos fijos de acumulación. Gen I: 2-3 turnos aleatorios |
| `disable` | 1-8 turnos. Gen I: 1-8 turnos (encaja por casualidad — pero rival usa `1 + rand(7)` = 1..7, ligera asimetría) |
| `burn` | No reduce el atk físico del quemado (Gen I sí, a la mitad) |
| `thunder-wave` contra tipos Tierra | Sigue acertando (Gen I correcto era inmunidad). El código no aplica `type-effectiveness` a status moves |
| `metronome` | Puede invocar **cualquier** movimiento de las ~770 entradas, incluidos los no implementados. Si invoca `bind`, `fire-spin`, `glare`, etc., heredará los gaps de § 7.1-7.3 |

---

## 8. Catálogo por movimiento (orden alfabético por ID)

> Cada ficha muestra metadata bruta de `move-metadata.ts` + categoría aplicada por el motor + descripción técnica + notas/gaps específicos.

### `absorb` — Absorber

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 100 | 25 | 0 | grass | special | 0 | 50 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño special. Aplica fórmula Gen I estándar. Drena 50% del daño infligido (cura al usuario).

### `acid` — Ácido

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 40 | 100 | 30 | 0 | poison | special | 0 | 0 | 0 | — (0%) | 10% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño special. Aplica fórmula Gen I estándar.

**Notas:**
- ⚠️ **Gap:** la metadata declara `statChance=10%` (cambio de stat secundario) pero el motor NO lo aplica — no existe tabla de `SECONDARY_STAT_CHANCE` en `move-helper.ts`.

### `acid-armor` — Armadura Ácida

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 20 | 0 | poison | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Cambio de stats.

**Mecánica implementada:** Modifica stat `defense` del atacante en +2 stage.

### `agility` — Agilidad

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 30 | 0 | psychic | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Cambio de stats.

**Mecánica implementada:** Modifica stat `speed` del atacante en +2 stage.

### `amnesia` — Amnesia

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 20 | 0 | psychic | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Cambio de stats.

**Mecánica implementada:** Modifica stat `special` del atacante en +2 stage.

### `aurora-beam` — Rayo Aurora

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 65 | 100 | 20 | 0 | ice | special | 0 | 0 | 0 | — (0%) | 10% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño special. Aplica fórmula Gen I estándar.

**Notas:**
- ⚠️ **Gap:** la metadata declara `statChance=10%` (cambio de stat secundario) pero el motor NO lo aplica — no existe tabla de `SECONDARY_STAT_CHANCE` en `move-helper.ts`.

### `barrage` — Bombardeo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 15 | 85 | 20 | 0 | normal | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Golpea 2-5 veces (37.5% → 2, 37.5% → 3, 12.5% → 4, 12.5% → 5). Daño base recalculado solo una vez.

### `barrier` — Barrera

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 20 | 0 | psychic | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Cambio de stats.

**Mecánica implementada:** Modifica stat `defense` del atacante en +2 stage.

### `bind` — Atadura

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 15 | 85 | 20 | 0 | normal | physical | 0 | 0 | 0 | trap (100%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar.

**Notas:**
- ⚠️ **Gap:** la metadata declara `ailment=trap (100%)` pero el motor NO lo aplica (no está en `SECONDARY_STATUS_CHANCE`).

### `bite` — Mordisco

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 60 | 100 | 25 | 0 | dark | physical | 0 | 0 | 30 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Probabilidad de flinch 30% (el objetivo no actuará si el flinch llega antes que su turno).

**Notas:**
- ⚠️ **Bug Gen I:** el tipo registrado es `dark` (Gen II+). En Gen I, Mordisco era tipo Normal. Afecta a STAB de los Pokémon que lo usan (en Gen I lo tenían los normales, ahora lo tienen los oscuros — que no existen en esta dex) y a la eficacia (Dark es x2 contra Psíquico/Fantasma en este chart, mientras que Normal sería x1 contra Psíquico y x0 contra Fantasma).

### `blizzard` — Ventisca

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 110 | 70 | 5 | 0 | ice | special | 0 | 0 | 0 | freeze (10%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño special. Aplica fórmula Gen I estándar. Efecto secundario: 10% de aplicar `freeze` al objetivo.

### `body-slam` — Golpe Cuerpo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 85 | 100 | 15 | 0 | normal | physical | 0 | 0 | 0 | paralysis (30%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Efecto secundario: 30% de aplicar `paralysis` al objetivo.

### `bone-club` — Hueso Palo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 65 | 85 | 20 | 0 | ground | physical | 0 | 0 | 10 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Probabilidad de flinch 10% (el objetivo no actuará si el flinch llega antes que su turno).

### `bonemerang` — Huesomerang

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 50 | 90 | 10 | 0 | ground | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Golpea 2 veces fijas (potencia por golpe; daño base recalculado solo una vez).

### `bubble` — Burbuja

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 40 | 100 | 30 | 0 | water | special | 0 | 0 | 0 | — (0%) | 10% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño special. Aplica fórmula Gen I estándar.

**Notas:**
- ⚠️ **Gap:** la metadata declara `statChance=10%` (cambio de stat secundario) pero el motor NO lo aplica — no existe tabla de `SECONDARY_STAT_CHANCE` en `move-helper.ts`.

### `clamp` — Tenaza

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 35 | 85 | 15 | 0 | water | physical | 0 | 0 | 0 | trap (100%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar.

**Notas:**
- ⚠️ **Gap:** la metadata declara `ailment=trap (100%)` pero el motor NO lo aplica (no está en `SECONDARY_STATUS_CHANCE`).

### `comet-punch` — Puño Cometa

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 18 | 85 | 15 | 0 | normal | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Golpea 2-5 veces (37.5% → 2, 37.5% → 3, 12.5% → 4, 12.5% → 5). Daño base recalculado solo una vez.

### `confuse-ray` — Rayo Confuso

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 100 | 10 | 0 | ghost | status | 0 | 0 | 0 | confusion (0%) | 0% |

**Categoría en el motor:** Confusión pura.

**Mecánica implementada:** Aplica el estado volátil `confusion` al objetivo: `2 + rand(4) = 2-5 turnos`. Falla si el objetivo está dormido.

### `confusion` — Confusión

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 50 | 100 | 25 | 0 | psychic | special | 0 | 0 | 0 | confusion (10%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño special. Aplica fórmula Gen I estándar.

**Notas:**
- ⚠️ **Gap:** la metadata declara `ailment=confusion (10%)` pero el motor NO lo aplica (no está en `SECONDARY_STATUS_CHANCE`).

### `constrict` — Restricción

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 10 | 100 | 35 | 0 | normal | physical | 0 | 0 | 0 | — (0%) | 10% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar.

**Notas:**
- ⚠️ **Gap:** la metadata declara `statChance=10%` (cambio de stat secundario) pero el motor NO lo aplica — no existe tabla de `SECONDARY_STAT_CHANCE` en `move-helper.ts`.

### `conversion` — Conversión

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 30 | 0 | normal | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Caso especial.

**Mecánica implementada:** Elige un move aleatorio del usuario y guarda su tipo en `playerConvertedTypeRef`. **El ref no se lee en ningún cálculo de tipo posterior — el cambio no surte efecto en combate.**

### `counter` — Contraataque

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 100 | 20 | -5 | fighting | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Caso especial.

**Mecánica implementada:** Devuelve `lastPhysicalDamageTaken × 2` al rival. Bypass de fórmula de daño. Pierde turno si no recibió daño físico previo.

### `crabhammer` — Martillazo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 100 | 90 | 10 | 0 | water | physical | 1 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Crit rate alto: 8× probabilidad base (≈ 50%).

### `defense-curl` — Rizo Defensa

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 40 | 0 | normal | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Cambio de stats.

**Mecánica implementada:** Modifica stat `defense` del atacante en +1 stage.

### `dig` — Excavar

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 80 | 100 | 10 | 0 | ground | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Invulnerable 2 turnos.

**Mecánica implementada:** T1: «se hundió/voló», sprite oculto, invulnerable a cualquier ataque del rival. T2: ejecuta como daño estándar y reaparece.

### `disable` — Anulación

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 100 | 20 | 0 | normal | status | 0 | 0 | 0 | disable (0%) | 0% |

**Categoría en el motor:** Caso especial.

**Mecánica implementada:** Falla si el rival no ha usado movimiento aún o si ya hay uno inhabilitado. Si pasa: marca `lastEnemyMoveRef` como inhabilitado durante `1 + rand(8)` turnos (jugador→rival) o `1 + rand(7)` turnos (rival→jugador).

### `dizzy-punch` — Puño Mareo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 70 | 100 | 10 | 0 | normal | physical | 0 | 0 | 0 | confusion (20%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar.

**Notas:**
- ⚠️ **Gap:** la metadata declara `ailment=confusion (20%)` pero el motor NO lo aplica (no está en `SECONDARY_STATUS_CHANCE`).

### `double-edge` — Doble Filo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 120 | 100 | 15 | 0 | normal | physical | 0 | -33 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Recoil 33% del daño infligido (golpea al usuario).

### `double-kick` — Doble Patada

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 30 | 100 | 30 | 0 | fighting | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Golpea 2 veces fijas (potencia por golpe; daño base recalculado solo una vez).

### `double-slap` — Doble Bofetón

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 15 | 85 | 10 | 0 | normal | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Golpea 2-5 veces (37.5% → 2, 37.5% → 3, 12.5% → 4, 12.5% → 5). Daño base recalculado solo una vez.

### `double-team` — Doble Equipo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 15 | 0 | normal | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Cambio de stats.

**Mecánica implementada:** Modifica stat `evasion` del atacante en +1 stage.

### `dragon-rage` — Furia Dragón

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 100 | 10 | 0 | dragon | special | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño fijo.

**Mecánica implementada:** Daño = 40 PS fijos. Ignora tipo, defensa, STAB, crítico.

### `dream-eater` — Comesueños

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 100 | 100 | 15 | 0 | psychic | special | 0 | 50 | 0 | — (0%) | 0% |

**Categoría en el motor:** Caso especial.

**Mecánica implementada:** Si el objetivo NO está dormido (`context.isTargetSleeping`), falla (missed=true). Si lo está, cae al cálculo de daño estándar especial (potencia 100, drain 50).

### `drill-peck` — Pico Taladro

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 80 | 100 | 20 | 0 | flying | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar.

### `earthquake` — Terremoto

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 100 | 100 | 10 | 0 | ground | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar.

### `ember` — Ascuas

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 40 | 100 | 25 | 0 | fire | special | 0 | 0 | 0 | burn (10%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño special. Aplica fórmula Gen I estándar. Efecto secundario: 10% de aplicar `burn` al objetivo.

### `explosion` — Explosión

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 250 | 100 | 5 | 0 | normal | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Caso especial.

**Mecánica implementada:** Daño estándar (físico, 250 de potencia). El atacante queda automáticamente a 0 HP tras el golpe.

### `fire-punch` — Puño Fuego

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 75 | 100 | 15 | 0 | fire | physical | 0 | 0 | 0 | burn (10%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Efecto secundario: 10% de aplicar `burn` al objetivo.

### `fire-spin` — Giro Fuego

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 35 | 85 | 15 | 0 | fire | special | 0 | 0 | 0 | trap (100%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño special. Aplica fórmula Gen I estándar.

**Notas:**
- ⚠️ **Gap:** la metadata declara `ailment=trap (100%)` pero el motor NO lo aplica (no está en `SECONDARY_STATUS_CHANCE`).

### `flamethrower` — Lanzallamas

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 90 | 100 | 15 | 0 | fire | special | 0 | 0 | 0 | burn (10%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño special. Aplica fórmula Gen I estándar. Efecto secundario: 10% de aplicar `burn` al objetivo.

### `focus-energy` — Foco Energía

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 30 | 0 | normal | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Sin efecto.

**Mecánica implementada:** El movimiento se ejecuta, se gasta 1 PP, se muestra «¡Pero no pasó nada!» y no aplica ningún efecto adicional.

### `fury-attack` — Ataque Furia

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 15 | 85 | 20 | 0 | normal | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Golpea 2-5 veces (37.5% → 2, 37.5% → 3, 12.5% → 4, 12.5% → 5). Daño base recalculado solo una vez.

### `fury-swipes` — Golpes Furia

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 18 | 80 | 15 | 0 | normal | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Golpea 2-5 veces (37.5% → 2, 37.5% → 3, 12.5% → 4, 12.5% → 5). Daño base recalculado solo una vez.

### `glare` — Deslumbrar

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 100 | 30 | 0 | normal | status | 0 | 0 | 0 | paralysis (0%) | 0% |

**Categoría en el motor:** Estado no implementado.

**Notas:**
- ⚠️ **Gap Gen I:** debería paralizar al objetivo al 100% si pasa la precisión. Falta entrada en `STATUS_APPLY_TABLE` de `move-helper.ts:131`. Hoy no aplica nada — falla silenciosamente.

**Mecánica implementada:** **Sin gestor**. Cae a la rama final de movimientos de estado y devuelve `{isDebuff:true}` puro — no aplica ningún efecto al combate.

### `growl` — Gruñido

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 100 | 40 | 0 | normal | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Cambio de stats.

**Mecánica implementada:** Modifica stat `attack` del defensor en -1 stage.

### `growth` — Desarrollo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 20 | 0 | normal | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Cambio de stats.

**Mecánica implementada:** Modifica stat `special` del atacante en +1 stage.

### `guillotine` — Guillotina

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 30 | 5 | 0 | normal | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** OHKO.

**Mecánica implementada:** Falla si nivel del defensor > atacante. Si pasa precisión, deja al objetivo a 0 HP.

### `gust` — Tornado

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 40 | 100 | 35 | 0 | flying | special | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño special. Aplica fórmula Gen I estándar.

### `harden` — Fortaleza

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 30 | 0 | normal | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Cambio de stats.

**Mecánica implementada:** Modifica stat `defense` del atacante en +1 stage.

### `haze` — Niebla

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 30 | 0 | ice | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Caso especial.

**Mecánica implementada:** Resetea todos los stat stages de ambos combatientes a 0 (DEFAULT_STAGES).

### `headbutt` — Cabezazo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 70 | 100 | 15 | 0 | normal | physical | 0 | 0 | 30 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Probabilidad de flinch 30% (el objetivo no actuará si el flinch llega antes que su turno).

### `high-jump-kick` — Pat. Salto Alta

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 130 | 90 | 10 | 0 | fighting | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar.

**Notas:**
- ⚠️ **Gap Gen I:** si la tirada de precisión falla, el usuario debería sufrir «crash damage» (= 1 HP en RBY original, o la mitad del daño que habría hecho en Gen II+). El motor solo marca `missed: true` y no aplica penalización al atacante.

### `horn-attack` — Cornada

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 65 | 100 | 25 | 0 | normal | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar.

### `horn-drill` — Perforador

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 30 | 5 | 0 | normal | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** OHKO.

**Mecánica implementada:** Falla si nivel del defensor > atacante. Si pasa precisión, deja al objetivo a 0 HP.

### `hydro-pump` — Hidrobomba

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 110 | 80 | 5 | 0 | water | special | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño special. Aplica fórmula Gen I estándar.

### `hyper-beam` — Hiperrayo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 150 | 90 | 5 | 0 | normal | special | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Caso especial.

**Mecánica implementada:** Daño estándar. Si el rival sigue en pie tras el golpe, activa `requiresRecharge` → el siguiente turno se consume con mensaje «debe recargar».

### `hyper-fang` — Hipercolmillo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 80 | 90 | 15 | 0 | normal | physical | 0 | 0 | 10 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Probabilidad de flinch 10% (el objetivo no actuará si el flinch llega antes que su turno).

### `hypnosis` — Hipnosis

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 60 | 20 | 0 | psychic | status | 0 | 0 | 0 | sleep (0%) | 0% |

**Categoría en el motor:** Estado puro.

**Mecánica implementada:** Aplica el estado `sleep` al defensor con la precisión del movimiento como probabilidad de éxito.

### `ice-beam` — Rayo Hielo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 90 | 100 | 10 | 0 | ice | special | 0 | 0 | 0 | freeze (10%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño special. Aplica fórmula Gen I estándar. Efecto secundario: 10% de aplicar `freeze` al objetivo.

### `ice-punch` — Puño Hielo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 75 | 100 | 15 | 0 | ice | physical | 0 | 0 | 0 | freeze (10%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Efecto secundario: 10% de aplicar `freeze` al objetivo.

### `jump-kick` — Patada Salto

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 100 | 95 | 10 | 0 | fighting | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar.

**Notas:**
- ⚠️ **Gap Gen I:** mismo problema que `high-jump-kick` — sin crash damage al fallar.

### `karate-chop` — Golpe Kárate

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 50 | 100 | 25 | 0 | fighting | physical | 1 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Crit rate alto: 8× probabilidad base (≈ 50%).

### `leech-life` — Chupavidas

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 80 | 100 | 10 | 0 | bug | physical | 0 | 50 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Drena 50% del daño infligido (cura al usuario).

### `leech-seed` — Drenadoras

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 90 | 10 | 0 | grass | status | 0 | 0 | 0 | leech-seed (0%) | 0% |

**Categoría en el motor:** Estado puro.

**Mecánica implementada:** Aplica el estado `leech-seed` al defensor con la precisión del movimiento como probabilidad de éxito.

### `leer` — Malicioso

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 100 | 30 | 0 | normal | status | 0 | 0 | 0 | — (0%) | 100% |

**Categoría en el motor:** Cambio de stats.

**Mecánica implementada:** Modifica stat `defense` del defensor en -1 stage.

**Notas:**
- ⚠️ **Gap:** la metadata declara `statChance=100%` (cambio de stat secundario) pero el motor NO lo aplica — no existe tabla de `SECONDARY_STAT_CHANCE` en `move-helper.ts`.

### `lick` — Lengüetazo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 30 | 100 | 30 | 0 | ghost | physical | 0 | 0 | 0 | paralysis (30%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Efecto secundario: 30% de aplicar `paralysis` al objetivo.

### `light-screen` — Pantalla Luz

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 30 | 0 | psychic | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Caso especial.

**Mecánica implementada:** Activa contador `playerLightScreenRef`/`enemyLightScreenRef` = 5 turnos. **El contador no se decrementa ni se aplica reducción de daño en ningún sitio.**

### `lovely-kiss` — Beso Amoroso

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 75 | 10 | 0 | normal | status | 0 | 0 | 0 | sleep (0%) | 0% |

**Categoría en el motor:** Estado puro.

**Mecánica implementada:** Aplica el estado `sleep` al defensor con la precisión del movimiento como probabilidad de éxito.

### `low-kick` — Patada Baja

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 100 | 20 | 0 | fighting | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Estado no implementado.

**Mecánica implementada:** **Sin gestor**. Cae a la rama final de movimientos de estado y devuelve `{isDebuff:true}` puro — no aplica ningún efecto al combate.

### `meditate` — Meditación

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 40 | 0 | psychic | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Cambio de stats.

**Mecánica implementada:** Modifica stat `attack` del atacante en +1 stage.

### `mega-kick` — Megapatada

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 120 | 75 | 5 | 0 | normal | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar.

### `mega-punch` — Megapuño

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 80 | 85 | 20 | 0 | normal | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar.

### `metronome` — Metrónomo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 10 | 0 | normal | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Caso especial.

**Mecánica implementada:** Elige un movimiento aleatorio entre los 917 de move-metadata (excluidos metronome, struggle, transform) y lo ejecuta recursivamente con `processMove`.

### `minimize` — Reducción

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 10 | 0 | normal | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Cambio de stats.

**Mecánica implementada:** Modifica stat `evasion` del atacante en +2 stage.

### `mirror-move` — Espejo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 20 | 0 | flying | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Caso especial.

**Mecánica implementada:** Sustituye el move por `lastEnemyMoveRef`. Si no hay (turno 1), falla. Se ejecuta como si el usuario lo hubiera elegido directamente.

### `mist` — Bruma

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 30 | 0 | ice | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Caso especial.

**Mecánica implementada:** Activa flag `playerMistRef`/`enemyMistRef` que rechaza los cambios de stat dirigidos contra el usuario.

### `night-shade` — Tinieblas

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 100 | 15 | 0 | ghost | special | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño fijo.

**Mecánica implementada:** Daño = nivel del atacante. Ignora tipo, defensa, STAB, crítico.

### `pay-day` — Día de Pago

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 40 | 100 | 20 | 0 | normal | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar.

**Notas:**
- ⚠️ **Gap Gen I:** debería generar monedas (5× nivel del atacante) que se recogen al ganar el combate. No existe ningún `dispatch(addMoney(...))` ligado a este movimiento — solo daño plano.

### `peck` — Picotazo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 35 | 100 | 35 | 0 | flying | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar.

### `petal-dance` — Danza Pétalo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 120 | 100 | 10 | 0 | grass | special | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Caso especial.

**Mecánica implementada:** Idéntico a Thrash (mismo bloque de código).

### `pin-missile` — Pin Misil

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 25 | 95 | 20 | 0 | bug | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Golpea 2-5 veces (37.5% → 2, 37.5% → 3, 12.5% → 4, 12.5% → 5). Daño base recalculado solo una vez.

### `poison-gas` — Gas Venenoso

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 90 | 40 | 0 | poison | status | 0 | 0 | 0 | poison (0%) | 0% |

**Categoría en el motor:** Estado no implementado.

**Notas:**
- ⚠️ **Gap Gen I:** debería envenenar al objetivo si pasa la precisión. Falta entrada en `STATUS_APPLY_TABLE`.

**Mecánica implementada:** **Sin gestor**. Cae a la rama final de movimientos de estado y devuelve `{isDebuff:true}` puro — no aplica ningún efecto al combate.

### `poison-powder` — Polvo Veneno

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 75 | 35 | 0 | poison | status | 0 | 0 | 0 | poison (0%) | 0% |

**Categoría en el motor:** Estado puro.

**Mecánica implementada:** Aplica el estado `poison` al defensor con la precisión del movimiento como probabilidad de éxito.

### `poison-sting` — Picotazo Veneno

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 15 | 100 | 35 | 0 | poison | physical | 0 | 0 | 0 | poison (30%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Efecto secundario: 30% de aplicar `poison` al objetivo.

### `pound` — Destructor

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 40 | 100 | 35 | 0 | normal | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar.

### `psybeam` — Psicorrayo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 65 | 100 | 20 | 0 | psychic | special | 0 | 0 | 0 | confusion (10%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño special. Aplica fórmula Gen I estándar.

**Notas:**
- ⚠️ **Gap:** la metadata declara `ailment=confusion (10%)` pero el motor NO lo aplica (no está en `SECONDARY_STATUS_CHANCE`).

### `psychic` — Psíquico

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 90 | 100 | 10 | 0 | psychic | special | 0 | 0 | 0 | — (0%) | 10% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño special. Aplica fórmula Gen I estándar.

**Notas:**
- ⚠️ **Gap:** la metadata declara `statChance=10%` (cambio de stat secundario) pero el motor NO lo aplica — no existe tabla de `SECONDARY_STAT_CHANCE` en `move-helper.ts`.

### `quick-attack` — Ataque Rápido

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 40 | 100 | 30 | 1 | normal | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar.

### `rage` — Furia

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 100 | 20 | 0 | normal | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar.

**Notas:**
- ⚠️ **Gap Gen I:** debería bloquear al usuario en Furia (no se puede cambiar de movimiento, como Thrash) y subir +1 stage de Ataque cada vez que el usuario recibe daño. No implementado: actúa como un ataque normal de 20 de potencia.

### `razor-leaf` — Hoja Afilada

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 55 | 95 | 25 | 0 | grass | physical | 1 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Crit rate alto: 8× probabilidad base (≈ 50%).

### `recover` — Recuperación

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 10 | 0 | normal | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Curación.

**Mecánica implementada:** Cura al usuario por 50% HP máx.. Sin tirada de precisión (accuracy null).

### `reflect` — Reflejo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 20 | 0 | psychic | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Caso especial.

**Mecánica implementada:** Activa contador `playerReflectRef`/`enemyReflectRef` = 5 turnos. **El contador no se decrementa ni se aplica reducción de daño en ningún sitio.**

### `rest` — Descanso

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 10 | 0 | psychic | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Caso especial.

**Mecánica implementada:** Cura al usuario al 100 % de HP máx. y le aplica `sleep` con `fixedTurns=2`. `force:true` sobreescribe estado existente.

### `roar` — Rugido

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 20 | -6 | normal | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Estado no implementado.

**Notas:**
- ⚠️ **Gap Gen I:** debería terminar la batalla salvaje al instante (huir) y, contra entrenadores, fallar. No implementado.

**Mecánica implementada:** **Sin gestor**. Cae a la rama final de movimientos de estado y devuelve `{isDebuff:true}` puro — no aplica ningún efecto al combate.

### `rock-throw` — Lanzarrocas

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 50 | 90 | 15 | 0 | rock | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar.

### `rolling-kick` — Patada Giro

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 60 | 85 | 15 | 0 | fighting | physical | 0 | 0 | 30 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Probabilidad de flinch 30% (el objetivo no actuará si el flinch llega antes que su turno).

### `sand-attack` — Ataque Arena

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 100 | 15 | 0 | ground | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Cambio de stats.

**Mecánica implementada:** Modifica stat `accuracy` del defensor en -1 stage.

### `scratch` — Arañazo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 40 | 100 | 35 | 0 | normal | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar.

### `screech` — Chirrido

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 85 | 40 | 0 | normal | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Cambio de stats.

**Mecánica implementada:** Modifica stat `defense` del defensor en -2 stage.

### `seismic-toss` — Sísmico

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 100 | 20 | 0 | fighting | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño fijo.

**Mecánica implementada:** Daño = nivel del atacante. Ignora tipo, defensa, STAB, crítico.

### `self-destruct` — Autodestrucción

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 200 | 100 | 5 | 0 | normal | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Caso especial.

**Mecánica implementada:** Daño estándar (físico, 200 de potencia). El atacante queda automáticamente a 0 HP tras el golpe.

### `sharpen` — Afilar

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 30 | 0 | normal | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Cambio de stats.

**Mecánica implementada:** Modifica stat `attack` del atacante en +1 stage.

### `sing` — Canto

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 55 | 15 | 0 | normal | status | 0 | 0 | 0 | sleep (0%) | 0% |

**Categoría en el motor:** Estado puro.

**Mecánica implementada:** Aplica el estado `sleep` al defensor con la precisión del movimiento como probabilidad de éxito.

### `skull-bash` — Cabezazo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 130 | 100 | 10 | 0 | normal | physical | 0 | 0 | 0 | — (100%) | 0% |

**Categoría en el motor:** Carga 2 turnos.

**Mecánica implementada:** T1: muestra «¡cargó!» y no ataca (el rival sí ataca). T2: ejecuta como movimiento de daño estándar.

**Notas:**
- ⚠️ **Gap:** la metadata declara `ailment=none (100%)` pero el motor NO lo aplica (no está en `SECONDARY_STATUS_CHANCE`).

### `sky-attack` — Ataque Aéreo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 140 | 90 | 5 | 0 | flying | physical | 1 | 0 | 30 | — (0%) | 0% |

**Categoría en el motor:** Carga 2 turnos.

**Mecánica implementada:** T1: muestra «¡cargó!» y no ataca (el rival sí ataca). T2: ejecuta como movimiento de daño estándar.

### `slam` — Atizar

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 80 | 75 | 20 | 0 | normal | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar.

### `slash` — Cuchillada

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 70 | 100 | 20 | 0 | normal | physical | 1 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Crit rate alto: 8× probabilidad base (≈ 50%).

### `sleep-powder` — Somnífero

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 75 | 15 | 0 | grass | status | 0 | 0 | 0 | sleep (0%) | 0% |

**Categoría en el motor:** Estado puro.

**Mecánica implementada:** Aplica el estado `sleep` al defensor con la precisión del movimiento como probabilidad de éxito.

### `sludge` — Residuos

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 65 | 100 | 20 | 0 | poison | special | 0 | 0 | 0 | poison (30%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño special. Aplica fórmula Gen I estándar. Efecto secundario: 30% de aplicar `poison` al objetivo.

### `smog` — Polución

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 30 | 70 | 20 | 0 | poison | special | 0 | 0 | 0 | poison (40%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño special. Aplica fórmula Gen I estándar. Efecto secundario: 40% de aplicar `poison` al objetivo.

### `smokescreen` — Pantalla Humo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 100 | 20 | 0 | normal | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Cambio de stats.

**Mecánica implementada:** Modifica stat `accuracy` del defensor en -1 stage.

### `solar-beam` — Rayo Solar

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 120 | 100 | 10 | 0 | grass | special | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Carga 2 turnos.

**Mecánica implementada:** T1: muestra «¡cargó!» y no ataca (el rival sí ataca). T2: ejecuta como movimiento de daño estándar.

### `sonic-boom` — Bomba Sónica

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 90 | 20 | 0 | normal | special | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño fijo.

**Mecánica implementada:** Daño = 20 PS fijos. Ignora tipo, defensa, STAB, crítico.

### `spike-cannon` — Clavo Cañón

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 100 | 15 | 0 | normal | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Golpea 2-5 veces (37.5% → 2, 37.5% → 3, 12.5% → 4, 12.5% → 5). Daño base recalculado solo una vez.

### `splash` — Salpicadura

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 40 | 0 | normal | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Sin efecto.

**Mecánica implementada:** El movimiento se ejecuta, se gasta 1 PP, se muestra «¡Pero no pasó nada!» y no aplica ningún efecto adicional.

### `spore` — Espora

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 100 | 15 | 0 | grass | status | 0 | 0 | 0 | sleep (0%) | 0% |

**Categoría en el motor:** Estado puro.

**Mecánica implementada:** Aplica el estado `sleep` al defensor con la precisión del movimiento como probabilidad de éxito.

### `stomp` — Pisotón

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 65 | 100 | 20 | 0 | normal | physical | 0 | 0 | 30 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Probabilidad de flinch 30% (el objetivo no actuará si el flinch llega antes que su turno).

### `string-shot` — Disparo Demora

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 95 | 40 | 0 | bug | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Cambio de stats.

**Mecánica implementada:** Modifica stat `speed` del defensor en -2 stage.

### `stun-spore` — Paralizador

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 75 | 30 | 0 | grass | status | 0 | 0 | 0 | paralysis (0%) | 0% |

**Categoría en el motor:** Estado puro.

**Mecánica implementada:** Aplica el estado `paralysis` al defensor con la precisión del movimiento como probabilidad de éxito.

### `submission` — Sumisión

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 80 | 80 | 20 | 0 | fighting | physical | 0 | -25 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Recoil 25% del daño infligido (golpea al usuario).

### `substitute` — Sustituto

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 10 | 0 | normal | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Estado no implementado.

**Notas:**
- ⚠️ **Gap Gen I:** debería gastar 1/4 del HP máximo y crear un «muñeco» con esos HP que absorbe el daño hasta romperse, protegiendo de estados secundarios y stat-drops. No hay ningún `substituteHpRef` en `PokemonEncounter.tsx`.

**Mecánica implementada:** **Sin gestor**. Cae a la rama final de movimientos de estado y devuelve `{isDebuff:true}` puro — no aplica ningún efecto al combate.

### `super-fang` — Superdiente

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 90 | 10 | 0 | normal | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Caso especial.

**Mecánica implementada:** Reduce HP actual del objetivo a la mitad (`floor(hp/2)`, mín. 1). Ignora tipo y defensa.

### `supersonic` — Supersónico

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 55 | 20 | 0 | normal | status | 0 | 0 | 0 | confusion (0%) | 0% |

**Categoría en el motor:** Confusión pura.

**Mecánica implementada:** Aplica el estado volátil `confusion` al objetivo: `2 + rand(4) = 2-5 turnos`. Falla si el objetivo está dormido.

### `swift` — Rapidez

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 60 | — | 20 | 0 | normal | special | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Caso especial.

**Mecánica implementada:** Bypass de tirada de precisión (accuracy = null). Daño estándar especial 60.

### `swords-dance` — Danza Espada

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 20 | 0 | normal | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Cambio de stats.

**Mecánica implementada:** Modifica stat `attack` del atacante en +2 stage.

### `tackle` — Placaje

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 40 | 100 | 35 | 0 | normal | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar.

### `tail-whip` — Látigo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 100 | 30 | 0 | normal | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Cambio de stats.

**Mecánica implementada:** Modifica stat `defense` del defensor en -1 stage.

### `take-down` — Derribo

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 90 | 85 | 20 | 0 | normal | physical | 0 | -25 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Recoil 25% del daño infligido (golpea al usuario).

### `teleport` — Teletransporte

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 20 | -6 | psychic | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Sin efecto.

**Mecánica implementada:** El movimiento se ejecuta, se gasta 1 PP, se muestra «¡Pero no pasó nada!» y no aplica ningún efecto adicional.

### `thrash` — Saña

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 120 | 100 | 10 | 0 | normal | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Caso especial.

**Mecánica implementada:** Al iniciarse fuera de modo Thrash: bloquea al usuario `2 + rand(2) = 2-3 turnos` repitiendo el mismo movimiento. Al terminar, aplica confusión `2 + rand(3) = 2-4 turnos`.

### `thunder` — Trueno

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 110 | 70 | 10 | 0 | electric | special | 0 | 0 | 0 | paralysis (30%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño special. Aplica fórmula Gen I estándar. Efecto secundario: 10% de aplicar `paralysis` al objetivo.

### `thunder-punch` — Puño Trueno

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 75 | 100 | 15 | 0 | electric | physical | 0 | 0 | 0 | paralysis (10%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Efecto secundario: 10% de aplicar `paralysis` al objetivo.

### `thunder-shock` — Impactrueno

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 40 | 100 | 30 | 0 | electric | special | 0 | 0 | 0 | paralysis (10%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño special. Aplica fórmula Gen I estándar.

**Notas:**
- ⚠️ **Gap:** la metadata declara `ailment=paralysis (10%)` pero el motor NO lo aplica (no está en `SECONDARY_STATUS_CHANCE`).

### `thunder-wave` — Onda Trueno

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | 90 | 20 | 0 | electric | status | 0 | 0 | 0 | paralysis (0%) | 0% |

**Categoría en el motor:** Estado puro.

**Mecánica implementada:** Aplica el estado `paralysis` al defensor con la precisión del movimiento como probabilidad de éxito.

### `transform` — Transformación

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 10 | 0 | normal | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Caso especial.

**Mecánica implementada:** Copia ID, sprite, tipos, stats y movimientos (PP=5 cada uno) del rival. Stages copiados.

### `tri-attack` — Triataque

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 80 | 100 | 10 | 0 | normal | special | 0 | 0 | 0 | unknown (20%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño special. Aplica fórmula Gen I estándar.

**Notas:**
- ⚠️ **Gap:** la metadata declara `ailment=unknown (20%)` pero el motor NO lo aplica (no está en `SECONDARY_STATUS_CHANCE`).

### `twineedle` — Doble Ataque

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 25 | 100 | 20 | 0 | bug | physical | 0 | 0 | 0 | poison (20%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Golpea 2 veces fijas (potencia por golpe; daño base recalculado solo una vez). Efecto secundario: 20% de aplicar `poison` al objetivo.

### `vice-grip` — Agarre

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 55 | 100 | 30 | 0 | normal | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar.

### `vine-whip` — Látigo Cepa

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 45 | 100 | 25 | 0 | grass | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar.

### `water-gun` — Pistola Agua

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 40 | 100 | 25 | 0 | water | special | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño special. Aplica fórmula Gen I estándar.

### `waterfall` — Cascada

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 80 | 100 | 15 | 0 | water | physical | 0 | 0 | 20 | — (0%) | 0% |

**Categoría en el motor:** Daño con efecto.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar. Probabilidad de flinch 20% (el objetivo no actuará si el flinch llega antes que su turno).

### `whirlwind` — Remolino

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 20 | -6 | normal | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Estado no implementado.

**Notas:**
- ⚠️ **Gap Gen I:** mismo objetivo que `roar` (huir/fallar). No implementado.

**Mecánica implementada:** **Sin gestor**. Cae a la rama final de movimientos de estado y devuelve `{isDebuff:true}` puro — no aplica ningún efecto al combate.

### `wing-attack` — Ataque Ala

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 60 | 100 | 35 | 0 | flying | physical | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar.

### `withdraw` — Refugio

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | 40 | 0 | water | status | 0 | 0 | 0 | — (0%) | 0% |

**Categoría en el motor:** Cambio de stats.

**Mecánica implementada:** Modifica stat `defense` del atacante en +1 stage.

### `wrap` — Constricción

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) | StatChance |
|---|---|---|---|---|---|---|---|---|---|---|
| 15 | 90 | 20 | 0 | normal | physical | 0 | 0 | 0 | trap (100%) | 0% |

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño physical. Aplica fórmula Gen I estándar.

**Notas:**
- ⚠️ **Gap:** la metadata declara `ailment=trap (100%)` pero el motor NO lo aplica (no está en `SECONDARY_STATUS_CHANCE`).


---

## 9. Movimientos especiales no aprendidos por nivel

### `struggle` — Forcejeo (fallback automático)

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Healing | Flinch% | Ail (meta) |
|---|---|---|---|---|---|---|---|---|---|---|
| 50 | — (null) | 1 | 0 | normal | physical | 0 | 0 | -25 | 0 | — (0%) |

**Origen:** `PokemonEncounter.tsx:3137` — cuando todos los moves del Pokémon activo tienen `pp <= 0`, el botón «LUCHAR» dispara `processBattle("struggle")` automáticamente.

**Categoría en el motor:** Daño.

**Mecánica implementada:** Acierta siempre (accuracy=null), aplica fórmula Gen I estándar como ataque físico tipo Normal de 50 de potencia.

**Notas:**
- ⚠️ **Bug:** la metadata declara recoil vía `meta.healing=-25`, pero `move-helper.ts` solo lee `meta.drain` (que está a 0). El recoil **no se aplica**: el usuario hace daño normal sin penalización al usar Forcejeo.
- En Gen I el recoil de Struggle es 1/4 del daño infligido.

### `surf` — Surf

| Pot | Prec | PP | Pri | Tipo | Clase | Crit | Drain | Flinch% | Ail (meta) |
|---|---|---|---|---|---|---|---|---|---|
| 90 | 100 | 15 | 0 | water | special | 0 | 0 | 0 | — (0%) |

**Origen:** Está referenciado como string en algún archivo de mapa, pero **ningún Pokémon de `pokemon-metadata.ts` lo aprende por nivel** y no hay MTs en el juego. Solo accesible por `metronome`.

**Categoría en el motor:** Daño.

**Mecánica implementada:** Movimiento de daño especial tipo Agua. Aplica fórmula Gen I estándar.

---

## 10. Movimientos invocables solo por Metrónomo

`metronome` selecciona un ID aleatorio uniformemente sobre los ~770 IDs que **no** son `metronome`, `struggle` ni `transform`. Esto incluye:

- Movimientos de Gen II+ (Crunch, Shadow Ball, Heat Wave, Air Slash, …) que se ejecutarán con su metadata Gen II/III (incluyendo daño físico/especial split que aquí no se respeta).
- Movimientos cuya categoría especial **no está implementada** en `move-helper.ts`. Ejemplos:
  - `protect`, `endure`, `detect`, `false-swipe` — caen al catch-all como debuff visual o daño plano.
  - `belly-drum`, `curse`, `mean-look`, `destiny-bond`, `perish-song` — sin efecto real.
  - `weather` (rain-dance, sunny-day, hail, sandstorm) — sin efecto.
  - `entry-hazards` (spikes, toxic-spikes, stealth-rock) — sin efecto.

Cuando Metrónomo invoca uno de esos, el mensaje será «Metrónomo (→ Nombre)» pero el efecto puede ser silencioso o un daño plano con la metadata bruta.

> Si el objetivo es respetar Gen I, una opción es filtrar `metronome` para que solo sortee sobre los 165 movimientos de Gen I (los que tienen `learnedBy` no vacío con Pokémon de ID ≤ 151, por ejemplo).
