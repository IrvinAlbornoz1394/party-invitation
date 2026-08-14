/**
 * Slug público de un evento: el `/fatima` de `mievento.mx/fatima/k7m2p4`.
 *
 * No es una credencial —es adivinable y está pensado para ser legible y compartible—,
 * pero sí es un identificador que vive en la raíz del dominio, y eso trae una
 * consecuencia importante: un slug puede tapar una ruta real del producto.
 */

/**
 * Nombres que no pueden usarse como slug de evento porque colisionarían con rutas de
 * la aplicación, con archivos servidos estáticamente o con rutas futuras que ya están
 * previstas.
 *
 * Next resuelve las rutas estáticas antes que las dinámicas, así que `/panel` gana hoy
 * sobre `/[slug]`. Aun así se reservan: si un cliente lograra registrar el slug
 * `panel`, su invitación quedaría inalcanzable para siempre, lo cual es un fallo
 * silencioso y confuso de diagnosticar.
 */
const RESERVED_SLUGS = new Set([
  'panel',
  'api',
  'admin',
  'auth',
  'login',
  'logout',
  'app',
  'assets',
  'static',
  'public',
  'music',
  'images',
  'img',
  'fonts',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'manifest.json',
  '_next',
  'precios',
  'planes',
  'contacto',
  'blog',
  'ayuda',
  'terminos',
  'privacidad',
  'demo',
]);

const MIN_LENGTH = 2;
const MAX_LENGTH = 60;

/**
 * Convierte un nombre libre en slug. `"María José"` → `"maria-jose"`.
 *
 * Se descomponen los acentos con NFD y se quitan los diacríticos, en lugar de
 * mapear letra por letra: así funciona con cualquier alfabeto latino y no solo con
 * el español.
 */
export function slugifyEventName(name: string): string {
  return name
    .normalize('NFD')
    // Quita las marcas diacríticas que NFD dejó sueltas.
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_LENGTH)
    .replace(/-+$/, '');
}

/** Normaliza un slug que llega de la URL. Devuelve null si no puede ser un slug válido. */
export function normalizeEventSlug(raw: string): string | null {
  const slug = raw.trim().toLowerCase();

  if (slug.length < MIN_LENGTH || slug.length > MAX_LENGTH) return null;
  // Solo minúsculas, dígitos y guiones internos.
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  if (RESERVED_SLUGS.has(slug)) return null;

  return slug;
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.trim().toLowerCase());
}
