import React from 'react';

interface VisualizerProps {
  isPlaying: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ isPlaying }) => {
  const barCount = 24;

  return (
    <div className="flex items-end justify-center gap-1 h-32 w-full max-w-md mx-auto mb-2 opacity-80">
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className={`w-2 bg-gradient-to-t from-indigo-500 via-purple-500 to-pink-500 rounded-t-md visualizer-bar transition-all duration-300`}
          style={{
            animationDuration: `${0.5 + Math.random() * 0.8}s`,
            animationPlayState: isPlaying ? 'running' : 'paused',
            height: isPlaying ? undefined : '8%',
          }}
        ></div>
      ))}
    </div>
  );
};