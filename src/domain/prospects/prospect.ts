import { z } from 'zod';

/**
 * Una solicitud del formulario público, y lo que se sabe de su seguimiento.
 *
 * La forma del tipo repite a propósito la separación de la tabla: arriba lo que la persona
 * escribió, que no se edita nunca; abajo lo que la plataforma anota encima. Ver
 * `docs/PROSPECTOS.md`.
 */
export interface Prospect {
  readonly id: string;

  readonly contactName: string;
  readonly contactEmail: string | null;
  readonly contactPhone: string;
  readonly eventTypeKey: string | null;
  readonly eventDate: string | null;
  readonly guestRange: string | null;
  /** De dónde venía: qué plantilla y qué plan estaba mirando al escribir. */
  readonly templateKey: string | null;
  readonly planKey: string | null;
  readonly message: string | null;
  readonly createdAt: Date;

  readonly status: ProspectStatus;
  readonly nextFollowUpAt: Date | null;
  readonly lostReason: string | null;
  readonly clientId: string | null;
  readonly clientName: string | null;
  /** El `MAX` de la bitácora. No se guarda en ninguna columna: se calcula al listar. */
  readonly lastTouchAt: Date | null;
  readonly touchCount: number;
}

export const PROSPECT_STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'] as const;
export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];

export const TOUCH_CHANNELS = ['whatsapp', 'call', 'email', 'meeting', 'other'] as const;
export type TouchChannel = (typeof TOUCH_CHANNELS)[number];

export function isProspectStatus(value: unknown): value is ProspectStatus {
  return typeof value === 'string' && (PROSPECT_STATUSES as readonly string[]).includes(value);
}

/**
 * Si la solicitud ya tuvo desenlace: se volvió cliente o se descartó.
 *
 * Es la única condición que saca una fila de la bandeja, y vive aquí en vez de repetirse en cada
 * sitio que la necesita —la lista, el contador, el vencimiento— porque las tres tienen que estar de
 * acuerdo en qué es «cerrado». Si algún día hay un tercer desenlace, se añade una vez.
 *
 * Cerrado no es borrado: la fila se queda en la tabla porque es la mitad de la estadística.
 */
export function isClosed(prospect: Prospect): boolean {
  return prospect.status === 'won' || prospect.status === 'lost';
}

/**
 * Si a este prospecto le toca insistir.
 *
 * Se calcula y no se guarda, y esa es la decisión que sostiene la bandeja. «Dejó de responder» no
 * es un estado que alguien marque: es la consecuencia de que pasara una fecha. Guardarlo como
 * estado obligaría a que alguien lo actualizara cada día, y el primer día que no lo hiciera la
 * bandeja empezaría a mentir.
 *
 * Los cerrados nunca vencen: un prospecto ganado o descartado ya no espera nada.
 */
export function isOverdue(prospect: Prospect, now: Date): boolean {
  if (isClosed(prospect)) return false;

  return prospect.nextFollowUpAt !== null && prospect.nextFollowUpAt <= now;
}

/**
 * En qué orden se recorre la bandeja.
 *
 * Por urgencia y no por fecha, que es lo que la convierte en una bandeja de trabajo en vez de un
 * archivo: primero lo que nadie ha tocado, después lo que toca hoy, y al final lo que ya está en
 * conversación. Dentro de cada grupo, lo más antiguo primero — quien lleva más esperando.
 */
export function inboxRank(prospect: Prospect, now: Date): number {
  if (prospect.status === 'new') return 0;
  if (isOverdue(prospect, now)) return 1;

  return 2;
}

/**
 * Lo que llena quien pide información.
 *
 * Solo dos campos obligatorios: cómo se llama y por dónde escribirle. Todo lo demás ayuda a
 * preparar la propuesta y ninguno vale una solicitud perdida — el formulario de una web pública
 * compite con cerrar la pestaña, así que cada campo obligatorio de más cuesta prospectos.
 *
 * El teléfono es el obligatorio y no el correo porque en este mercado la conversación ocurre por
 * WhatsApp.
 */
export const prospectFormSchema = z.object({
  contactName: z.string().trim().min(1, 'Escribe tu nombre.').max(120),
  contactPhone: z
    .string()
    .trim()
    .min(10, 'Escribe un teléfono de 10 dígitos.')
    .max(20)
    /* Solo dígitos, espacios y los signos de un teléfono escrito a mano. No se normaliza a E.164
       aquí: quien atiende va a copiarlo a WhatsApp tal cual, y un número reformateado que no
       coincide con lo que la persona escribió genera dudas al marcarlo. */
    .regex(/^[\d\s()+-]+$/, 'El teléfono solo lleva números.'),
  contactEmail: z
    .union([z.literal(''), z.email('Revisa el correo.')])
    .transform((value) => (value === '' ? null : value))
    .nullable(),
  eventTypeKey: optionalText(40),
  eventDate: z
    .union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Revisa la fecha.')])
    .transform((value) => (value === '' ? null : value))
    .nullable(),
  guestRange: optionalText(40),
  templateKey: optionalText(60),
  planKey: optionalText(40),
  message: optionalText(1000),
  /**
   * El campo trampa.
   *
   * Está oculto para las personas y visible para un robot que rellena todo lo que encuentra. Si
   * llega con algo, la solicitud se descarta **respondiendo que todo salió bien**: decirle a un
   * robot que lo detectaste es enseñarle a esquivarlo la próxima vez.
   *
   * No sustituye al límite por IP; lo complementa. El límite acota el volumen y esto filtra al
   * robot que envía una sola vez.
   */
  website: z.string().max(200).optional(),
});

export type ProspectFormInput = z.input<typeof prospectFormSchema>;
export type ProspectForm = z.infer<typeof prospectFormSchema>;

function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable();
}
