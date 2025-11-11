import { useEffect, useRef } from 'react';

interface VoiceWaveformProps {
  isActive: boolean;
  type: 'listening' | 'speaking';
}

export function VoiceWaveform({ isActive, type }: VoiceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;
    const bars = 40;

    let phase = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      if (isActive) {
        const barWidth = width / bars;

        for (let i = 0; i < bars; i++) {
          const amplitude = type === 'listening'
            ? Math.sin(phase + i * 0.3) * 15 + Math.random() * 10
            : Math.sin(phase + i * 0.2) * 20 + 5;

          const barHeight = Math.abs(amplitude);
          const x = i * barWidth;

          const gradient = ctx.createLinearGradient(0, centerY - barHeight, 0, centerY + barHeight);
          if (type === 'listening') {
            gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
            gradient.addColorStop(1, 'rgba(37, 99, 235, 0.4)');
          } else {
            gradient.addColorStop(0, 'rgba(16, 185, 129, 0.8)');
            gradient.addColorStop(1, 'rgba(5, 150, 105, 0.4)');
          }

          ctx.fillStyle = gradient;
          ctx.fillRect(x + 2, centerY - barHeight / 2, barWidth - 4, barHeight);
        }

        phase += 0.1;
      } else {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.3)';
        const flatBarHeight = 4;
        for (let i = 0; i < bars; i++) {
          const x = i * (width / bars);
          ctx.fillRect(x + 2, centerY - flatBarHeight / 2, (width / bars) - 4, flatBarHeight);
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, type]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={80}
      className="w-full h-20 rounded-lg"
    />
  );
}
