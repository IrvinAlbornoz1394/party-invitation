import clsx from 'clsx';

/**
 * El motivo decorativo del tema.
 *
 * Tres piezas —filete, nodo, filete— cuyas medidas y forma decide el tema. El mismo componente
 * dibuja el rombo de una invitación de boda, el punto de una floral, la marca cuadrada de una
 * corporativa y **nada** en una minimal, sin una sola condición: cuando el nodo mide cero, no
 * hay nodo.
 *
 * ## Por qué no es un SVG por tema
 *
 * Porque entonces el componente tendría que conocer los temas —«si es royal, filigrana»— y eso
 * es exactamente lo que `docs/PROJECT.md` prohíbe. Con las medidas en tokens, añadir un tema
 * con otro ornamento es escribir cinco valores en la base de datos, no un dibujo nuevo en el
 * código.
 *
 * El precio es que el vocabulario de formas es limitado: líneas, puntos, rombos y cuadrados.
 * Para la mayoría de la papelería sobra —los ornamentos de una participación son eso—, y el día
 * que un tema necesite una filigrana de verdad, será un token más apuntando a una máscara, no
 * una rama en un `switch`.
 *
 * Va marcado como decorativo: no aporta información y anunciarlo interrumpiría la lectura del
 * rótulo al que acompaña.
 */
export function BlockOrnament({ className }: { readonly className?: string }) {
  return (
    <span aria-hidden="true" className={clsx('inv-ornament', className)}>
      <span className="inv-ornament__line" />
      <span className="inv-ornament__node" />
      <span className="inv-ornament__line" />
    </span>
  );
}
