/**
 * Si un destino sale de la invitación.
 *
 * La regla se decide una vez y no en cada componente que pinta un enlace, porque de ella
 * cuelga una medida de seguridad: los destinos externos se abren en pestaña nueva **con**
 * `rel="noopener noreferrer"`. Sin `noopener`, la página de destino recibe una referencia a la
 * invitación por `window.opener` y puede redirigirla — en una invitación que circula por
 * WhatsApp, una vía de suplantación barata.
 *
 * Lo que no empieza por `http(s)` es del propio sitio: un ancla (`#historia`) o una ruta
 * (`/kamilah/7f3k2p`). Eso navega en la misma pestaña, como debe ser.
 */
export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/** Los atributos de un enlace según su destino. Se esparcen tal cual en el `<a>`. */
export function externalLinkAttributes(href: string) {
  return isExternalHref(href) ? ({ target: '_blank', rel: 'noopener noreferrer' } as const) : null;
}
