# Contenido narrativo — "Pokémon Boda" (borrador para revisar en el Map Editor)

Guión de contenido para meter a mano desde el map-editor. **No inventa mecánicas
nuevas**: solo entrenadores, NPCs, diálogos, equipos y ambientación (estilo
Pokémon Rojo). Los gimnasios funcionan como los originales (entrenadores → líder
→ medalla). Diálogos cortos, humor y guiños a la boda, amigos y familia.

## Cómo usar este documento

- Cada entrenador indica su **clase** = un `NpcType` que YA existe (usa esos, no
  inventes sprites). Clases disponibles: `ash, oak, rival, beauty, birdKeeper,
  blackBelt, bugCatcher, burglar, channeler, aceTrainerMale, aceTrainerFemale,
  cueBall, engineer, fisher, gambler, gentleman, hiker, jrTrainerMale,
  jrTrainerFemale, juggler, lass, pokeManiac, psychic, rocker, teamRocketGrunt,
  sailor, scientist, superNerd, swimmer, tamer, youngster, biker, brock, misty,
  ltSurge, erica, koga, sabrina, blaine, giovanni`.
- **NPC sin combate** = entrenador con `intro: []` (solo diálogo al pulsar A).
- **Equipos**: IDs y niveles Gen I+II. Ajusta niveles a tu curva; los propongo
  coherentes con la progresión (Celeste ~18-24, Bodega ~30-38, Carmín ~28-34).
- **Nombres de lugar** son libres; los de archivo/mapa NO se tocan (los pones tú).

### Orientación (zona ↔ mapa base del juego)

| Zona del guión | Mapa base |
|---|---|
| Ciudad Celeste | Cerulean City (+ gimnasio, centro, tienda, casas) |
| Ruta hacia Bill | Rutas 24 y 25 (norte de Celeste) |
| Casa de Bill (el fotógrafo) | Casa al final de la Ruta 25 |
| Bodega Ancestral | Cueva Celeste (Cerulean Cave) |
| Ruta hacia Ciudad Carmín | Rutas 5/6 (Celeste → Carmín) |
| La Huerta de Goñi | La guardería (Ruta 5) |
| Ciudad Carmín | Vermilion City (+ gimnasio, etc.) |

### Nota sobre el ambiente de Carmín y su ruta (resolución del brief)

El brief pedía a la vez "ruta costera/veraniega" y "ruta de preparación de
creadores" (makers/devs/fotógrafos). Se han **fusionado**: la Ruta a Carmín y
Carmín son **costa mediterránea de verano** cuya gente son **creadores** (monta
el chiringuito, edita fotos en la playa, mueve el logo dos píxeles bajo la
sombrilla). Equipos de playa (Krabby, Staryu, Tentacool, Corsola…) mezclados con
equipos tech (Porygon, Magnemite, Voltorb, Ditto, Unown…). Cámbialo si prefieres
uno puro.

---

# 1. CIUDAD CELESTE — "La ciudad tomada por el Hyrox" (Bilbao)

## Ambientación

Bilbao no está inundada de agua: está **inundada de atletas**. Toda la ciudad
gira en torno a una competición Hyrox. Corredores con dorsal por todas partes,
voluntarios con cajas de plátanos, jueces con crono, fisios estirando a gente en
plena calle, familiares con pancartas. Ruido de sled y de gente sufriendo. El
agua del mapa original se reinterpreta como "la zona de recuperación / baños de
hielo". Humor constante sobre el sufrimiento deportivo.

## NPC sin combate

