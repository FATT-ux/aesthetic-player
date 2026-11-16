import React, { useEffect, useRef } from 'react';
import type { LyricLine, Track } from '../types/music';
import '../styles/LyricsViewer.css';

interface LyricsViewerProps {
  currentTrack: Track | null;
  lyrics: LyricLine[];
  plainLyrics: string;
  currentTime: number;
  accentColor: string;
  onSeek: (time: number) => void;
}

export const LyricsViewer: React.FC<LyricsViewerProps> = ({
  currentTrack,
  lyrics,
  plainLyrics,
  currentTime,
  accentColor,
  onSeek,
}) => {
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  const activeIndex = lyrics.findIndex((line, idx) => {
    const nextLine = lyrics[idx + 1];
    return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
  });

  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  return (
    <div className="hide-scrollbar lyrics-container">
      {!currentTrack ? (
        <div className="lyrics-placeholder">Текст песни появится здесь</div>
      ) : lyrics.length > 0 ? (
        lyrics.map((line, index) => {
          const isActive = index === activeIndex;
          const distance = activeIndex === -1 ? 0 : Math.abs(index - activeIndex);
          const dynamicOpacity = isActive ? 1 : distance === 1 ? 0.55 : distance === 2 ? 0.32 : 0.16;
          const dynamicBlur = isActive ? 0 : Math.min(distance * 0.7, 2.5);

          return (
            <div
              key={`${line.time}-${index}`}
              ref={isActive ? activeLineRef : null}
              onClick={() => onSeek(line.time)}
              className={`lyrics-line ${isActive ? 'active' : ''}`}
              style={{
                opacity: dynamicOpacity,
                filter: dynamicBlur > 0 ? `blur(${dynamicBlur}px)` : 'none',
                textShadow: isActive
                  ? `0 0 24px ${accentColor}, 0 4px 16px rgba(0,0,0,0.85)`
                  : undefined,
              }}
            >
              {line.text}
            </div>
          );
        })
      ) : (
        <div className="lyrics-plain">{plainLyrics}</div>
      )}
    </div>
  );
};
