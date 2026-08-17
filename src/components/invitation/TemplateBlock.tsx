import type { ReactNode } from 'react';
import type { DemoTemplateBlock } from './demo/templates';
import {
  resolveCalendarVariant,
  resolveClosingVariant,
  resolveDetailsVariant,
  resolveDresscodeVariant,
  resolveFooterVariant,
  resolveGalleryVariant,
  resolveHeroVariant,
  resolveLocationVariant,
  resolveRsvpVariant,
  resolveScheduleVariant,
  resolveStoryVariant,
  resolveWelcomeVariant,
} from './registry/component-registry';

/**
 * Pinta un bloque de una plantilla con la variante que se le pida.
 *
 * Es el embrión del motor de render: recibe **contenido** y un **identificador del catálogo**, y
 * resuelve el segundo contra el Component Registry. Ni un `if` de tema, ni uno de plan, ni uno
 * de variante — cambiar `gallery.grid` por `gallery.polaroid` es cambiar una cadena de texto.
 *
 * ## Por qué hay un caso por bloque
 *
 * Por lo mismo que en `BlockDemo`: cada bloque tiene un contrato de contenido distinto, y es
 * esta rama la que le garantiza a TypeScript que a una galería no se le pasa el contenido de
 * una portada. La regla que `docs/PROJECT.md` prohíbe romper es ramificar por **tema, plan o
 * variante**; ramificar por bloque es lo que hace que el resto no haga falta.
 *
 * Cada rama usa el resolutor de su bloque —`resolveHeroVariant` y compañía—, que devuelve el
 * componente ya tipado o `null`. Así el emparejamiento entre contenido y componente no depende
 * de que quien llame acierte: si el identificador es de otro bloque, no se pinta nada.
 *
 * ## Por qué `null` y no un error
 *
 * Una variante que existe en el catálogo pero no en el código —o al revés, tras un despliegue a
 * medias— es un caso real. Perder un bloque de una demo es un daño acotado; una excepción sin
 * capturar deja la página entera en blanco.
 */
export function TemplateBlock({
  block,
  registryId,
}: {
  readonly block: DemoTemplateBlock;
  /** El identificador elegido. Si no se pasa, el que la plantilla trae por defecto. */
  readonly registryId?: string;
}): ReactNode {
  const chosen = registryId ?? block.defaultRegistryId;

  switch (block.blockKey) {
    case 'welcome': {
      const Variant = resolveWelcomeVariant(chosen);

      return Variant ? <Variant content={block.content} /> : null;
    }

    case 'hero': {
      const Variant = resolveHeroVariant(chosen);

      return Variant ? <Variant content={block.content} /> : null;
    }

    case 'story': {
      const Variant = resolveStoryVariant(chosen);

      return Variant ? <Variant content={block.content} /> : null;
    }

    case 'calendar': {
      const Variant = resolveCalendarVariant(chosen);

      return Variant ? <Variant content={block.content} /> : null;
    }

    case 'details': {
      const Variant = resolveDetailsVariant(chosen);

      return Variant ? <Variant content={block.content} /> : null;
    }

    case 'dresscode': {
      const Variant = resolveDresscodeVariant(chosen);

      return Variant ? <Variant content={block.content} /> : null;
    }

    case 'schedule': {
      const Variant = resolveScheduleVariant(chosen);

      return Variant ? <Variant content={block.content} /> : null;
    }

    case 'gallery': {
      const Variant = resolveGalleryVariant(chosen);

      return Variant ? <Variant content={block.content} /> : null;
    }

    case 'location': {
      const Variant = resolveLocationVariant(chosen);

      return Variant ? <Variant content={block.content} /> : null;
    }

    case 'rsvp': {
      const Variant = resolveRsvpVariant(chosen);

      return Variant ? <Variant content={block.content} /> : null;
    }

    case 'closing': {
      const Variant = resolveClosingVariant(chosen);

      return Variant ? <Variant content={block.content} /> : null;
    }

    case 'footer': {
      const Variant = resolveFooterVariant(chosen);

      return Variant ? <Variant content={block.content} /> : null;
    }

    default: {
      /* Un bloque nuevo sin caso aquí no compila: `block` ya no puede ser ningún miembro de la
         unión, y asignarlo a `never` solo vale si están todos cubiertos. */
      const unhandled: never = block;

      return unhandled;
    }
  }
}
