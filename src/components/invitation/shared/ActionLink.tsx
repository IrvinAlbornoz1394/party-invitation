import { actionClasses } from './action-styles';
import { externalLinkAttributes } from './href';
import type { Tone } from './tone';

/**
 * El botón de un bloque: «Saber más», «Cómo llegar», «Confirmar asistencia».
 *
 * Es un `<a>` y no un `<button>` porque siempre lleva a algún sitio —un ancla de la propia
 * invitación, un mapa, WhatsApp—, y esa diferencia la nota quien navega con teclado o lector
 * de pantalla: un enlace se abre en pestaña nueva, se copia y se anuncia como destino; un
 * botón, no. Cuando lo que hay que hacer es ejecutar algo y no ir a ningún sitio —confirmar
 * asistencia contra la plataforma— el elemento correcto es un `<button>`, y para que los dos se
 * vean idénticos las clases viven en `action-styles.ts`.
 *
 * `href` viene del contenido del evento, así que puede ser externo; cómo se tratan esos
 * destinos lo decide `shared/href.ts`, en un solo sitio para todos los enlaces de la
 * invitación.
 */
export function ActionLink({
  label,
  href,
  tone = 'onSurface',
  className,
}: {
  readonly label: string;
  readonly href: string;
  readonly tone?: Tone;
  readonly className?: string;
}) {
  return (
    <a href={href} {...externalLinkAttributes(href)} className={actionClasses(tone, className)}>
      {label}
    </a>
  );
}
