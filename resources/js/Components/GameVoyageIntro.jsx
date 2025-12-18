import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Head } from '@inertiajs/react';

import { Gamepad2 } from 'lucide-react';

// Save this as: resources/js/Components/GameVoyageIntro.jsx
export default function GameVoyageIntro({ onComplete }) {
  const [showIntro, setShowIntro] = useState(true);
  const [controllerFalling, setControllerFalling] = useState(false);
  const [crashed, setCrashed] = useState(false);

  useEffect(() => {
    // Letter bounce sequence: 2 seconds
    const bounceTimer = setTimeout(() => {
      setControllerFalling(true);
    }, 2000);

    // Controller falls and crashes: 1.5 seconds after falling starts
    const crashTimer = setTimeout(() => {
      setCrashed(true);
    }, 3500);

    // Fade out entire intro: 1 second after crash
    const fadeTimer = setTimeout(() => {
      setShowIntro(false);
    }, 5000);

    // Call onComplete after fade is complete
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 6000);

    return () => {
      clearTimeout(bounceTimer);
      clearTimeout(crashTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, []); // Empty dependency array - only run once on mount

  const letters = ['GameVoyage'];

  const letterVariants = {
    initial: { y: -100, opacity: 0 },
    animate: (i) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        type: "spring",
        damping: 20,
        stiffness: 200,
      }
    }),
    crashed: (i) => {
      // Letters get affected based on position (middle letters shake more)
      const middle = letters.length / 2;
      const distance = Math.abs(i - middle);
      const intensity = Math.max(0, 1 - (distance / middle));
      
      return {
        y: [0, -20 * intensity, 10 * intensity, -5 * intensity, 0],
        rotate: [0, -15 * intensity, 10 * intensity, -5 * intensity, 0],
        transition: {
          duration: 0.6,
          times: [0, 0.2, 0.4, 0.7, 1]
        }
      };
    }
  };

  const controllerVariants = {
    initial: { y: -200, rotate: 0, opacity: 0 },
    falling: {
      y: 150,
      rotate: 720,
      opacity: 1,
      transition: {
        duration: 1.5,
        ease: "easeIn"
      }
    },
    bounceOff: {
      y: -50,
      rotate: 800,
      opacity: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const containerVariants = {
    visible: { opacity: 1 },
    exit: {
      opacity: 0,
      transition: {
        duration: 1,
        ease: "easeInOut"
      }
    }
  };

  if (!showIntro) return null;

  return (
    
    <AnimatePresence>
      <motion.div
        variants={containerVariants}
        initial="visible"
        exit="exit"
        className="fixed inset-0 z-[100] bg-gradient-to-br from-white-900 via-white-900 to-white-900 flex items-center justify-center overflow-hidden"
      >
        {/* Animated background particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-violet-400 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: 0.6
              }}
              animate={{
                y: [null, Math.random() * window.innerHeight],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Falling Controller */}
          <AnimatePresence>
            {controllerFalling && (
              <motion.div
                variants={controllerVariants}
                initial="initial"
                animate={crashed ? "bounceOff" : "falling"}
                className="absolute z-20"
                style={{ top: -100 }}
              >
               
              </motion.div>
            )}
          </AnimatePresence>

          {/* GameVoyage Letters */}
          <div className="flex gap-1 sm:gap-2 md:gap-3">
            {letters.map((letter, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={letterVariants}
                initial="initial"
                animate={crashed ? "crashed" : "animate"}
                className="relative"
              >
                <motion.span
                  className="text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 via-green-500 to-violet-500 drop-shadow-[0_5px_2px_rgba(0,0,0,0.5)]"
                  
                >
                  {letter}
                </motion.span>

                {/* Impact effect on crash */}
                {crashed && i >= 3 && i <= 6 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-16 h-16 border-4 border-violet-500 rounded-full" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Subtitle appears after crash */}
          <AnimatePresence>
            {crashed && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 text-xl md:text-2xl text-purple-300 font-light tracking-widest"
              >
                Your Gaming Universe Awaits
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Loading indicator */}
        <motion.div
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
        >
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-violet-400 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

