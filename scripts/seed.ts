/**
 * Seed idempotente. Se puede correr tantas veces como haga falta.
 *
 * Carga, en este orden:
 *   1. Catálogos de plataforma (funcionalidades, planes, tipos de evento)
 *   2. Component Registry (bloques, variantes, plantillas, temas)
 *   3. Dos clientes: la de la plataforma (con el superadministrador) y un cliente
 *   4. El evento de Kamilah, migrado desde src/data/event.json
 *
 * Corre con el rol DUEÑO, que no está sujeto a RLS. Es el único camino legítimo
 * para insertar datos de varios tenants desde un mismo proceso.
 */
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import { eq, inArray, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as s from '../src/infrastructure/db/schema/index.js';
import { PLATFORM_ADMIN } from './platform.js';

loadDotenv({ path: ['.env.local', '.env'], quiet: true });

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const url = process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL;

if (!url) {
  console.error('Falta DATABASE_MIGRATION_URL (o DATABASE_URL).');
  process.exit(1);
}

const pool = new Pool({ connectionString: url, max: 1 });
const db = drizzle(pool, { schema: s, casing: 'snake_case' });

/**
 * Mérida está en UTC-6 todo el año: México eliminó el horario de verano en 2022.
 * Las horas de event.json vienen sin zona ('2026-10-17T12:00:00'), y si se dejaran
 * así Node las interpretaría en la zona del servidor, que en Vercel es UTC. La cuenta
 * regresiva se desviaría seis horas. Por eso el desplazamiento va explícito.
 */
const MERIDA_OFFSET = '-06:00';
const TIME_ZONE = 'America/Merida';

const KAMILAH_SLUG = 'kamilah-3-anios';

/**
 * Código de acceso del evento de ejemplo, fijo a propósito.
 *
 * En producción cada evento recibe uno generado con `generateAccessCode()` del dominio,
 * pero el seed necesita un valor estable: si cambiara en cada ejecución, la URL que ya
 * se compartió dejaría de funcionar. Por eso el upsert de abajo tampoco lo sobreescribe.
 */
const KAMILAH_ACCESS_CODE = 'q7mt4x';

const localInstant = (naiveIso: string): Date => new Date(`${naiveIso}${MERIDA_OFFSET}`);

/** Combina el día del evento con una hora 'HH:MM' del cronograma. */
const scheduleInstant = (eventDate: string, timeLabel: string): Date | null => {
  const day = eventDate.slice(0, 10);
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeLabel.trim());
  if (!match) return null;
  const hour = match[1].padStart(2, '0');
  return new Date(`${day}T${hour}:${match[2]}:00${MERIDA_OFFSET}`);
};

type EventJson = {
  name: string;
  fullName: string;
  lastName: string;
  eventType: string;
  tagline: string;
  date: string;
  dateLabel: string;
  timeLabel: string;
  city: string;
  parents: { label: string; father: string; mother: string };
  godparents: { label: string; names: string[] };
  storyImage: string;
  finalImage: string;
  story: string;
  church: { label: string; name: string; address: string; detail: string; mapUrl: string };
  location: { label: string; name: string; address: string; detail: string; mapUrl: string };
  party: Record<string, unknown>;
  schedule: { time: string; title: string; description: string }[];
  music: { src: string; title: string };
  giftTable: { name: string; detail: string; url: string };
  gallery: string[];
  messages: { quote: string; author: string; role: string; group: string }[];
  contact: { phone: string; instagram: string; whatsapp: string };
};

// ════════════════════════════════════════════════════════════════════════════
// 1. Catálogos de plataforma
// ════════════════════════════════════════════════════════════════════════════

const FEATURES = [
  { key: 'plantilla', name: 'Diseño basado en plantilla', category: 'invitacion' },
  { key: 'pantalla_bienvenida', name: 'Pantalla de bienvenida', category: 'invitacion' },
  { key: 'historia', name: 'Historia del festejado', category: 'invitacion' },
  { key: 'musica', name: 'Música de fondo', category: 'invitacion' },
  { key: 'cuenta_regresiva', name: 'Cuenta regresiva', category: 'invitacion' },
  { key: 'cronograma', name: 'Cronograma', category: 'invitacion' },
  { key: 'codigo_vestimenta', name: 'Código de vestimenta', category: 'invitacion' },
  { key: 'mesa_regalos', name: 'Mesa de regalos', category: 'invitacion' },
  { key: 'galeria', name: 'Galería de fotos', category: 'invitacion' },
  { key: 'ubicacion', name: 'Ubicación con Google Maps', category: 'invitacion' },
  { key: 'compartir_whatsapp', name: 'Compartir por WhatsApp', category: 'invitacion' },
  { key: 'rsvp', name: 'Confirmación de asistencia', category: 'gestion' },
  { key: 'panel_confirmaciones', name: 'Panel básico de confirmaciones', category: 'gestion' },
  { key: 'gestion_invitados', name: 'Gestión de invitados por familia', category: 'gestion' },
  { key: 'gestion_mesas', name: 'Gestión de mesas', category: 'gestion' },
  { key: 'panel_administrativo', name: 'Panel administrativo completo', category: 'gestion' },
  { key: 'recordatorios', name: 'Recordatorios automáticos', category: 'automatizacion' },
  { key: 'libro_firmas', name: 'Libro de firmas', category: 'extras' },
  { key: 'album_colaborativo', name: 'Álbum colaborativo', category: 'extras' },
  { key: 'ia_contenido', name: 'Generación de contenido con IA', category: 'extras' },
] as const;

const PLANS = [
  { key: 'esencial', name: 'Plan Esencial', rank: 1, priceCents: 0 },
  { key: 'premium', name: 'Plan Premium', rank: 2, priceCents: 0 },
] as const;

/** Configuración base de cada plan. `limitValue` null = sin tope. */
const PLAN_FEATURES: { planKey: string; featureKey: string; limitValue: number | null }[] = [
  // Esencial: todo lo de la invitación, RSVP, panel básico y 1 recordatorio.
  ...[
    'plantilla',
    'historia',
    'musica',
    'cuenta_regresiva',
    'cronograma',
    'codigo_vestimenta',
    'mesa_regalos',
    'galeria',
    'ubicacion',
    'compartir_whatsapp',
    'rsvp',
    'panel_confirmaciones',
  ].map((featureKey) => ({ planKey: 'esencial', featureKey, limitValue: null })),
  { planKey: 'esencial', featureKey: 'recordatorios', limitValue: 1 },

  // Premium: todo lo anterior sin tope, más gestión, mesas y extras.
  ...[
    'plantilla',
    /* La puerta de bienvenida es de Premium y de nadie más. Es la única funcionalidad de la
       invitación que no está en Esencial, y por eso se ve: es lo primero que abre el invitado. */
    'pantalla_bienvenida',
    'historia',
    'musica',
    'cuenta_regresiva',
    'cronograma',
    'codigo_vestimenta',
    'mesa_regalos',
    'galeria',
    'ubicacion',
    'compartir_whatsapp',
    'rsvp',
    'panel_confirmaciones',
    'gestion_invitados',
    'gestion_mesas',
    'panel_administrativo',
    'libro_firmas',
    'album_colaborativo',
    'ia_contenido',
  ].map((featureKey) => ({ planKey: 'premium', featureKey, limitValue: null })),
  // Los 4 recordatorios configurables: 7 días, 3 días, 1 día y el día del evento.
  { planKey: 'premium', featureKey: 'recordatorios', limitValue: 4 },
];

/**
 * Los tipos de evento, con clave en inglés.
 *
 * La clave es un identificador del sistema —viaja en `events.event_type_key` y en
 * `templates.event_type_key`— y el inglés la mantiene legible junto al resto del vocabulario
 * técnico, que ya lo es: `hero`, `gallery`, `rsvp`. El nombre que se lee en pantalla va aparte y
 * en español, que es el idioma del producto.
 *
 * «Bautizo» se separa de «Presentación»: son dos celebraciones distintas —una es un sacramento y
 * la otra una presentación en el templo— y fundirlas obligaba a que la plantilla de una sirviera
 * para la otra.
 */
