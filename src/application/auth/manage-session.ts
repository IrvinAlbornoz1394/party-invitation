import type { Actor } from '@/domain/auth/actor';
import type { AuthRepository } from '@/domain/auth/auth-repository';

/**
 * Los dos casos de uso que operan sobre una sesión ya abierta.
 *
 * Van juntos porque comparten exactamente una dependencia y ninguno tiene lógica propia
 * suficiente para justificar su archivo: separarlos daría dos clases de cinco líneas que
 * siempre se instancian a la vez. Emitir y canjear el código sí están aparte, porque ahí
 * sí hay reglas —generación de credenciales, orden de los pasos, qué se puede decir y qué
 * no— que conviene poder leer sin nada más alrededor.
 */

/** Valida la cookie de la petición actual. */
export class ResolveSession {
  constructor(private readonly auth: AuthRepository) {}

  /**
   * Devuelve null para cualquier motivo de rechazo: sin cookie, token desconocido,
   * sesión caducada, revocada o cuenta desactivada.
   *
   * No se distinguen a propósito. La respuesta a todos ellos es la misma —mandar a la
   * pantalla de acceso— y un tipo con seis casos invitaría a mostrar mensajes distintos,
   * que es cómo se acaba diciéndole a un atacante en qué punto exacto falló su token.
   */
  async execute(sessionToken: string | null): Promise<Actor | null> {
    if (sessionToken === null || sessionToken.length === 0) return null;

    return this.auth.resolveSession(sessionToken);
  }
}

/** Cierra la sesión actual. */
export class SignOut {
  constructor(private readonly auth: AuthRepository) {}

  /**
   * Idempotente y silencioso: cerrar una sesión que ya no existe no es un error.
   *
   * Quien llama debe borrar la cookie **aunque esto falle**. Si se revoca en base de
   * datos pero la cookie se queda, la siguiente petición la rechaza y el usuario acaba
   * fuera igual; al revés —cookie borrada, sesión viva— el token seguiría sirviendo si
   * alguien lo copió antes. Ese es el orden correcto de las dos operaciones.
   */
  async execute(sessionToken: string | null): Promise<void> {
    if (sessionToken === null || sessionToken.length === 0) return;

    await this.auth.revokeSession(sessionToken);
  }
}
