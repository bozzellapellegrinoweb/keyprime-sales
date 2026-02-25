// Scraper per estrarre il link brochure da PropertyFinder
// Chiamata: /api/get-brochure?url=https://www.propertyfinder.ae/en/new-projects/...

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, project_id } = req.query;
  
  if (!url && !project_id) {
    return res.status(400).json({ error: 'Missing url or project_id parameter' });
  }

  try {
    // Se abbiamo project_id, costruiamo l'URL PropertyFinder
    let pfUrl = url;
    if (!pfUrl && project_id) {
      // Dobbiamo prima trovare l'URL del progetto dal database o costruirlo
      pfUrl = `https://www.propertyfinder.ae/en/new-projects/p-${project_id}`;
    }

    // Fetch della pagina PropertyFinder
    const response = await fetch(pfUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'Failed to fetch PropertyFinder page',
        status: response.status 
      });
    }

    const html = await response.text();
    
    // Pattern per trovare il link brochure
    // Cerchiamo: new-projects-media.propertyfinder.com/project/.../brochure/...
    const brochurePatterns = [
      /https:\/\/new-projects-media\.propertyfinder\.com\/project\/[^"'\s]+\/brochure\/[^"'\s]+\.pdf/gi,
      /https:\/\/new-projects-media\.propertyfinder\.com\/project\/[^"'\s]+\/brochure\/application\/[^"'\s]+\/original\.pdf/gi,
      /"brochure":\s*"([^"]+)"/gi,
      /href="([^"]*brochure[^"]*\.pdf)"/gi,
      /data-brochure-url="([^"]+)"/gi,
      /"downloadUrl":\s*"([^"]+brochure[^"]+)"/gi,
    ];

    let brochureUrl = null;
    
    for (const pattern of brochurePatterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        // Pulisci il match
        let match = matches[0];
        // Se è un JSON, estrai il valore
        if (match.includes('":')) {
          const jsonMatch = match.match(/"([^"]+)"/g);
          if (jsonMatch && jsonMatch.length > 1) {
            match = jsonMatch[1].replace(/"/g, '');
          }
        }
        // Se è un href, estrai l'URL
        if (match.includes('href=')) {
          const hrefMatch = match.match(/href="([^"]+)"/);
          if (hrefMatch) {
            match = hrefMatch[1];
          }
        }
        
        // Verifica che sia un URL valido
        if (match.startsWith('http') && match.includes('brochure')) {
          brochureUrl = match;
          break;
        }
      }
    }

    // Cerca anche in eventuali JSON embedded nella pagina
    if (!brochureUrl) {
      const jsonPattern = /<script[^>]*type="application\/json"[^>]*>([^<]+)<\/script>/gi;
      let jsonMatch;
      while ((jsonMatch = jsonPattern.exec(html)) !== null) {
        try {
          const jsonStr = jsonMatch[1];
          if (jsonStr.includes('brochure')) {
            // Cerca URL nel JSON
            const urlMatch = jsonStr.match(/https:\\\/\\\/new-projects-media\.propertyfinder\.com[^"'\s]+brochure[^"'\s]+/i);
            if (urlMatch) {
              brochureUrl = urlMatch[0].replace(/\\\//g, '/');
              break;
            }
          }
        } catch (e) {
          // Ignora errori di parsing JSON
        }
      }
    }

    // Cerca nel Next.js data
    if (!brochureUrl) {
      const nextDataPattern = /<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/i;
      const nextMatch = html.match(nextDataPattern);
      if (nextMatch) {
        try {
          const nextData = JSON.parse(nextMatch[1]);
          const jsonStr = JSON.stringify(nextData);
          const urlMatch = jsonStr.match(/https:[^"]*new-projects-media\.propertyfinder\.com[^"]*brochure[^"]*/i);
          if (urlMatch) {
            brochureUrl = urlMatch[0].replace(/\\\//g, '/').replace(/\\u002F/g, '/');
          }
        } catch (e) {
          // Ignora errori
        }
      }
    }

    if (brochureUrl) {
      // Cache per 24 ore
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
      return res.status(200).json({ 
        success: true, 
        brochure_url: brochureUrl,
        source_url: pfUrl
      });
    } else {
      return res.status(404).json({ 
        success: false, 
        error: 'Brochure not found on page',
        source_url: pfUrl,
        hint: 'The project may not have a brochure available'
      });
    }

  } catch (err) {
    console.error('Scraper error:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
}
