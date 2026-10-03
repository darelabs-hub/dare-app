import React, { useEffect, useRef } from 'react';

export function triggerConfetti() {
  window.dispatchEvent(new CustomEvent('trigger-confetti'));
}

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'circle' | 'square' | 'triangle';
}

export const ConfettiEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = [
      '#6366f1', // Indigo
      '#8b5cf6', // Purple
      '#d946ef', // Fuchsia
      '#06b6d4', // Cyan
      '#10b981', // Emerald
      '#f59e0b', // Amber
      '#ef4444', // Red
    ];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const createParticles = () => {
      const count = 120;
      const shapes: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];
      const newParticles: Particle[] = [];

      for (let i = 0; i < count; i++) {
        // Start particles from multiple explosion points (left corner, right corner, and center bottom)
        const side = Math.random();
        let startX = canvas.width / 2;
        let startY = canvas.height + 20;
        let speedX = (Math.random() - 0.5) * 15;
        let speedY = -Math.random() * 18 - 8;

        if (side < 0.3) {
          startX = 0;
          startY = canvas.height * 0.8;
          speedX = Math.random() * 12 + 6;
          speedY = -Math.random() * 15 - 5;
        } else if (side > 0.7) {
          startX = canvas.width;
          startY = canvas.height * 0.8;
          speedX = -Math.random() * 12 - 6;
          speedY = -Math.random() * 15 - 5;
        }

        newParticles.push({
          x: startX,
          y: startY,
          size: Math.random() * 7 + 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          speedX: speedX,
          speedY: speedY,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 8,
          opacity: 1,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
        });
      }

      particlesRef.current = [...particlesRef.current, ...newParticles];
    };

    const updateAndDraw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const activeParticles: Particle[] = [];

      particlesRef.current.forEach((p) => {
        // Apply physics
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.38; // gravity
        p.speedX *= 0.98; // air drag
        p.rotation += p.rotationSpeed;
        
        // Slow fade when falling past middle of the screen
        if (p.speedY > 0) {
          p.opacity -= 0.009;
        }

        if (p.opacity > 0 && p.y < canvas.height + 50 && p.x > -50 && p.x < canvas.width + 50) {
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;

          ctx.beginPath();
          if (p.shape === 'circle') {
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          } else if (p.shape === 'square') {
            ctx.rect(-p.size / 2, -p.size / 2, p.size, p.size);
          } else if (p.shape === 'triangle') {
            ctx.moveTo(0, -p.size / 2);
            ctx.lineTo(p.size / 2, p.size / 2);
            ctx.lineTo(-p.size / 2, p.size / 2);
            ctx.closePath();
          }
          ctx.fill();
          ctx.restore();

          activeParticles.push(p);
        }
      });

      particlesRef.current = activeParticles;

      if (particlesRef.current.length > 0) {
        animationFrameRef.current = requestAnimationFrame(updateAndDraw);
      } else {
        animationFrameRef.current = null;
      }
    };

    const handleTrigger = () => {
      createParticles();
      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(updateAndDraw);
      }
    };

    window.addEventListener('trigger-confetti', handleTrigger);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('trigger-confetti', handleTrigger);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[100] pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};
