'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Test page for LoRA generation
 * Test the trained LoRA with different prompts
 */

function TestLoRAContent() {
  const searchParams = useSearchParams();
  const loraFromUrl = searchParams.get('lora') || '';

  const [loraUrl, setLoraUrl] = useState(loraFromUrl);
  const [loraScale, setLoraScale] = useState(1.0);
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testScenarios = [
    {
      name: 'Gym Workout',
      clothing: 'black sports bra and matching leggings',
      pose: 'mid-workout pose in gym, confident stance',
      setting: 'modern bright gym with mirrors',
    },
    {
      name: 'Café Parisien',
      clothing: 'beige linen blazer over white crop top',
      pose: 'sitting at café terrace, holding coffee cup',
      setting: 'charming French café, morning light',
    },
    {
      name: 'Beach Sunset',
      clothing: 'terracotta bikini',
      pose: 'standing on beach, hand in hair, relaxed',
      setting: 'Mediterranean beach, golden hour',
    },
    {
      name: 'Bedroom Morning',
      clothing: 'oversized cream knit sweater',
      pose: 'sitting on bed, cozy morning pose',
      setting: 'bright minimalist bedroom, soft light',
    },
  ];

  const handleTestLora = async (scenario: typeof testScenarios[0]) => {
    if (!loraUrl) {
      alert('Entre l\'URL ou version ID du LoRA !');
      return;
    }

    setGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const response = await fetch('/api/test-lora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loraUrl,
          loraScale,
          template: scenario,
        }),
      });

      if (!response.ok) {
        throw new Error('Génération échouée');
      }

      const data = await response.json();

      if (data.success && data.imageUrl) {
        setGeneratedImage(data.imageUrl);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧪 Test du LoRA Mila
          </h1>
          <p className="text-lg text-gray-600">
            Teste ton LoRA entraîné avec différents scénarios
          </p>
        </div>

        {/* Configuration */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Configuration</h2>

          <div className="space-y-6">
            {/* LoRA URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LoRA Version ID ou Weights URL
              </label>
              <input
                type="text"
                value={loraUrl}
                onChange={(e) => setLoraUrl(e.target.value)}
                placeholder="Ex: votre-username/mila-lora ou https://..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-2">
                Copie l&apos;URL depuis la page de statut du training
              </p>
            </div>

            {/* LoRA Scale */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Force du LoRA: {loraScale.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={loraScale}
                onChange={(e) => setLoraScale(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.5 (Plus subtil)</span>
                <span>1.0 (Recommandé)</span>
                <span>1.5 (Plus fort)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Test Scenarios */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Scénarios de Test</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testScenarios.map((scenario, index) => (
              <div
                key={index}
                className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-400 transition"
              >
                <h3 className="font-bold text-lg text-gray-900 mb-3">
                  {scenario.name}
                </h3>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p><strong>Vêtements:</strong> {scenario.clothing}</p>
                  <p><strong>Pose:</strong> {scenario.pose}</p>
                  <p><strong>Décor:</strong> {scenario.setting}</p>
                </div>
                <button
                  onClick={() => handleTestLora(scenario)}
                  disabled={!loraUrl || generating}
                  className={`w-full px-4 py-3 rounded-lg font-semibold transition ${
                    !loraUrl || generating
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {generating ? '⚙️ Génération...' : '🎨 Générer'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Result */}
        {(generatedImage || error) && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Résultat</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-red-800">❌ {error}</p>
              </div>
            )}

            {generatedImage && (
              <div>
                <div className="relative aspect-[4/5] max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden shadow-xl">
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-6 text-center space-y-4">
                  <p className="text-green-600 font-semibold">
                    ✅ Image générée avec succès !
                  </p>
                  <div className="flex gap-4 justify-center">
                    <a
                      href={generatedImage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      🔗 Ouvrir en grand
                    </a>
                    <button
                      onClick={() => {
                        setGeneratedImage(null);
                        setError(null);
                      }}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                    >
                      🔄 Nouveau test
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">💡 À quoi faire attention:</h3>
          <ul className="space-y-2 text-blue-800">
            <li>✅ Le visage devrait être <strong>cohérent</strong> dans tous les tests</li>
            <li>✅ Les traits caractéristiques (yeux, cheveux, etc.) devraient être <strong>identiques</strong></li>
            <li>⚠️ Si le LoRA est trop fort (visage figé), baisser le scale à 0.8</li>
            <li>⚠️ Si le LoRA est trop faible (inconsistance), augmenter le scale à 1.2</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function TestLoRAPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Chargement...</div>
      </div>
    }>
      <TestLoRAContent />
    </Suspense>
  );
}

