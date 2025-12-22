import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-6xl">⭐</span>
          </div>
          <h1 className="text-5xl font-light text-gray-900 mb-4 tracking-tight">
            Mila Verne
          </h1>
          <p className="text-xl text-gray-500 font-light">
            AI-Powered Instagram Automation
          </p>
        </header>

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            System Status
          </h2>
          
          <div className="grid gap-4 md:grid-cols-3">
            <StatusItem 
              label="API Endpoint" 
              value="/api/auto-post" 
              status="ready" 
            />
            <StatusItem 
              label="Image Generation" 
              value="Replicate (Flux + InstantID)" 
              status="pending" 
            />
            <StatusItem 
              label="Publishing" 
              value="Buffer API" 
              status="pending" 
            />
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-100">
            <Link 
              href="/api/status"
              className="text-sm text-rose-500 hover:text-rose-600 transition-colors"
            >
              Check detailed status →
            </Link>
          </div>
        </div>

        {/* Character Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            Character Profile
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <InfoItem label="Name" value="Mila Verne" />
            <InfoItem label="Age" value="22 years old" />
            <InfoItem label="Origin" value="Nice → Paris" />
            <InfoItem label="Style" value="Fitness French Girl" />
            <InfoItem label="Hair" value="Copper/Auburn" />
            <InfoItem label="Signature" value="Star necklace + Tongue piercing" />
          </div>
        </div>

        {/* Tools */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            Tools
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Link 
              href="/analytics"
              className="block p-6 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl border border-violet-200 hover:border-violet-300 transition-colors group"
            >
              <span className="text-2xl mb-3 block">📊</span>
              <h3 className="font-medium text-gray-900 group-hover:text-violet-600 transition-colors">
                Analytics
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Performance et évolution des comptes
              </p>
            </Link>
            <Link 
              href="/smart-comment"
              className="block p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:border-purple-300 transition-colors group"
            >
              <span className="text-2xl mb-3 block">💬</span>
              <h3 className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                Smart Comment
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Generate personalized comments from IG screenshots
              </p>
            </Link>
            <Link 
              href="/select-base"
              className="block p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 hover:border-amber-300 transition-colors group"
            >
              <span className="text-2xl mb-3 block">📸</span>
              <h3 className="font-medium text-gray-900 group-hover:text-amber-600 transition-colors">
                Select Base Portrait
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Generate and choose the reference face for consistency
              </p>
            </Link>
            <Link 
              href="/test"
              className="block p-6 bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl border border-rose-200 hover:border-rose-300 transition-colors group"
            >
              <span className="text-2xl mb-3 block">🧪</span>
              <h3 className="font-medium text-gray-900 group-hover:text-rose-600 transition-colors">
                Test Generation
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Test image generation with different templates
              </p>
            </Link>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            API Endpoints
          </h2>
          
          <div className="space-y-4">
            <EndpointItem 
              method="POST" 
              path="/api/smart-comment" 
              description="Generate smart comment from screenshot"
            />
            <EndpointItem 
              method="POST" 
              path="/api/auto-post" 
              description="Generate and publish a new post"
            />
            <EndpointItem 
              method="GET" 
              path="/api/status" 
              description="Check service status"
            />
            <EndpointItem 
              method="POST" 
              path="/api/generate-base" 
              description="Generate base portraits"
            />
          </div>
        </div>

        {/* Quick Start */}
        <div className="bg-gradient-to-r from-rose-500 to-amber-500 rounded-2xl p-8 text-white">
          <h2 className="text-lg font-medium mb-4">
            Quick Start
          </h2>
          <ol className="space-y-2 text-rose-100">
            <li>1. Copy <code className="bg-white/20 px-2 py-0.5 rounded">env.example.txt</code> to <code className="bg-white/20 px-2 py-0.5 rounded">.env.local</code></li>
            <li>2. Add your API keys (Nanobanana, Buffer)</li>
            <li>3. Deploy to Vercel</li>
            <li>4. Set up cron jobs on cron-job.org</li>
          </ol>
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 text-gray-400 text-sm">
          <p>Mila Verne — Fitness French Girl AI</p>
          <p className="mt-1">Built with Next.js • Powered by AI</p>
        </footer>
      </div>
    </main>
  );
}

function StatusItem({ label, value, status }: { label: string; value: string; status: 'ready' | 'pending' | 'error' }) {
  const statusColors = {
    ready: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
  };
  
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
      <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${statusColors[status]}`}>
        {status}
      </span>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function EndpointItem({ method, path, description }: { method: string; path: string; description: string }) {
  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
      <span className={`text-xs font-mono font-bold px-2 py-1 rounded ${
        method === 'POST' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
      }`}>
        {method}
      </span>
      <code className="text-sm font-mono text-gray-700">{path}</code>
      <span className="text-sm text-gray-500 ml-auto">{description}</span>
    </div>
  );
}
