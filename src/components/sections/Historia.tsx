import { motion } from 'framer-motion';
import { Container } from '../shared/Container';
import eventData from '../../data/event.json';

export function Historia() {
  return (
    <section className="py-20 bg-ivory">
      <Container>
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="text-center"
        >
            <h2 className="text-3xl font-serif text-text mb-8">Mi Historia</h2>
            <p className="text-text/80 leading-relaxed font-light">
                {eventData.story}
            </p>
        </motion.div>
      </Container>
    </section>
  );
}
