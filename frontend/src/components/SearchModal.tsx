import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Loader2, Mic2 } from 'lucide-react';
import type { Track } from '../types/music';
import '../styles/SearchModal.css'

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrack: (track: Track) => void;
}

const clientSearchCache = new Map<string, Track[]>();

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTrack,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorText, setErrorText] = useState('');

  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      setErrorText('');
      setLoading(false);
      return;
    }

    const cacheKey = trimmed.toLowerCase();
    if (clientSearchCache.has(cacheKey)) {
      setResults(clientSearchCache.get(cacheKey)!);
      setSearched(true);
      setErrorText('');
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setSearched(true);
      setErrorText('');

      try {
        const searchUrl = new URL('/api/search', 'http://localhost:3001');
        searchUrl.searchParams.set('q', trimmed);

        const res = await fetch(searchUrl.toString(), { signal: controller.signal });
        const data = await res.json();

        if (!res.ok) {
          setErrorText(data.error || 'Ошибка поиска');
          setResults([]);
        } else {
          const list = Array.isArray(data) ? data : [];
          clientSearchCache.set(cacheKey, list);
          setResults(list);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setErrorText('Нет связи с сервером (localhost:3001)');
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const artists = useMemo(() => {
    const map = new Map<string, { name: string; coverUrl: string }>();
    for (const track of results) {
      const key = track.artist.toLowerCase();
      if (!map.has(key) && track.artist !== 'Unknown Artist') {
        map.set(key, { name: track.artist, coverUrl: track.coverUrl });
      }
    }
    return Array.from(map.values());
  }, [results]);

  if (!isOpen) return null;

  const hasContent =
    Boolean(errorText) || (searched && !loading && results.length === 0) || results.length > 0;

  return (
    <div ref={containerRef} className="glass-panel search-popover">
      {hasContent && (
        <>
          <div className="search-body">
            {!loading && errorText && <div className="search-status error">{errorText}</div>}

            {!loading && !errorText && searched && results.length === 0 && (
              <div className="search-status">Ничего не найдено</div>
            )}

            {results.length > 0 && (
              <div className="search-section">
                <div className="search-section-title">Лучшие результаты</div>
                <div className="hide-scrollbar search-horizontal-row">
                  {results.map((track) => (
                    <div
                      key={track.id}
                      className="search-track-card"
                      onClick={() => {
                        onSelectTrack(track);
                        onClose();
                      }}
                    >
                      <img src={track.coverUrl} alt="" className="search-track-cover" />
                      <div className="search-track-info">
                        <div className="search-track-title">{track.title}</div>
                        <div className="search-track-artist">{track.artist}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {artists.length > 0 && (
              <div className="search-section">
                <div className="search-section-title">Артисты</div>
                <div className="hide-scrollbar search-horizontal-row">
                  {artists.map((artist) => (
                    <div
                      key={artist.name}
                      className="search-artist-card"
                      onClick={() => setQuery(artist.name)}
                    >
                      <div className="search-artist-avatar">
                        {artist.coverUrl ? (
                          <img src={artist.coverUrl} alt={artist.name} />
                        ) : (
                          <Mic2 size={18} color="rgba(255,255,255,0.5)" />
                        )}
                      </div>
                      <div className="search-artist-name">{artist.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="search-divider" />
        </>
      )}

      <div className="search-header">
        {loading ? (
          <Loader2 size={19} color="rgba(255,255,255,0.7)" className="spin" />
        ) : (
          <Search size={19} color="rgba(255,255,255,0.6)" />
        )}

        <input
          type="text"
          autoFocus
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Найти трек, альбом или исполнителя..."
        />

        {query && (
          <button type="button" className="search-clear-btn" onClick={() => setQuery('')}>
            <X size={13} />
          </button>
        )}

        <button type="button" className="search-esc-btn" onClick={onClose}>
          Esc
        </button>
      </div>
    </div>
  );
};
