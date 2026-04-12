/**
 * database.js - Fused Supabase Cloud Edition
 * Keeps your logic intact while moving storage to the Cloud.
 */
import { createClient } from '@supabase/supabase-js';

// ─── Cloud Connection ───
const supabaseUrl = 'https://bwlmblglaslgasutxyyd.supabase.co';
const supabaseKey = 'sb_publishable_CMj7fsHbKEkED98MgCEsaA_a-oYqp_k';
export const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Init ───
export const getDatabase = async () => {
  console.log('[Guardian DB] Connected to Supabase Cloud Engine');
  // Seeding is now handled by your Crawler or Supabase Dashboard
};

export const setupDatabase = getDatabase;

// ─── Report CRUD (Cloud Redirected) ───
export const getAllReports = async () => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .neq('status', 'resolved')
    .order('created_at', { ascending: false });
  
  if (error) { console.error(error); return []; }
  return data;
};

export const getReportsForMap = async () => {
  const reports = await getAllReports();
  return reports.map(r => ({
    id: r.id,
    title: r.title,
    category: r.category,
    severity: r.severity || 'medium',
    latitude: r.lat, // Supabase uses 'lat'
    longitude: r.lng, // Supabase uses 'lng'
    upvotes: r.upvotes,
    status: r.status,
  }));
};

export const createReport = async (data) => {
  const { data: result, error } = await supabase
    .from('reports')
    .insert([{
      title: data.title,
      description: data.description || '',
      category: data.category,
      severity: data.severity || 'medium',
      lat: data.latitude, // Mapping frontend 'latitude' to DB 'lat'
      lng: data.longitude,
      upvotes: 0,
      status: 'active'
    }])
    .select();

  if (error) throw error;
  console.log(`[Guardian DB] Cloud report created: ${data.title}`);
  return result[0].id;
};

export const upvoteReport = async (id) => {
  // 1. Get current upvotes
  const { data: report, error: fErr } = await supabase
    .from('reports')
    .select('upvotes, status')
    .eq('id', id)
    .single();

  if (fErr) throw fErr;

  const newUpvotes = report.upvotes + 1;
  let newStatus = report.status;

  // Municipal Loop logic
  if (newUpvotes >= 10 && report.status === 'active') {
    newStatus = 'municipal_notified';
  }

  const { data: updated, error: uErr } = await supabase
    .from('reports')
    .update({ upvotes: newUpvotes, status: newStatus })
    .eq('id', id)
    .select()
    .single();

  if (uErr) throw uErr;
  return { ...updated, municipalTriggered: newStatus === 'municipal_notified' };
};

// ─── SafeZone Queries ───
export const getAllSafeZones = async () => {
  const { data, error } = await supabase.from('safe_zones').select('*');
  if (error) return [];
  return data;
};

export const getSafeZonesForMap = async () => {
  const zones = await getAllSafeZones();
  return zones.map(z => ({
    id: z.id,
    name: z.name,
    category: z.type, // Mapping DB 'type' to frontend 'category'
    latitude: z.lat,
    longitude: z.lng,
    phone: z.phone || 'N/A',
  }));
};

// ─── Map Overlay (Combined) ───
export const getMapOverlay = async () => {
  const [threats, zones] = await Promise.all([
    getReportsForMap(),
    getSafeZonesForMap(),
  ]);
  return { threats, safeZones: zones };
};

// ─── Emergency Logs ───
export const logEmergency = async (triggerType, latitude, longitude) => {
  const { data, error } = await supabase
    .from('emergency_logs')
    .insert([{
      trigger_type: triggerType,
      lat: latitude || 19.0760,
      lng: longitude || 72.8777,
      status: 'triggered'
    }]);
  
  if (error) console.error("SOS Log failed", error);
  return data?.[0]?.id;
};