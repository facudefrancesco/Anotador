/*
  LISTA DE JUEGOS
  Para sumar un juego nuevo:
    1. Poné su página en la carpeta games/ (por ejemplo games/poker.html).
       Lo más fácil es copiar uno hecho con common.js (chinchon.html, escoba.html…).
    2. Agregá una entrada acá abajo.
    3. En sw.js subí el número de VERSION.
  Campos:
    id     identificador corto, sin espacios
    name   nombre que se ve en el menú
    art    (opcional) imagen que se ve al costado en el menú (SVG o PNG en art/)
    icon   un emoji (se usa si no hay imagen)
    desc   descripción corta
    file   ruta de la página
    key    (opcional) clave de localStorage donde el juego guarda la partida en curso,
           para mostrar "Partida en curso" en el menú
*/
self.GAMES = [
  { id: 'generala', name: 'Generala',     art: 'art/generala.svg', icon: '🎲', desc: 'Dados · Triplona, Simple u Obligada · de 2 a 8', file: 'games/generala.html', key: 'generala_v2' },
  { id: 'la-base',  name: 'La Base',      art: 'art/la-base.svg',  icon: '🂡',  desc: 'Cartas españolas · de 2 a 7 jugadores',          file: 'games/la-base.html',  key: 'labase_v1' },
  { id: 'truco',    name: 'Truco',        art: 'art/truco.svg',    icon: '🗡️', desc: '1 vs 1, 2 vs 2 o 3 vs 3 · a 30 con fósforos',  file: 'games/truco.html',    key: 'truco_v1' },
  { id: 'rummy',    name: 'Rummy',        art: 'art/rummy.svg',    icon: '♠️', desc: 'Baraja francesa · a 1.000',                      file: 'games/rummy.html',    key: 'rummy_v1' },
  { id: 'escoba',   name: 'Escoba de 15', art: 'art/escoba.svg',   icon: '🧹', desc: 'Cartas españolas · a 15',                        file: 'games/escoba.html',   key: 'escoba_v1' },
  { id: 'chinchon', name: 'Chinchón',     art: 'art/chinchon.svg', icon: '🃏', desc: 'Cartas españolas · a 100 con reenganche',        file: 'games/chinchon.html', key: 'chinchon_v1' },
  { id: 'diez-mil', name: '10.000',       art: 'art/diez-mil.svg', icon: '🎯', desc: 'Dados · mínimo 750 para entrar',                 file: 'games/diez-mil.html', key: 'diezmil_v1' }
];
