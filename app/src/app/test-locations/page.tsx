'use client';

import { useState, useEffect } from 'react';

interface Location {
  id: string;
  name: string;
  category: string;
  mood: string;
  hasReferenceImage: boolean;
}

interface GeneratedImage {
  locationId: string;
  locationName: string;
  category: string;
  imageUrl: string;
  timestamp: Date;
}

const CATEGORY_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  nice_fitness: { label: 'Nice Fitness', emoji: '💪', color: 'bg-green-100 text-green-800' },
  nice_lifestyle: { label: 'Nice Lifestyle', emoji: '☕', color: 'bg-amber-100 text-amber-800' },
  nice_beach: { label: 'Nice Beach', emoji: '🏖️', color: 'bg-cyan-100 text-cyan-800' },
  nice_urban: { label: 'Nice Urban', emoji: '🏙️', color: 'bg-slate-100 text-slate-800' },
  home: { label: 'Appartement', emoji: '🏠', color: 'bg-pink-100 text-pink-800' },
  paris: { label: 'Paris', emoji: '🗼', color: 'bg-purple-100 text-purple-800' },
  travel: { label: 'Voyages', emoji: '✈️', color: 'bg-blue-100 text-blue-800' },
};

export default function TestLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  // Load locations on mount
  useEffect(() => {
    fetch('/api/generate-location')
      .then(res => res.json())
      .then(data => setLocations(data.locations || []))
      .catch(err => console.error('Failed to load locations:', err));
  }, []);

  // Filter locations by category
  const filteredLocations = selectedCategory === 'all' 
    ? locations 
    : locations.filter(loc => loc.category === selectedCategory);

  // Get unique categories
  const categories = ['all', ...new Set(locations.map(loc => loc.category))];

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setCurrentImage(null);

    try {
      const response = await fetch('/api/generate-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          locationId: selectedLocation || undefined 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setCurrentImage(data.imageUrl);
      setGeneratedImages(prev => [{
        locationId: data.location.id,
        locationName: data.location.name,
        category: data.location.category,
        imageUrl: data.imageUrl,
        timestamp: new Date(),
      }, ...prev]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAll = async (category: string) => {
    const locs = category === 'all' ? locations : locations.filter(l => l.category === category);
    
    for (const loc of locs) {
      setSelectedLocation(loc.id);
      await handleGenerate();
      // Small delay between generations
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🗺️ Location Generator</h1>
          <p className="text-slate-400">
            Génère les 35 photos de référence pour les lieux récurrents de Mila
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {Object.entries(CATEGORY_LABELS).map(([key, { label, emoji, color }]) => {
            const count = locations.filter(l => l.category === key).length;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`p-3 rounded-lg text-center transition-all ${
                  selectedCategory === key 
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' 
                    : 'hover:scale-105'
                } ${color}`}
              >
                <div className="text-2xl">{emoji}</div>
                <div className="text-xs font-medium mt-1">{label}</div>
                <div className="text-lg font-bold">{count}</div>
              </button>
            );
          })}
          <button
            onClick={() => setSelectedCategory('all')}
            className={`p-3 rounded-lg text-center transition-all bg-white/10 ${
              selectedCategory === 'all' 
                ? 'ring-2 ring-white' 
                : 'hover:bg-white/20'
            }`}
          >
            <div className="text-2xl">🌍</div>
            <div className="text-xs font-medium mt-1">Tous</div>
            <div className="text-lg font-bold">{locations.length}</div>
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Left: Location Selector */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4">Sélectionner un lieu</h2>
            
            {/* Category filter */}
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    selectedCategory === cat 
                      ? 'bg-white text-slate-900' 
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  {cat === 'all' ? 'Tous' : CATEGORY_LABELS[cat]?.label || cat}
                </button>
              ))}
            </div>

            {/* Location list */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredLocations.map(loc => {
                const cat = CATEGORY_LABELS[loc.category];
                const isSelected = selectedLocation === loc.id;
                return (
                  <button
                    key={loc.id}
                    onClick={() => setSelectedLocation(loc.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      isSelected 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-700/50 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{cat?.emoji}</span>
                      <span className="font-medium">{loc.name}</span>
                    </div>
                    <div className="text-sm text-slate-400 mt-1">{loc.mood}</div>
                  </button>
                );
              })}
            </div>

            {/* Generate buttons */}
            <div className="mt-6 space-y-3">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  loading 
                    ? 'bg-slate-600 cursor-wait' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Génération en cours...
                  </span>
                ) : (
                  `🎨 Générer ${selectedLocation ? 'ce lieu' : 'un lieu aléatoire'}`
                )}
              </button>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                  ❌ {error}
                </div>
              )}
            </div>
          </div>

          {/* Right: Generated Image */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4">Image Générée</h2>
            
            <div className="aspect-[4/5] bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
              {currentImage ? (
                <img 
                  src={currentImage} 
                  alt="Generated location"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-slate-500 text-center p-8">
                  <div className="text-6xl mb-4">🗺️</div>
                  <p>Sélectionne un lieu et clique sur Générer</p>
                </div>
              )}
            </div>

            {currentImage && (
              <div className="mt-4 flex gap-3">
                <a
                  href={currentImage}
                  download={`location-${selectedLocation || 'random'}.jpg`}
                  className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-center transition-all"
                >
                  💾 Télécharger
                </a>
                <button
                  onClick={() => navigator.clipboard.writeText(currentImage)}
                  className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
                >
                  📋 Copier URL
                </button>
              </div>
            )}
          </div>
        </div>

        {/* History */}
        {generatedImages.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">
              📸 Historique ({generatedImages.length} images)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {generatedImages.map((img, idx) => (
                <div key={idx} className="relative group">
                  <div className="aspect-[4/5] rounded-lg overflow-hidden">
                    <img 
                      src={img.imageUrl} 
                      alt={img.locationName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col justify-end p-2">
                    <div className="text-xs font-medium truncate">{img.locationName}</div>
                    <div className="text-xs text-slate-400">
                      {CATEGORY_LABELS[img.category]?.emoji} {CATEGORY_LABELS[img.category]?.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-6 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <h3 className="font-semibold mb-3">📋 Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-400">
            <li>Sélectionne un lieu dans la liste ou laisse vide pour aléatoire</li>
            <li>Clique sur <strong className="text-white">Générer</strong> et attends ~1-2 min</li>
            <li>Télécharge l&apos;image et upload sur Cloudinary</li>
            <li>Note l&apos;URL pour l&apos;ajouter à la config</li>
            <li>Répète pour les 35 lieux</li>
          </ol>
        </div>

      </div>
    </div>
  );
}

