import type { ComponentType, ReactNode } from 'react';
import { Inbox } from 'lucide-react';

/**
 * Lo que se ve cuando todavía no hay nada.
 *
 * Un estado vacío bien escrito es la diferencia entre «esto está roto» y «esto aún no ha
 * empezado». Por eso pide siempre un título y una explicación, y no se conforma con el «No
 * data» que traen las tablas por defecto: quien abre `/admin/clientes` el primer día tiene
 * que salir de ahí sabiendo qué hacer a continuación.
 *
 * `action` es opcional a propósito. Hay vacíos que el usuario puede resolver —«da de alta el
 * primer cliente»— y otros que no dependen de él —«las confirmaciones aparecerán cuando
 * empiecen a llegar»—. Poner un botón en el segundo caso sería ofrecer una salida que no
 * existe.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  readonly icon?: ComponentType<{ readonly size?: number; readonly strokeWidth?: number }>;
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
}) {
  return (
    <div className="dash-empty">
      <span className="dash-empty__icon" aria-hidden="true">
        <Icon size={21} strokeWidth={1.6} />
      </span>
      <p className="dash-empty__title">{title}</p>
      {description && <p className="dash-empty__description">{description}</p>}
      {action}
    </div>
  );
}
