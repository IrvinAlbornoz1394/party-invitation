import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import type { PublicPlan } from '@/application/catalog/browse-showcase';
import { PlansCarousel } from './PlansCarousel';

const ONLINE_RSVP = 'Confirmación de asistencia en línea';

interface PlanImage {
  readonly url: string;
  readonly alt: string;
}

/**
 * Los planes, como tres salones para elegir: una foto arriba de cada tarjeta y el plan mayor en
 * vino, un poco más alto, al centro de la fila.
 *
 * El precio es «A medida» porque depende de la celebración: no hay cifras que enseñar. Lo que sí
 * se dice es lo que cambia de verdad entre planes, sacado del catálogo, con la misma lógica que la
 * tabla anterior: cómo confirman los invitados y lo que un plan trae y otro no.
 */
export function HomePlans({
  plans,
  images,
}: {
  readonly plans: readonly PublicPlan[];
  readonly images: readonly PlanImage[];
}) {
  if (plans.length === 0) {
    return (
      <section id="planes" aria-labelledby="planes-titulo" className="px-5 py-20 text-center sm:py-28">
        <span className="h-eyebrow">Planes</span>
        <h2 id="planes-titulo" className="h-heading mt-5 mb-0">
          Elige tu plan
        </h2>
        <p className="mx-auto mt-5 mb-0 max-w-md text-(--h-muted)">
          Cuéntanos de tu evento y te mandamos los planes con su precio.
        </p>
        <Link href="/cotizar" className="h-button h-button--wine mt-8">
          Cotizar mi evento
        </Link>
      </section>
    );
  }

  const common = plans.reduce<readonly string[]>(
    (shared, plan) => shared.filter((feature) => plan.features.includes(feature)),
    plans[0]?.features ?? [],
  );
  const featured = plans.length - 1;
  /* En escritorio el plan mayor va al centro, como la sala destacada de la referencia; en el
     teléfono va primero, que es la tarjeta que se ve entera al llegar. */
  const desktopOrder = (index: number) =>
    plans.length !== 3 ? undefined : index === featured ? 'md:order-2' : index === 0 ? 'md:order-1' : 'md:order-3';

  const mobileOrder = [featured, ...plans.map((_, index) => index).filter((index) => index !== featured)];
  const cardProps = (index: number): Omit<PlanCardProps, 'variant'> => {
    const plan = plans[index] as PublicPlan;
    return {
      plan,
      index,
      isFeatured: index === featured,
      image: images[index % Math.max(images.length, 1)],
      common,
      orderClass: desktopOrder(index),
    };
  };

  return (
    <section id="planes" aria-labelledby="planes-titulo" className="bg-(--h-paper-2) py-20 sm:py-28 md:px-8">
      <header data-reveal className="px-5 text-center md:px-0">
        <span className="h-eyebrow">Planes</span>
        <h2 id="planes-titulo" className="h-heading mt-5 mb-0">
          Elige tu plan
        </h2>
        <p className="mx-auto mt-5 mb-0 max-w-lg text-(--h-muted)">
          {common.length > 0
            ? `Todos incluyen ${common.slice(0, 3).join(', ').toLowerCase()}. Cambia cómo confirman tus invitados y lo que organizas desde tu panel.`
            : 'Cambia cómo confirman tus invitados y lo que organizas desde tu panel.'}
        </p>
      </header>

      {/* En el teléfono, un carrusel que se desliza de lado con el plan mayor primero; en tableta y
          escritorio, la fila de tres de siempre. Son dos listas distintas porque el orden y el
          gesto cambian, no solo el ancho. */}
      <PlansCarousel labels={mobileOrder.map((index) => plans[index]?.name.replace(/^Plan\s+/i, '') ?? '')}>
        {mobileOrder.map((index) => (
          <PlanCard key={plans[index]?.key} {...cardProps(index)} variant="mobile" />
        ))}
      </PlansCarousel>

      <ul className="mx-auto mt-14 hidden max-w-6xl list-none items-end gap-5 p-0 md:grid md:grid-cols-3">
        {plans.map((plan, index) => (
          <PlanCard key={plan.key} {...cardProps(index)} variant="desktop" />
        ))}
      </ul>
    </section>
  );
}

