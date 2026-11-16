import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Search, Loader2 } from 'lucide-react';
import type { Track } from '../types/music';
import { formatTime } from '../utils/helpers';
import '../styles/PlayerBar.css';

interface PlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onOpenSearch: () => void;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  currentTrack,
  isPlaying,
  isBuffering,
  currentTime,
  duration,
  volume,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onOpenSearch,
}) => {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 180;

  return (
    <div className="glass-panel player-bar">
      <div className="player-controls">
        <button onClick={onPrev} className="player-icon-btn">
          <SkipBack size={18} />
        </button>

        <button onClick={onTogglePlay} className="player-play-btn">
          {isBuffering ? (
            <Loader2 size={18} className="spin" />
          ) : isPlaying ? (
            <Pause size={18} fill="#000" />
          ) : (
            <Play size={18} fill="#000" />
          )}
        </button>

        <button onClick={onNext} className="player-icon-btn">
          <SkipForward size={18} />
        </button>
      </div>

      <div className="player-progress-wrap">
        {currentTrack && <img src={currentTrack.coverUrl} alt="" className="player-mini-cover" />}
        <div className="player-track-details">
          <div className="player-track-header">
            <span className="player-track-name">
              {currentTrack
                ? isBuffering
                  ? `Загрузка: ${currentTrack.title}...`
                  : `${currentTrack.title} — ${currentTrack.artist}`
                : 'Нет активного трека'}
            </span>
            <span className="player-time">
              {formatTime(currentTime)} / {formatTime(safeDuration)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={safeDuration}
            step={0.1}
            value={Math.min(currentTime, safeDuration)}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="player-slider"
          />
        </div>
      </div>

      <div className="player-right-tools">
        <Volume2 size={18} color="rgba(255,255,255,0.7)" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="player-volume-slider"
        />
        <button onClick={onOpenSearch} className="player-search-btn">
          <Search size={16} />
        </button>
      </div>
    </div>
  );
};
