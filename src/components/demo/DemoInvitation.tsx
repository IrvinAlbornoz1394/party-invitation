import { useState } from 'react';
import { ChevronUp, Heart, Music2, Pause } from 'lucide-react';
import { Hero } from '../sections/demo/Hero';
import { Story } from '../sections/demo/Story';
import { Gallery } from '../sections/demo/Gallery';
import { Details } from '../sections/demo/Details';
import { Schedule } from '../sections/demo/Schedule';
import { Location } from '../sections/demo/Location';
import { Rsvp } from '../sections/demo/Rsvp';
import { EventMessages } from '../ui/design-testimonial';
import event from '../../data/event.json';
import '../../App.css';

const nav = [['historia', 'Historia'], ['detalles', 'Detalles'], ['galeria', 'Galería'], ['rsvp', 'Confirmar']];

export function DemoInvitation() {
  const [playing, setPlaying] = useState(false);
  return <main><header className="topbar"><a className="brand" href="#inicio" aria-label="Ir al inicio"><Heart size={15} fill="currentColor" /> {event.name}</a><nav aria-label="Navegación principal">{nav.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav></header><Hero /><Story /><Details /><Schedule /><Gallery /><EventMessages /><Location /><Rsvp /><section className="closing"><img src={event.finalImage} alt="Celebración de quince años" /><div className="closing-copy"><span className="eyebrow">Con mucho cariño</span><h2>Tu presencia hará esta noche aún más especial.</h2><p>Gracias por acompañarme a celebrar un momento que guardaré para siempre.</p><Heart size={22} fill="currentColor" /></div></section><footer><div><strong>{event.fullName}</strong><span>{event.dateLabel}</span></div><div><a href={`tel:${event.contact.phone.replace(/\s/g, '')}`}>{event.contact.phone}</a><a href={`https://instagram.com/${event.contact.instagram.slice(1)}`} target="_blank" rel="noreferrer">{event.contact.instagram}</a></div><small>© 2026 · Hecho para celebrar momentos extraordinarios</small></footer><button className="music" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pausar música' : 'Activar música'}>{playing ? <Pause size={17} /> : <Music2 size={17} />}<span>{playing ? 'Pausar' : 'Música'}</span></button><a className="scroll-top" href="#inicio" aria-label="Volver arriba"><ChevronUp size={18} /></a></main>;
}
