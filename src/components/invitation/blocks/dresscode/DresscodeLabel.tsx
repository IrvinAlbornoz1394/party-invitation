import { paletteIsNamed } from '@/domain/invitation/blocks/dresscode';
import { ActionLink } from '../../shared/ActionLink';
import { BlockHeading } from '../../shared/BlockHeading';
import { blockIconComponent } from '../../shared/block-icons';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { Swatch } from './dresscode-parts';
import type { DresscodeVariantProps } from './dresscode-variant';

/**
 * `dresscode.label` — la etiqueta: el dibujo de la vestimenta, la instrucción a cuerpo grande y
 * la paleta reducida a una fila de puntos pequeños.
 *
 * Es la novena forma del bloque y la única donde **la paleta no es la sección**. En las ocho
 * anteriores la sección *es* la paleta —círculos, fichas, tramos, cuentas, franjas, retales,
 * discos, manchas— y la instrucción la acompaña. Aquí se invierte: lo que ocupa la pantalla es la
 * palabra —«FORMAL», «Etiqueta rigurosa»— y los tonos bajan a una fila discreta debajo.
 *
 * Sale de una referencia que no tiene paleta en absoluto: dos dibujos de ropa y la palabra
 * «FORMAL». Y ese es exactamente el caso que faltaba en el catálogo, porque hay eventos cuyo
 * código de vestimenta **es una sola palabra** y no una gama de colores. El contrato pide un
 * mínimo de dos muestras, así que la paleta no puede desaparecer; lo que puede es dejar de mandar.
 *
 * ## Por qué los puntos siguen siendo `Swatch`
 *
 * Pequeños, en fila y sin rótulo, pero la misma pieza compartida y con la misma forma redonda:
 * el brillo del metálico tiene que ser el de siempre. Lo que cambia es el tamaño y el papel que
 * juegan, no lo que son. Es lo contrario que en `dresscode.drops`, donde cambiaba la forma y por
 * eso hubo que salirse de la pieza común.
 *
 * ## Los dos dibujos
 *
 * Salen del vocabulario de iconos de la invitación (`dress` y `party`), pedidos en grande y con
 * el trazo casi al mínimo: es lo mismo que hace `schedule.ribbon` para convertir un icono de
 * interfaz en una ilustración. No se dibuja un traje nuevo en SVG porque el vocabulario ya tiene
 * la idea, y dos catálogos de dibujos acaban con dos estilos en la misma página.
 */
export function DresscodeLabel({ content }: DresscodeVariantProps) {
  const named = paletteIsNamed(content.palette);
  const Dress = blockIconComponent('dress');
  const Party = blockIconComponent('party');

  return (
    <BlockSection block="dresscode" variant="label">
      <BlockContainer className="max-w-md text-center">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          align="center"
          titleCase="caps"
        />

        <div className="mt-9 flex items-end justify-center gap-7 text-inv-accent">
          <Dress size={38} strokeWidth={0.85} aria-hidden="true" />
          <Party size={38} strokeWidth={0.85} aria-hidden="true" />
        </div>

        {/*
          La instrucción, en versalitas y a cuerpo de titular. Es la pieza que manda en esta
          variante, así que se compone como un rótulo y no como un párrafo: espaciada, en la tinta
          del tema y con la medida corta. Un texto largo —«formal de jardín, y te pedimos reservar
          el blanco»— sigue leyéndose, solo que en tres renglones en lugar de uno.
        */}
        {content.description && (
          <p className="mx-auto mt-8 mb-0 max-w-xs text-[clamp(0.95rem,3.4vw,1.15rem)] leading-relaxed tracking-[0.2em] text-inv-ink uppercase">
            {content.description}
          </p>
        )}

        <ul
          /* Sin nombres, la fila no dice nada que no diga la instrucción. Se oculta a quien
             escucha, como en las ocho anteriores. */
          aria-hidden={named ? undefined : 'true'}
          className="mt-9 flex list-none flex-wrap items-start justify-center gap-x-4 gap-y-4 p-0"
        >
          {content.palette.map((swatch, index) => (
            // El índice como clave es correcto aquí: la paleta no se reordena ni se inserta en
            // caliente. Y no sirve el color: dos muestras del mismo tono con acabados distintos
            // son legítimas.
            <li key={index} className="flex flex-col items-center gap-2">
              <Swatch swatch={swatch} className="size-7 sm:size-8" />
              {swatch.label && (
                <span className="text-[8.5px] leading-snug tracking-[0.14em] text-inv-ink-soft uppercase">
                  {swatch.label}
                </span>
              )}
            </li>
          ))}
        </ul>

        {content.action && (
          <div className="mt-9">
            <ActionLink label={content.action.label} href={content.action.href} tone="onSurface" />
          </div>
        )}

        {content.note && (
          <BlockNote note={content.note} className="mx-auto mt-8 max-w-sm text-center" />
        )}
      </BlockContainer>
    </BlockSection>
  );
}
