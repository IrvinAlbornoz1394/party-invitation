import { z } from 'zod';
import { blockActionSchema, blockIconSchema, line } from './shared';

/**
 * El contenido del bloque **pie de página**, y con él el contrato de sus tres componentes.
 *
 * Es lo último de la invitación y lo que más se relee sin darse cuenta: quién invita, qué día,
 * en qué ciudad y cómo preguntar una duda. En una invitación digital hace además el papel que
 * en una impresa hace el reverso de la tarjeta.
 *
 * ## Los contactos son una lista
 *
 * No hay `phone`, `whatsapp` ni `instagram` con nombre propio. Igual que en los detalles: cada
 * familia deja lo que usa —unos el teléfono de la mamá, otros un WhatsApp compartido, otros
 * nada— y con campos fijos habría que añadir uno por cada servicio que aparezca. Con una lista,
 * el icono viene del vocabulario común y el destino se escribe entero, así que un enlace a
 * Waze o a un formulario entra sin tocar código.
 *
 * ## El monograma
 *
 * Las iniciales —«K», «A&D»— son un recurso de papelería que en digital casi nadie usa y que
 * cierra la invitación con la misma marca con la que empezó. Es opcional y tiene un tope de seis
 * caracteres a propósito: en cuanto crece deja de ser un monograma y pasa a ser un nombre mal
 * puesto en un círculo.
 */
export const footerLinkSchema = z.object({
  icon: blockIconSchema,
  label: line(60),
  href: z.string().trim().min(1).max(500),
});

export type FooterLink = z.output<typeof footerLinkSchema>;

export const footerContentSchema = z.object({
  /** Las iniciales del monograma: «K», «A&D». Máximo seis caracteres. */
  monogram: line(6).nullable().default(null),
  /** Quién invita, tal como se firma: «Kamilah Michelle Albornoz Meléndez». */
  names: line(120),
  dateLabel: line(80).nullable().default(null),
  city: line(80).nullable().default(null),
  /** Una última línea, si hace falta: «Gracias por acompañarnos». */
  message: line(200).nullable().default(null),
  /** Teléfono, WhatsApp, Instagram… lo que cada familia quiera dejar. */
  links: z.array(footerLinkSchema).max(5).default([]),
  /** El crédito de abajo del todo: «© 2027 · Irvin y Lucero». */
  credits: line(120).nullable().default(null),
  /** El enlace de volver al principio. Sin él, el pie es un callejón sin salida. */
  topAction: blockActionSchema.nullable().default(null),
});

/** El contenido del pie, ya validado y con los valores por defecto puestos. */
export type FooterContent = z.output<typeof footerContentSchema>;

/** Lo que se guarda en `event_blocks.config`, antes de aplicar los valores por defecto. */
export type FooterContentInput = z.input<typeof footerContentSchema>;
