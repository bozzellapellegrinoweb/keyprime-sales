import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wqtylxrrerhbxagdzftn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxdHlseHJyZXJoYnhhZ2R6ZnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NjkyNjAsImV4cCI6MjA4NzI0NTI2MH0.oXUs9ITNi6lEFat_5FH0x-Exw5MDgRhwx6T0yL3xiWQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  try {
    const search = req.query.search || 'holm';
    
    const { data, error } = await supabase
      .from('pf_projects')
      .select('project_id, title, url, raw_data')
      .ilike('title', `%${search}%`)
      .limit(1);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Project not found', search });
    }
    
    const project = data[0];
    const rawData = project.raw_data || {};
    
    // Find all keys that might contain brochure
    const findBrochureKeys = (obj, prefix = '') => {
      const results = [];
      for (const [key, value] of Object.entries(obj || {})) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (key.toLowerCase().includes('brochure') || key.toLowerCase().includes('document') || key.toLowerCase().includes('pdf')) {
          results.push({ path, value });
        }
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          results.push(...findBrochureKeys(value, path));
        }
      }
      return results;
    };
    
    const brochureFields = findBrochureKeys(rawData);
    
    return res.status(200).json({
      project_id: project.project_id,
      title: project.title,
      url: project.url,
      brochure_fields: brochureFields,
      raw_data_keys: Object.keys(rawData),
      // Include some likely fields
      likely_brochure: rawData.brochure || rawData.documents || rawData.media || rawData.downloads || null
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
