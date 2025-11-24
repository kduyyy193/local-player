import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX, View } from 'lucide-react';
import { PlaybackMode } from '../types';

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  mode: PlaybackMode;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  showVisualizer: boolean;
  onShowVisualizer: () => void;
}

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  mode,
  onToggleShuffle,
  onToggleRepeat,
  playbackRate,
  onPlaybackRateChange,
  showVisualizer,
  onShowVisualizer
}) => {

  const handleSpeedClick = () => {
    const speeds = [0.5, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    onPlaybackRateChange(speeds[nextIndex]);
  };

  const isShuffle = mode === PlaybackMode.SHUFFLE;
  const isRepeatOne = mode === PlaybackMode.REPEAT_ONE;

  return (
    <div className="flex flex-col gap-4 w-full p-6 glass-panel rounded-t-3xl border-t border-slate-700">
      {/* Progress Bar */}
      <div className="w-full flex items-center gap-3 text-xs text-slate-400 font-medium font-mono">
        <span className="w-10 text-right">{formatTime(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
        />
        <span className="w-10">{formatTime(duration)}</span>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-between w-full">

        {/* Volume */}
        <div className="flex items-center gap-2 w-1/4 group">
          <button onClick={() => onVolumeChange(volume === 0 ? 1 : 0)} className="text-slate-400 hover:text-white transition-colors">
            {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-400 hover:accent-white opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>

        {/* Playback Buttons */}
        <div className="flex items-center gap-6">
          <button onClick={onPrev} className="text-slate-300 hover:text-white hover:scale-110 transition-transform">
            <SkipBack size={28} fill="currentColor" />
          </button>

          <button
            onClick={onPlayPause}
            className="w-16 h-16 flex items-center justify-center bg-indigo-500 hover:bg-indigo-400 text-white rounded-full shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:scale-105 active:scale-95"
          >
            {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
          </button>

          <button onClick={onNext} className="text-slate-300 hover:text-white hover:scale-110 transition-transform">
            <SkipForward size={28} fill="currentColor" />
          </button>
        </div>

        {/* Tools: Shuffle, Repeat, Speed */}
        <div className="flex items-center justify-end gap-3 w-1/4">
          {/* Speed Control */}
          <button
            onClick={handleSpeedClick}
            className="flex items-center justify-center w-10 h-8 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-transparent hover:border-slate-600"
            title="Playback Speed"
          >
            {playbackRate}x
          </button>

          {/* Visualizer */}
          <button
            onClick={onShowVisualizer}
            className={`p-2 rounded-full transition-all ${showVisualizer ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
            title="Visualizer"
          >
            <View size={18} />
          </button>

          {/* Shuffle */}
          <button
            onClick={onToggleShuffle}
            className={`p-2 rounded-full transition-all ${isShuffle ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
            title="Shuffle"
          >
            <Shuffle size={18} />
          </button>

          {/* Repeat */}
          <button
            onClick={onToggleRepeat}
            className={`p-2 rounded-full transition-all relative ${isRepeatOne ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
            title={isRepeatOne ? "Repeat One" : "Repeat All (Default)"}
          >
            <Repeat size={18} />
            {isRepeatOne && <span className="absolute text-[8px] font-bold top-1 right-1.5">1</span>}
          </button>
        </div>
      </div>
    </div>
  );
};