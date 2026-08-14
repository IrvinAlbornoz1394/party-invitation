'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Button, Modal, Segmented, Select } from 'antd';
import { Eye, Monitor, Smartphone } from 'lucide-react';
import { BlockDemo } from '@/components/invitation/demo/BlockDemo';
import { sampleOptions } from '@/components/invitation/demo/samples';
import { resolveComponent } from '@/components/invitation/registry/component-registry';
import { ThemeScope } from '@/components/invitation/theme/ThemeScope';
import { parseInvitationTheme } from '@/domain/invitation/theme';

/**
 * Ver un componente de verdad, dentro del panel, antes de ponérselo a nadie.
 *
 * Hasta ahora el catálogo enseñaba `hero.split` como una cadena de texto y una descripción, y
 * con eso no se elige nada: para saber cómo se ve una variante había que crear un evento,
 * asignársela y abrir la invitación. Esto es la respuesta a esa pregunta —«¿cómo se ve?»—
 * hecha en el sitio donde se hace.
 *
 * ## Lo que se previsualiza es el componente real
 *
 * No hay maqueta, ni captura, ni una versión «de panel» del bloque. Se resuelve el mismo
 * `registry_id` contra el mismo Component Registry que usará la invitación, con los mismos
 * temas de la base de datos. Una previsualización que no sea el componente real miente en
 * cuanto alguien toca el componente y se olvida de la maqueta, y entonces deja de servir para
 * decidir — que es lo único para lo que existe.
 *
 * ## Las cuatro permutaciones
 *
 * Variante × tema × contenido × pantalla. Son los cuatro ejes en los que una portada se rompe:
 * el diseño, los colores, la longitud de los textos y el ancho del dispositivo. Poder cruzarlos
 * aquí es lo que convierte esta ventana en una herramienta de trabajo y no en un adorno: la
 * pregunta real casi nunca es «¿cómo se ve `hero.split`?» sino «¿aguanta `hero.split` un
 * nombre de cuatro palabras en el tema oscuro y en un móvil?».
 */

/** Un tema del catálogo, tal como llega de la base de datos. */
export interface PreviewTheme {
  readonly key: string;
  readonly name: string;
  readonly tokens: Record<string, unknown>;
}

/** Una variante del registro que se puede previsualizar. */
export interface PreviewVariant {
  readonly registryId: string;
  readonly name: string;
  /** A qué bloque pertenece, para agrupar el selector. */
  readonly blockKey: string;
  readonly blockName: string;
}

