import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wqtylxrrerhbxagdzftn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxdHlseHJyZXJoYnhhZ2R6ZnRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY2OTI2MCwiZXhwIjoyMDg3MjQ1MjYwfQ.l97tHyVwh3TYIaueNDCCHwtgi12RBcvHas351DJ-pO8';

const PF_API_HOST = 'uae-real-estate-api-propertyfinder-ae-data.p.rapidapi.com';
const PF_API_KEY = '726ac8a1f8msh5ec783ecc467b76p1e1338jsn88a853551916';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function transformProject(p) {
  return {
    project_id: p.project_id,
    title: p.title,
    location_name: p.location?.name || null,
    location_full: p.location?.full_name || null,
    developer_name: p.developer?.name || null,
    price_from: p.price_from || null,
    bedrooms: p.bedrooms || null,
    delivery_date: p.delivery_date ? p.delivery_date.split('T')[0] : null,
    construction_phase: p.construction_phase_key || null,
    hotness_level: p.hotness_level || null,
    images: p.images || null,
    payment_plans: p.payment_plans || null,
    url: p.url || null,
    raw_data: p,
    updated_at: new Date().toISOString()
  };
}

export default async function handler(req, res) {
  try {
    const startTime = Date.now();
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    
    let currentOffset = offset;
    let totalSynced = 0;
    let skipped = 0;
    
    for (let i = 0; i < 40; i++) {
      const apiUrl = 'https://' + PF_API_HOST + '/projects?limit=50&offset=' + currentOffset;
      const response = await fetch(apiUrl, {
        headers: {
          'x-rapidapi-host': PF_API_HOST,
          'x-rapidapi-key': PF_API_KEY
        }
      });
      
      if (!response.ok) break;
      
      const data = await response.json();
      const projects = data.data || [];
      
      if (projects.length === 0) break;
      
      const activeProjects = projects.filter(function(p) {
        return p.construction_phase_key !== 'completed';
      });
      skipped += projects.length - activeProjects.length;
      
      if (activeProjects.length > 0) {
        const transformed = activeProjects.map(transformProject);
        await supabase.from('pf_projects').upsert(transformed, { onConflict: 'project_id' });
        totalSynced += activeProjects.length;
      }
      
      if (!data.pagination || !data.pagination.has_next) break;
      currentOffset += 50;
      await new Promise(function(r) { setTimeout(r, 100); });
    }
    
    const countResult = await supabase.from('pf_projects').select('*', { count: 'exact', head: true });
    
    return res.status(200).json({
      success: true,
      startedFrom: offset,
      endedAt: currentOffset,
      synced: totalSynced,
      skipped: skipped,
      totalInDb: countResult.count,
      nextOffset: currentOffset + 50,
      duration: ((Date.now() - startTime) / 1000).toFixed(1) + 's'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
