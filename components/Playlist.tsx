import React from 'react';
import { Track } from '../types';
import { Music, FolderOpen, Trash2 } from 'lucide-react';

interface PlaylistProps {
  tracks: Track[];
  currentTrackId: string | null;
  onSelectTrack: (track: Track) => void;
  onLoadFolder: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isPlaying: boolean;
  onClearData: () => void;
}

export const Playlist: React.FC<PlaylistProps> = ({
  tracks,
  currentTrackId,
  onSelectTrack,
  onLoadFolder,
  isPlaying,
  onClearData
}) => {
  return (
    <div className="h-full flex flex-col bg-slate-900/50 border-r border-slate-800 w-80 shrink-0">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Music className="text-indigo-500" />
            Thư Viện
          </h2>
          {tracks.length > 0 && (
            <button
              onClick={onClearData}
              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
              title="Xóa toàn bộ dữ liệu nhạc"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        <label className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 border border-dashed border-slate-600 hover:border-indigo-500 rounded-xl cursor-pointer transition-all group">
          <FolderOpen size={20} className="group-hover:scale-110 transition-transform" />
          <span className="font-medium">Chọn Thư Mục Nhạc</span>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={onLoadFolder}
            {...({ webkitdirectory: "true", directory: "" } as any)}
          />
        </label>
        <p className="text-xs text-slate-500 mt-2 text-center">
          Hỗ trợ MP3, WAV, OGG
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600">
            <Music size={48} className="mb-2 opacity-20" />
            <p>Chưa có bài hát nào</p>
            <p className="text-xs mt-2">Dữ liệu sẽ được lưu tự động</p>
          </div>
        ) : (
          tracks.map((track, index) => {
            const isActive = track.id === currentTrackId;
            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack(track)}
                className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${isActive
                  ? 'bg-indigo-500/20 border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                  : 'hover:bg-slate-800 border border-transparent'
                  }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'}`}>
                  {isActive && isPlaying ? (
                    <div className="flex gap-[2px] items-end h-3">
                      <span className="w-1 bg-white animate-[pulse_0.6s_ease-in-out_infinite] h-full"></span>
                      <span className="w-1 bg-white animate-[pulse_0.8s_ease-in-out_infinite_0.1s] h-2"></span>
                      <span className="w-1 bg-white animate-[pulse_0.5s_ease-in-out_infinite_0.2s] h-3"></span>
                    </div>
                  ) : (
                    <span className="text-xs font-mono">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isActive ? 'text-indigo-300' : 'text-slate-300'}`}>
                    {track.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {(track.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-slate-800 text-xs text-center text-slate-600">
        {tracks.length} bài hát đã tải • Auto Save
      </div>
    </div>
  );
};