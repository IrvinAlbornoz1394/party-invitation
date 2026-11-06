'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

/**
 * Lo único de la página con lo que se juega: confirmar como si fueras una familia invitada.
 *
 * A la izquierda, el bloque de confirmación tal como lo ve la familia Robles Cámara al abrir su
 * enlace: cuatro lugares apartados y un selector para decir cuántos van. A la derecha, el resumen
 * del panel de los novios. Al confirmar, la cuenta cambia delante de ti — que es la frase entera
 * del producto hecha en un segundo.
 *
 * ## Las cifras cuadran
 *
 * 52 invitaciones, 38 respondidas (31 vienen y 7 no), 14 sin responder, 104 personas confirmadas.
 * Lo que hace la demo es mover a una familia de «sin responder» a una de las otras dos, y todo lo
 * demás se recalcula desde ahí: no hay un solo número escrito a mano dos veces.
 *
 * Los rótulos son los del panel real (`RsvpSummaryCard`), y el cupo funciona como allí: de uno al
 * máximo apartado.
 *
 * Sin script se ve el estado inicial completo, que ya cuenta la historia.
 */

const SEATS = 4;
const BASE = { invited: 52, coming: 31, declined: 7, people: 104 };

type Reply = { readonly kind: 'pending' } | { readonly kind: 'yes'; readonly people: number } | { readonly kind: 'no' };