| Nombre | Clase | Ubicación | Diálogo |
|---|---|---|---|
| Voluntario Kepa | `youngster` | Entrada sur | "¿Dorsal? ¿No? Entonces… ¿qué haces con energía?" |
| Fisio Amaia | `beauty` | Junto al centro | "Si todavía puedes hablar, es que no has calentado." |
| Corredora Nerea | `lass` | Plaza central | "Llevo cuatro estaciones y sigo sin encontrar la meta." |
| Juez de estación | `gentleman` | Junto al gimnasio | "Burpee mal hecho. Repetición no contada. Siguiente." |
| Señor del hielo | `hiker` | Zona de recuperación | "El baño de hielo debería ser ilegal. Vuelvo ahora." |
| Familiar animando | `beauty` | Gradas improvisadas | "¡VAMOS CAMPEÓN! …¿ese no era el mío? Da igual, ¡VAMOS!" |
| Atleta reventado | `blackBelt` | Sentado en el suelo | "Vine a por una medalla. Me llevo dos ampollas." |
| Fotógrafo de meta | `superNerd` | Línea de meta | "He hecho 800 fotos de gente llorando. Arte puro." |
| Cronometrador | `engineer` | Puesto de salida | "Tu tiempo es… mejóralo. Es gratis el consejo." |
| Vendedor de plátanos | `gambler` | Esquina | "Plátano, sal, y a seguir. La vida es simple, colega." |

## Entrenadores

> Todos presumen de "Tipo Hyrox" y sueltan pullas al CrossFit y a los runners,
> sintiéndose superiores. Mecánicamente **tipo Lucha**.

**1. Atleta Hyrox Iker** · `blackBelt`
- Equipo: Machop Lv18, Mankey Lv18
- Antes: "¿Tú corres maratones? Qué monada. Yo arrastro trineos."
- Después: "Ganas… pero seguro que no sabes hacer un wall ball."

**2. Competidora Leire** · `jrTrainerFemale`
- Equipo: Poliwhirl Lv19, Machoke Lv20
- Antes: "Un runner me dijo 'esto es fácil'. Ya no está entre nosotros."
- Después: "Vale, vale… pero eso NO es funcional."

**3. Juez implacable** · `gentleman`
- Equipo: Hitmonchan Lv20, Hitmonlee Lv20
- Antes: "Rango de movimiento incompleto. Empezamos de cero."
- Después: "Repetición… válida. Enhorabuena, supongo."

**4. Voluntario picado** · `cueBall`
- Equipo: Primeape Lv21
- Antes: "Solo doy agua, pero también reparto collejas gratis."
- Después: "Te has ganado el gatorade. No el de los buenos."

**5. Runner infiltrado** · `youngster`
- Equipo: Rapidash Lv19, Doduo Lv18
- Antes: "Yo solo corro, ¿vale? No me hagáis levantar peso."
- Después: "¡Lo sabía! Esto NO era lo mío."

## Líder de Gimnasio — SERGIO & MARTA (otra vez)

**Personalidad**: Sergio y Marta han hecho **escala en Bilbao camino de Japón**
para competir. Van sobradísimos, en plan "esto lo hacemos con los ojos cerrados",
metiéndose con runners y CrossFitters por igual. Cariñosos pero insoportablemente
en forma. Tipo Hyrox (Lucha).

- Equipo: Machamp Lv23, Primeape Lv22, Hitmontop Lv23, Heracross Lv24
- Antes:
  - SERGIO: "¡Anda, si eres tú! Marta, mira quién se ha colado en nuestra estación."
  - MARTA: "Nosotros paramos aquí de camino a Japón. Un roto para un descosido."
  - SERGIO: "Última pulla y competimos: un runner es un Hyrox que se rindió pronto."
- Derrota:
  - MARTA: "¡Buah! Y encima sin calentar tú. Qué vergüenza para el gremio."
  - SERGIO: "Toma la MEDALLA CELESTE. Te la has currado más que muchos con dorsal."
  - (Entrega: medalla del gimnasio + TM, como el original.)

---

# 2. RUTA HACIA BILL — "La resaca post-boda" (Rutas 24/25)

## Ambientación

El día después de la boda. Ambiente relajado, sol de mediodía, ropa de fiesta
arrugada. Gente paseando en parejas, invitados con resaca monumental, alguno
vomitando discretamente en un arbusto, otros reconstruyendo la noche. Se busca el
ramo, se busca un coche, se busca la dignidad. Algún corredor del Hyrox que se ha
perdido y ha acabado aquí. Mucho NPC sin combate; unos cuantos con combate
(invitados "que necesitan estirar las piernas").