export function BlockPreviewButton({
  variants,
  themes,
  initialRegistryId,
  initialThemeKey,
  label = 'Ver ejemplo',
  block = false,
}: {
  readonly variants: readonly PreviewVariant[];
  readonly themes: readonly PreviewTheme[];
  readonly initialRegistryId?: string;
  readonly initialThemeKey?: string;
  readonly label?: string;
  /** Botón a todo el ancho, para la tarjeta de un tema. */
  readonly block?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const disabled = variants.length === 0 || themes.length === 0;

  return (
    <>
      <Button
        size="small"
        block={block}
        disabled={disabled}
        icon={<Eye size={15} strokeWidth={1.9} aria-hidden="true" />}
        onClick={(event) => {
          // La tarjeta o la fila que lo contiene puede ser pulsable; previsualizar no navega.
          event.stopPropagation();
          setOpen(true);
        }}
      >
        {label}
      </Button>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        centered
        width={1120}
        title="Vista previa del componente"
        /*
         * Al cerrar se desmonta el contenido, y eso importa más de lo que parece: la portada
         * lleva una cuenta regresiva con un intervalo de un segundo. Sin desmontar, cada
         * ventana abierta durante la sesión seguiría latiendo en segundo plano para siempre.
         */
        destroyOnHidden
      >
        <PreviewStage
          variants={variants}
          themes={themes}
          initialRegistryId={initialRegistryId}
          initialThemeKey={initialThemeKey}
        />
      </Modal>
    </>
  );
}

const DEVICES = {
  movil: { label: 'Móvil', width: 390, icon: Smartphone },
  escritorio: { label: 'Escritorio', width: null, icon: Monitor },
} as const;

type DeviceKey = keyof typeof DEVICES;

/**
 * El contenido de la ventana: los mandos y el escenario.
 *
 * Va en un componente aparte del botón porque el `destroyOnHidden` del modal lo desmonta al
 * cerrar, y con él se reinicia la selección. Es lo que se quiere: quien vuelve a abrir la
 * previsualización de otra variante espera encontrarla en esa variante, no en la que dejó
 * elegida hace media hora en otra fila de la tabla.
 */
function PreviewStage({
  variants,
  themes,
  initialRegistryId,
  initialThemeKey,
}: {
  readonly variants: readonly PreviewVariant[];
  readonly themes: readonly PreviewTheme[];
  readonly initialRegistryId?: string;
  readonly initialThemeKey?: string;
}) {
  const [registryId, setRegistryId] = useState(
    initialRegistryId ?? variants[0]?.registryId ?? '',
  );
  const [themeKey, setThemeKey] = useState(initialThemeKey ?? themes[0]?.key ?? '');
  /*
   * La clave del ejemplo se guarda suelta y no el ejemplo entero: los bloques comparten
   * claves —`presentacion`, `xv-anios`, `boda`—, así que al saltar de una portada a una
   * historia se sigue viendo el mismo evento imaginario en lugar de volver al primero.
   */
  const [sampleKey, setSampleKey] = useState('presentacion');
  const [device, setDevice] = useState<DeviceKey>('escritorio');

  /*
   * Los tokens se interpretan una sola vez por tema y no en cada render. No es micro-optimizar:
   * cambiar de dispositivo o de contenido vuelve a renderizar, y sin memoria cada uno de esos
   * cambios revalidaría con Zod los tokens de todos los temas de la plataforma.
   */
  const parsedThemes = useMemo(
    () => new Map(themes.map((theme) => [theme.key, parseInvitationTheme(theme.tokens)])),
    [themes],
  );

  const theme = parsedThemes.get(themeKey) ?? parseInvitationTheme({});
  /*
   * La entrada del registro, no el componente: lleva consigo a qué bloque sirve, y es esa
   * pareja la que permite que esta ventana ofrezca los ejemplos correctos sin saber qué
   * bloque está enseñando.
   */
  const entry = resolveComponent(registryId);
  const samples = entry ? sampleOptions(entry.blockKey) : [];
  const deviceWidth = DEVICES[device].width;

  /* Agrupadas por bloque, en el orden en que llegan —que es el de lectura de la invitación—. */
  const variantGroups = variants.reduce<{ label: string; options: PreviewVariant[] }[]>(
    (groups, variant) => {
      const current = groups.at(-1);

      if (current?.label === variant.blockName) current.options.push(variant);
      else groups.push({ label: variant.blockName, options: [variant] });

      return groups;
    },
    [],
  );

  return (
    <div className="dash-preview">
      <div className="dash-preview__controls">
        <PreviewControl label="Variante">
          {/*
            Un desplegable agrupado y no una tira de botones: son siete variantes de dos
            bloques y serán muchas más, y una tira que se sale del ancho de la ventana deja de
            servir para elegir. Agrupado por bloque se sigue leyendo con veinte.
          */}
          <Select
            size="small"
            value={registryId}
            onChange={setRegistryId}
            style={{ minWidth: 260 }}
            options={variantGroups.map((group) => ({
              label: group.label,
              options: group.options.map((variant) => ({
                // El identificador delante y el nombre detrás: lo que se configura en el
                // evento es el identificador, y en esta ventana se decide justo eso.
                label: `${variant.registryId} · ${variant.name}`,
                value: variant.registryId,
              })),
            }))}
          />
        </PreviewControl>

        <PreviewControl label="Tema">
          <Segmented
            size="small"
            value={themeKey}
            onChange={setThemeKey}
            options={themes.map((item) => ({ label: item.name, value: item.key }))}
          />
        </PreviewControl>

        <PreviewControl label="Contenido">
          <Segmented
            size="small"
            value={sampleKey}
            onChange={setSampleKey}
            options={samples.map((item) => ({ label: item.name, value: item.key }))}
          />
        </PreviewControl>

        <PreviewControl label="Pantalla">
          <Segmented
            size="small"
            value={device}
            onChange={(value) => setDevice(value as DeviceKey)}
            options={Object.entries(DEVICES).map(([key, item]) => ({
              value: key,
              label: item.label,
              icon: <item.icon size={14} strokeWidth={1.9} aria-hidden="true" />,
            }))}
          />
        </PreviewControl>
      </div>

      <div className="dash-preview__stage">
        <div
          className="dash-preview__device"
          style={deviceWidth ? { maxWidth: deviceWidth } : undefined}
        >
          {entry ? (
            /*
             * `viewport` es lo que hace que un bloque pensado para ocupar la pantalla entera
             * quepa aquí sin que la variante sepa que está en una previsualización. Ver
             * `ThemeScope`.
             *
             * El `min()` es por los portátiles: 560px fijos más los mandos y el marco de la
             * ventana no caben en una pantalla de 768px de alto, y la portada quedaría
             * cortada justo por donde va la cuenta regresiva.
             */
            <ThemeScope theme={theme} viewport="min(560px, 58vh)">
              <BlockDemo entry={entry} sampleKey={sampleKey} />
            </ThemeScope>
          ) : (
            <p className="dash-preview__missing">
              La variante <code>{registryId}</code> está dada de alta en el catálogo pero
              todavía no tiene componente registrado, así que no se puede previsualizar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewControl({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  /*
   * Un `<div>` con rótulo y no un `<label>`: `Segmented` es un grupo de botones de opción, y
   * un `<label>` solo puede etiquetar a un control. Envolviéndolo, el clic en el rótulo
   * activaría el primer botón del grupo — un cambio de estado que nadie pidió.
   */
  return (
    <div className="dash-preview__control">
      <span className="dash-preview__control-label">{label}</span>
      {children}
    </div>
  );
}
