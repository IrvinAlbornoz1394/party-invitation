import type { CSSProperties, ReactNode } from 'react';
import clsx from 'clsx';
import type { InvitationTheme } from '@/domain/invitation/theme';
import { themeCssVariables } from './theme-variables';

/**
 * El contenedor que pone un tema en pie.
 *
 * Todo bloque de una invitación se renderiza dentro de uno de estos. No es una convención
 * cómoda: es un requisito. Las variantes se escriben contra `--inv-*` y esas variables no
 * existen en ningún otro sitio —no hay valores por defecto en `:root` a propósito—, así que
 * una variante fuera de un `ThemeScope` se ve rota de inmediato en lugar de heredar en
 * silencio el aspecto de otro tema y hacer creer que funciona.
 *
 * Es un ámbito y no un `:root` global porque en el panel conviven varios: la pantalla de temas
 * enseña cuatro previsualizaciones a la vez, cada una con su tema, en la misma página. Con
 * variables globales eso exigiría iframes.
 *
 * No lleva `'use client'`: no tiene estado ni escucha nada. Renderiza igual en el servidor —la
 * invitación real— que dentro de un componente de cliente —la previsualización del panel—, y
 * en el primer caso el tema llega ya aplicado en el HTML, sin parpadeo.
 */
export function ThemeScope({
  theme,
  children,
  className,
  style,
  viewport,
}: {
  readonly theme: InvitationTheme;
  readonly children: ReactNode;
  readonly className?: string;
  readonly style?: CSSProperties;
  /**
   * Qué altura ocupa un bloque a pantalla completa. Por defecto, la del dispositivo.
   *
   * Existe por la previsualización: dentro de una ventana del panel, «pantalla completa» sería
   * la del monitor y la portada se saldría del recuadro. Pasando `560px` el mismo componente
   * se compone dentro del espacio que hay, sin una sola condición de «estoy en preview» en la
   * variante — que volvería a meter lógica de contexto en un componente de presentación.
   */
  readonly viewport?: string;
}) {
  return (
    <div
      className={clsx('inv-theme', className)}
      style={{
        ...themeCssVariables(theme),
        ...(viewport ? ({ '--inv-viewport': viewport } as CSSProperties) : null),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
