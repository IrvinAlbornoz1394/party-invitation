'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import { RsvpDemoGateway } from '@/components/invitation/demo/RsvpDemoGateway';
import { InvitationChrome } from '@/components/invitation/InvitationChrome';
import type { DemoTemplate } from '@/components/invitation/demo/templates';
import { TemplateBlock } from '@/components/invitation/TemplateBlock';
import { ThemeScope } from '@/components/invitation/theme/ThemeScope';
import { parseInvitationTheme } from '@/domain/invitation/theme';

/**
 * El escaparate: una invitación completa que se puede desarmar y volver a armar en vivo.
 *
 * Es la pantalla que alguien abre **antes de comprar**. Por eso no enseña capturas ni un vídeo:
 * enseña la invitación de verdad, con los mismos componentes del catálogo que tendrá su evento,
 * y deja cambiar la plantilla, el tema y la variante de cada bloque sin recargar nada.
 *
 * ## Por qué los mandos ya no están arriba
 *
 * Tenían una barra fija en la cabecera, y esa barra competía con lo único que se ha venido a
 * ver. Una invitación empieza por una portada a pantalla completa: cualquier cosa pegada encima
 * le roba el primer golpe de vista y, peor, la enmarca como «una demo» en lugar de dejar que se
 * vea como se verá de verdad.
 *
 * Ahora hay una sola pestaña en el canto derecho. Quien solo quiere mirar, mira; quien quiere
 * jugar, la abre. Y el panel es translúcido y no tapa la página entera **a propósito**: se puede
 * cambiar la galería y seguir viéndola cambiar detrás, que es justo lo que alguien intenta hacer.
 *
 * ## Sin base de datos
 *
 * El contenido es local (`demo/templates.ts`). Lo único que viene del servidor es el catálogo
 * —qué variantes y qué temas existen— y llega ya resuelto como propiedades. Un visitante no
 * dispara ni una consulta: la página de venta responde al instante y sigue en pie aunque la
 * base de datos no.
 */

export interface StudioVariant {
  readonly registryId: string;
  readonly name: string;
}

export interface StudioBlock {
  readonly key: string;
  readonly name: string;
  readonly variants: readonly StudioVariant[];
  /**
   * Si el selector ofrece además **apagar** el bloque.
   *
   * Solo la bienvenida, por ahora: «con puerta» contra «sin puerta» es la diferencia que separa
   * a Premium de Esencial, y es la única que el visitante está decidiendo de verdad. Enseñar
   * «Sin galería» en todos los bloques llenaría el panel de opciones que nadie va a usar.
   */
  readonly removable?: boolean;
}

export interface StudioTheme {
  readonly key: string;
  readonly name: string;
  readonly tokens: Record<string, unknown>;
}

export interface StudioTemplateOption {
  readonly key: string;
  readonly name: string;
  readonly eventTypeKey: string;
  readonly eventTypeName: string;
}

export interface StudioEventType {
  readonly key: string;
  readonly name: string;
  /**
   * A qué demo se salta al elegir este tipo.
   *
   * Lo resuelve el servidor con `findSiblingTemplate` —la misma estructura contada para el otro
   * tipo— y llega ya calculado. Así el gestor no necesita importar el catálogo entero de demos, que
   * arrastraría al navegador el contenido de las seis para usar una.
   */
  readonly templateKey: string;
}

