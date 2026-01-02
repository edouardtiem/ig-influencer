// ===========================================
// DM SETTINGS API — Pause/Resume DM System
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface DMSettings {
  paused: boolean;
  paused_at: string | null;
  paused_reason: string | null;
}

/**
 * GET /api/dm/settings
 * Get current DM system settings
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('elena_settings')
      .select('value, updated_at')
      .eq('key', 'dm_system')
      .single();

    if (error) {
      console.error('Error fetching DM settings:', error);
      // Return default if not found
      return NextResponse.json({
        paused: false,
        paused_at: null,
        paused_reason: null,
        updated_at: null,
      });
    }

    return NextResponse.json({
      ...data.value,
      updated_at: data.updated_at,
    });
  } catch (error) {
    console.error('DM settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dm/settings
 * Update DM system settings (pause/resume)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paused, reason } = body;

    if (typeof paused !== 'boolean') {
      return NextResponse.json(
        { error: 'paused must be a boolean' },
        { status: 400 }
      );
    }

    const newSettings: DMSettings = {
      paused,
      paused_at: paused ? new Date().toISOString() : null,
      paused_reason: paused ? (reason || 'Manual pause') : null,
    };

    const { data, error } = await supabase
      .from('elena_settings')
      .upsert({
        key: 'dm_system',
        value: newSettings,
      })
      .select('value, updated_at')
      .single();

    if (error) {
      console.error('Error updating DM settings:', error);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    console.log(`🔧 DM System ${paused ? 'PAUSED' : 'RESUMED'}${reason ? ` (${reason})` : ''}`);

    return NextResponse.json({
      success: true,
      ...data.value,
      updated_at: data.updated_at,
    });
  } catch (error) {
    console.error('DM settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

