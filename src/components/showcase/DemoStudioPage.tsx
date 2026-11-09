import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { notFound } from 'next/navigation';
import {
  DEMO_TEMPLATES,
  demoEventTypes,
  findDemoTemplate,
  findSiblingTemplate,
} from '@/components/invitation/demo/templates';
import { browseShowcase } from '@/infrastructure/container';
import { TemplateStudio } from './TemplateStudio';

/**
 * Una demo armada: la plantilla tal cual está configurada y el estudio que la pinta.
 *
 * La comparten `/plantillas/[template]` —la demo con sus mandos— y `/plantillas/[template]/telefono`
 * —la misma invitación sin mandos ni música (`bare`), para meterla en el teléfono de la página de
 * inicio—. Son dos rutas y no un parámetro de búsqueda para que las dos sigan siendo estáticas.
 *
 * ## Por qué ya no se cambian secciones ni paleta aquí
 *
 * La demo enseñaba un panel con el tipo de evento, la plantilla, la paleta y el diseño de cada
 * sección. Eran demasiadas decisiones para alguien que todavía no ha comprado: acababa mirando una
 * combinación que no es ninguna plantilla y sin saber qué estaba eligiendo. Ahora la demo enseña
 * cada plantilla **como se entrega**, y lo único que se cambia es el tipo de evento y la plantilla.
 * Del servidor solo hace falta la paleta de esta plantilla, no el catálogo entero de variantes.
 */
export async function DemoStudioPage({ template, bare = false }: { readonly template: string; readonly bare?: boolean }) {
  const found = findDemoTemplate(template);

  if (!found) notFound();

  const showcase = await browseShowcase.execute();
  const themeTokens = showcase.themes.find((theme) => theme.key === found.themeKey)?.tokens ?? {};

  /*
   * La miniatura de cada plantilla en el selector: la captura de su portada en un teléfono
   * (`scripts/capture-templates.mjs`), que dice cómo se ve la invitación. Si una plantilla nueva
   * aún no tiene captura, sale con su foto de portada.
   */
  const preview = (key: string, coverUrl: string) =>
    existsSync(join(process.cwd(), 'public', 'plantillas', 'capturas', `${key}.webp`))
      ? { url: `/plantillas/capturas/${key}.webp`, isCapture: true }
      : { url: coverUrl, isCapture: false };

  return (
    /*
     * `key` fuerza a remontar el estudio al cambiar de plantilla: es otra invitación, otra pista
     * de música y otro estado de «con tus datos».
     */
    <TemplateStudio
      key={found.key}
      bare={bare}
      template={found}
      themeTokens={themeTokens}
      templates={
        bare
          ? []
          : DEMO_TEMPLATES.map((option) => ({
              key: option.key,
              name: option.name,
              tagline: option.tagline,
              eventTypeKey: option.eventTypeKey,
              eventTypeName: option.eventTypeName,
              preview: preview(option.key, option.cover.url),
            }))
      }
      /*
       * A qué demo lleva cada tipo de evento, resuelto aquí. Es la misma estructura contada para
       * el otro tipo cuando existe, y la primera de ese tipo cuando no.
       */
      eventTypes={demoEventTypes().map((eventType) => ({
        ...eventType,
        templateKey: findSiblingTemplate(found, eventType.key)?.key ?? found.key,
      }))}
    />
  );
}
