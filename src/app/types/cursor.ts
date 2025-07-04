export interface MousePosition {
  x: number;
  y: number;
}

export type CursorVariant = "default" | "text";

export interface GlowingCursorProps {
  mousePosition: MousePosition;
  cursorVariant: CursorVariant;
}

export interface NavigatorWithMsMaxTouchPoints extends Navigator {
  msMaxTouchPoints?: number;
}

export interface FloatingParticleProps {
  index: number;
}
