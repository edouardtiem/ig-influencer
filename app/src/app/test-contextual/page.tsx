'use client';

import { useState, useEffect } from 'react';

interface Location {
  id: string;
  name: string;
  category: string;
  hasReferenceImage: boolean;
  compatibleSlots: string[];
}

interface Slot {
  id: string;
  time: string;
  locations: string[];
  lighting: string;
}

interface GenerationResult {
  success: boolean;
  imageUrl?: string;
  duration?: string;
  error?: string;
  metadata?: {
    location: string;
    locationId: string;
    hasLocationReference: boolean;
    contentType: string;
    pose: string;
    expression: string;
    outfit: string;
    lighting: string;
    mood: string;
    props: string[];
  };
}

export default function TestContextualPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [currentSlot, setCurrentSlot] = useState<Slot | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<'auto' | 'location' | 'slot'>('auto');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [history, setHistory] = useState<GenerationResult[]>([]);

  // Load available locations and slots
  useEffect(() => {
    fetch('/api/generate-contextual')
      .then(res => res.json())
      .then(data => {
        setLocations(data.availableLocations || []);
        setSlots(data.todaySlots || []);
        setCurrentSlot(data.currentSlot);
        if (data.availableLocations?.length > 0) {
          setSelectedLocation(data.availableLocations[0].id);
        }
        if (data.todaySlots?.length > 0) {
          setSelectedSlot(data.todaySlots[0].id);
        }
      });
  }, []);

  const generate = async () => {
    setLoading(true);
    setResult(null);

    try {
      let body: Record<string, unknown> = {};
      
      if (selectedMode === 'auto') {
        body = { auto: true };
      } else if (selectedMode === 'slot') {
        body = { slotId: selectedSlot };
      } else {
        body = { locationId: selectedLocation };
      }

      const res = await fetch('/api/generate-contextual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setResult(data);
      
      if (data.success) {
        setHistory(prev => [data, ...prev].slice(0, 10));
      }
    } catch (error) {
      setResult({ success: false, error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            🎬 Test Génération Contextuelle
          </h1>
          <p className="text-zinc-400 mt-2">
            Système intelligent : Character V2 + Location + Calendar
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Controls */}
          <div className="space-y-6">
            {/* Current Slot Info */}
            {currentSlot && (
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                <h3 className="text-sm font-medium text-zinc-400 mb-2">⏰ Slot Actuel</h3>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold">{currentSlot.time}</span>
                  <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-sm">
                    {currentSlot.lighting}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 mt-1">
                  Lieux : {currentSlot.locations.join(', ')}
                </p>
              </div>
            )}

            {/* Mode Selection */}
            <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
              <h3 className="text-sm font-medium text-zinc-400 mb-3">🎯 Mode de Génération</h3>
              <div className="flex gap-2">
                {['auto', 'slot', 'location'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSelectedMode(mode as typeof selectedMode)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedMode === mode
                        ? 'bg-amber-500 text-black'
                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    }`}
                  >
                    {mode === 'auto' ? '🤖 Auto' : mode === 'slot' ? '⏰ Slot' : '📍 Lieu'}
                  </button>
                ))}
              </div>
            </div>

            {/* Slot Selection (if slot mode) */}
            {selectedMode === 'slot' && (
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                <h3 className="text-sm font-medium text-zinc-400 mb-3">⏰ Choisir un Slot</h3>
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`p-3 rounded-lg text-center transition-all ${
                        selectedSlot === slot.id
                          ? 'bg-amber-500 text-black'
                          : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                      }`}
                    >
                      <div className="font-bold">{slot.time}</div>
                      <div className="text-xs opacity-70">{slot.id}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Location Selection (if location mode) */}
            {selectedMode === 'location' && (
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                <h3 className="text-sm font-medium text-zinc-400 mb-3">📍 Choisir un Lieu</h3>
                <div className="grid grid-cols-2 gap-2">
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => setSelectedLocation(loc.id)}
                      className={`p-3 rounded-lg text-left transition-all ${
                        selectedLocation === loc.id
                          ? 'bg-amber-500 text-black'
                          : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                      }`}
                    >
                      <div className="font-medium">{loc.name}</div>
                      <div className="text-xs opacity-70 flex items-center gap-1">
                        {loc.hasReferenceImage ? '✅' : '❌'} Ref Image
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={generate}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                loading
                  ? 'bg-zinc-700 text-zinc-400 cursor-wait'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Génération en cours... (~60s)
                </span>
              ) : (
                '🚀 Générer Image'
              )}
            </button>

            {/* Metadata Display */}
            {result?.metadata && (
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                <h3 className="text-sm font-medium text-zinc-400 mb-3">📋 Métadonnées</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">📍 Lieu</span>
                    <span>{result.metadata.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">🎬 Type</span>
                    <span>{result.metadata.contentType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">💡 Lighting</span>
                    <span>{result.metadata.lighting}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">🖼 Ref lieu</span>
                    <span>{result.metadata.hasLocationReference ? '✅ Oui' : '❌ Non'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">⏱ Durée</span>
                    <span>{result.duration}</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-700">
                    <p className="text-zinc-500 mb-1">🧘 Pose</p>
                    <p className="text-xs">{result.metadata.pose}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 mb-1">🎭 Expression</p>
                    <p className="text-xs">{result.metadata.expression}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 mb-1">👗 Outfit</p>
                    <p className="text-xs">{result.metadata.outfit}</p>
                  </div>
                  {result.metadata.props?.length > 0 && (
                    <div>
                      <p className="text-zinc-500 mb-1">🎁 Props</p>
                      <p className="text-xs">{result.metadata.props.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Result */}
          <div className="space-y-6">
            {/* Current Result */}
            <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700 min-h-[500px] flex items-center justify-center">
              {loading ? (
                <div className="text-center">
                  <div className="text-6xl mb-4">🎨</div>
                  <p className="text-zinc-400">Génération en cours...</p>
                  <p className="text-sm text-zinc-500 mt-2">Character V2 + Location + Brief</p>
                </div>
              ) : result?.success && result.imageUrl ? (
                <div className="w-full">
                  <img
                    src={result.imageUrl}
                    alt="Generated"
                    className="w-full rounded-lg shadow-2xl"
                    style={{ aspectRatio: '4/5', objectFit: 'cover' }}
                  />
                </div>
              ) : result?.error ? (
                <div className="text-center">
                  <div className="text-6xl mb-4">❌</div>
                  <p className="text-red-400">{result.error}</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-6xl mb-4">📸</div>
                  <p className="text-zinc-400">Clique sur Générer pour créer une image</p>
                  <p className="text-sm text-zinc-500 mt-2">
                    Le système utilise automatiquement les références de Mila et du lieu
                  </p>
                </div>
              )}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                <h3 className="text-sm font-medium text-zinc-400 mb-3">📜 Historique</h3>
                <div className="grid grid-cols-4 gap-2">
                  {history.map((item, i) => (
                    item.imageUrl && (
                      <img
                        key={i}
                        src={item.imageUrl}
                        alt={`History ${i}`}
                        className="w-full aspect-[4/5] object-cover rounded-lg cursor-pointer hover:ring-2 hover:ring-amber-500 transition-all"
                        onClick={() => setResult(item)}
                      />
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

