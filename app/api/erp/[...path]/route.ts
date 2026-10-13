import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, await params);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, await params);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, await params);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, await params);
}

async function handleProxy(req: NextRequest, { path }: { path: string[] }) {
  const erpUrl = process.env.ERPNEXT_URL || process.env.NEXT_PUBLIC_ERPNEXT_URL || 'https://demo.erpnext.com';
  const apiKey = process.env.ERPNEXT_API_KEY || 'mock_api_key';
  const apiSecret = process.env.ERPNEXT_API_SECRET || 'mock_api_secret';

  const subPath = path.join('/');
  const searchParams = req.nextUrl.searchParams.toString();
  const targetUrl = `${erpUrl}/${subPath}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const headers = new Headers();
    headers.set('Authorization', `token ${apiKey}:${apiSecret}`);
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');

    const init: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const body = await req.text();
      if (body) {
        init.body = body;
      }
    }

    const response = await fetch(targetUrl, init);
    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error: any) {
    console.error('ERPNext API Proxy Error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request to ERPNext backend', details: error.message },
      { status: 502 }
    );
  }
}
