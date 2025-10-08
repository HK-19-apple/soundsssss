import React from 'react';
import type { MusicRecommendation } from '../types';
import { PlayIcon, PauseIcon, BookmarkIcon, BookmarkFilledIcon } from './Icons';

interface MusicCardProps {
  track: MusicRecommendation;
  isPlaying: boolean;
  isBookmarked: boolean;
  onPlay: () => void;
  onBookmark: () => void;
}

export const MusicCard: React.FC<MusicCardProps> = ({ track, isPlaying, isBookmarked, onPlay, onBookmark }) => {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between group hover:bg-white/10 transition-all duration-300 backdrop-blur-md shadow-lg">
      <div>
        <h3 className="text-lg font-semibold text-gray-100 truncate" title={track.trackName}>
          {track.trackName}
        </h3>
        <span className="inline-block bg-purple-500/20 text-purple-300 text-xs font-medium px-2.5 py-1 rounded-full mt-2">
          {track.mood}
        </span>
      </div>
      <div className="flex items-center justify-end mt-4 space-x-2">
        <button
          onClick={onBookmark}
          className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        >
          {isBookmarked ? (
            <BookmarkFilledIcon className="w-6 h-6 text-pink-500" />
          ) : (
            <BookmarkIcon className="w-6 h-6" />
          )}
        </button>
        <button
          onClick={onPlay}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
        >
          {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
};