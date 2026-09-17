'use client';

import { Input } from 'antd';
import type { BlockTextField, EditableBlockTexts } from '@/domain/events/event-block-texts';

/**
 * Los textos propios de una sección: su pre-título, su título, su bajada, su nota.
 *
 * Va **dentro de la tarjeta del tema** —los de la galería en «Fotos», los del cronograma en
 * «Cronograma»— y no en una tarjeta aparte con las doce secciones juntas. La diferencia no es de
 * gusto: el título de la galería y las fotos de la galería son la misma decisión tomada dos
 * veces, y separarlos obligaría a quien está llenando el formulario a recorrerlo entero dos
 * veces, una para las listas y otra para los rótulos.
 *
 * Las secciones que no tienen datos propios del evento —la bienvenida, la portada, la despedida,
 * el pie— sí estrenan tarjeta, porque no había ninguna a la que pertenecer.
 *
 * ## Controlado, como las filas de una colección
 *
 * Y por lo mismo: su valor viaja serializado en un campo oculto, no como un campo del formulario.
 * Hacen falta las dos cosas —el nombre del bloque y el del campo— para saber dónde va cada texto,
 * y `FormData` no sabe expresar eso sin una convención de nombres con corchetes que habría que
 * parsear a mano en la acción.
 *
 * ## Los ejemplos son pista, no valor
 *
 * El texto de la demo se enseña dentro del campo vacío (`placeholder`) y nunca como contenido ya
 * escrito. Un valor precargado que nadie toca acaba publicado, y una invitación de verdad que
 * despide con «Gracias por caminar con nosotros» —la frase de otra pareja— es peor que un hueco.
 * Lo que sí nace escrito son los rótulos que pone la plantilla al crear el evento, que son
 * decisiones del catálogo y no contenido de nadie.
 *
 * ## El vacío se manda vacío
 *
 * Al contrario que `RowField`, que manda `null`. Aquí la cadena vacía tiene que llegar entera al
 * dominio, porque es él quien sabe si ese campo admite ausencia —y entonces la guarda como
 * `null`, que es «bórralo»— o si es obligatorio y hay que contestar que falta. Decidirlo en el
 * navegador sería adelantar una regla que vive en el contrato del bloque.
 */
export function BlockTextFields({
  block,
  fields = block.fields,
  values,
  errors,
  onChange,
}: {
  readonly block: EditableBlockTexts;
  /**
   * Qué campos de ese bloque se pintan aquí, y en qué orden.
   *
   * Por defecto, todos. El paso puede pedir uno suelto para colocarlo entre campos del evento
   * —la primera frase de la portada va encima de la segunda, y la segunda es del evento— y
   * después pedir el resto. Ver `StepField` en `domain/events/content-steps.ts`.
   */
  readonly fields?: readonly BlockTextField[];
  readonly values: Readonly<Record<string, string>>;
  /** Los motivos del último guardado, con la ruta `blocks.<bloque>.<campo>`. */
  readonly errors: Readonly<Record<string, string>>;
  readonly onChange: (field: string, value: string) => void;
}) {
  return (
    <>
      {fields.map((field) => {
        const error = errors[`blocks.${block.blockKey}.${field.name}`];
        const note = error ?? field.help;
        const value = values[field.name] ?? '';

        return (
          /*
           * El rótulo envuelve al control, como en las filas de colección: estos campos se
           * generan a partir de qué bloques tiene el evento, así que un `htmlFor` tendría que
           * componer un identificador con la clave del bloque para no repetirse entre secciones.
           * Un `<label>` que contiene su control no necesita ninguno.
           */
          <label className="dash-form__field" key={field.name}>
            <span className="dash-form__label">{field.label}</span>

            {field.multiline ? (
              <Input.TextArea
                value={value}
                placeholder={field.placeholder}
                rows={3}
                onChange={(event) => onChange(field.name, event.target.value)}
              />
            ) : (
              <Input
                value={value}
                placeholder={field.placeholder}
                onChange={(event) => onChange(field.name, event.target.value)}
              />
            )}

            {note && <p className={error ? 'dash-form__error' : 'dash-form__help'}>{note}</p>}
          </label>
        );
      })}
    </>
  );
}