export function TemplateStudio({
  template,
  templates,
  eventTypes,
  blocks,
  themes,
}: {
  readonly template: DemoTemplate;
  readonly templates: readonly StudioTemplateOption[];
  /** Los tipos de evento que el escaparate enseña. El primer mando del panel. */
  readonly eventTypes: readonly StudioEventType[];
  readonly blocks: readonly StudioBlock[];
  readonly themes: readonly StudioTheme[];
}) {
  const router = useRouter();
  const reduced = useReducedMotion();

  const [open, setOpen] = useState(false);
  const [themeKey, setThemeKey] = useState(template.themeKey);

  /*
   * La elección de variantes arranca en la de la plantilla. Vive aquí y no en la URL a
   * propósito: lo que se comparte de una demo es «mira esta plantilla», no «mira esta plantilla
   * con la galería en mosaico y el pie en cinta».
   */
  const [choices, setChoices] = useState<Readonly<Record<string, string>>>(() =>
    Object.fromEntries(template.blocks.map((block) => [block.blockKey, block.defaultRegistryId])),
  );

  const launcherRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  /**
   * Cambiar algo cierra el panel.
   *
   * El panel ocupa un tercio de la pantalla en un escritorio y casi toda en un teléfono, así que
   * quien cambiaba el tema **no veía lo que acababa de cambiar**: tenía que cerrarlo a mano cada
   * vez, y con cuatro mandos eso son cuatro cierres para comparar dos cosas.
   *
   * Se cierra desde aquí y no desde cada mando para que ninguno se quede sin hacerlo el día que se
   * añada el quinto. El foco vuelve a la pestaña que lo abrió, que es donde estaría la mano.
   */
  const applyAndClose = (change: () => void) => {
    change();
    setOpen(false);
    launcherRef.current?.focus();
  };

  /* Las plantillas del tipo que se está viendo. Ofrecer una boda desde unos XV es enseñar el
     producto equivocado, y es exactamente lo que hacía el selector cuando las listaba todas. */
  const sameTypeTemplates = templates.filter(
    (option) => option.eventTypeKey === template.eventTypeKey,
  );

  /*
   * Escape cierra, y al cerrar el foco vuelve a la pestaña que lo abrió. Sin eso, quien navega
   * con teclado se queda con el foco en un panel que ya no está y tiene que recorrer la
   * invitación entera para volver a encontrarlo.
   */
  useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();

    const onKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  /* Los tokens se interpretan una sola vez por tema: cambiar de bloque no debe revalidar con Zod
     la paleta de todos los temas de la plataforma. */
  const parsedThemes = useMemo(
    () => new Map(themes.map((theme) => [theme.key, parseInvitationTheme(theme.tokens)])),
    [themes],
  );

  const theme = parsedThemes.get(themeKey) ?? parseInvitationTheme({});

  return (
    <div className="relative min-h-svh">
      {/*
        La invitación, sola y a pantalla completa. Es lo primero del DOM porque es lo primero que
        importa: un lector de pantalla llega a la invitación antes que a los mandos de la demo.
      */}
      <RsvpDemoGateway>
        <ThemeScope theme={theme}>
          {template.blocks.map((block) => (
            <TemplateBlock key={block.blockKey} block={block} registryId={choices[block.blockKey]} />
          ))}

          {/*
            Los mandos flotantes, los mismos que monta `InvitationRenderer` en una invitación de
            verdad. El escaparate no los tenía, y por eso las demos eran las únicas invitaciones
            **mudas** del producto: la música es de Plus en adelante y es de las cosas que más se
            notan al abrir una invitación, así que no enseñarla en la página donde alguien decide
            si paga era esconder justo lo que se vende.

            Van **dentro** del `ThemeScope`: el mando se pinta con el papel y la tinta del tema
            (`bg-inv-surface`, `text-inv-ink`), así que fuera del ámbito saldría sin color. Y `key`
            en el tema no hace falta: la pista no cambia al cambiar de tema, y remontar el audio
            reiniciaría la canción cada vez que alguien prueba una paleta.

            No se remonta al cambiar de variante por la misma razón. Sí al cambiar de plantilla —el
            `key` está arriba, en el propio estudio—, que es correcto: es otra demo y otra pista.
          */}
          <InvitationChrome musicUrl={template.music.url} musicTitle={template.music.title} />
        </ThemeScope>
      </RsvpDemoGateway>

      {/*
        La pestaña del canto. Se esconde mientras el panel está abierto para no quedar debajo de
        él, y vuelve al cerrarlo.
      */}
      <AnimatePresence>
        {!open && (
          <motion.button
            ref={launcherRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Personalizar esta demostración"
            className="fixed top-1/2 right-0 z-40 flex -translate-y-1/2 flex-col items-center gap-3 rounded-l-2xl border border-r-0 border-white/15 bg-neutral-900/80 px-3 py-5 text-white shadow-xl backdrop-blur-md transition-colors hover:bg-neutral-900 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            initial={reduced ? false : { x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduced ? undefined : { x: 60, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <SlidersHorizontal size={17} strokeWidth={1.9} aria-hidden="true" />
            {/* Vertical: una pestaña en el canto no tiene ancho para texto horizontal, y el
                rótulo es lo que la distingue de un botón cualquiera. */}
            <span
              aria-hidden="true"
              className="text-[10.5px] tracking-[0.24em] uppercase [writing-mode:vertical-rl]"
            >
              Personalizar
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.aside
            /*
             * `dialog` sin `aria-modal`: no es una ventana que bloquea, es un panel de mandos. La
             * página de detrás sigue viva y desplazable a propósito — cambiar la galería y verla
             * cambiar sin cerrar nada es justamente lo que se viene a hacer aquí.
             */
            role="dialog"
            aria-label="Personalizar la demostración"
            className="fixed inset-y-0 right-0 z-50 flex w-[min(23rem,88vw)] flex-col border-l border-white/12 bg-neutral-900/80 text-white shadow-2xl backdrop-blur-2xl"
            initial={reduced ? false : { x: '100%' }}
            animate={{ x: 0 }}
            exit={reduced ? undefined : { x: '100%' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <p className="m-0 text-[10.5px] tracking-[0.26em] text-white/45 uppercase">
                  Demostración
                </p>
                <p className="mt-1.5 mb-0 text-[15px] font-medium">
                  {template.eventTypeName} · {template.name}
                </p>
              </div>

              <button
                ref={closeRef}
                type="button"
                onClick={() => {
                  setOpen(false);
                  launcherRef.current?.focus();
                }}
                aria-label="Cerrar el panel"
                className="-mt-1 grid size-9 shrink-0 place-items-center rounded-full transition-colors hover:bg-white/12 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              >
                <X size={19} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/*
                El tipo de evento va primero porque es la primera decisión que toma quien mira:
                nadie compara plantillas de boda si viene a organizar unos XV. Al cambiarlo se
                salta a la misma estructura contada para el otro tipo — ver `findSiblingTemplate`.
              */}
              <StudioGroup label="Tipo de evento">
                <StudioSelect
                  value={template.eventTypeKey}
                  onChange={(value) => {
                    const target = eventTypes.find((option) => option.key === value);

                    if (target) applyAndClose(() => router.push(`/plantillas/${target.templateKey}`));
                  }}
                  options={eventTypes.map((option) => ({
                    value: option.key,
                    label: option.name,
                  }))}
                />
              </StudioGroup>

              <StudioGroup label="Plantilla">
                <StudioSelect
                  value={template.key}
                  onChange={(value) => applyAndClose(() => router.push(`/plantillas/${value}`))}
                  options={sameTypeTemplates.map((option) => ({
                    value: option.key,
                    label: option.name,
                  }))}
                />
              </StudioGroup>

              <StudioGroup label="Tema">
                <StudioSelect
                  value={themeKey}
                  onChange={(value) => applyAndClose(() => setThemeKey(value))}
                  options={themes.map((option) => ({ value: option.key, label: option.name }))}
                />
              </StudioGroup>

              <p className="mt-8 mb-4 border-t border-white/10 pt-6 text-[10.5px] tracking-[0.26em] text-white/45 uppercase">
                Componentes
              </p>

              <div className="flex flex-col gap-4">
                {blocks.map((block) => (
                  <StudioGroup key={block.key} label={block.name} compact>
                    <StudioSelect
                      value={choices[block.key] ?? ''}
                      onChange={(value) =>
                        applyAndClose(() =>
                          setChoices((current) => ({ ...current, [block.key]: value })),
                        )
                      }
                      options={[
                        /*
                         * La cadena vacía es «ninguna»: `TemplateBlock` no encuentra nada con
                         * ella en el registro y no pinta el bloque. No hace falta un valor
                         * especial ni una rama — es el mismo camino que sigue una variante que
                         * todavía no tiene componente.
                         */
                        ...(block.removable
                          ? [{ value: '', label: `Sin ${block.name.toLowerCase()}` }]
                          : []),
                        ...block.variants.map((variant) => ({
                          value: variant.registryId,
                          label: variant.name,
                        })),
                      ]}
                    />
                  </StudioGroup>
                ))}
              </div>
            </div>

            {/*
              La salida, y la entrada.
              
              Sin barra superior, la vuelta a la portada es el único camino de salida: un escaparate
              del que no se puede salir es un callejón.
              
              Y encima de ella, lo que faltaba: pedir información **desde aquí**. Este es el momento
              de máximo interés —acaba de gustarle una plantilla— y hasta ahora el único enlace era
              para irse. La plantilla viaja en la URL, así que la solicitud llega diciendo cuál le
              gustó en vez de obligar a preguntárselo después.
            */}
            <footer className="grid gap-4 border-t border-white/10 px-6 py-5">
              <Link
                href={`/cotizar?plantilla=${template.key}`}
                className="inline-flex min-h-11 items-center justify-center bg-white px-6 text-[12px] font-semibold tracking-[0.14em] text-ink uppercase transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              >
                Quiero esta plantilla
              </Link>

              <Link
                href="/"
                className="text-[12.5px] tracking-[0.14em] text-white/70 uppercase transition-colors hover:text-white"
              >
                ← Ver todas las plantillas
              </Link>
            </footer>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

function StudioGroup({
  label,
  children,
  compact = false,
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly compact?: boolean;
}) {
  return (
    <label className={compact ? 'flex flex-col gap-1.5' : 'mb-6 flex flex-col gap-2'}>
      <span
        className={
          compact
            ? 'text-[11px] text-white/55'
            : 'text-[10.5px] tracking-[0.26em] text-white/45 uppercase'
        }
      >
        {label}
      </span>
      {children}
    </label>
  );
}

/**
 * Un `<select>` nativo, a propósito.
 *
 * En un móvil abre el selector del sistema —una rueda a la que se llega con el pulgar— y
 * funciona con teclado y con lector de pantalla sin escribir una línea. Cualquier desplegable
 * hecho a mano tendría que reimplementar las tres cosas para verse un poco mejor, y este panel
 * no es lo que se ha venido a ver.
 */
function StudioSelect({
  value,
  onChange,
  options,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly options: readonly { readonly value: string; readonly label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-[13.5px] text-white transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
    >
      {options.map((option) => (
        // Los `option` los pinta el sistema operativo y no heredan el fondo del panel: sin este
        // color, en Windows salen texto blanco sobre blanco.
        <option key={option.value} value={option.value} className="bg-neutral-900 text-white">
          {option.label}
        </option>
      ))}
    </select>
  );
}
