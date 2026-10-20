import { ArrowDown } from 'lucide-react';
import { BlockImage } from '../../shared/BlockImage';
import { hasText } from '../../shared/has-text';
import { WaxSeal } from './envelope-parts';
import { PAPER_SHEEN, sealMarkOf, sealMonogram } from './envelope-paper';
import { WelcomeOpenButton, WelcomeShell, type WelcomeVariantProps } from './welcome-parts';

/**
 * `welcome.dear` — «Querido invitado»: la foto de la pareja arriba, fundiéndose con el papel, el
 * saludo a mano y un sobre pequeño lacrado esperando a que lo abran.
 *
 * Es la más íntima de las tres en sobre. `gatefold` y `letter` hacen del sobre el escenario;
 * aquí el sobre es un detalle en la mano —del tamaño de una tarjeta— y lo que manda es la
 * fotografía y el saludo. Al tocar el lacre (o la flecha de abajo), el sello se rompe, la
 * solapa se levanta, sale la carta y la cámara se acerca a ella hasta que la hoja ocupa la
 * pantalla entera: esa hoja **es** la invitación, que aparece en su lugar.
 *
 * ## Por qué la carta es del color de la invitación
 *
 * La carta lleva `bg-inv-bg`, el mismo papel sobre el que se pinta la invitación, y su monograma
 * se borra mientras crece. Así, cuando llena la pantalla y la puerta se desvanece, lo que hay
 * debajo es el mismo papel con la invitación escrita: no se ve un corte, se ve la carta abierta.
 *
 * ## El saludo va escrito aquí, no en el contenido
 *
 * «Querido invitado» es lo que dice la pieza de papelería, como «Toca el sello» en las otras
 * dos: es parte del diseño y no un dato del evento. Lo que sí sale del evento es la frase de
 * abajo —`note`—, y si el evento no tiene, una que dice lo mismo que la referencia.
 *
 * El movimiento vive en `globals.css` (`inv-dear-*`), como el de los otros sobres.
 */
