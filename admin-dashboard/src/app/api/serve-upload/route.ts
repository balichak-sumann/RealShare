import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Serves uploaded files from the server's public/uploads directory
// This bypasses any Next.js routing/middleware issues with static files
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');

    if (!file) {
      return NextResponse.json({ error: 'Missing file parameter' }, { status: 400 });
    }

    // Sanitize - prevent directory traversal
    const sanitized = path.basename(file);
    const filePath = path.join(process.cwd(), 'public', 'uploads', sanitized);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.webp': 'image/webp', '.gif': 'image/gif', '.pdf': 'application/pdf',
    };

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeMap[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
