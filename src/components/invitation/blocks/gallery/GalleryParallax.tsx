'use client';

import { useRef } from 'react';
import { motion, useMotionTemplate, useScroll, useTransform } from 'framer-motion';
import type { GalleryItem } from '@/domain/invitation/blocks/gallery';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { Lightbox } from '../../shared/Lightbox';
import { useLightbox } from '../../shared/useLightbox';
import { PhotoButton, type GalleryVariantProps } from './gallery-parts';

/**
 * `gallery.parallax` — la galería de la invitación de Kamilah, ya como componente del catálogo.
 *
 * Es la más ambiciosa de las cinco y la que da el «wow»: las fotos se desplazan a distinta
 * velocidad que la página —unas suben y otras bajan— y la última se despliega a pantalla
 * completa a medida que se baja, como si se abriera. Era un componente hecho a medida para un
 * evento; aquí está portada al contrato del bloque, así que sirve para cualquiera.
 *
 * ## Qué cambió al portarla
 *
 * - **Los colores y los radios** vienen del tema. Antes eran el morado y el rosa de aquella
 *   fiesta escritos en `Gallery.css`; ahora funciona igual en los cuatro temas.
 * - **El recorte de la foto final va en porcentajes**, no en `vw`/`svh`. Con unidades de
 *   ventana, la previsualización del panel —que ocupa una parte de la pantalla— calculaba el
 *   recorte contra el monitor entero y la foto se salía del marco.
 * - **El alto usa `--inv-viewport`**, la misma variable con la que la portada sabe cuánto ocupa
 *   una pantalla. Es lo que permite que el efecto se vea dentro de la ventana del panel.
 * - **El visor es el compartido**, así que ampliar una foto se comporta igual que en las otras
 *   cuatro galerías: teclado, flechas y contador incluidos.
 *
 * ## Lo que cuesta
 *
 * Es la única de las cinco que carga framer-motion, y la única cuyo efecto depende de la
 * posición de desplazamiento de la ventana: dentro de un contenedor que se desplaza por su
 * cuenta —la previsualización del panel— las fotos se quedan quietas en su sitio. No es un
 * fallo que se vea en la invitación real, donde quien se desplaza es la página.
 */

/**
 * Dónde cae cada foto de la banda escalonada.
 *
 * Son las mismas posiciones del diseño original, traducidas a la retícula de seis columnas en
 * móvil y doce en escritorio. El patrón se repite cada cinco fotos, así que la galería aguanta
 * cualquier número de imágenes sin que haya que añadir reglas — que es justamente lo que le
 * faltaba a la versión hecha a medida, atada a seis.
 *
 * ## En móvil manda la proporción, no la altura
 *
 * En escritorio las alturas van en píxeles: son medidas de composición, elegidas para que ninguna
 * foto quede a la misma altura que su vecina. En móvil eso no funciona — una columna de 176px de
 * ancho con 245px de alto impuestos recorta la fotografía en un formato que nadie eligió, y en
 * una pantalla estrecha se nota enseguida. Ahí manda la proporción, que escala con el ancho.
 */
const PLACEMENTS = [
  'col-span-4 aspect-[4/5] md:col-start-1 md:aspect-auto md:h-[310px]',
  'col-start-3 col-span-4 aspect-square md:col-start-3 md:aspect-auto md:h-[240px]',
  'col-span-4 aspect-[3/4] md:col-start-8 md:aspect-auto md:h-[365px]',
  'col-start-3 col-span-4 aspect-[4/5] md:col-start-2 md:aspect-auto md:h-[310px]',
  'col-span-4 aspect-[5/4] md:col-start-7 md:aspect-auto md:h-[250px]',
] as const;

