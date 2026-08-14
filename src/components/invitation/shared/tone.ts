/**
 * Sobre qué está apoyado un elemento.
 *
 * La cuenta regresiva, un botón o una línea de fecha se ven distintos encima de una fotografía
 * que encima del papel del tema: en la foto hacen falta contraste propio y un velo detrás; en
 * el papel, el color de tinta del tema y un filete.
 *
 * Es una decisión de **composición**, no de tema: la misma portada partida apoya su contenido
 * en el papel aunque el tema sea oscuro. Por eso la elige la variante y no el tema, y por eso
 * son dos valores nombrados y no un booleano `isDark` — que se leería como una propiedad del
 * tema y acabaría usándose para preguntarle cosas al tema desde el componente.
 */
export type Tone = 'onImage' | 'onSurface';
