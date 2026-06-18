import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wqtylxrrerhbxagdzftn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxdHlseHJyZXJoYnhhZ2R6ZnRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY2OTI2MCwiZXhwIjoyMDg3MjQ1MjYwfQ.l97tHyVwh3TYIaueNDCCHwtgi12RBcvHas351DJ-pO8';

const PF_API_HOST = 'uae-real-estate-api-propertyfinder-ae-data.p.rapidapi.com';
const PF_API_KEY = '726ac8a1f8msh5ec783ecc467b76p1e1338jsn88a853551916';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function transformProject(p) {
  // Try to find brochure URL in various possible locations
  const brochureUrl = p.brochure?.url || p.brochure || p.documents?.brochure?.url || p.documents?.brochure || p.media?.brochure?.url || p.media?.brochure || p.brochure_url || null;
  
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
    brochure_url: brochureUrl,
    raw_data: p,
    updated_at: new Date().toISOString()
  };
}

async function getAllExistingIds() {
  const ids = new Set();
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from('pf_projects').select('project_id').range(from, from + 999);
    if (error || !data || data.length === 0) break;
    for (const r of data) ids.add(r.project_id);
    if (data.length < 1000) break;
    from += 1000;
  }
  return ids;
}

export default async function handler(req, res) {
  try {
    const startTime = Date.now();
    const existingIds = await getAllExistingIds();

    let currentOffset = 0;
    let totalNew = 0;
    let totalUpdated = 0;
    let skipped = 0;
    let apiCalls = 0;
    let apiErrors = [];

    for (let i = 0; i < 80; i++) {
      const apiUrl = 'https://' + PF_API_HOST + '/projects?limit=50&offset=' + currentOffset;
      const response = await fetch(apiUrl, {
        headers: {
          'x-rapidapi-host': PF_API_HOST,
          'x-rapidapi-key': PF_API_KEY
        }
      });
      apiCalls++;

      if (!response.ok) {
        const errBody = await response.text().catch(() => 'unknown');
        const errMsg = 'API error ' + response.status + ' at offset ' + currentOffset + ': ' + errBody;
        console.error(errMsg);
        apiErrors.push(errMsg);
        break;
      }

      const data = await response.json();
      const projects = data.data || [];

      if (projects.length === 0) break;

      const activeProjects = projects.filter(function(p) {
        return p.construction_phase_key !== 'completed';
      });
      skipped += projects.length - activeProjects.length;

      if (activeProjects.length > 0) {
        const newProjects = activeProjects.filter(function(p) { return !existingIds.has(p.project_id); });
        const existingProjects = activeProjects.filter(function(p) { return existingIds.has(p.project_id); });

        if (newProjects.length > 0) {
          const transformed = newProjects.map(transformProject);
          const { error } = await supabase.from('pf_projects').upsert(transformed, { onConflict: 'project_id' });
          if (error) console.error('Upsert error (new):', error.message);
          else {
            totalNew += newProjects.length;
            for (const p of newProjects) existingIds.add(p.project_id);
          }
        }

        if (existingProjects.length > 0) {
          const transformed = existingProjects.map(transformProject);
          const { error } = await supabase.from('pf_projects').upsert(transformed, { onConflict: 'project_id' });
          if (error) console.error('Upsert error (update):', error.message);
          else totalUpdated += existingProjects.length;
        }
      }

      if (!data.pagination || !data.pagination.has_next) break;
      currentOffset += 50;
      await new Promise(function(r) { setTimeout(r, 150); });
    }

    const countResult = await supabase.from('pf_projects').select('*', { count: 'exact', head: true });

    const result = {
      success: apiErrors.length === 0,
      apiCalls: apiCalls,
      newProjects: totalNew,
      updatedProjects: totalUpdated,
      completedSkipped: skipped,
      totalInDb: countResult.count,
      errors: apiErrors,
      duration: ((Date.now() - startTime) / 1000).toFixed(1) + 's'
    };

    console.log('Sync completed:', JSON.stringify(result));

    return res.status(apiErrors.length > 0 ? 500 : 200).json(result);
  } catch (err) {
    console.error('Sync fatal error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