const EVENT_TYPES = [
  { key: 'wedding', name: 'Boda' },
  { key: 'quince', name: 'XV Años' },
  { key: 'baptism', name: 'Bautizo' },
  { key: 'presentation', name: 'Presentación' },
  { key: 'graduation', name: 'Graduación' },
  { key: 'baby_shower', name: 'Baby Shower' },
  { key: 'birthday', name: 'Cumpleaños' },
  { key: 'gender_reveal', name: 'Revelación de género' },
  { key: 'corporate', name: 'Evento empresarial' },
] as const;

/**
 * Claves que cambiaron de nombre, y por qué esto no es un `DELETE` seguido de un `INSERT`.
 *
 * `events.event_type_key` y `templates.event_type_key` apuntan a estas claves con
 * `ON UPDATE CASCADE`, así que **renombrar propaga solo**: los eventos ya creados siguen
 * apuntando a su tipo sin tocarlos. Insertar las nuevas y borrar las viejas, en cambio, fallaría
 * —hay eventos referenciándolas— o dejaría dos juegos de tipos conviviendo.
 *
 * Es idempotente: en la segunda ejecución las claves viejas ya no existen y no pasa nada.
 */
const RENAMED_EVENT_TYPES: Readonly<Record<string, string>> = {
  xv_anios: 'quince',
  presentacion: 'presentation',
  boda: 'wedding',
  cumpleanos: 'birthday',
  graduacion: 'graduation',
  revelacion_genero: 'gender_reveal',
  empresarial: 'corporate',
};

/** Lo mismo para los temas: se renombran, no se duplican. */
const RENAMED_THEMES: Readonly<Record<string, string>> = {
  'marfil-oro': 'elegance',
  'jardin-salvia': 'floral',
  medianoche: 'royal',
};

// ════════════════════════════════════════════════════════════════════════════
// 2. Component Registry
// ════════════════════════════════════════════════════════════════════════════

const BLOCKS = [
  { key: 'welcome', name: 'Pantalla de bienvenida', featureKey: 'pantalla_bienvenida' },
  { key: 'hero', name: 'Portada', featureKey: 'plantilla' },
  { key: 'story', name: 'Historia', featureKey: 'historia' },
  { key: 'details', name: 'Detalles del evento', featureKey: 'plantilla' },
  { key: 'party', name: 'Fiesta temática', featureKey: 'plantilla' },
  { key: 'schedule', name: 'Cronograma', featureKey: 'cronograma' },
  { key: 'gallery', name: 'Galería', featureKey: 'galeria' },
  { key: 'messages', name: 'Mensajes', featureKey: 'plantilla' },
  { key: 'location', name: 'Ubicación', featureKey: 'ubicacion' },
  { key: 'rsvp', name: 'Confirmación de asistencia', featureKey: 'rsvp' },
  { key: 'closing', name: 'Mensaje final', featureKey: 'plantilla' },
  { key: 'footer', name: 'Pie de página', featureKey: 'plantilla' },
] as const;

/**
 * Variantes registradas. `registry_id` ('hero.classic') lo genera Postgres a partir
 * de block_key y variant_key, así que no se inserta aquí.
 *
 * `minPlanRank` 2 = solo Premium. Es el mecanismo para vender variantes sin tocar código.
 */
const VARIANTS: {
  blockKey: string;
  variantKey: string;
  name: string;
  minPlanRank?: number;
  isActive?: boolean;
}[] = [
  /*
   * Las tres llevan `minPlanRank: 2`. El bloque ya cuelga de una funcionalidad que solo tiene
   * Premium, y aun así se marcan una por una: son dos cierres distintos —qué bloques ofrece el
   * plan y qué variantes ofrece el catálogo— y dejar el segundo abierto haría que la pantalla de
   * componentes las enseñara como disponibles para Esencial.
   */
  { blockKey: 'welcome', variantKey: 'veil', name: 'Bienvenida de papelería', minPlanRank: 2 },
  { blockKey: 'welcome', variantKey: 'envelope', name: 'Bienvenida en sobre lacrado', minPlanRank: 2 },
  { blockKey: 'welcome', variantKey: 'spotlight', name: 'Bienvenida a pantalla completa', minPlanRank: 2 },
  { blockKey: 'welcome', variantKey: 'filigree', name: 'Bienvenida con filigrana grabada', minPlanRank: 2 },
  { blockKey: 'welcome', variantKey: 'monogram', name: 'Bienvenida con monograma', minPlanRank: 2 },
  { blockKey: 'welcome', variantKey: 'luminous', name: 'Bienvenida con rótulo luminoso', minPlanRank: 2 },
  { blockKey: 'welcome', variantKey: 'botanical', name: 'Bienvenida con guirnalda botánica', minPlanRank: 2 },
  { blockKey: 'welcome', variantKey: 'torn', name: 'Bienvenida con papel rasgado', minPlanRank: 2 },
  { blockKey: 'welcome', variantKey: 'band', name: 'Bienvenida con banda de color', minPlanRank: 2 },
  { blockKey: 'welcome', variantKey: 'countdown', name: 'Bienvenida con cuenta regresiva', minPlanRank: 2 },
  { blockKey: 'hero', variantKey: 'classic', name: 'Portada clásica' },
  { blockKey: 'hero', variantKey: 'centered', name: 'Portada centrada' },
  { blockKey: 'hero', variantKey: 'split', name: 'Portada a dos columnas' },
  { blockKey: 'hero', variantKey: 'portrait', name: 'Portada con retrato difuminado' },
  { blockKey: 'story', variantKey: 'image-left', name: 'Historia con imagen a la izquierda' },
  { blockKey: 'story', variantKey: 'image-right', name: 'Historia con imagen a la derecha' },
  { blockKey: 'story', variantKey: 'centered', name: 'Historia centrada' },
  { blockKey: 'story', variantKey: 'overlay', name: 'Historia sobre la imagen' },
  { blockKey: 'details', variantKey: 'cards', name: 'Detalles en tarjetas' },
  { blockKey: 'details', variantKey: 'list', name: 'Detalles en lista' },
  { blockKey: 'details', variantKey: 'split', name: 'Detalles a dos columnas' },
  { blockKey: 'details', variantKey: 'panel', name: 'Detalles en panel de color' },
  { blockKey: 'party', variantKey: 'themed', name: 'Fiesta temática con personajes' },
  { blockKey: 'schedule', variantKey: 'vertical', name: 'Línea de tiempo alternada' },
  { blockKey: 'schedule', variantKey: 'horizontal', name: 'Cinta horizontal', minPlanRank: 2 },
  { blockKey: 'schedule', variantKey: 'agenda', name: 'Programa impreso' },
  { blockKey: 'schedule', variantKey: 'showcase', name: 'Momentos destacados' },
  { blockKey: 'schedule', variantKey: 'ribbon', name: 'Cinta con lazos' },
  { blockKey: 'schedule', variantKey: 'zigzag', name: 'Momentos en zigzag' },
  { blockKey: 'gallery', variantKey: 'parallax', name: 'Galería con parallax' },
  { blockKey: 'gallery', variantKey: 'grid', name: 'Galería en cuadrícula' },
  { blockKey: 'gallery', variantKey: 'carousel', name: 'Pasarela infinita' },
  { blockKey: 'gallery', variantKey: 'masonry', name: 'Galería en mampostería', minPlanRank: 2 },
  { blockKey: 'gallery', variantKey: 'mosaic', name: 'Galería en mosaico' },
  { blockKey: 'gallery', variantKey: 'polaroid', name: 'Galería polaroid' },
  { blockKey: 'gallery', variantKey: 'editorial', name: 'Galería de pliego editorial' },
  { blockKey: 'gallery', variantKey: 'cinematic', name: 'Galería cinematográfica' },
  { blockKey: 'messages', variantKey: 'carousel', name: 'Mensajes en carrusel' },
  { blockKey: 'location', variantKey: 'single', name: 'Sede a pantalla completa' },
  { blockKey: 'location', variantKey: 'single-split', name: 'Sede con foto al lado' },
  { blockKey: 'location', variantKey: 'single-card', name: 'Sede en tarjeta' },
  { blockKey: 'location', variantKey: 'dual-venue', name: 'Dos sedes en columnas' },
  { blockKey: 'location', variantKey: 'dual-journey', name: 'Dos sedes como recorrido' },
  { blockKey: 'location', variantKey: 'dual-stacked', name: 'Dos sedes en franjas' },
  /*
   * Las cinco son FORMAS, no mecanismos. A dónde va el botón —al WhatsApp del organizador o a la
   * plataforma— es contenido del evento y lo limita el plan al guardarlo, no el catálogo: por
   * eso no hay una variante «por WhatsApp» y otra «con formulario». Las que existían con esos
   * nombres se retiran en `RETIRED_VARIANTS`.
   */
  { blockKey: 'rsvp', variantKey: 'card', name: 'Confirmación en tarjeta' },
  { blockKey: 'rsvp', variantKey: 'panel', name: 'Confirmación en panel de color' },
  { blockKey: 'rsvp', variantKey: 'ticket', name: 'Confirmación con forma de pase' },
  { blockKey: 'rsvp', variantKey: 'reply-card', name: 'Tarjeta de respuesta R.S.V.P.' },
  { blockKey: 'rsvp', variantKey: 'postcard', name: 'Confirmación en postal' },
  { blockKey: 'closing', variantKey: 'split', name: 'Cierre a dos columnas' },
  { blockKey: 'closing', variantKey: 'letter', name: 'Cierre como carta que se abre' },
  { blockKey: 'closing', variantKey: 'horizon', name: 'Cierre a pantalla completa' },
  { blockKey: 'footer', variantKey: 'centered', name: 'Pie centrado' },
  { blockKey: 'footer', variantKey: 'ribbon', name: 'Pie en cinta de color' },
  { blockKey: 'footer', variantKey: 'marquee', name: 'Pie con rótulo en movimiento' },
];

