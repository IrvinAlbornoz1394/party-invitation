import { Armchair, BellRing, MailCheck, Users } from 'lucide-react';
import Image from 'next/image';
import { MARKETING_PHOTOS } from './photos';

/**
 * Lo que pasa después de enviar la invitación.
 *
 * Es el argumento del producto —«no vendemos invitaciones, vendemos una herramienta para
 * organizar tu evento»— y por eso va **después** de las plantillas y no antes: primero se gana la
 * atención por los ojos, y solo entonces alguien está dispuesto a leer por qué esto no es otra
 * página bonita.
 *
 * ## Cuatro entradas con dibujo, y por qué ya no son números
 *
 * Antes eran cuatro entradas numeradas, con el argumento de que un icono por idea obliga a
 * inventarse una metáfora por cada una. Sigue siendo cierto en general y no lo es aquí, porque
 * las cuatro tienen dibujo evidente: un sobre con visto, un grupo, una silla y una campana. El
 * número ordenaba una secuencia que en realidad no existe —las mesas no van «después» de los
 * invitados—, y el trazo fino da el registro de papelería que el resto de la página tiene.
 *
 * Lo que no ha cambiado: cada entrada nombra **el trabajo que te quita**, no la funcionalidad.
 * «Panel de confirmaciones» no le dice nada a quien organiza una boda; «dejas de perseguir a
 * nadie por WhatsApp», sí.
 *
 * ## La fotografía es vertical y va anclada
 *
 * Vertical porque la lista es alta y una foto apaisada al lado deja una columna de aire muerto
 * debajo. Anclada (`sticky`) porque acompaña a las cuatro entradas mientras se leen, en vez de
 * desaparecer en la primera — que es lo que la convertiría en un adorno de la primera línea.
 */

const SERVICES = [
  {
    icon: MailCheck,
    title: 'Las confirmaciones se cuentan solas',
    detail:
      'Cada quien confirma desde su invitación. Tú abres el panel y ves el número, no una conversación de doscientos mensajes.',
  },
  {
    icon: Users,
    title: 'Los invitados, por familia',
    detail:
      'Con su cupo de adultos y niños. Sabes quién confirmó, quién falta y quién ya dijo que no puede, sin llevar la cuenta en una libreta.',
  },
  {
    icon: Armchair,
    title: 'Las mesas, resueltas',
    detail:
      'Creas las mesas, asignas a cada familia y sacas la vista para imprimir. Se acabó la hoja de cálculo con nombres arrastrados.',
  },
  {
    icon: BellRing,
    title: 'Los recordatorios se mandan solos',
    detail:
      'Siete días antes, tres, uno y el mismo día. Tú los configuras una vez; a partir de ahí, salen sin que te acuerdes.',
  },
] as const;

export function ManagementStory() {
  const photo = MARKETING_PHOTOS.services;

  return (
    <section className="bg-blush/40">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:px-10 sm:py-28">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          {/* La fotografía va primera en escritorio y segunda en móvil: ahí lo que importa es
              llegar antes al texto, y una imagen alta empujaría el argumento fuera de pantalla. */}
          <div className="order-2 lg:sticky lg:top-16 lg:order-1 lg:self-start">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-blush">
              <Image
                src={photo.url}
                alt={photo.alt}
                fill
                sizes="(min-width: 1024px) 42vw, 92vw"
                className="object-cover"
              />
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="m-0 flex items-center gap-3 text-[11px] tracking-[0.3em] text-accent uppercase">
              <span aria-hidden="true" className="h-px w-8 bg-accent/50" />
              Después de enviarla
            </p>

            <h2 className="mt-7 mb-0 max-w-lg font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.08] font-medium tracking-[-0.03em] text-ink">
              Lo difícil no era
              <span className="block italic">la invitación</span>
            </h2>

            <p className="mt-7 mb-0 max-w-md text-[16px] leading-relaxed text-ink/75">
              Era saber cuántos van a llegar. Eso es lo que esta herramienta te quita de encima.
            </p>

            <ul className="mt-12 grid list-none gap-0 border-t border-line p-0">
              {SERVICES.map(({ icon: Icon, title, detail }) => (
                <li
                  key={title}
                  className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 border-b border-line py-8 sm:gap-x-7"
                >
                  {/* Trazo fino y sin medallón: a este tamaño un círculo alrededor lo convierte
                      en un icono de interfaz, y lo que se busca es un dibujo de papelería. */}
                  <Icon
                    size={30}
                    strokeWidth={0.9}
                    aria-hidden="true"
                    className="mt-1 shrink-0 text-accent"
                  />

                  <div>
                    <h3 className="m-0 font-display text-[clamp(1.3rem,2.6vw,1.7rem)] leading-snug font-medium tracking-[-0.02em] text-ink">
                      {title}
                    </h3>
                    <p className="mt-3 mb-0 max-w-lg text-[15px] leading-relaxed text-ink/75">
                      {detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
