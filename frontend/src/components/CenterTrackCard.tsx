import React from 'react';
import { Music } from 'lucide-react';
import type { Track } from '../types/music';
import '../styles/CenterTrackCard.css';

interface CenterTrackCardProps {
  currentTrack: Track | null;
  accentColor: string;
}

export const CenterTrackCard: React.FC<CenterTrackCardProps> = ({
  currentTrack,
  accentColor,
}) => {
  return (
    <div
      className="glass-panel center-card"
      style={{
        boxShadow: `0 20px 50px rgba(0, 0, 0, 0.55), 0 0 30px ${accentColor}44`,
        borderColor: `${accentColor}55`,
      }}
    >
      <div className="center-cover-box">
        {currentTrack?.coverUrl ? (
          <img src={currentTrack.coverUrl} alt={currentTrack.title} className="center-cover-img" />
        ) : (
          <Music size={64} color="rgba(255,255,255,0.25)" />
        )}
      </div>

      <div className="center-meta">
        <div className="center-title">
          {currentTrack ? currentTrack.title : 'Выберите трек'}
        </div>
        <div className="center-artist">
          {currentTrack ? currentTrack.artist : 'Нажмите лупу внизу или Cmd+K'}
        </div>
      </div>
    </div>
  );
};
