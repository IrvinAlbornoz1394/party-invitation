import type { ReactNode } from 'react';
import type { BlockContent } from '@/domain/invitation/blocks/block-content';
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
 * Pinta un bloque con la variante que se le pida. **Es el motor de render.**
 *
 * Recibe **contenido** y un **identificador del catálogo**, y resuelve el segundo contra el
 * Component Registry. Ni un `if` de tema, ni uno de plan, ni uno de variante: cambiar
 * `gallery.grid` por `gallery.polaroid` en una invitación publicada es cambiar una cadena de
 * texto en la base de datos, y por eso añadir la sexta galería no toca este archivo.
 *
 * Lo usan los dos consumidores que existen —el escaparate público, con contenido de ejemplo, y
 * la invitación real, con el contenido ensamblado del evento—, y eso importa más de lo que
 * parece: lo que se enseña en la demo se pinta con el mismo código que lo que recibe el
 * invitado, así que no pueden separarse.
 *
 * ## Por qué hay un caso por bloque
 *
 * Cada bloque tiene un contrato de contenido distinto, y es esta rama la que le garantiza a
 * TypeScript que a una galería no se le pasa el contenido de una portada. La regla que
 * `docs/PROJECT.md` prohíbe romper es ramificar por **tema, plan o variante**; ramificar por
 * bloque es justamente lo que hace que el resto no haga falta.
 *
 * Cada rama usa el resolutor de su bloque —`resolveHeroVariant` y compañía—, que devuelve el
 * componente ya tipado o `null`. Así el emparejamiento entre contenido y componente no depende
 * de que quien llame acierte: si el identificador es de otro bloque, no se pinta nada.
 *
 * ## Por qué `null` y no un error
 *
 * Una variante que existe en el catálogo pero no en el código —o al revés, tras un despliegue a
 * medias— es un caso real, y cuando pasa hay una invitación repartida abriéndose en el móvil de
 * alguien. Perder un bloque es un daño acotado; una excepción sin capturar deja la invitación en
 * blanco entera.
 */
export function InvitationBlock({
  block,
  registryId,
}: {
  readonly block: BlockContent;
  readonly registryId: string;
}): ReactNode {
  switch (block.blockKey) {
    case 'welcome': {
      const Variant = resolveWelcomeVariant(registryId);

      return Variant ? <Variant content={block.content} /> : null;
    }

    case 'hero': {
      const Variant = resolveHeroVariant(registryId);

      return Variant ? <Variant content={block.content} /> : null;
    }

    case 'story': {
      const Variant = resolveStoryVariant(registryId);

      return Variant ? <Variant content={block.content} /> : null;
    }

    case 'calendar': {
      const Variant = resolveCalendarVariant(registryId);

      return Variant ? <Variant content={block.content} /> : null;
    }

    case 'details': {
      const Variant = resolveDetailsVariant(registryId);

      return Variant ? <Variant content={block.content} /> : null;
    }

    case 'dresscode': {
      const Variant = resolveDresscodeVariant(registryId);

      return Variant ? <Variant content={block.content} /> : null;
    }

    case 'schedule': {
      const Variant = resolveScheduleVariant(registryId);

      return Variant ? <Variant content={block.content} /> : null;
    }

    case 'gallery': {
      const Variant = resolveGalleryVariant(registryId);

      return Variant ? <Variant content={block.content} /> : null;
    }

    case 'location': {
      const Variant = resolveLocationVariant(registryId);

      return Variant ? <Variant content={block.content} /> : null;
    }

    case 'rsvp': {
      const Variant = resolveRsvpVariant(registryId);

      return Variant ? <Variant content={block.content} /> : null;
    }

    case 'closing': {
      const Variant = resolveClosingVariant(registryId);

      return Variant ? <Variant content={block.content} /> : null;
    }

    case 'footer': {
      const Variant = resolveFooterVariant(registryId);

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
