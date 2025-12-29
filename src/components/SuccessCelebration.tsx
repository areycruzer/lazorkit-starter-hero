import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface SuccessCelebrationProps {
  show: boolean;
  title: string;
  subtitle: string;
  onComplete: () => void;
}

export function SuccessCelebration({ show, title, subtitle, onComplete }: SuccessCelebrationProps) {
  useEffect(() => {
    if (show) {
      // Confetti burst
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 7,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#9945FF', '#14F195', '#007AFF']
        });
        confetti({
          particleCount: 7,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#9945FF', '#14F195', '#007AFF']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();

      // Auto dismiss
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-dark-800/90 backdrop-blur-xl border border-solana-green/20 rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl shadow-solana-green/10"
          >
            <div className="w-16 h-16 rounded-full bg-solana-green/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-solana-green" />
            </div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-2">
              {title}
            </h2>
            <p className="text-gray-400">{subtitle}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
