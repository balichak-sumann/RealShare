import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

// Same rules as the create route: image_url must be an absolute URL,
// link_url may be an absolute URL or an in-app path (e.g. "/properties").
function isValidAbsoluteUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isValidLinkTarget(value: string): boolean {
  if (value.startsWith('/')) return true;
  return isValidAbsoluteUrl(value);
}

// PATCH: supports both the quick active/inactive toggle (is_active only) and
// a full field edit (title/subtitle/badge/image_url/link_url) from the CMS
// edit modal. At least one recognized field must be present.
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const body = await request.json();
    const { is_active, title, subtitle, badge, image_url, link_url } = body;

    const data: any = {};
    if (is_active !== undefined) {
      if (typeof is_active !== 'boolean') {
        return NextResponse.json({ error: 'is_active must be a boolean' }, { status: 400 });
      }
      data.is_active = is_active;
    }
    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return NextResponse.json({ error: 'title cannot be empty' }, { status: 400 });
      }
      data.title = title;
    }
    if (subtitle !== undefined) data.subtitle = subtitle;
    if (badge !== undefined) data.badge = badge;
    if (image_url !== undefined) {
      if (typeof image_url !== 'string' || !isValidAbsoluteUrl(image_url)) {
        return NextResponse.json({ error: 'image_url must be a valid URL' }, { status: 400 });
      }
      data.image_url = image_url;
    }
    if (link_url !== undefined) {
      if (link_url && !isValidLinkTarget(link_url)) {
        return NextResponse.json({ error: 'link_url must be a valid URL or an in-app path starting with "/"' }, { status: 400 });
      }
      data.link_url = link_url;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const updated = await prisma.banner.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update banner:', error);
    return NextResponse.json({ error: error.message || 'Failed to update banner' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    await prisma.banner.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete banner:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete banner' }, { status: 500 });
  }
}
