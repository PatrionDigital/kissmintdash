"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaVolumeUp, FaVolumeMute } from "react-icons/fa";

interface AudioPlayerProps {
  showVolumeControl?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ showVolumeControl = true }) => {
  const [isPlaying, setIsPlaying] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('audioPlaying') !== 'false';
    }
    return true; // Default if localStorage not available
  });

  const [volume, setVolume] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedVolume = localStorage.getItem('audioVolume');
      return savedVolume ? parseFloat(savedVolume) : 0.5; // Default volume 0.5
    }
    return 0.5;
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Effect for initialization and syncing with globalAudio instance
  useEffect(() => {
    if (typeof window !== 'undefined' && window.globalAudio) {
      audioRef.current = window.globalAudio;

      // Sync isPlaying state with globalAudio and localStorage
      const audioIsActuallyPlaying = !audioRef.current.paused;
      const storedPreferenceAllowsPlay = localStorage.getItem('audioPlaying') !== 'false';

      if (storedPreferenceAllowsPlay && !audioIsActuallyPlaying) {
        // Autoplay was likely blocked, AudioInitializer handles localStorage update.
        setIsPlaying(false);
      } else {
        setIsPlaying(storedPreferenceAllowsPlay);
        // Ensure globalAudio reflects this if necessary
        if (storedPreferenceAllowsPlay && audioRef.current.paused) {
            audioRef.current.play().catch(e => console.warn("Initial play attempt in AudioPlayer failed", e));
        } else if (!storedPreferenceAllowsPlay && !audioRef.current.paused) {
            audioRef.current.pause();
        }
      }
      
      // Sync volume state with globalAudio and localStorage
      const savedVolumeStr = localStorage.getItem('audioVolume');
      const initialVolume = savedVolumeStr ? parseFloat(savedVolumeStr) : 0.5;
      setVolume(initialVolume); 
      audioRef.current.volume = initialVolume;

      // Event listeners for external changes to globalAudio
      const handleGlobalAudioPlayPause = () => {
        if (window.globalAudio) setIsPlaying(!window.globalAudio.paused);
      };
      const handleGlobalAudioVolumeChange = () => {
        if (window.globalAudio) setVolume(window.globalAudio.volume);
      };

      window.globalAudio.addEventListener('play', handleGlobalAudioPlayPause);
      window.globalAudio.addEventListener('pause', handleGlobalAudioPlayPause);
      window.globalAudio.addEventListener('volumechange', handleGlobalAudioVolumeChange);

      return () => {
        if (window.globalAudio) {
          window.globalAudio.removeEventListener('play', handleGlobalAudioPlayPause);
          window.globalAudio.removeEventListener('pause', handleGlobalAudioPlayPause);
          window.globalAudio.removeEventListener('volumechange', handleGlobalAudioVolumeChange);
        }
      };
    }
  }, []); // Runs once on mount

  // Effect to control audio playback when isPlaying state changes (user interaction or external)
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.warn('Error attempting to play audio via UI:', error);
          if (error.name === 'NotAllowedError') {
            setIsPlaying(false); // Update UI
            localStorage.setItem('audioPlaying', 'false'); // Persist that playback is not allowed
          }
        });
      } else {
        audioRef.current.pause();
      }
      // Note: localStorage for 'audioPlaying' is updated in toggleAudio for direct user actions
      // and here if play() promise is rejected by NotAllowedError.
    }
  }, [isPlaying]); // Re-run if isPlaying changes

  // Handler for the play/pause button
  const toggleAudio = () => {
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);
    localStorage.setItem('audioPlaying', newIsPlaying.toString()); // Persist user's explicit action
  };

  // Handler for volume slider change
  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume); 

    if (audioRef.current) {
      audioRef.current.volume = newVolume; 
    }
    localStorage.setItem('audioVolume', newVolume.toString());
  };

  if (typeof window !== 'undefined' && !window.globalAudio) {
    console.log('[AudioPlayer] window.globalAudio is NOT defined. Rendering null.');
    return null; // Don't render if global audio is not ready
  }
  console.log('[AudioPlayer] window.globalAudio IS defined. Proceeding to render controls:', window.globalAudio);

  return (
    <div className="flex items-center space-x-3 bg-black/40 backdrop-blur-lg p-3 rounded-full shadow-xl">
      <button
        onClick={toggleAudio}
        className="flex items-center justify-center w-8 h-8 bg-transparent text-white hover:text-pink-400 transition-colors duration-200"
        aria-label={isPlaying ? "Pause background music" : "Play background music"}
      >
        {isPlaying ? <FaVolumeUp size={22} /> : <FaVolumeMute size={22} />}
      </button>
      {showVolumeControl && (
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-pink-500"
          aria-label="Volume"
        />
      )}
    </div>
  );
};

export default AudioPlayer;
