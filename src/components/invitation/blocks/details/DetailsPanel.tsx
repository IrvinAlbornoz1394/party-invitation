import { BlockCurve } from '../../shared/BlockCurve';
import { BlockHeading } from '../../shared/BlockHeading';
import { IconBadge } from '../../shared/IconBadge';
import { BlockImage } from '../../shared/BlockImage';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { TextLink } from '../../shared/TextLink';
import type { DetailsVariantProps } from './details-variant';

/**
 * `details.panel` — los detalles sobre una franja del color principal del tema.
 *
 * Las otras tres se apoyan en el papel; esta lo invierte. Sirve para lo que sirve una franja de
 * color en una invitación impresa: cortar la página y marcar que aquí está la información
 * práctica. Puesta entre la historia y la galería —dos bloques sobre papel— es lo que evita
 * que la invitación se lea como una sola tirada.
 *
 * ## Lo que esta variante demuestra
 *
 * Que la pareja `primary`/`onPrimary` del tema funciona de verdad. Todo lo de dentro se pinta
 * con `onPrimary` y con transparencias de ese mismo color (`bg-current/5`,
 * `border-current/20`), así que ni un solo valor está escrito a mano: en «Marfil y oro» sale
 * una franja dorada con tinta crema y en «Medianoche», una dorada con tinta oscura, sin tocar
 * este archivo. Un tema que se equivoque en ese par se delata aquí antes que en ningún otro
 * sitio.
 *
 * ## Con fotografía
 *
 * La foto pasa detrás de la franja y el color del tema se convierte en un baño translúcido
 * sobre ella. Es la única de las cuatro en la que la imagen cambia el carácter del bloque en
 * lugar de ocupar un hueco, y es a propósito: una franja de color plano con una foto pegada al
 * lado se ve como dos decisiones distintas; el baño de color las hace una sola.
 *
 * El velo no baja del 85% de opacidad. Por debajo, el contraste de `onPrimary` deja de estar
 * garantizado —depende de qué foto suba el cliente— y este bloque es justamente el de los
 * datos que hay que poder leer.
 */
export function DetailsPanel({ content }: DetailsVariantProps) {
  return (
    <BlockSection
      block="details"
      variant="panel"
      /* El relleno suma la altura del canto del tema: la onda muerde por dentro, y sin ese
         hueco se comería el rótulo. A cero —temas de canto recto— la suma no cambia nada. */
      className="relative isolate bg-inv-primary py-[calc(var(--inv-space-block)+var(--inv-edge-height,0px))] text-inv-on-primary"
    >
      {content.image && (
        <>
          <BlockImage image={content.image} className="-z-20" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-inv-primary/85" />
        </>
      )}

      {/* Las dos ondas van del color del papel y **después** del velo: tienen que morder también
          la fotografía, no solo el color plano. Ver `shared/BlockCurve.tsx`. */}
      <BlockCurve edge="top" className="text-inv-bg" />
      <BlockCurve edge="bottom" className="text-inv-bg" />

      <BlockContainer>
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          tone="inverse"
        />

        <ul className="mt-12 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,13.5rem),1fr))] gap-4 p-0">
          {content.items.map((item, index) => (
            // El índice como clave es correcto aquí: los detalles no se reordenan ni se
            // insertan en caliente, se renderizan una vez desde contenido guardado.
            <li
              key={index}
              className="flex flex-col items-center rounded-inv-md border border-current/20 bg-current/5 px-5 py-7 text-center"
            >
              <IconBadge icon={item.icon} tone="inverse" />

              <h3 className="mt-4 mb-0 font-inv-display text-[1.25rem] leading-tight font-normal">
                {item.title}
              </h3>

              {item.description && (
                <p className="mt-2 mb-0 text-[14px] leading-relaxed opacity-85">
                  {item.description}
                </p>
              )}

              {item.action && <TextLink action={item.action} tone="inverse" className="mt-3" />}
            </li>
          ))}
        </ul>

        {content.note && (
          <BlockNote note={content.note} tone="inverse" className="mt-10 text-center" />
        )}
      </BlockContainer>
    </BlockSection>
  );
}
