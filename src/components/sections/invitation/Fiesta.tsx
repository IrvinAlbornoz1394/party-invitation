'use client';

import { motion } from 'framer-motion';
import { Cake, Camera, Candy, type LucideIcon, Music, PartyPopper, Sparkles } from 'lucide-react';
import event from '../../../data/event.json';
import saja1 from '../../../assets/saja/saja-1.png';
import saja2 from '../../../assets/saja/saja-2.png';
import saja3 from '../../../assets/saja/saja-3.png';
import saja4 from '../../../assets/saja/saja-4.png';
import saja5 from '../../../assets/saja/saja-5.png';
import './Fiesta.css';

const icons: Record<string, LucideIcon> = { bounce: PartyPopper, candy: Candy, camera: Camera, cake: Cake };
/** Los 5 personajes del tema. Decorativos: el lineup ya los nombra en texto. */
const cast = [saja1, saja2, saja3, saja4, saja5];

/** Entra cuando su pareja aparece en pantalla, así se van revelando uno por uno al bajar. */
function Char({ index }: { index: number }) {
  return <motion.div className={`fiesta-char char-${index + 1}`} aria-hidden="true" initial={{ opacity: 0, y: 24, scale: .9 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, amount: .35 }} transition={{ duration: .55, ease: 'easeOut' }}>
    <img src={cast[index].src} alt="" loading="lazy" />
  </motion.div>;
}

export function Fiesta() {
  const { eyebrow, theme, title, intro, lineup, attractions, musicNote } = event.party;
  return <section id="fiesta" className="fiesta">
    <div className="fiesta-glow" aria-hidden="true" /><div className="fiesta-stars" aria-hidden="true" />
    <div className="wrap">
      <motion.div className="fiesta-heading" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .25 }}>
        <span className="eyebrow">{eyebrow}</span><span className="fiesta-theme"><Sparkles size={14} /> Tema: {theme}</span><h2>{title}</h2><p>{intro}</p>
      </motion.div>
      <div className="fiesta-lineup" aria-label="Integrantes del tema de la fiesta">{lineup.map((member, i) => <motion.span key={member} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .07 }}>{member}</motion.span>)}</div>
      <div className="fiesta-pairs">{attractions.map(({ icon, name, detail }, i) => { const Icon = icons[icon] ?? Sparkles; return <div className="fiesta-pair" key={name}><motion.article className="fiesta-card" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .3 }}><span><Icon size={21} /></span><h3>{name}</h3><p>{detail}</p></motion.article><Char index={i} /></div>; })}</div>
      <div className="fiesta-pair fiesta-pair-music"><div className="fiesta-music"><Music size={16} /><strong>Se va a escuchar</strong><p>{musicNote}</p></div><Char index={4} /></div>
    </div>
  </section>;
}