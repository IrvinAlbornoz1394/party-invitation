import { motion } from 'framer-motion';
import { CalendarDays, MapPin } from 'lucide-react';
import event from '../../data/event.json';
import { Countdown } from '../shared/Countdown';

export function Hero() { return <section id="inicio" className="hero-invite"><img src={event.heroImage} alt="Ambientación elegante para una boda" className="hero-image" /><div className="hero-shade" /><motion.div className="hero-content" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .9 }}><span className="eyebrow light">{event.eventType}</span><p className="hero-intro">Tenemos el honor de invitarte a celebrar</p><h1>{event.fullName}</h1><p className="hero-tagline">{event.tagline}</p><div className="hero-date"><CalendarDays size={17}/><span>{event.dateLabel} · {event.city}</span></div><Countdown date={event.date} /><div className="hero-actions"><a className="button primary" href="#rsvp">Confirmar asistencia</a><a className="button ghost" href="#ubicacion"><MapPin size={17}/> Ver ubicación</a></div></motion.div><span className="scroll-cue">Desliza para descubrir <i /></span></section>; }
