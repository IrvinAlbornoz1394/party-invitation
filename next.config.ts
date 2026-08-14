import type { NextConfig } from 'next';

/**
 * Cabeceras de seguridad aplicadas a todo el sitio.
 *
 * No se incluye Content-Security-Policy todavía: antd inyecta estilos en runtime
 * y Next necesita nonce para sus scripts inline, así que una CSP mal puesta rompe
 * el panel en silencio. Se agregará con nonce cuando el panel esté conectado.
 */
const securityHeaders = [
  // Evita que el navegador adivine el tipo de contenido (vector de XSS con uploads).
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Nadie debe poder embeber la invitación ni el panel en un iframe (clickjacking).
  { key: 'X-Frame-Options', value: 'DENY' },
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
