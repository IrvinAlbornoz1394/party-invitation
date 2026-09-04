'use client';

import { useState, type ReactNode } from 'react';
import { Button, Modal, Segmented, Select } from 'antd';
import { Eye, Monitor, Smartphone } from 'lucide-react';
import { sampleOptions } from '@/components/invitation/demo/samples';
import { resolveComponent } from '@/components/invitation/registry/component-registry';

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
   * La clave del ejemplo se guarda suelta y no el ejemplo entero: los bloques comparten claves
   * —hoy `boda` y `quince`—, así que al saltar de una portada a una historia se sigue viendo el
   * mismo evento imaginario en lugar de volver al primero.
   *
   * Empieza sin elegir y se resuelve abajo contra los ejemplos del bloque: una clave escrita a
   * mano aquí se queda vieja el día que se renombra un ejemplo, y entonces el conmutador aparece
   * sin nada marcado. Pasó: decía `presentacion`, que ya no existe.
   */
  const [sampleKey, setSampleKey] = useState<string | null>(null);
  const [device, setDevice] = useState<DeviceKey>('escritorio');

  /*
   * La entrada del registro, no el componente: lleva consigo a qué bloque sirve, y es esa
   * pareja la que permite que esta ventana ofrezca los ejemplos correctos sin saber qué
   * bloque está enseñando.
   */
  const entry = resolveComponent(registryId);
  const samples = entry ? sampleOptions(entry.blockKey) : [];
  const activeSample = samples.find((sample) => sample.key === sampleKey) ?? samples[0];
  const deviceWidth = DEVICES[device].width;

  /* Lo mismo que en `PhoneStage`, y por lo mismo: dentro de un `<iframe>` el marco **es** el
     viewport, así que el conmutador de móvil enseña de verdad la maqueta de móvil. Montado aquí
     dentro, «móvil» solo estrechaba la caja y las medias queries seguían diciendo «escritorio». */
  const source = `/admin/componentes/vista?${new URLSearchParams({
    variante: registryId,
    tema: themeKey,
    ...(activeSample ? { contenido: activeSample.key } : null),
  }).toString()}`;

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

        {activeSample && (
          <PreviewControl label="Contenido">
            <Segmented
              size="small"
              value={activeSample.key}
              onChange={(value) => setSampleKey(String(value))}
              options={samples.map((item) => ({ label: item.name, value: item.key }))}
            />
          </PreviewControl>
        )}

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
          {/*
            El marco explica solo el caso de la variante sin componente —lo hace la propia ruta—,
            así que aquí no hay que decidir nada: se carga siempre y él enseña lo que toque.
          */}
          <iframe className="dash-preview__frame" src={source} title="Vista previa del componente" />
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

/**
 * El teléfono: un bloque real, servido en su propia página dentro de un `<iframe>`.
 *
 * Es la otra mitad de la pantalla de componentes —la tabla elige, esto enseña— y por eso no es
 * una ventana como {@link BlockPreviewButton}: se queda puesto, y cambiar de fila cambia lo que
 * hay dentro sin abrir ni cerrar nada. Un modal por variante obligaba a abrir, mirar, cerrar y
 * volver a abrir para comparar dos, que es exactamente lo que se hace todo el rato aquí.
 *
 * ## Por qué un `<iframe>` y no el componente montado aquí mismo
 *
 * Porque un marco estrecho da el **ancho**, y solo el ancho. Las medias queries de Tailwind se
 * resuelven contra el viewport del navegador, así que un bloque metido en una caja de 390px
 * dentro de un escritorio de 1440 se sigue maquetando como escritorio: dos columnas estrujadas,
 * rejillas de galería con fotos diminutas y rótulos partidos donde no toca. Enseñaba una
 * composición que no existe en ningún dispositivo.
 *
 * Dentro del marco, el `<iframe>` **es** el viewport. A 390 píxeles las medias queries dicen 390,
 * sin tocar un solo componente. La ruta que se carga es `/admin/componentes/vista`, y ahí está
 * explicado el resto.
 *
 * ## Por qué solo móvil
 *
 * Porque es donde se abren las invitaciones. Lo que se quiere aquí es un ancho fijo, siempre el
 * mismo, para poder comparar doce variantes sin que cambie ninguna otra variable.
 *
 * ## El coste: recarga a cada cambio
 *
 * Cambiar de variante, de tema o de ejemplo cambia la dirección del marco, y eso es una carga de
 * página. En local es un parpadeo; a cambio, lo que se ve es exactamente lo que verá un invitado,
 * con sus fuentes, su CSS y su viewport. La alternativa —mantener el árbol de React dentro del
 * marco y hablarle por `postMessage`— es más rápida y bastante más frágil, y esta pantalla no es
 * la que hay que optimizar.
 */
export function PhoneStage({
  registryId,
  themes,
  themeKey,
  onThemeChange,
}: {
  readonly registryId: string | null;
  readonly themes: readonly PreviewTheme[];
  readonly themeKey: string;
  readonly onThemeChange: (key: string) => void;
}) {
  const [sampleKey, setSampleKey] = useState<string | null>(null);

  const entry = registryId ? resolveComponent(registryId) : null;
  const samples = entry ? sampleOptions(entry.blockKey) : [];

  /*
   * El ejemplo elegido, o el primero del bloque.
   *
   * No se guarda al cambiar de bloque, y es a propósito: los ejemplos son por bloque —«boda» y
   * «XV años» en casi todos— y una clave que no existe en el bloque nuevo dejaría el conmutador
   * sin nada marcado. Resuelto aquí, la elección se conserva mientras la clave siga existiendo y
   * se cae al primero cuando no.
   */
  const activeSample = samples.find((sample) => sample.key === sampleKey) ?? samples[0];

  const source = registryId
    ? `/admin/componentes/vista?${new URLSearchParams({
        variante: registryId,
        tema: themeKey,
        ...(activeSample ? { contenido: activeSample.key } : null),
      }).toString()}`
    : null;

  return (
    <div className="dash-phone-stage">
      <div className="dash-phone-stage__controls">
        <PreviewControl label="Tema">
          <Select
            size="small"
            value={themeKey}
            onChange={onThemeChange}
            style={{ width: '100%' }}
            options={themes.map((item) => ({ label: item.name, value: item.key }))}
          />
        </PreviewControl>
        {samples.length > 1 && activeSample && (
          <PreviewControl label="Contenido">
            <Segmented
              size="small"
              block
              value={activeSample.key}
              onChange={(value) => setSampleKey(String(value))}
              options={samples.map((item) => ({ label: item.name, value: item.key }))}
            />
          </PreviewControl>
        )}
      </div>

      <div className="dash-phone">
        {source ? (
          <iframe
            className="dash-phone__screen"
            /*
             * `src` y no `key`: cambiando la dirección, el navegador navega dentro del mismo
             * marco. Con una `key` nueva, React desmonta el `<iframe>` y monta otro, y entre las
             * dos cosas se ve el fondo blanco del documento vacío — un parpadeo por cada clic en
             * la tabla.
             */
            src={source}
            title="Vista previa del componente en un teléfono"
          />
        ) : (
          <p className="dash-phone__empty">Elige una variante en la tabla para verla aquí.</p>
        )}
      </div>
    </div>
  );
}
