import { GlowingCursorProps } from "@/app/types/cursor";
import { FC } from "react";
import { motion } from "framer-motion";

export const GlowingCursor: FC<GlowingCursorProps> = ({
  mousePosition,
  cursorVariant,
}) => {
  const spring = {
    type: "spring",
    stiffness: 500,
    damping: 28,
  };

  const variants = {
    default: {
      opacity: 1,
      height: 10,
      width: 10,
      fontSize: "16px",
      backgroundColor: "#1d4ed8",
      x: mousePosition.x - 5,
      y: mousePosition.y - 5,
    },
    text: {
      opacity: 1,
      backgroundColor: "white",
      height: 80,
      width: 80,
      fontSize: "32px",
      x: mousePosition.x - 40,
      y: mousePosition.y - 40,
    },
  };

  return (
    <motion.div
      className="cursor"
      variants={variants}
      animate={cursorVariant}
      transition={spring}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 9999,
        mixBlendMode: "difference",
        borderRadius: "50%",
      }}
    />
  );
};
