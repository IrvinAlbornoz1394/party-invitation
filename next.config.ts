import type { NextConfig } from 'next';

/**
 * Cabeceras de seguridad aplicadas a todo el sitio.
 *
 * La Content-Security-Policy completa sigue pendiente: antd inyecta estilos en runtime y Next
 * necesita nonce para sus scripts inline, así que una CSP mal puesta rompe el panel en silencio.
 * Se agregará con nonce cuando el panel esté conectado. Lo único que ya va es `frame-ancestors`,
 * que es independiente del resto — ver abajo.
 */
const securityHeaders = [
  // Evita que el navegador adivine el tipo de contenido (vector de XSS con uploads).
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  /*
   * Nadie **de fuera** puede embeber la invitación ni el panel en un iframe (clickjacking).
   *
   * Estuvo en `DENY`, que además prohíbe embeberse a uno mismo, y eso rompía en silencio las dos
   * vistas previas del producto: la del editor de contenido (`/panel/eventos/[id]/vista`) y la de
   * la pantalla de componentes (`/admin/componentes/vista`). Las dos son un `<iframe>` a una ruta
   * de este mismo sitio —es la única forma de que la invitación tenga su propio viewport y sus
   * medias queries respondan como en un móvil— y el navegador las cortaba con un «localhost ha
   * rechazado la conexión» dentro del marco.
   *
   * `SAMEORIGIN` es la respuesta correcta y no una rebaja disimulada: para aprovecharla habría que
   * servir una página desde este mismo origen, y quien pueda hacer eso ya tiene XSS —o sea, un
   * problema mucho mayor que el clickjacking—. Lo que protege el encabezado es el caso real: que
   * un tercero monte la invitación o el panel dentro de su web.
   */
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  /*
   * Lo mismo, en el encabezado que de verdad se mira hoy.
   *
   * `X-Frame-Options` es el mecanismo antiguo y `frame-ancestors` el que lo sustituye: donde los
   * dos existen, los navegadores modernos hacen caso al segundo y del primero solo se acuerdan
   * los viejos. Se ponen los dos porque no cuesta nada y cubren a todo el mundo.
   *
   * Es una CSP con **una sola directiva**, y eso es deliberado: la política completa sigue
   * pendiente —antd inyecta estilos en runtime y Next necesita nonce para sus scripts— pero
   * `frame-ancestors` no tiene nada que ver con eso y no puede romper nada al añadirse sola.
   */
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
  // No filtrar la URL completa (que incluirá el código de invitado) a terceros.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // La invitación no necesita ninguna de estas capacidades del dispositivo.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Fuerza HTTPS durante 2 años. Vercel ya sirve TLS, esto evita el primer salto en claro.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  /*
   * Next 16 genera AGENTS.md y CLAUDE.md al arrancar `next dev`. Se desactiva porque
   * aquí CLAUDE.md es un symlink a AGENTS.md, y el generador escribió a través del
   * symlink: AGENTS.md acabó con `@AGENTS.md`, una autorreferencia inútil. Las
   * instrucciones para agentes de este proyecto se mantienen a mano.
   */
  agentRules: false,
  images: {
    // Allowlist explícita: sin esto, /_next/image se vuelve un proxy abierto.
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
  },
  // El header Server delata la infraestructura sin dar ningún beneficio.
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