export function WelcomeDear({ content }: WelcomeVariantProps) {
  const monogram = sealMonogram(content.celebrantName, content.celebrantLastName);
  const mark = sealMarkOf(content.celebrantName, content.celebrantLastName, content.eventTypeLabel);

  return (
    <WelcomeShell
      variant="dear"
      label={`Bienvenida a la invitación de ${content.celebrantName}`}
      leaveTimeoutMs={3000}
      contentClassName="items-center overflow-hidden px-6 pb-8 text-center"
      backdrop={
        <div aria-hidden="true" className="inv-dear-backdrop absolute inset-0 -z-10">
          {content.image && (
            /* La foto ocupa la mitad de arriba y se deshace en el papel: la máscara y no un
               degradado encima, para que el fondo sea el del tema y no un blanco pintado. */
            <div className="absolute inset-x-0 top-0 h-[44%] [mask-image:linear-gradient(to_bottom,black_35%,transparent_96%)]">
              {/* Encuadrada hacia arriba: las caras quedan altas y el saludo cae sobre el papel. */}
              <BlockImage image={content.image} priority className="object-[50%_28%] opacity-90" />
            </div>
          )}
        </div>
      }
    >
      {/* El hueco de la foto. En porcentaje del cascarón y no en `svh`, para que también mida bien
          dentro del recuadro de vista previa del panel, que no es la pantalla. */}
      <div aria-hidden="true" className="min-h-[9rem] shrink-0 basis-[38%]" />

      <h2 className="inv-dear-caption m-0 font-inv-script text-[clamp(2.6rem,12vw,3.6rem)] leading-none font-normal text-inv-ink [text-shadow:0_1px_12px_var(--inv-color-background)]">
        Querido invitado
      </h2>

      {/* El sobre, visto por detrás: la solapa en V cerrada y el lacre en su punta. */}
      <div className="inv-dear-envelope relative mt-7 aspect-[10/7] w-[min(66vw,16rem)] shrink-0 [perspective:900px]">
        <div
          className="inv-dear-front absolute inset-0 rounded-[4px] shadow-[0_18px_30px_-14px_rgb(0_0_0/0.45)]"
          style={{ background: ENVELOPE_PAPER }}
        >
          <div className="absolute inset-0 rounded-[4px] bg-black/20" />
        </div>

        {/* La carta: sale al abrir y es en ella donde entra la cámara. Del papel de la invitación. */}
        <div className="inv-dear-card absolute inset-x-[8%] top-[8%] bottom-[10%] z-[2] grid place-items-center rounded-[3px] bg-inv-bg shadow-[0_2px_8px_rgb(0_0_0/0.12)]">
          <span className="inv-dear-card-mark font-inv-script text-[1.6rem] leading-none text-inv-accent">
            {monogram}
          </span>
        </div>

        {/* El bolsillo, recortado en V por arriba, con los dobleces de las solapas. */}
        <div
          className="inv-dear-front absolute inset-0 z-[3] rounded-b-[4px] [clip-path:polygon(0_0,50%_52%,100%_0,100%_100%,0_100%)]"
          style={{ background: ENVELOPE_PAPER }}
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 size-full text-black"
          >
            <path
              d="M0 100 L50 56 L100 100"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.12"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        <div className="inv-dear-flap absolute inset-x-0 top-0 z-[5] h-[56%] origin-top [filter:drop-shadow(0_4px_5px_rgb(0_0_0/0.18))]">
          <div
            className="absolute inset-0 rounded-t-[4px] [clip-path:polygon(0_0,100%_0,50%_100%)]"
            style={{ background: `${PAPER_SHEEN}, ${ENVELOPE_PAPER}` }}
          />
        </div>

        <div className="absolute top-[56%] left-1/2 z-[6] -translate-x-1/2 -translate-y-1/2">
          <WelcomeOpenButton
            label={content.openLabel}
            className="inv-seal-pulse inv-dear-seal relative block size-[clamp(4rem,17vw,4.8rem)] rounded-full hover:scale-[1.05] active:scale-[0.97]"
          >
            <WaxSeal mark={mark} className="size-full" />
          </WelcomeOpenButton>
        </div>
      </div>

      <p className="inv-dear-caption mt-7 mb-0 max-w-[18rem] font-inv-display text-[clamp(1rem,4.3vw,1.15rem)] leading-snug tracking-[0.02em] text-inv-ink italic">
        {hasText(content.note) ? content.note : '¡Tenemos una invitación muy especial para ti!'}
      </p>

      <div className="inv-dear-caption mt-auto flex flex-col items-center gap-3 pt-8">
        <span aria-hidden="true" className="text-[10.5px] tracking-[0.32em] text-inv-ink-soft uppercase">
          {content.openLabel}
        </span>
        {/* La flecha también abre: es el gesto que la referencia pide —«sigue hacia abajo»— y la
            salida para quien no reconoce el lacre como botón. */}
        <WelcomeOpenButton
          label={content.openLabel}
          className="inv-bob grid size-10 place-items-center rounded-full border border-inv-line text-inv-accent hover:bg-inv-accent/10"
        >
          <ArrowDown size={16} strokeWidth={1.6} aria-hidden="true" />
        </WelcomeOpenButton>
      </div>
    </WelcomeShell>
  );
}

/**
 * El papel del sobre: un topo cálido sacado del tema —la tinta suave mezclada con la superficie,
 * y un toque del acento para calentarlo— para que el sobre se distinga del fondo crema sin traer
 * un color que el tema no tiene. Sin el acento, en los temas de tinta fría salía gris.
 */
const ENVELOPE_PAPER =
  'color-mix(in srgb, var(--inv-color-accent) 34%, color-mix(in srgb, var(--inv-color-ink-soft) 26%, var(--inv-color-surface)))';
