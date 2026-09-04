import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { ClientAccount, Membership } from '@/domain/auth/actor';
import { displayNameOf, scopeFromMembership } from '@/domain/auth/actor';
import {
  DestinationPicker,
  NoDestinations,
  type Destination,
} from '@/components/dashboard/client/DestinationPicker';
import { requireClientAccount } from '@/lib/auth/current-session';

export const metadata: Metadata = {
  title: 'Panel · Invitaciones digitales',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * `/panel`: el selector de entrada.
 *
 * Es lo primero que ve quien acaba de identificarse, y su única pregunta es a dónde va. Lo que
 * hace depende de cuántos destinos alcance la sesión:
 *
 * - **ninguno** → una pantalla que lo dice. Pasa de verdad: a una cuenta se le pueden retirar
 *   todos sus accesos y su correo sigue sirviendo para pedir un código.
 * - **uno** → redirige sin preguntar. Enseñar un selector de un solo elemento es pedirle a
 *   alguien que elija entre una cosa. Es el caso normal: ver más abajo.
 * - **varios** → las tarjetas.
 *
 * Esto es lo que sustituye a la URL de acceso con parámetros que se planteó para los visores. Si
 * el sistema puede listar lo que alcanza una sesión, no hace falta que el enlace se lo diga — y
 * es mejor que no lo diga, porque un enlace se reenvía y se pierde. Ver `docs/ACCESO.md`.
 *
 * ## Por qué está fuera de `(authenticated)`
 *
 * Ese grupo envuelve todo en el armazón con menú, y aquí el menú no puede existir: navegaría por
 * un contexto que es justo lo que todavía no se ha elegido. Al estar fuera, esta página se
 * protege sola con `requireClientAccount()` en lugar de heredarlo del layout — que es la única
 * excepción a «una página nueva queda protegida por estar en la carpeta correcta», y por eso la
 * llamada es la primera línea de la función.
 *
 * ## Un destino por membresía
 *
 * Y por eso, en la práctica, casi nadie ve esta pantalla. Quien alcanza un cliente tiene un solo
 * destino —su panel— y entra directo; quien alcanza un evento tiene un solo destino y entra
 * directo también. El selector aparece cuando de verdad hay dos cosas distintas que elegir: el
 * invitado al que se le dieron dos eventos, o quien trabaja en dos clientes.
 *
 * Es deliberado que sea así de raro. Esta pantalla no es un menú, es un desempate.
 */
export default async function PanelEntryPage() {
  const account = await requireClientAccount();
  const greeting = `Hola, ${displayNameOf(account)}`;

  const destinations = buildDestinations(account.memberships, account);

  if (destinations.length === 0) return <NoDestinations greeting={greeting} />;

  /*
   * `destinations[0]` existe: acabamos de descartar el array vacío. Se lee con `at()` en lugar
   * de indexar para que activar `noUncheckedIndexedAccess` algún día no rompa este archivo.
   */
  const only = destinations.length === 1 ? destinations.at(0) : undefined;
  if (only) redirect(only.href);

  return <DestinationPicker greeting={greeting} destinations={destinations} />;
}

/**
 * Convierte las membresías en destinos: **uno por membresía, y ninguno más**.
 *
 * Una de alcance cliente da el panel del cliente. Una de alcance evento da ese evento.
 *
 * ## Por qué el panel del cliente no se abre en una tarjeta por evento
 *
 * Se hacía, y era un rodeo. Quien alcanza el cliente entero ya tiene sus eventos listados en el
 * Resumen y un selector de evento en la cabecera del panel: enseñárselos otra vez aquí, antes de
 * entrar, es pedirle que elija dos veces lo mismo. Y en el caso normal —una cuenta, un cliente—
 * fabricaba varios destinos donde solo había uno, así que un dueño con dos bodas veía un selector
 * en cada inicio de sesión en lugar de entrar a su panel.
 *
 * Con un destino por membresía, la regla de arriba hace lo correcto sola: el dueño entra directo
 * a su panel, el invitado de un evento entra directo a su evento, y el selector aparece solo
 * cuando de verdad hay algo que elegir — que es el invitado con dos o más eventos, para el que
 * esta pantalla se hizo.
 *
 * De paso desaparece la consulta de eventos que había en este camino: el selector ya no necesita
 * saber qué hay dentro de un cliente para decidir a dónde mandar a nadie.
 *
 * El nombre del cliente se pinta **solo si los destinos cruzan más de uno**. Con un cliente,
 * repetirlo en cada tarjeta es ruido; con dos, es lo único que distingue dos bodas de nombres
 * parecidos. La decisión se toma aquí una vez y no en cada tarjeta.
 */
function buildDestinations(
  memberships: readonly Membership[],
  account: ClientAccount,
): readonly Destination[] {
  const clientCount = new Set(memberships.map((membership) => membership.clientId)).size;
  const showClient = clientCount > 1;
  const destinations: Destination[] = [];

  for (const membership of memberships) {
    // ── Alcance evento: un destino, y ya viene nombrado en la propia membresía ──
    if (membership.eventId !== null) {
      destinations.push({
        href: `/panel/eventos/${membership.eventId}`,
        title: membership.eventTitle ?? 'Evento',
        subtitle: showClient ? membership.clientName : null,
        label: membership.label,
        kind: membership.role === 'viewer' ? 'viewer' : 'event',
      });
      continue;
    }

    /*
     * `scope` solo es null para un `viewer`, y un visor no tiene alcance cliente: lo impide el
     * CHECK `memberships_role_scope`. Si llegara, se omite en lugar de reventar la pantalla.
     *
     * No se usa para consultar nada; se pide porque es la misma comprobación que hace el resto
     * del panel, y omitir aquí una fila imposible es más barato que descubrirla en la pantalla
     * siguiente.
     */
    if (scopeFromMembership(account, membership) === null) continue;

    destinations.push({
      href: '/panel/inicio',
      title: `Panel de ${membership.clientName}`,
      subtitle: 'Tus eventos, tu equipo y tus ajustes',
      label: null,
      kind: 'client',
    });
  }

  return destinations;
}