interface PlanCardProps {
  readonly plan: PublicPlan;
  readonly index: number;
  readonly isFeatured: boolean;
  readonly image: PlanImage | undefined;
  readonly common: readonly string[];
  readonly orderClass: string | undefined;
  readonly variant: 'mobile' | 'desktop';
}

/** Una tarjeta de plan. La misma en las dos listas; en el teléfono sin inclinación 3D. */
function PlanCard({ plan, index, isFeatured, image, common, orderClass, variant }: PlanCardProps) {
  const online = plan.features.includes(ONLINE_RSVP);
  const extras = plan.features.filter((feature) => !common.includes(feature) && feature !== ONLINE_RSVP);

  return (
    <li
      {...(variant === 'desktop' ? { 'data-tilt': '' } : {})}
      data-reveal
      style={{ ['--reveal-delay' as string]: `${index * 0.1}s` }}
      className={clsx(
        'flex flex-col overflow-hidden rounded-[6px]',
        variant === 'desktop' ? orderClass : 'h-full',
        isFeatured
          ? 'bg-(--h-wine) text-(--h-wine-ink) shadow-[0_30px_60px_-30px_rgba(74,26,44,0.55)]'
          : 'bg-(--h-white) text-(--h-ink) shadow-[0_0_0_1px_var(--h-line)]',
      )}
    >
      {image && (
        <div
          data-curtain
          className={clsx(
            'relative w-full shrink-0 overflow-hidden',
            variant === 'mobile' ? 'aspect-[16/10]' : isFeatured ? 'aspect-[4/3.6]' : 'aspect-[4/3]',
          )}
        >
          <Image src={image.url} alt={image.alt} fill sizes="(min-width: 768px) 30vw, 82vw" className="object-cover" />
        </div>
      )}

      <div className={clsx('flex flex-1 flex-col', variant === 'mobile' ? 'p-6' : 'p-7')}>
        {isFeatured && (
          <span className="mb-3 self-start rounded-full bg-(--h-gold) px-3 py-1 text-[10px] tracking-[0.22em] text-(--h-wine) uppercase">
            El más completo
          </span>
        )}
        <h3 className="h-display m-0 text-[2rem]">{plan.name.replace(/^Plan\s+/i, '')}</h3>
        <p className={clsx('mt-1 mb-0 text-[13px] tracking-[0.18em] uppercase', isFeatured ? 'text-(--h-gold)' : 'text-(--h-gold-deep)')}>
          A medida
        </p>
        {plan.description && (
          <p className={clsx('mt-4 mb-0 text-[15px]', isFeatured ? 'text-(--h-wine-ink)/85' : 'text-(--h-muted)')}>
            {plan.description}
          </p>
        )}

        <dl className="mt-6 mb-0 border-t border-current/15 pt-5 text-[15px]">
          <dt className={clsx('text-[11px] tracking-[0.2em] uppercase', isFeatured ? 'text-(--h-wine-ink)/70' : 'text-(--h-muted)')}>
            Cómo confirman
          </dt>
          <dd className="m-0 mt-1">{online ? 'En su enlace, y lo ves en tu panel' : 'Por WhatsApp'}</dd>
        </dl>

        {extras.length > 0 && (
          <ul className="mt-5 mb-0 grid list-none gap-2 p-0 text-[15px]">
            {extras.map((feature) => (
              <li key={feature} className="flex gap-2.5">
                <span aria-hidden="true" className="mt-[0.55em] size-1.5 shrink-0 rotate-45 bg-(--h-rose)" />
                {feature}
              </li>
            ))}
          </ul>
        )}

        {/* En el carrusel las tarjetas miden lo mismo: el botón baja al fondo de cada una. */}
        {variant === 'mobile' && <div aria-hidden="true" className="min-h-8 flex-1" />}
        <Link
          href="/cotizar"
          className={clsx('h-button self-start', variant === 'desktop' && 'mt-8', isFeatured ? 'h-button--gold' : 'h-button--wine')}
        >
          Cotizar
          <span className="sr-only"> el plan {plan.name.replace(/^Plan\s+/i, '')}</span>
        </Link>
      </div>
    </li>
  );
}
