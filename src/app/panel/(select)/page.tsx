import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { ClientAccount, Membership } from '@/domain/auth/actor';
import { displayNameOf, scopeFromMembership } from '@/domain/auth/actor';
import {
  DestinationPicker,
  NoDestinations,
  type Destination,
} from '@/components/dashboard/client/DestinationPicker';
import { listClientEvents } from '@/infrastructure/container';
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
 *   alguien que elija entre una cosa.
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
 * ## Los eventos del cliente cuestan una consulta y valen la pena
 *
 * Una membresía de alcance cliente no nombra eventos: dice «todos los de este cliente». Para
 * pintar una tarjeta por evento hay que preguntarlos, y eso es un viaje a la base de datos que
 * las membresías de alcance evento no necesitan. Se paga porque es exactamente lo que se pidió:
 * quien tiene dos bodas entra eligiendo una, no aterrizando en una lista.
 *
 * Y si ese cliente no tiene ningún evento todavía, su única tarjeta es la del panel: no se
 * fabrica un destino vacío.
 */
export default async function PanelEntryPage() {
  const account = await requireClientAccount();
  const greeting = `Hola, ${displayNameOf(account)}`;

  const destinations = await buildDestinations(account.memberships, account);

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
 * Convierte las membresías en destinos.
 *
 * El nombre del cliente se pinta **solo si los destinos cruzan más de uno**. Con un cliente,
 * repetirlo en cada tarjeta es ruido; con dos, es lo único que distingue dos bodas de nombres
 * parecidos. La decisión se toma aquí una vez y no en cada tarjeta.
 */
async function buildDestinations(
  memberships: readonly Membership[],
  account: ClientAccount,
): Promise<readonly Destination[]> {
  const clientCount = new Set(memberships.map((membership) => membership.clientId)).size;
  const showClient = clientCount > 1;
  const destinations: Destination[] = [];

  for (const membership of memberships) {
    // ── Alcance evento: un destino, y ya está nombrado ──
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

    // ── Alcance cliente: un destino por evento, más el panel ──
    const scope = scopeFromMembership(account, membership);

    // `scope` solo es null para un `viewer`, y un visor no tiene alcance cliente: lo impide el
    // CHECK `memberships_role_scope`. Si llegara, se omite en lugar de reventar la pantalla.
    if (scope === null) continue;

    const events = await listClientEvents.execute(scope);

    for (const event of events) {
      destinations.push({
        href: `/panel/eventos/${event.id}`,
        title: event.title,
        subtitle: showClient ? membership.clientName : null,
        label: null,
        kind: 'event',
      });
    }

    destinations.push({
      href: '/panel/inicio',
      title: `Panel de ${membership.clientName}`,
      subtitle: events.length > 0 ? 'Equipo, ajustes y todos los eventos' : 'Equipo y ajustes',
      label: null,
      kind: 'client',
    });
  }

  return destinations;
}
