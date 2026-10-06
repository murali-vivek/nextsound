import React, { createContext, useContext, ReactNode } from 'react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { IQueueItem, ITrack } from '@/types';

interface AudioPlayerContextType {
  currentTrack: ITrack | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  isShuffled: boolean;
  repeatMode: 'off' | 'one' | 'all';
  isMinimized: boolean;
  queue: IQueueItem[];
  isQueueOpen: boolean;
  playTrack: (track: ITrack, forceRestart?: boolean) => void;
  togglePlay: () => void;
  skipNext: () => void;
  skipPrevious: () => void;
  seek: (position: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleFavorite: () => void;
  toggleMinimize: () => void;
  closePlayer: () => void;
  addToQueue: (track: ITrack) => void;
  removeFromQueue: (queueId: string) => void;
  reorderQueue: (nextQueue: IQueueItem[]) => void;
  moveQueueItem: (queueId: string, direction: 'up' | 'down') => void;
  clearQueue: () => void;
  openQueue: () => void;
  closeQueue: () => void;
  toggleQueue: () => void;
  playFromQueue: (queueId: string) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

interface AudioPlayerProviderProps {
  children: ReactNode;
}

export const AudioPlayerProvider: React.FC<AudioPlayerProviderProps> = ({ children }) => {
  const audioPlayer = useAudioPlayer();

  return (
    <AudioPlayerContext.Provider value={audioPlayer}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayerContext = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayerContext must be used within AudioPlayerProvider');
  }
  return context;
};
