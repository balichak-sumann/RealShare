import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Extract filename from the URL path (e.g. /uploads/123_abc.jpg -> 123_abc.jpg)
    const filename = imageUrl.split('/').pop() || '';

    // 1. Try local public/uploads first
    if (filename) {
      const localPath = path.join(process.cwd(), 'public', 'uploads', filename);
      if (fs.existsSync(localPath)) {
        const buffer = fs.readFileSync(localPath);
        const ext = path.extname(localPath).toLowerCase();
        const mimeMap: Record<string, string> = {
          '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
          '.webp': 'image/webp', '.gif': 'image/gif', '.pdf': 'application/pdf',
        };
        return new NextResponse(buffer, {
          headers: { 'Content-Type': mimeMap[ext] || 'image/jpeg', 'Cache-Control': 'public, max-age=3600' },
        });
      }
    }

    // 2. Try production serve-upload API (bypasses static file routing issues)
    if (filename) {
      const prodUrl = `https://realshare-admin.onrender.com/api/serve-upload?file=${encodeURIComponent(filename)}`;
      try {
        const res = await fetch(prodUrl);
        if (res.ok) {
          const contentType = res.headers.get('content-type') || 'image/jpeg';
          const buffer = await res.arrayBuffer();
          return new NextResponse(buffer, {
            headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' },
          });
        }
      } catch (e) {
        // Fall through to direct URL attempt
      }
    }

    // 3. Try the full URL directly
    let fullUrl = imageUrl;
    if (!imageUrl.startsWith('http')) {
      fullUrl = `https://realshare-admin.onrender.com${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }

    try {
      const res = await fetch(fullUrl, { redirect: 'manual' });
      // 301/302 redirects usually mean the server is trying to send us to the login page
      if (res.status >= 300 && res.status < 400) {
        return NextResponse.json({ error: 'Image not accessible (redirected)' }, { status: 404 });
      }
      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        const buffer = await res.arrayBuffer();
        return new NextResponse(buffer, {
          headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' },
        });
      }
    } catch (e) {
      // fall through
    }

    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
