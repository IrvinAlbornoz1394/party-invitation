import { DEFAULT_EVENT_TIME_ZONE } from '@/domain/events/event-time-zone';

/**
 * Formato de texto compartido por las pantallas del panel.
 *
 * Vive fuera de los archivos de componentes por una razón mecánica: un módulo que exporta
 * componentes **y** funciones sueltas pierde el fast refresh de React, así que cada retoque
 * de estilo recargaría la página entera en lugar de reemplazar el componente.
 *
 * Y está en un solo sitio porque el formato es una decisión de producto, no de pantalla: si
 * cada tabla formateara su propia fecha, `/admin/eventos` diría "7 ago 2026" y `/panel`
 * "07/08/2026" para el mismo dato, y quien diera soporte tendría que traducir mentalmente
 * entre lo que ve el cliente y lo que ve la plataforma.
 */

const LOCALE = 'es-MX';

/** 'María José Albornoz' → 'María'. Para saludos y frases en segunda persona. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/).at(0) ?? name;
}

/** Iniciales para un avatar. El punto medio evita un círculo vacío si el nombre viene raro. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);

  return parts.map((part) => part.charAt(0).toUpperCase()).join('') || '·';
}

/**
 * La zona en la que el panel pinta las fechas.
 *
 * Fija y no la del navegador ni la del servidor, por dos motivos. El primero es que una fecha
 * guardada es un instante: una boda del sábado 20 a las 18:30 en Mérida ya es domingo 21 en UTC,
 * que es la zona del servidor en Vercel, así que sin zona el panel la corría un día. El segundo
 * es que el servidor y el navegador tienen que escribir lo mismo, o React no puede hidratar la
 * página.
 *
 * Es la del negocio porque hoy todos los eventos son de ahí (ver `event-time-zone.ts`). Quien
 * tenga la zona del evento a mano puede pasarla.
 */
const PANEL_TIME_ZONE = DEFAULT_EVENT_TIME_ZONE;

/** Fecha corta: "7 ago 2026". La de las tablas. */
export function formatDate(value: Date, timeZone: string = PANEL_TIME_ZONE): string {
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeZone }).format(
    new Date(value),
  );
}

/** Fecha larga: "viernes, 7 de agosto de 2026". Para encabezados y fichas. */
export function formatLongDate(value: Date, timeZone: string = PANEL_TIME_ZONE): string {
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'full', timeZone }).format(new Date(value));
}

/**
 * El día de calendario de un instante en una zona, como milisegundos de su medianoche UTC.
 *
 * Sirve para restar días sin que el horario ni la zona del servidor se metan en la cuenta: dos
 * fechas del mismo día en Mérida dan el mismo número aunque en UTC caigan en días distintos.
 */
function calendarDay(value: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date(value));
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value);

  return Date.UTC(part('year'), part('month') - 1, part('day'));
}

/**
 * Cuántos días faltan para una fecha, en palabras.
 *
 * Usa `Intl.RelativeTimeFormat`, que resuelve solo los casos que en español se escriben
 * distinto —"mañana", "ayer", "en 2 días"— y que a mano acaban siendo una escalera de `if`
 * con errores de concordancia.
 *
 * La diferencia se calcula sobre días de calendario y no sobre milisegundos entre instantes:
 * un evento esta noche a las 23:00 debe decir "hoy", no "en 0 días", y uno mañana a las
 * 08:00 debe decir "mañana" aunque falten menos de 24 horas.
 */
export function formatDaysUntil(
  value: Date,
  now: Date = new Date(),
  timeZone: string = PANEL_TIME_ZONE,
): string {
  const days = Math.round((calendarDay(value, timeZone) - calendarDay(now, timeZone)) / 86_400_000);

  return new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' }).format(days, 'day');
}

/** Si una fecha todavía no ha pasado, contando el día en curso como futuro. */
export function isUpcoming(
  value: Date,
  now: Date = new Date(),
  timeZone: string = PANEL_TIME_ZONE,
): boolean {
  return calendarDay(value, timeZone) >= calendarDay(now, timeZone);
}

/**
 * Precio en centavos → "$4,500.00 MXN".
 *
 * Recibe centavos porque así se guarda: el dinero nunca se representa en punto flotante, y
 * la división entre 100 se hace en el último momento, aquí, donde ya solo va a pintarse.
 */
export function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
  }).format(cents / 100);
}

/** "1 evento" / "5 eventos". El plural en español no siempre es añadir una ese. */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Porcentaje entero y acotado, para el ancho de una barra de proporción. */
export function toPercentage(value: number, total: number): number {
  if (total <= 0) return 0;

  return Math.min(100, Math.max(0, Math.round((value / total) * 100)));
}
