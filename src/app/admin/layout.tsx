import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';

export const metadata: Metadata = {
  title: 'Plataforma · éclat',
  // El panel de plataforma nunca debe aparecer en buscadores.
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AntdRegistry>{children}</AntdRegistry>;
}
