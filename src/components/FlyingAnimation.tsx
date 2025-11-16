"use client"

import React, { useEffect, useState, useRef } from 'react';

interface FlyingAnimationProps {
  isFlying: boolean;
  multiplier: number;
  crashPoint: number;
}

interface Point {
  x: number;
  y: number;
  multiplier: number;
}

const FlyingAnimation: React.FC<FlyingAnimationProps> = ({ isFlying, multiplier, crashPoint }) => {
  const [position, setPosition] = useState({ x: 10, y: 80 });
  const [crashed, setCrashed] = useState(false);
  const [pathPoints, setPathPoints] = useState<Point[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isFlying) {
      setPosition({ x: 10, y: 80 });
      setCrashed(false);
      setPathPoints([]);
      return;
    }

    // Check if crashed
    if (multiplier >= crashPoint) {
      setCrashed(true);
      return;
    }

    // Calculate position based on multiplier (1.00x to crash point)
    const progress = (multiplier - 100) / (crashPoint - 100);
    const x = 10 + (progress * 75); // Move from 10% to 85% horizontally
    const y = 80 - (progress * 65); // Move from 80% to 15% vertically
    
    setPosition({ x, y });
    
    // Add point to path
    setPathPoints(prev => [...prev, { x, y, multiplier }]);
  }, [isFlying, multiplier, crashPoint]);

  // Draw the graph line
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (pathPoints.length < 2) return;

    // Draw the line
    ctx.beginPath();
    ctx.strokeStyle = crashed ? '#ef4444' : '#10b981';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#10b981');
    gradient.addColorStop(0.5, '#3b82f6');
    gradient.addColorStop(1, crashed ? '#ef4444' : '#8b5cf6');
    ctx.strokeStyle = gradient;

    pathPoints.forEach((point, index) => {
      const x = (point.x / 100) * canvas.width;
      const y = (point.y / 100) * canvas.height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Fill area under the line
    if (pathPoints.length > 0) {
      ctx.lineTo((pathPoints[pathPoints.length - 1].x / 100) * canvas.width, canvas.height);
      ctx.lineTo((pathPoints[0].x / 100) * canvas.width, canvas.height);
      ctx.closePath();

      const fillGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      fillGradient.addColorStop(0, crashed ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)');
      fillGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = fillGradient;
      ctx.fill();
    }
  }, [pathPoints, crashed]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Y-axis labels (multipliers) */}
      <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-between py-8 text-white/60 text-sm font-mono">
        <div>{(crashPoint / 100).toFixed(2)}x</div>
        <div>{((crashPoint * 0.75) / 100).toFixed(2)}x</div>
        <div>{((crashPoint * 0.5) / 100).toFixed(2)}x</div>
        <div>{((crashPoint * 0.25) / 100).toFixed(2)}x</div>
        <div>1.00x</div>
      </div>

      {/* X-axis grid lines */}
      <div className="absolute inset-0">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute w-full border-t border-white/5"
            style={{ top: `${20 + i * 15}%` }}
          />
        ))}
      </div>

      {/* Canvas for drawing the graph line */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Flying object (rocket) */}
      {(isFlying || crashed) && (
        <div
          className="absolute transition-all duration-100 ease-linear z-10"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {crashed ? (
            // Explosion effect
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <div className="w-20 h-20 rounded-full bg-red-500 opacity-75"></div>
              </div>
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 flex items-center justify-center shadow-2xl">
                <span className="text-4xl">💥</span>
              </div>
            </div>
          ) : (
            // Flying rocket
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 animate-pulse">
                <div className="w-24 h-24 rounded-full bg-green-400 opacity-30 blur-xl"></div>
              </div>
              
              {/* Main rocket */}
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 flex items-center justify-center shadow-2xl border-4 border-white/30">
                <span className="text-3xl">🚀</span>
              </div>
              
              {/* Trail effect */}
              <div className="absolute -right-10 top-1/2 -translate-y-1/2 flex gap-1">
                <div className="w-3 h-3 rounded-full bg-green-400 opacity-60 animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-green-400 opacity-40 animate-pulse"></div>
                <div className="w-1 h-1 rounded-full bg-green-400 opacity-20 animate-pulse"></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FlyingAnimation;
