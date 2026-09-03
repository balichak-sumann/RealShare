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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; documentId: string }> }) {
  try {
    const { id, documentId } = await params;
    const userId = await getUser(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const document = await prisma.assetDocument.findUnique({
      where: { id: documentId },
      include: { asset: true },
    });
    if (!document) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (document.asset_id !== id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (document.asset.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.assetDocument.delete({ where: { id: documentId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete asset document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
