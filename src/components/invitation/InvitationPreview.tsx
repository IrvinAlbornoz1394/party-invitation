import { BLOCK_LABELS, checkContentCompleteness } from '@/domain/events/content-completeness';
import {
  assembleInvitation,
  type EventBlockRecord,
  type EventContentSource,
} from '@/domain/invitation/event-content';
import type { InvitationTheme } from '@/domain/invitation/theme';
import { InvitationRenderer } from './InvitationRenderer';

/**
 * La invitación dentro del marco del editor: entera, o **solo una sección**.
 *
 * El editor por pasos enseña al lado de cada paso la sección que se está llenando, y para eso
 * pide `?bloque=<clave>` a la ruta de vista previa. Esto es lo que las dos rutas —la del panel y
 * la de la plataforma— comparten para resolverlo, porque la decisión no es de ninguna de las dos:
 * es qué significa «enseñar una sección» cuando esa sección todavía no está lista.
 *
 * ## Una sección que no valida NO enseña la invitación entera
 *
 * Fue el primer intento y estaba mal. `assembleInvitation` descarta los bloques cuyo contenido no
 * valida —una galería sin fotos, una sede sin nombre— y eso es lo **normal** mientras alguien
 * está llenando el formulario: al empezar, casi ninguna sección se puede pintar. Con el respaldo
 * de «si no hay nada, enséñalo todo», el marco acababa enseñando la invitación completa en casi
 * todos los pasos, que es exactamente el problema que el editor por pasos venía a resolver: hay
 * que desplazarse para encontrar lo que se está escribiendo.
 *
 * Ahora dice lo que pasa: que a esa sección le falta algo, y qué le falta. Se lo pregunta a
 * `checkContentCompleteness`, que es la misma comprobación que decide si un evento se puede
 * publicar — así el marco y la lista de pendientes nunca se contradicen.
 *
 * ## Y un bloque que el evento no tiene sí enseña la invitación entera
 *
 * Porque eso no es una sección a medias: es un parámetro que no corresponde a este evento, y solo
 * puede llegar de una URL escrita a mano. Enseñar la invitación es el respaldo correcto ahí.
 */
export function InvitationPreview({
  theme,
  source,
  blocks,
  blockKey,
  musicUrl,
  musicTitle,
}: {
  readonly theme: InvitationTheme;
  readonly source: EventContentSource;
  readonly blocks: readonly EventBlockRecord[];
  /** La sección que se quiere ver. Sin ella, la invitación entera. */
  readonly blockKey: string | undefined;
  readonly musicUrl: string | null;
  readonly musicTitle: string | null;
}) {
  const assembled = assembleInvitation(source, blocks);

  if (!blockKey) {
    return (
      <InvitationRenderer
        theme={theme}
        blocks={assembled}
        musicUrl={musicUrl}
        musicTitle={musicTitle}
      />
    );
  }

  const section = assembled.filter((block) => block.blockKey === blockKey);

  if (section.length > 0) {
    /* Sin el mando de música: pertenece a la invitación completa y al lado de un formulario es un
       botón que no viene a cuento. */
    return <InvitationRenderer theme={theme} blocks={section} musicUrl={null} musicTitle={null} />;
  }

  const owned = blocks.filter((block) => block.blockKey === blockKey);

  /* El evento no lleva esa sección: el parámetro no es suyo. Ver la cabecera. */
  if (owned.length === 0) {
    return (
      <InvitationRenderer
        theme={theme}
        blocks={assembled}
        musicUrl={musicUrl}
        musicTitle={musicTitle}
      />
    );
  }

  return (
    <MissingSection
      label={BLOCK_LABELS[blockKey] ?? blockKey}
      missing={checkContentCompleteness(source, owned).blocks.at(0)?.missing ?? []}
    />
  );
}

/**
 * El hueco de una sección que todavía no se puede pintar, con lo que le falta.
 *
 * Va en gris y con la tipografía del sistema, **sin el tema del evento**, y es deliberado: esto
 * no es parte de la invitación, es el editor hablando. Vestido con el papel y la tinta del tema
 * se leería como una sección más —una que el invitado va a ver—, y no lo es.
 */
function MissingSection({
  label,
  missing,
}: {
  readonly label: string;
  readonly missing: readonly string[];
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-neutral-50 px-8 py-16 text-center font-sans">
      <div className="max-w-xs">
        <p className="m-0 text-[11px] font-medium tracking-[0.18em] text-neutral-400 uppercase">
          {label}
        </p>
        <p className="mt-3 mb-0 text-[15px] leading-relaxed text-neutral-600">
          Esta sección todavía no se puede ver: le falta contenido. En cuanto lo completes aparece
          aquí.
        </p>

        {missing.length > 0 && (
          <ul className="mt-5 mb-0 grid list-none gap-1.5 p-0 text-[13px] text-neutral-500">
            {missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
