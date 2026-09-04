import type { AssembledBlock } from '@/domain/invitation/event-content';
import type { InvitationTheme } from '@/domain/invitation/theme';
import { InvitationBlock } from './InvitationBlock';
import { InvitationChrome } from './InvitationChrome';
import { ThemeScope } from './theme/ThemeScope';

/**
 * La invitación de un evento, montada a partir de lo que hay guardado en la base de datos.
 *
 * Es el Template Renderer que pide `docs/PROJECT.md`, y lo que hay que mirar es lo que **no**
 * tiene: ni una condición de plan, ni una de tema, ni una de variante. Recibe una lista de
 * bloques ya compuestos y un tema ya interpretado, y los pinta. Toda la personalización que
 * vende el producto —qué secciones hay, en qué orden, con qué diseño y con qué colores— entra
 * por los datos.
 *
 * De ahí sale la propiedad que sostiene el catálogo: **añadir una plantilla, un tema o una
 * variante no toca este archivo**. Y de ahí sale también dónde se aplica el plan del cliente: al
 * **guardar**, en el panel. Para cuando el motor recibe los bloques, la decisión ya está tomada;
 * si el filtro estuviera aquí, cada componente tendría que conocer los planes y `PROJECT.md` lo
 * prohíbe explícitamente.
 *
 * ## La bienvenida va aparte
 *
 * `welcome` no es una sección: es una puerta que tapa la invitación entera hasta que el invitado
 * pulsa, no ocupa sitio en el flujo y desaparece para no volver. Por eso se saca de la lista y se
 * pinta fuera del `<main>` — dentro sería una sección más y empujaría a las demás hacia abajo.
 * Un evento puede no tener ninguna, que es lo normal fuera de los planes que la incluyen.
 *
 * ## Por qué todo esto se renderiza en el servidor
 *
 * No lleva `'use client'` y la mayoría de los bloques tampoco. La invitación llega pintada en el
 * HTML: se lee aunque el JavaScript tarde o falle, que en un móvil con mala señal —abriendo un
 * enlace de WhatsApp— es el caso normal y no el excepcional. Solo piden cliente las galerías (su
 * visor necesita estado y teclado), la puerta de bienvenida y los dos mandos flotantes.
 */
export function InvitationRenderer({
  theme,
  blocks,
  musicUrl = null,
  musicTitle = null,
}: {
  /** El tema del evento, ya leído con `parseInvitationTheme`: sin huecos y con contraste válido. */
  readonly theme: InvitationTheme;
  /** Los bloques compuestos y en orden. Ver `domain/invitation/event-content.ts`. */
  readonly blocks: readonly AssembledBlock[];
  readonly musicUrl?: string | null;
  readonly musicTitle?: string | null;
}) {
  const gate = blocks.find((block) => block.blockKey === 'welcome');
  const sections = blocks.filter((block) => block.blockKey !== 'welcome');

  return (
    <ThemeScope theme={theme}>
      {gate ? <InvitationBlock block={gate} registryId={gate.registryId} /> : null}

      {/* El ancla del «volver arriba». Va aquí y no en la portada porque la portada es una
          variante intercambiable, y el ancla tiene que existir con cualquiera de las cinco. */}
      <main id="inv-top">
        {sections.map((block) => (
          <InvitationBlock key={block.blockKey} block={block} registryId={block.registryId} />
        ))}
      </main>

      <InvitationChrome musicUrl={musicUrl} musicTitle={musicTitle} />
    </ThemeScope>
  );
}
