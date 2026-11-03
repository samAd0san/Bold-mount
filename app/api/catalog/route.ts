import { NextResponse } from 'next/server';
import { catalogFromDb } from '@/lib/server/catalog';
import { handle } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

// Public and cacheable: the CDN keeps it for a minute, so a busy shop doesn't hit the database on every page.
export const GET = handle(async () =>
  NextResponse.json(await catalogFromDb(), { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }),
);
