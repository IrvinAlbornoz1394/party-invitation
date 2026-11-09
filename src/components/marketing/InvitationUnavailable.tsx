import Image from 'next/image';
import Link from 'next/link';
import { CalendarClock, MailQuestion } from 'lucide-react';
import { homeDisplay } from '@/components/home/fonts';
import '@/components/home/home.css';

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
 *
 * Viste la ropa de la portada (`.home`: papel, vino, oro y la didona) porque es la cara de la
 * marca que ve un invitado: si el enlace lo trae aquí, que al menos reconozca dónde está.
 */
export function InvitationUnavailable({ reason }: { readonly reason: 'unpublished' | 'expired' }) {
  const copy = COPY[reason];
  const Icon = copy.icon;

  return (
    <div className={`home ${homeDisplay.variable}`}>
      <main className="flex min-h-svh w-full items-center justify-center px-5 py-20">
        <div className="w-full max-w-md rounded-[24px] bg-(--h-white) px-6 py-12 text-center shadow-[0_0_0_1px_var(--h-line),0_40px_80px_-50px_rgba(74,26,44,0.45)] sm:px-10">
          <Image
            src="/brand/logo.png"
            alt="MiEvento"
            width={2022}
            height={487}
            sizes="160px"
            className="mx-auto h-8 w-auto"
          />

          <span
            aria-hidden="true"
            className="mx-auto mt-10 grid size-16 place-items-center rounded-full bg-(--h-paper-2) text-(--h-wine)"
          >
            <Icon size={26} strokeWidth={1.5} />
          </span>

          <h1 className="h-display mt-7 mb-0 text-[clamp(1.8rem,6vw,2.4rem)] text-balance text-(--h-ink)">
            {copy.title}
          </h1>

          <p className="mt-5 mb-0 text-[15.5px] leading-relaxed text-(--h-muted)">{copy.body}</p>

          {/*
            Un filete y un enlace, no un botón: quien llega aquí venía a ver una invitación, y
            ofrecerle contratar con el mismo peso que la noticia sería vender encima de un chasco.
          */}
          <span aria-hidden="true" className="mx-auto mt-10 block h-px w-14 bg-(--h-line)" />

          <p className="mt-8 mb-0 text-[14px] leading-relaxed text-(--h-muted)">
            ¿Estás organizando la tuya?{' '}
            <Link
              href="/"
              className="font-medium text-(--h-wine) underline decoration-(--h-wine)/30 underline-offset-4 transition-opacity hover:opacity-70"
            >
              Mira cómo hacemos las invitaciones
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
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
