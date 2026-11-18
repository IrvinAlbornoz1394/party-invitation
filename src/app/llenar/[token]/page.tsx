import type { Metadata } from 'next';
import { MiEventoWordmark } from '@/components/brand/MiEventoWordmark';
import { enterWithContentLink } from './actions';

export const metadata: Metadata = {
  title: 'Llena tu invitación · MiEvento',
  description: 'Captura los datos de tu evento para armar tu invitación.',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * La puerta del enlace que el admin pega en el WhatsApp del cliente.
 *
 * No hace nada al abrirse: enseña un botón. Es la defensa contra las vistas previas, que abren
 * los enlaces solas (ver `actions.ts`). Para el cliente es un toque más, y a cambio la pantalla
 * le dice qué va a hacer antes de que lo haga.
 *
 * Cuando el canje falla vuelve aquí con `?estado=` y explica por qué, sin decir nada del evento:
 * quien tiene un enlace vencido o reemplazado no tiene por qué saber de quién era.
 */
const MESSAGES: Record<string, { title: string; body: string }> = {
  expired: {
    title: 'Este enlace ya venció',
    body: 'Los enlaces duran cinco días. Pídele uno nuevo a quien te lo mandó y entra desde ahí.',
  },
  invalid: {
    title: 'Este enlace ya no sirve',
    body: 'Puede que te hayan mandado uno más nuevo. Busca el último en tu conversación, o pide que te lo vuelvan a mandar.',
  },
  closed: {
    title: 'Ya recibimos tu información',
    body: 'Tu información ya está enviada. Si quieres cambiar algo, pídeselo a quien te atiende y te habilitamos la edición de nuevo.',
  },
  'no-account': {
    title: 'No pudimos abrir tu acceso',
    body: 'Hay un problema con la cuenta de este evento. Avísale a quien te mandó el enlace para que lo revise.',
  },
};

export default async function ContentLinkPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ token: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token } = await params;
  const { estado } = await searchParams;
  const problem = typeof estado === 'string' ? MESSAGES[estado] : undefined;

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-[#f7f2ec] px-5 py-12 text-[#2b1a20]">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-10 flex justify-center">
          <MiEventoWordmark tone="light" />
        </div>

        {problem ? (
          <>
            <h1 className="m-0 text-[26px] leading-tight font-medium">{problem.title}</h1>
            <p className="mt-4 mb-0 text-[16px] leading-relaxed text-[#2b1a20]/70">{problem.body}</p>
          </>
        ) : (
          <>
            <h1 className="m-0 text-[28px] leading-tight font-medium">Vamos a armar tu invitación</h1>
            <p className="mt-4 mb-0 text-[16px] leading-relaxed text-[#2b1a20]/70">
              Te pediremos primero lo básico de tu evento, y después, si quieres, tus fotos y lo demás.
              Puedes guardar y volver cuando quieras.
            </p>

            <form action={enterWithContentLink} className="mt-9">
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                className="min-h-13 w-full cursor-pointer rounded-full border-0 bg-[#5c1f35] px-6 text-[16px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#5c1f35] focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Entrar a llenar mi invitación
              </button>
            </form>

            <p className="mt-6 mb-0 text-[13px] leading-snug text-[#2b1a20]/55">
              Este enlace es solo para ti. No lo compartas: quien lo abra podrá ver y editar tu invitación.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
