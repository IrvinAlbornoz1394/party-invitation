'use client';

import { invitationPath, invitationUrl } from '@/domain/events/invitation-url';
import { siteUrl } from '../site-url';
import { CopyButton } from './CopyButton';
import { OpenButton } from './OpenButton';

/**
 * La dirección de una invitación dentro de una celda de tabla.
 *
 * Enseña la ruta **completa** —`/kamilah/7f3k2p`— y no solo el slug. Es la corrección de
 * fondo: las tablas mostraban `/kamilah`, que parece una dirección válida y no lo es, así que
 * quien la copiaba repartía un enlace que redirige a la portada sin decir por qué.
 *
 * Se muestra la ruta relativa y se copia la URL absoluta. Es deliberado: en una tabla de
 * cinco columnas, el `https://` y el dominio repetidos en cada fila se comen el ancho sin
 * aportar nada —son iguales en todas—, mientras que lo que se pega en WhatsApp tiene que
 * llevarlos. La forma corta es para leer y comparar; la larga, para repartir.
 *
 * Los botones son de solo icono porque en una tabla no cabe otra cosa, y por eso llevan
 * etiqueta accesible con el nombre del evento: una columna de botones idénticos no le dice a
 * un lector de pantalla cuál copia o abre qué.
 */
export function InvitationCell({
  slug,
  accessCode,
  eventTitle,
}: {
  readonly slug: string;
  readonly accessCode: string;
  /** Para la etiqueta accesible del botón: «Copiar el enlace de Boda de Laura y Diego». */
  readonly eventTitle: string;
}) {
  const url = invitationUrl(siteUrl(), slug, accessCode);

  return (
    <span className="dash-invite-cell">
      <code className="dash-code">{invitationPath(slug, accessCode)}</code>
      <CopyButton
        value={url}
        size="small"
        iconOnly
        describedAs={`Copiar el enlace de ${eventTitle}`}
      />
      <OpenButton
        url={url}
        size="small"
        iconOnly
        describedAs={`Abrir la invitación de ${eventTitle} en una pestaña nueva`}
      />
    </span>
  );
}
