import { z } from 'zod';
import { isReservedSlug, normalizeEventSlug, slugifyEventName } from './event-slug';
import { isSupportedTimeZone } from './event-time-zone';

/**
 * Lo que hace falta para dar de alta un evento.
 *
 * ## Por qué es esta lista y no la tabla entera
 *
 * `events` tiene treinta columnas y aquí se piden diez. La diferencia no es un formulario a
 * medias: el resto —la historia, las fotos, los contactos, la frase de portada— es **contenido**,
 * y el contenido lo captura el cliente en su propio panel (`event-content-draft.ts`). Pedirlo
 * aquí obligaría a la plataforma a tener a mano cosas que todavía no existen el día que se vende
 * el evento, y a teclearlas por alguien que las escribiría mejor.
 *
 * Lo que sí se decide aquí es lo que el cliente **no** puede cambiar después: a quién pertenece,
 * qué plan se le vendió, con qué plantilla y tema se arma, y en qué dirección vive la invitación.
 * Es exactamente el reparto que describe `event-content-draft.ts` desde el otro lado.
 *
 * ## La fecha viaja partida, como en el resto del producto
 *
 * `date`, `time` y `timeZone` van por separado y como texto. La conversión al instante la hace
 * Postgres con `AT TIME ZONE`, nunca JavaScript: un `Date` construido en el navegador guardaría
 * la boda a otra hora para quien la capture desde otra zona. Es la misma decisión que ya sostiene
 * el editor de contenido, y por eso la zona se elige **aquí** — es el único momento en que se
 * puede, porque el editor del cliente la lee pero no la toca.
 */

/**
 * El evento tal como sale del formulario, ya validado y con la dirección resuelta.
 *
 * El código de acceso NO está aquí: lo genera el caso de uso con un CSPRNG y nadie lo escribe a
 * mano. Ver `access-code.ts` — es la credencial de la invitación, y una credencial elegida por
 * una persona es una credencial adivinable.
 */
export type NewEvent = z.output<typeof newEventSchema>;
export type NewEventInput = z.input<typeof newEventSchema>;

export const newEventSchema = z
  .object({
    clientId: z.uuid('Elige el cliente al que pertenece el evento.'),
    eventTypeKey: z.string().trim().min(1, 'Elige el tipo de celebración.'),
    planKey: z.string().trim().min(1, 'Elige el plan contratado.'),
    templateId: z.uuid('Elige la plantilla con la que se arma la invitación.'),
    themeId: z.uuid('Elige el tema con el que se ve la invitación.'),
    /*
     * El título es interno: es el nombre con el que el evento aparece en las dos tablas del
     * panel. No es lo que lee el invitado —eso lo compone la portada con el nombre de quien
     * celebra—, y por eso puede decir «Boda Ana & Luis (paquete Premium)» sin que se vea fuera.
     */
    title: z.string().trim().min(2, 'Escribe cómo se llamará el evento en el panel.').max(160),
    celebrantName: z.string().trim().min(1, 'Escribe el nombre de quien celebra.').max(120),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige la fecha del evento.'),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Elige la hora del evento.'),
    timeZone: z
      .string()
      .refine(isSupportedTimeZone, 'Elige la zona horaria en la que ocurre el evento.'),
    /** Opcional en el formulario: si viene vacío se deriva del nombre de quien celebra. */
    slug: z.string(),
    /**
     * Si el contenido lo va a llenar el cliente.
     *
     * Llega del formulario como el valor de un interruptor y por eso se lee de una cadena: un
     * `<form>` manda `"true"` o nada, nunca un booleano. `z.coerce.boolean()` no vale aquí —
     * convierte cualquier cadena no vacía en `true`, incluida `"false"`—, así que la comparación
     * es explícita.
     */
    clientFillsContent: z
      .union([z.boolean(), z.string()])
      .default(false)
      .transform((value) => value === true || value === 'true'),
  })
  /*
   * La dirección se resuelve al final y no en el campo, porque depende de otro: derivarla del
   * nombre de quien celebra exige tener ese nombre ya validado. Un `.refine` sobre `slug` no
   * podría verlo.
   */
  .transform((value, ctx) => {
    const written = value.slug.trim();
    const slug = normalizeEventSlug(
      written.length > 0 ? written : slugifyEventName(value.celebrantName),
    );

    if (slug === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['slug'],
        /*
         * Tres motivos y tres mensajes. «No se pudo» a secas dejaría atascado justo al caso más
         * probable: un nombre que no da letras latinas —«〽️»— del que no sale ninguna dirección
         * y para el que hay que escribirla a mano.
         */
        message: isReservedSlug(written)
          ? `«${written}» es una dirección reservada del sitio. Elige otra.`
          : written.length > 0
            ? 'La dirección solo admite letras, números y guiones.'
            : 'De ese nombre no sale una dirección. Escríbela a mano.',
      });

      return z.NEVER;
    }

    return { ...value, slug };
  });
