import { motion } from "motion/react";
import type { ReactNode } from "react";

interface FadeInStaggerProps {
  children: ReactNode;
  /** Delay before the stagger sequence starts */
  delay?: number;
  /** Time between each child animating in */
  stagger?: number;
  duration?: number;
  className?: string;
}

const container = {
  hidden: {},
  show: (opts: { delay: number; stagger: number }) => ({
    transition: {
      staggerChildren: opts.stagger,
      delayChildren: opts.delay,
    },
  }),
};

const item = (duration: number) => ({
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
});

export function FadeInStagger({
  children,
  delay = 0,
  stagger = 0.06,
  duration = 0.4,
  className,
}: FadeInStaggerProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      custom={{ delay, stagger }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Wrap each direct child of FadeInStagger to get the stagger effect */
export function StaggerItem({
  children,
  className,
  duration = 0.4,
}: {
  children: ReactNode;
  className?: string;
  duration?: number;
}) {
  return (
    <motion.div variants={item(duration)} className={className}>
      {children}
    </motion.div>
  );
}
