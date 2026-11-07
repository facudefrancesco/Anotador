# Anotador de juegos

App web instalable (PWA) para anotar partidas sin hacer cuentas. Funciona sin internet una vez instalada.

## Qué hay en la carpeta

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Menú principal con la lista de juegos |
| `games.js` | **La lista de juegos.** Acá se agregan los nuevos |
| `games/` | Una página por juego: La Base, Generala, Chinchón, Truco, 10.000, Escoba de 15 y Rummy |
| `common.js` / `common.css` | Base compartida de los juegos nuevos: jugadores, deshacer, historial, "seguir jugando" y estilo |
| `sw.js` | Guarda la app en el celular para usarla offline |
| `manifest.webmanifest` | Nombre, colores e ícono de la app instalada |
| `icons/` | Íconos de la app |

## Publicarla en GitHub Pages (una sola vez)

1. Entrá a github.com con tu cuenta (o creá una) y tocá **New repository**.
2. Nombre: por ejemplo `anotador`. Marcá **Public** y creá el repositorio.
3. Tocá **uploading an existing file** y arrastrá **todo el contenido** de esta carpeta (los archivos y las carpetas `games` e `icons`, no la carpeta que los contiene). Confirmá con **Commit changes**.
4. Andá a **Settings → Pages**. En *Source* elegí **Deploy from a branch**, rama **main**, carpeta **/ (root)** y guardá.
5. En uno o dos minutos la app queda en `https://TU-USUARIO.github.io/anotador/`.

## Instalarla en el celular

1. Abrí esa dirección en **Chrome** (con internet, la primera vez).
2. Tocá el botón **Instalar en el celular** del menú, o ⋮ → **Instalar app**.
3. Queda en la pantalla de aplicaciones con su ícono. Desde ahí anda sin internet.

Cada amigo puede instalarla en su celular con la misma dirección. Cada teléfono guarda sus propias partidas.

## Agregar un juego nuevo

1. Copiá un juego parecido de `games/` (por ejemplo `escoba.html` si se anota por manos) y cambiale el objeto `G`: nombre, clave, reglas y cómo se anota.
   - Con `common.js` ya tenés gratis los jugadores, deshacer, historial, "seguir jugando" y la pantalla final.
   - Usá una clave propia (por ejemplo `poker_v1`).
2. Agregá el juego en `games.js`:
   ```js
   { id: 'poker', name: 'Póker', icon: '🂮', desc: 'Fichas por mano', file: 'games/poker.html', key: 'poker_v1' }
   ```
3. En `sw.js` subí `VERSION` en 1 (por ejemplo de `2` a `3`).
4. Subí los archivos cambiados a GitHub (en el repositorio: **Add file → Upload files**).

## Actualizar

Cada vez que cambies algo, subí `VERSION` en `sw.js` y subí los archivos. Los celulares toman la versión nueva la próxima vez que abran la app con internet. Si no aparece, cerrala del todo y abrila de nuevo.

## Ojo con los datos

- Las partidas se guardan en el celular, dentro de la app. Si desinstalás la app o borrás los datos de Chrome, se pierden.
- Lo que tenías en los archivos `.html` sueltos no pasa a la app instalada: es otra dirección, así que arranca vacía.
