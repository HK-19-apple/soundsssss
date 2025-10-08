
import React from 'react';
import { MOODS } from '../constants';
import { SparklesIcon } from './Icons';

interface InputFormProps {
  topic: string;
  setTopic: (value: string) => void;
  story: string;
  setStory: (value: string) => void;
  mood: string;
  setMood: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({
  topic,
  setTopic,
  story,
  setStory,
  mood,
  setMood,
  onSubmit,
  isLoading,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-2">
            Video Topic
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Travel, Food, Comedy"
            className="w-full bg-gray-900/50 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
            required
          />
        </div>
        <div>
          <label htmlFor="mood" className="block text-sm font-medium text-gray-300 mb-2">
            Mood / Atmosphere
          </label>
          <select
            id="mood"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="w-full bg-gray-900/50 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
          >
            {MOODS.map((m) => (
              <option key={m} value={m} className="bg-gray-800">
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="story" className="block text-sm font-medium text-gray-300 mb-2">
          Story Content
        </label>
        <textarea
          id="story"
          value={story}
          onChange={(e) => setStory(e.target.value)}
          rows={3}
          placeholder="A brief description of the video plot or highlights..."
          className="w-full bg-gray-900/50 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
          required
        />
      </div>
      <div className="text-center pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full md:w-auto inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white font-semibold rounded-lg shadow-lg hover:scale-105 transform transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5 mr-2" />
              Generate Music
            </>
          )}
        </button>
      </div>
    </form>
  );
};
