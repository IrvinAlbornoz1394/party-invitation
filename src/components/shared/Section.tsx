import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export function Section({ id, eyebrow, title, children, tone = '' }: { id?: string; eyebrow?: string; title?: string; children: ReactNode; tone?: string }) {
  return <section id={id} className={`section ${tone}`}><div className="wrap">{(eyebrow || title) && <motion.div className="section-heading" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .25 }}><span className="eyebrow">{eyebrow}</span>{title && <h2>{title}</h2>}</motion.div>}{children}</div></section>;
}
