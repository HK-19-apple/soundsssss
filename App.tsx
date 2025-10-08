import React, { useState, useCallback, useRef, useEffect } from 'react';
import { InputForm } from './components/InputForm';
import { MusicCard } from './components/MusicCard';
import { ApiKeyModal } from './components/ApiKeyModal';
import { SparklesIcon, MusicNoteIcon, ExclamationIcon } from './components/Icons';
import { initializeAi, generateMusicRecommendations } from './services/geminiService';
import { generateAudioPreview } from './utils/audioGenerator';
import type { MusicRecommendation } from './types';
import { MOODS } from './constants';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem('gemini-api-key'));
  const [topic, setTopic] = useState('');
  const [story, setStory] = useState('');
  const [mood, setMood] = useState(MOODS[0]);
  const [recommendations, setRecommendations] = useState<MusicRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [bookmarkedTracks, setBookmarkedTracks] = useState<Set<string>>(new Set());
  const [hasGenerated, setHasGenerated] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (apiKey) {
      try {
        initializeAi(apiKey);
      } catch (e) {
        console.error(e);
        setError("There was an issue initializing with your API key. Please check the key format.");
        resetApiKey();
      }
    }
  }, [apiKey]);
  
  useEffect(() => {
    // Initialize Audio object
    audioRef.current = new Audio();
    
    const handleAudioEnd = () => setPlayingTrackId(null);
    audioRef.current.addEventListener('ended', handleAudioEnd);
    audioRef.current.addEventListener('pause', handleAudioEnd);

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleAudioEnd);
        audioRef.current.removeEventListener('pause', handleAudioEnd);
        audioRef.current.pause();
        audioRef.current = null;
      }
      // Revoke any existing blob URLs to prevent memory leaks
      recommendations.forEach(track => {
        if (track.previewUrl) {
          URL.revokeObjectURL(track.previewUrl);
        }
      });
    };
  }, []); // Empty dependency array ensures this runs only once

  const handleSetApiKey = (key: string) => {
    localStorage.setItem('gemini-api-key', key);
    setApiKey(key);
  };
  
  const resetApiKey = () => {
    localStorage.removeItem('gemini-api-key');
    setApiKey(null);
  };

  const handleGenerate = useCallback(async (isRefresh = false) => {
    if (!topic || !story) {
      setError('Please fill in both the topic and story fields.');
      return;
    }
    setIsLoading(true);
    setError(null);
    if (!isRefresh) {
      setHasGenerated(true);
    }
    
    // Clean up old URLs before generating new ones
    recommendations.forEach(track => {
        if (track.previewUrl) URL.revokeObjectURL(track.previewUrl);
    });
    setRecommendations([]);

    try {
      setLoadingMessage('Generating your vibes...');
      const results = await generateMusicRecommendations(topic, story, mood);
      const recommendationsWithIds = results.map((track, index) => ({
        ...track,
        id: `${Date.now()}-${index}`,
      }));

      setLoadingMessage('Synthesizing audio previews...');
      const tracksWithAudio = await Promise.all(
        recommendationsWithIds.map(async (track) => {
          const previewUrl = await generateAudioPreview(track.musicDescription);
          return { ...track, previewUrl };
        })
      );

      setRecommendations(tracksWithAudio);
    } catch (err) {
      console.error(err);
      setError('Failed to generate music recommendations. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [topic, story, mood, recommendations]);

  const toggleBookmark = (id: string) => {
    setBookmarkedTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const togglePlay = (id: string) => {
    const track = recommendations.find(t => t.id === id);
    const player = audioRef.current;
    if (!track || !player || !track.previewUrl) return;

    if (playingTrackId === id) {
      player.pause();
      setPlayingTrackId(null);
    } else {
      if (playingTrackId) { // Pause currently playing track before starting new one
          player.pause();
      }
      player.src = track.previewUrl;
      player.play().catch(e => console.error("Audio playback failed:", e));
      setPlayingTrackId(id);
    }
  };
  
  const bookmarkedList = recommendations.filter(track => bookmarkedTracks.has(track.id));
  const recommendedList = recommendations.filter(track => !bookmarkedTracks.has(track.id));

  if (!apiKey) {
    return <ApiKeyModal onSetApiKey={handleSetApiKey} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 inline-block">
            ClipVibe
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Instantly find the perfect background music for your short videos.
          </p>
        </header>

        <div className="max-w-3xl mx-auto bg-white/5 p-8 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-lg">
          <InputForm
            topic={topic}
            setTopic={setTopic}
            story={story}
            setStory={setStory}
            mood={mood}
            setMood={setMood}
            onSubmit={() => handleGenerate(false)}
            isLoading={isLoading}
          />
        </div>

        {error && (
          <div className="mt-8 max-w-3xl mx-auto bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <ExclamationIcon className="h-5 w-5 mr-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={resetApiKey} className="ml-4 text-sm bg-red-500/20 hover:bg-red-500/40 px-3 py-1 rounded-md transition-colors flex-shrink-0">
              Change Key
            </button>
          </div>
        )}

        <div className="mt-16">
          {isLoading && (
             <div className="flex flex-col items-center justify-center text-gray-400">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
                <p className="mt-4 text-lg">{loadingMessage}</p>
             </div>
          )}

          {!isLoading && !hasGenerated && (
            <div className="text-center text-gray-500 flex flex-col items-center">
                <MusicNoteIcon className="w-16 h-16 mb-4"/>
                <h3 className="text-2xl font-semibold text-gray-300">Your soundtrack awaits</h3>
                <p>Fill out the form above to get started.</p>
            </div>
          )}
          
          {recommendations.length > 0 && !isLoading && (
            <>
              {bookmarkedList.length > 0 && (
                <section className="mb-12">
                  <h2 className="text-2xl font-bold mb-6 text-gray-200 border-b-2 border-purple-500/50 pb-2">Bookmarked</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {bookmarkedList.map((track) => (
                      <MusicCard
                        key={track.id}
                        track={track}
                        isPlaying={playingTrackId === track.id}
                        isBookmarked={true}
                        onPlay={() => togglePlay(track.id)}
                        onBookmark={() => toggleBookmark(track.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              <section>
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-200 border-b-2 border-pink-500/50 pb-2">Recommendations</h2>
                    <button
                      onClick={() => handleGenerate(true)}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <SparklesIcon className="w-5 h-5"/>
                      <span>Refresh</span>
                    </button>
                  </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {recommendedList.map((track) => (
                    <MusicCard
                      key={track.id}
                      track={track}
                      isPlaying={playingTrackId === track.id}
                      isBookmarked={false}
                      onPlay={() => togglePlay(track.id)}
                      onBookmark={() => toggleBookmark(track.id)}
                    />
                  ))}
                </div>
              </section>
            </>
          )}

          {!isLoading && hasGenerated && recommendations.length === 0 && !error && (
            <div className="text-center text-gray-500">
                <h3 className="text-2xl font-semibold text-gray-300">No results found</h3>
                <p>Try adjusting your topic or story for better recommendations.</p>
            </div>
          )}
        </div>
      </main>
      <footer className="text-center py-6">
        <button onClick={resetApiKey} className="text-sm text-gray-500 hover:text-gray-300 hover:underline transition-colors">
          Change API Key
        </button>
      </footer>
    </div>
  );
};

export default App;