/**
 * Variantes que se dan de baja del catálogo, y por qué cuesta más que borrarlas.
 *
 * `rsvp.whatsapp` y `rsvp.form` no eran dos diseños: eran dos **mecanismos** —a dónde va el
 * botón— disfrazados de entradas del registro. Eso hoy es contenido del evento
 * (`destination`, en `domain/invitation/blocks/rsvp.ts`), así que el catálogo se quedaba con dos
 * opciones que prometían algo que la variante no decide.
 *
 * No se pueden borrar sin más: `event_blocks.variant_id` las referencia con `ON DELETE RESTRICT`
 * —a propósito, para que nadie deje una invitación publicada apuntando a una variante que ya no
 * existe—. Por eso el seed primero **reapunta** los bloques que las usaran a la variante de
 * reemplazo y solo después borra. En ese orden, la baja es segura aunque haya eventos vivos.
 */
const RETIRED_VARIANTS = {
  registryIds: ['rsvp.whatsapp', 'rsvp.form'],
  replacedBy: 'rsvp.card',
} as const;

/** Composición de la plantilla de presentación, en el orden en que se renderiza hoy. */
/**
 * Las plantillas estructurales del catálogo.
 *
 * Una plantilla **no** es una paleta ni un tipo de evento: es una forma de componer la
 * invitación. Dos cosas la definen, y las dos son estructura:
 *
 *   1. **Qué bloques lleva y en qué orden.** `storytelling` pone la galería antes que los datos
 *      porque narra; `classic` los pone después porque informa.
 *   2. **Qué variante lleva cada bloque.** Es lo que hace que la galería de `cinematic` y la de
 *      `editorial` no se parezcan en nada: una encuadra planos a pantalla completa y la otra
 *      maqueta un pliego con folios y pies de foto.
 *
 * El tema va aparte y encima: cualquiera de las cuatro se puede vestir con los seis temas. Esa
 * separación es la que evita que el catálogo crezca por multiplicación —cuatro estructuras por
 * seis temas son veinticuatro invitaciones distintas con veintiocho piezas de código—.
 *
 * `party` y `messages` no aparecen en ninguna: están dados de alta en el catálogo pero todavía
 * no tienen componente, y una plantilla que los incluyera le daría al evento un bloque que no
 * pinta nada.
 */
const TEMPLATES: {
  key: string;
  name: string;
  description: string;
  /** Para qué tipos de evento se sugiere. Vacío sería «para ninguno». */
  eventTypes: readonly string[];
  isActive: boolean;
  /** Bloques en orden. La posición se deduce del índice: el orden ES la estructura. */
  blocks: readonly { blockKey: string; variantKey: string; isRequired?: boolean }[];
}[] = [
  {
    key: 'classic',
    name: 'Classic',
    description:
      'La estructura completa y en el orden esperado: se presenta, cuenta, informa y despide.',
    eventTypes: [
      'wedding',
      'quince',
      'baptism',
      'presentation',
      'graduation',
      'birthday',
      'baby_shower',
      'gender_reveal',
      'corporate',
    ],
    isActive: true,
    blocks: [
      { blockKey: 'hero', variantKey: 'classic', isRequired: true },
      { blockKey: 'story', variantKey: 'image-left' },
      { blockKey: 'details', variantKey: 'cards' },
      { blockKey: 'schedule', variantKey: 'vertical' },
      { blockKey: 'gallery', variantKey: 'grid' },
      { blockKey: 'location', variantKey: 'dual-venue' },
      { blockKey: 'rsvp', variantKey: 'card', isRequired: true },
      { blockKey: 'closing', variantKey: 'split' },
      { blockKey: 'footer', variantKey: 'centered', isRequired: true },
    ],
  },
  {
    key: 'editorial',
    name: 'Editorial',
    description:
      'Lenguaje de revista: maqueta de pliego, folios, pies de foto a la vista y papelería impresa.',
    eventTypes: ['wedding', 'quince', 'graduation', 'corporate'],
    isActive: true,
    blocks: [
      { blockKey: 'hero', variantKey: 'centered', isRequired: true },
      { blockKey: 'story', variantKey: 'image-right' },
      { blockKey: 'gallery', variantKey: 'editorial' },
      { blockKey: 'details', variantKey: 'list' },
      { blockKey: 'schedule', variantKey: 'agenda' },
      { blockKey: 'location', variantKey: 'single-split' },
      { blockKey: 'rsvp', variantKey: 'reply-card', isRequired: true },
      { blockKey: 'closing', variantKey: 'letter' },
      { blockKey: 'footer', variantKey: 'ribbon', isRequired: true },
    ],
  },
  {
    key: 'storytelling',
    name: 'Storytelling',
    description:
      'El orden narra: la historia y las fotos van antes que los datos, y el cierre remata.',
    eventTypes: ['wedding', 'quince', 'baptism', 'presentation', 'baby_shower'],
    isActive: true,
    blocks: [
      { blockKey: 'hero', variantKey: 'split', isRequired: true },
      { blockKey: 'story', variantKey: 'overlay' },
      { blockKey: 'gallery', variantKey: 'polaroid' },
      { blockKey: 'schedule', variantKey: 'showcase' },
      { blockKey: 'details', variantKey: 'split' },
      { blockKey: 'location', variantKey: 'dual-stacked' },
      { blockKey: 'rsvp', variantKey: 'postcard', isRequired: true },
      { blockKey: 'closing', variantKey: 'horizon' },
      { blockKey: 'footer', variantKey: 'marquee', isRequired: true },
    ],
  },
  {
    key: 'cinematic',
    name: 'Cinematic',
    description:
      'Todo a pantalla completa: planos panorámicos, franjas de color y muy poco texto por vista.',
    eventTypes: ['wedding', 'quince', 'gender_reveal'],
    isActive: true,
    blocks: [
      /* Sin `isRequired`: es de Premium, y un bloque obligatorio que el plan del cliente no
         incluye sería una plantilla que no se puede montar. */
      { blockKey: 'welcome', variantKey: 'spotlight' },
      { blockKey: 'hero', variantKey: 'classic', isRequired: true },
      { blockKey: 'gallery', variantKey: 'cinematic' },
      { blockKey: 'story', variantKey: 'overlay' },
      { blockKey: 'schedule', variantKey: 'showcase' },
      { blockKey: 'details', variantKey: 'panel' },
      { blockKey: 'location', variantKey: 'single' },
      { blockKey: 'rsvp', variantKey: 'panel', isRequired: true },
      { blockKey: 'closing', variantKey: 'horizon' },
      { blockKey: 'footer', variantKey: 'ribbon', isRequired: true },
    ],
  },
  {
    key: 'presentacion-infantil',
    name: 'Presentación infantil',
    description: 'Personalización de cliente: misa de acción de gracias más fiesta temática.',
    eventTypes: ['presentation'],
    /*
     * Inactiva, por lo mismo que el tema «saja-boys»: es la plantilla de un evento concreto y
     * `docs/PROJECT.md` reserva el catálogo para lo que sirve a todos. No se borra porque el
     * evento de Kamilah la tiene asignada con `ON DELETE RESTRICT`.
     */
    isActive: false,
    blocks: [
      { blockKey: 'hero', variantKey: 'classic', isRequired: true },
      { blockKey: 'story', variantKey: 'image-left' },
      { blockKey: 'details', variantKey: 'cards' },
      { blockKey: 'party', variantKey: 'themed' },
      { blockKey: 'schedule', variantKey: 'vertical' },
      { blockKey: 'gallery', variantKey: 'parallax' },
      { blockKey: 'messages', variantKey: 'carousel' },
      { blockKey: 'location', variantKey: 'dual-venue' },
      { blockKey: 'rsvp', variantKey: 'card', isRequired: true },
      { blockKey: 'closing', variantKey: 'split' },
      { blockKey: 'footer', variantKey: 'centered', isRequired: true },
    ],
  },
];

