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
    let pfUrl = url;

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
    let brochureUrl = null;
    
    // Pattern 1: Direct URL in HTML
    const directPatterns = [
      /https:\/\/new-projects-media\.propertyfinder\.com\/project\/[a-f0-9-]+\/brochure\/[^"'\s<>]+/gi,
      /https:\/\/[^"'\s<>]*propertyfinder[^"'\s<>]*brochure[^"'\s<>]*\.pdf/gi,
      /https:\/\/[^"'\s<>]*\.pdf[^"'\s<>]*/gi,
    ];

    for (const pattern of directPatterns) {
      const matches = html.match(pattern);
      if (matches) {
        for (const match of matches) {
          if (match.includes('brochure') || match.includes('new-projects-media')) {
            brochureUrl = match.replace(/\\u002F/g, '/').replace(/\\\//g, '/');
            break;
          }
        }
        if (brochureUrl) break;
      }
    }

    // Pattern 2: Search in __NEXT_DATA__ JSON
    if (!brochureUrl) {
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/i);
      if (nextDataMatch) {
        const jsonStr = nextDataMatch[1];
        
        // Look for brochure URLs in the JSON
        const brochureMatches = jsonStr.match(/https:[^"]*new-projects-media\.propertyfinder\.com[^"]*brochure[^"]*/gi);
        if (brochureMatches && brochureMatches.length > 0) {
          brochureUrl = brochureMatches[0].replace(/\\u002F/g, '/').replace(/\\\//g, '/');
        }
        
        // Also try to find any PDF URL
        if (!brochureUrl) {
          const pdfMatches = jsonStr.match(/https:[^"]*new-projects-media[^"]*\.pdf/gi);
          if (pdfMatches && pdfMatches.length > 0) {
            brochureUrl = pdfMatches[0].replace(/\\u002F/g, '/').replace(/\\\//g, '/');
          }
        }

        // Try to find downloadable documents section
        if (!brochureUrl) {
          const downloadMatches = jsonStr.match(/"downloadUrl"\s*:\s*"([^"]+)"/gi);
          if (downloadMatches) {
            for (const match of downloadMatches) {
              const urlMatch = match.match(/"([^"]+)"/);
              if (urlMatch && urlMatch[1].includes('brochure')) {
                brochureUrl = urlMatch[1].replace(/\\u002F/g, '/').replace(/\\\//g, '/');
                break;
              }
            }
          }
        }

        // Look for documents array
        if (!brochureUrl) {
          const docsMatch = jsonStr.match(/"documents"\s*:\s*\[([^\]]+)\]/i);
          if (docsMatch) {
            const urlInDocs = docsMatch[1].match(/https:[^"]*\.pdf/i);
            if (urlInDocs) {
              brochureUrl = urlInDocs[0].replace(/\\u002F/g, '/').replace(/\\\//g, '/');
            }
          }
        }

        // Look for brochure object
        if (!brochureUrl) {
          const brochureObjMatch = jsonStr.match(/"brochure"\s*:\s*\{[^}]*"url"\s*:\s*"([^"]+)"/i);
          if (brochureObjMatch) {
            brochureUrl = brochureObjMatch[1].replace(/\\u002F/g, '/').replace(/\\\//g, '/');
          }
        }
        
        // Generic search for any URL with brochure in path
        if (!brochureUrl) {
          const anyBrochure = jsonStr.match(/https:[^"]*\/brochure\/[^"]*/gi);
          if (anyBrochure && anyBrochure.length > 0) {
            brochureUrl = anyBrochure[0].replace(/\\u002F/g, '/').replace(/\\\//g, '/');
          }
        }
      }
    }

    // Pattern 3: Look for data attributes
    if (!brochureUrl) {
      const dataAttrMatch = html.match(/data-(?:brochure|download|pdf)-url="([^"]+)"/i);
      if (dataAttrMatch) {
        brochureUrl = dataAttrMatch[1];
      }
    }

    // Pattern 4: Look in any script tag for brochure URLs
    if (!brochureUrl) {
      const scriptMatches = html.match(/<script[^>]*>([^<]*brochure[^<]*)<\/script>/gi);
      if (scriptMatches) {
        for (const script of scriptMatches) {
          const urlMatch = script.match(/https:[^"'\s]*brochure[^"'\s]*/i);
          if (urlMatch) {
            brochureUrl = urlMatch[0].replace(/\\u002F/g, '/').replace(/\\\//g, '/');
            break;
          }
        }
      }
    }

    if (brochureUrl) {
      // Clean up the URL
      brochureUrl = brochureUrl.replace(/\\+/g, '').replace(/&amp;/g, '&');
      
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
