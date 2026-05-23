# Pokemon Red/Blue: mapas y musica original

Fuentes tecnicas:

- `pret/pokered/constants/map_constants.asm`: IDs, anchura y altura de mapas.
- `pret/pokered/data/maps/songs.asm`: musica asignada a cada ID de mapa.
- `pret/pokered/data/maps/headers/Route23.asm`: conexiones de Route 23.

## Resumen

- Rojo/Azul tiene 248 IDs internos de mapa.
- 22 son `UNUSED_MAP_*` o mapas de tamano 0.
- Quedan 226 mapas concretos.
- Esos mapas concretos usan 24 constantes de musica de mapa.
- El catalogo completo esta en `public/editor/original-map-music.json`.

## Route 23

Route 23 si existe en el juego original:

- ID original: `ROUTE_23` (`$22`)
- Tamano original: `10x72`
- Conecta al norte con `INDIGO_PLATEAU` y al sur con `ROUTE_22`
- Musica original: `MUSIC_INDIGO_PLATEAU`
- Asset recomendado: `/game/music/maps-original/indigo-plateau.mp3`

En este proyecto no existe todavia `game-src/src/maps/route-23.ts` ni `MapId.Route23`.

## Tabla de musica por constante

| Constante original | Uso principal | Asset local |
|---|---|---|
| `MUSIC_PALLET_TOWN` | Pallet Town y casas iniciales | `/game/music/maps-original/pallet-town.mp3` |
| `MUSIC_CITIES1` | Viridian, Pewter, Saffron e interiores asociados | `/game/music/maps-original/viridian-city.mp3` |
| `MUSIC_CITIES2` | Cerulean, Fuchsia e interiores asociados | `/game/music/maps-original/cerulean-city.mp3` |
| `MUSIC_LAVENDER` | Lavender Town | `/game/music/maps-original/lavender-town.mp3` |
| `MUSIC_VERMILION` | Vermilion e interiores asociados | `/game/music/maps-original/vermilion-city.mp3` |
| `MUSIC_CELADON` | Celadon e interiores asociados | `/game/music/maps-original/celadon-city.mp3` |
| `MUSIC_CINNABAR` | Cinnabar e interiores asociados | `/game/music/maps-original/cinnabar-island.mp3` |
| `MUSIC_INDIGO_PLATEAU` | Route 23, Indigo Plateau, Lance/Champion rooms | `/game/music/maps-original/indigo-plateau.mp3` |
| `MUSIC_ROUTES1` | Routes 1-2 | `/game/music/maps-original/route-1.mp3` |
| `MUSIC_ROUTES2` | Routes 24-25 | `/game/music/maps-original/route-24-welcome.mp3` |
| `MUSIC_ROUTES3` | Routes 3-10 y 16-22 | `/game/music/maps-original/route-3.mp3` |
| `MUSIC_ROUTES4` | Routes 11-15 | `/game/music/maps-original/route-11.mp3` |
| `MUSIC_OAKS_LAB` | Oak's Lab | `/game/music/maps-original/pokemon-lab.mp3` |
| `MUSIC_POKECENTER` | Pokemon Centers y Marts | `/game/music/maps-original/pokemon-center.mp3` |
| `MUSIC_GYM` | Gimnasios y Dojo | `/game/music/maps-original/pokemon-gym.mp3` |
| `MUSIC_DUNGEON1` | Power Plant, Cerulean Cave, Rocket HQ | `/game/music/maps-original/rocket-hideout.mp3` |
| `MUSIC_DUNGEON2` | Viridian Forest, Seafoam Islands, Diglett's Cave | `/game/music/maps-original/viridian-forest.mp3` |
| `MUSIC_DUNGEON3` | Mt. Moon, Rock Tunnel, Victory Road interior | `/game/music/maps-original/mt-moon.mp3` |
| `MUSIC_GAME_CORNER` | Game Corner | `/game/music/maps-original/rocket-game-corner.mp3` |
| `MUSIC_SS_ANNE` | S.S. Anne | `/game/music/maps-original/ss-anne.mp3` |
| `MUSIC_POKEMON_TOWER` | Pokemon Tower | `/game/music/maps-original/pokemon-tower.mp3` |
| `MUSIC_SILPH_CO` | Silph Co. | `/game/music/maps-original/silph-co.mp3` |
| `MUSIC_CINNABAR_MANSION` | Pokemon Mansion | `/game/music/maps-original/pokemon-mansion.mp3` |
| `MUSIC_SAFARI_ZONE` | Safari Zone | `/game/music/maps-original/safari-zone.mp3` |

Nota importante: Victory Road interior usa `MUSIC_DUNGEON3`; Route 23 usa `MUSIC_INDIGO_PLATEAU`. En albumes, el tema de Indigo Plateau/Route 23 puede aparecer etiquetado como "Victory Road", pero en el motor original no corresponde a las plantas interiores de Victory Road.
