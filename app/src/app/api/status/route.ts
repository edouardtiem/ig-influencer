import { NextResponse } from 'next/server';
import { checkApiStatus } from '@/lib/replicate';
import { isFanvueConfigured, getTokens } from '@/lib/fanvue';

interface StatusResponse {
  status: 'ok' | 'error';
  timestamp: string;
  services: {
    replicate: {
      ok: boolean;
      error?: string;
    };
    claude: {
      configured: boolean;
    };
    fanvue: {
      configured: boolean;
      connected: boolean;
    };
  };
  config: {
    replicateConfigured: boolean;
    claudeConfigured: boolean;
    cronSecretConfigured: boolean;
    fanvueConfigured: boolean;
  };
}

/**
 * GET /api/status
 * 
 * Check the status of all external services
 */
export async function GET(): Promise<NextResponse<StatusResponse>> {
  const timestamp = new Date().toISOString();
  
  // Check config
  const fanvueConfigured = isFanvueConfigured();
  const fanvueTokens = getTokens();
  
  const config = {
    replicateConfigured: !!process.env.REPLICATE_API_TOKEN,
    claudeConfigured: !!process.env.Claude_key,
    cronSecretConfigured: !!process.env.CRON_SECRET,
    fanvueConfigured,
  };
  
  // Check Replicate
  const replicateStatus = await checkApiStatus();
  
  return NextResponse.json({
    status: replicateStatus.ok ? 'ok' : 'error',
    timestamp,
    services: {
      replicate: {
        ok: replicateStatus.ok,
        error: replicateStatus.error,
      },
      claude: {
        configured: config.claudeConfigured,
      },
      fanvue: {
        configured: fanvueConfigured,
        connected: !!fanvueTokens,
      },
    },
    config,
  });
}
