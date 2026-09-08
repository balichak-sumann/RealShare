import { NextRequest, NextResponse } from "next/server";

function extractCoordinatesFromString(text: string): { lat: number; lng: number; placeName?: string } | null {
  if (!text) return null;

  // 1. Check for raw lat,lng numbers (e.g. "17.5113, 78.3846" or "17.5113,78.3846")
  const rawCoordMatch = text.match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
  if (rawCoordMatch) {
    const lat = parseFloat(rawCoordMatch[1]);
    const lng = parseFloat(rawCoordMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  let placeName: string | undefined;

  // Extract place name if present in /place/NAME/@
  const placeMatch = text.match(/\/place\/([^/@?]+)/);
  if (placeMatch) {
    try {
      placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
    } catch {
      placeName = placeMatch[1].replace(/\+/g, " ");
    }
  }

  // 2. High precision place pin coords: !3d17.5113352!4d78.3846852
  const placePinMatch = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (placePinMatch) {
    const lat = parseFloat(placePinMatch[1]);
    const lng = parseFloat(placePinMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng, placeName };
    }
  }

  // 3. Viewport center coords: @17.5113403,78.3821103
  const atMatch = text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng, placeName };
    }
  }

  // 4. Query params: ?q=17.5113,78.3846 or ?query= or &ll= or &center=
  const qMatch = text.match(/[?&](?:q|query|ll|center|sll)=(-?\d+(?:\.\d+)?)[,%2C]+(-?\d+(?:\.\d+)?)/i);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng, placeName };
    }
  }

  // 5. Check inside HTML / meta tags / JSON payloads if full text is HTML
  const ogUrlMatch = text.match(/<meta\s+property=["']og:url["']\s+content=["']([^"']+)["']/i);
  if (ogUrlMatch) {
    const fromOg = extractCoordinatesFromString(ogUrlMatch[1]);
    if (fromOg) return fromOg;
  }

  const metaImageMatch = text.match(/<meta\s+itemprop=["']image["']\s+content=["']([^"']+)["']/i) ||
                         text.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (metaImageMatch) {
    const fromImage = extractCoordinatesFromString(metaImageMatch[1]);
    if (fromImage) return fromImage;
  }

  // 6. Look for window.APP_INITIALIZATION_STATE coordinates array: [null,null,lat,lng] or /@lat,lng
  const appStateMatch = text.match(/\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/);
  if (appStateMatch) {
    const lat = parseFloat(appStateMatch[1]);
    const lng = parseFloat(appStateMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng, placeName };
    }
  }

  return null;
}

async function resolveUrl(inputUrl: string): Promise<{ resolvedUrl: string; bodySnippet?: string }> {
  let currentUrl = inputUrl.trim();
  if (!/^https?:\/\//i.test(currentUrl)) {
    currentUrl = `https://${currentUrl}`;
  }

  // Follow redirects up to 5 times
  let maxRedirects = 5;
  while (maxRedirects > 0) {
    maxRedirects--;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(currentUrl, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        redirect: "manual",
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const location = res.headers.get("location");
      if (location) {
        let nextUrl = location;
        if (nextUrl.startsWith("/")) {
          const parsed = new URL(currentUrl);
          nextUrl = `${parsed.origin}${nextUrl}`;
        }
        currentUrl = nextUrl;

        // Check if coords are already in location
        const coords = extractCoordinatesFromString(currentUrl);
        if (coords) {
          return { resolvedUrl: currentUrl };
        }
      } else {
        // We reached the final page or an unredirected page
        const text = await res.text();
        return { resolvedUrl: res.url || currentUrl, bodySnippet: text };
      }
    } catch (e) {
      break;
    }
  }

  return { resolvedUrl: currentUrl };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body?.url;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Please provide a valid URL string" }, { status: 400 });
    }

    // 1. Try immediate direct parse from string without network request
    const directCoords = extractCoordinatesFromString(url);
    if (directCoords && !url.includes("goo.gl") && !url.includes("maps.app")) {
      return NextResponse.json({
        success: true,
        lat: directCoords.lat,
        lng: directCoords.lng,
        placeName: directCoords.placeName,
        resolvedUrl: url,
      });
    }

    // 2. Resolve short / redirect URL
    const { resolvedUrl, bodySnippet } = await resolveUrl(url);

    // 3. Try parsing coords from resolved URL
    let coords = extractCoordinatesFromString(resolvedUrl);

    // 4. Fallback: Parse from body HTML if not found in URL
    if (!coords && bodySnippet) {
      coords = extractCoordinatesFromString(bodySnippet);
    }

    // 5. If still not found, check if direct parse worked
    if (!coords && directCoords) {
      coords = directCoords;
    }

    if (!coords) {
      return NextResponse.json(
        {
          error: "Could not extract latitude and longitude from the provided URL",
          resolvedUrl,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      lat: coords.lat,
      lng: coords.lng,
      placeName: coords.placeName,
      resolvedUrl,
    });
  } catch (error: any) {
    console.error("Maps resolve error:", error);
    return NextResponse.json({ error: error.message || "Failed to resolve maps URL" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return NextResponse.json({ error: "Missing 'url' query parameter" }, { status: 400 });
  }

  const reqObj = new NextRequest(req.url, {
    method: "POST",
    body: JSON.stringify({ url: urlParam }),
    headers: { "content-type": "application/json" },
  });

  return POST(reqObj);
}
