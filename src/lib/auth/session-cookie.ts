import 'server-only';

import { cookies } from 'next/headers';
import { SESSION_TTL_MS } from '@/domain/auth/session';

/**
 * La cookie de sesión: cómo se llama, con qué banderas viaja y quién la puede leer.
 *
 * Está en un módulo propio porque cada bandera de aquí es una decisión de seguridad, y
 * repartirlas por las rutas garantizaría que alguna se escriba distinta en algún sitio. Un
 * `httpOnly` olvidado en un solo lugar deja el token al alcance de cualquier XSS.
 */

/**
 * Prefijo `__Host-`.
 *
 * No es decorativo: el navegador REHÚSA la cookie si no viene por HTTPS, si trae atributo
 * `Domain` o si su `Path` no es `/`. Es lo que evita el ataque de fijación desde un
 * subdominio — sin él, cualquiera que controle `algo.midominio.com` puede escribir una
 * cookie de sesión para `midominio.com`, y una cookie no distingue quién la puso.
 *
 * En local no se puede usar porque `http://localhost` no es HTTPS y el navegador la
 * descartaría en silencio, que es el peor modo de fallo posible: el login "funciona" y la
 * sesión no persiste. Por eso el nombre depende del entorno.
 */
const COOKIE_NAME =
  process.env.NODE_ENV === 'production' ? '__Host-mievento_session' : 'mievento_session';

export function sessionCookieName(): string {
  return COOKIE_NAME;
}

/** Lee el token de la petición actual. null si no viene o viene vacía. */
export async function readSessionCookie(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;

  return value && value.length > 0 ? value : null;
}

/**
 * Escribe la cookie de sesión.
 *
 * Solo se puede llamar desde un Server Action o un Route Handler: Next no permite escribir
 * cookies durante el render de un Server Component, y con razón —una respuesta cacheada
 * podría acabar llevando la cookie de otro usuario.
 */
export async function writeSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();

  store.set(COOKIE_NAME, token, {
    /** Fuera del alcance de JavaScript. Sin esto, cualquier XSS se lleva la sesión. */
    httpOnly: true,
    /**
     * Solo por HTTPS. En desarrollo se desactiva porque el servidor local es HTTP y el
     * navegador rechazaría la cookie.
     */
    secure: process.env.NODE_ENV === 'production',
    /**
     * `lax` y no `strict`.
     *
     * `strict` no manda la cookie en una navegación que llega desde otro sitio, así que
     * alguien que abriera el panel desde un enlace en su correo o en WhatsApp aterrizaría
     * sin sesión y tendría que volver a entrar — con `lax` eso funciona, y el panel no
     * hace ninguna operación destructiva por GET, que es lo que `strict` protege de más.
     *
     * Los Server Actions van por POST y Next comprueba el origen, así que el CSRF de las
     * mutaciones está cubierto por otra vía.
     */
    sameSite: 'lax',
    path: '/',
    /**
     * `expires` explícito además del `maxAge` implícito, y con la misma fecha que la
     * sesión en la base de datos. Que las dos coincidan importa: una cookie que sobrevive
     * a su sesión produce un usuario que parece dentro y recibe un rechazo en cada
     * petición.
     */
    expires: expiresAt,
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

/**
 * Borra la cookie.
 *
 * Se llama al cerrar sesión y también cuando una cookie resulta no ser válida: dejarla
 * puesta haría que el usuario arrastre un token muerto y reciba un rebote en cada
 * navegación, sin entender por qué.
 */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();

  /*
   * `set` con maxAge 0 en lugar de `delete`. Es equivalente para el navegador, pero
   * repite las mismas banderas con las que se escribió, y eso es lo que garantiza que el
   * navegador la identifique como la misma cookie. Una discrepancia de `path` o de
   * `secure` deja la original en su sitio.
   */
  store.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
