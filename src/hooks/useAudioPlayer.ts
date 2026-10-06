import { useState, useCallback, useRef, useEffect } from 'react';
import { IQueueItem, ITrack } from '@/types';
import { mcpAudioService, PreviewTrack as _PreviewTrack } from '@/services/MCPAudioService';

interface AudioPlayerState {
  currentTrack: ITrack | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  isShuffled: boolean;
  repeatMode: 'off' | 'one' | 'all';
  isMinimized: boolean;
  queue: IQueueItem[];
  isQueueOpen: boolean;
}

const createQueueId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

export const useAudioPlayer = () => {
  const [state, setState] = useState<AudioPlayerState>({
    currentTrack: null,
    isPlaying: false,
    progress: 0,
    volume: 80,
    isShuffled: false,
    repeatMode: 'off',
    isMinimized: false,
    queue: [],
    isQueueOpen: false,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const simulationInterval = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef(state);
  const playTrackRef = useRef<(track: ITrack, forceRestart?: boolean) => void>(() => undefined);
  const skipNextRef = useRef<() => void>(() => undefined);

  stateRef.current = state;

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    
    const audio = audioRef.current;
    
    const handleEnded = () => {
      skipNextRef.current();
    };
    
    const handleLoadStart = () => {
      console.log('Audio loading started');
    };
    
    const handleCanPlay = () => {
      console.log('Audio can start playing');
    };
    
    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setState(prev => ({ ...prev, isPlaying: false }));
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
      }
    };
  }, []);

  // Update progress
  useEffect(() => {
    if (state.isPlaying && audioRef.current) {
      progressInterval.current = setInterval(() => {
        const audio = audioRef.current;
        if (audio && audio.duration) {
          const currentProgress = (audio.currentTime / audio.duration) * 100;
          setState(prev => ({ ...prev, progress: currentProgress }));
        }
      }, 250); // Optimized for smoother UI - 4 updates per second
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      // Also clear simulation interval when not playing
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
        simulationInterval.current = null;
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
      }
    };
  }, [state.isPlaying]);

  const playTrack = useCallback(async (track: ITrack, forceRestart = false) => {
    console.log('🎵 Playing track:', track.title || track.name);

    // Clear any existing simulation interval
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
      simulationInterval.current = null;
    }

    // If it's the same track, just toggle play/pause
    if (!forceRestart && state.currentTrack?.id === track.id) {
      setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
      if (state.isPlaying) {
        audioRef.current?.pause();
        if (simulationInterval.current) {
          clearInterval(simulationInterval.current);
          simulationInterval.current = null;
        }
      } else {
        if (audioRef.current && state.currentTrack.preview_url) {
          audioRef.current.play().catch(console.error);
        }
      }
      return;
    }

    // Set new track immediately for responsive UI
    setState(prev => ({
      ...prev,
      currentTrack: track,
      isPlaying: true,
      progress: 0,
    }));

    try {
      // Check if track already has preview URL
      if ('preview_url' in track && track.preview_url) {
        console.log('✅ Track already has preview URL:', track.preview_url.substring(0, 50) + '...');
        var enhancedTrack = track;
      } else {
        // Try to enhance the track with MCP preview URL
        console.log('🔄 MCP: Enhancing track with preview URL...', track.name);
        var enhancedTrack = await mcpAudioService.enhanceTrackWithPreview(track);

        console.log('🎯 MCP: Enhancement result:', {
          trackName: enhancedTrack.name,
          hasPreviewUrl: !!enhancedTrack.preview_url,
          previewUrl: enhancedTrack.preview_url ? 'Available' : 'Not available'
        });
      }

      // Update the current track with enhanced data
      setState(prev => ({
        ...prev,
        currentTrack: enhancedTrack,
      }));

      // Load and play audio if preview URL is available
      if (audioRef.current && enhancedTrack.preview_url) {
        console.log('🎶 Loading real preview URL:', enhancedTrack.preview_url.substring(0, 50) + '...');
        console.log('🔧 AUDIO DEBUG: Full preview URL:', enhancedTrack.preview_url);

        // Enhanced audio debugging
        const audio = audioRef.current;
        audio.src = enhancedTrack.preview_url;
        audio.volume = state.volume / 100;

        console.log('🔧 AUDIO DEBUG: Audio element state:', {
          src: audio.src,
          volume: audio.volume,
          muted: audio.muted,
          readyState: audio.readyState,
          networkState: audio.networkState,
          canPlay: audio.readyState >= 3
        });

        // Add event listeners for detailed debugging
        const handleLoadedData = () => {
          console.log('✅ AUDIO DEBUG: Audio data loaded successfully');
          console.log('🔧 AUDIO DEBUG: Duration:', audio.duration, 'seconds');
        };

        const handleCanPlay = () => {
          console.log('✅ AUDIO DEBUG: Audio can play - ready state:', audio.readyState);
        };

        const handlePlay = () => {
          console.log('✅ AUDIO DEBUG: Play event fired - audio should be playing now');
          console.log('🔧 AUDIO DEBUG: Current time:', audio.currentTime, 'Paused:', audio.paused);
        };

        const handleError = (e: Event) => {
          console.error('❌ AUDIO DEBUG: Audio error event:', e);
          if (audio.error) {
            console.error('❌ AUDIO DEBUG: Audio error details:', {
              code: audio.error.code,
              message: audio.error.message
            });
          }
        };

        audio.addEventListener('loadeddata', handleLoadedData);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('error', handleError);

        try {
          console.log('🎵 AUDIO DEBUG: Attempting to play...');
          const playPromise = await audio.play();
          console.log('✅ AUDIO DEBUG: Play promise resolved successfully:', playPromise);
          console.log('🔧 AUDIO DEBUG: After play() - paused:', audio.paused, 'currentTime:', audio.currentTime);
        } catch (error) {
          console.error('❌ AUDIO DEBUG: Play promise rejected:', error);
          console.error('❌ AUDIO DEBUG: Error details:', {
            name: (error as Error).name,
            message: (error as Error).message,
            audioSrc: audio.src,
            audioVolume: audio.volume,
            audioMuted: audio.muted
          });

          // Fall back to simulation if audio fails
          startSimulation();
        } finally {
          // Clean up event listeners
          setTimeout(() => {
            audio.removeEventListener('loadeddata', handleLoadedData);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('error', handleError);
          }, 5000);
        }
      } else {
        console.log('⚠️ No preview URL available - using simulation');
        startSimulation();
      }
    } catch (error) {
      console.error('❌ MCP service error, falling back to simulation:', error);
      startSimulation();
    }

    function startSimulation() {
      // Simulate progress for tracks without preview URLs
      let simulatedProgress = 0;
      simulationInterval.current = setInterval(() => {
        simulatedProgress += 1;
        setState(prev => ({ ...prev, progress: simulatedProgress }));

        if (simulatedProgress >= 100) {
          if (simulationInterval.current) {
            clearInterval(simulationInterval.current);
            simulationInterval.current = null;
          }
          skipNextRef.current();
        }
      }, 250); // Optimized to match real audio progress updates
    }
  }, [state.currentTrack?.id, state.volume, state.currentTrack?.preview_url, state.isPlaying]); // Added missing dependencies

  const togglePlay = useCallback(() => {
    if (!state.currentTrack) return;

    if (state.isPlaying) {
      // Pause real audio
      audioRef.current?.pause();

      // Clear simulation interval when pausing
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
        simulationInterval.current = null;
      }
    } else {
      // Resume real audio if available
      if (audioRef.current && state.currentTrack.preview_url) {
        audioRef.current.play().catch(error => {
          console.error('Audio play failed:', error);
        });
      } else {
        // Restart simulation for tracks without preview URLs
        console.log('Resuming simulation playback');
        let simulatedProgress = state.progress;
        simulationInterval.current = setInterval(() => {
          simulatedProgress += 1;
          setState(prev => ({ ...prev, progress: simulatedProgress }));

          if (simulatedProgress >= 100) {
            if (simulationInterval.current) {
              clearInterval(simulationInterval.current);
              simulationInterval.current = null;
            }
            skipNextRef.current();
          }
        }, 250); // Consistent timing with other progress updates
      }
    }

    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [state.isPlaying, state.currentTrack, state.progress]);

  const skipNext = useCallback(() => {
    const { queue, repeatMode, currentTrack } = stateRef.current;

    if (repeatMode === 'one' && currentTrack) {
      playTrackRef.current(currentTrack, true);
      return;
    }

    if (queue.length > 0) {
      const nextItem = queue[0];
      setState(prev => ({ ...prev, queue: prev.queue.slice(1) }));
      playTrackRef.current(nextItem.track, true);
      return;
    }

    if (repeatMode === 'all' && currentTrack) {
      playTrackRef.current(currentTrack, true);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
      simulationInterval.current = null;
    }
    setState(prev => ({ ...prev, isPlaying: false, progress: 0 }));
  }, []);

  const skipPrevious = useCallback(() => {
    console.log('Skip previous - not implemented yet');
    // TODO: Implement previous track logic
  }, []);

  const seek = useCallback((position: number) => {
    setState(prev => ({ ...prev, progress: position }));
    
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (position / 100) * audioRef.current.duration;
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    setState(prev => ({ ...prev, volume }));
    
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, []);

  const toggleShuffle = useCallback(() => {
    setState(prev => ({ ...prev, isShuffled: !prev.isShuffled }));
  }, []);

  const toggleRepeat = useCallback(() => {
    setState(prev => {
      const modes: Array<'off' | 'one' | 'all'> = ['off', 'one', 'all'];
      const currentIndex = modes.indexOf(prev.repeatMode);
      const nextMode = modes[(currentIndex + 1) % modes.length];
      return { ...prev, repeatMode: nextMode };
    });
  }, []);

  const toggleFavorite = useCallback(() => {
    console.log('Toggle favorite - not implemented yet');
    // TODO: Implement favorite logic
  }, []);

  const toggleMinimize = useCallback(() => {
    setState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
  }, []);

  const closePlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    
    setState({
      currentTrack: null,
      isPlaying: false,
      progress: 0,
      volume: 80,
      isShuffled: false,
      repeatMode: 'off',
      isMinimized: false,
      queue: [],
      isQueueOpen: false,
    });
  }, []);

  const addToQueue = useCallback((track: ITrack) => {
    const item: IQueueItem = {
      queueId: createQueueId(),
      track,
    };
    setState(prev => ({
      ...prev,
      queue: [...prev.queue, item],
      isQueueOpen: true,
    }));
  }, []);

  const removeFromQueue = useCallback((queueId: string) => {
    setState(prev => ({
      ...prev,
      queue: prev.queue.filter(item => item.queueId !== queueId),
    }));
  }, []);

  const reorderQueue = useCallback((nextQueue: IQueueItem[]) => {
    setState(prev => ({ ...prev, queue: nextQueue }));
  }, []);

  const moveQueueItem = useCallback((queueId: string, direction: 'up' | 'down') => {
    setState(prev => {
      const index = prev.queue.findIndex(item => item.queueId === queueId);
      if (index === -1) return prev;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.queue.length) return prev;
      const nextQueue = [...prev.queue];
      const [moved] = nextQueue.splice(index, 1);
      nextQueue.splice(targetIndex, 0, moved);
      return { ...prev, queue: nextQueue };
    });
  }, []);

  const clearQueue = useCallback(() => {
    setState(prev => ({ ...prev, queue: [] }));
  }, []);

  const openQueue = useCallback(() => {
    setState(prev => ({ ...prev, isQueueOpen: true }));
  }, []);

  const closeQueue = useCallback(() => {
    setState(prev => ({ ...prev, isQueueOpen: false }));
  }, []);

  const toggleQueue = useCallback(() => {
    setState(prev => ({ ...prev, isQueueOpen: !prev.isQueueOpen }));
  }, []);

  const playFromQueue = useCallback((queueId: string) => {
    const item = stateRef.current.queue.find(entry => entry.queueId === queueId);
    if (!item) return;
    setState(prev => ({
      ...prev,
      queue: prev.queue.filter(entry => entry.queueId !== queueId),
    }));
    playTrackRef.current(item.track, true);
  }, []);

  playTrackRef.current = playTrack;
  skipNextRef.current = skipNext;

  return {
    // State
    currentTrack: state.currentTrack,
    isPlaying: state.isPlaying,
    progress: state.progress,
    volume: state.volume,
    isShuffled: state.isShuffled,
    repeatMode: state.repeatMode,
    isMinimized: state.isMinimized,
    queue: state.queue,
    isQueueOpen: state.isQueueOpen,
    
    // Actions
    playTrack,
    togglePlay,
    skipNext,
    skipPrevious,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    toggleFavorite,
    toggleMinimize,
    closePlayer,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    moveQueueItem,
    clearQueue,
    openQueue,
    closeQueue,
    toggleQueue,
    playFromQueue,
  };
};