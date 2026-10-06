import { lazy, Suspense, useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import {
  Header,
  Footer,
  SideBar,
  ScrollToTop,
  Loader,
  ErrorBoundary,
  DemoModeBadge,
} from "@/common";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { MiniPlayer } from "@/components/ui/MiniPlayer";
import QueuePanel from "@/components/ui/QueuePanel";
import { useAudioPlayerContext } from "@/context/audioPlayerContext";
import { cn } from "@/utils";

import "react-loading-skeleton/dist/skeleton.css";
import "swiper/css";

const Home = lazy(() => import("./pages/Home"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const {
    currentTrack,
    isPlaying,
    progress,
    volume,
    isShuffled,
    repeatMode,
    isMinimized,
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
    toggleQueue,
  } = useAudioPlayerContext();

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <SideBar />
      <Header onOpenSearch={() => setIsCommandPaletteOpen(true)} />
      <DemoModeBadge />
      <main className={cn(
        "transition-all duration-300 bg-white dark:bg-deep-dark min-h-screen",
        currentTrack && !isMinimized ? "pb-24" : "lg:pb-14 md:pb-4 sm:pb-2 xs:pb-1 pb-0"
      )}>
        <ScrollToTop>
          <ErrorBoundary>
            <Suspense fallback={<Loader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </ScrollToTop>
      </main>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onItemSelect={() => {
          // Item selection handled by CommandPalette component
        }}
      />

      <QueuePanel />

      {currentTrack && (
        <MiniPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          progress={progress}
          volume={volume}
          isShuffled={isShuffled}
          repeatMode={repeatMode}
          isMinimized={isMinimized}
          onTogglePlay={togglePlay}
          onSkipPrevious={skipPrevious}
          onSkipNext={skipNext}
          onSeek={seek}
          onVolumeChange={setVolume}
          onToggleShuffle={toggleShuffle}
          onToggleRepeat={toggleRepeat}
          onToggleFavorite={toggleFavorite}
          onToggleMinimize={toggleMinimize}
          onClose={closePlayer}
          onToggleQueue={toggleQueue}
        />
      )}

      <Footer />
    </>
  );
};

export default App;
