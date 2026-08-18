import Image from 'next/image';
import { DEMO_TEMPLATES } from '@/components/invitation/demo/templates';
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
 * felices» y nadie se cree ninguna; aquí las tres salen de contar lo que hay —las plantillas
 * locales, las variantes dadas de alta en el registro y los tipos de evento del catálogo—, así
 * que no pueden envejecer ni mentir. Añadir una variante sube el número; quitarla lo baja.
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
export function LandingAbout({
  themeCount,
  eventTypeCount,
}: {
  readonly themeCount: number;
  readonly eventTypeCount: number;
}) {
  const photo = MARKETING_PHOTOS.story;

  const figures = [
    { value: DEMO_TEMPLATES.length, label: 'Plantillas completas' },
    { value: registeredIds().length, label: 'Diseños de sección' },
    { value: eventTypeCount, label: 'Tipos de celebración' },
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

            <p className="mt-7 mb-0 max-w-lg text-[16px] leading-relaxed text-ink/70">
              Cada invitación se arma sección a sección con la plantilla y el tema que le van a tu
              celebración, y se abre en el teléfono de tus invitados tal como la ves aquí. Detrás
              queda lo que nadie enseña: el panel donde se cuentan las confirmaciones, se ordenan
              las familias y se reparten las mesas.
            </p>

            <p className="mt-5 mb-0 max-w-lg text-[16px] leading-relaxed text-ink/70">
              Trabajamos con {themeCount > 0 ? `${themeCount} paletas` : 'paletas'} distintas y con
              los diseños del catálogo, así que dos eventos nunca reciben la misma invitación.
            </p>

            <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-line pt-10 sm:grid-cols-3">
              {figures.map((figure) => (
                <div key={figure.label}>
                  <dt className="sr-only">{figure.label}</dt>
                  <dd className="m-0">
                    <span className="block font-display text-[clamp(2.2rem,5vw,3rem)] leading-none font-light text-plum tabular-nums">
                      {figure.value}
                    </span>
                    <span className="mt-3 block text-[11px] tracking-[0.2em] text-ink/55 uppercase">
                      {figure.label}
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
