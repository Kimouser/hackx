/**
 * database.js - Project Guardian (Supabase + AI Moderation Edition)
 */
import { createClient } from '@supabase/supabase-js';
import { moderateReport } from '../services/moderationService';

// 1. Connection Setup
const supabaseUrl = 'https://bwlmblglaslgasutxyyd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1ibGdsYXNsZ2FzdXR4eXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MTc4NTQsImV4cCI6MjA5MTQ5Mzg1NH0.g37KcDIM4V2RmZTuRjKW961XgtQCfL1PALb8Yp2hI-M';

export const supabase = createClient(supabaseUrl, supabaseKey);

/** ─── CORE EXPORTS ─── */

/** * Create a new report with Real-time Gemini Moderation
 * @param {Object} data - { title, description, latitude, longitude, category, imageBase64, image_uri }
 */
export const createReport = async (data) => {
  try {
    // 1. Run AI Moderation FIRST (Checks text and photo if present)
    const aiResult = await moderateReport(
      data.title, 
      data.description, 
      data.imageBase64 || null
    );

    // 2. Insert into Supabase with the AI's verdict
    const { data: result, error } = await supabase
      .from('reports')
      .insert([{
        title: data.title,
        category: data.category,
        lat: data.latitude, // Mapping frontend 'latitude' to DB 'lat'
        lng: data.longitude, // Mapping frontend 'longitude' to DB 'lng'
        description: data.description || '',
        image_uri: data.image_uri || null,
        upvotes: 0,
        // AI Logic: APPROVED becomes 'active', REJECTED becomes 'flagged'
        status: aiResult.status === 'APPROVED' ? 'active' : 'flagged',
        ai_reason: aiResult.reason 
      }])
      .select();

    if (error) throw error;
    
    // Return the full record for UI feedback
    return result[0];
  } catch (err) {
    console.error('[DB] createReport Error:', err.message);
    throw err;
  }
};

/** Pulls EVERYTHING for the Map and Dashboard (Filtered by AI status) */
export const getMapOverlay = async () => {
  try {
    const { data: threats, error: tErr } = await supabase
      .from('reports')
      .select('*')
      // Only show AI-Approved reports on the public map
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    const { data: safeZones, error: sErr } = await supabase
      .from('safe_zones')
      .select('*');

    if (tErr || sErr) throw (tErr || sErr);

    return {
      threats: (threats || []).map(t => ({
        ...t,
        latitude: t.lat,
        longitude: t.lng,
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

/** Dashboard Logic: Pulls all reports for the Priority Poll */
export const getAllReports = async () => {
  const { threats } = await getMapOverlay();
  return threats;
};

/** Upvote logic for the Dashboard Poll */
export const upvoteReport = async (id) => {
  const { data: current } = await supabase.from('reports').select('upvotes').eq('id', id).single();
  
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

export const setupDatabase = async () => console.log('[Guardian DB] Cloud Sync + AI Mod Active');
export const resetDatabase = async () => console.warn('Wipe ignored: Manage Cloud data via Dashboard.');