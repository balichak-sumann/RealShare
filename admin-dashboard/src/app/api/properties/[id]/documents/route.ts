import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';

const ALLOWED_FILE_TYPES = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'csv', 'txt'];

async function getUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await auth.verifyIdToken(token);
      const profile = await prisma.profile.findUnique({
        where: { id: decodedToken.uid },
        select: { role: true },
      });
      const role = profile?.role?.toLowerCase() || 'buyer';
      return { uid: decodedToken.uid, role, isAdmin: role === 'admin' };
    } catch {
      return null;
    }
  }
  return null;
}

/** GET /api/properties/[id]/documents — list all documents for a property */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const documents = await (prisma as any).propertyDocument.findMany({
      where: { property_id: id },
      orderBy: { uploaded_at: 'asc' },
    });
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Failed to fetch property documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

/** POST /api/properties/[id]/documents — add documents to a property (admin only) */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!user.isAdmin && user.role !== 'agent' && user.role !== 'builder') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });

    const data = await request.json();
    // data.documents = [{ title, document_url, file_type, file_size? }]
    if (!Array.isArray(data.documents) || data.documents.length === 0) {
      return NextResponse.json({ error: 'documents array required' }, { status: 400 });
    }

    const toCreate = data.documents
      .filter((d: any) => d.document_url && d.title)
      .map((d: any) => {
        const ext = (d.file_type || '').toLowerCase().replace(/^\./, '');
        return {
          property_id: id,
          title: String(d.title).trim(),
          document_url: String(d.document_url).trim(),
          file_type: ALLOWED_FILE_TYPES.includes(ext) ? ext : 'pdf',
          file_size: d.file_size ? BigInt(d.file_size) : null,
        };
      });

    if (toCreate.length === 0) {
      return NextResponse.json({ error: 'No valid documents provided' }, { status: 400 });
    }

    const created = await (prisma as any).propertyDocument.createMany({ data: toCreate });
    return NextResponse.json({ success: true, count: created.count }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to add documents:', error);
    return NextResponse.json({ error: error.message || 'Failed to add documents' }, { status: 500 });
  }
}

/** DELETE /api/properties/[id]/documents?doc_id=xxx — remove a document (admin only) */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('doc_id');
    if (!docId) return NextResponse.json({ error: 'doc_id query param required' }, { status: 400 });

    const doc = await (prisma as any).propertyDocument.findUnique({ where: { id: docId } });
    if (!doc || doc.property_id !== id) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await (prisma as any).propertyDocument.delete({ where: { id: docId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete document:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete' }, { status: 500 });
  }
}
