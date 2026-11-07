'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCouple } from './couple';

/**
 * La barra fija del teléfono: sus nombres, los días que faltan y «Cotizar» siempre a un dedo.
 *
 * Sale cuando la portada se va —antes estorbaría al formulario— y se esconde al llegar al cierre,
 * que ya tiene sus propios botones. Solo existe en el teléfono: en el escritorio la cabecera
 * lleva el «Cotizar» a la vista todo el tiempo.
 */
export function MobileDock() {
  const { displayNames, daysLeft, date } = useCouple();
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const hero = document.getElementById('inicio');
      const closing = document.getElementById('cotizar-cierre');
      const heroGone = hero ? hero.getBoundingClientRect().bottom < 0 : window.scrollY > window.innerHeight;
      const closingNear = closing ? closing.getBoundingClientRect().top < window.innerHeight * 0.9 : false;
      setVisible(heroGone && !closingNear);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const when = !date ? '' : daysLeft === 0 ? ' · ¡es hoy!' : ` · faltan ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}`;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="dock"
          initial={reduced ? { opacity: 0 } : { y: '140%' }}
          animate={reduced ? { opacity: 1 } : { y: 0 }}
          exit={reduced ? { opacity: 0 } : { y: '140%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-40 md:hidden"
        >
          <div className="flex items-center gap-3 rounded-full bg-(--h-wine) py-2 pr-2 pl-4 text-(--h-wine-ink) shadow-[0_14px_34px_-12px_rgb(43_14_25/0.7)] ring-1 ring-white/10">
            <Image
              src="/brand/isologo.png"
              alt=""
              width={851}
              height={693}
              sizes="32px"
              className="h-mark-cream h-auto w-7 shrink-0 opacity-90"
            />
            <p className="m-0 min-w-0 flex-1 truncate text-[14px] leading-tight">
              <span className="h-script text-[19px]">{displayNames}</span>
              <span className="text-(--h-wine-ink)/75">{when}</span>
            </p>
            <Link href="/cotizar" className="h-button h-button--gold min-h-10 shrink-0 px-5">
              Cotizar
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
