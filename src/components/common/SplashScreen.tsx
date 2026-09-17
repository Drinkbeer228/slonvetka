import React, { useState, useEffect, useRef } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const finishCalled = useRef(false);

  const handleFinish = () => {
    if (!finishCalled.current) {
      finishCalled.current = true;
      onFinish();
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isPlaying) {
        handleFinish();
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [isPlaying]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center">
      <video
        autoPlay
        playsInline
        muted
        onPlaying={() => setIsPlaying(true)}
        onEnded={handleFinish}
        onError={handleFinish}
        className="w-full h-full object-cover"
        // src can be provided from props or hardcoded if requested. 
        // We'll use a placeholder URL that fails or loads quickly.
        src="https://assets.mixkit.co/videos/preview/mixkit-elephant-walking-in-the-savanna-at-sunset-10022-large.mp4"
      />
    </div>
  );
};
