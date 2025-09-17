"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

interface ParticleSystemProps {
  particleCount?: number;
  colors?: string[];
  className?: string;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  particleCount = 50,
  colors: propColors,
  className = "",
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  // Memoize the default colors to prevent infinite re-renders
  const colors = useMemo(() => {
    return propColors || ["#3B82F6", "#8B5CF6", "#06B6D4", "#10B981"];
  }, [propColors]);

  useEffect(() => {
    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    setParticles(newParticles);
  }, [particleCount]); // Removed colors from dependency array

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.opacity,
          }}
          animate={{
            x: [0, particle.speedX * 80, 0],
            y: [0, particle.speedY * 80, 0],
            opacity: [particle.opacity, particle.opacity * 0.4, particle.opacity],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 12 + Math.random() * 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};
