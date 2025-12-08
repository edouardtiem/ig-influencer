'use client';

import { useState, useEffect } from 'react';
import { getWeightedRandomTemplate } from '@/config/prompts';

/**
 * Test page for Nano Banana Pro generation
 * Compare with Flux Kontext results
 */

interface GeneratedImage {
  url: string;
  scenario: string;
  duration: string;
  timestamp: Date;
}

export default function TestNanaBananaPage() {
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [cost, setCost] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [imageHistory, setImageHistory] = useState<GeneratedImage[]>([]);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [useReferences, setUseReferences] = useState(false); // Disabled by default to test without references

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('nanobanana-history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setImageHistory(parsed.map((img: any) => ({
          ...img,
          timestamp: new Date(img.timestamp),
        })));
      } catch (e) {
        console.error('Error loading history:', e);
      }
    }
  }, []);

  // Save history to localStorage when it changes
  useEffect(() => {
    if (imageHistory.length > 0) {
      localStorage.setItem('nanobanana-history', JSON.stringify(imageHistory));
    }
  }, [imageHistory]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen || imageHistory.length === 0) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setLightboxIndex((prev) => (prev + 1) % imageHistory.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setLightboxIndex((prev) => (prev - 1 + imageHistory.length) % imageHistory.length);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setLightboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, imageHistory.length]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPrevious = () => {
    setLightboxIndex((prev) => (prev - 1 + imageHistory.length) % imageHistory.length);
  };

  const goToNext = () => {
    setLightboxIndex((prev) => (prev + 1) % imageHistory.length);
  };

  const testScenarios = [
    {
      name: 'Gym Workout',
      type: 'fitness',
      clothing: 'black sports bra and matching leggings',
      pose: 'mid-workout pose in gym, confident athletic stance, looking at camera',
      setting: 'modern bright gym with mirrors, natural light from large windows',
    },
    {
      name: 'Café Parisien',
      type: 'lifestyle',
      clothing: 'beige linen blazer over white crop top, high waisted jeans',
      pose: 'sitting at café terrace, holding coffee cup, relaxed confident pose, soft smile',
      setting: 'charming French café with rattan chairs, morning golden hour light',
    },
    {
      name: 'Beach Sunset',
      type: 'summer',
      clothing: 'terracotta bikini, elegant classic cut',
      pose: 'standing on beach, one hand in hair, relaxed sensual pose, confident smile',
      setting: 'Mediterranean beach Nice France, blue sea, golden hour sunset light',
    },
    {
      name: 'Bedroom Cozy',
      type: 'casual',
      clothing: 'oversized cream knit sweater, cozy socks',
      pose: 'sitting on bed edge, cozy relaxed morning pose, peaceful expression',
      setting: 'bright minimalist bedroom, white sheets, soft morning light',
    },
    {
      name: 'Evening Glam',
      type: 'glam',
      clothing: 'elegant fitted black dress, gold statement earrings',
      pose: 'standing elegant pose, one hand on hip, confident sultry look',
      setting: 'upscale restaurant entrance, warm ambient lighting, blurred background',
    },
    {
      name: 'Full Body - Sports',
      type: 'fitness',
      clothing: 'matching olive green sports bra and high waisted leggings',
      pose: 'full body standing pose, athletic confident stance, slight smile',
      setting: 'modern gym, full body visible from head to feet, bright lighting',
    },
  ];

  const handleTestNano = async (scenario: typeof testScenarios[0]) => {
    setGenerating(true);
    setError(null);
    setGeneratedImage(null);
    setDuration(null);
    setCost(null);
    setSelectedScenario(scenario);

    try {
      const response = await fetch('/api/test-nanobanana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          template: scenario,
          useReferences: useReferences,
        }),
      });

      if (!response.ok) {
        throw new Error('Génération échouée');
      }

      const data = await response.json();

      if (data.success && data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setDuration(data.duration);
        setCost(data.cost || 'À calculer');
        
        // Add to history
        const newImage: GeneratedImage = {
          url: data.imageUrl,
          scenario: scenario.name,
          duration: data.duration || 'N/A',
          timestamp: new Date(),
        };
        setImageHistory(prev => [...prev, newImage]);
        setSelectedHistoryIndex(null); // Reset selection
      } else {
        throw new Error(data.error || 'Pas d\'image générée');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setGenerating(false);
    }
  };

  const handleRandomTest = () => {
    const template = getWeightedRandomTemplate();
    handleTestNano({
      name: 'Random',
      type: template.type,
      clothing: template.clothing,
      pose: template.pose,
      setting: template.setting,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-4xl font-bold text-gray-900">
              🍌 Test Nano Banana Pro
            </h1>
            <span className="px-4 py-2 bg-yellow-400 text-black rounded-full font-bold text-sm">
              NOUVEAU
            </span>
          </div>
          <p className="text-lg text-gray-600">
            Google DeepMind&apos;s state-of-the-art image generation - Native consistency
          </p>
        </div>

        {/* Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">⚙️ Configuration</h2>
          
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Utiliser les images de référence (6 photos de base)
              </h3>
              <p className="text-sm text-gray-600">
                Nano maintiendra les détails spécifiques (grain de beauté, taches de rousseur, proportions)
              </p>
            </div>
            <button
              onClick={() => setUseReferences(!useReferences)}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                useReferences ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  useReferences ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {useReferences && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">
                ✅ <strong>Mode Référence Activé:</strong> Nano Banana Pro utilisera tes 4 photos de base 
                pour maintenir les détails constants (grain de beauté, taches de rousseur, proportions).
              </p>
            </div>
          )}

          {!useReferences && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-orange-800 text-sm">
                ⚠️ <strong>Mode Sans Référence:</strong> Nano générera uniquement d&apos;après le prompt textuel.
                La consistance sera bonne mais les détails spécifiques peuvent varier.
              </p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">✨ Pourquoi Nano Banana Pro ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🎯</div>
              <div>
                <h3 className="font-semibold text-gray-900">Consistance Native + Références</h3>
                <p className="text-sm text-gray-600">Maintient les détails spécifiques avec jusqu&apos;à 14 images de référence</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">🖼️</div>
              <div>
                <h3 className="font-semibold text-gray-900">Détails Constants</h3>
                <p className="text-sm text-gray-600">Grain de beauté, taches de rousseur, proportions identiques</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">🎨</div>
              <div>
                <h3 className="font-semibold text-gray-900">Contrôles Professionnels</h3>
                <p className="text-sm text-gray-600">Lighting, angles, color grading avancés</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">📸</div>
              <div>
                <h3 className="font-semibold text-gray-900">Résolution 4K</h3>
                <p className="text-sm text-gray-600">Qualité professionnelle pour Instagram</p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Scenarios */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🧪 Scénarios de Test</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testScenarios.map((scenario, index) => (
              <div
                key={index}
                className="border-2 border-gray-200 rounded-lg p-6 hover:border-yellow-400 transition"
              >
                <h3 className="font-bold text-lg text-gray-900 mb-3">
                  {scenario.name}
                </h3>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p><strong>Type:</strong> {scenario.type}</p>
                  <p><strong>Vêtements:</strong> {scenario.clothing}</p>
                  <p><strong>Pose:</strong> {scenario.pose}</p>
                </div>
                <button
                  onClick={() => handleTestNano(scenario)}
                  disabled={generating}
                  className={`w-full px-4 py-3 rounded-lg font-semibold transition ${
                    generating
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600'
                  }`}
                >
                  {generating && selectedScenario?.name === scenario.name ? '⚙️ Génération...' : '🎨 Générer'}
                </button>
              </div>
            ))}
          </div>

          {/* Random Test */}
          <div className="mt-6 text-center">
            <button
              onClick={handleRandomTest}
              disabled={generating}
              className={`px-8 py-4 rounded-lg font-semibold text-lg transition ${
                generating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
              }`}
            >
              🎲 Test Aléatoire (template du système)
            </button>
          </div>
        </div>

        {/* Result */}
        {(generatedImage || error || generating) && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {generating ? '⚙️ Génération en cours...' : '📊 Résultat'}
            </h2>

            {generating && (
              <div className="text-center py-12">
                <svg className="animate-spin h-16 w-16 text-yellow-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-xl text-gray-600">Génération avec Nano Banana Pro...</p>
                <p className="text-sm text-gray-500 mt-2">{selectedScenario?.name}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-red-800">❌ {error}</p>
              </div>
            )}

            {generatedImage && (
              <div>
                <div className="relative aspect-[4/5] max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden shadow-2xl mb-6">
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-blue-600 mb-1">Modèle</p>
                    <p className="font-bold text-blue-900">Nano Banana Pro</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-green-600 mb-1">Durée</p>
                    <p className="font-bold text-green-900">{duration || '-'}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-purple-600 mb-1">Scénario</p>
                    <p className="font-bold text-purple-900">{selectedScenario?.name}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-orange-600 mb-1">Statut</p>
                    <p className="font-bold text-orange-900">✅ Succès</p>
                  </div>
                </div>

                <div className="flex gap-4 justify-center">
                  <a
                    href={generatedImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    🔗 Ouvrir en grand
                  </a>
                  <button
                    onClick={() => {
                      setGeneratedImage(null);
                      setError(null);
                      setDuration(null);
                      setSelectedScenario(null);
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                  >
                    🔄 Nouveau test
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Comparison Info */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-6">
          <h3 className="font-bold text-yellow-900 mb-4 text-lg">📊 Nano Banana Pro vs Flux Kontext</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-yellow-800 mb-3">Nano Banana Pro</h4>
              <ul className="space-y-2 text-sm text-yellow-900">
                <li>✅ <strong>Consistance native</strong> (pas de LoRA requis)</li>
                <li>✅ Blend de 14 images simultanées</li>
                <li>✅ Résolution jusqu&apos;à 4K</li>
                <li>✅ Édition avancée (lighting, angles)</li>
                <li>⏱️ Vitesse : À mesurer</li>
                <li>💰 Coût : À mesurer</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Flux Kontext (actuel)</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>⚠️ <strong>Consistance 70%</strong> (LoRA nécessaire)</li>
                <li>✅ Image de référence unique</li>
                <li>✅ Résolution standard</li>
                <li>✅ Rapide : ~5-7 secondes</li>
                <li>💰 Coût : ~$0.04/image</li>
                <li>📦 Setup : Nécessite LoRA training</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t-2 border-yellow-200">
            <p className="text-yellow-900 font-medium">
              🎯 <strong>Objectif du test :</strong> Vérifier si Nano Banana Pro peut remplacer 
              Flux + LoRA pour obtenir une meilleure consistance nativement.
            </p>
          </div>
        </div>

        {/* Image History Gallery */}
        {imageHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                📚 Historique des Tests ({imageHistory.length})
              </h2>
              <button
                onClick={() => {
                  if (confirm('Effacer tout l\'historique ?')) {
                    setImageHistory([]);
                    localStorage.removeItem('nanobanana-history');
                  }
                }}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium text-sm transition"
              >
                🗑️ Effacer historique
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {imageHistory.map((img, index) => (
                <div
                  key={index}
                  onClick={() => openLightbox(index)}
                  className="relative cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 hover:border-yellow-300 transition-all transform hover:scale-105"
                >
                  <div className="aspect-[4/5] relative bg-gray-100">
                    <img
                      src={img.url}
                      alt={`Test ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-white text-xs font-bold">#{index + 1}</p>
                    <p className="text-white text-xs">{img.scenario}</p>
                    <p className="text-white text-xs opacity-75">{img.duration}</p>
                  </div>
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all flex items-center justify-center">
                    <div className="opacity-0 hover:opacity-100 transition-opacity">
                      <div className="bg-white/90 rounded-full p-3">
                        <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {imageHistory.length >= 3 && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  ✅ <strong>Tu as {imageHistory.length} images générées !</strong> 
                  Compare-les pour évaluer la consistance faciale de Nano Banana Pro.
                  Les visages se ressemblent-ils suffisamment ?
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action CTA */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">🚀 Prêt à tester ?</h3>
          <p className="text-lg mb-6 opacity-90">
            Génère quelques images et compare la consistance faciale avec tes images Flux actuelles
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/view-all-generated"
              className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 font-semibold transition"
            >
              📸 Voir images Flux (en cours)
            </a>
            <a
              href="/compare-models"
              className="px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-100 font-semibold transition"
            >
              ⚡ Comparaison directe
            </a>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && imageHistory.length > 0 && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-w-6xl w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Previous Button */}
            {imageHistory.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-4 transition z-10"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Image Container */}
            <div
              className="relative max-h-full flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl max-h-[80vh]">
                <img
                  src={imageHistory[lightboxIndex].url}
                  alt={`Image ${lightboxIndex + 1}`}
                  className="max-h-[80vh] w-auto object-contain"
                />
              </div>

              {/* Image Info */}
              <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
                <p className="text-center font-bold text-lg mb-2">
                  {imageHistory[lightboxIndex].scenario}
                </p>
                <div className="flex gap-6 justify-center text-sm">
                  <span>📸 #{lightboxIndex + 1} / {imageHistory.length}</span>
                  <span>⏱️ {imageHistory[lightboxIndex].duration}</span>
                  <span>🕐 {imageHistory[lightboxIndex].timestamp.toLocaleTimeString('fr-FR')}</span>
                </div>
              </div>
            </div>

            {/* Next Button */}
            {imageHistory.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-4 transition z-10"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Keyboard Hint */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm">
              ← → Naviguer | ESC Fermer
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