/**
 * Los temas de la biblioteca.
 *
 * La forma de los tokens la define `src/domain/invitation/theme.ts`, y es la misma para todos:
 * los colores se nombran por el **papel que cumplen** —`primary`, `ink`, `surface`— y no por
 * lo que son. El tema anterior los nombraba `plum`, `pink`, `blush`, y eso ataba los
 * componentes a un tema concreto: una portada que pinta con `plum` no significa nada en un
 * tema verde. Con papeles, una variante se escribe una vez y sirve para los cuatro de aquí
 * abajo y para los que vengan.
 *
 * Las tipografías apuntan a las variables que publica `app/layout.tsx` con `next/font`, no a
 * nombres de familia sueltos: así el tema usa la fuente ya descargada y servida desde este
 * dominio, en lugar de pedirle al navegador una 'Playfair Display' que no está instalada en
 * ningún teléfono y acaba cayendo en Times New Roman.
 *
 * Los cuatro no son variaciones de lo mismo a propósito. Cubren los cuatro registros que pide
 * el catálogo de eventos —fiesta infantil, formal claro, natural, nocturno— y entre ellos hay
 * un tema oscuro, que es el que destapa los componentes que dan por hecho que el papel es
 * claro.
 */
/**
 * Los temas de la biblioteca: seis direcciones de arte, no seis paletas.
 *
 * La forma de los tokens la define `src/domain/invitation/theme.ts`. Los colores se nombran por
 * el **papel que cumplen** —`primary`, `ink`, `surface`— y no por lo que son, que es lo que
 * permite que una variante escrita una vez sirva para los seis y para los que vengan.
 *
 * ## Qué hace que dos temas se vean distintos de verdad
 *
 * La paleta es lo que menos. Un tema aquí decide además:
 *
 *   · **La tipografía** (`fonts`). Es el cambio que más carácter mueve: la misma portada con un
 *     garalde fino o con una didona de alto contraste son dos productos.
 *   · **La densidad** (`space.block`). Lo que separa a «minimal» de «royal» no es el color, es
 *     cuánto aire hay entre secciones.
 *   · **El tratamiento de las fotografías** (`photo.filter`). La misma foto que sube el cliente
 *     sale cálida y lavada en «elegance» y con contraste de cine en «royal».
 *   · **El ornamento** (`ornament`). Filete a secas, rombo, punto o nada.
 *
 * Los cuatro se aplican en piezas compartidas —`BlockSection`, `BlockImage`, `BlockOrnament`—,
 * así que un tema nuevo no toca ni un componente de bloque.
 *
 * ## Sobre `saja-boys`
 *
 * Queda **inactivo**. Es la paleta de la fiesta de un cliente concreto, y `docs/PROJECT.md` es
 * explícito: lo que solo beneficia a un cliente es una personalización, no parte del núcleo. No
 * se borra porque su evento lo tiene asignado; deja de ofrecerse en el catálogo público.
 */
