import { z } from 'zod';
import { blockImageSchema, line } from './shared';

/**
 * El contenido del bloque **protagonistas**: quiénes celebran, presentados uno a uno.
 *
 * En una boda son la novia y el novio, cada uno con su retrato, su nombre y unas líneas en primera
 * persona. En unos XV es la quinceañera, y si se quiere, sus papás o sus padrinos. Es la sección
 * «el novio / la novia» de las plantillas de boda de mercado, y la que no tenía el catálogo: la
 * historia cuenta **a la pareja**, esta presenta **a cada uno**.
 *
 * ## Por qué es una lista y no «novio» y «novia»
 *
 * Por lo mismo que los detalles: con dos campos con nombre, unos XV no tendrían dónde poner a la
 * quinceañera sin fingir que es una novia, y una boda de dos novias tendría un campo «novio» que
 * mentiría. Con una lista, quién es quién lo dice `role` —«La novia», «La quinceañera», «Sus
 * papás»— y es texto, no un valor de un catálogo cerrado.
 *
 * ## Vive en el `config` del bloque
 *
 * Como los detalles y la vestimenta: no hay ninguna columna del evento de la que derivarla, y
 * crear una tabla para dos o tres filas que solo lee esta sección sería mucho más de lo que pide.
 * El panel la edita como lista (ver `domain/events/event-block-lists.ts`).
 *
 * La foto es opcional, como en todo el catálogo: el bloque se configura antes de tener el material
 * y cada variante tiene que componerse sin ella.
 */

export const protagonistSchema = z.object({
  /** Quién es: «La novia», «El novio», «La quinceañera», «Sus papás». */
  role: line(40).nullable().default(null),
  name: line(80),
  /** Unas líneas en primera persona. Opcional: hay quien solo quiere el retrato y el nombre. */
  bio: line(400).nullable().default(null),
  image: blockImageSchema.nullable().default(null),
});

export type Protagonist = z.output<typeof protagonistSchema>;

export const protagonistsContentSchema = z.object({
  eyebrow: line(60).nullable().default(null),
  title: line(120),
  subtitle: line(200).nullable().default(null),
  /** Entre una persona —la quinceañera— y seis —la pareja, sus padres y sus padrinos—. */
  people: z.array(protagonistSchema).min(1).max(6),
});

export type ProtagonistsContent = z.output<typeof protagonistsContentSchema>;

export type ProtagonistsContentInput = z.input<typeof protagonistsContentSchema>;
