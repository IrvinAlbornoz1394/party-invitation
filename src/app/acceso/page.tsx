import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/access/LoginForm';
import { availableOtpChannels } from '@/infrastructure/container';
import { getCurrentActor, homePathFor } from '@/lib/auth/current-session';

export const metadata: Metadata = {
  title: 'Acceder · éclat',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Pantalla de acceso.
 *
 * Vive fuera de `/admin` y de `/panel`, y no dentro de uno de los dos, porque es la puerta
 * de las dos clases de cuenta. Ponerla bajo cualquiera de ellos obligaría a que el layout de
 * ese panel tuviera una excepción para su propia pantalla de acceso, que es exactamente el
 * tipo de excepción que acaba dejando una ruta sin proteger.
 *
 * Los canales disponibles se resuelven en el servidor y bajan como prop. El cliente no
 * puede saber si WhatsApp está configurado —eso depende de variables de entorno— y no debe
 * intentar adivinarlo.
 */
export default async function LoginPage() {
  /*
   * Quien ya tiene sesión no ve el formulario. Sin esto, un usuario con sesión abierta que
   * llega a esta URL desde un marcador pediría un código sin necesidad, y de paso
   * invalidaría el que pudiera tener pendiente.
   */
  const actor = await getCurrentActor();

  if (actor) {
    redirect(homePathFor(actor));
  }

  return <LoginForm channels={availableOtpChannels()} />;
}
