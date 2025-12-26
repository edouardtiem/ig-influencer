// ===========================================
// DM CONTACTS API — Stats & Management
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { 
  getDMFunnelStats, 
  getRecentContacts,
  getConversationHistory,
  DMContact 
} from '@/lib/elena-dm';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/dm/contacts
 * 
 * Query params:
 * - stage: Filter by stage (cold, warm, hot, pitched, converted, paid)
 * - limit: Number of contacts to return (default: 20)
 * - stats: If true, return funnel stats instead of contacts
 * - id: If provided, return single contact with conversation history
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const stage = searchParams.get('stage');
  const limit = parseInt(searchParams.get('limit') || '20');
  const showStats = searchParams.get('stats') === 'true';
  const contactId = searchParams.get('id');

  try {
    // Return funnel stats
    if (showStats) {
      const stats = await getDMFunnelStats();
      return NextResponse.json({
        success: true,
        data: {
          funnel: stats,
          conversion_rates: {
            cold_to_warm: stats.cold > 0 
              ? ((stats.warm + stats.hot + stats.pitched + stats.converted + stats.paid) / stats.cold * 100).toFixed(1) + '%'
              : '0%',
            warm_to_hot: stats.warm > 0
              ? ((stats.hot + stats.pitched + stats.converted + stats.paid) / stats.warm * 100).toFixed(1) + '%'
              : '0%',
            hot_to_pitched: stats.hot > 0
              ? ((stats.pitched + stats.converted + stats.paid) / stats.hot * 100).toFixed(1) + '%'
              : '0%',
            pitched_to_converted: stats.pitched > 0
              ? ((stats.converted + stats.paid) / stats.pitched * 100).toFixed(1) + '%'
              : '0%',
            converted_to_paid: stats.converted > 0
              ? (stats.paid / stats.converted * 100).toFixed(1) + '%'
              : '0%',
          },
        },
      });
    }

    // Return single contact with history
    if (contactId) {
      const { data: contact, error } = await supabase
        .from('elena_dm_contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (error || !contact) {
        return NextResponse.json(
          { success: false, error: 'Contact not found' },
          { status: 404 }
        );
      }

      const history = await getConversationHistory(contactId, 50);

      return NextResponse.json({
        success: true,
        data: {
          contact,
          conversation: history,
        },
      });
    }

    // Return list of contacts
    let query = supabase
      .from('elena_dm_contacts')
      .select('*')
      .order('last_contact_at', { ascending: false })
      .limit(limit);

    if (stage) {
      query = query.eq('stage', stage);
    }

    const { data: contacts, error } = await query;

    if (error) {
      console.error('Error fetching contacts:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        contacts: contacts || [],
        count: contacts?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error in contacts API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/dm/contacts
 * 
 * Update a contact (stage, notes, tags, etc.)
 * 
 * Body:
 * - id: Contact ID (required)
 * - stage: New stage (optional)
 * - notes: Notes (optional)
 * - tags: Tags array (optional)
 * - fanvue_link_clicked: boolean (optional)
 * - fanvue_converted_at: timestamp (optional)
 * - fanvue_paid_at: timestamp (optional)
 * - total_revenue: number (optional)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Contact ID required' },
        { status: 400 }
      );
    }

    // Validate stage if provided
    const validStages = ['cold', 'warm', 'hot', 'pitched', 'converted', 'paid'];
    if (updates.stage && !validStages.includes(updates.stage)) {
      return NextResponse.json(
        { success: false, error: `Invalid stage. Must be one of: ${validStages.join(', ')}` },
        { status: 400 }
      );
    }

    // Handle special stage transitions
    if (updates.stage === 'converted' && !updates.fanvue_converted_at) {
      updates.fanvue_converted_at = new Date().toISOString();
    }
    if (updates.stage === 'paid' && !updates.fanvue_paid_at) {
      updates.fanvue_paid_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('elena_dm_contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating contact:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        contact: data,
      },
    });
  } catch (error) {
    console.error('Error in contacts PATCH:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

