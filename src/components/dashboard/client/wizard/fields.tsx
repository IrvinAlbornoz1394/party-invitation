'use client';

import type { ReactElement, ReactNode } from 'react';
import { cloneElement } from 'react';
import { Input } from 'antd';
import type { GalleryRow, ScheduleRow, VenueRow } from '@/domain/events/event-collections';

/**
 * Los controles que comparten el editor por pasos y sus secciones.
 *
 * Salieron de `EventContentScreen` al partir el formulario largo en pasos: los mismos campos
 * viven ahora repartidos en doce pantallas, y con ellos escritos dentro de una de ellas la
 * siguiente los habría copiado. Aquí no hay ninguna decisión de contenido —qué se pregunta y en
 * qué paso lo dice `domain/events/content-steps.ts`—, solo cómo se ve una etiqueta con su ayuda,
 * su error y su control.
 */

export function NativeField({
  id,
  label,
  help,
  error,
  children,
}: {
  readonly id: string;
  readonly label: string;
  readonly help?: string;
  readonly error?: string;
  readonly children: ReactElement<Record<string, unknown>>;
}) {
  const note = error ?? help;
  const noteId = note ? `${id}-note` : undefined;

  return (
    <div className="dash-form__field">
      <label className="dash-form__label" htmlFor={id}>
        {label}
      </label>

      {cloneElement(children, { id, 'aria-describedby': noteId })}

      {note && (
        <p className={error ? 'dash-form__error' : 'dash-form__help'} id={noteId}>
          {note}
        </p>
      )}
    </div>
  );
}


export function Field({
  name,
  label,
  help,
  initial,
  errors,
  required = false,
  multiline = false,
  placeholder,
  maxLength,
}: {
  readonly name: string;
  readonly label: string;
  readonly help?: string;
  readonly initial: string | null;
  readonly errors: Readonly<Record<string, string>>;
  /**
   * Si el campo es obligatorio. Pinta el aviso en la etiqueta y **no** escribe el atributo
   * `required` del HTML, que es una decisión del editor por pasos y no un descuido.
   *
   * Todos los pasos están montados a la vez —solo se esconde el que no toca, para que el envío
   * siga llevando el formulario entero—, y un campo obligatorio escondido bloquea el envío sin
   * decir dónde: el navegador se niega a enviar y no puede enfocar lo que no se ve. La validación
   * de verdad está donde siempre estuvo, en el servidor, que además contesta en castellano y sabe
   * a qué paso pertenece cada motivo.
   */
  readonly required?: boolean;
  readonly multiline?: boolean;
  /**
   * El ejemplo que se ve dentro del campo mientras está vacío.
   *
   * Es una pista y no un valor: un texto precargado que nadie toca acaba publicado, y una
   * invitación de verdad que anuncia a «Ana & Diego» es peor que un hueco. De dónde salen los
   * ejemplos, en `domain/events/content-hints.ts`.
   */
  readonly placeholder?: string;
  /**
   * El tope de caracteres, con su contador a la vista.
   *
   * El número es el mismo que el del esquema del dominio, y tiene que serlo: un contador que diga
   * 200 mientras el servidor acepta 4000 no informa, engaña. Se pone donde el texto **tiene** que
   * ser corto porque el diseño lo pide —la historia se compone en una columna angosta—, no como
   * defensa: de eso ya se encarga la validación.
   */
  readonly maxLength?: number;
}) {
  const error = errors[name];
  const note = error ?? help;
  const id = `content-${name}`;

  return (
    <div className="dash-form__field">
      <label className="dash-form__label" htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden="true" className="dash-form__hint">
            {' '}
            ·  obligatorio
          </span>
        )}
      </label>

      {multiline ? (
        <Input.TextArea
          id={id}
          name={name}
          defaultValue={initial ?? ''}
          placeholder={placeholder}
          rows={6}
          maxLength={maxLength}
          /* El «120 / 200» de antd. Solo donde hay tope: sin él, el contador sería un número
             creciente que no significa nada. */
          showCount={maxLength !== undefined}
          aria-describedby={note ? `${id}-note` : undefined}
        />
      ) : (
        <Input
          id={id}
          name={name}
          defaultValue={initial ?? ''}
          placeholder={placeholder}
          maxLength={maxLength}
          showCount={maxLength !== undefined}
          aria-describedby={note ? `${id}-note` : undefined}
        />
      )}

      {note && (
        <p className={error ? 'dash-form__error' : 'dash-form__help'} id={`${id}-note`}>
          {note}
        </p>
      )}
    </div>
  );
}

/**
 * Las tres listas mientras se editan.
 *
 * Es `EventCollections` con los arrays en solo lectura. El del dominio los tiene mutables porque
 * los infiere zod, y aquí conviene lo contrario: el editor devuelve listas nuevas en cada cambio y
 * nadie debe mutar la que tiene en la mano. Al enviar se serializan, así que la diferencia no
 * sobrevive al `JSON.stringify` — solo existe para que el compilador vigile mientras tanto.
 */

export interface EditableCollections {
  readonly venues: readonly VenueRow[];
  readonly schedule: readonly ScheduleRow[];
  readonly gallery: readonly GalleryRow[];
}

/**
 * Un campo dentro de una fila de colección.
 *
 * Es controlado, al contrario que `Field`, y esa es toda la diferencia entre los dos. Un campo
 * suelto del formulario lo lleva el navegador y se lee del `FormData`; uno de una fila tiene que
 * vivir en el estado de React, porque su valor viaja serializado en el campo oculto y porque
 * reordenar filas mueve valores entre posiciones.
 *
 * `node` permite meter un control que no es un `Input` —un selector, una hora— sin duplicar la
 * envoltura de etiqueta, ayuda y error.
 */

export function RowField({
  label,
  help,
  error,
  value,
  onChange,
  placeholder,
  node,
}: {
  readonly label: string;
  readonly help?: string;
  readonly error?: string;
  readonly value?: string;
  /**
   * Recibe `null` cuando el campo queda en blanco, que es lo que el esquema del dominio espera
   * para «sin valor». Los campos obligatorios —el título de una sede, la hora del cronograma— lo
   * convierten a cadena vacía en su propio `onChange`: su tipo no admite ausencia, y dejar que
   * llegara `null` haría que un campo borrado se guardara como si nunca hubiera existido en vez
   * de fallar la validación con su motivo.
   */
  readonly onChange?: (value: string | null) => void;
  readonly placeholder?: string;
  readonly node?: ReactNode;
}) {
  const note = error ?? help;

  return (
    /*
     * El rótulo envuelve al control en vez de apuntarle con un `htmlFor`, y aquí es la opción
     * correcta: estos campos se generan por fila —cinco sedes, doce momentos del cronograma— así
     * que un identificador tendría que llevar el índice, y los índices cambian al reordenar. Un
     * `<label>` que contiene su control no necesita ninguno.
     */
    <label className="dash-form__field">
      <span className="dash-form__label">{label}</span>

      {node ?? (
        <Input
          value={value}
          placeholder={placeholder}
          /* La cadena vacía se manda como null: es lo que el esquema del dominio espera para
             «este campo está en blanco», y evita guardar cadenas vacías que la invitación
             interpretaría como «hay contenido» y pintaría un hueco. */
          onChange={(event) => onChange?.(event.target.value === '' ? null : event.target.value)}
        />
      )}

      {note && <p className={error ? 'dash-form__error' : 'dash-form__help'}>{note}</p>}
    </label>
  );
}

