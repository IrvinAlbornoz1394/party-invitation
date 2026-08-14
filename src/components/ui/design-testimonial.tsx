'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import event from '../../data/event.json';
import './design-testimonial.css';

export function EventMessages() {
  const [activeIndex, setActiveIndex] = useState(0);
  const element = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0); const mouseY = useMotionValue(0);
  const x = useSpring(mouseX, { damping: 25, stiffness: 200 }); const y = useSpring(mouseY, { damping: 25, stiffness: 200 });
  const numberX = useTransform(x, [-200, 200], [-18, 18]); const numberY = useTransform(y, [-200, 200], [-8, 8]);
  const current = event.messages[activeIndex];
  const next = () => setActiveIndex(index => (index + 1) % event.messages.length);
  const prev = () => setActiveIndex(index => (index - 1 + event.messages.length) % event.messages.length);
  useEffect(() => { const timer = window.setInterval(next, 6000); return () => window.clearInterval(timer); }, []);
  return <section className="messages-section" aria-labelledby="messages-title"><div className="wrap"><div className="section-heading"><span className="eyebrow">Palabras que atesoramos</span><h2 id="messages-title">Mensajes para {event.name}</h2></div><div ref={element} className="messages-carousel" onMouseMove={e => { const rect = element.current?.getBoundingClientRect(); if (rect) { mouseX.set(e.clientX - rect.left - rect.width / 2); mouseY.set(e.clientY - rect.top - rect.height / 2); } }}>
    <motion.span className="message-index" style={{ x: numberX, y: numberY }} aria-hidden="true"><AnimatePresence mode="wait"><motion.span key={activeIndex} initial={{ opacity: 0, scale: .84 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}>{String(activeIndex + 1).padStart(2, '0')}</motion.span></AnimatePresence></motion.span>
    <aside className="message-rail"><span>Mensajes</span><div><motion.i animate={{ height: `${((activeIndex + 1) / event.messages.length) * 100}%` }} /></div></aside><div className="message-content"><AnimatePresence mode="wait"><motion.div key={activeIndex} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }} className="message-group"><i />{current.group}</motion.div></AnimatePresence><div className="message-quote"><AnimatePresence mode="wait"><motion.blockquote key={activeIndex} initial="hidden" animate="visible" exit="exit">{current.quote.split(' ').map((word, i) => <motion.span key={`${word}-${i}`} variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: .38, delay: i * .035 } }, exit: { opacity: 0, y: -9 } }}>{word}&nbsp;</motion.span>)}</motion.blockquote></AnimatePresence></div><div className="message-footer"><AnimatePresence mode="wait"><motion.div key={activeIndex} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}><i /><p>{current.author}<small>{current.role}</small></p></motion.div></AnimatePresence><div className="message-controls"><button onClick={prev} aria-label="Ver mensaje anterior"><ChevronLeft size={17} /></button><button onClick={next} aria-label="Ver siguiente mensaje"><ChevronRight size={17} /></button></div></div></div>
  </div></div></section>;
}