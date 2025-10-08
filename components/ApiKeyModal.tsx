import React, { useState } from 'react';
import { SparklesIcon } from './Icons';

interface ApiKeyModalProps {
  onSetApiKey: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSetApiKey }) => {
  const [localApiKey, setLocalApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localApiKey.trim()) {
      onSetApiKey(localApiKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-white/5 p-8 rounded-2xl shadow-2xl border border-white/10">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 inline-block">
                ClipVibe
            </h1>
            <p className="mt-2 text-lg text-gray-300">Enter Your Gemini API Key</p>
            <p className="mt-2 text-sm text-gray-500">
                To generate music recommendations, you need to provide your own Google Gemini API key. You can get one from{' '}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                    Google AI Studio
                </a>.
            </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="apiKey" className="sr-only">
              API Key
            </label>
            <input
              type="password"
              id="apiKey"
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              placeholder="Enter your API key here..."
              className="w-full bg-gray-900/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
              required
            />
          </div>
          <div className="text-center">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg shadow-lg hover:scale-105 transform transition-transform duration-200 disabled:opacity-50"
              disabled={!localApiKey.trim()}
            >
              <SparklesIcon className="w-5 h-5 mr-2" />
              Start Generating
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
