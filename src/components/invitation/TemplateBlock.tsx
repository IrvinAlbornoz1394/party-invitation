import type { ReactNode } from 'react';
import type { DemoTemplateBlock } from './demo/templates';
import { InvitationBlock } from './InvitationBlock';

/**
 * Un bloque del escaparate: el mismo motor, con el contenido de ejemplo de la demo.
 *
 * Lo único que añade sobre `InvitationBlock` es de dónde sale el identificador: en el escaparate
 * el visitante puede cambiar de variante, y cuando no ha cambiado nada vale la que la plantilla
 * trae por defecto. Esa elección es de la demo y no del motor — la invitación real siempre sabe
 * con qué variante se pinta cada bloque, porque está guardada en `event_blocks`.
 */
export function TemplateBlock({
  block,
  registryId,
}: {
  readonly block: DemoTemplateBlock;
  /** El identificador elegido. Si no se pasa, el que la plantilla trae por defecto. */
  readonly registryId?: string;
}): ReactNode {
  return <InvitationBlock block={block} registryId={registryId ?? block.defaultRegistryId} />;
}
