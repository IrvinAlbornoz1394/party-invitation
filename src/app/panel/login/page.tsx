import { permanentRedirect } from 'next/navigation';

/**
 * La pantalla de acceso se mudó a `/acceso` cuando dejó de ser exclusiva del panel de un
 * cliente: hoy es la puerta de las dos clases de cuenta.
 *
 * Este redirect se queda porque la URL vieja ya salió por correo en los avisos de alta, y un
 * enlace de invitación que lleva a un 404 es la peor primera impresión posible. Es permanente
 * para que los navegadores dejen de pedirla y para que quede claro que no va a volver.
 */
export default function LegacyLoginRedirect(): never {
  permanentRedirect('/acceso');
}
