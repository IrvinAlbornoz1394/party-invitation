import { useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useTransform, type MotionStyle } from 'framer-motion';
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

function ZoomingFinalPhoto({ image, onOpen }: { image: string; onOpen: (image: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const grow = useTransform(scrollYProgress, [0, .7], [0, 1], { clamp: true });
  return <div ref={ref} className="final-photo-stage"><motion.div className="final-photo-sticky" style={{ '--grow': grow } as MotionStyle}><button className="final-photo" onClick={() => onOpen(image)} aria-label="Abrir última foto a pantalla completa"><img src={image} alt="Recuerdo final de la celebración" loading="lazy" /></button><span className="final-photo-caption">Un recuerdo para siempre</span></motion.div></div>;
}

export function Gallery() {
  const [active, setActive] = useState<string | null>(null);
  const finalImage = event.gallery.at(-1);
  return <Section id="galeria" eyebrow="Recuerdos que atesoramos" title="Galería"><div className="parallax-gallery">{event.gallery.slice(0, -1).map((image, index) => <ParallaxPhoto key={image} image={image} index={index} onOpen={setActive} />)}</div>{finalImage && <ZoomingFinalPhoto image={finalImage} onOpen={setActive} />}<AnimatePresence>{active && <motion.div className="lightbox" role="dialog" aria-modal="true" aria-label="Vista ampliada de foto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActive(null)}><button onClick={() => setActive(null)} aria-label="Cerrar fotografía"><X /></button><motion.img src={active} alt="Fotografía ampliada" initial={{ scale: .93 }} animate={{ scale: 1 }} onClick={eventClick => eventClick.stopPropagation()} /></motion.div>}</AnimatePresence></Section>;
}
