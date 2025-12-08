'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Visual Selection Interface for LoRA Training Images
 * User selects 20-30 best images from character sheet
 */

function SelectTrainingContent() {
  const searchParams = useSearchParams();
  const imagesParam = searchParams.get('images');
  
  const [allImages, setAllImages] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [training, setTraining] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<{
    id: string;
    status: string;
    logs?: string;
  } | null>(null);

  useEffect(() => {
    if (imagesParam) {
      const urls = imagesParam.split(',').filter(Boolean);
      setAllImages(urls);
    }
  }, [imagesParam]);

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selected);
    if (selected.has(index)) {
      newSelected.delete(index);
    } else if (selected.size < 30) {
      newSelected.add(index);
    }
    setSelected(newSelected);
  };

  const handleTrainLoRA = async () => {
    if (selected.size < 20) {
      alert('Sélectionne au moins 20 images pour un training efficace !');
      return;
    }

    const selectedUrls = Array.from(selected)
      .sort((a, b) => a - b)
      .map(idx => allImages[idx]);

    setTraining(true);

    try {
      // Step 1: Create ZIP of selected images
      const zipResponse = await fetch('/api/create-training-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrls: selectedUrls }),
      });

      if (!zipResponse.ok) {
        throw new Error('Échec de la création du ZIP');
      }

      const { zipUrl } = await zipResponse.json();

      // Step 2: Start LoRA training
      const trainResponse = await fetch('/api/train-lora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipUrl }),
      });

      if (!trainResponse.ok) {
        throw new Error('Échec du démarrage du training');
      }

      const trainData = await trainResponse.json();
      
      if (trainData.success) {
        setTrainingStatus({
          id: trainData.trainingId,
          status: trainData.status,
        });
        // Redirect to status page
        window.location.href = `/training-status?id=${trainData.trainingId}`;
      } else {
        throw new Error(trainData.error || 'Erreur inconnue');
      }
    } catch (err) {
      console.error('Training error:', err);
      alert(err instanceof Error ? err.message : 'Erreur lors du training');
    } finally {
      setTraining(false);
    }
  };

  const selectBest = () => {
    // Auto-select first 25 images for quick testing
    const newSelected = new Set<number>();
    for (let i = 0; i < Math.min(25, allImages.length); i++) {
      newSelected.add(i);
    }
    setSelected(newSelected);
  };

  if (allImages.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Aucune image à afficher</p>
          <a href="/training-prep" className="text-blue-600 hover:underline">
            Retour à la préparation
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📸 Sélection des Images de Training
          </h1>
          <p className="text-lg text-gray-600">
            Choisis 20-30 images qui se ressemblent le plus pour un LoRA cohérent
          </p>
        </div>

        {/* Selection Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Images disponibles</p>
              <p className="text-3xl font-bold text-gray-900">{allImages.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Sélectionnées</p>
              <p className={`text-3xl font-bold ${
                selected.size >= 20 ? 'text-green-600' : 'text-orange-600'
              }`}>
                {selected.size}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Recommandé</p>
              <p className="text-3xl font-bold text-blue-600">20-30</p>
            </div>
          </div>

          <div className="mt-4 flex gap-4">
            <button
              onClick={selectBest}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
            >
              ⚡ Sélection rapide (25 premières)
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
            >
              🔄 Tout désélectionner
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {selected.size < 20 && `Encore ${20 - selected.size} image(s) minimum`}
              {selected.size >= 20 && selected.size < 25 && 'Bon niveau de sélection'}
              {selected.size >= 25 && selected.size <= 30 && '✅ Excellent niveau de sélection'}
              {selected.size > 30 && '⚠️ Maximum 30 images recommandé'}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.min(100, Math.round((selected.size / 25) * 100))}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                selected.size >= 20 ? 'bg-green-500' : 'bg-orange-500'
              }`}
              style={{ width: `${Math.min(100, (selected.size / 30) * 100)}%` }}
            />
          </div>
        </div>

        {/* Images Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          {allImages.map((url, index) => (
            <div
              key={index}
              onClick={() => toggleSelection(index)}
              className={`relative cursor-pointer rounded-lg overflow-hidden border-4 transition-all transform hover:scale-105 ${
                selected.has(index)
                  ? 'border-green-500 shadow-xl ring-4 ring-green-200'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="aspect-[4/5] relative bg-gray-100">
                <img
                  src={url}
                  alt={`Option ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {selected.has(index) && (
                <>
                  <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg font-bold text-sm">
                    {Array.from(selected).sort((a, b) => a - b).indexOf(index) + 1}
                  </div>
                  <div className="absolute inset-0 bg-green-500/20 pointer-events-none" />
                </>
              )}

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="text-white text-xs font-medium">#{index + 1}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="sticky bottom-0 bg-white rounded-lg shadow-xl p-6 border-4 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                Prêt à entraîner le LoRA ?
              </h3>
              <p className="text-gray-600">
                {selected.size} images sélectionnées • Coût: ~$3-5 USD • Durée: ~20-30 min
              </p>
            </div>
            <button
              onClick={handleTrainLoRA}
              disabled={selected.size < 20 || training}
              className={`px-8 py-4 rounded-lg text-lg font-semibold text-white transition-all transform ${
                selected.size < 20 || training
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl'
              }`}
            >
              {training ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Démarrage...
                </span>
              ) : (
                <>🚀 Entraîner LoRA avec {selected.size} images</>
              )}
            </button>
          </div>

          {selected.size < 20 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-orange-800 text-sm">
                ⚠️ Il te manque encore <strong>{20 - selected.size} image(s)</strong> pour atteindre le minimum recommandé
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SelectTrainingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Chargement...</div>
      </div>
    }>
      <SelectTrainingContent />
    </Suspense>
  );
}

