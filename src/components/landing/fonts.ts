import { Stack_Sans_Headline, Stack_Sans_Text } from 'next/font/google';

/**
 * Las dos tipografías de la portada, y solo de la portada.
 *
 * Se declaran aquí y no en el layout raíz a propósito: `next/font` precarga lo que declara el
 * módulo que lo importa, y en el layout eso habría sido precargarlas también en el panel y en
 * cada invitación, que no las usan.
 *
 * Es una sola familia en dos cortes: Headline, ligera, para lo que se lee de lejos; Text para
 * lo que se lee de cerca. La interfaz del panel que se enseña en la página también va en Text,
 * para que los fragmentos y la página se lean como una sola cosa.
 */
export const stackHeadline = Stack_Sans_Headline({
  subsets: ['latin'],
  weight: ['300', '400'],
  variable: '--font-stack-headline',
  display: 'swap',
  /* Next no tiene métricas de respaldo para esta familia y avisa en cada compilación. */
  adjustFontFallback: false,
});

export const stackText = Stack_Sans_Text({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-stack-text',
  display: 'swap',
  /* Next no tiene métricas de respaldo para esta familia y avisa en cada compilación. */
  adjustFontFallback: false,
});
