import { BlockHeading } from '../../shared/BlockHeading';
import { blockIconComponent } from '../../shared/block-icons';
import { BlockImage } from '../../shared/BlockImage';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { TextLink } from '../../shared/TextLink';
import type { DetailsVariantProps } from './details-variant';

/**
 * `details.stack` — los detalles en fichas apiladas, con una placa cuadrada por dato.
 *
 * Es la sexta variante del bloque y la que le toca a `silk`, la plantilla cuya referencia no
 * tiene sección de detalles: no hay nada que copiar, así que se compone con el material del resto
 * de la invitación —fichas de papel apoyadas sobre el fondo, placa cuadrada a la izquierda,
 * rótulo en versalitas—, que es lo mismo que ahí hacen las telas del código de vestimenta.
 *
 * ## En qué se diferencia de las otras cinco
 *
 *   `cards`    rejilla de tarjetas, el icono en un medallón redondo arriba.
 *   `list`     una columna con filetes, sin caja: el dato se apoya en el papel.
 *   `split`    el encabezado anclado a un lado y los detalles al otro.
 *   `panel`    una franja del color principal a ancho completo.
 *   `program`  dos columnas contra un filete central, como un programa de mano.
 *   `stack`    **una ficha por dato, a ancho completo, con la placa cuadrada al margen.**
 *
 * La diferencia con `cards` no es el borde: es la dirección de lectura. En rejilla, seis detalles
 * son un bloque que se abarca de un vistazo y en el que ninguno manda; apilados a ancho completo
 * se leen de arriba abajo y uno detrás de otro, que es como se consulta una lista de cosas
 * prácticas —«a qué hora, cómo llego, de qué me visto, dónde dejo el coche»—. La rejilla es un
 * escaparate; la pila, una hoja de instrucciones.
 *
 * ## La placa es cuadrada, y con eso basta para que sea otra familia
 *
 * `IconBadge` dibuja un medallón redondo con el icono dentro, y lo usan `cards` y `list`. Aquí no
 * se reutiliza: el cuadrado es la forma que repite esta plantilla en las muestras de tela y en las
 * fichas de la portada, y un círculo en medio de una composición de rectángulos es la pieza que
 * canta. Es la misma decisión que en `dresscode.swatches`, y por eso las dos secciones se leen
 * como parte de la misma papelería.
 *
 * ## La fotografía, si llega, va arriba y a lo ancho
 *
 * Como banda y no dentro de una ficha: metida en una, la foto competiría con las placas y la fila
 * que la llevara dejaría de parecerse a las demás. Arriba hace de portada de la sección y las
 * fichas siguen siendo iguales entre sí, que es lo que hace que se lean como una lista.
 */
export function DetailsStack({ content }: DetailsVariantProps) {
  return (
    <BlockSection block="details" variant="stack">
      <BlockContainer className="max-w-3xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
        />

        {content.image && (
          <figure className="relative isolate m-0 mt-12 aspect-[21/9] w-full overflow-hidden rounded-inv-md shadow-inv-soft">
            <BlockImage image={content.image} sizes="(min-width: 768px) 768px, 100vw" />
          </figure>
        )}

        <ul className="mt-10 grid list-none gap-3.5 p-0">
          {content.items.map((item, index) => {
            const Icon = blockIconComponent(item.icon);

            return (
              // El índice como clave es correcto aquí: los detalles no se reordenan ni se insertan
              // en caliente, se renderizan una vez desde contenido guardado.
              <li
                key={index}
                className="flex items-start gap-5 rounded-inv-md border border-inv-line bg-inv-surface px-5 py-5 shadow-inv-soft sm:gap-6 sm:px-7"
              >
                {/*
                  La placa. Cuadrada, con filete de acento y sin relleno de color: es una muestra
                  montada sobre la ficha, no un botón. `shrink-0` para que la columna de placas
                  quede a plomo aunque un rótulo largo estire la fila.
                */}
                <span
                  aria-hidden="true"
                  className="grid size-12 shrink-0 place-items-center rounded-inv-sm border border-inv-accent/40 text-inv-accent"
                >
                  <Icon size={20} strokeWidth={1.5} />
                </span>

                <div className="min-w-0">
                  <h3 className="m-0 text-[11.5px] leading-snug font-normal tracking-[0.2em] text-inv-ink uppercase">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="mt-2 mb-0 text-[14.5px] leading-relaxed text-inv-ink-soft">
                      {item.description}
                    </p>
                  )}

                  {item.action && <TextLink action={item.action} className="mt-3" />}
                </div>
              </li>
            );
          })}
        </ul>

        {content.note && <BlockNote note={content.note} className="mt-10 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
