import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProspectDetailScreen } from '@/components/dashboard/admin/ProspectDetailScreen';
import { listClients, listProspects } from '@/infrastructure/container';
import { requirePlatformCredentials } from '@/lib/auth/current-session';
import {
  convertToClientAction,
  discardProspectAction,
  linkClientAction,
  recordTouchAction,
  reopenProspectAction,
} from '../actions';
import { INITIAL_PROSPECT_STATE } from '../form-state';

export const metadata: Metadata = {
  title: 'Solicitud · Plataforma',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Una solicitud concreta.
 *
 * El prospecto se busca dentro de la lista completa en lugar de consultarlo por id suelto, y no es
 * pereza: la función de la base de datos que lista ya comprueba la sesión de plataforma, así que
 * este camino no puede devolver nada a quien no debe. Un `findById` aparte sería una segunda
 * función con la misma comprobación que mantener en dos sitios.
 *
 * Con miles de solicitudes esto habría que cambiarlo, y la señal será la misma que para las cifras
 * del resumen: en cuanto la lista deje de traerse entera.
 */
export default async function ProspectDetailPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const credentials = await requirePlatformCredentials();

  const [all, touches, clients] = await Promise.all([
    listProspects.all(credentials),
    listProspects.touches(credentials, id),
    listClients.execute(credentials),
  ]);

  const prospect = all.find((candidate) => candidate.id === id);

  if (!prospect) notFound();

  return (
    <ProspectDetailScreen
      prospect={prospect}
      touches={touches}
      clients={clients}
      /*
       * Las cinco acciones van juntas en un objeto porque son la misma pantalla. Cada valor sigue
       * siendo una referencia de servidor, así que cruzan la frontera igual que si fueran cinco
       * propiedades sueltas — y la llamada se lee de una vez.
       */
      actions={{
        record: recordTouchAction,
        convert: convertToClientAction,
        link: linkClientAction,
        discard: discardProspectAction,
        reopen: reopenProspectAction,
      }}
      initialState={INITIAL_PROSPECT_STATE}
    />
  );
}
