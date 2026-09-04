import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { type DemoStructure, demoStructures } from '@/components/invitation/demo/templates';

/**
 * Las plantillas, para verlas por dentro antes de comprar.
 *
 * Es la sección que vende. La tarjeta no lleva a una captura ni a un vídeo: lleva a la
 * invitación de verdad, montada con los mismos componentes que tendrá el evento de quien la
 * contrate. Es la diferencia entre «mira qué bonito» y «toca esto», y en un producto que se
 * decide por cómo se ve, la segunda hace todo el trabajo.
 *
 * ## Una tarjeta por ESTRUCTURA, no por demo
 *
 * `DEMO_TEMPLATES` tiene una entrada por estructura y tipo de evento, y eso está bien para las
 * URLs: `/plantillas/botanical` y `/plantillas/botanical-xv` son composiciones distintas y cada
 * una se comparte con su propia vista previa. Listarlas aquí tal cual, en cambio, sacaba **dos
 * tarjetas llamadas «Botanical»** sin más diferencia que un rótulo pequeño.
 *
 * Y era una mentira sobre el producto: `templates` perdió su columna `event_type_key` justamente
 * porque una estructura no pertenece a un tipo de evento. Ahora se agrupa por `structureKey` y la
 * tarjeta dice «Boda · XV Años», que es lo que de verdad ofrece. El salto entre tipos vive donde
 * tiene sentido —dentro de la demo, con el selector que ya existe—, no en un catálogo que finge
 * tener el doble de plantillas.
 *
 * ## El mosaico, y por qué encaja exacto en cada tramo
 *
 * Cinco estructuras. La destacada ocupa cuatro celdas, 2×2, y las otras cuatro llenan justo las
 * que quedan — **cero huecos en los dos tramos**:
 *
 *   dos columnas     la destacada a ancho completo y las cuatro en un cuadrado de 2×2
 *   cuatro columnas  la destacada 2×2 a la izquierda y las cuatro en las columnas 3 y 4
 *
 * Las cuatro columnas empiezan en `xl` y no en `lg` a propósito: a 1024 px una columna de cuatro
 * mide 212 px y el gancho de la tarjeta se parte en cinco renglones. Entre 1024 y 1280 se queda el
 * de dos columnas, que a esos anchos se lee mejor que un mosaico apretado.
 *
 * La versión anterior era «una grande a la izquierda y el resto apilado a la derecha», escrita
 * cuando había cuatro demos; al llegar a seis, la columna derecha se volvía una torre de cintas
 * mucho más alta que la destacada. Cualquier composición con una pieza mayor tiene que decir qué
 * pasa cuando el catálogo crece, y esta lo dice en el propio código: la última se estira si queda
 * impar, y el resto cuadra solo.
 *
 * ## Retratos, no panorámicas
 *
 * Una invitación es vertical. Las portadas van en retrato para que la tarjeta se lea como la pieza
 * que vende y no como la fotografía de archivo de la que salió — cuatro retratos en fila son la
 * composición de un catálogo de papelería, cuatro panorámicas la de un blog de viajes.
 *
 * La destacada no lleva proporción fija en el mosaico: **estira** para llenar sus dos filas
 * (`xl:flex-1`), así que su altura la fijan las tarjetas pequeñas de al lado y todo queda a
 * escuadra sin números mágicos. Por debajo vuelve a una proporción declarada, donde ya no hay nada
 * con lo que cuadrar.
 *
 * ## Sin base de datos
 *
 * Se lee de `DEMO_TEMPLATES`, que es contenido local. Esta sección no consulta nada, así que la
 * portada sigue en pie aunque Postgres no esté — y en una página de venta, estar caído es peor
 * que estar desactualizado.
 */
