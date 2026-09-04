import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import {
  Bebas_Neue,
  Cormorant_Garamond,
  Fredoka,
  Jost,
  Manrope,
  Pinyon_Script,
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
 * Cada una expone una variable CSS en vez de una clase, y eso es lo que permite que las use
 * quien las necesita sin conocerlas: los temas de invitación apuntan a estas variables desde
 * `themes.tokens.fonts`, y el panel las consume desde `dashboard.css` y el token `fontFamily`
 * de antd. Una clase solo serviría para lo segundo.
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
 * De aquí abajo, todas van sin precarga: solo las pide el tema de una invitación, y precargar en
 * `/admin` una fuente decorativa que esa pantalla no pinta es gastar ancho de banda en la
 * petición que más importa. Se descargan igual, pero cuando hacen falta.
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

/**
 * Pinyon Script: la caligrafía inglesa de «ink».
 *
 * Sacramento ya cubre lo manuscrito, y no sirve para lo mismo. Es una monoline moderna —trazo de
 * grosor constante, formas redondas, aire de rotulador— y funciona en un tema romántico o de
 * jardín. Lo que pide una papelería de boda formal es una **copperplate**: pluma de punta
 * flexible, mucho contraste entre el grueso y el fino, mayúsculas con rúbrica. Puestas al lado, la
 * diferencia no es de gusto: una firma con rotulador junto a una fotografía en blanco y negro se
 * lee como una nota adhesiva.
 *
 * Va como `script` de un solo tema. Un tema no tiene por qué compartir tipografía con los demás
 * —es la mitad de lo que lo hace un producto distinto—, y por eso `manrope` y `playfair` ya
 * estaban aquí para «minimal» y «royal».
 *
 * Sin precarga, como las demás decorativas: solo la pide la invitación que la usa.
 */
const pinyon = Pinyon_Script({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pinyon',
  display: 'swap',
  preload: false,
});

/**
 * Fredoka: el palo seco **redondo** de «cocoa».
 *
 * Es la única de las siete sin ninguna arista, y por eso está: ese tema viste una invitación
 * dibujada a mano, con ilustraciones de línea y formas orgánicas, y un grotesco de terminales
 * rectas al lado de un lazo dibujado se lee como dos piezas de proyectos distintos.
 *
 * Se carga en cuatro pesos porque aquí el titular no es fino sino **gordo**: los rótulos de esa
 * plantilla se componen vaciados, con el contorno haciendo de letra (ver `.inv-outline-text` en
 * `globals.css`), y un peso ligero vaciado deja un dibujo de alambre que no se lee.
 *
 * Sin precarga, como el resto de las decorativas.
 */
const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fredoka',
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

const fontVariables = [jost, cormorant, sacramento, pinyon, fredoka, bebas, manrope, playfair]
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
  /*
   * Los dos formatos son necesarios y el orden importa: el navegador se queda con el primero
   * que sepa leer. El SVG va delante porque es el que escala sin pixelarse a las densidades
   * altas y a los tamaños grandes (favoritos, pantalla de inicio); el `.ico` queda detrás como
   * red para Safari antiguo, que no admite favicons vectoriales.
   *
   * Declararlos aquí no es opcional aunque los ficheros vivan en `public/`: sin esta entrada,
   * el navegador solo pide `/favicon.ico` por convención y el SVG no lo mira nadie.
   */
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
    ],
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
