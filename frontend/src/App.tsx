import { useEffect, useRef, useState } from 'react';
import type { Track, LyricLine } from './types/music';
import { extractDominantColor, parseLrc } from './utils/helpers';
import { QueueSidebar } from './components/QueueSidebar';
import { CenterTrackCard } from './components/CenterTrackCard';
import { LyricsViewer } from './components/LyricsViewer';
import { PlayerBar } from './components/PlayerBar';
import { SearchModal } from './components/SearchModal';
import './styles/App.css';

const QUEUE_STORAGE_KEY = 'aesthetic_player_queue';
const VOLUME_STORAGE_KEY = 'aesthetic_player_volume';

export function App() {
  const [queue, setQueue] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem(VOLUME_STORAGE_KEY);
    return saved ? Number(saved) : 0.8;
  });

  const [currentTrack, setCurrentTrack] = useState<Track | null>(() => queue.at(0) || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(() => queue.at(0)?.duration || 0);
  const [accentColor, setAccentColor] = useState('#ff4d6d');
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [plainLyrics, setPlainLyrics] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldAutoPlayRef = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch {
    }
  }, [queue]);

  useEffect(() => {
    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, String(volume));
    } catch {
    }
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleSelectTrack = (track: Track) => {
    shouldAutoPlayRef.current = true;
    setCurrentTrack(track);
    setIsPlaying(true);
    setIsBuffering(true);
    setCurrentTime(0);
    setDuration(track.duration || 180);
    setQueue((prev) => (prev.some((t) => t.id === track.id) ? prev : [track, ...prev]));
  };

  const handleRemoveTrack = (id: string) => {
    setQueue((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClearQueue = () => {
    setQueue([]);
  };

  useEffect(() => {
    if (!currentTrack) return;

    if (currentTrack.coverUrl) {
      extractDominantColor(currentTrack.coverUrl).then(setAccentColor);
    }

    const lyricsUrl = new URL('/api/lyrics', 'http://localhost:3001');
    lyricsUrl.searchParams.set('artist', currentTrack.artist);
    lyricsUrl.searchParams.set('title', currentTrack.title);

    fetch(lyricsUrl.toString())
      .then((res) => res.json())
      .then((data) => {
        if (data.syncedLyrics) {
          setLyrics(parseLrc(data.syncedLyrics));
          setPlainLyrics('');
        } else {
          setLyrics([]);
          setPlainLyrics(data.plainLyrics || 'Текст не найден');
        }
      })
      .catch(() => {
        setLyrics([]);
        setPlainLyrics('Не удалось загрузить текст');
      });

    if (audioRef.current) {
      audioRef.current.src = currentTrack.audioUrl;
      if (shouldAutoPlayRef.current) {
        audioRef.current.play().catch(() => {
          setIsPlaying(false);
          setIsBuffering(false);
        });
      }
    }
  }, [currentTrack]);

  useEffect(() => {
    if (!currentTrack || queue.length < 2) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const nextTrack = queue.at((idx + 1) % queue.length);
    if (nextTrack?.audioUrl) {
      fetch(nextTrack.audioUrl, { method: 'HEAD' }).catch(() => {});
    }
  }, [currentTrack, queue]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      shouldAutoPlayRef.current = true;
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleNext = () => {
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const nextTrack = queue.at((idx + 1) % queue.length);
    if (nextTrack) handleSelectTrack(nextTrack);
  };

  const handlePrev = () => {
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const prevTrack = queue.at((idx - 1 + queue.length) % queue.length);
    if (prevTrack) handleSelectTrack(prevTrack);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
        return;
      }

      if (isSearchOpen) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (currentTrack) setIsPlaying((p) => !p);
      } else if (e.key === 'ArrowRight') {
        handleSeek(Math.min(currentTime + 5, duration));
      } else if (e.key === 'ArrowLeft') {
        handleSeek(Math.max(currentTime - 5, 0));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSearchOpen, currentTrack, currentTime, duration]);

  return (
    <div
      className="app-container"
      style={{
        boxShadow: `inset 0 0 70px ${accentColor}, inset 0 0 12px ${accentColor}`,
        border: `2px solid ${accentColor}`,
      }}
    >
      {currentTrack?.coverUrl && (
        <div
          className="app-bg-blur"
          style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}
        />
      )}

      <div className="app-main-stage">
        <QueueSidebar
          queue={queue}
          currentTrack={currentTrack}
          accentColor={accentColor}
          onSelectTrack={handleSelectTrack}
          onRemoveTrack={handleRemoveTrack}
          onClearQueue={handleClearQueue}
        />
        <CenterTrackCard currentTrack={currentTrack} accentColor={accentColor} />
        <LyricsViewer
          currentTrack={currentTrack}
          lyrics={lyrics}
          plainLyrics={plainLyrics}
          currentTime={currentTime}
          accentColor={accentColor}
          onSeek={handleSeek}
        />
      </div>

      <div className="app-bottom-dock">
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelectTrack={handleSelectTrack}
        />
        <PlayerBar
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          isBuffering={isBuffering}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          onTogglePlay={() => currentTrack && setIsPlaying((p) => !p)}
          onNext={handleNext}
          onPrev={handlePrev}
          onSeek={handleSeek}
          onVolumeChange={setVolume}
          onOpenSearch={() => setIsSearchOpen((prev) => !prev)}
        />
      </div>

      <audio
        ref={audioRef}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onPlaying={() => setIsBuffering(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) {
            setDuration(d);
          } else if (currentTrack?.duration) {
            setDuration(currentTrack.duration);
          }
        }}
        onEnded={handleNext}
      />
    </div>
  );
}

export default App;
