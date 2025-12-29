/**
 * SuccessCelebration - Visual feedback for successful actions
 * 
 * Features:
 * - Animated confetti effect
 * - Green checkmark with pulse animation
 * - Auto-dismisses after animation
 */

import { useEffect, useState } from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
}

const CONFETTI_COLORS = [
  '#9945FF', // Solana purple
  '#14F195', // Solana teal
  '#00D1FF', // Solana blue
  '#FFD700', // Gold
  '#FF6B6B', // Coral
];

function Confetti({ pieces }: { pieces: ConfettiPiece[] }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0 w-3 h-3 rounded-sm"
          style={{
            left: `${piece.x}%`,
            backgroundColor: piece.color,
            animation: `confetti-fall ${piece.duration}s ease-out ${piece.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

export function SuccessCelebration({
  show,
  onComplete,
  title = 'Success!',
  subtitle,
}: {
  show: boolean;
  onComplete?: () => void;
  title?: string;
  subtitle?: string;
}) {
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      
      // Generate confetti pieces
      const pieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      }));
      setConfettiPieces(pieces);

      // Auto-dismiss
      const timer = setTimeout(() => {
        setVisible(false);
        setConfettiPieces([]);
        onComplete?.();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <>
      {/* Confetti */}
      <Confetti pieces={confettiPieces} />

      {/* Success Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-sm">
        <div className="relative bg-dark-800 border border-dark-600 rounded-2xl p-8 max-w-sm w-full text-center animate-bounce-in">
          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-solana-purple/20 to-solana-teal/20 blur-xl" />
          
          {/* Content */}
          <div className="relative">
            {/* Animated Checkmark */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-solana-teal/20 rounded-full animate-ping" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-solana-teal to-solana-blue rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-white animate-scale-in" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-solana-teal animate-pulse" />
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              <Sparkles className="w-5 h-5 text-solana-teal animate-pulse" />
            </div>

            {subtitle && (
              <p className="text-gray-400 mb-6">{subtitle}</p>
            )}

            {/* Sponsored Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-solana-teal/10 border border-solana-teal/30 rounded-full">
              <div className="w-2 h-2 bg-solana-teal rounded-full" />
              <span className="text-sm font-medium text-solana-teal">Transaction Sponsored</span>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes scale-in {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out forwards;
        }

        .animate-scale-in {
          animation: scale-in 0.4s ease-out 0.2s forwards;
          transform: scale(0);
        }
      `}</style>
    </>
  );
}

/**
 * Smaller inline success indicator for less prominent confirmations
 */
export function SuccessToast({
  show,
  message = 'Success!',
  onComplete,
}: {
  show: boolean;
  message?: string;
  onComplete?: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 animate-slide-up">
      <div className="flex items-center gap-3 px-6 py-4 bg-solana-teal text-dark-900 rounded-xl shadow-lg shadow-solana-teal/20">
        <CheckCircle className="w-6 h-6" />
        <span className="font-semibold">{message}</span>
      </div>
      
      <style>{`
        @keyframes slide-up {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
