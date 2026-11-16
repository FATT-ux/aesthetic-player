import React from 'react';
import { X, Trash2, Volume2 } from 'lucide-react';
import type { Track } from '../types/music';
import '../styles/QueueSidebar.css';

interface QueueSidebarProps {
  queue: Track[];
  currentTrack: Track | null;
  accentColor: string;
  onSelectTrack: (track: Track) => void;
  onRemoveTrack: (id: string) => void;
  onClearQueue: () => void;
}

export const QueueSidebar: React.FC<QueueSidebarProps> = ({
  queue,
  currentTrack,
  accentColor,
  onSelectTrack,
  onRemoveTrack,
  onClearQueue,
}) => {
  return (
    <div className="queue-sidebar">
      <div className="queue-header">
        <div className="queue-title">Continue Playing</div>
        {queue.length > 0 && (
          <button onClick={onClearQueue} title="Очистить список" className="queue-clear-btn">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="hide-scrollbar queue-list">
        {queue.length === 0 ? (
          <div className="queue-empty">Нажмите на лупу внизу или Cmd+K, чтобы включить трек</div>
        ) : (
          queue.map((track) => {
            const isActive = track.id === currentTrack?.id;
            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack(track)}
                className={`queue-item ${isActive ? 'active' : ''}`}
                style={
                  isActive
                    ? {
                        borderColor: accentColor,
                        boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 16px ${accentColor}55`,
                      }
                    : undefined
                }
              >
                <div className="queue-cover-wrap">
                  <img src={track.coverUrl} alt={track.title} className="queue-cover" />
                  {isActive && (
                    <div className="queue-playing-overlay">
                      <Volume2 size={18} color="#ffffff" />
                    </div>
                  )}
                </div>

                <div className="queue-info">
                  <div className="queue-track-title">{track.title}</div>
                  <div className="queue-track-artist">{track.artist}</div>
                </div>

                <button
                  className="queue-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveTrack(track.id);
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
