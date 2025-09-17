"use client";

import { motion, useAnimation, useInView, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

type AnimationDirection = "up" | "down" | "left" | "right" | "scale" | "rotate" | "fade";
type AnimationType = "spring" | "tween" | "inertia";
type EasingType = "easeInOut" | "easeOut" | "easeIn" | "anticipate" | "backIn" | "backOut" | "circIn" | "circOut";

interface AnimatedInViewProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: AnimationDirection;
  amount?: number;
  duration?: number;
  type?: AnimationType;
  easing?: EasingType;
  stiffness?: number;
  damping?: number;
  mass?: number;
  stagger?: number;
  parallax?: boolean;
  parallaxOffset?: number;
  once?: boolean;
  margin?: string;
  threshold?: number;
}

export const AnimatedInView: React.FC<AnimatedInViewProps> = ({
  children,
  className,
  delay = 0,
  direction = "up",
  amount = 75,
  duration = 1.2,
  type = "spring",
  easing = "easeOut",
  stiffness = 120,
  damping = 20,
  mass = 1,
  stagger = 0,
  parallax = false,
  parallaxOffset = 50,
  once = true,
  margin = "-100px",
  threshold = 0.1,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once });
  const mainControls = useAnimation();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Parallax transform
  const y = useTransform(scrollYProgress, [0, 1], [parallaxOffset, -parallaxOffset]);

  useEffect(() => {
    if (isInView) {
      mainControls.start("visible");
    }
  }, [isInView, mainControls]);

  const getVariants = () => {
    const baseVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    };

    switch (direction) {
      case "up":
        return {
          hidden: { 
            opacity: 0, 
            y: amount,
            scale: 0.95,
            filter: "blur(5px)"
          },
          visible: { 
            opacity: 1, 
            y: 0,
            scale: 1,
            filter: "blur(0px)"
          },
        };
      case "down":
        return {
          hidden: { 
            opacity: 0, 
            y: -amount,
            scale: 0.95,
            filter: "blur(5px)"
          },
          visible: { 
            opacity: 1, 
            y: 0,
            scale: 1,
            filter: "blur(0px)"
          },
        };
      case "left":
        return {
          hidden: { 
            opacity: 0, 
            x: amount,
            scale: 0.95,
            rotateY: -15,
            filter: "blur(5px)"
          },
          visible: { 
            opacity: 1, 
            x: 0,
            scale: 1,
            rotateY: 0,
            filter: "blur(0px)"
          },
        };
      case "right":
        return {
          hidden: { 
            opacity: 0, 
            x: -amount,
            scale: 0.95,
            rotateY: 15,
            filter: "blur(5px)"
          },
          visible: { 
            opacity: 1, 
            x: 0,
            scale: 1,
            rotateY: 0,
            filter: "blur(0px)"
          },
        };
      case "scale":
        return {
          hidden: { 
            opacity: 0, 
            scale: 0.3,
            rotate: -180,
            filter: "blur(8px)"
          },
          visible: { 
            opacity: 1, 
            scale: 1,
            rotate: 0,
            filter: "blur(0px)"
          },
        };
      case "rotate":
        return {
          hidden: { 
            opacity: 0, 
            rotate: -45,
            scale: 0.8,
            y: amount
          },
          visible: { 
            opacity: 1, 
            rotate: 0,
            scale: 1,
            y: 0
          },
        };
      case "fade":
        return {
          hidden: { 
            opacity: 0,
            scale: 1.1,
            filter: "blur(5px)"
          },
          visible: { 
            opacity: 1,
            scale: 1,
            filter: "blur(0px)"
          },
        };
      default:
        return baseVariants;
    }
  };

  const getTransition = () => {
    if (type === "spring") {
      return {
        stiffness,
        damping,
        mass,
        delay: delay + stagger,
        ease: easing,
      };
    } else if (type === "tween") {
      return {
        duration,
        delay: delay + stagger,
        ease: easing,
      };
    } else {
      return {
        velocity: 50,
        delay: delay + stagger,
      };
    }
  };

  return (
    <motion.div
      ref={ref}
      variants={getVariants()}
      initial="hidden"
      animate={mainControls}
      transition={getTransition()}
      style={parallax ? { y } : undefined}
      className={className}
      layoutId={undefined}
      whileHover={{
        scale: 1.005,
        transition: {
          type: "spring",
          stiffness: 600,
          damping: 35,
          mass: 0.8
        }
      }}
    >
      {children}
    </motion.div>
  );
};
