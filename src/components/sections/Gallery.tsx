import { useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { X } from 'lucide-react';
import event from '../../data/event.json';
import { Section } from '../shared/Section';
import './Gallery.css';

function ParallaxPhoto({ image, index, onOpen }: { image: string; index: number; onOpen: (image: string) => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const direction = index % 2 === 0 ? -1 : 1;
  const y = useTransform(scrollYProgress, [0, 1], [60 * direction, -60 * direction]);
  const scale = useTransform(scrollYProgress, [0, .5, 1], [.92, 1, .92]);
  const opacity = useTransform(scrollYProgress, [0, .12, .88, 1], [.25, 1, 1, .25]);
  return <motion.button ref={ref} className={`parallax-photo photo-${index + 1}`} onClick={() => onOpen(image)} aria-label={`Abrir foto ${index + 1}`} style={{ y, scale, opacity }} whileHover={{ scale: 1.02 }}><img src={image} alt={`Recuerdo de celebración ${index + 1}`} loading="lazy" /></motion.button>;
}

export function Gallery() {
  const [active, setActive] = useState<string | null>(null);
  return <Section id="galeria" eyebrow="Recuerdos que atesoramos" title="Galería"><div className="parallax-gallery">{event.gallery.map((image, index) => <ParallaxPhoto key={image} image={image} index={index} onOpen={setActive} />)}</div><AnimatePresence>{active && <motion.div className="lightbox" role="dialog" aria-modal="true" aria-label="Vista ampliada de foto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActive(null)}><button onClick={() => setActive(null)} aria-label="Cerrar fotografía"><X /></button><motion.img src={active} alt="Fotografía ampliada" initial={{ scale: .93 }} animate={{ scale: 1 }} onClick={eventClick => eventClick.stopPropagation()} /></motion.div>}</AnimatePresence></Section>;
}
