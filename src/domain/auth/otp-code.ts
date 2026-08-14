/**
 * Código de un solo uso para entrar al panel.
 *
 * Seis dígitos, que es lo que la gente espera de un OTP y lo que iOS y Android
 * autocompletan cuando el campo declara `autocomplete="one-time-code"`. Ese formato
 * es también el que sobrevive al dictado por teléfono y al copiado desde WhatsApp.
 *
 * Seis dígitos son 1e6 combinaciones, mucho menos que los 32^6 ≈ 1e9 del código de
 * invitación. La diferencia se compensa con las tres cosas que hace el plano de auth
 * en la base de datos, y ninguna es opcional:
 *
 *   1. Vida corta (10 minutos). Fuera de esa ventana el código no vale nada.
 *   2. Cinco intentos por identificador. Al sexto el código se quema.
 *   3. Límite de emisión. Sin él, un atacante pediría mil códigos para conseguir
 *      cinco mil intentos y la probabilidad dejaría de ser despreciable.
 *
 * Con esos tres topes la probabilidad de acertar dentro de una ventana es 5/1e6, y no
 * se puede repetir la tirada a voluntad. Subir a 8 dígitos sin límites sería peor que
 * 6 con ellos: el número de intentos manda sobre el tamaño del espacio.
 */

export const OTP_CODE_LENGTH = 6;

/**
 * Genera un código nuevo con el CSPRNG de la plataforma.
 *
 * `Math.random` está descartado sin discusión: su estado interno se puede reconstruir
 * observando unas cuantas salidas, y aquí la salida es una credencial.
 *
 * El sesgo de módulo sí hay que tratarlo. En el código de invitación no hacía falta
 * porque 32 divide a 256, pero 10 no: si se tomara `byte % 10`, los dígitos 0–5
 * saldrían de 26 bytes posibles y los dígitos 6–9 solo de 25, así que unos serían un
 * 4% más probables que otros. Se resuelve por rechazo: se descartan los bytes desde
 * 250 en adelante y se usa el resto, que sí es un múltiplo exacto de 10.
 *
 * El rechazo termina: cada byte se acepta con probabilidad 250/256 ≈ 0.977, de modo
 * que el bucle da de media 1.02 vueltas por dígito. No es un bucle abierto.
 */
export function generateOtpCode(length: number = OTP_CODE_LENGTH): string {
  /** 250 = 25 × 10. El mayor múltiplo de 10 que cabe en un byte. */
  const limit = 250;
  const buffer = new Uint8Array(length);
  let code = '';

  while (code.length < length) {
    crypto.getRandomValues(buffer);
    for (const byte of buffer) {
      if (byte >= limit) continue;
      code += (byte % 10).toString();
      if (code.length === length) break;
    }
  }

  return code;
}

/**
 * Normaliza lo que el usuario escribió a la forma canónica del código.
 *
 * Tolera espacios y guiones porque al pegar desde un correo o desde WhatsApp suelen
 * venir de acompañantes. Lo que no tolera es longitud distinta ni caracteres que no
 * sean dígitos: eso devuelve null y no llega a la base de datos, así que un envío
 * malformado no consume el presupuesto de intentos de nadie.
 */
export function normalizeOtpCode(raw: string): string | null {
  const cleaned = raw.replace(/[\s-]/g, '');

  if (cleaned.length !== OTP_CODE_LENGTH) return null;
  if (!/^\d+$/.test(cleaned)) return null;

  return cleaned;
}
