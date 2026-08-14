import { EclatMark } from './EclatMark';
import './eclat.css';

/**
 * El logotipo completo: monograma, nombre y bajada.
 *
 * Tres decisiones de marca están cocidas aquí, y las tres son lo que separa esto de escribir
 * el nombre con la fuente por defecto:
 *
 * 1. **El nombre va en minúscula.** «éclat», no «Éclat» ni «ÉCLAT». Es una palabra francesa
 *    —destello— y en minúscula se lee como marca; capitalizada se lee como el principio de
 *    una frase.
 * 2. **Tracking abierto en el nombre y muy abierto en la bajada.** Es el recurso que hace que
 *    un serif fino parezca caro. Apretado, el mismo tipo se lee como texto corrido.
 * 3. **La bajada va en versalitas de palo seco.** El contraste entre el serif del nombre y el
 *    geométrico de «invitaciones digitales» es lo que da jerarquía sin necesidad de cambiar
 *    de tamaño dos veces.
 *
 * `tone` existe porque el logotipo vive sobre dos fondos: la barra lateral oscura, donde va en
 * oro, y las superficies claras, donde el oro no contrasta y va en berenjena.
 */
export function EclatWordmark({
  size = 'md',
  tone = 'dark',
  showTagline = true,
  title,
}: {
  readonly size?: 'sm' | 'md' | 'lg';
  /** `dark` = sobre fondo oscuro (oro). `light` = sobre fondo claro (berenjena). */
  readonly tone?: 'dark' | 'light';
  readonly showTagline?: boolean;
  /**
   * Nombre accesible para el conjunto.
   *
   * Solo se pasa cuando el logotipo es lo ÚNICO que identifica la pantalla —la de acceso—.
   * En la barra lateral se omite: allí el enlace que lo envuelve ya lleva su propia etiqueta,
   * y ponerlo aquí además haría que un lector leyera la marca dos veces seguidas.
   */
  readonly title?: string;
}) {
  const markSize = size === 'lg' ? 56 : size === 'sm' ? 28 : 36;

  return (
    <span className={`eclat eclat--${size} eclat--${tone}`} role={title ? 'img' : undefined} aria-label={title}>
      <span className="eclat__mark">
        <EclatMark size={markSize} />
      </span>
      <span className="eclat__text">
        <span className="eclat__name">éclat</span>
        {showTagline && <span className="eclat__tagline">invitaciones digitales</span>}
      </span>
    </span>
  );
}
