import confetti from "canvas-confetti";

export function fireConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#f97316", "#ef4444", "#eab308", "#22c55e", "#3b82f6"],
  });
}
