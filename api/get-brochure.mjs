// Scraper per estrarre brochure e video da PropertyFinder
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
    let videoUrl = null;
    let videoType = null; // 'youtube', 'vimeo', 'direct'
    
    // ===== BROCHURE SEARCH =====
    
    // Pattern 1: Direct URL in HTML
    const directPatterns = [
      /https:\/\/new-projects-media\.propertyfinder\.com\/project\/[a-f0-9-]+\/brochure\/[^"'\s<>]+/gi,
      /https:\/\/[^"'\s<>]*propertyfinder[^"'\s<>]*brochure[^"'\s<>]*\.pdf/gi,
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
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/i);
    if (nextDataMatch) {
      const jsonStr = nextDataMatch[1];
      
      // Look for brochure URLs in the JSON
      if (!brochureUrl) {
        const brochureMatches = jsonStr.match(/https:[^"]*new-projects-media\.propertyfinder\.com[^"]*brochure[^"]*/gi);
        if (brochureMatches && brochureMatches.length > 0) {
          brochureUrl = brochureMatches[0].replace(/\\u002F/g, '/').replace(/\\\//g, '/');
        }
      }
      
      // Also try to find any PDF URL
      if (!brochureUrl) {
        const pdfMatches = jsonStr.match(/https:[^"]*new-projects-media[^"]*\.pdf/gi);
        if (pdfMatches && pdfMatches.length > 0) {
          brochureUrl = pdfMatches[0].replace(/\\u002F/g, '/').replace(/\\\//g, '/');
        }
      }

      // Generic search for any URL with brochure in path
      if (!brochureUrl) {
        const anyBrochure = jsonStr.match(/https:[^"]*\/brochure\/[^"]*/gi);
        if (anyBrochure && anyBrochure.length > 0) {
          brochureUrl = anyBrochure[0].replace(/\\u002F/g, '/').replace(/\\\//g, '/');
        }
      }
      
      // ===== VIDEO SEARCH =====
      
      // YouTube
      const youtubePatterns = [
        /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/gi,
        /https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/gi,
        /https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)/gi,
        /"videoId"\s*:\s*"([a-zA-Z0-9_-]+)"/gi,
        /"youtube[^"]*"\s*:\s*"([^"]+)"/gi,
      ];
      
      for (const pattern of youtubePatterns) {
        const matches = jsonStr.match(pattern);
        if (matches && matches.length > 0) {
          let match = matches[0];
          // Extract video ID
          const idMatch = match.match(/(?:v=|embed\/|youtu\.be\/|videoId"\s*:\s*")([a-zA-Z0-9_-]+)/i);
          if (idMatch) {
            videoUrl = `https://www.youtube.com/embed/${idMatch[1]}`;
            videoType = 'youtube';
            break;
          } else if (match.includes('youtube.com') || match.includes('youtu.be')) {
            videoUrl = match.replace(/\\u002F/g, '/').replace(/\\\//g, '/').replace(/"/g, '');
            videoType = 'youtube';
            break;
          }
        }
      }
      
      // Vimeo
      if (!videoUrl) {
        const vimeoPatterns = [
          /https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/gi,
          /https?:\/\/player\.vimeo\.com\/video\/(\d+)/gi,
        ];
        
        for (const pattern of vimeoPatterns) {
          const matches = jsonStr.match(pattern);
          if (matches && matches.length > 0) {
            const idMatch = matches[0].match(/(\d+)/);
            if (idMatch) {
              videoUrl = `https://player.vimeo.com/video/${idMatch[1]}`;
              videoType = 'vimeo';
              break;
            }
          }
        }
      }
      
      // Direct video URL (mp4, etc)
      if (!videoUrl) {
        const directVideoMatch = jsonStr.match(/https:[^"]*\.(mp4|webm|mov)[^"]*/gi);
        if (directVideoMatch && directVideoMatch.length > 0) {
          videoUrl = directVideoMatch[0].replace(/\\u002F/g, '/').replace(/\\\//g, '/');
          videoType = 'direct';
        }
      }

      // PropertyFinder video URL
      if (!videoUrl) {
        const pfVideoMatch = jsonStr.match(/https:[^"]*new-projects-media[^"]*video[^"]*/gi);
        if (pfVideoMatch && pfVideoMatch.length > 0) {
          videoUrl = pfVideoMatch[0].replace(/\\u002F/g, '/').replace(/\\\//g, '/');
          videoType = 'direct';
        }
      }
    }

    // Also search video in HTML directly
    if (!videoUrl) {
      const htmlYoutubeMatch = html.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]+)/i);
      if (htmlYoutubeMatch) {
        videoUrl = `https://www.youtube.com/embed/${htmlYoutubeMatch[1]}`;
        videoType = 'youtube';
      }
    }

    // Clean up URLs
    if (brochureUrl) {
      brochureUrl = brochureUrl.replace(/\\+/g, '').replace(/&amp;/g, '&');
    }
    if (videoUrl) {
      videoUrl = videoUrl.replace(/\\+/g, '').replace(/&amp;/g, '&');
    }

    const hasContent = brochureUrl || videoUrl;

    if (hasContent) {
      // Cache per 24 ore
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
      return res.status(200).json({ 
        success: true, 
        brochure_url: brochureUrl || null,
        video_url: videoUrl || null,
        video_type: videoType,
        source_url: pfUrl
      });
    } else {
      return res.status(404).json({ 
        success: false, 
        error: 'No brochure or video found on page',
        source_url: pfUrl
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
