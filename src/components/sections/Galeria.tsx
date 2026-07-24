import { motion } from 'framer-motion';
import { Container } from '../shared/Container';

export function Galeria() {
  const photos = Array.from({ length: 4 }, (_, i) => i + 1);
  return (
    <section className="py-20 bg-bg">
      <Container>
        <h2 className="text-3xl font-serif text-text mb-12 text-center">Galería</h2>
        <div className="grid grid-cols-2 gap-4">
            {photos.map((i) => (
                <motion.div 
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    className="aspect-square bg-primary/20 rounded-lg overflow-hidden"
                >
                    <div className="w-full h-full bg-gray-200" />
                </motion.div>
            ))}
        </div>
      </Container>
    </section>
  );
}
