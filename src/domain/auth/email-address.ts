/**
 * El correo es la identidad de una cuenta del panel.
 *
 * Importa que la normalización sea una sola función y viva aquí: el correo se usa
 * como clave para buscar al usuario, para invalidar los códigos anteriores y para
 * contar los intentos del límite. Si el login normalizara distinto que el registro,
 * `Irvin@x.com` e `irvin@x.com` serían dos identidades y los límites se aplicarían
 * por separado — o sea, se podrían duplicar variando las mayúsculas.
 */

/** Tope de RFC 5321 para una dirección completa. */
const MAX_EMAIL_LENGTH = 254;

/**
 * Comprobación de forma, no de existencia.
 *
 * Deliberadamente conservadora: un carácter arroba, algo no vacío a cada lado, un
 * punto en el dominio y ningún espacio. Validar correos con una expresión regular
 * "completa" según RFC 5322 es un error clásico — la gramática real admite comentarios
 * y comillas que nadie usa, y la regexp resultante es imposible de auditar. Lo único
 * que de verdad prueba que un correo existe es mandarle un mensaje, que es justo lo
 * que hace este flujo.
 */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Devuelve el correo en forma canónica, o null si no tiene forma de correo.
 *
 * Se pasa a minúsculas completo, incluida la parte local. Formalmente la parte local
 * es sensible a mayúsculas, pero ningún proveedor real trata `Irvin@` y `irvin@` como
 * buzones distintos, y tratarlas como identidades distintas causaría cuentas
 * duplicadas y límites evitables. La columna `users.email` tiene único, así que la
 * base de datos depende de esta normalización para hacer su trabajo.
 */
export function normalizeEmail(raw: string): string | null {
  const cleaned = raw.trim().toLowerCase();

  if (cleaned.length === 0 || cleaned.length > MAX_EMAIL_LENGTH) return null;
  if (!EMAIL_SHAPE.test(cleaned)) return null;

  return cleaned;
}

/**
 * Versión para mostrar en pantalla sin revelar el buzón completo.
 *
 * Se usa en la pantalla de "revisa tu correo" cuando el destino no lo escribió el
 * usuario en ese momento —por ejemplo al reenviar el código— para confirmar a dónde
 * fue sin exponer la dirección entera a quien esté mirando la pantalla.
 */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at <= 0) return '•••';

  const local = email.slice(0, at);
  const domain = email.slice(at);
  const visible = local.slice(0, Math.min(2, local.length));

  return `${visible}${'•'.repeat(Math.max(3, local.length - visible.length))}${domain}`;
}
