'use client';

import { motion } from 'framer-motion';
import { CalendarDays, ChevronDown } from 'lucide-react';
import event from '../../../data/event.json';
import heroImage from '../../../assets/fondo.jpg';
import { Countdown } from '../../shared/Countdown';

export function Hero() { return <section id="inicio" className="hero-invite"><img src={heroImage.src} alt="Ilustración de los Saja Boys, el tema de la fiesta" className="hero-image" /><div className="hero-shade" /><motion.div className="hero-content" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .9 }}><span className="eyebrow light">{event.eventType}</span><p className="hero-intro">Con la bendición de Dios te invitamos a celebrar</p><h1>{event.fullName}</h1><span className="hero-lastname">{event.lastName}</span><p className="hero-tagline">{event.tagline}</p><div className="hero-date"><CalendarDays size={17}/><span>{event.dateLabel} · {event.city}</span></div><Countdown date={event.date} /><div className="hero-actions"><a className="button primary" href="#historia">Saber más</a></div></motion.div><a className="scroll-cue" href="#historia" aria-label="Bajar para ver la invitación"><span>Desliza para ver más</span><ChevronDown size={19} /></a></section>; }