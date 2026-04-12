/**
 * database.js - Project Guardian (Supabase Edition)
 * Redirects all local storage calls to the Live Cloud Database.
 */
import { createClient } from '@supabase/supabase-js';

// 1. Connection Setup
// Replace these with the actual keys from your Supabase 'API Keys' screenshot
const supabaseUrl = 'https://bwlmblglaslgasutxyyd.supabase.co';
const supabaseKey = 'YOUR_ACTUAL_ANON_KEY_STARTING_WITH_eyJ'; // Found in image_16539e.png

export const supabase = createClient(supabaseUrl, supabaseKey);

/** ─── CORE EXPORTS ─── */

/** Pulls EVERYTHING for the Map and Dashboard */
export const getMapOverlay = async () => {
  try {
    // Fetch Live Threats (Reports)
    const { data: threats, error: tErr } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch Live Safe Zones
    const { data: safeZones, error: sErr } = await supabase
      .from('safe_zones')
      .select('*');

    if (tErr || sErr) throw (tErr || sErr);

    // MAPPING: Ensure DB 'lat/lng' works with App 'latitude/longitude'
    return {
      threats: (threats || []).map(t => ({
        ...t,
        latitude: t.lat, // Crawler uses 'lat'
        longitude: t.lng, // Crawler uses 'lng'
      })),
      safeZones: (safeZones || []).map(z => ({
        ...z,
        latitude: z.lat,
        longitude: z.lng,
      }))
    };
  } catch (err) {
    console.error('[DB] Cloud Fetch Error:', err.message);
    return { threats: [], safeZones: [] };
  }
};

/** Create a new report from the 'Report' screen */
export const createReport = async (data) => {
  const { data: result, error } = await supabase
    .from('reports')
    .insert([{
      title: data.title,
      category: data.category,
      lat: data.latitude,
      lng: data.longitude,
      description: data.description || '',
      upvotes: 0,
      status: 'active'
    }])
    .select();

  if (error) throw error;
  return result[0].id;
};

/** Dashboard Logic: Pulls all reports for the Priority Poll */
export const getAllReports = async () => {
  const { threats } = await getMapOverlay();
  return threats;
};

/** Upvote logic for the Dashboard Poll */
export const upvoteReport = async (id) => {
  // 1. Fetch current upvotes
  const { data: current } = await supabase.from('reports').select('upvotes').eq('id', id).single();
  
  // 2. Increment
  const { data: updated, error } = await supabase
    .from('reports')
    .update({ upvotes: (current?.upvotes || 0) + 1 })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return { ...updated, userUpvoted: true };
};

export const logEmergency = async (type, lat, lng) => {
  await supabase.from('emergency_logs').insert([{ trigger_type: type, lat, lng, status: 'triggered' }]);
};

export const setupDatabase = async () => console.log('[Guardian DB] Cloud Sync Active');
export const resetDatabase = async () => console.warn('Wipe ignored: Manage Cloud data via Dashboard.');