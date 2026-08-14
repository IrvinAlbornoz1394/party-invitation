'use client';

import type { ThemeSummary } from '@/domain/catalog/catalog-repository';
import { parseInvitationTheme, type InvitationTheme } from '@/domain/invitation/theme';
import { pluralize } from '../format';
import { CodeCell } from '../primitives/Cell';
import { EmptyState } from '../primitives/EmptyState';
import { PageHeader } from '../primitives/PageHeader';
import { SectionCard } from '../primitives/SectionCard';
import { StatusPill } from '../primitives/StatusPill';
import { activeStatus } from '../primitives/status-display';
import { BlockPreviewButton, type PreviewVariant } from './BlockPreview';

/**
 * Los temas de la biblioteca.
 *
 * Un tema **solo cambia apariencia, nunca lógica**: colores, tipografía, espaciados, sombras.
 * Nunca decide qué componente se renderiza — eso es del Component Registry. Es la regla que
 * permite cambiar de tema sin tocar nada más, y por eso esta pantalla enseña la paleta y no
 * una lista de qué hace cada tema.
 *
 * Se presenta como rejilla de tarjetas y no como tabla, a diferencia del resto del catálogo.
 * Un tema se elige por cómo se ve, y una fila de texto con el nombre de sus colores no
 * permite elegir nada; las muestras sí. Es el mismo criterio que hace que las plantillas sí
 * vayan en tabla: de ellas importan los datos —tipo, bloques, planes—, no el aspecto.
 *
 * Y por el mismo criterio, cada tarjeta abre la previsualización con **ese** tema puesto: las
 * muestras dicen qué colores tiene un tema, pero no si el texto se lee encima de la foto, que
 * es lo que se está decidiendo al elegirlo.
 */
export function ThemesScreen({
  themes,
  variants,
}: {
  readonly themes: readonly ThemeSummary[];
  /** Variantes con componente registrado, para poder verlas con cada tema. */
  readonly variants: readonly PreviewVariant[];
}) {
  return (
    <>
      <PageHeader
        title="Temas"
        description="Solo apariencia: colores, tipografía y espaciados. Un tema nunca decide qué componente se renderiza, así que cambiarlo no altera el comportamiento de ninguna invitación."
      />

      {themes.length === 0 ? (
        <SectionCard>
          <EmptyState
            title="No hay temas registrados"
            description="Los temas se cargan con el seed o se dan de alta con el rol dueño de la base de datos."
          />
        </SectionCard>
      ) : (
        <div className="dash-grid dash-grid--wide">
          {themes.map((theme) => (
            <ThemeCard key={theme.id} theme={theme} themes={themes} variants={variants} />
          ))}
        </div>
      )}
    </>
  );
}

function ThemeCard({
  theme,
  themes,
  variants,
}: {
  readonly theme: ThemeSummary;
  readonly themes: readonly ThemeSummary[];
  readonly variants: readonly PreviewVariant[];
}) {
  const resolved = parseInvitationTheme(theme.tokens);

  return (
    <article className="dash-card dash-theme">
      <div className="dash-theme__swatches">
        {SWATCH_ROLES.map(([role, label]) => {
          const color = resolved.colors[role];

          return (
            /*
             * Cada muestra lleva el papel que cumple y su valor en el atributo `title`. El
             * papel es el dato importante y el que antes no se veía: quien mira esta pantalla
             * necesita saber cuál es el color con el que este tema afirma —el que usará un
             * botón— y cuál es el papel del fondo, no que se llame «ciruela».
             */
            <span
              key={role}
              className="dash-theme__swatch"
              style={{ background: color }}
              title={`${label}: ${color}`}
            >
              <span className="dash-sr-only">
                {label}: {color}
              </span>
            </span>
          );
        })}
      </div>

      <div className="dash-theme__body">
        <div className="dash-theme__head">
          <h2 className="dash-card__title">{theme.name}</h2>
          <StatusPill appearance={activeStatus(theme.isActive)} />
        </div>
        <p className="dash-card__subtitle">{theme.description ?? 'Sin descripción.'}</p>
        <div className="dash-theme__meta">
          <CodeCell>{theme.key}</CodeCell>
          <span className="dash-cell__secondary">
            {pluralize(countDefinedTokens(theme.tokens), 'token propio', 'tokens propios')}
          </span>
        </div>

        <div className="dash-variant__actions">
          <BlockPreviewButton
            variants={variants}
            themes={themes}
            initialThemeKey={theme.key}
            label={`Ver un bloque con ${theme.name}`}
            block
          />
        </div>
      </div>
    </article>
  );
}

/**
 * Qué colores se enseñan y en qué orden.
 *
 * Se leen del tema ya resuelto —no de los tokens en crudo— porque un tema puede definir solo
 * tres colores y heredar el resto de la base: la tira debe enseñar la paleta con la que se va
 * a ver la invitación, no la que alguien se molestó en escribir.
 *
 * El orden es el de una invitación: primero los papeles sobre los que se apoya todo, después
 * los que afirman y por último los de tinta y filete. `overlay` se queda fuera porque es
 * translúcido y sobre el blanco de la tarjeta no dice nada.
 */
const SWATCH_ROLES: readonly (readonly [keyof InvitationTheme['colors'], string])[] = [
  ['background', 'Papel'],
  ['surface', 'Superficie'],
  ['primary', 'Principal'],
  ['onPrimary', 'Sobre el principal'],
  ['accent', 'Acento'],
  ['ink', 'Tinta'],
  ['inkSoft', 'Tinta suave'],
  ['line', 'Filete'],
];

/**
 * Cuántos tokens define el tema por su cuenta.
 *
 * Cuenta las hojas del jsonb guardado, no las del tema resuelto: ese número siempre sería el
 * mismo —el total del esquema— y no distinguiría un tema que solo cambia el color principal de
 * otro que redefine la tipografía entera. Aquí el dato útil es cuánto se aparta de la base.
 */
function countDefinedTokens(tokens: Record<string, unknown>): number {
  return Object.values(tokens).reduce<number>((total, value) => {
    if (typeof value === 'string') return total + 1;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return total + countDefinedTokens(value as Record<string, unknown>);
    }

    return total;
  }, 0);
}
