import type { Actor } from './actor';

/**
 * Sesión del panel: el token opaco que viaja en la cookie y su duración.
 *
 * No es un JWT, y no por descuido. Un JWT no se puede revocar sin una lista negra en
 * base de datos, y si de todas formas hay que ir a la base de datos en cada petición,
 * el JWT solo añade criptografía que auditar. Con un token opaco, cerrar sesión o
 * desactivar una cuenta tiene efecto en la petición siguiente, que es lo que un
 * administrador espera cuando le quita el acceso a alguien.
 */

/**
 * 32 bytes = 256 bits de entropía real del CSPRNG.
 *
 * Bien por encima de lo necesario, pero un token de sesión es la credencial más
 * valiosa del sistema —vale por el login entero— y 32 bytes no cuestan nada.
 */
const SESSION_TOKEN_BYTES = 32;

/**
 * 30 días. Es una herramienta de trabajo que se usa a rachas: un cliente entra al
 * panel, no lo toca en tres semanas y vuelve. Obligarlo a pedir un código cada vez
 * empujaría a dejar la sesión abierta en un dispositivo compartido, que es peor.
 *
 * La duración larga es sostenible porque la sesión se puede revocar de verdad: se
 * comprueba en base de datos en cada petición y `app.revoke_session` la corta.
 */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * 10 minutos para el código.
 *
 * Suficiente para abrir el correo en el teléfono y volver al navegador; corto como para
 * que un código que quedó en la bandeja de entrada de un buzón compartido no siga
 * sirviendo por la tarde.
 */
export const OTP_TTL_MS = 10 * 60 * 1000;

/** Lo que la aplicación sabe de la petición actual una vez resuelta la cookie. */
export interface ActiveSession {
  readonly actor: Actor;
}

/**
 * Genera el token de sesión en claro.
 *
 * Se devuelve en base64url y no en hex por tamaño: 43 caracteres frente a 64 para la
 * misma entropía, y base64url no lleva `+`, `/` ni `=`, así que viaja en una cookie sin
 * escapado que pueda corromperlo.
 *
 * Este valor solo existe en memoria durante la petición que lo crea y luego en la
 * cookie del navegador. A la base de datos entra únicamente su HMAC.
 */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(SESSION_TOKEN_BYTES);
  crypto.getRandomValues(bytes);

  return base64UrlEncode(bytes);
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
