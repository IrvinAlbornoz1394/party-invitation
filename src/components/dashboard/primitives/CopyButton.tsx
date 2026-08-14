'use client';

import { useEffect, useState } from 'react';
import { Button, Tooltip } from 'antd';
import { Check, Copy } from 'lucide-react';

/**
 * Copiar un texto al portapapeles, con acuse.
 *
 * Está separado de lo que copia porque lo usan dos sitios con formas muy distintas —la ficha
 * de un evento y una celda de tabla— y toda la parte delicada es la misma: saber si el
 * portapapeles existe, dar acuse y devolver el botón a su estado.
 *
 * ## Por qué se comprueba el portapapeles
 *
 * `navigator.clipboard` solo existe en **contexto seguro**: HTTPS o localhost. Al abrir el
 * panel desde el móvil por la IP de la red local en HTTP —que es exactamente como se prueba
 * una invitación antes de repartirla— la API no está, y `navigator.clipboard.writeText`
 * revienta con «cannot read properties of undefined». El botón se marca como no disponible y
 * el tooltip dice qué hacer en su lugar, en vez de fallar en silencio.
 */
export function CopyButton({
  value,
  label = 'Copiar',
  copiedLabel = 'Copiado',
  describedAs,
  iconOnly = false,
  size = 'middle',
}: {
  readonly value: string;
  readonly label?: string;
  readonly copiedLabel?: string;
  /** Qué se copia, para el lector de pantalla. Obligatorio si `iconOnly`. */
  readonly describedAs?: string;
  readonly iconOnly?: boolean;
  readonly size?: 'small' | 'middle' | 'large';
}) {
  const [copied, setCopied] = useState(false);
  const [canCopy, setCanCopy] = useState(false);

  /*
   * La disponibilidad se resuelve DESPUÉS de montar, no en el render. `navigator` no existe
   * en el servidor, así que consultarlo en el cuerpo del componente daría un HTML distinto
   * en servidor y en cliente — el error de hidratación clásico.
   */
  useEffect(() => {
    setCanCopy(typeof navigator !== 'undefined' && Boolean(navigator.clipboard));
  }, []);

  // El acuse vuelve a su estado tras dos segundos. Sin esto el botón se queda en «Copiado»
  // para siempre y deja de decir nada la segunda vez que se pulsa.
  useEffect(() => {
    if (!copied) return;

    const timer = setTimeout(() => setCopied(false), 2000);

    return () => clearTimeout(timer);
  }, [copied]);

  const icon = copied ? (
    <Check size={15} strokeWidth={2.5} aria-hidden="true" />
  ) : (
    <Copy size={15} strokeWidth={1.9} aria-hidden="true" />
  );

  return (
    <>
      <Tooltip
        title={
          canCopy
            ? (describedAs ?? label)
            : 'Copia no disponible aquí: selecciona el texto y cópialo a mano'
        }
      >
        {/* El `<span>` envuelve al botón porque un elemento deshabilitado no emite eventos de
            ratón, y sin él el tooltip que explica POR QUÉ no se puede nunca se mostraría. */}
        <span>
          <Button
            size={size}
            disabled={!canCopy}
            icon={icon}
            /* Un botón de solo icono no tiene texto que leer, así que necesita etiqueta
               explícita. Con texto visible, `aria-label` sobraría y además lo taparía. */
            aria-label={iconOnly ? (describedAs ?? label) : undefined}
            onClick={(event) => {
              // La fila de una tabla puede ser pulsable; copiar no debe además navegar.
              event.stopPropagation();
              void navigator.clipboard.writeText(value).then(() => setCopied(true));
            }}
          >
            {iconOnly ? null : copied ? copiedLabel : label}
          </Button>
        </span>
      </Tooltip>

      {/*
        Acuse para lector de pantalla. El cambio de icono y de texto lo comunica visualmente;
        sin esta región, quien no ve la pantalla no recibe ninguna señal de que funcionó.
      */}
      <span className="dash-sr-only" role="status" aria-live="polite">
        {copied ? 'Copiado al portapapeles' : ''}
      </span>
    </>
  );
}
