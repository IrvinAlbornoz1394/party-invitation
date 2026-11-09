'use client';

import { Select } from 'antd';
import { PALETTES, type Palette, type PaletteColors } from '@/domain/invitation/palettes';

/**
 * El desplegable de paleta del alta y la edición de un evento.
 *
 * La primera opción, vacía, es «los colores del tema»: el evento se ve como diseñó la plantilla.
 * Cualquier otra es una paleta del banco (`domain/invitation/palettes.ts`) y **gana sobre los
 * colores del tema**; tipografía, ornamento y fotos siguen siendo del tema.
 *
 * Cada opción lleva sus colores a la vista porque «Talavera» o «Musgo y lila» no dicen nada hasta
 * que se ven. Primero van las que encajan con el tipo de celebración del evento; las demás siguen
 * disponibles abajo, porque la regla de la demo es una recomendación y no una prohibición: si el
 * cliente quiere unos XV en verde olivo, se le da.
 */
export function PaletteSelect({
  value,
  onChange,
  eventTypeKey,
}: {
  /** `''` = colores del tema. */
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly eventTypeKey: string;
}) {
  const fits = (palette: Palette) => !eventTypeKey || (palette.events as readonly string[]).includes(eventTypeKey);
  const option = (palette: Palette) => ({
    value: palette.key,
    name: palette.name,
    label: <PaletteLabel name={palette.name} colors={palette.colors} />,
  });

  const groups = [
    { label: 'Las de siempre', options: PALETTES.filter((p) => p.family === 'classic' && fits(p)).map(option) },
    { label: 'Poco comunes', options: PALETTES.filter((p) => p.family === 'rare' && fits(p)).map(option) },
    { label: 'De otro tipo de celebración', options: PALETTES.filter((p) => !fits(p)).map(option) },
  ].filter((group) => group.options.length > 0);

  return (
    <Select
      size="large"
      showSearch={{ optionFilterProp: 'name' }}
      value={value}
      onChange={onChange}
      style={{ width: '100%' }}
      options={[{ value: '', name: 'Colores del tema', label: 'Colores del tema (sin paleta)' }, ...groups]}
    />
  );
}

function PaletteLabel({ name, colors }: { readonly name: string; readonly colors: PaletteColors }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <span
        aria-hidden="true"
        style={{
          width: 18,
          height: 18,
          flexShrink: 0,
          borderRadius: '50%',
          border: '1px solid rgba(0,0,0,0.12)',
          background: `conic-gradient(${colors.primary} 0 50%, ${colors.accent} 50% 75%, ${colors.background} 75% 100%)`,
        }}
      />
      {name}
    </span>
  );
}
