import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

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

// Parse Kodik URL into components
function parseKodikUrl(url: string): KodikParsed | null {
  const pattern =
    /^(?:https?:|)\/\/([a-z0-9]+\.[a-z]+)\/([a-z]+)\/(\d+)\/([0-9a-z]+)\/(\d+p)/;
  const match = url.match(pattern);

  if (match) {
    return {
      host: match[1],
      type: match[2],
      id: match[3],
      hash: match[4],
      quality: match[5],
    };
  }

  // Alternative format
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

// Decrypt a single source string using Caesar cipher + Base64
// Tries the known rotation (18) first, then brute-forces all 26 if needed
function decryptSource(encrypted: string): string | null {
  for (const rot of [18, ...Array.from({ length: 26 }, (_, i) => i).filter(i => i !== 18)]) {
    try {
      const shifted = encrypted.replace(/[a-zA-Z]/g, (ch) => {
        const code = ch.charCodeAt(0);
        const bound = code <= 90 ? 90 : 122;
        let newCode = code + rot;
        if (newCode > bound) newCode -= 26;
        return String.fromCharCode(newCode);
      });

      // Fix base64 padding
      let b64 = shifted.replace(/-/g, '+').replace(/_/g, '/');
      const pad = (4 - (b64.length % 4)) % 4;
      b64 += '='.repeat(pad);

      const decoded = atob(b64);

      // Verify it looks like a URL
      if (decoded.includes('mp4') || decoded.includes('hls') || decoded.includes('manifest') || decoded.includes('.m3u8')) {
        return decoded;
      }
    } catch {
      continue;
    }
  }

  return null;
}

// Fetch the player page and extract urlParams + player script URL
async function fetchPlayerPage(parsed: KodikParsed): Promise<{
  urlParams: Record<string, string>;
  playerScriptUrl: string | null;
  videoType: string;
  videoId: string;
  videoHash: string;
}> {
  const ua = randomUA();

  // Try multiple domains if the original fails
  const domains = [parsed.host, ...KODIK_DOMAINS.filter(d => d !== parsed.host)];

  for (const domain of domains) {
    try {
      const url = `https://${domain}/${parsed.type}/${parsed.id}/${parsed.hash}/${parsed.quality}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': ua },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) continue;

      const html = await response.text();

      // Extract urlParams
      const urlParamsMatch = html.match(/var\s+urlParams\s*=\s*'([^']+)'/);
      const urlParams = urlParamsMatch
        ? (JSON.parse(urlParamsMatch[1]) as Record<string, string>)
        : {};

      // Extract player script URL for endpoint discovery
      const scriptMatch = html.match(/src="(\/assets\/js\/app\.player_single\.[a-z0-9]+\.js)"/);
      const playerScriptUrl = scriptMatch ? scriptMatch[1] : null;

      // Extract video type/id/hash from inline scripts (more reliable than URL parsing)
      const typeMatch = html.match(/\.type\s*=\s*'([^']+)'/);
      const idMatch = html.match(/\.id\s*=\s*'([^']+)'/);
      const hashMatch = html.match(/\.hash\s*=\s*'([^']+)'/);

      return {
        urlParams,
        playerScriptUrl,
        videoType: typeMatch?.[1] || parsed.type,
        videoId: idMatch?.[1] || parsed.id,
        videoHash: hashMatch?.[1] || parsed.hash,
      };
    } catch {
      continue;
    }
  }

  // Fallback
  return {
    urlParams: {},
    playerScriptUrl: null,
    videoType: parsed.type,
    videoId: parsed.id,
    videoHash: parsed.hash,
  };
}

// Discover the actual POST endpoint from the player JS bundle
async function discoverEndpoint(
  host: string,
  playerScriptUrl: string | null
): Promise<string> {
  if (!playerScriptUrl) return '/ftor';

  try {
    const url = `https://${host}${playerScriptUrl}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': randomUA() },
      signal: AbortSignal.timeout(10000),
    });

    const js = await response.text();

    // Look for: type:"POST",url:atob("base64string")
    const match = js.match(/type:\s*"POST"\s*,\s*url:\s*atob\("([^"]+)"\)/i);
    if (match) {
      const decoded = atob(match[1]);
      if (decoded.startsWith('/')) return decoded;
    }
  } catch {
    // ignore
  }

  return '/ftor';
}

// Make the POST request to get encrypted video links
async function fetchVideoLinks(
  host: string,
  endpoint: string,
  urlParams: Record<string, string>,
  videoType: string,
  videoId: string,
  videoHash: string
): Promise<Record<string, Array<{ src: string; type: string }>>> {
  const params: Record<string, string> = {
    ...urlParams,
    type: videoType,
    id: videoId,
    hash: videoHash,
    bad_user: 'true',
    cdn_is_working: 'true',
  };

  // Build form data as URL-encoded string
  const body = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  // Try multiple domains
  const domains = [host, ...KODIK_DOMAINS.filter(d => d !== host)];

  for (const domain of domains) {
    try {
      const url = `https://${domain}${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'User-Agent': randomUA(),
          'Content-Type': 'application/x-www-form-urlencoded',
          Referer: `https://${domain}/`,
          Origin: `https://${domain}`,
        },
        body,
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) continue;

      const data = (await response.json()) as {
        links?: Record<string, Array<{ src: string; type: string }>>;
      };

      if (data.links && Object.keys(data.links).length > 0) {
        return data.links;
      }
    } catch {
      continue;
    }
  }

  throw new Error('Failed to fetch video links from all domains');
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

    // 1. Parse the Kodik URL
    const parsed = parseKodikUrl(kodikUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid Kodik URL format' },
        { status: 400 }
      );
    }

    // 2. Fetch player page to get urlParams, script URL, and video info
    const { urlParams, playerScriptUrl, videoType, videoId, videoHash } =
      await fetchPlayerPage(parsed);

    // 3. Discover the actual POST endpoint from player JS
    const endpoint = await discoverEndpoint(parsed.host, playerScriptUrl);

    // 4. Fetch encrypted video links
    const encryptedLinks = await fetchVideoLinks(
      parsed.host,
      endpoint,
      urlParams,
      videoType,
      videoId,
      videoHash
    );

    // 5. Decrypt links
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

    // Sort by quality (highest first)
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
