import { BlockImage } from '../../shared/BlockImage';
import { WelcomeOpenButton, WelcomeShell, type WelcomeVariantProps } from './welcome-parts';
import { BotanicalSpray } from './welcome-ornaments';

/**
 * `welcome.botanical` — papel claro con dos guirnaldas, arriba y abajo.
 *
 * La de la papelería de boda civil: fondo casi blanco, ramas en las dos esquinas opuestas y el
 * texto alternando **versalitas y manuscrita** línea a línea, que es el recurso tipográfico que
 * define este estilo. Junto con `welcome.veil` es la otra que se sostiene sin fotografía —aquí la
 * imagen, si la hay, queda como un velo de luz detrás del papel—.
 *
 * ## Las dos ramas son la misma, girada
 *
 * La de abajo es la de arriba con `rotate-180`, así que las dos guirnaldas se leen como un marco
 * y no como dos dibujos distintos que casualmente van juntos. Es el mismo truco que la filigrana,
 * y por la misma razón: un segundo trazo dibujado a mano nunca es el primero.
 *
 * ## Por qué el color de las ramas es el de acento y no un verde
 *
 * Porque un verde escrito aquí sería el único color del catálogo que no obedece al tema, y en una
 * invitación de tema nocturno saldría una rama de jardín sobre papel oscuro. Con `accent`, la
 * guirnalda es salvia en el tema floral y oro en el elegante, sin tocar este archivo.
 */
export function WelcomeBotanical({ content }: WelcomeVariantProps) {
  return (
    <WelcomeShell
      variant="botanical"
      label={`Bienvenida a la invitación de ${content.celebrantName}`}
      className="bg-inv-surface"
      contentClassName="items-center justify-center px-9 py-16 text-center"
      backdrop={
        content.image ? (
          <>
            <BlockImage
              image={content.image}
              priority
              className="-z-20 scale-105 opacity-20 blur-[4px]"
            />
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-inv-surface/60" />
          </>
        ) : null
      }
    >
      {/*
        Las guirnaldas sobresalen por los cantos (`-left-6`, `-right-6`). Una rama que termina
        justo en el borde parece recortada; una que se sale parece que continúa fuera del papel,
        que es como está impresa una lámina de verdad.
      */}
      <BotanicalSpray className="absolute -top-2 -left-6 h-24 w-[15rem] text-inv-accent opacity-70 sm:h-28 sm:w-[19rem]" />
      <BotanicalSpray className="absolute -right-6 -bottom-2 h-24 w-[15rem] rotate-180 text-inv-accent opacity-70 sm:h-28 sm:w-[19rem]" />

      <div className="relative flex max-w-xs flex-col items-center text-inv-ink">
        {content.eventTypeLabel && (
          <p className="m-0 text-[12px] tracking-[0.36em] text-inv-ink-soft uppercase">
            {content.eventTypeLabel}
          </p>
        )}

        <h2 className="mt-4 mb-0 font-inv-script text-[clamp(2.75rem,14vw,4rem)] leading-[0.95] font-normal text-inv-accent">
          {content.celebrantName}
        </h2>

        {content.celebrantLastName && (
          <p className="mt-3 mb-0 text-[11px] tracking-[0.36em] text-inv-ink-soft uppercase">
            {content.celebrantLastName}
          </p>
        )}

        {/* El filete con nudo: la separación de una lámina impresa. Va aquí y no como ornamento
            del tema porque su sitio en la composición es este, entre el nombre y la frase. */}
        <span aria-hidden="true" className="mt-7 flex items-center gap-2 text-inv-accent">
          <span className="h-px w-10 bg-current opacity-50" />
          <span className="size-1 rotate-45 bg-current" />
          <span className="h-px w-10 bg-current opacity-50" />
        </span>

        {content.note && (
          <p className="mt-7 mb-0 font-inv-display text-[clamp(1.05rem,5vw,1.35rem)] leading-snug text-inv-ink italic">
            {content.note}
          </p>
        )}

        {content.dateLabel && (
          <p className="mt-6 mb-0 text-[12px] tracking-[0.28em] text-inv-ink-soft uppercase">
            {content.dateLabel}
          </p>
        )}

        {content.venue && (
          <p className="mt-2 mb-0 text-[12.5px] leading-snug text-inv-ink-soft">{content.venue}</p>
        )}

        <WelcomeOpenButton label={content.openLabel} tone="onSurface" className="mt-10" />
      </div>
    </WelcomeShell>
  );
}
