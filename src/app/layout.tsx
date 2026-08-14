import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import {
  Bebas_Neue,
  Cormorant_Garamond,
  Jost,
  Manrope,
  Playfair_Display,
  Sacramento,
} from 'next/font/google';
import './globals.css';

/**
 * Las fuentes se descargan EN EL BUILD y se sirven desde este dominio.
 *
 * Antes venían de un `@import url('https://fonts.googleapis.com/...')` en la primera línea
 * de `globals.css`, que es el peor sitio posible para pedirlas: el navegador tiene que bajar
 * la hoja, parsearla, pedir entonces el CSS de Google y solo después los archivos de fuente.
 * Tres viajes encadenados, y mientras tanto la página se pinta con la fuente por defecto del
 * sistema — que es exactamente el "se ve con la tipografía básica".
 *
 * `next/font` resuelve las tres cosas de una vez: descarga en el build, sirve desde el
 * mismo origen y **calcula métricas de la fuente de respaldo** para que al cambiar no se
 * mueva el texto. También quita la dependencia de que Google responda para que el panel se
 * vea bien, y de paso el dato de qué usuario abrió qué página deja de salir hacia fuera.
 *
 * Cada una expone una variable CSS en vez de una clase, porque quien las consume es CSS a
 * mano (`panel.css`, `App.css`) y el token `fontFamily` de antd, no un `className`.
 */
/**
 * Jost: el palo seco geométrico de la marca.
 *
 * Sustituye a DM Sans. La diferencia no es de gusto: DM Sans es un humanista neutro —el que
 * traen la mitad de los paneles— y Jost es geométrico, de la familia de Futura, que es
 * exactamente el registro de la bajada «invitaciones digitales» del logotipo. Se carga desde
 * el peso 300 porque las etiquetas de la interfaz van en 400 y los rótulos de sección en 500;
 * el 300 se reserva para los textos largos, donde afina la mancha.
 */
const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-jost',
  display: 'swap',
});

/**
 * Cormorant Garamond: el serif de los títulos.
 *
 * Sustituye a Playfair Display, y este es el cambio que responde al «parece Times New Roman».
 * Playfair es una didona de mucho peso: en 600, que es como estaba usada, sus astas engordan
 * y a tamaños de interfaz se lee como un serif de sistema en negrita. Cormorant es un
 * garalde de trazo fino y ojo pequeño, pensado para títulos, y aguanta pesos 300-500 sin
 * romperse — que es donde vive la elegancia.
 *
 * Por eso aquí solo se cargan pesos ligeros: si el 600 y el 700 no existen, nadie los puede
 * usar por inercia y la marca no se degrada con el tiempo.
 */
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

/*
 * Estas dos solo las usa la invitación (`App.css`, `Fiesta.css`), así que van sin precarga:
 * precargar en `/admin` una fuente decorativa que esa pantalla no pinta es gastar ancho de
 * banda en la petición que más importa. Se descargan igual, pero cuando hacen falta.
 */
const sacramento = Sacramento({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-sacramento',
  display: 'swap',
  preload: false,
});

/**
 * Manrope: el palo seco de los temas «minimal» y «corporate».
 *
 * Existe porque esos dos temas no pueden compartir tipografía con los demás sin dejar de ser lo
 * que son: uno es arquitectónico y el otro profesional, y los dos piden un grotesco de caja alta
 * y formas cerradas, no el geométrico de Jost. Se carga en dos pesos —el de lectura y el de
 * titular— porque un tema que solo cambia el color no cambia de carácter.
 */
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '500', '700'],
  variable: '--font-manrope',
  display: 'swap',
  preload: false,
});

/**
 * Playfair Display: la didona de «royal».
 *
 * Se descartó en su día como tipografía de interfaz —en peso 600 y a tamaños pequeños se lee
 * como un serif de sistema en negrita— y esa decisión sigue en pie. Aquí vuelve para lo único
 * que hace bien y hace mejor que nadie: titulares grandes con mucho contraste de trazo, que es
 * exactamente lo que un tema dramático necesita. Solo pesos ligeros, y solo para display.
 */
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
  preload: false,
});

const bebas = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bebas',
  display: 'swap',
  preload: false,
});

const fontVariables = [jost, cormorant, sacramento, bebas, manrope, playfair]
  .map((font) => font.variable)
  .join(' ');

/**
 * Base para resolver las URLs absolutas que exige Open Graph. Sin esto, las
 * imágenes de preview salen relativas y WhatsApp no las carga.
 */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Invitaciones digitales',
    // Cada invitación define su propio título; esto solo da el sufijo de marca.
    template: '%s',
  },
  formatDetection: {
    // Evita que iOS convierta fechas y direcciones en enlaces azules dentro del diseño.
    telephone: false,
    date: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // La invitación se ve casi siempre en móvil; el color de la barra la integra visualmente.
  themeColor: '#6b2d7b',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
