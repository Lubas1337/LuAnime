import { NextRequest, NextResponse } from 'next/server';
import { recordServerPageView, recordServerClick } from '@/lib/analytics/server-storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, visitorId, path, title, element, text, referrer, screenWidth, screenHeight, language } = body;

    if (!visitorId || !path) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userAgent = request.headers.get('user-agent') || '';

    if (type === 'pageview') {
      recordServerPageView(
        visitorId,
        path,
        title || '',
        userAgent,
        referrer,
        screenWidth,
        screenHeight,
        language
      );
    } else if (type === 'click') {
      recordServerClick(visitorId, path, element || 'unknown', text);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics track error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