## NPC sin combate

| Nombre | Clase | Ubicación | Diálogo |
|---|---|---|---|
| Invitado resacoso | `gambler` | Inicio de ruta | "Ayer dije que bailaba bien. Hoy no me creo nada." |
| Pareja paseando (él) | `gentleman` | Puentecito | "Qué boda más bonita… ¿tú de parte de quién eras?" |
| Pareja paseando (ella) | `beauty` | Puentecito | "De la novia. Creo. O del vino. Uno de los dos." |
| El del arbusto | `youngster` | Tras un árbol | "No preguntes. Sigue caminando. Por favor." |
| Buscadora del ramo | `lass` | Zona de flores | "¡Cogí el ramo y lo solté! ¿Ahora me caso o no?" |
| El del coche perdido | `superNerd` | Parking improvisado | "Sé que aparqué. Lo que no sé es en qué provincia." |
| Tía Charo | `beauty` | Banco a la sombra | "Yo a tu edad ya estaba casada. Y con dos. ¡Es broma! …¿o no?" |
| Corredor Hyrox perdido | `blackBelt` | Cruce | "¿La meta es por aquí? Llevo desde ayer. ¿Esto es Bilbao?" |
| Camarero desmontando | `sailor` | Junto a mesas | "Sobró tarta. Repito: SOBRÓ TARTA. Es el milagro del año." |
| Primo filósofo | `hiker` | Colina | "Una boda es como una ruta: larga, con baches, y mereció la pena." |
| Niño con pajarita | `youngster` | Camino | "Me dijeron que no me manchara. Mírame. Mírame bien." |

## Entrenadores

**1. Invitado que "necesita estirar" · `gentleman`**
- Equipo: Growlithe Lv22, Pidgeotto Lv22
- Antes: "Necesito quemar la barra libre de ayer. ¿Me ayudas?"
- Después: "Uf. Creo que he sudado vino. Gracias, campeón."

**2. Damas de honor competitivas · `aceTrainerFemale`**
- Equipo: Clefairy Lv21, Jigglypuff Lv21, Bellossom Lv22
- Antes: "Cogimos el ramo entre las tres. Esto lo arreglamos combatiendo."
- Después: "Vale, quédate tú el ramo. Nosotras nos quedamos la barra."

**3. Cuñado envalentonado · `biker`**
- Equipo: Koffing Lv22, Grimer Lv23
- Antes: "En la boda dije que era el más duro. Toca demostrarlo, cuñao."
- Después: "…me piro antes de que se lo cuentes a nadie."

**4. Fotógrafo de exteriores · `superNerd`**
- Equipo: Porygon Lv23, Magnemite Lv22
- Antes: "Un combate rápido para la galería. ¡Sonríe al perder!"
- Después: "Esta foto de tu victoria… la subo con filtro."

**5. Ex del novio (incómodo) · `beauty`**
- Equipo: Persian Lv24
- Antes: "Vine a la boda 'de casualidad'. Ya que estoy, combatimos."
- Después: "Enhorabuena a los novios. De verdad. Casi de verdad."

---

# 3. CASA DE BILL — "El fotógrafo desbordado" (final de la Ruta 25)

## Ambientación

Bill ya no es Bill: es **el fotógrafo de nuestra boda**. La casa es un caos
precioso: cámaras colgando, objetivos por el suelo, torres de tarjetas SD, álbumes
a medio montar, fotos pegadas en TODAS las paredes, un disco duro parpadeando
angustiosamente. Tiene **miles de fotos sin ordenar** y está al borde del colapso
creativo. Solo conversaciones, sin mecánicas nuevas.

## NPC sin combate

**Bill (el fotógrafo)** · `superNerd` · centro de la casa
- Al hablar (primera vez):
  - "¡Ah! ¡Los novios! No, no me abracéis, tengo las manos ocupadas de tarjetas."
  - "Tengo 14.000 fotos vuestras. CATORCE MIL. Y la buena… sé que está ahí."
  - "¿Sabéis lo que es ver 200 fotos del mismo beso? Yo sí. Ahora sí."
