'use client';

import { useEffect, useMemo, useState } from 'react';
import { RsvpDemoGateway } from '@/components/invitation/demo/RsvpDemoGateway';
import { InvitationChrome } from '@/components/invitation/InvitationChrome';
import type { DemoTemplate } from '@/components/invitation/demo/templates';
import { TemplateBlock } from '@/components/invitation/TemplateBlock';
import { ThemeScope } from '@/components/invitation/theme/ThemeScope';
import { findPalette, resolveInvitationTheme } from '@/domain/invitation/palettes';
import { parseInvitationTheme } from '@/domain/invitation/theme';
import { DemoDock } from './DemoDock';
import {
  PERSONA_STORAGE_KEY,
  personaFits,
  personalizeTemplate,
  readPersona,
  type DemoPersona,
} from './personalize';

/**
 * El escaparate: una plantilla completa, tal cual se entrega.
 *
 * Es la pantalla que alguien abre **antes de comprar**. No enseña capturas ni un vídeo: enseña la
 * invitación de verdad, con los mismos componentes que tendrá su evento.
 *
 * ## Qué se puede cambiar, y qué ya no
 *
 * Antes había un panel lateral para cambiar la paleta y el diseño de cada sección. Con seis o siete
 * mandos, quien miraba acababa delante de una combinación que no era ninguna plantilla y sin saber
 * qué estaba comprando. Ahora solo se cambian las dos cosas que de verdad se deciden aquí: el tipo
 * de evento y la plantilla. Los mandos viven en una barra abajo (`DemoDock`) que no tapa la
 * portada, y las plantillas se eligen viéndolas, con su captura, no por su nombre.
 *
 * ## Sin base de datos
 *
 * El contenido es local (`demo/templates.ts`). Lo único que viene del servidor es la paleta de la
 * plantilla, ya resuelta como propiedad. Un visitante no dispara ni una consulta.
 */

export interface StudioTemplateOption {
  readonly key: string;
  readonly name: string;
  readonly tagline: string;
  readonly eventTypeKey: string;
  readonly eventTypeName: string;
  /** La miniatura: la captura de la portada en un teléfono o, si aún no hay, la foto de portada. */
  readonly preview: { readonly url: string; readonly isCapture: boolean };
}

export interface StudioEventType {
  readonly key: string;
  readonly name: string;
  /**
   * A qué demo se salta al elegir este tipo desde la barra.
   *
   * Lo resuelve el servidor con `findSiblingTemplate` —la misma estructura contada para el otro
   * tipo— y llega ya calculado, para no arrastrar al navegador el catálogo entero de demos.
   */
  readonly templateKey: string;
}

/**
 * La última paleta elegida, en el módulo y no en el estado.
 *
 * El estudio se remonta al cambiar de plantilla (`key` en `DemoStudioPage`), así que el estado se
 * pierde; el módulo, en cambio, sigue vivo mientras se navega dentro del sitio. Es lo justo: se
 * conserva al pasar de una plantilla a otra y se olvida al recargar. No va a `sessionStorage`
 * porque eso solo se puede leer después de montar, y cada cambio de plantilla saldría un instante
 * con los colores originales.
 */
let lastPaletteKey: string | null = null;

export function TemplateStudio({
  template,
  templates,
  eventTypes,
  themeTokens,
  bare = false,
}: {
  readonly template: DemoTemplate;
  readonly templates: readonly StudioTemplateOption[];
  readonly eventTypes: readonly StudioEventType[];
  /** Los tokens de la paleta de esta plantilla, tal como los guarda el catálogo. */
  readonly themeTokens: Record<string, unknown>;
  /** Sin mandos ni música: la invitación sola, para el teléfono de la página de inicio. */
  readonly bare?: boolean;
}) {
  /*
   * La paleta elegida, encima del tema de la plantilla (ver `domain/invitation/palettes.ts`).
   * Arranca en la que se eligió en la demo anterior: quien busca «la mía en salvia» compara
   * plantillas con esa paleta puesta, y perderla en cada flecha le obligaría a volver a elegirla.
   * Si no encaja con este tipo de evento, se vuelve a la original.
   */
  const [paletteKey, setPaletteKeyState] = useState<string | null>(() => {
    const kept = findPalette(lastPaletteKey);
    return kept && (kept.events as readonly string[]).includes(template.eventTypeKey) ? kept.key : null;
  });
  const setPaletteKey = (key: string | null) => {
    lastPaletteKey = key;
    setPaletteKeyState(key);
  };

  /* El mismo camino que la invitación real (`resolveInvitationTheme`): lo que se ve aquí con una
     paleta es exactamente lo que verá el invitado si el evento se guarda con ella. */
  const theme = useMemo(() => resolveInvitationTheme(themeTokens, paletteKey), [themeTokens, paletteKey]);
  const originalColors = useMemo(() => parseInvitationTheme(themeTokens).colors, [themeTokens]);

  /*
   * Los nombres y la fecha que la visitante escribió en la portada, para que la demo sea la suya
   * (ver `personalize.ts`). Se leen al montar —en el servidor no existen— y se escucha `storage`:
   * el teléfono de la portada mete esta demo en un iframe, y así cambia en vivo mientras ella
   * escribe en la página de fuera.
   */
  const [persona, setPersona] = useState<DemoPersona | null>(null);
  const [showSample, setShowSample] = useState(false);

  useEffect(() => {
    setPersona(readPersona());
    const onStorage = (storageEvent: StorageEvent) => {
      if (storageEvent.key === PERSONA_STORAGE_KEY) setPersona(readPersona());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const fits = persona !== null && personaFits(template, persona);
  const personalized = fits && !showSample;
  const shown = useMemo(
    () => (personalized && persona ? personalizeTemplate(template, persona) : template),
    [personalized, persona, template],
  );

  return (
    <div className="relative min-h-svh">
      {/*
        La invitación, sola y a pantalla completa. Es lo primero del DOM porque es lo primero que
        importa: un lector de pantalla llega a la invitación antes que a los mandos de la demo.
      */}
      <RsvpDemoGateway>
        <ThemeScope theme={theme}>
          {shown.blocks.map((block) => (
            <TemplateBlock key={block.blockKey} block={block} />
          ))}

          {/*
            La música y el volver arriba, los mismos que monta `InvitationRenderer` en una invitación
            de verdad. Van dentro del `ThemeScope` porque se pintan con los colores del tema.
          */}
          {!bare && <InvitationChrome musicUrl={template.music.url} musicTitle={template.music.title} />}
        </ThemeScope>
      </RsvpDemoGateway>

      {!bare && (
        <DemoDock
          template={template}
          templates={templates}
          eventTypes={eventTypes}
          palette={{ key: paletteKey, original: originalColors, set: setPaletteKey }}
          persona={
            fits && persona
              ? { names: persona.names, showingSample: showSample, toggle: () => setShowSample((current) => !current) }
              : null
          }
        />
      )}
    </div>
  );
}
