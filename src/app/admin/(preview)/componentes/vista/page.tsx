import type { Metadata } from 'next';
import { BlockDemo } from '@/components/invitation/demo/BlockDemo';
import { sampleOptions } from '@/components/invitation/demo/samples';
import { resolveComponent } from '@/components/invitation/registry/component-registry';
import { ThemeScope } from '@/components/invitation/theme/ThemeScope';
import { parseInvitationTheme } from '@/domain/invitation/theme';
import { listThemes } from '@/infrastructure/container';
import { requirePlatformCredentials } from '@/lib/auth/current-session';

export const metadata: Metadata = {
  title: 'Vista previa del componente',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Un bloque suelto, servido como página propia para verlo dentro de un `<iframe>`.
 *
 * Es la gemela de `/panel/eventos/[id]/vista` y existe por la misma razón, que allí ya está
 * escrita: **una invitación no se puede previsualizar dentro del panel**. Y en el catálogo el
 * motivo pesa todavía más que en el editor.
 *
 * ## El marco de móvil mentía
 *
 * La pantalla de componentes enseña el bloque en un marco de 390 píxeles. Eso da el ancho, y solo
 * el ancho: las medias queries de Tailwind —`sm:`, `md:`, `lg:`— se resuelven contra el **viewport
 * del navegador**, no contra la caja que las contiene. En un escritorio de 1440 seguían diciendo
 * «escritorio», así que el bloque se maquetaba a dos columnas y se metía a la fuerza en 390: los
 * cronogramas alternados se estrujaban, las rejillas de galería salían con las fotos del tamaño de
 * un sello y los rótulos partían por donde no.
 *
 * O sea que el marco enseñaba una composición **que no existe en ningún dispositivo**: ni la de
 * escritorio, que necesita el ancho, ni la de móvil, que es la que se quería comprobar.
 *
 * Dentro de un `<iframe>` el problema desaparece de raíz, sin tocar un solo componente: el marco
 * **es** el viewport, así que a 390 píxeles las medias queries dicen 390. No hay contenedor que
 * consultar ni nada que reescribir con `@container` — que sería la otra salida y obligaría a
 * revisar los cien componentes de la biblioteca.
 *
 * De paso resuelve lo mismo que resolvió en el panel: la invitación se pinta con Tailwind sin
 * preflight y el panel con antd, y en documentos separados no hay pelea de especificidad.
 *
 * ## Qué llega por la URL
 *
 * Las tres cosas que se pueden elegir en la pantalla: la variante, el tema y el ejemplo de
 * contenido. Van en la dirección y no por `postMessage` porque así el marco es una página normal
 * —se puede abrir en una pestaña para mirarla a pantalla completa, y se puede pegar en un mensaje
 * para enseñarle a alguien una variante concreta—.
 *
 * ## Y qué pasa si vienen mal
 *
 * Nada que rompa. Una variante que no existe en el registro se explica con un texto, que es
 * información útil —está en el catálogo pero no tiene componente— y no un 404. Un tema o un
 * ejemplo desconocidos caen al primero de la lista. El único caso que corta es el de siempre:
 * quien no es de la plataforma no ve esto.
 */
export default async function ComponentPreviewPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const credentials = await requirePlatformCredentials();
  const params = await searchParams;

  const registryId = single(params.variante);
  const entry = registryId ? resolveComponent(registryId) : null;

  if (!entry) {
    return (
      <p className="mx-auto max-w-xs px-6 py-16 text-center font-sans text-[13px] leading-relaxed text-neutral-500">
        {registryId
          ? `La variante «${registryId}» está dada de alta en el catálogo pero todavía no tiene componente registrado, así que no se puede previsualizar.`
          : 'Elige una variante para verla aquí.'}
      </p>
    );
  }

  const themes = await listThemes.execute(credentials);
  const chosenTheme = themes.find((theme) => theme.key === single(params.tema)) ?? themes[0];
  const theme = parseInvitationTheme(chosenTheme?.tokens ?? {});

  const samples = sampleOptions(entry.blockKey);
  const chosenSample =
    samples.find((sample) => sample.key === single(params.contenido)) ?? samples[0];

  return (
    /*
     * El papel del tema en toda la altura del marco: un bloque corto —un pie, una confirmación—
     * dejaría el resto en el blanco del documento, y con un tema oscuro eso se ve como si el
     * componente estuviera roto por abajo.
     */
    <ThemeScope theme={theme} className="min-h-svh bg-inv-bg">
      {chosenSample ? <BlockDemo entry={entry} sampleKey={chosenSample.key} /> : null}
    </ThemeScope>
  );
}

/** El primer valor de un parámetro que puede venir repetido. */
function single(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;

  return value ?? null;
}
