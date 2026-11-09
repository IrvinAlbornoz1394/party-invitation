import type { Metadata } from 'next';
import Image from 'next/image';
import { demoStructures, findDemoTemplate } from '@/components/invitation/demo/templates';
import { homeDisplay } from '@/components/home/fonts';
import { HomeFooter } from '@/components/home/HomeFooter';
import { HomeHeader } from '@/components/home/HomeHeader';
import '@/components/home/home.css';
import { QuoteForm } from '@/components/marketing/QuoteForm';
import { browseShowcase } from '@/infrastructure/container';
import { INITIAL_QUOTE_STATE } from './form-state';
import { submitQuoteAction } from './actions';

export const metadata: Metadata = {
  title: 'Pedir información · MiEvento',
  description:
    'Cuéntanos qué celebras y te escribimos por WhatsApp con una propuesta para tu invitación.',
};

/** Lo que pasa después de enviar. Tres pasos, los mismos que se cumplen de verdad. */
const NEXT_STEPS = [
  ['Te escribimos', 'Por WhatsApp, en menos de 24 horas, con las dudas que queden.'],
  ['Te mandamos la propuesta', 'Con el plan que te conviene y la plantilla que elegiste.'],
  ['La armamos contigo', 'Nos pasas los datos y las fotos y la revisas antes de publicarla.'],
] as const;

/**
 * El punto de contacto que faltaba.
 *
 * Hasta ahora los botones de venta de la landing llevaban a `/panel`, o sea al acceso del cliente:
 * quien pulsaba acababa en una pantalla que le pedía un correo que todavía no existe. Esta es la
 * pantalla a la que tenían que llevar.
 *
 * ## Con la ropa de la portada
 *
 * Es la continuación de la portada, no un trámite aparte: la misma cabecera, el mismo pie, el vino
 * y el oro del logotipo (`components/home`). En escritorio, un costado vino cuenta qué pasa
 * después de enviar —la duda que frena a quien está a punto de hacerlo— y el formulario va sobre
 * el papel; en el teléfono ese costado se reduce a una línea y el formulario sube.
 *
 * ## Los parámetros son la mitad del valor
 *
 * `?plan=` y `?plantilla=` llegan desde la lámina o la plantilla que la persona estaba mirando y
 * viajan ocultos en el formulario. Es lo que hace que la solicitud llegue diciendo **qué le
 * gustó**, y sin eso esto sería un formulario de contacto genérico que no ahorra ninguna
 * conversación. Si se reconocen, además se le enseñan («Viste: Botanical · Premium»): confirma
 * que lo que eligió viaja con la solicitud.
 *
 * No se validan contra el catálogo a propósito. Son una pista sobre de dónde venía alguien, no una
 * referencia: si mañana se retira esa plantilla, la solicitud tiene que seguir contando lo que esa
 * persona miró ese día. Por eso tampoco tienen clave ajena en la tabla — y por eso, si no se
 * reconocen, simplemente no se enseñan.
 *
 * ## Los tipos de evento salen del catálogo
 *
 * De `browseShowcase`, igual que la landing. Escribir «Boda» y «XV años» a mano aquí crearía una
 * segunda lista que el día que el catálogo cambie diría otra cosa.
 */
