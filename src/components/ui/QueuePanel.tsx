import { useEffect } from "react";
import { AnimatePresence, Reorder, m } from "framer-motion";
import { FiChevronDown, FiChevronUp, FiMusic, FiX } from "react-icons/fi";
import { MdDragIndicator } from "react-icons/md";

import { useAudioPlayerContext } from "@/context/audioPlayerContext";
import { useTheme } from "@/context/themeContext";
import { useMotion } from "@/hooks/useMotion";
import { IQueueItem } from "@/types";
import { cn, getImageUrl } from "@/utils";

const QueuePanel = () => {
  const {
    currentTrack,
    isPlaying,
    queue,
    isQueueOpen,
    closeQueue,
    removeFromQueue,
    reorderQueue,
    moveQueueItem,
    clearQueue,
    playFromQueue,
  } = useAudioPlayerContext();
  const { theme } = useTheme();
  const { slideIn } = useMotion();

  useEffect(() => {
    if (!isQueueOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeQueue();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isQueueOpen, closeQueue]);

  return (
    <AnimatePresence>
      {isQueueOpen && (
        <m.div
          key="queue-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black-overlay"
          onClick={closeQueue}
          aria-hidden="true"
        />
      )}
      {isQueueOpen && (
        <m.aside
          key="queue-panel"
          variants={slideIn("right", "tween", 0, 0.3)}
          initial="hidden"
          animate="show"
          exit="hidden"
          className={cn(
            "fixed top-0 right-0 z-[60] flex h-[calc(100%-80px)] w-full max-w-md flex-col overflow-hidden shadow-2xl",
            theme === "Dark" ? "dark-glass text-gray-200" : "light-glass text-gray-800"
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="queue-panel-title"
        >
            <div className="flex items-center justify-between gap-3 border-b border-gray-200/70 px-4 py-4 dark:border-gray-700/70">
              <div>
                <h2 id="queue-panel-title" className="text-lg font-semibold">
                  Queue
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {queue.length} {queue.length === 1 ? "song" : "songs"} up next
                </p>
              </div>
              <div className="flex items-center gap-2">
                {queue.length > 0 && (
                  <button
                    type="button"
                    onClick={clearQueue}
                    className="rounded-full px-3 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-white"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeQueue}
                  aria-label="Close queue"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <section className="mb-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Now playing
                </p>
                {currentTrack ? (
                  <div className="flex items-center gap-3 rounded-xl bg-white/80 p-3 shadow-sm dark:bg-gray-900/70">
                    <img
                      src={getImageUrl(currentTrack.poster_path)}
                      alt={currentTrack.title || currentTrack.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-900 dark:text-white">
                        {currentTrack.title || currentTrack.name}
                      </p>
                      <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                        {currentTrack.artist || "Unknown Artist"}
                      </p>
                      <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                        {isPlaying ? "Playing" : "Paused"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-300 p-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    <FiMusic className="h-5 w-5 shrink-0" />
                    Nothing is playing yet. Play a track or add songs to queue what comes next.
                  </div>
                )}
              </section>

              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Next up
                </p>
                {queue.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-gray-300 px-3 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    Your queue is empty. Use Add to Queue on any song.
                  </p>
                ) : (
                  <Reorder.Group
                    axis="y"
                    values={queue}
                    onReorder={reorderQueue}
                    className="flex flex-col gap-2"
                  >
                    {queue.map((item, index) => (
                      <QueueRow
                        key={item.queueId}
                        item={item}
                        isFirst={index === 0}
                        isLast={index === queue.length - 1}
                        onRemove={() => removeFromQueue(item.queueId)}
                        onPlay={() => playFromQueue(item.queueId)}
                        onMoveUp={() => moveQueueItem(item.queueId, "up")}
                        onMoveDown={() => moveQueueItem(item.queueId, "down")}
                      />
                    ))}
                  </Reorder.Group>
                )}
              </section>
            </div>
          </m.aside>
        )}
    </AnimatePresence>
  );
};

interface QueueRowProps {
  item: IQueueItem;
  isFirst: boolean;
  isLast: boolean;
  onRemove: () => void;
  onPlay: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const QueueRow = ({
  item,
  isFirst,
  isLast,
  onRemove,
  onPlay,
  onMoveUp,
  onMoveDown,
}: QueueRowProps) => {
  const title = item.track.title || item.track.name || "Unknown Track";

  return (
    <Reorder.Item
      value={item}
      className="flex cursor-grab items-center gap-2 rounded-xl bg-white/80 p-2 shadow-sm active:cursor-grabbing dark:bg-gray-900/70"
    >
      <span className="shrink-0 text-gray-400" aria-hidden>
        <MdDragIndicator className="h-5 w-5" />
      </span>
      <button
        type="button"
        onClick={onPlay}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <img
          src={getImageUrl(item.track.poster_path)}
          alt={title}
          className="h-12 w-12 rounded-md object-cover"
        />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">
            {title}
          </span>
          <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
            {item.track.artist || "Unknown Artist"}
          </span>
        </span>
      </button>
      <div className="flex shrink-0 items-center">
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onMoveUp}
          disabled={isFirst}
          aria-label={`Move ${title} up`}
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
        >
          <FiChevronUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onMoveDown}
          disabled={isLast}
          aria-label={`Move ${title} down`}
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
        >
          <FiChevronDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onRemove}
          aria-label={`Remove ${title} from queue`}
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>
    </Reorder.Item>
  );
};

export default QueuePanel;
