import { NextResponse } from 'next/server';
import { checkApiStatus } from '@/lib/replicate';
import { checkMakeStatus, isMakeConfigured } from '@/lib/make';

interface StatusResponse {
  status: 'ok' | 'error' | 'partial';
  timestamp: string;
  services: {
    replicate: {
      ok: boolean;
      error?: string;
    };
    make: {
      ok: boolean;
      error?: string;
    };
  };
  config: {
    replicateConfigured: boolean;
    makeConfigured: boolean;
    cronSecretConfigured: boolean;
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
  const config = {
    replicateConfigured: !!process.env.REPLICATE_API_TOKEN,
    makeConfigured: isMakeConfigured(),
    cronSecretConfigured: !!process.env.CRON_SECRET,
  };
  
  // Check Replicate
  const replicateStatus = await checkApiStatus();
  
  // Check Make.com
  const makeStatus = await checkMakeStatus();
  
  // Determine overall status
  const allOk = replicateStatus.ok && makeStatus.ok;
  const allFailed = !replicateStatus.ok && !makeStatus.ok;
  
  return NextResponse.json({
    status: allOk ? 'ok' : allFailed ? 'error' : 'partial',
    timestamp,
    services: {
      replicate: {
        ok: replicateStatus.ok,
        error: replicateStatus.error,
      },
      make: {
        ok: makeStatus.ok,
        error: makeStatus.error,
      },
    },
    config,
  });
}
