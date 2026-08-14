import type { ReactNode } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * La sección de un bloque de contenido, con el ritmo vertical de la invitación.
 *
 * Existe para una sola cosa y es suficiente: que el aire entre bloques sea el mismo en todos.
 * Escrito bloque a bloque, ese ritmo se pierde en la tercera variante —una con `py-20`, otra
 * con `py-24`— y el resultado no se ve como un error concreto, se ve como una invitación mal
 * hecha sin que nadie sepa señalar dónde.
 *
 * No la usa la portada: un bloque a pantalla completa no tiene ritmo que respetar, tiene una
 * pantalla que llenar.
 *
 * ## Por qué `twMerge` y no `clsx` a secas
 *
 * Porque una variante tiene que poder decir «esta sección va sobre el papel de superficie» sin
 * heredar además el fondo por defecto. Concatenando clases, `bg-inv-bg` y `bg-inv-surface`
 * acaban las dos en el atributo y gana la que Tailwind haya puesto después en la hoja —que no
 * es la que se escribió al final, sino la que le tocara en el orden de generación—. `twMerge`
 * resuelve el conflicto por familia de utilidad y deja solo la última.
 */
export function BlockSection({
  block,
  variant,
  children,
  className,
}: {
  /** La clave del bloque, para poder identificarlo en el DOM al depurar. */
  readonly block: string;
  readonly variant: string;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <section
      data-block={block}
      data-variant={variant}
      className={twMerge(
        clsx(
          /* El ritmo vertical lo pone el tema (`space.block`, un `clamp` fluido). Con
             `py-20 sm:py-28` escrito aquí, la densidad visual —lo que separa a «minimal» de
             «royal»— no era configurable: era una clase repetida en nueve bloques. */
          'w-full bg-inv-bg py-[var(--inv-space-block)] font-inv-body text-inv-ink',
          /*
           * `overflow-x-clip`, NO `overflow-hidden`, y la diferencia es un defecto real que
           * estuvo aquí sin verse.
           *
           * Las dos recortan lo que sobresale a los lados —que hace falta: un filete o un marco
           * asomando añade desplazamiento horizontal a la página entera, y en un móvil eso se
           * nota como «la invitación se mueve de lado»—. Pero `hidden` convierte a la sección en
           * un **contenedor de desplazamiento**, y `position: sticky` se ancla al contenedor de
           * desplazamiento más cercano: con `hidden`, los tres anclados del catálogo —la foto
           * final de la galería parallax, la columna de detalles y la de la lista— quedaban
           * anclados a una caja que no se desplaza, o sea sin anclar.
           *
           * `clip` recorta sin crear contenedor de desplazamiento. Es exactamente para esto.
           */
          'overflow-x-clip',
          className,
        ),
      )}
    >
      {children}
    </section>
  );
}

/**
 * La columna de texto de un bloque.
 *
 * `max-w-5xl` no es un número redondo elegido a ojo: con el cuerpo a 16px son unos 75
 * caracteres por línea en el punto más ancho, que es el límite a partir del cual el ojo
 * pierde el renglón al volver a la izquierda. En una historia de cuatro párrafos eso es la
 * diferencia entre leerla y saltársela.
 */
export function BlockContainer({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <div className={twMerge(clsx('mx-auto w-full max-w-5xl px-6 sm:px-10', className))}>
      {children}
    </div>
  );
}
