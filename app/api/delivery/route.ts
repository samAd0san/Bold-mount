import { NextResponse } from 'next/server';
import { handle } from '@/lib/server/http';
import { readDelivery } from '@/lib/server/delivery';

export const dynamic = 'force-dynamic';

// Public like /api/catalog: lets a site running apart from the database (API_ORIGIN) read the delivery rule, cached for a minute.
export const GET = handle(async () =>
  NextResponse.json(await readDelivery(), { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }),
);
