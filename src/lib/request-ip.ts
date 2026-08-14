/**
 * Extrae la IP del cliente de las cabeceras de la petición.
 *
 * Next no expone la IP directamente en un Server Component, así que hay que leerla de
 * las cabeceras que pone el proxy. En Vercel eso es `x-forwarded-for`.
 *
 * Se toma el PRIMER valor de la lista, no el último. `x-forwarded-for` se construye
 * añadiendo por la derecha, así que el primero es el cliente original y el resto son
 * los proxies intermedios. Ojo con lo contrario: un cliente puede enviar su propia
 * cabecera `x-forwarded-for` falsa, y el proxy la conserva anteponiendo la real.
 * Confiar en esta cabecera solo es correcto cuando hay un proxy de confianza delante
 * que la normaliza —que es el caso en Vercel—; en otro despliegue habría que usar la
 * cabecera propia de ese proxy.
 */
export function clientIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first && isPlausibleIp(first)) return first;
  }

  // Cabecera propia de Vercel, ya normalizada y no falsificable por el cliente.
  const realIp = headers.get('x-real-ip')?.trim();
  if (realIp && isPlausibleIp(realIp)) return realIp;

  return null;
}

/**
 * Comprobación de forma antes de mandarlo a Postgres como `inet`.
 *
 * Es deliberadamente laxa —no valida rangos— porque su único trabajo es evitar que un
 * valor basura llegue a un cast `::inet` y lo haga fallar. La validación real la hace
 * Postgres al convertirlo.
 */
function isPlausibleIp(value: string): boolean {
  if (value.length === 0 || value.length > 45) return false;
  // IPv4 con puntos, o IPv6 con dos puntos. Nada más puede ser una IP.
  return /^[0-9.]+$/.test(value) || /^[0-9a-fA-F:.]+$/.test(value);
}
