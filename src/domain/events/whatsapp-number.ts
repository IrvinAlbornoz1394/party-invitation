/**
 * Un número de WhatsApp tal como lo exige `wa.me`: solo dígitos y con lada de país.
 *
 * Se limpia en vez de rechazarse porque la gente lo escribe como lo ve en su teléfono —«+52 999
 * 123 4567», «(999) 123-4567»—, y guardado tal cual el enlace no abre ningún chat. Con diez
 * dígitos se da por número mexicano y se le antepone el 52, que es lo que casi siempre falta.
 *
 * Devuelve `null` cuando lo que queda no puede ser un número: menos de once dígitos con lada o
 * más de quince, que es el máximo de la norma E.164.
 */
export function normalizeWhatsappNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  const withCountry = digits.length === 10 ? `52${digits}` : digits;

  return /^\d{11,15}$/.test(withCountry) ? withCountry : null;
}

/** El mensaje que acompaña a un número que no se pudo limpiar. */
export const WHATSAPP_NUMBER_HINT =
  'Escribe el número con lada: 10 dígitos, o con la lada de tu país (52 999 123 4567).';
