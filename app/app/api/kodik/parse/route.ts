import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface KodikParsed {
  host: string;
  type: string;
  id: string;
  hash: string;
  quality: string;
}

interface KodikVideoResult {
  quality: string;
  url: string;
  type: string;
}

const KODIK_DOMAINS = ['kodik.info', 'aniqit.com', 'kodik.cc', 'kodik.biz'];
const FALLBACK_ENDPOINTS = ['/ftor', '/kor', '/gvi'];

const kodikLinkRegexp = /^(?:https?:|)\/\/([a-z0-9]+\.[a-z]+)\/([a-z]+)\/(\d+)\/([0-9a-z]+)\/(\d+p)/;

function parseKodikUrl(url: string): KodikParsed | null {
  const match = kodikLinkRegexp.exec(url);
  if (match) {
    return {
      host: match[1],
      type: match[2],
      id: match[3],
      hash: match[4],
      quality: match[5],
    };
  }

  try {
    const fullUrl = url.startsWith('//') ? `https:${url}` : url;
    const parsed = new URL(fullUrl);
    const parts = parsed.pathname.split('/').filter(Boolean);

    if (parts.length >= 3) {
      return {
        host: parsed.host,
        type: parts[0],
        id: parts[1],
        hash: parts[2],
        quality: parts[3] || '720p',
      };
    }
  } catch {
    // ignore
  }

  return null;
}

// Discover the actual video info endpoint from the player page JS bundle
async function discoverEndpoint(parsed: KodikParsed): Promise<string | null> {
  const domains = [parsed.host, ...KODIK_DOMAINS.filter(d => d !== parsed.host)];

  for (const domain of domains) {
    try {
      // Fetch the actual player page (not root) to find the JS bundle
      const pageUrl = `https://${domain}/${parsed.type}/${parsed.id}/${parsed.hash}/${parsed.quality}`;
      const pageRes = await fetch(pageUrl, { signal: AbortSignal.timeout(5000) });
      if (!pageRes.ok) continue;

      const html = await pageRes.text();
      const scriptMatch = html.match(/src="(\/assets\/js\/app\.player_single\.[a-z0-9]+\.js)"/);
      if (!scriptMatch) continue;

      const jsRes = await fetch(`https://${domain}${scriptMatch[1]}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!jsRes.ok) continue;

      const js = await jsRes.text();
      const endpointMatch = js.match(/type:\s*"POST"\s*,\s*url:\s*atob\("([^"]+)"\)/i);
      if (endpointMatch) {
        const decoded = atob(endpointMatch[1]);
        if (decoded.startsWith('/')) return decoded;
      }
    } catch {
      continue;
    }
  }

  return null;
}

// Fetch video links — try both GET and POST
async function fetchVideoLinks(
  parsed: KodikParsed,
  endpoint: string
): Promise<Record<string, Array<{ src: string; type: string }>>> {
  const params = new URLSearchParams({
    type: parsed.type,
    id: parsed.id,
    hash: parsed.hash,
  });

  const domains = [parsed.host, ...KODIK_DOMAINS.filter(d => d !== parsed.host)];

  for (const domain of domains) {
    // Try GET first, then POST
    for (const method of ['GET', 'POST'] as const) {
      try {
        const url = method === 'GET'
          ? `https://${domain}${endpoint}?${params.toString()}`
          : `https://${domain}${endpoint}`;

        const response = await fetch(url, {
          method,
          ...(method === 'POST' ? {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
          } : {}),
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) continue;

        const text = await response.text();
        if (!text.trim()) continue;

        let data: { links?: Record<string, Array<{ src: string; type: string }>> };
        try {
          data = JSON.parse(text);
        } catch {
          continue;
        }

        if (data.links && Object.keys(data.links).length > 0) {
          return data.links;
        }
      } catch {
        continue;
      }
    }
  }

  throw new Error('Failed to fetch video links from all domains');
}

// Decrypt video source URL: ROT18 + Base64
function decryptSource(encrypted: string): string | null {
  try {
    const zCharCode = 'Z'.charCodeAt(0);
    const decryptedBase64 = encrypted.replace(/[a-zA-Z]/g, (e) => {
      let eCharCode = e.charCodeAt(0);
      return String.fromCharCode(
        (eCharCode <= zCharCode ? 90 : 122) >= (eCharCode = eCharCode + 18)
          ? eCharCode
          : eCharCode - 26
      );
    });
    return atob(decryptedBase64);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url: kodikUrl } = (await request.json()) as { url: string };

    if (!kodikUrl) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      );
    }

    const parsed = parseKodikUrl(kodikUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid Kodik URL format' },
        { status: 400 }
      );
    }

    // Discover actual endpoint, fall back to known ones
    const discoveredEndpoint = await discoverEndpoint(parsed);
    const endpoints = discoveredEndpoint
      ? [discoveredEndpoint, ...FALLBACK_ENDPOINTS.filter(e => e !== discoveredEndpoint)]
      : FALLBACK_ENDPOINTS;

    // Try each endpoint
    let encryptedLinks: Record<string, Array<{ src: string; type: string }>> | null = null;

    for (const endpoint of endpoints) {
      try {
        encryptedLinks = await fetchVideoLinks(parsed, endpoint);
        break;
      } catch {
        continue;
      }
    }

    if (!encryptedLinks) {
      return NextResponse.json(
        { error: 'Failed to fetch video links from all endpoints' },
        { status: 502 }
      );
    }

    // Decrypt links
    const results: KodikVideoResult[] = [];

    for (const [quality, sources] of Object.entries(encryptedLinks)) {
      if (quality === 'default') continue;

      for (const source of sources) {
        if (!source.src || !source.type) continue;

        const decrypted = decryptSource(source.src);
        if (!decrypted) continue;

        let videoUrl = decrypted;
        if (videoUrl.startsWith('//')) {
          videoUrl = 'https:' + videoUrl;
        }

        results.push({
          quality,
          url: videoUrl,
          type: source.type,
        });
      }
    }

    if (results.length === 0) {
      return NextResponse.json(
        { error: 'No video links found after decryption' },
        { status: 404 }
      );
    }

    results.sort((a, b) => {
      const aVal = parseInt(a.quality) || 0;
      const bVal = parseInt(b.quality) || 0;
      return bVal - aVal;
    });

    return NextResponse.json({ links: results });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Kodik parse error:', message, error);
    return NextResponse.json(
      { error: 'Failed to parse Kodik URL', detail: message },
      { status: 500 }
    );
  }
}
