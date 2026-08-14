/**
 * La URL pública del sitio, tal como la ve el navegador.
 *
 * Se lee de `NEXT_PUBLIC_SITE_URL`, que es la misma variable que ya usan las etiquetas Open
 * Graph en `app/layout.tsx`. Al llevar el prefijo `NEXT_PUBLIC_`, Next la sustituye por su
 * valor literal durante el build, así que funciona también en los componentes de cliente —a
 * diferencia de `lib/env.ts`, que es solo de servidor y no se puede importar desde ellos.
 *
 * ## Por qué no se usa `window.location.origin`
 *
 * Parece más listo —siempre acierta el host— pero no existe durante el renderizado en
 * servidor, así que el enlace saldría vacío en el HTML inicial y aparecería al hidratar. Y en
 * un despliegue detrás de un proxy o con un dominio de vista previa daría una URL que
 * funciona en esa pestaña pero no sirve para repartir, que es justo para lo que se copia.
 * La variable es la dirección **canónica**, que es la que hay que mandar por WhatsApp.
 */
export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';
}
