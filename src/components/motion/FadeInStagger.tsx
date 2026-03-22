import { motion } from "motion/react";
import type { Variants } from "motion/react";
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

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

export function FadeInStagger({
  children,
  delay = 0,
  stagger = 0.06,
  className,
}: FadeInStaggerProps) {
  return (
    <motion.div
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: stagger,
            delayChildren: delay,
          },
        },
      }}
      initial="hidden"
      animate="show"
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
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}
