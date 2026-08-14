import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';

export const metadata: Metadata = {
  // La pantalla de acceso no debe aparecer en buscadores, igual que los paneles.
  robots: { index: false, follow: false, nocache: true },
};

/**
 * AntdRegistry extrae en el servidor los estilos que antd genera en runtime.
 * Sin él la pantalla entra sin estilos y se reacomoda a los pocos milisegundos.
 */
export default function AccesoLayout({ children }: { children: ReactNode }) {
  return <AntdRegistry>{children}</AntdRegistry>;
}
