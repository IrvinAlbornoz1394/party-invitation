import Link from 'next/link';
import { CalendarClock, MailQuestion } from 'lucide-react';

/**
 * Lo que ve quien tiene un código correcto pero la invitación todavía no está a la vista.
 *
 * Es la pantalla que faltaba. Antes, un invitado que abría su enlace antes de tiempo acababa en
 * la portada del sitio sin una palabra: el mismo destino que quien se equivoca de código. Los dos
 * casos parecían el mismo y ninguno era el suyo — porque a él **sí** lo invitaron, y su enlace es
 * bueno.
 *
 * ## Por qué se le puede contar y a quien falla el código no
 *
 * Porque acertar un código de seis caracteres del espacio de 32^6 no se hace por casualidad:
 * quien llega aquí es porque se lo dieron. El silencio protege el otro caso —probar direcciones a
 * ver cuál existe—, y ese sigue igual de mudo.
 *
 * ## Y por qué remata en la portada
 *
 * Porque hay un tercero que también llega hasta aquí: quien recibió el enlace de una invitación
 * que le gustó y quiere una para su fiesta. No es el visitante mayoritario, pero es el único que
 * puede convertirse en cliente, y dejarle una salida cuesta un enlace.
 */
export function InvitationUnavailable({ reason }: { readonly reason: 'unpublished' | 'expired' }) {
  const copy = COPY[reason];
  const Icon = copy.icon;

  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-ivory px-6 py-20">
      <div className="w-full max-w-md text-center">
        <span
          aria-hidden="true"
          className="mx-auto grid size-16 place-items-center rounded-full bg-plum/8 text-plum"
        >
          <Icon size={26} strokeWidth={1.5} />
        </span>

        <h1 className="mt-8 mb-0 font-display text-[clamp(1.9rem,5vw,2.6rem)] leading-tight font-medium text-ink">
          {copy.title}
        </h1>

        <p className="mt-5 mb-0 text-[15.5px] leading-relaxed text-ink/75">{copy.body}</p>

        {/*
          Un filete y un enlace, no un botón: quien llega aquí venía a ver una invitación, y
          ofrecerle contratar con el mismo peso que la noticia sería vender encima de un chasco.
        */}
        <span aria-hidden="true" className="mx-auto mt-10 block h-px w-14 bg-ink/15" />

        <p className="mt-8 mb-0 text-[14px] leading-relaxed text-ink/60">
          ¿Estás organizando la tuya?{' '}
          <Link
            href="/"
            className="font-medium text-plum underline decoration-plum/30 underline-offset-4 transition-opacity hover:opacity-70"
          >
            Mira cómo hacemos las invitaciones
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

/**
 * Qué se le dice en cada caso.
 *
 * Son dos mensajes y no uno con una condición dentro porque dicen cosas opuestas: en uno hay que
 * volver, en el otro no hay nada a lo que volver. Y ninguno menciona quién celebra ni cuándo: a
 * estas alturas no se ha cargado el contenido del evento —la base de datos no lo devuelve hasta
 * que se puede ver— y eso es a propósito.
 */
const COPY = {
  unpublished: {
    icon: CalendarClock,
    title: 'Esta invitación todavía se está preparando',
    body: 'Tu enlace es correcto: guárdalo. En cuanto quienes te invitan terminen de armarla, se abrirá aquí mismo sin que tengas que hacer nada.',
  },
  expired: {
    icon: MailQuestion,
    title: 'Esta invitación ya no está disponible',
    body: 'La celebración ya pasó o la invitación cumplió su vigencia. Si crees que es un error, escribe a quienes te invitaron.',
  },
} as const;
