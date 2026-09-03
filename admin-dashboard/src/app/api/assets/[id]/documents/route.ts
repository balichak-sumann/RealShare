import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';

async function getUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (e) {
    return null;
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await getUser(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (asset.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await request.json();
    if (!data.title || !data.document_url || !data.document_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const document = await prisma.assetDocument.create({
      data: {
        asset_id: id,
        title: data.title,
        document_url: data.document_url,
        document_type: data.document_type,
      }
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Failed to create asset document:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}