export function TemplateShowcase() {
  const [featured, ...rest] = demoStructures();

  if (!featured) return null;

  /*
   * En la retícula de dos columnas, un número impar de tarjetas pequeñas deja la última sola en
   * media fila. Se le da el ancho completo solo en ese tramo: en el mosaico de cuatro columnas
   * tiene que volver a ocupar una celda, o desmonta el bloque de la derecha.
   */
  const strandsLast = rest.length % 2 === 1;

  return (
    <section id="plantillas" className="bg-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:px-10 sm:py-28">
        {/* Centrado, como el resto de los encabezados de la página. En una sección cuyo contenido
            es una retícula simétrica, un encabezado alineado a la izquierda deja la composición
            coja por un lado. */}
        <header className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <p className="m-0 flex items-center gap-4 text-[11px] tracking-[0.3em] text-accent uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-accent/45" />
            Plantillas
            <span aria-hidden="true" className="h-px w-8 bg-accent/45" />
          </p>
          <h2 className="m-0 font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.08] font-medium tracking-[-0.03em] text-ink">
            Míralas por dentro
            <span className="block italic">antes de decidir</span>
          </h2>
          <p className="m-0 text-[16px] leading-relaxed text-ink/75">
            Cada una se abre completa y se puede cambiar en vivo: el tipo de celebración, el tema y
            el diseño de cada sección. Lo que veas es exactamente lo que recibirán tus invitados.
          </p>
        </header>

        {/*
          `auto-rows-fr` es lo que sostiene el mosaico: iguala las dos filas, de modo que la
          destacada —que abarca las dos— mide exactamente el doble que una pequeña más el hueco.
          Sin esto, cada fila se ajustaría a su propio contenido y la pieza mayor quedaría
          descuadrada respecto a las de al lado.
        */}
        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:auto-rows-fr xl:grid-cols-4 xl:gap-8">
          <StructureCard
            structure={featured}
            featured
            className="md:col-span-2 xl:col-span-2 xl:row-span-2"
          />

          {rest.map((structure, index) => (
            <StructureCard
              key={structure.structureKey}
              structure={structure}
              className={clsx(
                strandsLast && index === rest.length - 1 && 'md:col-span-2 xl:col-span-1',
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StructureCard({
  structure,
  featured = false,
  className,
}: {
  readonly structure: DemoStructure;
  readonly featured?: boolean;
  readonly className?: string;
}) {
  return (
    /*
     * La tarjeta entera es el enlace. Con el enlace solo en el botón, el noventa por ciento de la
     * superficie que la gente intenta pulsar en un móvil no hace nada.
     */
    <Link
      href={`/plantillas/${structure.entryKey}`}
      /* Sin filete alrededor: la tarjeta es la fotografía y su pie, montados sobre el papel de
         color. Un borde de un píxel la convertía en una ficha de catálogo. */
      className={clsx(
        'group flex h-full flex-col overflow-hidden bg-blush/50 transition-colors hover:bg-blush focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none',
        className,
      )}
    >
      <div
        className={clsx(
          'relative w-full overflow-hidden bg-blush',
          /* La destacada estira; las pequeñas declaran su retrato. Ver el comentario de la
             sección: es lo que mantiene el mosaico a escuadra sin medidas fijas. */
          featured
            ? 'aspect-[3/4] md:aspect-[16/11] xl:aspect-auto xl:flex-1'
            : 'aspect-[3/4] md:aspect-[4/5]',
        )}
      >
        <Image
          src={structure.cover.url}
          alt={structure.cover.alt}
          fill
          /*
           * Las medidas reales del mosaico, no una aproximación: en el tramo de cuatro columnas la
           * destacada ocupa la mitad del contenedor de 72rem y una pequeña un cuarto. Darlas mal
           * hace que el navegador baje un archivo de más resolución de la que se ve.
           */
          sizes={
            featured
              ? '(min-width: 1280px) 46vw, (min-width: 768px) 92vw, 92vw'
              : '(min-width: 1280px) 23vw, (min-width: 768px) 46vw, 92vw'
          }
          /* Sin `priority`: esta sección va por debajo del pliegue y competiría con la fotografía
             de la portada, que es la que mide el LCP. */
          className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </div>

      <div
        className={clsx(
          'flex flex-col',
          /* El pie de la pequeña crece para que `mt-auto` empuje el enlace al fondo y las tarjetas
             de una fila alineen su llamada. En la destacada crece la fotografía, no el pie: si
             creciera el pie, el enlace se iría a medio metro del texto. */
          featured ? 'gap-3 px-7 py-8 sm:px-9 sm:py-10' : 'flex-1 gap-2 px-6 py-6',
        )}
      >
        {/* Para qué celebraciones existe esta estructura. Cuando son varias, es el argumento: la
            misma plantilla sirve para una boda y para unos XV, y aquí es donde se dice. */}
        <p className="m-0 text-[10.5px] tracking-[0.24em] text-accent uppercase">
          {structure.eventTypeNames.join(' · ')}
        </p>

        <h3
          className={clsx(
            'm-0 font-display leading-tight font-medium text-ink',
            featured
              ? 'text-[clamp(1.75rem,3.5vw,2.5rem)] tracking-[-0.025em]'
              : 'text-[1.5rem] tracking-[-0.02em]',
          )}
        >
          {structure.name}
        </h3>

        {/* `/80` y no menos: sobre el papel rosado de la tarjeta, la tinta al 65% se quedaba en
            3.4:1 de contraste — por debajo del mínimo legible, y peor todavía en `hover`, cuando
            el papel se satura. */}
        <p
          className={clsx(
            'm-0 leading-relaxed text-ink/80',
            featured ? 'max-w-md text-[15px]' : 'text-[14px]',
          )}
        >
          {structure.tagline}
        </p>

        <span className="mt-auto inline-flex items-center gap-2 pt-5 text-[11.5px] font-semibold tracking-[0.16em] text-plum uppercase">
          Ver la demo
          {/* La flecha se desplaza en `hover`: es la microinteracción más barata que existe y la
              única que hace falta aquí — dice «esto lleva a otro sitio» sin añadir un botón. */}
          <ArrowRight
            aria-hidden="true"
            size={15}
            strokeWidth={1.75}
            className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
          />
        </span>
      </div>
    </Link>
  );
}
