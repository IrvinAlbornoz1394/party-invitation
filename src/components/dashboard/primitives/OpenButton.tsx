'use client';

import { Button, Tooltip } from 'antd';
import { ExternalLink } from 'lucide-react';

/**
 * Abrir una dirección en una pestaña nueva.
 *
 * Acompaña siempre a {@link CopyButton}: copiar sirve para repartir el enlace, pero antes de
 * mandarlo por WhatsApp el organizador quiere *verlo*, y pegarlo en la barra de direcciones
 * para comprobar que el código es el bueno es un rodeo que se hace decenas de veces. Son dos
 * intenciones distintas —repartir y revisar— y por eso son dos botones y no uno.
 *
 * Se abre en pestaña nueva a propósito: el panel suele tener trabajo a medias —un formulario,
 * una tabla filtrada— y navegar en la misma pestaña lo perdería.
 */
export function OpenButton({
  url,
  label = 'Abrir',
  describedAs,
  iconOnly = false,
  size = 'middle',
}: {
  readonly url: string;
  readonly label?: string;
  /** Qué se abre, para el lector de pantalla. Obligatorio si `iconOnly`. */
  readonly describedAs?: string;
  readonly iconOnly?: boolean;
  readonly size?: 'small' | 'middle' | 'large';
}) {
  return (
    <Tooltip title={describedAs ?? 'Abrir en una pestaña nueva'}>
      <Button
        href={url}
        target="_blank"
        /*
         * `noopener` no es ceremonia: sin él la pestaña que se abre recibe una referencia a
         * esta por `window.opener` y puede redirigirla. Aquí el destino es del propio sitio,
         * pero se aplica igual para no tener que recordar la excepción el día que la
         * invitación viva en un dominio del cliente.
         */
        rel="noopener noreferrer"
        size={size}
        icon={<ExternalLink size={15} strokeWidth={1.9} aria-hidden="true" />}
        /* Un botón de solo icono no tiene texto que leer, así que necesita etiqueta
           explícita. Con texto visible, `aria-label` sobraría y además lo taparía. */
        aria-label={iconOnly ? (describedAs ?? label) : undefined}
        // La fila de una tabla puede ser pulsable; abrir la invitación no debe además
        // disparar la navegación de la fila detrás.
        onClick={(event) => event.stopPropagation()}
      >
        {iconOnly ? null : label}
      </Button>
    </Tooltip>
  );
}
