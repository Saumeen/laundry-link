"use client";

import { motion, useAnimation, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  cursor?: boolean;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 50,
  delay = 0,
  className = "",
  cursor = true,
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else {
      setIsComplete(true);
    }
  }, [currentIndex, text, speed]);

  return (
    <span className={className}>
      {displayedText}
      {cursor && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="ml-1"
        >
          |
        </motion.span>
      )}
    </span>
  );
};

interface RevealTextProps {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}

export const RevealText: React.FC<RevealTextProps> = ({
  text,
  className = "",
  delay = 0,
  stagger = 0.05,
}) => {
  const words = text.split(" ");
  
  return (
    <div className={className}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 15, rotateX: -45 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 0.5,
            delay: delay + index * stagger,
            type: "spring",
            stiffness: 120,
            damping: 15,
            mass: 0.8,
          }}
          className="inline-block mr-2"
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

interface GradientTextProps {
  text: string;
  className?: string;
  gradient?: string;
  animate?: boolean;
}

export const GradientText: React.FC<GradientTextProps> = ({
  text,
  className = "",
  gradient = "from-blue-500 via-purple-500 to-pink-500",
  animate = true,
}) => {
  return (
    <motion.span
      className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent ${className}`}
      animate={animate ? {
        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      } : {}}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "linear",
      }}
      style={{
        backgroundSize: "200% 200%",
      }}
    >
      {text}
    </motion.span>
  );
};