- Al volver a hablar (estático):
  - "Sigo ordenando. He llegado a la foto 3.812. Salíais parpadeando. Los dos."
  - "Backup del backup del backup. Si peta, me caso yo con vosotros de la pena."

## NPC sin combate (secundarios en la casa)

| Nombre | Clase | Ubicación | Diálogo |
|---|---|---|---|
| Ayudante agotada | `lass` | Junto al ordenador | "Llevo etiquetando desde el banquete. ¿Qué día es hoy?" |
| El del dron | `engineer` | Ventana | "El dron grabó todo. También cómo se me caía el dron." |
| Tía que sale en todas | `beauty` | Pared de fotos | "En esta salgo yo. Y en esta. Y… anda, en esta también." |

(Sin entrenadores: es una casa de descanso narrativo, como la de Bill original.)

---

# 4. BODEGA ANCESTRAL — "La cepa prohibida" (Cueva Celeste)

## Ambientación

No es una cueva húmeda: es una **bodega ancestral** excavada en la roca. Silencio,
goteo lento, olor a barrica y a tiempo. Pasillos de botelleros infinitos, alguna
vela, polvo dorado en el aire. Pocos entrenadores, pero **fuertes**: catadores y
guardianes obsesionados con una leyenda, **la cepa prohibida**. Misterio y vino.
Al fondo, algo brilla entre las barricas más viejas. Ambientación sobria; se
explica poco (encuentro legendario).

## NPC sin combate

| Nombre | Clase | Ubicación | Diálogo |
|---|---|---|---|
| Viejo bodeguero | `hiker` | Entrada | "Baja despacio. Aquí el vino y las prisas no se llevan." |
| Catadora en trance | `psychic` | Pasillo 1 | "Notas de fruta… de roble… y de algo que no debería existir." |
| Guardián silencioso | `blackBelt` | Cruce | "…" (te mira y asiente hacia el fondo) |
| Sumiller perdido | `gentleman` | Rincón | "Entré a por una botella. Eso fue… ¿en 2019?" |

## Entrenadores (pocos y fuertes)

**1. Catador Obseso · `pokeManiac`**
- Equipo: Golbat Lv32, Haunter Lv33, Crobat Lv34
- Antes: "Busco la cepa prohibida. Quien estorba, se decanta."
- Después: "Bebes mejor de lo que combato. Y eso me duele."

**2. Guardiana de la Barrica · `aceTrainerFemale`**
- Equipo: Nidoqueen Lv34, Gengar Lv35
- Antes: "Nadie llega al fondo sin pasar por mí. Ni sobrio ni borracho."
- Después: "Pasa… pero no toques la última barrica. Esa es SUYA."

**3. El Último Sumiller · `superNerd`**
- Equipo: Weezing Lv34, Nidoking Lv36
- Antes: "Cuarenta años buscando ese sabor. Tú no me lo vas a quitar."
- Después: "Quizá… quizá el secreto no era el vino. Qué tontería he dicho."

## Encuentro legendario — CELEBI (fondo de la bodega)

**Ambientación**: entre las barricas más antiguas, una luz verde flota sin prisa.
El aire huele dulce. No hay diálogo largo: hay presencia.

- Texto previo (al acercarse):
  - "Entre las barricas más viejas, algo diminuto flota en la penumbra."
  - "Huele a mosto, a bosque… y a suerte."
  - "CELEBI te mira. Parece que llevara esperándote toda la vida."
- (Combate/encuentro salvaje como cualquier legendario.)
- Texto posterior (si huye o tras el encuentro):
  - "CELEBI gira sobre sí mismo y la bodega entera huele a vino bueno."
  - "Dicen que donde aparece, nunca falta una copa que compartir."

> Guiño personal: Celebi = el pequeño legendario que nos llena la vida de vino.
> No lo expliques en el juego; que se sienta, no que se cuente.

---

# 5. RUTA HACIA CIUDAD CARMÍN — "Costa de creadores" (Rutas 5/6)

## Ambientación

