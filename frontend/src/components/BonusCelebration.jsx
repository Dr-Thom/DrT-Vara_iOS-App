import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

const BonusCelebration = ({ isOpen, onClose, bonusAmount = 1.0 }) => {
  useEffect(() => {
    if (!isOpen) return;

    // Fire confetti
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, [isOpen]); // Only depend on isOpen

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 rounded-3xl p-1 max-w-md w-full mx-4 animate-scaleIn shadow-2xl">
        <div className="bg-white rounded-3xl p-8 text-center">
          {/* Trophy Icon */}
          <div className="text-8xl mb-4 animate-bounce">🏆</div>
          
          {/* Celebration Message */}
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600 mb-3">
            CONGRATULATIONS!
          </h2>
          
          <div className="text-6xl font-black text-yellow-500 mb-4 animate-pulse">
            ${bonusAmount.toFixed(2)} USD
          </div>
          
          <p className="text-xl font-semibold text-gray-700 mb-2">
            🎉 Bonus Unlocked! 🎉
          </p>
          
          <p className="text-gray-600 mb-6">
            You've completed enough tasks to unlock your special bonus reward! Keep up the amazing work!
          </p>

          {/* Stats */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border-2 border-green-200">
            <p className="text-sm text-gray-600 mb-2">Your bonus has been added to your balance</p>
            <p className="text-2xl font-bold text-green-600">
              ≈ ₱{(bonusAmount * 55).toFixed(0)} PHP
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg"
          >
            ✨ Awesome! Continue Earning ✨
          </button>

          {/* Floating Emojis */}
          <div className="absolute top-4 left-4 text-3xl animate-float">🎊</div>
          <div className="absolute top-4 right-4 text-3xl animate-float-delayed">🎉</div>
          <div className="absolute bottom-4 left-8 text-3xl animate-float">💰</div>
          <div className="absolute bottom-4 right-8 text-3xl animate-float-delayed">⭐</div>
        </div>
      </div>
    </div>
  );
};

export default BonusCelebration;
