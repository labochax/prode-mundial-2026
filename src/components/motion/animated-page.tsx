"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type AnimatedPageProps = {
  children: ReactNode;
  className?: string;
};

export function AnimatedPage({ children, className }: AnimatedPageProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
