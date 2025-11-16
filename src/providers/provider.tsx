'use client'

import { HeroUIProvider } from '@heroui/react'
import { useEffect, useRef, useState } from 'react';
import { OneChainProvider } from './onechain';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  useEffect(() => {
    const audio = audioRef.current;

    if (audio && !isPlaying) {
      const play = async () => {
        try {
          await audio.play();
          setIsPlaying(true);
        } catch (err) {
          console.warn('Autoplay blocked, user interaction needed:', err);
        }
      };
      play();
    }
  }, [isPlaying]);
  
  return (
    <HeroUIProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a2c38',
            color: '#fff',
            border: '1px solid #2f4553',
          },
          success: {
            iconTheme: {
              primary: '#00e701',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <audio
        ref={audioRef}
        src="/assets/audio/main.mp3"
        loop
        autoPlay
        preload="auto"
        style={{ display: 'none' }}
      />
      <OneChainProvider>
        {children}
      </OneChainProvider>
    </HeroUIProvider>
  )
}