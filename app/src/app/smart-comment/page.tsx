'use client';

import { useState, useCallback } from 'react';

interface CommentResult {
  success: boolean;
  comment?: string;
  alternatives?: string[];
  analysis?: {
    accountName: string;
    captionSummary: string;
    imageDescription: string;
    mood: string;
  };
  error?: string;
}

export default function SmartCommentPage() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CommentResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setImage(event.target?.result as string);
            setResult(null);
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  }, []);

  const generateComment = async () => {
    if (!image) return;

    setLoading(true);
    setResult(null);

    try {
      // Extract base64 and mime type from data URL
      const matches = image.match(/^data:(.+);base64,(.+)$/);
      if (!matches) {
        setResult({ success: false, error: 'Invalid image format' });
        return;
      }

      const [, mimeType, base64] = matches;

      const response = await fetch('/api/smart-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          mimeType,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black p-4"
      onPaste={handlePaste}
    >
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          💬 Smart Comment
        </h1>
        <p className="text-gray-400 text-center text-sm mb-6">
          Screenshot → AI → Comment prêt à coller
        </p>

        {/* Upload Zone */}
        <div className="mb-6">
          <label className="block w-full cursor-pointer">
            <div className={`
              border-2 border-dashed rounded-2xl p-8 text-center transition-all
              ${image 
                ? 'border-purple-500 bg-purple-500/10' 
                : 'border-gray-600 hover:border-purple-500 hover:bg-purple-500/5'
              }
            `}>
              {image ? (
                <img 
                  src={image} 
                  alt="Screenshot" 
                  className="max-h-64 mx-auto rounded-lg"
                />
              ) : (
                <div className="text-gray-400">
                  <div className="text-4xl mb-2">📸</div>
                  <p>Tape pour upload ou colle (Cmd+V)</p>
                  <p className="text-xs mt-1 text-gray-500">Screenshot d&apos;un post IG</p>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Generate Button */}
        {image && !result && (
          <button
            onClick={generateComment}
            disabled={loading}
            className={`
              w-full py-4 rounded-xl font-semibold text-lg transition-all
              ${loading 
                ? 'bg-gray-700 text-gray-400 cursor-wait' 
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 active:scale-98'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Analyse en cours...
              </span>
            ) : (
              '✨ Générer le commentaire'
            )}
          </button>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {result.success ? (
              <>
                {/* Main Comment */}
                <div 
                  onClick={() => result.comment && copyToClipboard(result.comment)}
                  className={`
                    p-4 rounded-xl cursor-pointer transition-all
                    ${copied === result.comment 
                      ? 'bg-green-600 ring-2 ring-green-400' 
                      : 'bg-white/10 hover:bg-white/15 active:scale-98'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-white text-lg">{result.comment}</p>
                    <span className="text-xl shrink-0">
                      {copied === result.comment ? '✅' : '📋'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    {copied === result.comment ? 'Copié !' : 'Tape pour copier'}
                  </p>
                </div>

                {/* Alternatives */}
                {result.alternatives && result.alternatives.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-gray-500 text-xs uppercase tracking-wide">
                      Alternatives
                    </p>
                    {result.alternatives.map((alt, i) => (
                      <div
                        key={i}
                        onClick={() => copyToClipboard(alt)}
                        className={`
                          p-3 rounded-lg cursor-pointer transition-all
                          ${copied === alt 
                            ? 'bg-green-600 ring-2 ring-green-400' 
                            : 'bg-white/5 hover:bg-white/10'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-gray-300 text-sm">{alt}</p>
                          <span className="text-sm">
                            {copied === alt ? '✅' : '📋'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Analysis */}
                {result.analysis && (
                  <details className="text-gray-500 text-xs">
                    <summary className="cursor-pointer hover:text-gray-400">
                      🔍 Analyse du post
                    </summary>
                    <div className="mt-2 p-3 bg-white/5 rounded-lg space-y-1">
                      <p><span className="text-gray-400">Compte:</span> {result.analysis.accountName}</p>
                      <p><span className="text-gray-400">Caption:</span> {result.analysis.captionSummary}</p>
                      <p><span className="text-gray-400">Image:</span> {result.analysis.imageDescription}</p>
                      <p><span className="text-gray-400">Mood:</span> {result.analysis.mood}</p>
                    </div>
                  </details>
                )}

                {/* Reset */}
                <button
                  onClick={() => {
                    setImage(null);
                    setResult(null);
                  }}
                  className="w-full py-3 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
                >
                  🔄 Nouveau screenshot
                </button>
              </>
            ) : (
              <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50">
                <p className="text-red-400">❌ {result.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-8">
          Mila&apos;s Smart Comment Generator
        </p>
      </div>
    </div>
  );
}
