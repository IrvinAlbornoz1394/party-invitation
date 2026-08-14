import 'server-only';

import { createHmac } from 'node:crypto';
import { env } from '@/lib/env';

/**
 * Derivación de los hashes con los que se guardan las credenciales.
 *
 * ## Por qué HMAC y no SHA-256
 *
 * Un código OTP tiene seis dígitos: un millón de valores posibles. Calcular el SHA-256
 * de todos ellos es cuestión de milisegundos, así que guardar `sha256(code)` equivale a
 * guardar el código en claro — quien se lleve un dump de la base construye la tabla y
 * lee todos los códigos vivos.
 *
 * HMAC-SHA256 con una clave que **no está en la base de datos** rompe ese ataque: sin
 * `AUTH_SECRET` no se puede calcular el hash de un candidato, y con el secreto fuera del
 * dump el espacio pequeño deja de importar.
 *
 * ## Por qué no bcrypt, scrypt o Argon2
 *
 * Porque esto no son contraseñas. Un hash lento defiende de la fuerza bruta offline
 * cuando el secreto es débil y elegido por una persona; aquí el secreto es aleatorio,
 * vive diez minutos y ya está protegido por una clave. Lo que un KDF lento aportaría es
 * latencia en cada verificación —y en el peor caso, un vector de agotamiento de CPU en el
 * endpoint de login, que es exactamente el que está expuesto sin autenticar.
 *
 * Para el token de sesión, con 256 bits de entropía, un KDF lento no aporta
 * absolutamente nada: no hay espacio que barrer.
 *
 * ## Separación de dominios
 *
 * Cada tipo de credencial lleva su propio prefijo dentro del mensaje del HMAC. Así, un
 * hash de código nunca coincide con uno de sesión ni con uno de identificador, aunque el
 * valor de entrada fuera el mismo. Sin los prefijos, el HMAC de un valor podría valer
 * como el de otro tipo si alguna vez coincidieran, y esa clase de confusión de tipos es
 * de las que no se detectan hasta que se explotan.
 *
 * El `v1` reserva sitio para rotar el esquema: si algún día cambia la construcción, los
 * hashes nuevos llevan `v2` y los viejos siguen siendo reconocibles.
 */

function hmac(message: string): string {
  return createHmac('sha256', env.AUTH_SECRET).update(message, 'utf8').digest('hex');
}

/**
 * Hash del código OTP, ligado al correo con el que se pidió.
 *
 * Ligarlo al identificador tiene dos consecuencias buscadas: el mismo código emitido
 * para dos cuentas distintas produce hashes distintos —así el índice único no colisiona y
 * un dump no revela que dos personas comparten código—, y un código no se puede canjear
 * escribiendo el correo de otra cuenta.
 */
export function hashOtpCode(identifier: string, code: string): string {
  return hmac(`otp:v1:${identifier}:${code}`);
}

/** Hash del token de sesión que viaja en la cookie. */
export function hashSessionToken(token: string): string {
  return hmac(`session:v1:${token}`);
}

/**
 * Hash del identificador, para contar intentos sin almacenar correos.
 *
 * `auth_attempts` registra también los correos que NO existen —es lo que hace que los
 * límites se alcancen igual con cuenta y sin ella—, y esos correos son de terceros que
 * alguien tecleó. Guardarlos en claro convertiría una tabla de logs en una lista de
 * direcciones que nadie decidió recolectar.
 *
 * Con HMAC se puede seguir contando por identificador —el mismo correo da siempre el
 * mismo hash— sin poder leer ninguno, y sin que el hash sea invertible por diccionario,
 * que es lo que pasaría con un SHA-256 simple de una dirección de correo.
 */
export function hashIdentifier(identifier: string): string {
  return hmac(`identifier:v1:${identifier}`);
}
