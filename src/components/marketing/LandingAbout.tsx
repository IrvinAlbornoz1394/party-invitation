import Image from 'next/image';
import clsx from 'clsx';
import { demoStructures } from '@/components/invitation/demo/templates';
import { registeredIds } from '@/components/invitation/registry/component-registry';
import { MARKETING_PHOTOS } from './photos';

/**
 * Quiénes somos, en la mitad de la página en la que alguien todavía no ha decidido nada.
 *
 * Va después de la portada y antes de las plantillas porque responde a la pregunta que se hace
 * cualquiera al aterrizar: «¿esto qué es exactamente?». Una frase, un párrafo y tres cifras.
 *
 * ## Las cifras son de verdad, y por eso se cuentan solas
 *
 * Es la decisión que sostiene esta sección. Toda página de este ramo enseña «1000 parejas
 * felices» y nadie se cree ninguna; aquí las dos salen de contar lo que hay —las plantillas
 * locales y las variantes dadas de alta en el registro—, así que no pueden envejecer ni mentir.
 * Añadir una variante sube el número; quitarla lo baja.
 *
 * Hubo una tercera, «tipos de celebración», y se quitó al estrechar el producto a bodas y XV.
 * Contaba los tipos del catálogo, que son nueve, mientras que lo que se vende son dos: la cifra
 * seguía siendo cierta y aun así prometía lo que no hay. Y contar «2» tampoco servía — presumir
 * de dos es peor que no presumir de nada.
 *
 * Lo que **no** se enseña son clientes, eventos organizados ni testimonios. No porque queden mal
 * sino porque habría que inventarlos, y una cifra inventada en la página de venta es la primera
 * grieta de la confianza que este producto necesita: alguien nos va a dar la lista de invitados
 * de su boda.
 *
 * ## La fotografía lleva marco desplazado
 *
 * Un rectángulo del color del papel de fondo, corrido unos milímetros. Es el recurso de una
 * lámina montada sobre cartulina, y es lo que evita que la imagen quede pegada al texto como una
 * captura. Cuesta un `div` y da la mitad del carácter de la sección.
 */
export function LandingAbout({ themeCount }: { readonly themeCount: number }) {
  const photo = MARKETING_PHOTOS.story;

  /*
    El rótulo viene partido en dos líneas a mano, y no es capricho tipográfico.

    Escrito de corrido, cada columna lo rompía donde le cabía: «Plantillas / completas» en una y
    «Diseños de / sección» en la otra, con la segunda línea de cada una empezando a distinta
    altura según el ancho de pantalla. Dos cifras del mismo rango tienen que tener la misma
    silueta, así que el corte se decide aquí y no lo decide el navegador.
  */
  const figures = [
    /* Estructuras, no entradas de demo. `DEMO_TEMPLATES` tiene una por estructura Y tipo de
       evento, así que contarlas decía «6 plantillas» mientras el escaparate de abajo enseñaba
       cinco tarjetas. Una cifra que se cuenta sola no sirve de nada si cuenta la cosa
       equivocada. */
    { value: demoStructures().length, lines: ['Plantillas', 'completas'] },
    { value: registeredIds().length, lines: ['Diseños de', 'sección'] },
  ].filter((figure) => figure.value > 0);

  return (
    <section className="bg-ivory">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:px-10 sm:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="m-0 flex items-center gap-3 text-[11px] tracking-[0.3em] text-accent uppercase">
              <span aria-hidden="true" className="h-px w-8 bg-accent/50" />
              El estudio
            </p>

            <h2 className="mt-7 mb-0 font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.08] font-medium tracking-[-0.03em] text-ink">
              Una invitación cuidada,
              <span className="block italic">y un panel detrás</span>
            </h2>

            <p className="mt-7 mb-0 max-w-lg text-[16px] leading-relaxed text-ink/75">
              Cada invitación se arma sección a sección con la plantilla y el tema que le van a tu
              celebración, y se abre en el teléfono de tus invitados tal como la ves aquí. Detrás
              queda lo que nadie enseña: el panel donde se cuentan las confirmaciones, se ordenan
              las familias y se reparten las mesas.
            </p>

            <p className="mt-5 mb-0 max-w-lg text-[16px] leading-relaxed text-ink/75">
              Trabajamos con {themeCount > 0 ? `${themeCount} paletas` : 'paletas'} distintas y con
              los diseños del catálogo, así que dos eventos nunca reciben la misma invitación.
            </p>

            {/*
              Todas en una sola fila, también en móvil. Son una **banda de datos**, que es lo que
              son: hechos del mismo rango, no una lista. Cualquiera de ellas que caiga sola en
              media fila se lee como un error de maquetación y no como una decisión.

              Las columnas las pone `figures.length` y no un número escrito a mano, porque la
              lista se filtra por `value > 0`: con las columnas fijas, una cifra en cero dejaba
              un hueco vacío en la banda.

              El rótulo baja a 10 px con menos tracking en móvil y recupera sus 11 px en cuanto
              hay sitio. Y entre columna y columna va un filete: a ese ancho, dos bloques sin
              separación se leen como uno solo.
            */}
            <dl
              className={clsx(
                'mt-12 grid items-start gap-x-4 border-t border-line pt-10 sm:gap-x-8',
                figures.length === 2 ? 'grid-cols-2' : 'grid-cols-3',
              )}
            >
              {figures.map((figure, index) => (
                <div
                  key={figure.lines.join(' ')}
                  className={clsx('relative', index > 0 && 'pl-4 sm:pl-0')}
                >
                  {index > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute top-0.5 bottom-0.5 left-0 w-px bg-line sm:hidden"
                    />
                  )}
                  <dt className="sr-only">{figure.lines.join(' ')}</dt>
                  <dd className="m-0">
                    <span className="block font-display text-[clamp(2rem,5vw,3rem)] leading-[0.9] font-light text-plum tabular-nums">
                      {figure.value}
                    </span>
                    {/*
                      Cada línea es su propio bloque para que las dos del vecino caigan a la misma
                      altura; `whitespace-nowrap` impide que «celebración» se vuelva a partir en el
                      teléfono más estrecho.
                    */}
                    <span className="mt-2.5 block text-[10px] leading-[1.5] tracking-[0.12em] text-ink/75 uppercase sm:mt-3 sm:text-[11px] sm:tracking-[0.2em]">
                      {figure.lines.map((line) => (
                        <span key={line} className="block whitespace-nowrap">
                          {line}
                        </span>
                      ))}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/*
            El marco desplazado: un rectángulo de papel de color detrás y la fotografía corrida
            sobre él. Se esconde en móvil —a ancho completo el desplazamiento se convierte en un
            margen raro— y aparece en cuanto hay sitio para que se lea como una lámina montada.
          */}
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute inset-0 hidden translate-x-5 translate-y-5 bg-blush sm:block"
            />
            <div className="relative aspect-[5/4] w-full overflow-hidden bg-blush lg:aspect-[4/3]">
              <Image
                src={photo.url}
                alt={photo.alt}
                fill
                sizes="(min-width: 1024px) 46vw, 92vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
