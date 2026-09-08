import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';
import { deleteDeveloperWithProperties } from '@/lib/delete-cascade';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 1. Try developer entity
    const developer = await prisma.developer.findUnique({
      where: { id },
      include: {
        properties: {
          include: { images: true },
          orderBy: { created_at: 'desc' },
        },
        _count: { select: { properties: true } },
      },
    });

    if (developer) {
      return NextResponse.json(developer);
    }

    // 2. Try builder profile account
    const profile = await prisma.profile.findUnique({
      where: { id },
      include: {
        posted_properties: {
          include: { images: true },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (profile) {
      return NextResponse.json({
        id: profile.id,
        name: profile.full_name || profile.email || 'Registered Builder',
        email: profile.email,
        phone_number: profile.phone_number,
        logo_url: profile.avatar_url,
        bio: profile.full_address || `Registered Builder Account`,
        rating: 4.5,
        established_year: new Date(profile.created_at).getFullYear(),
        rera_registered: profile.kyc_status === 'verified',
        type: 'account',
        _count: { properties: profile.posted_properties.length },
        properties: profile.posted_properties,
        created_at: profile.created_at,
      });
    }

    return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
  } catch (error) {
    console.error('Failed to fetch developer:', error);
    return NextResponse.json({ error: 'Failed to fetch developer' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.ok) return authResult.response;

    const { id } = await params;
    const data = await request.json();

    // 1. Check developer entity
    const existingDev = await prisma.developer.findUnique({ where: { id } });
    if (existingDev) {
      const updated = await prisma.developer.update({
        where: { id },
        data: {
          name: data.name !== undefined ? data.name : existingDev.name,
          logo_url: data.logo_url !== undefined ? data.logo_url : existingDev.logo_url,
          bio: data.bio !== undefined ? data.bio : existingDev.bio,
          rating: data.rating !== undefined ? data.rating : existingDev.rating,
          established_year: data.established_year !== undefined ? data.established_year : existingDev.established_year,
          rera_registered: data.rera_registered !== undefined ? data.rera_registered : existingDev.rera_registered,
        },
      });
      return NextResponse.json(updated);
    }

    // 2. Check builder profile account
    const existingProfile = await prisma.profile.findUnique({ where: { id } });
    if (existingProfile) {
      const updatedProfile = await prisma.profile.update({
        where: { id },
        data: {
          full_name: data.name !== undefined ? data.name : existingProfile.full_name,
          avatar_url: data.logo_url !== undefined ? data.logo_url : existingProfile.avatar_url,
        },
      });
      return NextResponse.json({
        id: updatedProfile.id,
        name: updatedProfile.full_name,
        logo_url: updatedProfile.avatar_url,
        bio: updatedProfile.full_address,
        rating: 4.5,
        established_year: new Date(updatedProfile.created_at).getFullYear(),
        rera_registered: updatedProfile.kyc_status === 'verified',
        type: 'account',
      });
    }

    return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
  } catch (error) {
    console.error('Failed to update developer:', error);
    return NextResponse.json({ error: 'Failed to update developer' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.ok) return authResult.response;

    const { id } = await params;
    await deleteDeveloperWithProperties(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete developer:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete developer' }, { status: 500 });
  }
}