const THEMES = [
  {
    key: 'elegance',
    name: 'Elegance',
    description: 'Marfil, champán y oro. Editorial y refinada, para bodas y XV formales.',
    isActive: true,
    tokens: {
      colors: {
        background: '#faf7f2',
        surface: '#fffdf9',
        ink: '#3a332b',
        inkSoft: '#7c7266',
        primary: '#8a7351',
        onPrimary: '#fdfbf6',
        accent: '#b99a63',
        line: '#e8e0d3',
        overlay: 'rgba(40, 33, 24, 0.42)',
      },
      fonts: {
        display: "var(--font-cormorant, 'Cormorant Garamond'), Georgia, serif",
        body: "var(--font-jost, 'Jost'), 'Helvetica Neue', Arial, sans-serif",
        script: "var(--font-sacramento, 'Sacramento'), cursive",
      },
      /* Cantos vivos: en una participación impresa no hay esquinas redondeadas, y el radio es
         justo el detalle que delata que algo se diseñó para una app. */
      radii: { sm: '0px', md: '2px', lg: '2px' },
      shadows: { soft: '0 20px 50px -34px rgba(60, 48, 30, 0.45)' },
      motion: { reveal: '0.9s cubic-bezier(0.22, 1, 0.36, 1)' },
      /* Mucho aire: es la mitad de lo que hace que algo se lea como caro. */
      space: { block: 'clamp(5rem, 11vw, 9rem)' },
      /* Cálida y ligeramente lavada, como una fotografía impresa en papel de algodón. */
      photo: { filter: 'saturate(0.9) contrast(0.97) sepia(0.06)' },
      /* Rombo: el ornamento clásico de la papelería de boda. */
      ornament: { line: '2rem', node: '5px', nodeRadius: '1px', nodeRotate: '45deg', opacity: '0.6' },
      /* Canto recto, por lo mismo que los radios: una participación impresa se corta a guillotina. */
      edge: { height: '0px' },
    },
  },
  {
    key: 'minimal',
    name: 'Minimal',
    description: 'Blanco, negro y beige. Arquitectónica, sin decoración y con mucho aire.',
    isActive: true,
    tokens: {
      colors: {
        background: '#ffffff',
        surface: '#f6f6f4',
        ink: '#111111',
        inkSoft: '#6a6a68',
        primary: '#111111',
        onPrimary: '#ffffff',
        accent: '#8a8a84',
        line: '#e3e3df',
        overlay: 'rgba(0, 0, 0, 0.45)',
      },
      fonts: {
        display: "var(--font-manrope, 'Manrope'), 'Helvetica Neue', Arial, sans-serif",
        body: "var(--font-manrope, 'Manrope'), 'Helvetica Neue', Arial, sans-serif",
        script: "var(--font-manrope, 'Manrope'), 'Helvetica Neue', Arial, sans-serif",
      },
      radii: { sm: '0px', md: '0px', lg: '0px' },
      shadows: { soft: '0 1px 0 0 rgba(17, 17, 17, 0.08)' },
      motion: { reveal: '0.6s cubic-bezier(0.16, 1, 0.3, 1)' },
      space: { block: 'clamp(5.5rem, 12vw, 10rem)' },
      /* Neutra y con un punto de contraste: la foto se defiende sola o no entra. */
      photo: { filter: 'saturate(0.85) contrast(1.06)' },
      /* Sin nodo: el ornamento de este tema es no tener ornamento. */
      ornament: { line: '2.5rem', node: '0px', nodeRadius: '0px', nodeRotate: '0deg', opacity: '0.35' },
      /* Ni radios ni ondas: en este tema una curva decorativa sería el único gesto de la página. */
      edge: { height: '0px' },
    },
  },
  {
    key: 'royal',
    name: 'Royal',
    description: 'Vino, negro y oro sobre fondo oscuro. Dramática y cinematográfica.',
    isActive: true,
    tokens: {
      colors: {
        background: '#140a0d',
        surface: '#1e1116',
        ink: '#f4e9df',
        inkSoft: '#bda69e',
        primary: '#7c1f35',
        onPrimary: '#fbeee2',
        accent: '#c8a45a',
        line: '#3a2129',
        overlay: 'rgba(10, 4, 6, 0.55)',
      },
      fonts: {
        /* Didona de alto contraste, solo para titulares grandes: es donde Playfair brilla y
           donde ninguna otra de las cargadas hace lo mismo. */
        display: "var(--font-playfair, 'Playfair Display'), Georgia, serif",
        body: "var(--font-jost, 'Jost'), 'Helvetica Neue', Arial, sans-serif",
        script: "var(--font-sacramento, 'Sacramento'), cursive",
      },
      radii: { sm: '0px', md: '2px', lg: '4px' },
      shadows: { soft: '0 30px 70px -40px rgba(0, 0, 0, 0.9)' },
      motion: { reveal: '1s cubic-bezier(0.22, 1, 0.36, 1)' },
      space: { block: 'clamp(4.5rem, 10vw, 8rem)' },
      /* Contraste de cine y una pizca de frío: es lo que separa una foto de fiesta de una
         fotografía de boda editorial. */
      photo: { filter: 'saturate(1.05) contrast(1.14) brightness(0.94)' },
      ornament: { line: '2.25rem', node: '6px', nodeRadius: '1px', nodeRotate: '45deg', opacity: '0.75' },
      /* El corte a escuadra es parte del drama: una onda lo volvería amable. */
      edge: { height: '0px' },
    },
  },
  {
    key: 'floral',
    name: 'Floral',
    description: 'Salvia, blush y crema. Romántica y natural, para eventos de día.',
    isActive: true,
    tokens: {
      colors: {
        background: '#f5f3ec',
        surface: '#ffffff',
        ink: '#33402f',
        inkSoft: '#6f7c6b',
        primary: '#5b7355',
        onPrimary: '#f8fbf4',
        accent: '#c98b86',
        line: '#dfe3d6',
        overlay: 'rgba(30, 40, 28, 0.4)',
      },
      fonts: {
        display: "var(--font-cormorant, 'Cormorant Garamond'), Georgia, serif",
        body: "var(--font-jost, 'Jost'), 'Helvetica Neue', Arial, sans-serif",
        script: "var(--font-sacramento, 'Sacramento'), cursive",
      },
      radii: { sm: '6px', md: '14px', lg: '28px' },
      shadows: { soft: '0 22px 50px -32px rgba(45, 60, 42, 0.4)' },
      motion: { reveal: '0.8s cubic-bezier(0.22, 1, 0.36, 1)' },
      space: { block: 'clamp(4.5rem, 10vw, 8rem)' },
      /* Luz de día: un punto más de saturación y menos contraste, como una foto al aire libre. */
      photo: { filter: 'saturate(1.06) contrast(0.98) brightness(1.02)' },
      /* Punto redondo: forma orgánica, sin aristas. */
      ornament: { line: '1.75rem', node: '5px', nodeRadius: '50%', nodeRotate: '0deg', opacity: '0.55' },
      /* Cantos ondulados: el mismo criterio que los radios generosos, ahora en las franjas. */
      edge: { height: 'clamp(1.75rem, 5vw, 3.25rem)' },
    },
  },
  {
    key: 'dreamy',
    name: 'Dreamy',
    description: 'Lavanda, azul suave y rosa. Etérea y ligera, para baby shower y revelaciones.',
    isActive: true,
    tokens: {
      colors: {
        background: '#f7f5fc',
        surface: '#ffffff',
        ink: '#3b3550',
        inkSoft: '#7b7492',
        primary: '#8272c0',
        onPrimary: '#fbfaff',
        accent: '#dc9cc2',
        line: '#e6e1f2',
        overlay: 'rgba(50, 44, 80, 0.38)',
      },
      fonts: {
        display: "var(--font-cormorant, 'Cormorant Garamond'), Georgia, serif",
        body: "var(--font-jost, 'Jost'), 'Helvetica Neue', Arial, sans-serif",
        script: "var(--font-sacramento, 'Sacramento'), cursive",
      },
      /* Todo muy redondeado: es lo que hace que un diseño se lea como suave antes de leer nada. */
      radii: { sm: '10px', md: '20px', lg: '34px' },
      shadows: { soft: '0 26px 60px -34px rgba(90, 78, 140, 0.4)' },
      /* La entrada más lenta de las seis: aquí el movimiento es parte del carácter. */
      motion: { reveal: '1.05s cubic-bezier(0.22, 1, 0.36, 1)' },
      space: { block: 'clamp(4.5rem, 10vw, 8.5rem)' },
      /* Aclarada y con poco contraste: el aire lechoso de una fotografía a contraluz. */
      photo: { filter: 'saturate(0.95) contrast(0.93) brightness(1.06)' },
      ornament: { line: '1.5rem', node: '6px', nodeRadius: '50%', nodeRotate: '0deg', opacity: '0.45' },
      /* La onda más alta de los siete: aquí nada tiene una arista, ni las franjas. */
      edge: { height: 'clamp(2rem, 6vw, 4rem)' },
    },
  },
  {
    key: 'corporate',
    name: 'Corporate',
    description: 'Azul marino, blanco y gris. Profesional, estructurada y de alta legibilidad.',
    isActive: true,
    tokens: {
      colors: {
        background: '#f7f8fa',
        surface: '#ffffff',
        ink: '#16202e',
        inkSoft: '#5b6675',
        primary: '#16324f',
        onPrimary: '#f6f9fc',
        accent: '#2f7bbf',
        line: '#dde3ea',
        overlay: 'rgba(12, 20, 32, 0.45)',
      },
      fonts: {
        display: "var(--font-manrope, 'Manrope'), 'Helvetica Neue', Arial, sans-serif",
        body: "var(--font-manrope, 'Manrope'), 'Helvetica Neue', Arial, sans-serif",
        script: "var(--font-manrope, 'Manrope'), 'Helvetica Neue', Arial, sans-serif",
      },
      radii: { sm: '4px', md: '8px', lg: '12px' },
      shadows: { soft: '0 18px 40px -30px rgba(16, 32, 52, 0.5)' },
      /* Rápida y sin florituras: en un evento de empresa, la animación no debe hacerse notar. */
      motion: { reveal: '0.5s cubic-bezier(0.16, 1, 0.3, 1)' },
      space: { block: 'clamp(4rem, 8vw, 6.5rem)' },
      photo: { filter: 'saturate(0.95) contrast(1.05)' },
      /* Marca cuadrada: geometría, no adorno. */
      ornament: { line: '2rem', node: '4px', nodeRadius: '0px', nodeRotate: '0deg', opacity: '0.5' },
      /* Geometría, no adorno: las franjas se cortan rectas. */
      edge: { height: '0px' },
    },
  },
  {
    key: 'saja-boys',
    name: 'Saja Boys',
    description: 'Personalización de cliente: morado, rosa y brillo. Fuera del catálogo público.',
    isActive: false,
    tokens: {
      colors: {
        background: '#fdf6fc',
        surface: '#ffffff',
        ink: '#42304a',
        inkSoft: '#7a6a80',
        primary: '#6b2d7b',
        onPrimary: '#fff8fd',
        accent: '#c0559f',
        line: '#eddbe9',
        overlay: 'rgba(38, 12, 44, 0.5)',
      },
      fonts: {
        display: "var(--font-cormorant, 'Cormorant Garamond'), Georgia, serif",
        body: "var(--font-jost, 'Jost'), 'Helvetica Neue', Arial, sans-serif",
        script: "var(--font-sacramento, 'Sacramento'), cursive",
      },
      radii: { sm: '4px', md: '10px', lg: '22px' },
      shadows: { soft: '0 18px 46px -28px rgba(40, 16, 46, 0.55)' },
      motion: { reveal: '0.7s cubic-bezier(0.22, 1, 0.36, 1)' },
      space: { block: 'clamp(4rem, 9vw, 7rem)' },
      photo: { filter: 'none' },
      ornament: { line: '1.75rem', node: '4px', nodeRadius: '50%', nodeRotate: '0deg', opacity: '0.5' },
      edge: { height: 'clamp(1.5rem, 4.5vw, 3rem)' },
    },
  },
] as const;

