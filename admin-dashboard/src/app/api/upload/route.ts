import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import fs from 'fs';
import path from 'path';

// Helper to derive a stable public base URL.
// In production on Render, NEXT_PUBLIC_APP_URL should be set to
// "https://realshare-5l24.onrender.com" (no trailing slash).
// Falls back to http://localhost:3000 for local dev.
function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL ||
                 process.env.ALLOWED_ORIGINS?.split(',').find(o => o.startsWith('https://'));
  return (envUrl || 'http://localhost:3000').replace(/\/$/, '');
}

export async function POST(req: Request) {
  try {
    // Require admin auth so arbitrary callers can't upload files.
    const auth = await requireAdmin(req.clone());
    if (!auth.ok) return auth.response;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided in field "file"' }, { status: 400 });
    }

    // Validate MIME type — only allow image and video files.
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
      'video/mp4', 'video/quicktime', 'video/webm',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `File type "${file.type}" is not allowed.` }, { status: 400 });
    }

    // Max 20MB
    const MAX_BYTES = 20 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File exceeds the 20MB size limit.' }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.name) || '.bin';
    const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    const filePath = path.join(uploadsDir, safeName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `${getBaseUrl()}/uploads/${safeName}`;
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization',
    },
  });
}
