import { z } from 'zod';

/**
 * Las piezas que se repiten en el contenido de más de un bloque.
 *
 * Existe desde que hubo un segundo bloque. Una imagen es lo mismo para la portada que para la
 * historia —una dirección y un texto alternativo—, y tenerla definida dos veces habría llevado
 * a lo de siempre: que una acepte rutas del sitio y la otra no, y que el panel guarde algo que
 * un bloque pinta y el otro rechaza.
 *
 * Aquí solo entra lo que de verdad significa lo mismo en todos los bloques. Un campo que
 * coincide por casualidad —dos bloques con un `title` que se comportan distinto— es mejor
 * dejarlo repetido: compartirlo obliga a que evolucionen juntos para siempre.
 */

/** Una línea de texto visible: sin espacios sobrantes y con tope, para que no rompa el diseño. */
export const line = (max: number) => z.string().trim().min(1).max(max);

/**
 * Un instante en ISO 8601.
 *
 * Se guarda como cadena y no como `Date` porque el contenido del bloque viaja por jsonb y por
 * la red —servidor a cliente— y `Date` no sobrevive a ese viaje sin serializar. La conversión
 * la hace quien la necesita.
 */
export const isoInstant = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'No es una fecha válida en ISO 8601');

/**
 * Una imagen de un bloque.
 *
 * La URL admite tanto absoluta como ruta del propio sitio (`/fotos/portada.jpg`) porque hoy
 * las fotos son enlaces externos y mañana serán archivos de un bucket propio servidos desde
 * aquí. Aceptar las dos formas ahora evita migrar el contenido guardado cuando ese día llegue.
 *
 * `alt` es obligatorio y no opcional a propósito. Una imagen sin texto alternativo deja a
 * quien usa lector de pantalla sin saber qué se le está enseñando, y un campo opcional se
 * queda vacío siempre.
 */
export const blockImageSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1)
    .refine(
      (value) => value.startsWith('/') || /^https?:\/\//i.test(value),
      'Debe ser una URL http(s) o una ruta del sitio que empiece por «/»',
    ),
  alt: line(200),
});

export type BlockImage = z.infer<typeof blockImageSchema>;

/** Una llamada a la acción: el botón que baja a la siguiente sección o abre un mapa. */
export const blockActionSchema = z.object({
  label: line(40),
  href: z.string().trim().min(1).max(500),
});

export type BlockAction = z.infer<typeof blockActionSchema>;

/**
 * El vocabulario de iconos de la invitación.
 *
 * Es **uno solo** para todos los bloques, y esa es la decisión que importa: un detalle
 * «Brindis a las 9» y un hito del cronograma «Brindis» son la misma idea, y con dos catálogos
 * separados acabarían con dos dibujos distintos en la misma invitación. Empezó dentro del
 * bloque de detalles y salió aquí en cuanto el cronograma necesitó los mismos.
 *
 * Es una CLAVE, no un componente: `icon: 'gift'` es contenido de un evento, guardado en jsonb
 * y repartido por WhatsApp; qué dibujo le corresponde es presentación y vive en
 * `components/invitation/shared/IconBadge.tsx (el mapa, en shared/block-icons.ts)`. Guardar el componente ataría el contenido a
 * una librería de iconos concreta y cambiarla obligaría a migrar la base de datos.
 *
 * El enum es cerrado a propósito. Un texto libre acabaría con `'regalo'`, `'gift'` y `'Gift'`
 * conviviendo, y con un hueco vacío en la invitación de quien se equivocó de idioma. Cuando
 * falte un icono se añade aquí y en el mapa de presentación: dos líneas.
 */
export const blockIconSchema = z
  .enum([
    'calendar',
    'clock',
    'location',
    'church',
    'dress',
    'gift',
    'music',
    'camera',
    'cake',
    'phone',
    'parking',
    'info',
    'toast',
    'food',
    'party',
    'heart',
    'sparkles',
    'car',
    'flowers',
    'guests',
  ])
  .default('info');

export type BlockIcon = z.output<typeof blockIconSchema>;
