'use client';

import { useState, useEffect } from 'react';

interface Portrait {
  id: string;
  url: string;
  cloudinaryUrl?: string;
  createdAt: string;
  selected: boolean;
  isPrimary?: boolean;
  isCurrentRef?: boolean;
}

interface CurrentRefs {
  primary: string;
  references: string[];
  all: string[];
  source: string;
}

const STORAGE_KEY = 'mila-portraits';

export default function SelectBasePage() {
  const [portraits, setPortraits] = useState<Portrait[]>([]);
  const [currentRefs, setCurrentRefs] = useState<CurrentRefs | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadingToCloud, setUploadingToCloud] = useState<string | null>(null);
  const [uploadingBatch, setUploadingBatch] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [exportedConfig, setExportedConfig] = useState<string | null>(null);

  // Load current references on mount
  useEffect(() => {
    fetch('/api/current-references')
      .then(res => res.json())
      .then(data => setCurrentRefs(data))
      .catch(err => console.error('Failed to load current refs:', err));
  }, []);

  // Load portraits from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPortraits(JSON.parse(saved));
      } catch {
        console.error('Failed to parse saved portraits');
      }
    }
  }, []);

  // Save portraits to localStorage when changed
  useEffect(() => {
    if (portraits.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(portraits));
    }
  }, [portraits]);

  const generatePortraits = async (count: number, fullBody: boolean = false) => {
    setLoading(true);
    setError(null);
    setGenerating(count);
    
    try {
      const url = `/api/generate-base?count=${count}${fullBody ? '&fullbody=true' : ''}`;
      const response = await fetch(url, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success && data.images) {
        const newPortraits: Portrait[] = data.images.map((url: string) => ({
          id: `portrait-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          url,
          createdAt: new Date().toISOString(),
          selected: false,
        }));
        setPortraits(prev => [...newPortraits, ...prev]);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setLoading(false);
      setGenerating(0);
    }
  };

  const toggleSelect = (id: string) => {
    setPortraits(prev => prev.map(p => 
      p.id === id ? { ...p, selected: !p.selected } : p
    ));
  };

  const deletePortrait = (id: string) => {
    setPortraits(prev => prev.filter(p => p.id !== id));
  };

  const deleteSelected = () => {
    setPortraits(prev => prev.filter(p => !p.selected));
  };

  const selectAll = () => {
    setPortraits(prev => prev.map(p => ({ ...p, selected: true })));
  };

  const deselectAll = () => {
    setPortraits(prev => prev.map(p => ({ ...p, selected: false })));
  };

  const uploadToCloudinary = async (portrait: Portrait) => {
    if (portrait.cloudinaryUrl) return; // Already uploaded
    
    setUploadingToCloud(portrait.id);
    try {
      const response = await fetch(`/api/upload-cloudinary?url=${encodeURIComponent(portrait.url)}`);
      const data = await response.json();
      
      if (data.success && data.url) {
        setPortraits(prev => prev.map(p => 
          p.id === portrait.id ? { ...p, cloudinaryUrl: data.url } : p
        ));
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingToCloud(null);
    }
  };

  const uploadSelectedToCloudinary = async () => {
    const selected = portraits.filter(p => p.selected && !p.cloudinaryUrl);
    if (selected.length === 0) {
      setError('No portraits to upload (already on Cloudinary or none selected)');
      return;
    }
    
    setUploadingBatch(true);
    setError(null);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const portrait of selected) {
      setUploadingToCloud(portrait.id);
      try {
        const response = await fetch(`/api/upload-cloudinary?url=${encodeURIComponent(portrait.url)}`);
        const data = await response.json();
        
        if (data.success && data.url) {
          setPortraits(prev => prev.map(p => 
            p.id === portrait.id ? { ...p, cloudinaryUrl: data.url } : p
          ));
          successCount++;
        } else {
          const errorMsg = typeof data.error === 'object' ? JSON.stringify(data.error) : data.error;
          console.error('Upload failed for', portrait.id, ':', errorMsg);
          // Check if URL is from Replicate (temporary URLs)
          if (portrait.url.includes('replicate.delivery') || portrait.url.includes('xezq')) {
            console.warn('⚠️ This looks like an expired Replicate URL. Generate a new portrait instead.');
          }
          failCount++;
        }
      } catch (err) {
        console.error('Upload error:', err);
        failCount++;
      }
      
      // Small delay between uploads to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setUploadingToCloud(null);
    setUploadingBatch(false);
    
    if (failCount > 0) {
      setError(`✅ ${successCount} uploaded, ❌ ${failCount} failed. Replicate URLs expire after ~1 hour. Generate new portraits to upload.`);
    }
  };

  const selectedCount = portraits.filter(p => p.selected).length;
  const selectedWithCloudinary = portraits.filter(p => p.selected && p.cloudinaryUrl);

  const copySelectedUrls = async () => {
    const urls = selectedWithCloudinary.map(p => p.cloudinaryUrl).join('\n');
    try {
      await navigator.clipboard.writeText(urls);
      setCopied('urls');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback: show in modal
      setExportedConfig(urls);
    }
  };

  const exportConfig = async () => {
    const urls = selectedWithCloudinary.map(p => p.cloudinaryUrl);
    const config = `MILA_BASE_FACE_URL=${urls[0] || ''}
MILA_REFERENCE_URLS=${urls.slice(1).join(',')}`;
    // Always show the config AND try to copy
    setExportedConfig(config);
    try {
      await navigator.clipboard.writeText(config);
      setCopied('config');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard failed, but config is still shown
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Mila — Portrait Manager
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                Generate, select, and manage reference portraits
              </p>
            </div>
            <a 
              href="/"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ← Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Current References Section */}
        {currentRefs && (
          <section className="mb-8">
            <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-blue-400">📌 Current References</h2>
                  <p className="text-zinc-400 text-sm">
                    Source: {currentRefs.source === 'env' ? '.env.local' : 'default config'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full">
                    {currentRefs.all.length} portrait(s)
                  </span>
                  <button
                    onClick={async () => {
                      // Import current refs to the portraits list for management
                      const imported: Portrait[] = currentRefs.all.map((url, i) => ({
                        id: `imported-${Date.now()}-${i}`,
                        url,
                        cloudinaryUrl: url.includes('cloudinary.com') ? url : undefined,
                        createdAt: new Date().toISOString(),
                        selected: false,
                        isCurrentRef: true,
                      }));
                      setPortraits(prev => [...imported, ...prev.filter(p => !p.isCurrentRef)]);
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-sm rounded-lg"
                  >
                    📥 Import to Manager
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {currentRefs.all.map((url, index) => (
                  <div
                    key={`ref-${index}`}
                    className={`relative rounded-lg overflow-hidden border-2 ${
                      index === 0 ? 'border-yellow-500' : 'border-zinc-700'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Reference ${index + 1}`}
                      className="w-full aspect-[4/5] object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23333" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="12">Expired</text></svg>';
                      }}
                    />
                    {index === 0 && (
                      <div className="absolute top-1 left-1 px-2 py-0.5 bg-yellow-500 text-black text-xs font-bold rounded">
                        PRIMARY
                      </div>
                    )}
                    {url.includes('cloudinary.com') && (
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-emerald-500/90 text-xs rounded">
                        ☁️
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <p className="text-zinc-500 text-xs mt-3">
                💡 Click &quot;Import to Manager&quot; to add these to your collection, then upload to Cloudinary.
              </p>
            </div>
          </section>
        )}

        {/* Generate Section */}
        <section className="mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">🎨 Generate New Portraits</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Create front-facing portraits with the new &quot;fit&quot; body type (180cm, athletic).
            </p>
            
            <div className="space-y-4">
              <div>
                <p className="text-zinc-500 text-xs mb-2">Portrait (4:5 ratio - face focus)</p>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => generatePortraits(1, false)}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {loading && generating === 1 ? '⏳ Generating...' : '+ Portrait x1'}
                  </button>
                  <button
                    onClick={() => generatePortraits(3, false)}
                    disabled={loading}
                    className="px-6 py-3 bg-zinc-800 border border-zinc-700 rounded-xl font-medium hover:bg-zinc-700 disabled:opacity-50 transition-all"
                  >
                    {loading && generating === 3 ? '⏳ Generating...' : '+ Portrait x3'}
                  </button>
                </div>
              </div>
              
              <div>
                <p className="text-zinc-500 text-xs mb-2">Full Body (9:16 ratio - entire silhouette)</p>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => generatePortraits(1, true)}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {loading ? '⏳ Generating...' : '🧍 Full Body x1'}
                  </button>
                  <button
                    onClick={() => generatePortraits(3, true)}
                    disabled={loading}
                    className="px-6 py-3 bg-zinc-800 border border-zinc-700 rounded-xl font-medium hover:bg-zinc-700 disabled:opacity-50 transition-all"
                  >
                    {loading ? '⏳ Generating...' : '🧍 Full Body x3'}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        </section>

        {/* Actions Bar */}
        {portraits.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <span className="text-zinc-400 text-sm">
                  {selectedCount} of {portraits.length} selected
                </span>
                <button
                  onClick={selectAll}
                  className="text-sm text-amber-400 hover:text-amber-300"
                >
                  Select all
                </button>
                <button
                  onClick={deselectAll}
                  className="text-sm text-zinc-400 hover:text-zinc-300"
                >
                  Deselect all
                </button>
              </div>
              
              <div className="flex gap-2">
                {selectedCount > 0 && (
                  <>
                    <button
                      onClick={uploadSelectedToCloudinary}
                      disabled={uploadingBatch}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {uploadingBatch ? `⏳ Uploading...` : `☁️ Upload to Cloudinary (${portraits.filter(p => p.selected && !p.cloudinaryUrl).length})`}
                    </button>
                    <button
                      onClick={deleteSelected}
                      disabled={uploadingBatch}
                      className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      🗑️ Delete Selected
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Export Section */}
        {selectedWithCloudinary.length > 0 && (
          <section className="mb-8">
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-emerald-400 mb-2">
                ✓ {selectedWithCloudinary.length} portrait(s) ready to use
              </h3>
              <p className="text-zinc-400 text-sm mb-4">
                These portraits have permanent Cloudinary URLs and can be used as references.
              </p>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={copySelectedUrls}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium"
                >
                  {copied === 'urls' ? '✅ Copied!' : '📋 Copy URLs'}
                </button>
                <button
                  onClick={exportConfig}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 rounded-lg text-sm font-medium"
                >
                  {copied === 'config' ? '✅ Copied!' : '⚙️ Export Config'}
                </button>
              </div>
              
              {/* Show exported config if clipboard failed */}
              {exportedConfig && (
                <div className="mt-4 p-4 bg-zinc-800 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">📋 Copy this to your .env.local:</span>
                    <button 
                      onClick={() => setExportedConfig(null)}
                      className="text-zinc-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <pre className="text-xs bg-zinc-900 p-3 rounded overflow-x-auto text-amber-400">
                    {exportedConfig}
                  </pre>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Gallery */}
        <section>
          <h2 className="text-lg font-semibold mb-4">
            📸 Portraits ({portraits.length})
          </h2>
          
          {portraits.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">📷</div>
              <p className="text-zinc-400">
                No portraits yet. Click &quot;Generate&quot; to create reference portraits.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {portraits.map((portrait) => (
                <div
                  key={portrait.id}
                  className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                    portrait.selected 
                      ? 'border-amber-500 ring-2 ring-amber-500/50' 
                      : 'border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  {/* Image */}
                  <img
                    src={portrait.cloudinaryUrl || portrait.url}
                    alt="Portrait"
                    className="w-full aspect-[4/5] object-cover cursor-pointer"
                    onClick={() => toggleSelect(portrait.id)}
                  />
                  
                  {/* Status badges */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {portrait.cloudinaryUrl && (
                      <span className="px-2 py-0.5 bg-emerald-500/90 text-xs rounded-full">
                        ☁️ Cloud
                      </span>
                    )}
                  </div>
                  
                  {/* Selection indicator */}
                  {portrait.selected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                      <span className="text-black text-sm">✓</span>
                    </div>
                  )}
                  
                  {/* Hover overlay with actions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(portrait.id);
                        }}
                        className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm"
                      >
                        {portrait.selected ? 'Deselect' : 'Select'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePortrait(portrait.id);
                        }}
                        className="p-1 bg-red-500/50 hover:bg-red-500/70 rounded"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  {/* Upload indicator */}
                  {uploadingToCloud === portrait.id && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin text-2xl mb-2">☁️</div>
                        <span className="text-sm">Uploading...</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Instructions */}
        <section className="mt-12">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 className="font-semibold mb-3">📋 How to use</h3>
            <ol className="space-y-2 text-zinc-400 text-sm list-decimal list-inside">
              <li>Generate portraits until you find ones you like</li>
              <li>Select the best portraits (click on them)</li>
              <li>Upload selected to Cloudinary for permanent URLs</li>
              <li>Export config to update your <code className="text-amber-400 bg-zinc-800 px-2 py-0.5 rounded">.env.local</code></li>
              <li>The first selected portrait becomes the primary face reference</li>
            </ol>
          </div>
        </section>
      </main>
    </div>
  );
}
