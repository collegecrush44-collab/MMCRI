import React, { useState } from 'react';
import { Search, MapPin, Navigation, Mic, Loader2, Globe } from 'lucide-react';
import { searchPlaces } from '../services/geminiService';

const PlaceSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text?: string; chunks: any[] } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    const data = await searchPlaces(query);
    setResult(data);
    setLoading(false);
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(prev => prev ? `${prev} ${transcript}` : transcript);
      };
      recognition.start();
    } else {
      alert("Speech recognition is not supported in this browser.");
    }
  };

  return (
    <div className="space-y-6 animate-slide-down">
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-2">
          <MapPin className="w-6 h-6 text-blue-600" /> Smart Location Search
        </h2>
        <p className="text-slate-500 mb-8 max-w-lg mx-auto">
          Find nearby pharmacies, diagnostic centers, specialist clinics, or verify patient addresses using AI-powered Google Maps search.
        </p>

        <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
          <input
            type="text"
            className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-300 rounded-full text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="Search for places (e.g., 'Pharmacies near K R Hospital')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            onClick={startListening}
            className="absolute right-16 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-all"
            title="Voice Search"
          >
            <Mic className="w-5 h-5" />
          </button>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
          </button>
        </form>
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                    <Navigation className="w-4 h-4" /> AI Summary
                </h3>
                <div className="prose prose-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {result.text}
                </div>
            </div>
          </div>

          <div className="lg:col-span-2">
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-6 flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Search Results
                </h3>
                
                {result.chunks.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No specific locations found for this query.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.chunks.map((place: any, idx: number) => (
                            <div key={idx} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-slate-50 flex flex-col justify-between h-full">
                                <div>
                                    <h4 className="font-bold text-slate-800 mb-1 line-clamp-1">{place.title}</h4>
                                    {/* Maps Grounding often returns title and uri. Snippets might be in a different structure depending on API version, keeping it simple */}
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-200">
                                    <a 
                                        href={place.uri || place.googleMapsUri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                    >
                                        <MapPin className="w-3 h-3" /> View on Google Maps
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceSearch;
