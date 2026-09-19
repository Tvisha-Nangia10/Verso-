import { useEffect, useRef } from 'react';

type Point = { x: number; y: number; vx: number; vy: number };

/**
 * The drifting particle constellation behind the auth screens.
 * Ported from initCanvas() in the original prototype.
 */
export default function ConstellationCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let pts: Point[] = [];
    let frame = 0;

    const resize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
      pts = Array.from({ length: 60 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
      }));
    };

    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i];
          const b = pts[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(232,150,58,${0.12 * (1 - d / 120)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas className={className ?? 'auth-left-canvas'} ref={ref} />;
}

/** The Google mark used on both auth buttons. */
export function GoogleIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none">
      <path d="M15.68 8.18c0-.57-.05-1.12-.15-1.64H8v3.1h4.3a3.67 3.67 0 01-1.6 2.42v2h2.6c1.52-1.4 2.38-3.46 2.38-5.88z" fill="#4285F4" />
      <path d="M8 16c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-2.7.75 4.8 4.8 0 01-4.52-3.32H.8v2.06A8 8 0 008 16z" fill="#34A853" />
      <path d="M3.48 9.49A4.8 4.8 0 013.2 8c0-.52.09-1.02.25-1.49V4.45H.8a8 8 0 000 7.1l2.68-2.06z" fill="#FBBC05" />
      <path d="M8 3.2a4.34 4.34 0 013.07 1.2l2.28-2.28A7.7 7.7 0 008 0 8 8 0 00.8 4.45l2.68 2.06A4.8 4.8 0 018 3.2z" fill="#EA4335" />
    </svg>
  );
}

export function BackChevron() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M9 2L4 7l5 5" />
    </svg>
  );
}
