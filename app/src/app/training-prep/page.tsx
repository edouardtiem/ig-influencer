'use client';

import { useState } from 'react';
import Image from 'next/image';

/**
 * LoRA Training Preparation Page
 * Step 1: Select best base image
 * Step 2: Generate character sheet (30 variations)
 */

const BASE_IMAGES = [
  {
    id: 'base-1',
    url: 'https://replicate.delivery/xezq/Yg0mKXnD7o5fHyefPgenMNXezKcyUrxgul2xR8kEQdYvNexbF/out-0.jpg',
    label: 'Portrait Face #1',
  },
  {
    id: 'base-2',
    url: 'https://replicate.delivery/xezq/vSTENqGiLGKTDdYRt2SLcibgDuGZbCuiW0UE5oim2V5X6xbF/out-0.jpg',
    label: 'Portrait Face #2',
  },
  {
    id: 'base-3',
    url: 'https://replicate.delivery/xezq/MeeMeU7EjeGOESfrCtaDbZn6YXl7dXMzxj57lPeFbaLTe5j3KA/out-0.jpg',
    label: 'Portrait Face #3',
  },
  {
    id: 'base-4',
    url: 'https://replicate.delivery/xezq/B6kXPmx5P8ajEdfdJkiTVHBAnrpB3aFv4dvTlVGUOWzF6j3KA/out-0.jpg',
    label: 'Portrait Face #4',
  },
];

export default function TrainingPrep() {
  const [selectedBase, setSelectedBase] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSheet = async () => {
    if (!selectedBase) {
      alert('Sélectionne une image de base d\'abord !');
      return;
    }

    setGenerating(true);
    setError(null);
    setProgress({ current: 0, total: 30 });

    try {
      const response = await fetch('/api/generate-character-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          baseImageUrl: selectedBase,
          count: 30 
        }),
      });

      if (!response.ok) {
        throw new Error('Échec de la génération');
      }

      const data = await response.json();
      
      if (data.success) {
        setGeneratedImages(data.images || []);
        // Redirect to selection page
        const imageUrls = (data.images || []).map((img: any) => img.url).join(',');
        window.location.href = `/select-training?images=${encodeURIComponent(imageUrls)}`;
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération');
    } finally {
      setGenerating(false);
      setProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎨 Préparation Training LoRA
          </h1>
          <p className="text-lg text-gray-600">
            Crée un modèle LoRA personnalisé pour une consistance parfaite de Mila
          </p>
        </div>

        {/* Process Steps */}
        <div className="mb-12 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <span className="ml-3 font-semibold text-gray-900">Sélectionner image de base</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-4"></div>
            <div className="flex items-center">
              <div className={`w-10 h-10 ${generatedImages.length > 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'} rounded-full flex items-center justify-center font-bold`}>
                2
              </div>
              <span className="ml-3 font-semibold text-gray-600">Générer variations</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-4"></div>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <span className="ml-3 font-semibold text-gray-600">Sélectionner & Entraîner</span>
            </div>
          </div>
        </div>

        {/* Step 1: Select Base Image */}
        <section className="mb-12">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Étape 1: Quelle image de base préfères-tu ?
            </h2>
            <p className="text-gray-600 mb-6">
              Cette image sera utilisée comme référence pour générer 30 variations (angles, poses, expressions).
              Choisis celle où le visage de Mila te semble le plus cohérent.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {BASE_IMAGES.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setSelectedBase(img.url)}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-4 transition-all transform hover:scale-105 ${
                    selectedBase === img.url
                      ? 'border-blue-600 shadow-xl'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="aspect-[4/5] relative bg-gray-100">
                    <img
                      src={img.url}
                      alt={img.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {selectedBase === img.url && (
                    <div className="absolute top-3 right-3 bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-white text-sm font-medium">{img.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Step 2: Generate Character Sheet */}
        {selectedBase && (
          <section className="mb-12">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Étape 2: Générer le Character Sheet
              </h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-blue-900 mb-3">📋 Ce qui sera généré:</h3>
                <ul className="space-y-2 text-blue-800">
                  <li>✅ <strong>8 angles de visage</strong> (face, profil, 3/4, etc.)</li>
                  <li>✅ <strong>6 expressions</strong> (sourire, rire, sérieux, etc.)</li>
                  <li>✅ <strong>8 poses corps</strong> (debout, assis, marche, etc.)</li>
                  <li>✅ <strong>8 contextes variés</strong> (gym, café, plage, etc.)</li>
                </ul>
              </div>

              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-lg mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">⏱️ Durée estimée</p>
                  <p className="text-2xl font-bold text-gray-900">~15-20 minutes</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">💰 Coût estimé</p>
                  <p className="text-2xl font-bold text-gray-900">~$1.20 USD</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">📸 Images générées</p>
                  <p className="text-2xl font-bold text-gray-900">30 variations</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
                  <p className="font-semibold">❌ Erreur:</p>
                  <p>{error}</p>
                </div>
              )}

              {progress && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Génération en cours...
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {progress.current}/{progress.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerateSheet}
                disabled={generating}
                className={`w-full py-4 px-6 rounded-lg text-lg font-semibold text-white transition-all transform ${
                  generating
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl'
                }`}
              >
                {generating ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Génération en cours... ({progress?.current || 0}/{progress?.total || 30})
                  </span>
                ) : (
                  '🎨 Générer 30 variations de cette image'
                )}
              </button>

              <p className="text-center text-sm text-gray-500 mt-4">
                Les images seront générées avec Flux Kontext Pro pour une qualité optimale
              </p>
            </div>
          </section>
        )}

        {/* Info Box */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-3">💡 Pourquoi un LoRA ?</h3>
          <p className="text-yellow-800 mb-3">
            Le LoRA (Low-Rank Adaptation) va &quot;apprendre&quot; le visage de Mila à partir de ces 30 images.
            Une fois entraîné, il produira des images avec <strong>95%+ de consistance faciale</strong>, 
            au lieu des variations actuelles que tu observes.
          </p>
          <p className="text-yellow-800">
            <strong>Résultat:</strong> Toutes les futures images de Mila auront le même visage, 
            peu importe la pose, la tenue ou le contexte !
          </p>
        </div>
      </div>
    </div>
  );
}