// ════════════════════════════════════════════════════════════════════════════

/**
 * Aplica los renombres de clave antes de insertar.
 *
 * Tiene que correr ANTES del upsert: si primero se insertan las claves nuevas, el renombre
 * posterior choca con la única de `key` y el catálogo se queda con los dos juegos.
 */
async function applyRenames(): Promise<void> {
  for (const [from, to] of Object.entries(RENAMED_EVENT_TYPES)) {
    await db.update(s.eventTypes).set({ key: to }).where(eq(s.eventTypes.key, from));
  }

  for (const [from, to] of Object.entries(RENAMED_THEMES)) {
    await db.update(s.themes).set({ key: to }).where(eq(s.themes.key, from));
  }
}

async function seedCatalogs(): Promise<void> {
  await applyRenames();

  await db
    .insert(s.features)
    .values(FEATURES.map((f) => ({ ...f })))
    .onConflictDoUpdate({
      target: s.features.key,
      set: { name: sql`excluded.name`, category: sql`excluded.category` },
    });

  await db
    .insert(s.plans)
    .values(PLANS.map((p) => ({ ...p })))
    .onConflictDoUpdate({
      target: s.plans.key,
      set: { name: sql`excluded.name`, rank: sql`excluded.rank` },
    });

  await db
    .insert(s.planFeatures)
    .values(PLAN_FEATURES)
    .onConflictDoUpdate({
      target: [s.planFeatures.planKey, s.planFeatures.featureKey],
      set: { isIncluded: sql`excluded.is_included`, limitValue: sql`excluded.limit_value` },
    });

  await db
    .insert(s.eventTypes)
    .values(EVENT_TYPES.map((t) => ({ ...t })))
    .onConflictDoUpdate({ target: s.eventTypes.key, set: { name: sql`excluded.name` } });

  console.log(
    `  ${FEATURES.length} funcionalidades, ${PLANS.length} planes, ${EVENT_TYPES.length} tipos de evento`,
  );
}

async function seedRegistry(): Promise<{ templateId: string; themeId: string }> {
  await db
    .insert(s.blocks)
    .values(BLOCKS.map((b) => ({ ...b })))
    .onConflictDoUpdate({
      target: s.blocks.key,
      set: { name: sql`excluded.name`, featureKey: sql`excluded.feature_key` },
    });

  await db
    .insert(s.componentVariants)
    .values(VARIANTS.map((v) => ({ ...v, minPlanRank: v.minPlanRank ?? 0 })))
    .onConflictDoUpdate({
      target: [s.componentVariants.blockKey, s.componentVariants.variantKey],
      set: {
        name: sql`excluded.name`,
        minPlanRank: sql`excluded.min_plan_rank`,
        isActive: sql`excluded.is_active`,
      },
    });

  const themeRows = await db
    .insert(s.themes)
    .values(THEMES.map((t) => ({ ...t, tokens: t.tokens as Record<string, unknown> })))
    .onConflictDoUpdate({
      target: s.themes.key,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        tokens: sql`excluded.tokens`,
        isActive: sql`excluded.is_active`,
      },
    })
    .returning({ id: s.themes.id, key: s.themes.key });

  /*
   * El evento de ejemplo se queda con el tema con el que se diseñó. Se busca por clave y no
   * por posición: `RETURNING` no garantiza el orden de los valores insertados, y con un
   * `ORDER BY` implícito equivocado la invitación de Kamilah amanecería en azul noche.
   */
  const theme = themeRows.find((row) => row.key === 'saja-boys');

  /*
   * Las plantillas: una fila por estructura, más sus tipos de evento y su composición.
   *
   * Se hace en bucle y no en un solo `insert` porque cada plantilla necesita su id para colgar
   * de él los bloques y los tipos, y `RETURNING` no garantiza el orden de un insert múltiple.
   */
  const variantRows = await db
    .select({ id: s.componentVariants.id, registryId: s.componentVariants.registryId })
    .from(s.componentVariants);
  const variantByRegistryId = new Map(variantRows.map((v) => [v.registryId, v.id]));

  const templateIdByKey = new Map<string, string>();

  for (const definition of TEMPLATES) {
    const [row] = await db
      .insert(s.templates)
      .values({
        key: definition.key,
        name: definition.name,
        description: definition.description,
        isActive: definition.isActive,
      })
      .onConflictDoUpdate({
        target: s.templates.key,
        set: {
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          isActive: sql`excluded.is_active`,
        },
      })
      .returning({ id: s.templates.id });

    if (!row) throw new Error(`No se pudo crear la plantilla ${definition.key}`);

    templateIdByKey.set(definition.key, row.id);

    /*
     * Reemplazo completo, igual que la composición: los tipos de una plantilla se corrigen
     * quitando y poniendo, y un upsert dejaría para siempre el tipo que alguien retiró de la
     * lista.
     */
    await db.delete(s.templateEventTypes).where(eq(s.templateEventTypes.templateId, row.id));
    await db
      .insert(s.templateEventTypes)
      .values(definition.eventTypes.map((eventTypeKey) => ({ templateId: row.id, eventTypeKey })));

    await db
      .insert(s.templatePlans)
      .values([
        { templateId: row.id, planKey: 'esencial' },
        { templateId: row.id, planKey: 'premium' },
      ])
      .onConflictDoNothing();

    /*
     * Reemplazo completo en lugar de upsert: template_blocks tiene única en
     * (template_id, position), así que un upsert por block_key fallaría en cuanto se
     * reordenen los bloques. Nada apunta a estas filas con FK —event_blocks copia los valores
     * al crear el evento—, así que borrarlas es seguro.
     */
    await db.delete(s.templateBlocks).where(eq(s.templateBlocks.templateId, row.id));
    await db.insert(s.templateBlocks).values(
      definition.blocks.map((block, index) => {
        const registryId = `${block.blockKey}.${block.variantKey}`;
        const variantId = variantByRegistryId.get(registryId);

        if (!variantId) throw new Error(`Variante no registrada: ${registryId}`);

        return {
          templateId: row.id,
          blockKey: block.blockKey,
          defaultVariantId: variantId,
          // La posición se deduce del orden de la lista: el orden ES la estructura.
          position: index + 1,
          isRequired: block.isRequired ?? false,
        };
      }),
    );
  }

  const template = { id: templateIdByKey.get('presentacion-infantil') as string };

  if (!theme || !template.id) throw new Error('No se pudo crear la plantilla o el tema');

  await retireVariants(variantByRegistryId);

  console.log(
    `  ${BLOCKS.length} bloques, ${VARIANTS.length} variantes, ${TEMPLATES.length} plantillas, ${THEMES.length} temas`,
  );

  return { templateId: template.id, themeId: theme.id };
}

