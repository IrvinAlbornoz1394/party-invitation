/**
 * Cómo se compone la dirección de una invitación.
 *
 * Vive en el dominio y no en el componente que la pinta porque la forma de la URL es una
 * regla del producto, no una decisión de pantalla: el código va como **segmento de ruta** y
 * no como parámetro de consulta, porque la query se pierde en algunos clientes de mensajería
 * al previsualizar el enlace y este se rompería sin que el organizador se enterara.
 *
 * Al estar en un solo sitio, el panel, los correos y cualquier futuro exportador componen
 * exactamente la misma cadena. Cuando había que escribirla a mano en cada sitio, bastaba con
 * que uno olvidara el código para repartir un enlace que redirige a la portada.
 */

/** La ruta relativa: `/kamilah/7f3k2p`. */
export function invitationPath(slug: string, accessCode: string): string {
  return `/${slug}/${accessCode}`;
}

/**
 * La URL absoluta, para copiar y repartir.
 *
 * `baseUrl` se recorta por la derecha porque `NEXT_PUBLIC_SITE_URL` se configura a mano y
 * acaba con barra la mitad de las veces; sin esto saldría `https://sitio.com//kamilah/7f3k2p`,
 * que funciona pero se ve descuidado justo en lo único que el cliente va a copiar y pegar.
 */
export function invitationUrl(baseUrl: string, slug: string, accessCode: string): string {
  return `${baseUrl.replace(/\/+$/, '')}${invitationPath(slug, accessCode)}`;
}
