"use client";

import { FloatingParticleProps } from "@/app/types/cursor";
import { useMotionValue, useSpring, motion } from "framer-motion";
import { FC, useEffect } from "react";

export const FloatingParticle: FC<FloatingParticleProps> = ({ index }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 50, stiffness: 100 };

  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  useEffect(() => {
    if (typeof window === "undefined") return;

    x.set(Math.random() * window.innerWidth);
    y.set(Math.random() * window.innerHeight);

    const intervalId = setInterval(() => {
      x.set(Math.random() * window.innerWidth);
      y.set(Math.random() * window.innerHeight);
    }, 5000 + index * 500);

    return () => clearInterval(intervalId);
  }, [x, y, index]);

  return (
    <motion.div
      className="absolute h-2 w-2 rounded-full bg-white opacity-50"
      style={{
        x: springX,
        y: springY,
      }}
    />
  );
};
