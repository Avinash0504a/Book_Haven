import { useState, useEffect, useRef } from 'react';
import { libraryApi } from '../api/libraryApi';
import { Button } from '../../../components/ui/Button.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';

export default function AudioPlayer({ bookId, title }) {
  const [audioUrl, setAudioUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(null);

  useEffect(() => {
    let active = true;
    let url = null;

    async function loadAudio() {
      setIsLoading(true);
      setError(null);
      try {
        const blob = await libraryApi.streamAudio(bookId);
        if (active) {
          url = URL.createObjectURL(blob);
          setAudioUrl(url);
          setIsLoading(false);
        }
      } catch {
        if (active) {
          setError('Unable to load audio stream. Please make sure you have purchased this audiobook.');
          setIsLoading(false);
        }
      }
    }

    if (bookId) {
      loadAudio();
    }

    return () => {
      active = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [bookId]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isLoading) {
    return (
      <div className="p-6 rounded-xl bg-bg border border-border text-center">
        <Spinner />
        <p className="text-xs text-muted mt-2">Loading audiobook stream...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-danger/10 text-danger text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-surface border border-border shadow-sm space-y-4">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      >
        <track kind="captions" />
      </audio>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted font-semibold">Audiobook Player</p>
          <h3 className="text-base font-bold text-text">{title}</h3>
        </div>
      </div>

      <div className="space-y-1">
        <input
          type="range"
          min="0"
          max={duration || 1}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          aria-label="Seek audio position"
          className="w-full accent-brand-primary cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause audiobook' : 'Play audiobook'}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
      </div>
    </div>
  );
}
