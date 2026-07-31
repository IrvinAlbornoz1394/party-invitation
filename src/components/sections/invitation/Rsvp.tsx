import { MessageCircle } from 'lucide-react';
import event from '../../../data/event.json';
import { Section } from '../../shared/Section';

/** Formato de wa.me: solo dígitos, con lada de país y sin +, espacios ni guiones. */
const host = event.contact.whatsapp.replace(/\D/g, '');
/** El mensaje va completo y listo para enviar. Para cambiar el texto, edita estas líneas. */
const message = [
  `¡Hola! Confirmo mi asistencia a la presentación de ${event.fullName} 🎉`,
  '',
  `${event.dateLabel} · ${event.city}`,
].join('\n');
const waUrl = `https://wa.me/${host}?text=${encodeURIComponent(message)}`;

export function Rsvp() {
  return <Section id="rsvp" eyebrow="Celebremos juntos" title="Confirma tu asistencia" tone="ivory">
    <div className="rsvp-cta">
      <p>Nos encantará contar contigo. Confirma antes del 1 de octubre.</p>
      <a className="button primary" href={waUrl} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Confirmar por WhatsApp</a>
      <small>Se abre WhatsApp con el mensaje listo. Cuéntanos cuántos adultos y niños vienen antes de enviarlo.</small>
    </div>
  </Section>;
}
