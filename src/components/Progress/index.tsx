"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { FloatingParticle } from "../FloatingParticle";
import { GlowingCursor } from "../Cursor";
import { Card } from "../ui/card";
import { Hammer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CursorVariant, MousePosition } from "@/app/types/cursor";

// indicates the progress of the project
export const Progress = () => {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 700 };
  const moveX = useSpring(mouseX, springConfig);
  const moveY = useSpring(mouseY, springConfig);
  const rotateX = useTransform(moveY, [-300, 300], [10, -10]);
  const rotateY = useTransform(moveX, [-300, 300], [-10, 10]);

  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0,
    y: 0,
  });

  const [cursorVariant, setCursorVariant] = useState<CursorVariant>("default");

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = ref.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePosition({ x, y });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    mouseX.set(mousePosition.x);
    mouseY.set(mousePosition.y);
  }, [mousePosition, mouseX, mouseY]);

  return (
    <div className="text-white" ref={ref}>
      {
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83zm20.97 0l9.315 9.314-1.414 1.414L34.828 0h2.83zM22.344 0L13.03 9.314l1.414 1.414L25.172 0h-2.83zM32 0l12.142 12.142-1.414 1.414L30 .828 17.272 13.556l-1.414-1.414L28 0h4zM.284 0l28 28-1.414 1.414L0 2.544V0h.284zM0 5.373l25.456 25.455-1.414 1.415L0 8.2V5.374zm0 5.656l22.627 22.627-1.414 1.414L0 13.86v-2.83zm0 5.656l19.8 19.8-1.415 1.413L0 19.514v-2.83zm0 5.657l16.97 16.97-1.414 1.415L0 25.172v-2.83zM0 28l14.142 14.142-1.414 1.414L0 30.828V28zm0 5.657L11.314 44.97 9.9 46.386l-9.9-9.9v-2.828zm0 5.657L8.485 47.8 7.07 49.212 0 42.143v-2.83zm0 5.657l5.657 5.657-1.414 1.415L0 47.8v-2.83zm0 5.657l2.828 2.83-1.414 1.413L60 53.456v-2.83zM54.627 60L30 35.373 5.373 60H8.2L30 38.2 51.8 60h2.827zm-5.656 0L30 41.03 11.03 60h2.828L30 43.858 46.142 60h2.83zm-5.656 0L30 46.686 16.686 60h2.83L30 49.515 40.485 60h2.83zm-5.657 0L30 52.343 22.343 60h2.83L30 55.172 34.828 60h2.83zM32 60l-2-2-2 2h4zM59.716 0l-28 28 1.414 1.414L60 2.544V0h-.284zM60 5.373L34.544 30.828l1.414 1.415L60 8.2V5.374zm0 5.656L37.373 33.656l1.414 1.414L60 13.86v-2.83zm0 5.656l-19.8 19.8 1.415 1.413L60 19.514v-2.83zm0 5.657l-16.97 16.97 1.414 1.415L60 25.172v-2.83zM60 28L45.858 42.142l1.414 1.414L60 30.828V28zm0 5.657L48.686 44.97l1.415 1.415 9.9-9.9v-2.828zm0 5.657L51.515 47.8l1.414 1.413 7.07-7.07v-2.83zm0 5.657l-5.657 5.657 1.414 1.415L60 47.8v-2.83zm0 5.657l-2.828 2.83 1.414 1.413L60 53.456v-2.83zM39.9 16.385l1.414-1.414L30 3.658 18.686 14.97l1.415 1.415 9.9-9.9 9.9 9.9zm-2.83 2.828l1.415-1.414L30 9.313 21.515 17.8l1.414 1.413 7.07-7.07 7.07 7.07zm-2.827 2.83l1.414-1.416L30 14.97l-5.657 5.657 1.414 1.415L30 17.8l4.243 4.242zm-2.83 2.827l1.415-1.414L30 20.626l-2.828 2.83 1.414 1.414L30 23.456l1.414 1.414zM56.87 59.414L58.284 58 30 29.716 1.716 58l1.414 1.414L30 32.544l26.87 26.87z' fill='%23333' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E')",
            backgroundSize: "120px 120px",
            x: moveX,
            y: moveY,
          }}
        />
      }
      {[...Array(20)].map((_, index) => (
        <FloatingParticle key={index} index={index} />
      ))}
      <GlowingCursor
        mousePosition={mousePosition}
        cursorVariant={cursorVariant}
      />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <motion.div
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          className="perspective-1000"
        >
          <Card className="w-full max-w-md overflow-hidden bg-zinc-900/50 backdrop-blur-sm">
            <motion.div
              className="flex flex-col items-center justify-center p-6 sm:p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <motion.h1
                className="mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-4xl font-bold tracking-tighter text-transparent sm:text-6xl"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, delay: 0.5 }}
                onMouseEnter={() => setCursorVariant("text")}
                onMouseLeave={() => setCursorVariant("default")}
              >
                tippit
              </motion.h1>
              <motion.div
                className="mb-6 flex items-center text-xl font-semibold text-zinc-300 sm:text-2xl"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <span>Under Construction</span>
                <Hammer className="ml-2 h-6 w-6 animate-bounce text-zinc-400 sm:h-8 sm:w-8" />
              </motion.div>
              <motion.span
                className="text-lg text-zinc-400 sm:text-xl"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
              >
                <a
                  href="https://x.com/takshakmudgal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-row items-center gap-2 text-lg text-zinc-400 transition-colors hover:text-blue-400 sm:text-xl"
                  onMouseEnter={() => setCursorVariant("text")}
                  onMouseLeave={() => setCursorVariant("default")}
                >
                  @takshakmudgal
                </a>
              </motion.span>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
