import { couple, initials } from './welcome-name';

/**
 * Lo que no es componente de los sobres de bienvenida: qué lleva grabado el lacre y el reflejo
 * del papel. Va aparte de `envelope-parts.tsx` porque un módulo que mezcla componentes con otras
 * exportaciones rompe la recarga en caliente de Next.
 */

/**
 * Lo que va grabado en el lacre.
 *
 * - `initials`: las de la pareja con su «&» —«A&D»—, o las de una sola persona.
 * - `quince`: el «15» grande con la corona y «Años» a mano, como los lacres de XV de papelería.
 */
export type SealMark =
  | { readonly kind: 'initials'; readonly text: string }
  | { readonly kind: 'quince'; readonly number: string; readonly label: string };

/** «Mis XV años», «Mis quince», «15 años». */
const QUINCE_LABEL = /\b(xv|quince|15)\b/i;

/**
 * Qué lacre le toca a esta bienvenida.
 *
 * El contenido de la bienvenida no trae el tipo de evento —solo su rótulo, que es una frase—, y
 * añadirlo al contrato para decidir un adorno sería caro. Así que decide por lo que sí trae, en
 * este orden:
 *
 *   1. Si el nombre es de **una pareja** —«Ana & Diego»— son iniciales: es una boda o algo que
 *      se celebra de a dos, y en los dos casos se monograma así.
 *   2. Si es una sola persona y el rótulo habla de **XV**, el lacre de quince con su número.
 *   3. Si no, las iniciales de quien celebra.
 *
 * Equivocarse aquí cuesta poco: lo peor que puede pasar es un lacre con iniciales donde cabía un
 * «15», que sigue siendo un lacre correcto.
 */
export function sealMarkOf(
  name: string,
  lastName: string | null,
  eventTypeLabel: string | null,
): SealMark {
  if (couple(name) === null && eventTypeLabel !== null && QUINCE_LABEL.test(eventTypeLabel)) {
    return { kind: 'quince', number: '15', label: 'Años' };
  }

  return { kind: 'initials', text: sealMonogram(name, lastName) };
}

/**
 * Las iniciales: una pareja se graba con su «&» —«A&D»—, porque es como se monograma una boda;
 * un solo nombre lleva sus dos iniciales juntas.
 *
 * Además del lacre, la usan las tarjetas que asoman de los sobres (`letter`, `dear`).
 */
export function sealMonogram(name: string, lastName: string | null): string {
  const pair = couple(name);

  if (pair) return `${initials(pair[0], null).charAt(0)}&${initials(pair[1], null).charAt(0)}`;

  return initials(name, lastName, '');
}

/** El reflejo del papel: una luz suave de arriba, para que la superficie no sea un plano liso. */
export const PAPER_SHEEN =
  'radial-gradient(120% 80% at 50% 0%, rgb(255 255 255 / 0.32), transparent 60%)';
