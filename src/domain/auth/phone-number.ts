/**
 * Teléfono en formato E.164, para cuando el OTP salga por WhatsApp.
 *
 * WhatsApp Cloud API exige el número en E.164 sin el `+` y sin separadores. Si se le
 * manda con espacios, guiones o el 1 de larga distancia nacional, la API responde 200
 * y el mensaje simplemente no llega: no hay error que avise. Por eso la normalización
 * vive aquí y es obligatoria antes de guardar, no antes de enviar.
 *
 * El teléfono NO es identidad de la cuenta: la identidad es el correo. Aquí es solo un
 * destino de entrega. Eso mantiene el flujo con una sola clave de búsqueda y evita el
 * problema de tener dos identificadores que pueden apuntar a cuentas distintas.
 */

/**
 * México. El país por defecto se aplica solo a números escritos en formato local, que
 * es como los teclea todo el mundo aquí ("999 123 4567").
 *
 * Es una constante y no una variable de entorno a propósito: cuando el producto venda
 * fuera de México, lo correcto no es cambiar un default global sino guardar el país
 * junto a cada cliente. Un default de entorno haría que el mismo número se
 * interpretara distinto según el despliegue, que es un fallo silencioso.
 */
const DEFAULT_COUNTRY_CODE = '52';

/** Longitud de un número nacional mexicano sin lada de país. */
const MX_NATIONAL_LENGTH = 10;

/** Límites de E.164: entre 8 y 15 dígitos incluyendo el código de país. */
const MIN_E164_DIGITS = 8;
const MAX_E164_DIGITS = 15;

/**
 * Devuelve el número en E.164 con `+`, o null si no se puede interpretar.
 *
 * Reglas, en orden:
 *   · Si viene con `+`, se respeta el código de país que trae.
 *   · Si son 10 dígitos, es un número nacional mexicano y se le antepone +52.
 *   · Si son 12 dígitos y empiezan con 52, ya traía la lada de país sin el `+`.
 *   · Si son 11 dígitos y empiezan con 1, es el 1 de larga distancia que México
 *     eliminó en 2019 y que la gente sigue escribiendo. Se descarta y se trata el
 *     resto como nacional.
 *
 * Cualquier otra cosa devuelve null en lugar de adivinar. Un número mal adivinado
 * manda el código de acceso de alguien al teléfono de un desconocido.
 */
export function normalizePhoneNumber(raw: string): string | null {
  const trimmed = raw.trim();
  const hadPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');

  if (digits.length === 0) return null;

  let e164: string;

  if (hadPlus) {
    e164 = digits;
  } else if (digits.length === MX_NATIONAL_LENGTH) {
    e164 = `${DEFAULT_COUNTRY_CODE}${digits}`;
  } else if (digits.length === MX_NATIONAL_LENGTH + 2 && digits.startsWith(DEFAULT_COUNTRY_CODE)) {
    e164 = digits;
  } else if (digits.length === MX_NATIONAL_LENGTH + 1 && digits.startsWith('1')) {
    e164 = `${DEFAULT_COUNTRY_CODE}${digits.slice(1)}`;
  } else {
    return null;
  }

  if (e164.length < MIN_E164_DIGITS || e164.length > MAX_E164_DIGITS) return null;

  return `+${e164}`;
}

/**
 * Oculta el número dejando los últimos cuatro dígitos.
 *
 * Es el formato con el que se le dice a alguien "te mandamos el código al ···4567":
 * suficiente para que reconozca su propio teléfono, insuficiente para que un tercero
 * que mire la pantalla se lleve el número.
 */
export function maskPhoneNumber(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  if (digits.length <= 4) return '•'.repeat(digits.length);

  return `•••• ${digits.slice(-4)}`;
}
