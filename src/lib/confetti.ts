import confetti from "canvas-confetti";

const COLORS = [
  "hsl(245, 82%, 67%)",
  "hsl(200, 90%, 60%)",
  "hsl(340, 80%, 60%)",
  "hsl(50, 95%, 60%)",
];

/**
 * Fire a celebratory confetti burst from both sides of the screen.
 * Returns a cleanup function that cancels the animation loop.
 */
export function fireConfetti(durationMs = 2000): () => void {
  const end = Date.now() + durationMs;
  let cancelled = false;

  const frame = () => {
    if (cancelled) return;
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: COLORS,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: COLORS,
    });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  requestAnimationFrame(frame);

  return () => {
    cancelled = true;
  };
}