/**
 * Retira del catálogo las variantes de `RETIRED_VARIANTS`.
 *
 * Reapunta antes de borrar, que es el único orden que funciona con la clave ajena `RESTRICT`.
 * Es idempotente: en la segunda ejecución no encuentra nada que retirar y no hace nada.
 */
async function retireVariants(variantByRegistryId: Map<string, string>): Promise<void> {
  const retiredIds = RETIRED_VARIANTS.registryIds
    .map((registryId) => variantByRegistryId.get(registryId))
    .filter((id): id is string => Boolean(id));

  if (retiredIds.length === 0) return;

  const replacementId = variantByRegistryId.get(RETIRED_VARIANTS.replacedBy);

  if (!replacementId) {
    throw new Error(`La variante de reemplazo ${RETIRED_VARIANTS.replacedBy} no está registrada`);
  }

  const repointed = await db
    .update(s.eventBlocks)
    .set({ variantId: replacementId })
    .where(inArray(s.eventBlocks.variantId, retiredIds))
    .returning({ id: s.eventBlocks.id });

  await db.delete(s.componentVariants).where(inArray(s.componentVariants.id, retiredIds));

  console.log(
    `  ${retiredIds.length} variantes retiradas` +
      (repointed.length > 0 ? `, ${repointed.length} bloques reapuntados` : ''),
  );
}

/**
 * Cuentas y clientes.
 *
 * Se siembran tres cosas y cada una responde a una pregunta distinta:
 *
 *   · **La cuenta de plataforma**, sin cliente (`client_id` NULL). Es con la que se entra a
 *     `/admin`.
 *   · **Un cliente con dos eventos**, para poder ver el desplegable de la cabecera de
 *     `/panel`, que solo aparece cuando hay más de uno.
 *   · **Un segundo cliente**, con su propio dueño y sin eventos.
 *
 * El segundo cliente no es adorno: sin al menos dos tenants no se puede comprobar que el
 * aislamiento funciona. Un seed con un solo cliente hace que todo parezca correcto
 * precisamente porque no hay nada de lo que aislarse.
 *
 * `platform_role` se escribe aquí, con el rol DUEÑO. La aplicación no puede tocar esa
 * columna —está revocada en sql/0001_security.sql— justamente para que conceder ese rol sea
 * una operación deliberada de la plataforma y no algo que salga de una pantalla del panel.
 */
async function seedAccounts(): Promise<{ clientId: string; userId: string }> {
  const [platformAdmin] = await db
    .insert(s.users)
    .values({
      // `clientId` va sin poner: es NULL, y el CHECK `users_client_xor_platform` exige que
      // lo sea para una cuenta con rol de plataforma.
      email: PLATFORM_ADMIN.email,
      name: PLATFORM_ADMIN.name,
      platformRole: 'superadmin',
    })
    /*
     * El `set` incluye platform_role para que reejecutar el seed restaure el privilegio si
     * alguien lo quitó a mano. No incluye `status`: si una cuenta se desactivó a propósito,
     * el seed no es quien debe volver a activarla.
     */
    .onConflictDoUpdate({
      target: s.users.email,
      set: { name: sql`excluded.name`, platformRole: sql`excluded.platform_role` },
    })
    .returning({ id: s.users.id });

  if (!platformAdmin) throw new Error('No se pudo crear la cuenta de plataforma');

  const [client] = await db
    .insert(s.clients)
    .values({
      name: 'Familia Albornoz',
      slug: 'familia-albornoz',
      contactEmail: 'contacto@familiaalbornoz.test',
    })
    .onConflictDoUpdate({ target: s.clients.slug, set: { name: sql`excluded.name` } })
    .returning({ id: s.clients.id });

  if (!client) throw new Error('No se pudo crear el cliente de demostración');

  // Dominio `.test`, reservado por el RFC 2606 y que nunca resuelve. Con un dominio real
  // inventado, un correo de prueba podría acabar saliendo hacia el buzón de un extraño.
  const [owner] = await db
    .insert(s.users)
    .values({
      clientId: client.id,
      email: 'dueno@familiaalbornoz.test',
      name: 'Dueña de la cuenta',
      role: 'owner',
    })
    .onConflictDoUpdate({ target: s.users.email, set: { name: sql`excluded.name` } })
    .returning({ id: s.users.id });

  if (!owner) throw new Error('No se pudo crear el dueño del cliente');

  const [second] = await db
    .insert(s.clients)
    .values({
      name: 'Eventos Demo',
      slug: 'eventos-demo',
      contactEmail: 'contacto@eventosdemo.test',
    })
    .onConflictDoUpdate({ target: s.clients.slug, set: { name: sql`excluded.name` } })
    .returning({ id: s.clients.id });

  if (!second) throw new Error('No se pudo crear el segundo cliente');

  await db
    .insert(s.users)
    .values({
      clientId: second.id,
      email: 'dueno@eventosdemo.test',
      name: 'Dueña de Eventos Demo',
      role: 'owner',
    })
    .onConflictDoUpdate({ target: s.users.email, set: { name: sql`excluded.name` } });

  console.log('  1 cuenta de plataforma, 2 clientes, 2 dueños');
  return { clientId: client.id, userId: owner.id };
}


/**
 * Un segundo evento del MISMO cliente, en borrador.
 *
 * Existe por una razón concreta: el selector de evento de la cabecera de `/panel` solo
 * aparece cuando hay más de uno, así que con un único evento sembrado esa rama de la
 * interfaz nunca se ejecutaría en desarrollo — y el primero en verla sería un cliente real.
 *
 * Va sin contenido: ni sedes, ni cronograma, ni galería. Un evento recién creado se ve así,
 * y sembrarlo vacío obliga a que las pantallas aguanten ese estado en vez de dar por hecho
 * que todo evento viene relleno.
 */
async function seedSecondEvent(ids: {
  clientId: string;
  userId: string;
  templateId: string;
  themeId: string;
}): Promise<void> {
  await db
    .insert(s.events)
    .values({
      clientId: ids.clientId,
      eventTypeKey: 'quince',
      planKey: 'esencial',
      templateId: ids.templateId,
      themeId: ids.themeId,
      slug: 'sofia-xv',
      // Código fijo solo porque es un dato de desarrollo. Los de verdad los genera
      // `domain/events/access-code.ts` con un CSPRNG: aquí no protege nada.
      accessCode: 'dev001',
      title: 'XV años de Sofía',
      celebrantName: 'Sofía',
      eventTypeLabel: 'XV años',
      startsAt: localInstant('2026-11-22T19:00:00'),
      timeZone: TIME_ZONE,
      city: 'Mérida',
      status: 'draft',
      createdBy: ids.userId,
    })
    .onConflictDoUpdate({
      target: s.events.slug,
      set: { title: sql`excluded.title`, startsAt: sql`excluded.starts_at` },
    });
}

