import type { Metadata } from 'next';
import { QuoteForm } from '@/components/marketing/QuoteForm';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { browseShowcase } from '@/infrastructure/container';
import { INITIAL_QUOTE_STATE } from './form-state';
import { submitQuoteAction } from './actions';

export const metadata: Metadata = {
  title: 'Pedir información · MiEvento',
  description:
    'Cuéntanos qué celebras y te escribimos por WhatsApp con una propuesta para tu invitación.',
};

/**
 * El punto de contacto que faltaba.
 *
 * Hasta ahora los botones de venta de la landing llevaban a `/panel`, o sea al acceso del cliente:
 * quien pulsaba acababa en una pantalla que le pedía un correo que todavía no existe. Esta es la
 * pantalla a la que tenían que llevar.
 *
 * ## Los parámetros son la mitad del valor
 *
 * `?plan=` y `?plantilla=` llegan desde la lámina o la plantilla que la persona estaba mirando y
 * viajan ocultos en el formulario. Es lo que hace que la solicitud llegue diciendo **qué le
 * gustó**, y sin eso esto sería un formulario de contacto genérico que no ahorra ninguna
 * conversación.
 *
 * No se validan contra el catálogo a propósito. Son una pista sobre de dónde venía alguien, no una
 * referencia: si mañana se retira esa plantilla, la solicitud tiene que seguir contando lo que esa
 * persona miró ese día. Por eso tampoco tienen clave ajena en la tabla.
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

  return (
    <div className="marketing min-h-svh bg-ivory">
      <SiteHeader />

      <main className="mx-auto w-full max-w-2xl px-6 py-16 sm:px-10 sm:py-24">
        <header className="grid gap-5 text-center">
          <p className="m-0 flex items-center justify-center gap-4 text-[11px] tracking-[0.3em] text-accent uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-accent/45" />
            Pedir información
            <span aria-hidden="true" className="h-px w-8 bg-accent/45" />
          </p>
          <h1 className="m-0 font-display text-[clamp(2rem,5vw,3rem)] leading-[1.08] font-medium tracking-[-0.03em] text-ink">
            Cuéntanos qué celebras
          </h1>
          <p className="m-0 text-[16px] leading-relaxed text-ink/75">
            Con dos datos nos basta para escribirte. Lo demás nos ayuda a llegar con una propuesta
            en lugar de con más preguntas.
          </p>
        </header>

        <div className="mt-12">
          <QuoteForm
            eventTypes={showcase.eventTypes.map((type) => ({ key: type.key, name: type.name }))}
            planKey={plan ?? null}
            templateKey={plantilla ?? null}
            action={submitQuoteAction}
            initialState={INITIAL_QUOTE_STATE}
          />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
