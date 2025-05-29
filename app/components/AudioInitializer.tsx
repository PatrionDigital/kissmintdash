"use client";

import { useEffect } from 'react';

// This component initializes audio as early as possible in the app lifecycle
const AudioInitializer: React.FC = () => {
  useEffect(() => {
    // Skip on server-side rendering
    if (typeof window === 'undefined') return;
    
    // Initialize the global audio instance if it doesn't exist
    if (!window.globalAudio) {
      // Create audio element
      window.globalAudio = new Audio('/audio/bgm.mp3'); // Ensure this path is correct
      console.log('[AudioInitializer] window.globalAudio created:', window.globalAudio);
      window.globalAudio.loop = true;
      window.globalAudio.preload = 'auto';
      window.globalAudio.volume = 0.5; // Default volume
      window.globalAudio.muted = false; // Mute is pause, so audio element is never 'muted'
      
      // Get saved preferences for playing state
      // Default to playing if no preference is stored or if it's not explicitly 'false'
      const savedIsPlaying = localStorage.getItem('audioIsPlaying') !== 'false';
      
      // Attempt to play if not explicitly paused by user preference
      if (savedIsPlaying) {
        const playPromise = window.globalAudio.play();
        
        // Handle autoplay restrictions by browsers
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn('Audio autoplay was prevented:', error);
            // If autoplay is blocked, update localStorage to reflect that audio is not playing
            if (error.name === 'NotAllowedError') {
              localStorage.setItem('audioIsPlaying', 'false');
              // Optionally, update any UI state here if needed, though AudioPlayer will also read this
            }
          });
        }
      } else {
        // If localStorage indicates audio should be paused, ensure it is.
        window.globalAudio.pause();
      }
    }
  }, []);

  // This component doesn't render anything to the DOM
  return null;
};

// Extend the Window interface to include our globalAudio property
declare global {
  interface Window {
    globalAudio?: HTMLAudioElement;
  }
}

export default AudioInitializer;
