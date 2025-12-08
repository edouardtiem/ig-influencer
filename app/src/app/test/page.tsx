'use client';

import { useState } from 'react';

const CONTENT_TYPES = [
  { value: '', label: 'Random (weighted)' },
  { value: 'lifestyle', label: '☕ Lifestyle' },
  { value: 'fitness', label: '💪 Fitness' },
  { value: 'summer', label: '🏖️ Summer/Beach' },
  { value: 'sexy_light', label: '✨ Sexy Light' },
  { value: 'sexy_medium', label: '🔥 Sexy Medium' },
  { value: 'casual', label: '🛋️ Casual' },
  { value: 'glam', label: '💃 Glam' },
];

interface GenerateResult {
  success: boolean;
  template?: {
    type: string;
    clothing: string;
    pose: string;
    setting: string;
  };
  caption?: string;
  image?: string;
  generationTime?: string;
  isBaseImage?: boolean;
  hasReferenceImage?: boolean;
  referenceImageUrl?: string;
  error?: string;
}

export default function TestPage() {
  const [selectedType, setSelectedType] = useState('');
  const [generateBase, setGenerateBase] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [history, setHistory] = useState<GenerateResult[]>([]);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  const generateImage = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      let url = '/api/test-generate';
      const params = new URLSearchParams();
      
      if (selectedType) params.append('type', selectedType);
      if (generateBase) params.append('base', 'true');
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      setResult(data);
      
      if (data.success) {
        setHistory(prev => [data, ...prev].slice(0, 10));
        
        // If this was a base image, store it as reference
        if (data.isBaseImage && data.image) {
          setReferenceImage(data.image);
        }
        // Update reference from server if available
        if (data.referenceImageUrl) {
          setReferenceImage(data.referenceImageUrl);
        }
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-light text-gray-900 mb-2">
            🧪 Mila Verne — Test Generator
          </h1>
          <p className="text-gray-500">
            Generate test images with Replicate (Flux + InstantID)
          </p>
        </header>

        {/* Workflow Info */}
        <div className="bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200 rounded-2xl p-6 mb-8">
          <h2 className="font-medium text-gray-900 mb-3">📋 Workflow pour la cohérence faciale</h2>
          <ol className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="bg-amber-200 text-amber-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <span><strong>Créer l&apos;image de base</strong> — Génère la première image de Mila (cocher &quot;Base Image&quot;)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-amber-200 text-amber-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <span><strong>Valider le visage</strong> — Si le visage te plaît, il devient la référence</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-amber-200 text-amber-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <span><strong>Générer avec InstantID</strong> — Les futures images auront le même visage</span>
            </li>
          </ol>
        </div>

        {/* Reference Image Status */}
        <div className={`rounded-2xl p-4 mb-6 ${referenceImage ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-xl overflow-hidden ${referenceImage ? '' : 'bg-gray-200 flex items-center justify-center'}`}>
              {referenceImage ? (
                <img src={referenceImage} alt="Reference" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">👤</span>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {referenceImage ? '✅ Image de référence définie' : '❌ Pas encore d\'image de référence'}
              </p>
              <p className="text-sm text-gray-500">
                {referenceImage 
                  ? 'Les prochaines images utiliseront ce visage avec InstantID'
                  : 'Génère une "Base Image" pour définir le visage de Mila'}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                {CONTENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <label className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors">
              <input
                type="checkbox"
                checked={generateBase}
                onChange={(e) => setGenerateBase(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded"
              />
              <span className="text-sm font-medium text-amber-800">
                🎨 Base Image (new face)
              </span>
            </label>
            
            <button
              onClick={generateImage}
              disabled={loading}
              className={`px-8 py-2 rounded-xl font-medium transition-all ${
                loading
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-rose-500 to-amber-500 text-white hover:shadow-lg hover:scale-105'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </span>
              ) : (
                '✨ Generate Image'
              )}
            </button>
          </div>
          
          {loading && (
            <p className="mt-4 text-sm text-gray-500 text-center">
              ⏳ Image generation takes 30-90 seconds with Replicate...
            </p>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className={`bg-white rounded-2xl shadow-sm border p-6 mb-8 ${
            result.success ? 'border-emerald-200' : 'border-red-200'
          }`}>
            {result.success ? (
              <div className="grid md:grid-cols-2 gap-8">
                {/* Image */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Generated Image
                    </h3>
                    {result.isBaseImage && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                        Base Image
                      </span>
                    )}
                    {!result.isBaseImage && result.hasReferenceImage && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                        InstantID
                      </span>
                    )}
                  </div>
                  {result.image && (
                    <div className="relative">
                      <img
                        src={result.image}
                        alt="Generated Mila"
                        className="w-full rounded-xl shadow-lg"
                      />
                      <a
                        href={result.image}
                        download={`mila-${result.template?.type}-${Date.now()}.webp`}
                        className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-white transition-colors"
                      >
                        ⬇️ Download
                      </a>
                    </div>
                  )}
                  <p className="mt-2 text-sm text-gray-500 text-center">
                    Generation time: {result.generationTime}
                  </p>
                </div>
                
                {/* Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium text-gray-900 capitalize">
                        {result.template?.type}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Clothing</p>
                      <p className="text-gray-700">{result.template?.clothing}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Setting</p>
                      <p className="text-gray-700">{result.template?.setting}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Caption</p>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-700 whitespace-pre-line">
                          {result.caption}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-red-500 font-medium">❌ Generation Failed</p>
                <p className="text-gray-600 mt-2">{result.error}</p>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              📸 Recent Generations ({history.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {history.map((item, index) => (
                <div key={index} className="relative group">
                  {item.image && (
                    <>
                      <img
                        src={item.image}
                        alt={`Generated ${index + 1}`}
                        className="w-full aspect-[4/5] object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs px-2 py-1 bg-black/50 rounded capitalize">
                          {item.template?.type}
                        </span>
                      </div>
                      {item.isBaseImage && (
                        <div className="absolute top-2 left-2">
                          <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
                            Base
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Templates Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            📋 Available Templates
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CONTENT_TYPES.slice(1).map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`p-3 rounded-xl border text-left transition-all hover:border-rose-300 ${
                  selectedType === type.value 
                    ? 'border-rose-500 bg-rose-50' 
                    : 'border-gray-200'
                }`}
              >
                <span className="text-lg">{type.label.split(' ')[0]}</span>
                <p className="text-sm text-gray-600 mt-1">
                  {type.label.split(' ').slice(1).join(' ')}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
