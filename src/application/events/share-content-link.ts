/**
 * A dónde se manda al cliente a llenar su evento cuando ya tiene sesión: el formulario de su panel.
 *
 * Lo usa el correo del alta. El enlace que el admin pega en WhatsApp es otro —`/llenar/<token>`,
 * que abre la sesión sin código (`manage-content-link.ts`)— y sustituyó al correo con este enlace
 * que mandaba «Enviar enlace al cliente» (2026-11-18).
 */
export function contentUrlFor(siteUrl: string, eventId: string): string {
  return `${siteUrl}/panel/eventos/${eventId}/contenido`;
}
