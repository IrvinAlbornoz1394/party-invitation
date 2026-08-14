import { Avatar } from '../primitives/Avatar';

/**
 * El bloque bajo la marca: quién eres, o dónde estás trabajando.
 *
 * Los dos paneles ponen aquí cosas distintas y por eso el componente recibe los textos en
 * vez de derivarlos:
 *
 * - En el panel de un **cliente** es su espacio de trabajo — el nombre del cliente y tu rol
 *   dentro de él. Todo lo que ves pertenece a ese cliente, así que nombrarlo orienta.
 * - En **plataforma** es la PERSONA, porque una cuenta de plataforma no pertenece a ningún
 *   cliente. Cuando este bloque se llamaba `workspaceName` hubo que inventarle uno a
 *   `/admin`, y acabó diciendo "Mi Evento" bajo un logotipo que ya decía "Mi Evento": se
 *   leía como que el administrador tuviera un evento propio, que es justo la confusión que
 *   el modelo de datos eliminó.
 */
export function SidebarIdentity({
  title,
  caption,
}: {
  readonly title: string;
  readonly caption: string;
}) {
  return (
    <div className="dash__identity">
      <Avatar name={title} size={32} />
      <div className="dash__identity-body">
        {/* `title` en el atributo además del texto: el nombre se recorta con puntos
            suspensivos si es largo, y así se puede leer entero al posarse encima. */}
        <span className="dash__identity-title" title={title}>
          {title}
        </span>
        <span className="dash__identity-caption">{caption}</span>
      </div>
    </div>
  );
}