export function GalleryParallax({ content }: GalleryVariantProps) {
  const lightbox = useLightbox(content.items.length);

  /*
   * La última foto es la que se despliega. Con solo dos fotos, una queda arriba y la otra abajo
   * a pantalla completa, que sigue siendo una composición y no un caso roto.
   */
  const staggered = content.items.slice(0, -1);
  const finale = content.items.at(-1);
  const finaleIndex = content.items.length - 1;

  return (
    <BlockSection block="gallery" variant="parallax" className="pb-0">
      <BlockContainer>
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
        />

        <div className="mt-12 grid grid-cols-6 gap-3 md:grid-cols-12 md:gap-6">
          {staggered.map((item, index) => (
            // El índice como clave es correcto aquí: las fotos no se reordenan ni se insertan
            // en caliente, se renderizan una vez desde contenido guardado.
            <ParallaxPhoto
              key={index}
              item={item}
              index={index}
              total={content.items.length}
              onOpen={lightbox.open}
            />
          ))}
        </div>
      </BlockContainer>

      {finale && (
        <FinalePhoto
          item={finale}
          index={finaleIndex}
          total={content.items.length}
          onOpen={lightbox.open}
        />
      )}

      {content.note && (
        <BlockContainer>
          <BlockNote note={content.note} className="mt-12 pb-20 text-center" />
        </BlockContainer>
      )}

      <Lightbox
        items={content.items}
        index={lightbox.index}
        onClose={lightbox.close}
        onMove={lightbox.move}
      />
    </BlockSection>
  );
}

/**
 * Una foto de la banda, moviéndose contra el desplazamiento.
 *
 * El sentido se alterna: las pares suben mientras la página baja y las impares hacen lo
 * contrario. Es de donde sale la sensación de profundidad — si todas se movieran igual, se
 * vería una banda desplazándose y no unas fotos flotando.
 *
 * El recorrido es de 55px. Parece poco y es deliberado: con recorridos largos, las fotos llegan
 * al borde de su hueco y se ve el corte, además de que el efecto pasa de elegante a mareante.
 */
function ParallaxPhoto({
  item,
  index,
  total,
  onOpen,
}: {
  readonly item: GalleryItem;
  readonly index: number;
  readonly total: number;
  readonly onOpen: (index: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const direction = index % 2 === 0 ? -1 : 1;
  const y = useTransform(scrollYProgress, [0, 1], [55 * direction, -55 * direction]);

  return (
    <motion.div
      ref={ref}
      style={{ y }}
      className={`${PLACEMENTS[index % PLACEMENTS.length]} rounded-inv-md shadow-inv-soft`}
    >
      <PhotoButton
        item={item}
        index={index}
        total={total}
        onOpen={onOpen}
        className="h-full rounded-inv-md"
        sizes="(min-width: 768px) 33vw, 66vw"
      />
    </motion.div>
  );
}

/**
 * La foto final, que se abre al bajar.
 *
 * El contenedor mide casi el doble de una pantalla y la foto se queda pegada arriba mientras se
 * recorre: ese trecho de más es el que da tiempo a que el recorte se abra. Sin él, el efecto
 * ocurriría en dos dedos de desplazamiento y no se vería.
 *
 * El recorte va en porcentajes del propio elemento —no en unidades de ventana— para que el
 * efecto sea el mismo dentro de la invitación y dentro del recuadro de previsualización del
 * panel.
 */
function FinalePhoto({
  item,
  index,
  total,
  onOpen,
}: {
  readonly item: GalleryItem;
  readonly index: number;
  readonly total: number;
  readonly onOpen: (index: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start center', 'end end'] });
  const insetY = useTransform(scrollYProgress, [0, 0.12, 0.78, 1], [18, 18, 0, 0]);
  const insetX = useTransform(scrollYProgress, [0, 0.12, 0.78, 1], [12, 12, 0, 0]);
  const radius = useTransform(scrollYProgress, [0.12, 0.78], [14, 0]);
  const clipPath = useMotionTemplate`inset(${insetY}% ${insetX}% round ${radius}px)`;

  return (
    <div
      ref={ref}
      className="relative mt-16 h-[calc(1.8*var(--inv-viewport,100svh))] w-full"
    >
      <motion.div
        style={{ clipPath }}
        className="sticky top-0 h-[var(--inv-viewport,100svh)] w-full"
      >
        <PhotoButton
          item={item}
          index={index}
          total={total}
          onOpen={onOpen}
          className="h-full"
          sizes="100vw"
        />
      </motion.div>
    </div>
  );
}
