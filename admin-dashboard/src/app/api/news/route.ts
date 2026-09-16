import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side proxy for the GNews API.
 * This avoids CORS issues when calling gnews.io from the browser.
 *
 * GET /api/news?q=India+real+estate&max=10
 */
export async function GET(req: NextRequest) {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GNEWS_API_KEY not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || 'India real estate OR property market OR housing';
  const max = searchParams.get('max') || '10';
  const lang = searchParams.get('lang') || 'en';
  const country = searchParams.get('country') || 'in';

  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=${lang}&country=${country}&max=${max}&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: 'GNews API error', details: text }, { status: response.status });
    }
    const data = await response.json();

    // Allow cross-origin requests from the Expo app
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch news', message: err.message }, { status: 502 });
  }
}
