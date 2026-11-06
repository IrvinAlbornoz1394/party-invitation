import { CrossfadeCover } from './CrossfadeCover';
import { RsvpLive } from './RsvpLive';

/**
 * Cómo funciona, contado como lo que tú das y lo que vuelve.
 *
 * Tres intercambios. En cada uno, lo que entregas va en un panel del tono de la página —es tu
 * parte— y lo que devuelve el producto va debajo, sangrado, como un fragmento real a su tamaño. El
 * tercero ya no es una imagen: es la confirmación funcionando, y por eso rompe la columna.
 *
 * El recorrido es el de Premium, que es el único plan con enlace por familia y panel. La línea
 * bajo el título lo dice, porque prometer este flujo a quien contrata Esencial sería mentirle.
 */
export function HowItWorks({
  covers,
}: {
  readonly covers: readonly { readonly url: string; readonly alt: string }[];
}) {
  return (
    <section
      id="como-funciona"
      aria-labelledby="como-titulo"
      className="px-5 py-12 sm:py-28 sm:px-8 lg:py-40"
    >
      <div className="grid gap-y-14 lg:grid-cols-12 lg:gap-x-6">
        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-24">
            <h2 id="como-titulo" data-reveal className="l-display m-0 text-(length:--step-head)">
              Así funciona
            </h2>
            <p
              data-reveal
              className="mt-5 mb-0 max-w-[30ch] text-(--l-muted)"
              style={{ ['--d' as string]: '90ms' }}
            >
              El recorrido completo es el del plan Premium. En Esencial y Plus tus invitados
              confirman por WhatsApp.
            </p>
          </div>
        </div>

        <ol className="m-0 grid list-none gap-16 p-0 sm:gap-22 lg:col-span-9 lg:col-start-4">
          <li className="lg:max-w-[35rem]">
            <Exchange sentence="Primero, nos cuentas de tu evento.">
              <Call label="Tu evento">
                Boda de Ana &amp; Diego · 12 de junio de 2027 · Hacienda San José, Izamal
              </Call>
              <Response>
                <div
                  data-ui
                  className="relative aspect-[16/10] w-full max-w-[26rem] overflow-hidden rounded-[14px] bg-(--l-surface)"
                >
                  <CrossfadeCover images={covers} sizes="(min-width: 640px) 416px, 88vw" />
                  <div className="absolute inset-0 flex flex-col items-center justify-end bg-[linear-gradient(to_top,rgb(0_0_0/0.55),transparent_60%)] pb-6 text-center text-white">
                    <span className="font-(family-name:--font-display) text-[2rem] leading-none font-light">
                      Ana &amp; Diego
                    </span>
                    <span className="mt-2 text-[13px] tracking-[0.08em]">12 · 06 · 2027</span>
                  </div>
                </div>
                <Caption>Te devolvemos la invitación armada con la plantilla que elegiste.</Caption>
              </Response>
            </Exchange>
          </li>

          <li className="lg:max-w-[35rem]">
            <Exchange sentence="Después, cada familia recibe su enlace.">
              <Call label="Invitación">
                Familia Robles Cámara · 4 lugares · 999 123 4567
              </Call>
              <Response>
                <div data-ui className="max-w-[24rem] rounded-[14px] bg-[#e9e4dc] p-3">
                  <div className="ml-auto max-w-[88%] rounded-[10px] rounded-tr-[2px] bg-[#dcf3d8] px-3.5 pt-2.5 pb-1.5 text-[14px] leading-snug text-[#1f2a22]">
                    Hola, familia Robles Cámara: les compartimos la invitación a la boda de Ana y
                    Diego. Este es su enlace:{' '}
                    <span className="break-all text-[#1d5fa8] underline">
                      …/ana-y-diego/k7m2qx9d
                    </span>
                    <span className="mt-1 block text-right text-[11px] text-[#5d6b60]">18:42</span>
                  </div>
                </div>
                <Caption>
                  Su enlace lleva un código propio: abre la invitación con sus lugares apartados.
                </Caption>
              </Response>
            </Exchange>
          </li>

          <li>
            <Exchange sentence="Al final, ellos confirman y tú lo ves.">
              <p className="mt-4 mb-6 max-w-[35rem] text-(--l-muted)">
                Pruébalo: eres la familia Robles Cámara. Elige cuántos van y confirma.
              </p>
              <div className="lg:max-w-[50rem]">
                <RsvpLive />
              </div>
            </Exchange>
          </li>
        </ol>
      </div>
    </section>
  );
}

function Exchange({ sentence, children }: { readonly sentence: string; readonly children: React.ReactNode }) {
  return (
    <div data-reveal>
      <h3 className="m-0 text-(length:--step-lead) leading-snug font-medium">{sentence}</h3>
      {children}
    </div>
  );
}

function Call({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <div className="mt-4 max-w-[40rem] rounded-[4px] bg-(--l-surface) px-5 py-4">
      <p className="m-0 text-(length:--step-small) text-(--l-muted)">{label}</p>
      <p className="mt-1 mb-0 text-(--l-ink)">{children}</p>
    </div>
  );
}

function Response({ children }: { readonly children: React.ReactNode }) {
  return <div className="mt-6 sm:pl-14">{children}</div>;
}

function Caption({ children }: { readonly children: React.ReactNode }) {
  return (
    <p className="mt-3 mb-0 max-w-[40ch] text-(length:--step-small) text-(--l-muted)">{children}</p>
  );
}