Dejamos atrás el Hyrox y el vino. Ahora: **mar, verano y gente creando**. Paseo
marítimo, chiringuitos, sombrillas, olor a crema solar. Pero los veraneantes son
**creadores en modo vacaciones-que-no-desconectan**: un fotógrafo revisando 4.000
fotos en la arena, una diseñadora moviendo un logo dos píxeles bajo la sombrilla,
un programador jurando que "solo es un bug más". Costa mediterránea + preparación
creativa. Mucho NPC que habla entre sí, muchos entrenadores variados.

## NPC sin combate

| Nombre | Clase | Ubicación | Diálogo |
|---|---|---|---|
| Fotógrafo de playa | `superNerd` | Orilla | "He hecho 4.000 fotos y ninguna es la buena. Una más." |
| Diseñadora bajo sombrilla | `beauty` | Chiringuito | "Llevo tres horas moviendo este logo dos píxeles. Perfecto." |
| Programador en chanclas | `engineer` | Paseo | "Solo es un bug más. Lo he dicho 14 veces. Va la 15." |
| Músico callejero | `rocker` | Paseo marítimo | "¿Propina o petición? Por dos monedas te toco lo que sea." |
| Familia veraneante | `gentleman` | Toallas | "Niños, la sombrilla NO es una espada. …vale, un rato." |
| Ciclista sudado | `biker` | Carril bici | "De Celeste a Carmín en bici. ¿La cuesta? ¡Qué cuesta!" |
| Yaya con nevera | `beauty` | Banco | "¿Has comido? ¿Seguro? Toma tortilla. Y toma otra." |
| Surfista zen | `swimmer` | Rompiente | "No hay olas, tío. Pero el mar siempre tiene razón." |
| Impresor 3D | `scientist` | Furgo camper | "Llevo 6 horas imprimiendo un soporte. Falló al 98%." |

## Entrenadores

**1. Pescador de siempre · `fisher`**
- Equipo: Krabby Lv26, Tentacool Lv26, Corsola Lv27
- Antes: "Vengo aquí desde crío. Al mar se le respeta, chaval."
- Después: "Buena mano. ¿Seguro que no eres de puerto?"

**2. Diseñadora perfeccionista · `beauty`**
- Equipo: Unown Lv26, Porygon Lv28
- Antes: "Muevo el logo, lo devuelvo, lo muevo… ¡combate, que despejo!"
- Después: "Vale. AHORA sí que lo dejo centrado. Casi."

**3. Programador de vacaciones · `superNerd`**
- Equipo: Magnemite Lv27, Voltorb Lv27, Porygon Lv28
- Antes: "En producción todo peta. Aquí al menos peto yo primero."
- Después: "Reproducido el fallo: era yo. Siempre soy yo."

**4. Socorrista chulesco · `swimmer`**
- Equipo: Staryu Lv27, Poliwhirl Lv28
- Antes: "Vigilo la playa y a los que se creen Michael Phelps."
- Después: "Tú nadas… en batallas. En el agua ya veríamos."

**5. Trío de amigos veraneantes · `youngster`**
- Equipo: Marill Lv26, Wooper Lv26
- Antes: "El último en perder paga las cañas. ¡Y voy a perder yo!"
- Después: "Cañas para todos. Menos para mí, que invito. Qué ruina."

**6. Grafitero costero · `rocker`**
- Equipo: Grimer Lv27, Koffing Lv28
- Antes: "Le puse color a este muro. Ahora te pongo color a ti."
- Después: "Respeto. Te dedico el próximo mural, artista."

---

# 6. LA HUERTA DE GOÑI — "La guardería que da bebés" (Ruta 5)

## Ambientación

La guardería es ahora **La Huerta de Goñi**: bancales de tomates, pimientos
colgando, un gallinero al fondo, un espantapájaros con boina. Goñi y su pareja
**Bea** lo llevan todo con calma de pueblo, hablando de criar Pokémon como quien
habla de criar tomates. Huele a tierra mojada.

## Mecánica (YA IMPLEMENTADA — "el bebé del día")

