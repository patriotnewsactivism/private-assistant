import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  volume: number; // 0.0 to 1.0
  isActive: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ volume, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  // Smooth volume transition
  const smoothVolume = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Decay or attack smoothing
      const target = isActive ? volume * 2 : 0.05; // Base idle movement
      smoothVolume.current += (target - smoothVolume.current) * 0.2;
      
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Draw the wave
      ctx.beginPath();
      ctx.moveTo(0, centerY);

      const amplitude = Math.max(5, smoothVolume.current * height * 0.8);
      const frequency = 0.1;
      const speed = Date.now() * 0.005;

      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin(x * frequency + speed) * amplitude * Math.sin(x / width * Math.PI);
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = isActive ? (amplitude > 20 ? '#22d3ee' : '#3b82f6') : '#4b5563';
      ctx.lineWidth = 3;
      ctx.shadowBlur = isActive ? 15 : 0;
      ctx.shadowColor = '#06b6d4';
      ctx.stroke();

      // Mirror reflection for cool effect
      ctx.globalAlpha = 0.2;
      ctx.save();
      ctx.translate(0, height);
      ctx.scale(1, -1);
      ctx.stroke();
      ctx.restore();
      ctx.globalAlpha = 1.0;

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, volume]);

  return (
    <div className="w-full h-32 bg-gray-950 rounded-xl border border-gray-800 overflow-hidden relative">
        <div className="absolute top-2 left-2 text-xs text-gray-500 font-mono tracking-wider">AUDIO_FEED_V1</div>
        <canvas 
            ref={canvasRef} 
            width={600} 
            height={128} 
            className="w-full h-full"
        />
    </div>
  );
};

export default Visualizer;