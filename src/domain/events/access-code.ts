/**
 * Código de acceso de una invitación.
 *
 * La URL de una invitación es pública y no tiene login, así que el código ES la
 * credencial. El nombre del evento sí es adivinable (`/fatima` se prueba en un
 * segundo), de modo que toda la protección recae aquí.
 *
 * Se usa base32 Crockford: alfabeto de 32 símbolos sin `i`, `l`, `o` ni `u`. Las tres
 * primeras se excluyen porque se confunden con `1` y `0` al leerlas o dictarlas por
 * teléfono, y la `u` para que no salgan palabras indeseadas por azar.
 *
 * Con 6 caracteres el espacio es 32^6 ≈ 1.07e9. Eso NO basta por sí solo: a 100
 * intentos por segundo se llega al 50% de acierto en ~170 días. La seguridad real
 * viene de combinarlo con el límite por IP que aplica
 * `app.resolve_invitation_access()` en la base de datos.
 */

/** Crockford base32. El orden importa: la posición define el valor del símbolo. */
const ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz';

export const ACCESS_CODE_LENGTH = 6;

/**
 * Equivalencias que Crockford define para la lectura humana. Permite que alguien
 * teclee `O` por `0` o `I` por `1` y el enlace siga funcionando.
 */
const AMBIGUOUS: Record<string, string> = {
  i: '1',
  l: '1',
  o: '0',
};

/**
 * Genera un código nuevo.
 *
 * Usa `crypto.getRandomValues` (Web Crypto, disponible en Node 18+ y en el runtime
 * edge) en lugar de `Math.random`, que es predecible y jamás debe usarse para
 * credenciales.
 *
 * El sesgo de módulo se evita sin muestreo por rechazo: el alfabeto tiene exactamente
 * 32 símbolos y 32 divide a 256, así que enmascarar cada byte con 0x1f da una
 * distribución perfectamente uniforme.
 */
export function generateAccessCode(length: number = ACCESS_CODE_LENGTH): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let code = '';
  for (const byte of bytes) {
    code += ALPHABET[byte & 0x1f];
  }
  return code;
}

/**
 * Normaliza lo que venga de la URL a la forma canónica del código.
 *
 * Tolera mayúsculas, espacios, guiones y los caracteres ambiguos de Crockford, porque
 * la gente reescribe estos códigos a mano al dictárselos. Lo que no tolera es longitud
 * o símbolos fuera del alfabeto: eso devuelve null y no llega a la base de datos.
 */
export function normalizeAccessCode(raw: string): string | null {
  const cleaned = raw
    .toLowerCase()
    .replace(/[\s-]/g, '')
    .split('')
    .map((char) => AMBIGUOUS[char] ?? char)
    .join('');

  if (cleaned.length !== ACCESS_CODE_LENGTH) return null;

  for (const char of cleaned) {
    if (!ALPHABET.includes(char)) return null;
  }

  return cleaned;
}

export function isValidAccessCode(raw: string): boolean {
  return normalizeAccessCode(raw) !== null;
}
