import type { Metadata } from 'next';
import { previewableVariants } from '@/components/dashboard/admin/previewable-variants';
import { ThemesScreen } from '@/components/dashboard/admin/ThemesScreen';
import { listComponentRegistry, listThemes } from '@/infrastructure/container';
import { requirePlatformCredentials } from '@/lib/auth/current-session';

export const metadata: Metadata = {
  title: 'Temas · Plataforma',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Los temas de la biblioteca, con su paleta y un bloque real para verlos puestos.
 *
 * El registro de componentes se pide aquí —en una pantalla que va de temas— porque un tema no
 * se juzga por sus muestras de color: se juzga viendo si el texto se lee sobre la fotografía.
 * Para eso hace falta un bloque que enseñar, y cuáles se pueden enseñar lo dice el cruce entre
 * el catálogo y lo que el código tiene registrado.
 */
export default async function AdminThemesPage() {
  const credentials = await requirePlatformCredentials();

  const [themes, blocks] = await Promise.all([
    listThemes.execute(credentials),
    listComponentRegistry.execute(credentials),
  ]);

  return <ThemesScreen themes={themes} variants={previewableVariants(blocks)} />;
}
