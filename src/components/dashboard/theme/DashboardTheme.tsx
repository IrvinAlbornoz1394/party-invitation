'use client';

import type { ReactNode } from 'react';
import { ConfigProvider, theme } from 'antd';
import esES from 'antd/locale/es_ES';
import type { DashboardPalette } from './dashboard-palette';

/**
 * El puente entre la paleta del panel y los tokens de antd.
 *
 * Existe como componente propio —y no como un objeto dentro del armazón— porque es la
 * ÚNICA responsabilidad de traducir "así se ve este panel" al vocabulario de la librería de
 * componentes. Si mañana antd se sustituye, este archivo es el que se reescribe y ningún
 * otro se entera.
 *
 * Aquí no se pinta ni un fondo. Todo lo que sea superficie, degradado o retícula vive en
 * `dashboard.css`; lo que se configura aquí son los widgets interactivos que antd dibuja por
 * dentro y a los que no se puede llegar con CSS sin pelear contra su especificidad. Repartir
 * la misma decisión entre los dos sitios es lo que produce el clásico "cambié el color y no
 * cambió nada".
 */
export function DashboardTheme({
  palette,
  children,
}: {
  readonly palette: DashboardPalette;
  readonly children: ReactNode;
}) {
  return (
    <ConfigProvider
      /*
       * El idioma de los componentes. Sin esto la paginación dice "items per page" y los
       * selectores vacíos "No data" en medio de una interfaz en español — el detalle que
       * hace que un panel parezca a medio traducir.
       */
      locale={esES}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: palette.accent,
          colorLink: palette.accent,
          colorInfo: palette.accent,
          /*
           * Tipografía y radios en un solo sitio. El cuerpo va en la misma familia que el
           * resto de la aplicación (`--font-body`, servida por next/font desde el layout
           * raíz) para que los widgets de antd no se lean como una isla con otra letra.
           */
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          borderRadius: 10,
          borderRadiusLG: 12,
          /* Neutros cálidos, alineados con el berenjena de la marca en vez del gris azulado
             que antd trae por defecto. */
          colorText: '#3a2f38',
          colorTextHeading: '#2c222a',
          colorTextSecondary: '#6a5c66',
          colorTextDescription: '#7a6c7a',
          colorBorder: '#e8dfe4',
          colorBorderSecondary: '#f1eaee',
          colorSplit: '#f1eaee',
          colorBgLayout: 'transparent',
          /* Verde y ámbar desaturados: en un panel lleno de estados, los tonos saturados
             de serie compiten con los datos. */
          colorSuccess: '#4f7d5e',
          /* El ámbar de aviso se alinea con el oro de la marca en vez de tirar a naranja:
             dos metales distintos en la misma pantalla se leen como un descuido. */
          colorWarning: '#8a6b35',
          colorError: '#b04a52',
        },
        components: {
          /*
           * Las tarjetas las dibuja `SectionCard` con CSS propio, así que aquí solo se
           * neutraliza el Card de antd para los pocos sitios donde aún aparece (modales
           * anidados) y no se pelee con la sombra del sistema.
           */
          Card: { borderRadiusLG: 14, paddingLG: 20 },
          Table: {
            headerBg: 'transparent',
            headerSplitColor: 'transparent',
            rowHoverBg: '#faf6f8',
            cellPaddingBlock: 13,
            cellPaddingInline: 14,
            borderColor: '#f0eaf1',
          },
          Tag: { borderRadiusSM: 999, defaultBg: '#f5eff2', defaultColor: '#6a5c66' },
          /*
           * 44px de alto en los controles grandes: es el mínimo de objetivo táctil de Apple
           * HIG, y el panel se usa también desde el teléfono. Los dos píxeles de más no se
           * ven; el toque fallido, sí.
           */
          Button: { controlHeightLG: 44, paddingInline: 18, fontWeight: 500 },
          Input: { controlHeightLG: 44 },
          Select: { controlHeightLG: 44 },
          Modal: { borderRadiusLG: 16, titleFontSize: 18 },
          Segmented: { borderRadius: 8 },
          Tooltip: { borderRadius: 8 },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
