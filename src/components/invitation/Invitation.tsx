'use client';

import { useEffect, useState } from 'react';
import { ChevronUp, Heart, Music2, Pause } from 'lucide-react';
import { useBackgroundMusic } from '../../hooks/useBackgroundMusic';
import { Hero } from '../sections/invitation/Hero';
import { Story } from '../sections/invitation/Story';
import { Gallery } from '../sections/invitation/Gallery';
import { Details } from '../sections/invitation/Details';
import { Fiesta } from '../sections/invitation/Fiesta';
import { Schedule } from '../sections/invitation/Schedule';
import { Location } from '../sections/invitation/Location';
import { Rsvp } from '../sections/invitation/Rsvp';
import { EventMessages } from '../ui/design-testimonial';
import event from '../../data/event.json';
import '../../App.css';

export function Invitation() {
  const { playing, blocked, toggle } = useBackgroundMusic(event.music.src);
  // El botón de "volver arriba" estorba en el hero: ahí lo que queremos es que bajen.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 320);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return <main><Hero /><Story /><Details /><Fiesta /><Schedule /><Gallery /><EventMessages /><Location /><Rsvp /><section className="closing"><img src={event.finalImage} alt="Confetti de colores celebrando la fiesta" /><div className="closing-copy"><span className="eyebrow">Con mucho cariño</span><h2>Tu presencia hará este día aún más especial.</h2><p>Gracias por acompañarnos a dar gracias por la vida de {event.name} y a celebrar sus tres años.</p><Heart size={22} fill="currentColor" /></div></section><footer><div><strong>{event.fullName} {event.lastName}</strong><span>{event.dateLabel} · {event.city}</span></div><div><a href={`tel:${event.contact.phone.replace(/\s/g, '')}`}>{event.contact.phone}</a><a href={`https://instagram.com/${event.contact.instagram.slice(1)}`} target="_blank" rel="noreferrer">{event.contact.instagram}</a></div><small>© 2026 · {event.parents.father} y {event.parents.mother}</small></footer><button className={`music${blocked ? ' blocked' : ''}`} onClick={toggle} title={event.music.title} aria-label={playing ? 'Pausar música' : 'Activar música'}>{playing ? <Pause size={17} /> : <Music2 size={17} />}<span>{playing ? 'Pausar' : blocked ? 'Activar música' : 'Música'}</span></button><a className={`scroll-top${scrolled ? '' : ' hidden'}`} href="#inicio" aria-label="Volver arriba" tabIndex={scrolled ? undefined : -1}><ChevronUp size={18} /></a></main>;
}