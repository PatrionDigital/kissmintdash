"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa'; 

// Define a type for window with our globalAudio property
interface WindowWithGlobalAudio extends Window {
  globalAudio?: HTMLAudioElement;
}

interface AudioPlayerProps {
  showVolumeControl?: boolean;
}

// Helper function to get initial state from localStorage, only runs on client
const getInitialIsPlayingState = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedIsPlaying = window.localStorage.getItem('audioIsPlaying');
    if (storedIsPlaying !== null) {
      return storedIsPlaying === 'true';
    }
  }
  return true; // Default to playing if localStorage is not set or not available (SSR)
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({ showVolumeControl = true }) => {
  const [isPlaying, setIsPlaying] = useState(getInitialIsPlayingState);
  const [volume, setVolume] = useState(0.5); // Default volume, will be synced from localStorage or globalAudio

  const handleAudioError = useCallback((error: unknown) => {
    console.warn('AudioPlayer: Error with audio operation:', error);
    if (typeof error === 'object' && error !== null && 'name' in error && error.name === 'NotAllowedError') {
      setIsPlaying(false);
      localStorage.setItem('audioIsPlaying', 'false'); 
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('localStorage' in window)) return;

    const globalAudio = (window as WindowWithGlobalAudio).globalAudio;
    if (!globalAudio) {
      return; 
    }

    globalAudio.muted = false; // Ensure audio element itself is not muted

    // 'isPlaying' state is already initialized from localStorage via useState(getInitialIsPlayingState).
    // Now, ensure globalAudio's actual play/pause state matches 'isPlaying'.
    // This handles cases where AudioInitializer might have faced autoplay restrictions
    // after localStorage was read by useState.
    if (isPlaying && globalAudio.paused) {
      // React state says playing, but audio is paused (e.g., autoplay blocked for AudioInitializer)
      // Attempt to play. If it fails, handleAudioError will set isPlaying to false.
      globalAudio.play().catch(handleAudioError);
    } else if (!isPlaying && !globalAudio.paused) {
      // React state says not playing, but audio is playing. Pause it.
      globalAudio.pause();
    }
    // If isPlaying and !globalAudio.paused (playing) OR !isPlaying and globalAudio.paused (paused) -> states are in sync.

    const storedVolume = localStorage.getItem('audioVolume');
    if (storedVolume !== null) {
      const vol = parseFloat(storedVolume);
      setVolume(vol);
      if (globalAudio.volume !== vol) globalAudio.volume = vol;
    } else {
      const actualVolume = globalAudio.volume;
      setVolume(actualVolume);
      localStorage.setItem('audioVolume', String(actualVolume));
    }

    const handlePlayEvent: () => void = () => setIsPlaying(true);
    const handlePauseEvent = () => setIsPlaying(false);
    const handleVolumeChangeEvent = () => {
      if (globalAudio) {
        setVolume(globalAudio.volume);
      }
    };

    globalAudio.addEventListener('play', handlePlayEvent);
    globalAudio.addEventListener('pause', handlePauseEvent);
    globalAudio.addEventListener('volumechange', handleVolumeChangeEvent);

    return () => {
      if (globalAudio) {
        globalAudio.removeEventListener('play', handlePlayEvent);
        globalAudio.removeEventListener('pause', handlePauseEvent);
        globalAudio.removeEventListener('volumechange', handleVolumeChangeEvent);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      localStorage.setItem('audioIsPlaying', String(isPlaying));
    }
  }, [isPlaying]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('localStorage' in window)) return;
    const globalAudio = (window as WindowWithGlobalAudio).globalAudio;
    if (globalAudio) {
      globalAudio.volume = volume;
      localStorage.setItem('audioVolume', String(volume));
    }
  }, [volume]);

  const handleVolumeSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
  };

  const togglePlayPause = () => {
    const globalAudio = (window as WindowWithGlobalAudio).globalAudio;
    if (!globalAudio) return;

    const newIsPlaying = !isPlaying;
    if (newIsPlaying) {
      globalAudio.play().catch(handleAudioError);
    } else {
      globalAudio.pause();
    }
    setIsPlaying(newIsPlaying); 
  };
  
  if (typeof window === 'undefined' || !(window as WindowWithGlobalAudio).globalAudio) {
    return null; 
  }

  return (
    <div className="flex items-center space-x-3 p-2 bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-lg shadow-lg">
      {showVolumeControl && (
        <>
          <button
            onClick={togglePlayPause}
            className="p-2 rounded-full text-white hover:bg-gray-700 hover:text-pink-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-pink-500"
            aria-label={isPlaying ? 'Mute (Pause Audio)' : 'Unmute (Play Audio)'}
          >
            {isPlaying ? <FaVolumeUp size={18} /> : <FaVolumeMute size={18} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeSliderChange}
            className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
            aria-label="Volume"
          />
        </>
      )}
    </div>
  );
};

export default AudioPlayer;