export default async function QuotePage({
  searchParams,
}: {
  readonly searchParams: Promise<{ plan?: string; plantilla?: string }>;
}) {
  const [{ plan, plantilla }, showcase] = await Promise.all([searchParams, browseShowcase.execute()]);

  const chosenTemplate = plantilla ? findDemoTemplate(plantilla)?.name : undefined;
  const chosenPlan = plan ? showcase.plans.find((option) => option.key === plan)?.name : undefined;
  const chosen = [chosenTemplate, chosenPlan].filter(Boolean).join(' · ');

  const footerTemplates = demoStructures()
    .slice(0, 6)
    .map((structure) => ({ name: structure.name, href: `/plantillas/${structure.entryKey}` }));

  return (
    <div className={`home min-h-svh ${homeDisplay.variable}`}>
      <HomeHeader alwaysSolid />

      <main className="pt-16 sm:pt-20">
        <div className="mx-auto grid max-w-7xl lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-0 lg:px-8 lg:py-14">
          {/* El costado vino: qué pasa después. En el teléfono, solo el titular y una línea. */}
          <aside className="relative overflow-hidden bg-(--h-wine) px-5 pt-10 pb-12 text-center text-(--h-wine-ink) sm:px-8 lg:rounded-l-[28px] lg:px-12 lg:py-16 lg:text-left">
            <Image
              src="/brand/isologo.png"
              alt=""
              width={851}
              height={693}
              sizes="96px"
              priority
              className="h-mark-cream mx-auto h-auto w-16 opacity-90 lg:mx-0 lg:w-20"
            />
            <span className="h-eyebrow h-eyebrow--dark mt-6">Pedir información</span>
            <h1 className="h-display mt-5 mb-0 text-[clamp(2.2rem,8vw,3.6rem)] text-balance">
              Cuéntanos qué celebras
            </h1>
            <p className="mx-auto mt-4 mb-0 max-w-[40ch] text-[15.5px] leading-relaxed text-(--h-wine-ink)/80 lg:mx-0 lg:text-[16.5px]">
              Con dos datos nos basta para escribirte. Lo demás nos ayuda a llegar con una propuesta
              en lugar de con más preguntas.
            </p>

            {chosen && (
              <p className="mx-auto mt-6 mb-0 inline-flex max-w-full items-center gap-2 rounded-full bg-(--h-wine-ink)/10 px-4 py-2 text-[13px] tracking-[0.08em] lg:mx-0">
                <span className="text-(--h-gold)">Viste:</span>
                <span className="truncate">{chosen}</span>
              </p>
            )}

            <ol className="mt-10 hidden list-none gap-6 p-0 lg:grid">
              {NEXT_STEPS.map(([title, text], index) => (
                <li key={title} className="grid grid-cols-[auto_1fr] gap-x-4">
                  <span className="h-display text-[2rem] leading-none text-(--h-gold)">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>
                    <span className="block text-[15px] font-medium tracking-[0.04em]">{title}</span>
                    <span className="mt-1 block text-[14.5px] leading-relaxed text-(--h-wine-ink)/70">{text}</span>
                  </span>
                </li>
              ))}
            </ol>

            <p className="mt-8 mb-0 text-[12px] tracking-[0.18em] text-(--h-gold) uppercase lg:mt-12">
              Respuesta por WhatsApp en menos de 24 horas
            </p>
          </aside>

          {/* El formulario, sobre el papel. En escritorio sube un poco sobre el costado. */}
          <section
            aria-label="Formulario de solicitud"
            className="px-5 py-10 sm:px-8 sm:py-14 lg:rounded-r-[28px] lg:bg-(--h-white) lg:px-12 lg:py-16 lg:shadow-[0_40px_80px_-50px_rgba(74,26,44,0.45)]"
          >
            <QuoteForm
              eventTypes={showcase.eventTypes.map((type) => ({ key: type.key, name: type.name }))}
              planKey={plan ?? null}
              templateKey={plantilla ?? null}
              action={submitQuoteAction}
              initialState={INITIAL_QUOTE_STATE}
            />
          </section>
        </div>

        {/* En el teléfono los tres pasos van después del formulario: primero lo que se viene a
            hacer, y debajo, para quien duda, qué pasa al enviar. */}
        <ol className="mx-5 mb-14 grid list-none gap-5 rounded-[22px] bg-(--h-paper-2) p-6 sm:mx-8 lg:hidden">
          {NEXT_STEPS.map(([title, text], index) => (
            <li key={title} className="grid grid-cols-[auto_1fr] gap-x-4">
              <span className="h-display text-[1.7rem] leading-none text-(--h-gold-deep)">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>
                <span className="block text-[15px] font-medium text-(--h-wine)">{title}</span>
                <span className="mt-1 block text-[14.5px] leading-relaxed text-(--h-muted)">{text}</span>
              </span>
            </li>
          ))}
        </ol>
      </main>

      <HomeFooter templates={footerTemplates} />
    </div>
  );
}