export function RsvpLive() {
  const [count, setCount] = useState(SEATS);
  const [reply, setReply] = useState<Reply>({ kind: 'pending' });

  const coming = BASE.coming + (reply.kind === 'yes' ? 1 : 0);
  const declined = BASE.declined + (reply.kind === 'no' ? 1 : 0);
  const people = BASE.people + (reply.kind === 'yes' ? reply.people : 0);
  const pending = BASE.invited - BASE.coming - BASE.declined - (reply.kind === 'pending' ? 0 : 1);

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      {/* Lo que ve la familia */}
      <div
        data-ui
        className="flex flex-col rounded-[14px] bg-white p-6 text-[#3a2a2f] sm:p-7"
      >
        <p className="m-0 text-center font-(family-name:--font-display) text-[1.9rem] leading-tight">
          Familia Robles Cámara
        </p>
        <p className="mt-2 mb-0 text-center text-[14px] text-[#6d5a60]">
          Apartamos {SEATS} lugares para ustedes
        </p>

        <AnimatePresence mode="wait" initial={false}>
          {reply.kind === 'pending' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-6 flex flex-1 flex-col"
            >
              <p id="rsvp-cuantos" className="m-0 text-center text-[14px] font-medium">
                ¿Cuántos van?
              </p>
              <div
                role="group"
                aria-labelledby="rsvp-cuantos"
                className="mt-3 flex items-center justify-center gap-5"
              >
                <button
                  type="button"
                  aria-label="Uno menos"
                  disabled={count <= 1}
                  onClick={() => setCount((value) => Math.max(1, value - 1))}
                  className="grid size-11 place-items-center rounded-full border border-[#d9cbc6] bg-white transition-transform active:scale-90 disabled:opacity-40"
                >
                  <Minus aria-hidden="true" size={16} />
                </button>
                <output
                  aria-live="polite"
                  className="w-10 text-center font-(family-name:--font-display) text-[2.4rem] leading-none tabular-nums"
                >
                  {count}
                </output>
                <button
                  type="button"
                  aria-label="Uno más"
                  disabled={count >= SEATS}
                  onClick={() => setCount((value) => Math.min(SEATS, value + 1))}
                  className="grid size-11 place-items-center rounded-full border border-[#d9cbc6] bg-white transition-transform active:scale-90 disabled:opacity-40"
                >
                  <Plus aria-hidden="true" size={16} />
                </button>
              </div>

              <div className="mt-6 grid gap-2.5">
                <button
                  type="button"
                  onClick={() => setReply({ kind: 'yes', people: count })}
                  className="min-h-12 rounded-[10px] bg-[#7e4650] px-5 text-[15px] font-medium text-white transition-[background-color,transform] hover:bg-[#6b3a44] active:scale-[0.98]"
                >
                  Confirmar asistencia
                </button>
                <button
                  type="button"
                  onClick={() => setReply({ kind: 'no' })}
                  className="min-h-12 rounded-[10px] px-5 text-[15px] text-[#6d5a60] underline-offset-4 transition-colors hover:text-[#3a2a2f] hover:underline"
                >
                  No podremos ir
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 flex flex-1 flex-col items-center justify-center text-center"
            >
              <p className="m-0 font-(family-name:--font-display) text-[1.6rem] leading-tight">
                {reply.kind === 'yes' ? '¡Los esperamos!' : 'Gracias por avisar'}
              </p>
              <p className="mt-2 mb-0 text-[14px] text-[#6d5a60]">
                {reply.kind === 'yes'
                  ? `Confirmaron ${reply.people} de ${SEATS} lugares.`
                  : 'Ana y Diego ya lo saben.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setReply({ kind: 'pending' });
                  setCount(SEATS);
                }}
                className="mt-5 min-h-11 rounded-[10px] px-4 text-[14px] text-[#6d5a60] underline underline-offset-4 hover:text-[#3a2a2f]"
              >
                Probar otra vez
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lo que ven los novios */}
      <div data-ui className="rounded-[14px] bg-(--l-surface) p-5 text-(--ui-ink) sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className="m-0 text-[15px] font-medium">Confirmaciones</p>
          <p className="m-0 text-[13px] text-(--ui-ink-soft)">Boda de Ana &amp; Diego</p>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-2">
          <Stat label="Personas confirmadas" value={people} lit={reply.kind === 'yes'} />
          <Stat label="Familias que vienen" value={coming} lit={reply.kind === 'yes'} />
          <Stat label="Sin responder" value={pending} lit={reply.kind !== 'pending'} />
          <Stat label="No asistirán" value={declined} lit={reply.kind === 'no'} />
        </dl>

        <ul className="mt-4 grid list-none gap-1.5 p-0 text-[14px]">
          <GuestRow
            name="Familia Robles Cámara"
            status={
              reply.kind === 'yes'
                ? { tone: 'ok', text: `Confirmaron · ${reply.people} de ${SEATS}` }
                : reply.kind === 'no'
                  ? { tone: 'no', text: 'No asistirán' }
                  : { tone: 'idle', text: 'Sin responder' }
            }
            highlight={reply.kind !== 'pending'}
          />
          <GuestRow name="Familia Pech Canul" status={{ tone: 'ok', text: 'Confirmaron · 5 de 5' }} />
          <GuestRow name="Tíos de Diego" status={{ tone: 'ok', text: 'Confirmaron · 2 de 2' }} />
          <GuestRow name="Familia Medina Sosa" status={{ tone: 'idle', text: 'Sin responder' }} />
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value, lit }: { readonly label: string; readonly value: number; readonly lit: boolean }) {
  return (
    <div
      className={clsx(
        'rounded-[10px] px-4 py-3 transition-colors duration-500',
        lit ? 'bg-(--ui-accent-wash)' : 'bg-(--ui-surface)',
      )}
    >
      <dt className="text-[13px] text-(--ui-ink-soft)">{label}</dt>
      <dd className="m-0 mt-1 overflow-hidden text-[1.6rem] leading-none font-medium tabular-nums">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="inline-block"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </dd>
    </div>
  );
}

function GuestRow({
  name,
  status,
  highlight = false,
}: {
  readonly name: string;
  readonly status: { readonly tone: 'ok' | 'no' | 'idle'; readonly text: string };
  readonly highlight?: boolean;
}) {
  return (
    <li
      className={clsx(
        'flex items-center justify-between gap-3 rounded-[10px] px-4 py-2.5 transition-colors duration-500',
        highlight ? 'bg-(--ui-accent-wash)' : 'bg-(--ui-surface)',
      )}
    >
      <span className="truncate">{name}</span>
      <span
        className={clsx(
          'shrink-0 rounded-full px-2.5 py-0.5 text-[13px]',
          status.tone === 'ok' && 'bg-(--ui-ok-wash) text-(--ui-ok)',
          status.tone === 'no' && 'bg-(--ui-no-wash) text-(--ui-no)',
          status.tone === 'idle' && 'bg-(--ui-canvas) text-(--ui-ink-soft)',
        )}
      >
        {status.text}
      </span>
    </li>
  );
}
