import { motion, useReducedMotion, useInView } from "motion/react";
import { type ReactNode, useRef } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  className?: string;
  /** HTML tag to render (default: div) */
  as?: "div" | "section" | "header" | "article" | "aside" | "span";
  /** How much of the element must be visible to trigger (0-1) */
  threshold?: number;
  /** Once triggered, stay visible */
  once?: boolean;
  /** Scale from this value to 1 */
  scale?: number;
}

const getOffset = (direction: string, distance: number) => {
  switch (direction) {
    case "up":
      return { y: distance };
    case "down":
      return { y: -distance };
    case "left":
      return { x: distance };
    case "right":
      return { x: -distance };
    default:
      return {};
  }
};

export function ScrollReveal({
  children,
  delay = 0,
  duration = 0.7,
  direction = "up",
  distance = 60,
  className,
  as = "div",
  threshold = 0.15,
  once = true,
  scale,
}: ScrollRevealProps) {
  const Component = motion[as];
  const offset = getOffset(direction, distance);
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: threshold });

  const visible = isInView || prefersReduced;

  return (
    <Component
      ref={ref}
      animate={
        visible
          ? {
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
            }
          : {
              opacity: 0,
              ...offset,
              ...(scale !== undefined ? { scale } : {}),
            }
      }
      initial={{
        opacity: 0,
        ...offset,
        ...(scale !== undefined ? { scale } : {}),
      }}
      transition={
        prefersReduced
          ? { duration: 0 }
          : {
              duration,
              delay: visible ? delay : 0,
              ease: [0.22, 1, 0.36, 1],
            }
      }
      className={className}
    >
      {children}
    </Component>
  );
}

interface ScrollRevealStaggerProps {
  children: ReactNode;
  stagger?: number;
  delay?: number;
  className?: string;
}

export function ScrollRevealStagger({
  children,
  stagger = 0.1,
  delay = 0,
  className,
}: ScrollRevealStaggerProps) {
  return (
    <motion.div
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
            delayChildren: delay,
          },
        },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScrollRevealItem({
  children,
  className,
  direction = "up",
  distance = 40,
}: {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
}) {
  const offset = getOffset(direction, distance);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, ...offset },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
