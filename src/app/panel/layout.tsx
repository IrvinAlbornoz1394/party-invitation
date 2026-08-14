import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';

export const metadata: Metadata = {
  title: 'Panel · Invitaciones digitales',
  // El panel administrativo nunca debe aparecer en buscadores.
  robots: { index: false, follow: false, nocache: true },
};

/**
 * AntdRegistry extrae en el servidor los estilos que antd genera en runtime.
 * Sin él el panel entra sin estilos y se reacomoda a los pocos milisegundos.
 */
export default function PanelLayout({ children }: { children: ReactNode }) {
  return <AntdRegistry>{children}</AntdRegistry>;
}
