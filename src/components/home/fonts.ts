import { DM_Serif_Display } from 'next/font/google';

/**
 * La didona de la portada: titulares en versales y la palabra gigante del arco.
 *
 * Es de contraste alto y remates firmes, la que aguanta a 20rem sobre una foto sin que los
 * filetes se rompan. El texto corrido usa Jost, que ya carga `app/layout.tsx` para las
 * invitaciones, y la caligrafía de los rótulos, Great Vibes, también de allí.
 */
export const homeDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-home-display',
  display: 'swap',
});
