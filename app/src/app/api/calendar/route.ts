import { NextResponse } from 'next/server';
import {
  getPostingSlotsForDate,
  generateContentBrief,
  getSeason,
  getDayType,
  getSunTimes,
  CALENDAR_INFO,
} from '@/config/calendar';
import { getActiveLocations, getActiveLocationById, LOCATION_STATS } from '@/config/locations';

/**
 * GET /api/calendar
 * Returns today's posting schedule and content briefs
 */
export async function GET() {
  const now = new Date();
  const slots = getPostingSlotsForDate(now);
  const { sunrise, sunset } = getSunTimes(now);
  
  // Generate content briefs for each slot
  const briefs = slots.map(slot => generateContentBrief(slot));
  
  return NextResponse.json({
    date: now.toISOString(),
    timezone: CALENDAR_INFO.timezone,
    dayType: getDayType(now),
    season: getSeason(now),
    sunTimes: {
      sunrise: `${Math.floor(sunrise)}:${Math.round((sunrise % 1) * 60).toString().padStart(2, '0')}`,
      sunset: `${Math.floor(sunset)}:${Math.round((sunset % 1) * 60).toString().padStart(2, '0')}`,
    },
    activeLocations: LOCATION_STATS.active,
    slots: slots.map((slot, i) => ({
      ...slot,
      time: `${slot.hour.toString().padStart(2, '0')}:${slot.minute.toString().padStart(2, '0')}`,
      brief: briefs[i],
      locationDetails: getActiveLocationById(briefs[i].location),
    })),
  });
}

