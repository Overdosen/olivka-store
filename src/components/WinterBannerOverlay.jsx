'use client';

import { useEffect, useRef, memo } from 'react';

// ─── Snow Canvas ───────────────────────────────────────────────────────────────
const SnowCanvas = memo(function SnowCanvas() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    // 130 на десктопі, 65 на мобільних
    const isMobile = window.innerWidth < 768;
    const FLAKES = isMobile ? 65 : 130;
    const flakes = Array.from({ length: FLAKES }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 3.6 + 1.2,
      speed: Math.random() * 0.55 + 0.25,
      drift: Math.random() * 0.35 - 0.175,
      opacity: Math.random() * 0.5 + 0.25,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      flakes.forEach(f => {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${f.opacity})`;
        ctx.fill();

        f.y += f.speed;
        f.x += f.drift;

        if (f.y > canvas.height + 4) {
          f.y = -4;
          f.x = Math.random() * canvas.width;
        }
        if (f.x > canvas.width + 4) f.x = -4;
        if (f.x < -4) f.x = canvas.width + 4;
      });
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    />
  );
});

// ─── Зимові іскорки в небі ──────────────────────────────────────────────────────
function StarSparkles() {
  const stars = [
    { x: 5, y: 10, s: 0.6 }, { x: 14, y: 20, s: 0.4 }, { x: 22, y: 6, s: 0.5 },
    { x: 34, y: 14, s: 0.35 }, { x: 44, y: 8, s: 0.6 }, { x: 54, y: 22, s: 0.4 },
    { x: 67, y: 10, s: 0.5 }, { x: 77, y: 24, s: 0.35 }, { x: 86, y: 12, s: 0.6 },
    { x: 93, y: 6, s: 0.4 }, { x: 9, y: 38, s: 0.3 }, { x: 62, y: 36, s: 0.35 },
  ];

  return (
    <>
      {stars.map((s, i) => (
        <div
          key={i}
          className="winter-sparkle"
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            fontSize: `${14 * s.s}px`,
            opacity: 0.7,
            color: '#b8c9d9',
            pointerEvents: 'none',
            zIndex: 8,
            animationDelay: `${i * 0.35}s`,
          }}
        >
          ❄
        </div>
      ))}
    </>
  );
}

// ─── Головний оверлей зимового середовища ──────────────────────────────────────────
export default function WinterBannerOverlay() {
  return (
    <>
      {/* ⭐ Ніжні зимові іскорки */}
      <StarSparkles />

      {/* ❄ Спокійний снігопад поверх усього */}
      <SnowCanvas />
    </>
  );
}
