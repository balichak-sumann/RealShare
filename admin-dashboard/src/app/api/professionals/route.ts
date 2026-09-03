import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Public directory of agents and developers who have active listings on the
// platform. Only safe, non-sensitive fields are exposed (no phone/email/
// commission data) -- real names and real listing counts derived from actual
// posted properties, no fabricated ratings or review counts for agents since
// no review system exists for them.
export async function GET() {
  try {
    const agentProfiles = await prisma.profile.findMany({
      where: {
        role: 'agent',
        posted_properties: { some: {} },
      },
      select: {
        id: true,
        full_name: true,
        created_at: true,
        posted_properties: {
          select: { locality: true, district: true },
        },
      },
    });

    const agents = agentProfiles.map((a) => {
      // Most common locality among this agent's listings.
      const counts: Record<string, number> = {};
      for (const p of a.posted_properties) {
        const loc = [p.locality, p.district].filter(Boolean).join(', ');
        if (loc) counts[loc] = (counts[loc] || 0) + 1;
      }
      const topLocality = Object.entries(counts).sort((x, y) => y[1] - x[1])[0]?.[0] || null;
      return {
        id: a.id,
        type: 'agent' as const,
        name: a.full_name,
        locality: topLocality,
        listings: a.posted_properties.length,
      };
    });

    const developerRows = await prisma.developer.findMany({
      include: { _count: { select: { properties: true } } },
      orderBy: { created_at: 'desc' },
    });

    const developers = developerRows
      .filter((d) => d._count.properties > 0)
      .map((d) => ({
        id: d.id,
        type: 'developer' as const,
        name: d.name,
        locality: null as string | null,
        listings: d._count.properties,
        rating: Number(d.rating),
        rera_registered: d.rera_registered,
      }));

    return NextResponse.json({ agents, developers });
  } catch (error) {
    console.error('Failed to fetch professionals:', error);
    return NextResponse.json({ error: 'Failed to fetch professionals' }, { status: 500 });
  }
}
