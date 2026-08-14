/**
 * La cuenta regresiva, como aritmética pura.
 *
 * Está separada del componente que la pinta porque es la única parte que puede estar mal de
 * una forma que nadie note hasta el día del evento —un desbordamiento, un signo, un resto mal
 * tomado— y aquí se puede razonar y probar sin montar un árbol de React ni esperar un segundo
 * a que corra el intervalo.
 *
 * `now` se recibe y no se lee de `Date.now()` dentro. Además de hacerla comprobable, es lo que
 * permite que el componente decida cuándo mira el reloj: el servidor y el cliente nunca
 * coinciden al milisegundo, y una función que consultara la hora por su cuenta produciría dos
 * resultados distintos para el mismo render.
 */

export type CountdownUnit = 'days' | 'hours' | 'minutes' | 'seconds';

export interface CountdownPart {
  readonly unit: CountdownUnit;
  readonly value: number;
  /** Ya en singular o plural según el valor: «1 día», «2 días». */
  readonly label: string;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const LABELS: Record<CountdownUnit, readonly [singular: string, plural: string]> = {
  days: ['Día', 'Días'],
  hours: ['Hora', 'Horas'],
  minutes: ['Minuto', 'Minutos'],
  seconds: ['Segundo', 'Segundos'],
};

/**
 * Cuánto falta para `target`, partido en días, horas, minutos y segundos.
 *
 * Se corta en cero y no sigue a negativo: pasada la hora del evento la invitación no debe
 * anunciar «hace 3 días», que es exactamente lo contrario de lo que una cuenta regresiva
 * comunica. Quien quiera distinguir «ya pasó» tiene {@link hasStarted} para preguntarlo.
 */
export function countdownTo(target: Date, now: Date): readonly CountdownPart[] {
  const remaining = Math.max(0, target.getTime() - now.getTime());

  const values: Record<CountdownUnit, number> = {
    days: Math.floor(remaining / DAY),
    hours: Math.floor(remaining / HOUR) % 24,
    minutes: Math.floor(remaining / MINUTE) % 60,
    seconds: Math.floor(remaining / SECOND) % 60,
  };

  return (Object.keys(values) as readonly CountdownUnit[]).map((unit) => {
    const value = values[unit];
    const [singular, plural] = LABELS[unit];

    return { unit, value, label: value === 1 ? singular : plural };
  });
}

/** Si el evento ya empezó. Una fecha inválida cuenta como «no ha empezado». */
export function hasStarted(target: Date, now: Date): boolean {
  const time = target.getTime();

  return !Number.isNaN(time) && time <= now.getTime();
}
