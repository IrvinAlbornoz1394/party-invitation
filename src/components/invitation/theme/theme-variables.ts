import type { CSSProperties } from 'react';
import type { InvitationTheme } from '@/domain/invitation/theme';

/**
 * El puente entre un tema y el CSS: tokens dentro, propiedades personalizadas fuera.
 *
 * Es lo que hace que cambiar de tema no cueste un re-render de nada ni una clase distinta en
 * ningún componente. Las variantes se escriben una sola vez contra `--inv-color-primary`, y
 * poner otro tema es cambiar el valor de esa variable en un contenedor: el navegador recalcula
 * lo que cuelga de él y ya está. Cualquier otro mecanismo —una clase por tema, un objeto de
 * estilos por componente— obligaría a que el componente conociera los temas, que es justo lo
 * que `docs/PROJECT.md` prohíbe.
 *
 * ## El nombre de cada variable
 *
 * `--inv-<grupo>-<token>`, con el token en kebab-case: `colors.inkSoft` sale como
 * `--inv-color-ink-soft`. El prefijo `inv-` separa el espacio de nombres de la invitación del
 * del panel (`--dash-*`), que conviven en la misma página cuando el admin previsualiza un
 * componente.
 */

/**
 * El singular de cada grupo, que es como se lee en la variable.
 *
 * `colors` → `--inv-color-…`, no `--inv-colors-…`. La variable nombra **un** color, y el
 * plural del grupo solo tiene sentido en el objeto que los agrupa.
 */
const GROUP_PREFIX: Readonly<Record<keyof InvitationTheme, string>> = {
  colors: 'color',
  fonts: 'font',
  radii: 'radius',
  shadows: 'shadow',
  motion: 'motion',
  space: 'space',
  photo: 'photo',
  ornament: 'ornament',
  edge: 'edge',
};

const kebab = (token: string): string => token.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/**
 * Las variables CSS de un tema, listas para un atributo `style`.
 *
 * Se recorren los grupos en lugar de escribir las quince líneas a mano porque el conjunto de
 * tokens va a crecer, y una lista escrita a mano se queda corta en silencio: el token nuevo
 * existiría en el tema, se guardaría en la base de datos y no llegaría nunca al CSS.
 */
export function themeCssVariables(theme: InvitationTheme): CSSProperties {
  const variables: Record<string, string> = {};

  for (const [group, prefix] of Object.entries(GROUP_PREFIX)) {
    const tokens = theme[group as keyof InvitationTheme] as Record<string, string>;

    for (const [token, value] of Object.entries(tokens)) {
      variables[`--inv-${prefix}-${kebab(token)}`] = value;
    }
  }

  /*
   * El molde: `CSSProperties` no admite propiedades personalizadas en su tipo, aunque React
   * las escribe sin problema desde la versión 16. La alternativa —declarar cada `--inv-*` en
   * una interfaz— tendría que mantenerse en paralelo a los tokens, que es exactamente la
   * duplicación que el bucle de arriba evita.
   */
  return variables as CSSProperties;
}
