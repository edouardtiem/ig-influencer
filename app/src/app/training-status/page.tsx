'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * LoRA Training Status Dashboard
 * Real-time tracking of training progress
 */

interface TrainingStatus {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  logs?: string;
  output?: {
    version: string;
    weights: string;
  };
  error?: string;
  metrics?: Record<string, unknown>;
}

function TrainingStatusContent() {
  const searchParams = useSearchParams();
  const trainingId = searchParams.get('id');

  const [status, setStatus] = useState<TrainingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStatus = async () => {
    if (!trainingId) return;

    try {
      const response = await fetch(`/api/train-lora?id=${trainingId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }

      const data = await response.json();
      if (data.success) {
        setStatus(data.training);
        
        // Stop auto-refresh if completed or failed
        if (data.training.status === 'succeeded' || data.training.status === 'failed' || data.training.status === 'canceled') {
          setAutoRefresh(false);
        }
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Status fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [trainingId]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchStatus();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, trainingId]);

  if (!trainingId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">ID de training manquant</p>
          <a href="/training-prep" className="text-blue-600 hover:underline">
            Retour à la préparation
          </a>
        </div>
      </div>
    );
  }

  if (loading && !status) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xl text-gray-600">Chargement du statut...</p>
        </div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <p className="text-xl text-gray-900 mb-2">Erreur</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchStatus}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'failed':
      case 'canceled':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'processing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-orange-600 bg-orange-50 border-orange-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return '✅';
      case 'failed':
        return '❌';
      case 'canceled':
        return '⛔';
      case 'processing':
        return '⚙️';
      default:
        return '🔄';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'Training Terminé avec Succès !';
      case 'failed':
        return 'Training Échoué';
      case 'canceled':
        return 'Training Annulé';
      case 'processing':
        return 'Training en Cours...';
      default:
        return 'Démarrage du Training...';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 Statut du Training LoRA
          </h1>
          <p className="text-lg text-gray-600">
            Training ID: <code className="bg-gray-200 px-2 py-1 rounded text-sm">{trainingId}</code>
          </p>
        </div>

        {/* Status Card */}
        <div className={`bg-white rounded-lg shadow-xl p-8 mb-8 border-4 ${getStatusColor(status?.status || 'starting')}`}>
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{getStatusIcon(status?.status || 'starting')}</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {getStatusText(status?.status || 'starting')}
            </h2>
            <p className="text-gray-600 capitalize text-xl">
              {status?.status || 'starting'}
            </p>
          </div>

          {/* Progress Indicator */}
          {status?.status === 'processing' && (
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <svg className="animate-spin h-16 w-16 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-center text-gray-600">
                Cela peut prendre 20-30 minutes. Tu peux fermer cette page, le training continuera.
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {status?.created_at && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Créé</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(status.created_at).toLocaleString('fr-FR')}
                </p>
              </div>
            )}
            {status?.started_at && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Démarré</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(status.started_at).toLocaleString('fr-FR')}
                </p>
              </div>
            )}
            {status?.completed_at && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Terminé</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(status.completed_at).toLocaleString('fr-FR')}
                </p>
              </div>
            )}
          </div>

          {/* Success Output */}
          {status?.status === 'succeeded' && status.output && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-4 text-xl">🎉 LoRA Prêt à l&apos;Emploi !</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-green-800 mb-2 font-medium">Version ID:</p>
                  <code className="block bg-white px-4 py-3 rounded text-sm break-all">
                    {status.output.version}
                  </code>
                </div>
                
                <div>
                  <p className="text-sm text-green-800 mb-2 font-medium">Weights URL:</p>
                  <code className="block bg-white px-4 py-3 rounded text-sm break-all">
                    {status.output.weights}
                  </code>
                </div>

                <div className="pt-4 border-t border-green-200">
                  <p className="text-green-800 mb-3">
                    <strong>Prochaine étape:</strong> Utilise ce LoRA dans tes générations !
                  </p>
                  <a
                    href={`/test?lora=${status.output.version}`}
                    className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                  >
                    🎨 Tester le LoRA maintenant
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {status?.status === 'failed' && status.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="font-semibold text-red-900 mb-2">Erreur:</h3>
              <p className="text-red-800">{status.error}</p>
            </div>
          )}
        </div>

        {/* Logs */}
        {status?.logs && (
          <div className="bg-gray-900 rounded-lg shadow-xl p-6 mb-8">
            <h3 className="text-white font-semibold mb-4 flex items-center justify-between">
              <span>📋 Logs de Training</span>
              {autoRefresh && (
                <span className="text-sm text-gray-400">
                  Mise à jour automatique toutes les 10s
                </span>
              )}
            </h3>
            <div className="bg-black rounded p-4 overflow-auto max-h-96">
              <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">
                {status.logs}
              </pre>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={fetchStatus}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
          >
            🔄 Rafraîchir le statut
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
              autoRefresh
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {autoRefresh ? '⏸️ Pause Auto-Refresh' : '▶️ Activer Auto-Refresh'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TrainingStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Chargement...</div>
      </div>
    }>
      <TrainingStatusContent />
    </Suspense>
  );
}