- Habla con **Goñi** (spot `dayCareNpc` del mapa, colócalo en el editor sobre su
  casilla) y **una vez al día** te regala un **Pokémon bebé** aleatorio.
- El bebé del día es **determinista por jugador y fecha**: cada invitado ve uno
  distinto, y el mismo invitado ve el mismo todo el día. Cambia a medianoche.
- Solo **bebés** (nunca evoluciones ni legendarios): Pichu, Cleffa, Igglybuff,
  Togepi, Tyrogue, Smoochum, Elekid, Magby. Se entregan a **nivel 5**.
- Tras cogerlo, Goñi pasa a diálogo **estático** hasta el día siguiente.
- Para activarlo: en el editor, modo **Spots → "Guardería (Goñi)"**, y coloca el
  punto sobre la casilla de Goñi (más un NPC/entrenador con su sprite ahí).

## Diálogos de Goñi (los gestiona la mecánica, aquí van de referencia)

- Oferta del día: "GOÑI: ¡Hoy ha brotado un {POKÉMON}! ¿Te lo llevas?"
- Al aceptar: "¡{POKÉMON} es tuyo!" / "GOÑI: Cuídalo como a un buen tomate, ¿eh?"
- Al rechazar: "GOÑI: Aquí seguirá, madurando."
- Ya recogido hoy: "GOÑI: Ya te llevaste la cosecha de hoy." / "Vuelve mañana,
  que hay otro madurando."

## NPC sin combate (ambiente de huerta ↔ crianza Pokémon)

| Nombre | Clase | Ubicación | Diálogo |
|---|---|---|---|
| Goñi (charla extra) | `gentleman` | Junto a los tomates | "Un Pokémon también necesita buenos tomates, ¿eh?" |
| Bea | `beauty` | En el gallinero | "Aquí todo crece: unos entrenan… otros maduran." |
| Bea (otra) | `beauty` | Regando | "Riega poco y a menudo. Como el cariño, majo." |
| Goñi (otra) | `gentleman` | En el bancal | "¿Ves este pimiento? Paciencia y sol. Como un Larvitar." |
| Peón de la huerta | `youngster` | Junto al pozo | "Goñi le habla a las gallinas. Y le RESPONDEN, te juro." |
| Vecina curiosa | `lass` | Valla | "Bea cría bichos y hortalizas. No sé cuál sale mejor." |

(Opcional 1 entrenador suave a la entrada, si quieres combate:)

**Hortelano celoso · `youngster`**
- Equipo: Bellsprout Lv8, Oddish Lv8
- Antes: "De mi huerta no sale ni un tomate sin combatir. ¡Ni de coña!"
- Después: "Está bien, está bien… llévate un tomate. Pero solo uno."

---

# 7. CIUDAD CARMÍN — "La ciudad de los creadores" (Vermilion, en verano)

## Ambientación

Carmín tiene **identidad propia**: ni puerto militar ni industria. Es una ciudad
**viva, veraniega y creativa**. Terrazas llenas, música en cada esquina, gente en
chanclas con portátil, murales, un mercadillo de makers, olor a mar y a café.
Amigos de vacaciones que "solo iban a mirar el móvil un momento". Buen rollo,
verano, creación. El gimnasio sigue siendo **un gimnasio Pokémon normal**
(entrenadores → líder → medalla), tematizado de estudio creativo/maker.

## NPC sin combate

| Nombre | Clase | Ubicación | Diálogo |
|---|---|---|---|
| Barista con arte latte | `beauty` | Terraza | "Te dibujo un Pikachu en la espuma. Cobrar, cobro igual." |
| Maker del mercadillo | `engineer` | Puesto | "Impreso en 3D, pintado a mano, y aún así no vendo. ¡Vacaciones!" |
| DJ de chiringuito | `rocker` | Paseo | "Pincho de todo menos lo que me piden. Es mi arte, tío." |
| Grupo de amigos | `gentleman` | Terraza grande | "Quedamos para desconectar y llevamos 2h hablando de curro." |
| Ilustradora | `lass` | Bajo una palmera | "Dibujo a la gente de la terraza. Tú sal quieto, ¿vale?" |
| Streamer de viaje | `superNerd` | Esquina | "Directo desde Carmín. Saluda… ¡has salido en pantalla!" |
| Turista despistado | `hiker` | Plaza | "¿El puerto militar? Me dijeron que ahora es un chill-out." |
| Camarero veloz | `sailor` | Terraza | "Seis cañas, dos bravas y un vermut. ¡MARCHANDO!" |
| Abuela del barrio | `beauty` | Balcón | "En mi época esto era un puerto. Ahora es… bonito, oye." |

