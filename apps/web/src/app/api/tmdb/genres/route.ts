import { NextResponse } from 'next/server';

import { proxyGetToApi } from '../../_utils/backendProxy';

export async function GET() {
  try {
    return await proxyGetToApi('/tmdb/genres');
  } catch (e: any) {
    return NextResponse.json({ message: e?.message ?? 'TMDb error' }, { status: 502 });
  }
}
