'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Input, Segmented, Select, Tag } from 'antd';
import { ImageOff, Search } from 'lucide-react';
import { DesignAsset } from '@/components/invitation/shared/DesignAsset';
import type { DesignAsset as DesignAssetData, DesignAssetCategory, DesignAssetType } from '@/lib/design-assets';
import { pluralize } from '../format';
import { CopyButton } from '../primitives/CopyButton';
import { EmptyState } from '../primitives/EmptyState';
import { PageHeader } from '../primitives/PageHeader';
import './design-assets.css';

const CATEGORY_LABELS: Record<DesignAssetCategory, string> = { wedding: 'Bodas', quince: 'XV años' };

const TYPE_LABELS: Record<DesignAssetType, string> = {
  branch: 'Rama',
  leaf: 'Hoja',
  sprig: 'Ramita',
  corner: 'Esquina',
  divider: 'Separador',
  wreath: 'Corona',
  frame: 'Marco',
  tiara: 'Tiara',
  symbol: 'Símbolo',
};

/*
 * Tintas de prueba. No son la paleta de ningún tema: son los tonos típicos de papelería fina,
 * para comprobar que una pieza aguanta tanto un dorado claro como una tinta oscura, y que en
 * fondo oscuro no desaparece.
 */
const INKS = [
  { label: 'Tinta', value: '#2c222a' },
  { label: 'Dorado', value: '#b08d57' },
  { label: 'Salvia', value: '#6f7f63' },
  { label: 'Berenjena', value: '#5b3a55' },
  { label: 'Marfil', value: '#f3ead8' },
] as const;

/** Sin acentos ni mayúsculas, para que «botanico» encuentre «botánico». */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/**
 * La biblioteca de recursos gráficos, para verla y copiar lo que se necesita al maquetar.
 *
 * Es una pantalla de **consulta** para quien diseña variantes: las piezas se añaden con un
 * commit (archivo + ficha en `assets.json`), no desde aquí. Por eso todo lo que ofrece es
 * mirar, filtrar y copiar el ID o la ruta.
 *
 * El color y el fondo de prueba están para lo que decide si una pieza sirve: verla con el color
 * de un tema real. Una rama que solo se ve bien en negro sobre blanco no es reutilizable.
 */
export function DesignAssetsScreen({ assets }: { readonly assets: readonly DesignAssetData[] }) {
  const [category, setCategory] = useState<DesignAssetCategory | 'all'>('all');
  const [type, setType] = useState<DesignAssetType | 'all'>('all');
  const [query, setQuery] = useState('');
  const [ink, setInk] = useState<string>(INKS[0].value);
  const [dark, setDark] = useState(false);

  // La búsqueda filtra en cada tecla; diferirla evita que la rejilla bloquee el campo de texto.
  const deferredQuery = useDeferredValue(query);

  const visible = useMemo(() => {
    const needle = normalize(deferredQuery.trim());

    return assets.filter((asset) => {
      if (category !== 'all' && asset.category !== category) return false;
      if (type !== 'all' && asset.type !== type) return false;
      if (!needle) return true;

      return normalize([asset.id, asset.name, ...asset.tags, ...asset.style].join(' ')).includes(needle);
    });
  }, [assets, category, type, deferredQuery]);

  const countBy = (key: 'category' | 'type', value: string) =>
    assets.filter((asset) => asset[key] === value).length;

  return (
    <>
      <PageHeader
        title="Recursos gráficos"
        description="Las piezas decorativas con las que se construyen las variantes: ramas, esquinas, coronas y separadores. Todas tienen licencia verificada para uso comercial y toman el color del tema."
      />

      <div className="dassets-toolbar">
        <Input
          allowClear
          prefix={<Search size={15} aria-hidden="true" />}
          placeholder="Buscar por nombre, ID o etiqueta"
          aria-label="Buscar recursos"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="dassets-toolbar__search"
        />

        <Segmented
          aria-label="Categoría"
          value={category}
          onChange={(value) => setCategory(value as DesignAssetCategory | 'all')}
          options={[
            { label: `Todas (${assets.length})`, value: 'all' },
            ...(Object.keys(CATEGORY_LABELS) as DesignAssetCategory[]).map((key) => ({
              label: `${CATEGORY_LABELS[key]} (${countBy('category', key)})`,
              value: key,
            })),
          ]}
        />

        <Select
          aria-label="Tipo"
          value={type}
          onChange={setType}
          className="dassets-toolbar__type"
          options={[
            { label: 'Todos los tipos', value: 'all' },
            ...(Object.keys(TYPE_LABELS) as DesignAssetType[])
              .filter((key) => countBy('type', key) > 0)
              .map((key) => ({ label: `${TYPE_LABELS[key]} (${countBy('type', key)})`, value: key })),
          ]}
        />

        <div className="dassets-toolbar__ink" role="group" aria-label="Color de prueba">
          {INKS.map((option) => (
            <button
              key={option.value}
              type="button"
              className="dassets-swatch"
              style={{ background: option.value }}
              aria-label={option.label}
              aria-pressed={ink === option.value}
              title={option.label}
              onClick={() => setInk(option.value)}
            />
          ))}
          <label className="dassets-swatch dassets-swatch--custom" title="Otro color">
            <span className="dash-sr-only">Otro color</span>
            <input type="color" value={ink} onChange={(event) => setInk(event.target.value)} />
          </label>
          <Segmented
            size="small"
            aria-label="Fondo de prueba"
            value={dark ? 'dark' : 'light'}
            onChange={(value) => setDark(value === 'dark')}
            options={[
              { label: 'Papel', value: 'light' },
              { label: 'Oscuro', value: 'dark' },
            ]}
          />
        </div>
      </div>

      <p className="dassets-count" role="status">
        {pluralize(visible.length, 'recurso', 'recursos')}
      </p>

      {visible.length === 0 ? (
        <EmptyState
          icon={ImageOff}
          title="Ningún recurso coincide"
          description="Prueba con otra palabra o quita alguno de los filtros."
        />
      ) : (
        <ul className="dassets-grid">
          {visible.map((asset) => (
            <li key={asset.id} className="dassets-card">
              <div
                className={dark ? 'dassets-card__stage dassets-card__stage--dark' : 'dassets-card__stage'}
                style={{ color: ink }}
              >
                <DesignAsset asset={asset} className="dassets-card__art" />
              </div>

              <div className="dassets-card__body">
                <p className="dassets-card__name">{asset.name}</p>
                <code className="dassets-card__id">{asset.id}</code>

                <div className="dassets-card__tags">
                  <Tag>{TYPE_LABELS[asset.type]}</Tag>
                  <Tag>{CATEGORY_LABELS[asset.category]}</Tag>
                  <Tag color={asset.license === 'Original' ? 'purple' : 'green'}>{asset.license}</Tag>
                </div>

                <p className="dassets-card__source">
                  {asset.source.startsWith('http') ? (
                    <a href={asset.source} target="_blank" rel="noreferrer noopener">
                      {asset.author}
                    </a>
                  ) : (
                    asset.author
                  )}
                  {' · '}
                  {Math.round(asset.width)}×{Math.round(asset.height)}
                </p>

                <div className="dassets-card__actions">
                  <CopyButton size="small" value={asset.id} label="ID" copiedLabel="ID copiado" describedAs={`Copiar el ID ${asset.id}`} />
                  <CopyButton size="small" value={asset.file} label="Ruta" copiedLabel="Ruta copiada" describedAs={`Copiar la ruta ${asset.file}`} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