## Entrenadores (mezcla creadores + costa)

**1. Fotógrafo pro · `superNerd`**
- Equipo: Porygon Lv29, Magnemite Lv29
- Antes: "Disparo en ráfaga. En combate y con la cámara."
- Después: "Esta derrota tuya… digo mía… queda genial en la galería."

**2. Diseñadora UI · `beauty`**
- Equipo: Unown Lv29, Porygon2 Lv31
- Antes: "Si el combate no está centrado y alineado, no empiezo."
- Después: "Pixel perfect. Mi derrota, digo. Impecable."

**3. Programador senior · `engineer`**
- Equipo: Magneton Lv31, Voltorb Lv30, Electrode Lv30
- Antes: "Funciona en mi máquina. Veamos si funciona contra ti."
- Después: "Vale, era un caso límite. Añado un test y me piro."

**4. Músico de terraza · `rocker`**
- Equipo: Jigglypuff Lv30, Chansey Lv29
- Antes: "Una canción, un combate. Los dos te van a dejar sordo."
- Después: "Bises no hay. La derrota fue en directo, sin autotune."

**5. Sailor de siempre · `sailor`**
- Equipo: Tentacruel Lv31, Kingler Lv31
- Antes: "Puerto o no puerto, el mar sigue siendo mío, grumete."
- Después: "Bien jugado. Invito a un vermut en la terraza."

**6. Gemelas maker · `lass`**
- Equipo: Voltorb Lv29, Magnemite Lv29 / (2ª) Ditto Lv30
- Antes: "Imprimimos, soldamos y ganamos. En ese orden."
- Después: "Nos vamos al chiringuito. Tú invitas, perdedor."

## Líder de Gimnasio — "EL CREADOR" (placeholder de nombre — ponle un amigo)

> Original: Lt. Surge (eléctrico). Aquí: dueño de un **estudio creativo/maker**
> en Carmín. Eléctrico/tech encaja perfecto (Magnemite, Voltorb, Porygon). Ponle
> el nombre de un amigo del mundo del diseño/dev; dejo un nombre de relleno.

**Personalidad**: chulesco pero majo, tipo "yo esto lo monté en un finde". Habla
en frases de brief creativo. Muy de "el deadline era ayer".

- Equipo: Magneton Lv32, Electrode Lv32, Porygon2 Lv33, Raichu Lv34
- Antes:
  - "¿Vienes sin brief? Valiente. Aquí improvisamos y encima ganamos."
  - "Te aviso: mi equipo está optimizado, versionado y con backup."
- Derrota:
  - "Vaya… esto no estaba en el roadmap."
  - "Toma la MEDALLA (la de Carmín). Te la has renderizado en tiempo récord."
  - (Entrega: medalla + TM, como el original.)

---

## Resumen de guiños personales usados

- **Sergio y Marta**: líderes del gimnasio de Celeste, de camino a Japón a competir Hyrox.
- **Goñi y Bea**: La Huerta de Goñi (guardería), crían Pokémon como hortalizas.
- **Bill = el fotógrafo de la boda**: sepultado bajo 14.000 fotos.
- **Celebi**: el pequeño legendario "que nos llena la vida de vino", al fondo de la Bodega Ancestral.
- **La boda**: toda la Ruta hacia Bill (resacas, ramo, coche perdido, tía Charo, primo filósofo).
- **Hyrox / deporte**: Ciudad Celeste entera.
- **Creadores (dev/diseño/foto/maker)**: Ruta a Carmín y Ciudad Carmín.
