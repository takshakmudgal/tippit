"use client";

import type React from "react";
import { useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

export function TipJar() {
  const level = 50;
  const jarRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#121212] p-4">
      <div className="w-full max-w-md bg-[#1E1E1E] rounded-xl shadow-lg overflow-hidden p-6 border border-[#333333]">
        <div className="relative h-80 w-48 mx-auto mb-6">
          <div
            ref={jarRef}
            className="absolute inset-0 border-4 border-[#333333] rounded-b-xl rounded-t-sm bg-[#1A1A1A]"
          >
            <div className="absolute -right-8 top-10 h-20 w-8 border-4 border-l-0 border-[#333333] rounded-r-xl"></div>
            <motion.div
              className={"absolute bottom-0 left-0 right-0 bg-[#4AE3B5]"}
              initial={{ height: `${(40 / 100) * 100}%` }}
              animate={{
                height: `${(Math.min(level, 100) / 100) * 100}%`,
                opacity: [0.7, 0.9, 0.7],
              }}
              transition={{
                height: { type: "spring", damping: 8, stiffness: 80 },
                opacity: { repeat: Number.POSITIVE_INFINITY, duration: 2 },
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-[#5CFFCB]/50 backdrop-blur-sm"></div>

              <AnimatePresence>
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-[#FFFFFF]/20"
                    initial={{
                      x: Math.random() * 100 + "%",
                      y: "100%",
                      opacity: 0.2,
                      scale: Math.random() * 0.5 + 0.5,
                    }}
                    animate={{
                      y: "0%",
                      opacity: [0.2, 0.4, 0.2],
                      scale: [1, 1.2, 0.8],
                    }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      duration: Math.random() * 4 + 3,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
            {/* {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="absolute left-0 w-3 h-0.5 bg-[#555555]"
                style={{ bottom: `${(i + 1) * 10}%` }}
              >
                <span className="absolute left-4 text-xs text-[#999999]">
                  {(i + 1) * 10}
                </span>
              </div>
            ))} */}
          </div>
        </div>
      </div>
    </div>
  );
}
