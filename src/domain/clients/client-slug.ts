import { slugifyEventName } from '../events/event-slug';

/**
 * Slug interno de un cliente: `familia-albornoz`.
 *
 * No vive en la raíz del dominio —esa es la del evento— así que **no** hereda la lista de
 * slugs reservados. Un cliente llamado `panel` no tapa ninguna ruta, porque su slug no
 * aparece en ninguna URL pública. Se reutiliza `slugifyEventName` para el trabajo de
 * normalizar acentos y separadores, que es idéntico, y se deja la validación aparte
 * precisamente porque las reglas NO son las mismas: si un día se compartieran enteras, un
 * cambio pensado para las invitaciones se aplicaría en silencio a los clientes.
 */

const MIN_LENGTH = 2;
const MAX_LENGTH = 60;

export const slugifyClientName = slugifyEventName;

export function normalizeClientSlug(raw: string): string | null {
  const slug = raw.trim().toLowerCase();

  if (slug.length < MIN_LENGTH || slug.length > MAX_LENGTH) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;

  return slug;
}
