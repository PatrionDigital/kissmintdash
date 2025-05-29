'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaExclamationTriangle } from 'react-icons/fa';

type AudioPlayerProps = {
  className?: string;
};

export default function AudioPlayer({ className = '' }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [hasError, setHasError] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Set audio source after mount to prevent SSR issues
  useEffect(() => {
    setAudioSrc('/audio/bgm.mp3');
  }, []);

  // Handle play/pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(error => {
          console.error("Audio play failed:", error);
          setHasError(true);
          setIsPlaying(false);
        });
    }
  }, [isPlaying]);

  // Handle mute toggle
  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    const newMuted = !isMuted;
    audioRef.current.muted = newMuted;
    setIsMuted(newMuted);
  }, [isMuted]);

  // Handle volume change
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      
      // Update mute state based on volume
      if (newVolume === 0) {
        setIsMuted(true);
        audioRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        audioRef.current.muted = false;
      }
    }
  }, [isMuted]);

  // Initialize audio when source is set
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;

    let isMounted = true;
    
    const handleCanPlay = () => {
      if (!isMounted) return;
      
      // Auto-play when audio is ready
      audio.volume = volume;
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (isMounted) setIsPlaying(true);
          })
          .catch(error => {
            if (isMounted) {
              console.error("Autoplay failed:", error);
              setIsPlaying(false);
            }
          });
      }
    };

    const handleError = () => {
      if (!isMounted) return;
      console.error("Audio error:", audio.error);
      setHasError(true);
      setIsPlaying(false);
    };

    // Only set src if it's different to prevent re-triggering
    if (audio.src !== window.location.origin + audioSrc) {
      audio.src = audioSrc;
    }

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    // Cleanup
    return () => {
      isMounted = false;
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      }
    };
  }, [audioSrc, volume]);

  if (hasError) {
    return (
      <div className={`flex items-center text-yellow-600 dark:text-yellow-400 text-sm ${className}`}>
        <FaExclamationTriangle className="mr-1" /> Audio unavailable
      </div>
    );
  }

  if (!audioSrc) {
    return (
      <div className={`flex items-center text-gray-400 text-sm ${className}`}>
        Loading audio...
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Hidden audio element */}
      <audio 
        ref={audioRef}
        loop 
        src={audioSrc}
        preload="metadata"
        onError={() => setHasError(true)}
      />
      
      <button
        onClick={togglePlay}
        disabled={hasError}
        className={`p-2 rounded-full transition-colors ${
          hasError 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
      >
        {isPlaying ? <FaPause /> : <FaPlay />}
      </button>
      
      <div className="flex items-center space-x-2">
        <button 
          onClick={toggleMute}
          disabled={hasError}
          className={`p-1 rounded-full transition-colors ${
            hasError 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted || volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
        
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          disabled={hasError}
          className={`w-20 accent-pink-500 ${hasError ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label="Volume control"
        />
      </div>
      
      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        loop 
        src="/audio/background-music.mp3"
        className="hidden"
      />
    </div>
  );
}
