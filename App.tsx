import React, { useState, useRef, useEffect, useCallback } from "react";
import { Playlist } from "./components/Playlist";
import { Controls } from "./components/Controls";
import { Visualizer } from "./components/Visualizer";
import { Track, PlaybackMode } from "./types";
import { Play, Sparkles, Info, Camera } from "lucide-react";
import { getSongInsight } from "./services/geminiService";
import * as storageService from "./services/storageService";

function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [mode, setMode] = useState<PlaybackMode>(PlaybackMode.NORMAL);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [showVisualizer, setShowVisualizer] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(new Audio());

  // Initial Data Load
  useEffect(() => {
    const initApp = async () => {
      try {
        // Load settings
        const savedVolume = await storageService.getSetting("volume");
        if (savedVolume !== null) setVolume(savedVolume);

        const savedCover = await storageService.getSetting("coverImage");
        if (savedCover) setCoverImage(savedCover);

        // Load tracks
        const savedTracks = await storageService.getTracksFromDB();
        if (savedTracks.length > 0) {
          setTracks(savedTracks);
          setCurrentTrack(savedTracks[0]);
        }
      } catch (error) {
        console.error("Failed to restore data", error);
      } finally {
        setIsRestoring(false);
      }
    };

    initApp();
  }, []);

  // Handle file loading
  const handleLoadFolder = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newTracks: Track[] = [];
    const audioTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/x-m4a"];

    Array.from(files).forEach((file: File) => {
      if (
        audioTypes.some(
          (type) => file.type.includes(type) || file.type === ""
        ) &&
        file.name.match(/\.(mp3|wav|ogg|m4a)$/i)
      ) {
        newTracks.push({
          id: crypto.randomUUID(),
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          url: URL.createObjectURL(file),
          file: file,
        });
      }
    });

    // Revoke old URLs to prevent memory leaks
    tracks.forEach((t) => URL.revokeObjectURL(t.url));

    const sortedTracks = newTracks.sort((a, b) => a.name.localeCompare(b.name));
    setTracks(sortedTracks);

    // Persist to DB
    storageService.saveTracksToDB(sortedTracks).catch(console.error);

    if (sortedTracks.length > 0) {
      setCurrentTrack(sortedTracks[0]);
      setIsPlaying(false);
      setAiInsight(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await storageService.fileToBase64(file);
        setCoverImage(base64);
        storageService.saveSetting("coverImage", base64);
      } catch (err) {
        console.error("Error saving image", err);
      }
    }
  };

  const handleClearData = async () => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn xóa toàn bộ nhạc và cài đặt đã lưu?"
      )
    ) {
      await storageService.clearAllData();
      setTracks([]);
      setCurrentTrack(null);
      setIsPlaying(false);
      setCoverImage(null);
      setAiInsight(null);
      // Also clear audio source
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
    storageService.saveSetting("volume", val);
  };

  const handleShowVisualizer = () => {
    setShowVisualizer((prev) => !prev);
  };

  // Effect to handle Playback Rate updates dynamically
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Audio Control Logic
  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;
    // Ensure rate is applied (sometimes resets on new source)
    audio.playbackRate = playbackRate;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => handleNext();

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack, mode, tracks]); // Re-bind when crucial state changes

  useEffect(() => {
    const audio = audioRef.current;
    if (currentTrack) {
      if (audio.src !== currentTrack.url) {
        audio.src = currentTrack.url;
        audio.load();
        audio.playbackRate = playbackRate; // Apply rate immediately after load
        setAiInsight(null); // Reset AI insight on new track
        // Don't reset cover image here anymore, it's global or saved
      }
      if (isPlaying) {
        audio.play().catch((e) => console.error("Play error:", e));
      } else {
        audio.pause();
      }
    }
  }, [currentTrack, isPlaying]);

  const handlePlayPause = () => setIsPlaying(!isPlaying);

  const handleSeek = (time: number) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const getNextTrackIndex = useCallback(() => {
    if (!currentTrack || tracks.length === 0) return -1;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);

    if (mode === PlaybackMode.REPEAT_ONE) {
      return currentIndex;
    }

    if (mode === PlaybackMode.SHUFFLE) {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * tracks.length);
      } while (nextIndex === currentIndex && tracks.length > 1);
      return nextIndex;
    }

    return (currentIndex + 1) % tracks.length;
  }, [currentTrack, tracks, mode]);

  const handleNext = () => {
    if (mode === PlaybackMode.REPEAT_ONE && currentTrack) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      return;
    }

    const nextIndex = getNextTrackIndex();
    if (nextIndex !== -1) {
      setCurrentTrack(tracks[nextIndex]);
      setIsPlaying(true);
    }
  };

  // Special handler for manual Next button click to force skip even if Repeat One is on
  const handleManualNext = () => {
    if (!currentTrack || tracks.length === 0) return;

    if (mode === PlaybackMode.SHUFFLE) {
      const nextIndex = Math.floor(Math.random() * tracks.length);
      setCurrentTrack(tracks[nextIndex]);
      setIsPlaying(true);
      return;
    }

    // Normal or Repeat One (Manual Override) -> Go to next sequential
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    setCurrentTrack(tracks[nextIndex]);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (!currentTrack || tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    // If more than 3 seconds in, restart song
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    if (mode === PlaybackMode.SHUFFLE) {
      // In shuffle, Prev usually acts like History. simpler here: random or previous in list.
    }

    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    setCurrentTrack(tracks[prevIndex]);
    setIsPlaying(true);
  };

  const toggleShuffle = () => {
    setMode((prev) =>
      prev === PlaybackMode.SHUFFLE ? PlaybackMode.NORMAL : PlaybackMode.SHUFFLE
    );
  };

  const toggleRepeat = () => {
    setMode((prev) =>
      prev === PlaybackMode.REPEAT_ONE
        ? PlaybackMode.NORMAL
        : PlaybackMode.REPEAT_ONE
    );
  };

  const fetchAiInsight = async () => {
    if (!currentTrack) return;
    setLoadingInsight(true);
    const insight = await getSongInsight(currentTrack.name);
    setAiInsight(insight);
    setLoadingInsight(false);
  };

  if (isRestoring) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Đang khôi phục thư viện...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="hidden md:block h-full">
        <Playlist
          tracks={tracks}
          currentTrackId={currentTrack?.id || null}
          onSelectTrack={(t) => {
            setCurrentTrack(t);
            setIsPlaying(true);
          }}
          onLoadFolder={handleLoadFolder}
          isPlaying={isPlaying}
          onClearData={handleClearData}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Center Stage */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          {/* Background Glow */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600 rounded-full blur-[128px] opacity-20 transition-opacity duration-700 ${
              isPlaying ? "opacity-40 scale-110" : "opacity-20 scale-100"
            }`}
          ></div>

          {currentTrack ? (
            <div className="z-10 w-full max-w-2xl flex flex-col items-center text-center gap-8">
              {/* Album Art / Visualizer Placeholder */}
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-3xl bg-slate-800/50 border border-slate-700 shadow-2xl flex items-end justify-center overflow-hidden relative group">
                {/* Background Image if uploaded */}
                {coverImage && (
                  <img
                    src={coverImage}
                    alt="Cover Art"
                    className="absolute inset-0 w-full h-full object-cover opacity-60 transition-opacity duration-500"
                  />
                )}

                {showVisualizer && <Visualizer isPlaying={isPlaying} />}

                {/* Default Icon if no image */}
                {!coverImage && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Play
                      size={64}
                      className="text-indigo-500/20 fill-indigo-500/20"
                    />
                  </div>
                )}

                {/* Upload Overlay */}
                <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Camera size={32} className="text-white mb-2" />
                  <span className="text-white text-sm font-medium">
                    Đổi ảnh bìa
                  </span>
                </label>
              </div>

              {/* Track Info */}
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight drop-shadow-lg line-clamp-2 px-4">
                  {currentTrack.name}
                </h1>
                <p className="text-indigo-300 text-lg font-medium">
                  Local Audio File
                </p>
              </div>

              {/* Gemini AI Insight Button */}
              <div className="min-h-[80px] w-full max-w-lg flex flex-col items-center justify-center">
                {!aiInsight ? (
                  <button
                    onClick={fetchAiInsight}
                    disabled={loadingInsight}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingInsight ? (
                      <span className="animate-pulse">Đang hỏi Gemini...</span>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Hỏi AI về bài hát này</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="bg-indigo-950/50 border border-indigo-500/20 p-4 rounded-xl text-sm text-indigo-200 max-w-md animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-start gap-3">
                      <Info
                        className="shrink-0 mt-0.5 text-indigo-400"
                        size={16}
                      />
                      <p>{aiInsight}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6 z-10">
              <div className="w-32 h-32 bg-slate-800 rounded-full mx-auto flex items-center justify-center animate-bounce-slow">
                <Play size={48} className="text-slate-600 ml-2" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-200">
                  Chào mừng đến với VibeLocal
                </h1>
                <p className="text-slate-400 mt-2">
                  Chọn thư mục nhạc để bắt đầu
                </p>
              </div>
              {/* Mobile Upload Button for convenience */}
              <div className="md:hidden">
                <label className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 rounded-full text-white font-medium cursor-pointer">
                  <span>Mở Thư Mục</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleLoadFolder}
                    {...({ webkitdirectory: "true", directory: "" } as any)}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="z-20">
          <Controls
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onNext={handleManualNext}
            onPrev={handlePrev}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            mode={mode}
            onToggleShuffle={toggleShuffle}
            onToggleRepeat={toggleRepeat}
            playbackRate={playbackRate}
            onPlaybackRateChange={setPlaybackRate}
            showVisualizer={showVisualizer}
            onShowVisualizer={handleShowVisualizer}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
