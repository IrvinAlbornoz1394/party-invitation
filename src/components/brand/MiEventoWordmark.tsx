import { MiEventoMark } from './MiEventoMark';
import './mievento.css';

/**
 * El logotipo completo: monograma, nombre y bajada.
 *
 * Tres decisiones de marca están cocidas aquí, y las tres son lo que separa esto de escribir
 * el nombre con la fuente por defecto:
 *
 * 1. **La caja es parte del nombre.** «MiEvento», con la E interior en mayúscula: es lo que
 *    separa las dos palabras sin meter un espacio, que las volvería a leer como una frase.
 *    Ni «mievento» —se lee como un dominio— ni «MIEVENTO» —se lee como un acrónimo—. Por eso
 *    el CSS no lleva `text-transform`: la palabra se escribe aquí y no se transforma después.
 * 2. **Tracking abierto en el nombre y muy abierto en la bajada.** Es el recurso que hace que
 *    un serif fino parezca caro. Apretado, el mismo tipo se lee como texto corrido.
 * 3. **La bajada va en versalitas de palo seco.** El contraste entre el serif del nombre y el
 *    geométrico de «invitaciones digitales» es lo que da jerarquía sin necesidad de cambiar
 *    de tamaño dos veces.
 *
 * `tone` existe porque el logotipo vive sobre dos fondos: la barra lateral oscura, donde va en
 * oro, y las superficies claras, donde el oro no contrasta y va en berenjena.
 */
export function MiEventoWordmark({
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
    <span className={`mievento mievento--${size} mievento--${tone}`} role={title ? 'img' : undefined} aria-label={title}>
      <span className="mievento__mark">
        <MiEventoMark size={markSize} />
      </span>
      <span className="mievento__text">
        <span className="mievento__name">MiEvento</span>
        {showTagline && <span className="mievento__tagline">invitaciones digitales</span>}
      </span>
    </span>
  );
}
