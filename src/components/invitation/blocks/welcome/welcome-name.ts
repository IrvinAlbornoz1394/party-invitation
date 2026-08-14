/**
 * El nombre de quien celebra, partido como lo necesita la papelería.
 *
 * Son dos funciones puras y sin React, aparte de los componentes, porque las usan tres
 * variantes distintas —el sello del sobre, el monograma y la portada de filigrana— y porque son
 * lo único de este bloque que puede equivocarse en silencio: un monograma mal cortado sale
 * grabado en el centro de la pantalla, a cuerpo 90, y nadie lo ve hasta que lo ve un invitado.
 */

/**
 * Los conectores que unen dos nombres y **no** son un nombre.
 *
 * Están aquí por un fallo concreto: «Ana & Diego» daba «A D» y «Ana y Diego» daba «A Y», porque
 * la «y» sobrevive a un corte por espacios como cualquier otra palabra. Las dos formas se
 * escriben igual de a menudo, y el sello de una boda con una «Y» grabada en medio no es un
 * detalle menor: es el centro de la pantalla.
 */
const CONNECTORS = new Set(['y', 'e', 'and', 'con']);

/** Las palabras del nombre que cuentan: sin símbolos, sin conectores, sin espacios. */
function nameWords(name: string, lastName: string | null): readonly string[] {
  return `${name} ${lastName ?? ''}`
    .split(/[\s&+·,.]+/)
    .filter((word) => /\p{L}/u.test(word) && !CONNECTORS.has(word.toLocaleLowerCase('es')));
}

/**
 * Las dos iniciales: «A D» en «Ana & Diego», «R V» en «Renata Villanueva».
 *
 * `Array.from` y no `[0]` para cortar la primera letra: en una cadena, `[0]` devuelve media letra
 * cuando el nombre empieza por un carácter fuera del plano básico, y ahí sale un rombo.
 *
 * Un nombre sin una sola letra —«&», un emoji— devolvería vacío, y un hueco en mitad de un sello
 * se ve como una imagen que no cargó; en ese caso cae al primer carácter del nombre, sea el que
 * sea.
 */
export function initials(name: string, lastName: string | null, separator = ' '): string {
  const words = nameWords(name, lastName).slice(0, 2);

  if (words.length === 0) return Array.from(name)[0] ?? '';

  return words.map((word) => Array.from(word)[0].toLocaleUpperCase('es')).join(separator);
}

/**
 * Los dos nombres de una pareja, si el contenido trae una: «Ana & Diego» → `['Ana', 'Diego']`.
 *
 * Devuelve `null` cuando no hay dos partes claras, y ese es el caso que importa: el monograma a
 * dos letras con una «&» en medio solo tiene sentido para una boda. Con «Renata» —unos XV— hay
 * que pintar otra cosa, y esta función es la que deja que la variante lo decida sin preguntar
 * por el tipo de evento, que es lo que el catálogo prohíbe.
 *
 * Solo parte por los símbolos de unión, nunca por espacios: «Valentina Sofía» es **un** nombre,
 * y cortarlo por el espacio produciría «V S», que no es un monograma de pareja sino un error.
 */
export function couple(name: string): readonly [string, string] | null {
  const parts = name
    .split(/\s*(?:&|\+|\by\b|\be\b)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length === 2 ? [parts[0], parts[1]] : null;
}