async function seedKamilahEvent(
  data: EventJson,
  ids: { clientId: string; userId: string; templateId: string; themeId: string },
): Promise<void> {
  const startsAt = localInstant(data.date);

  const [event] = await db
    .insert(s.events)
    .values({
      clientId: ids.clientId,
      eventTypeKey: 'presentation',
      planKey: 'premium',
      templateId: ids.templateId,
      themeId: ids.themeId,
      slug: KAMILAH_SLUG,
      accessCode: KAMILAH_ACCESS_CODE,
      title: `Presentación de ${data.fullName}`,
      celebrantName: data.name,
      celebrantFullName: data.fullName,
      celebrantLastName: data.lastName,
      eventTypeLabel: data.eventType,
      tagline: data.tagline,
      story: data.story,
      startsAt,
      timeZone: TIME_ZONE,
      city: data.city,
      status: 'published',
      publishedAt: new Date(),
      // Vigencia de un año a partir del evento, según la duración del plan.
      expiresAt: new Date(startsAt.getTime() + 365 * 24 * 60 * 60 * 1000),
      rsvpDeadline: '2026-10-01',
      musicUrl: data.music.src,
      musicTitle: data.music.title,
      heroImageUrl: '/assets/fondo.jpg',
      storyImageUrl: data.storyImage,
      closingImageUrl: data.finalImage,
      contactPhone: data.contact.phone,
      contactWhatsapp: data.contact.whatsapp.replace(/\D/g, ''),
      contactInstagram: data.contact.instagram,
      createdBy: ids.userId,
    })
    .onConflictDoUpdate({
      target: s.events.slug,
      // access_code queda fuera adrede: re-ejecutar el seed no debe invalidar una URL
      // que ya se compartió con los invitados.
      set: {
        title: sql`excluded.title`,
        tagline: sql`excluded.tagline`,
        story: sql`excluded.story`,
        startsAt: sql`excluded.starts_at`,
        status: sql`excluded.status`,
      },
    })
    .returning({ id: s.events.id });

  if (!event) throw new Error('No se pudo crear el evento');

  const scope = { eventId: event.id, clientId: ids.clientId };

  /*
   * Las listas ordenadas se reemplazan completas en lugar de hacer upsert fila por
   * fila. Un upsert por posición deja filas huérfanas si el cronograma se acorta, y
   * reordenar choca con la única (event_id, position).
   */
  await db.delete(s.eventVenues).where(eq(s.eventVenues.eventId, event.id));
  await db.insert(s.eventVenues).values([
    {
      ...scope,
      kind: 'church' as const,
      label: data.church.label,
      name: data.church.name,
      address: data.church.address,
      detail: data.church.detail,
      mapUrl: data.church.mapUrl,
      startsAt,
      position: 0,
    },
    {
      ...scope,
      kind: 'reception' as const,
      label: data.location.label,
      name: data.location.name,
      address: data.location.address,
      detail: data.location.detail,
      mapUrl: data.location.mapUrl,
      startsAt: scheduleInstant(data.date, '14:00'),
      position: 1,
    },
  ]);

  await db.delete(s.eventScheduleItems).where(eq(s.eventScheduleItems.eventId, event.id));
  await db.insert(s.eventScheduleItems).values(
    data.schedule.map((item, index) => ({
      ...scope,
      position: index,
      timeLabel: item.time,
      startsAt: scheduleInstant(data.date, item.time),
      title: item.title,
      description: item.description,
    })),
  );

  await db.delete(s.eventGalleryItems).where(eq(s.eventGalleryItems.eventId, event.id));
  await db.insert(s.eventGalleryItems).values(
    data.gallery.map((imageUrl, index) => ({
      ...scope,
      position: index,
      url: imageUrl,
      altText: `Recuerdo de celebración ${index + 1}`,
    })),
  );

  await db.delete(s.eventMessages).where(eq(s.eventMessages.eventId, event.id));
  await db.insert(s.eventMessages).values(
    data.messages.map((message, index) => ({
      ...scope,
      position: index,
      quote: message.quote,
      author: message.author,
      authorRole: message.role,
      groupLabel: message.group,
    })),
  );

  await db.delete(s.eventGiftRegistries).where(eq(s.eventGiftRegistries.eventId, event.id));
  await db.insert(s.eventGiftRegistries).values([
    {
      ...scope,
      position: 0,
      name: data.giftTable.name,
      detail: data.giftTable.detail,
      url: data.giftTable.url,
    },
  ]);

  // ── Bloques del evento ────────────────────────────────────────────────────────
  // Se copia la composición de la plantilla y se le añade el contenido que solo
  // el bloque sabe renderizar. Esto es lo que el Template Renderer va a consumir.
  const blockConfig: Record<string, Record<string, unknown>> = {
    hero: { intro: 'Con la bendición de Dios te invitamos a celebrar', dateLabel: data.dateLabel, timeLabel: data.timeLabel },
    story: { parents: data.parents, godparents: data.godparents, signature: data.name },
    party: data.party,
    rsvp: {
      deadlineText: 'Nos encantará contar contigo. Confirma antes del 1 de octubre.',
      helperText: 'Cuéntanos cuántos adultos y niños vienen antes de enviarlo.',
    },
    closing: {
      eyebrow: 'Con mucho cariño',
      title: 'Tu presencia hará este día aún más especial.',
      text: `Gracias por acompañarnos a dar gracias por la vida de ${data.name} y a celebrar sus tres años.`,
    },
  };

  const templateBlockRows = await db
    .select({
      blockKey: s.templateBlocks.blockKey,
      variantId: s.templateBlocks.defaultVariantId,
      position: s.templateBlocks.position,
    })
    .from(s.templateBlocks)
    .where(eq(s.templateBlocks.templateId, ids.templateId));

  await db
    .insert(s.eventBlocks)
    .values(
      templateBlockRows.map((row) => ({
        ...scope,
        blockKey: row.blockKey,
        variantId: row.variantId,
        position: row.position,
        isEnabled: true,
        config: blockConfig[row.blockKey] ?? {},
      })),
    )
    .onConflictDoUpdate({
      target: [s.eventBlocks.eventId, s.eventBlocks.blockKey],
      set: {
        variantId: sql`excluded.variant_id`,
        position: sql`excluded.position`,
        config: sql`excluded.config`,
      },
    });

  // ── Recordatorios ─────────────────────────────────────────────────────────────
  await db
    .insert(s.reminderSchedules)
    .values(
      [7, 3, 1, 0].map((offsetDays) => ({
        ...scope,
        offsetDays,
        channel: 'whatsapp' as const,
        isEnabled: offsetDays === 3,
        messageTemplate: null,
      })),
    )
    .onConflictDoNothing();

  console.log(
    `  evento "${data.fullName}": ${data.schedule.length} pasos de cronograma, ` +
      `${data.gallery.length} fotos, ${data.messages.length} mensajes, ` +
      `${templateBlockRows.length} bloques`,
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';
  console.log(`\n  URL para compartir:\n  ${siteUrl}/${KAMILAH_SLUG}/${KAMILAH_ACCESS_CODE}`);
}

async function main(): Promise<void> {
  const raw = await readFile(resolve(projectRoot, 'src/data/event.json'), 'utf8');
  const data = JSON.parse(raw) as EventJson;

  console.log('▸ Catálogos de plataforma…');
  await seedCatalogs();

  console.log('▸ Component Registry…');
  const { templateId, themeId } = await seedRegistry();

  console.log('▸ Cuentas y clientes…');
  const { clientId, userId } = await seedAccounts();

  console.log('▸ Evento de Kamilah…');
  await seedKamilahEvent(data, { clientId, userId, templateId, themeId });

  console.log('▸ Segundo evento del mismo cliente…');
  await seedSecondEvent({ clientId, userId, templateId, themeId });

  console.log('\n✓ Seed completo');
}

main()
  .catch((error: unknown) => {
    console.error('\n✗ Seed fallido\n');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
