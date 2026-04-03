import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'

// Allowed hostnames for the media proxy — prevents SSRF attacks
const ALLOWED_BLOB_HOSTS = [
  'public.blob.vercel-storage.com',
  'blob.vercel-storage.com',
]

function isAllowedBlobUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return ALLOWED_BLOB_HOSTS.some(h => hostname === h || hostname.endsWith('.' + h))
  } catch {
    return false
  }
}

/**
 * Unified Media Handler
 * GET: Securely proxy private Vercel Blobs for client-side rendering.
 * POST: Upload new private media assets (like staff avatars).
 */

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  
  if (!url) return new NextResponse('Missing URL', { status: 400 })

  // Security: Reject any URL not pointing to Vercel Blob storage (prevents SSRF)
  if (!isAllowedBlobUrl(url)) {
    return new NextResponse('Forbidden: URL not allowed', { status: 403 })
  }

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
      }
    })
    
    if (!res.ok) return new NextResponse('Fetch failed', { status: res.status })

    const contentType = res.headers.get('Content-Type') || 'audio/mpeg'
    const contentLength = res.headers.get('Content-Length')

    /**
     * STREAMING PROXY (Critical for iOS Safari)
     * Piping res.body directly allows the browser to start playing before the download finishes.
     */
    return new NextResponse(res.body, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': contentLength || '',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400',
        'Content-Disposition': `inline; filename="media-${Date.now()}"`
      }
    })
  } catch (err: any) {
    return new NextResponse('Proxy Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null
  // Validate token is present AND cryptographically valid
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')

  if (!filename || !request.body) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 })
  }

  try {
    const securePath = `media/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const blob = await put(securePath, request.body, { access: 'private' })
    return NextResponse.json({ url: blob.url }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Upload Failed' }, { status: 500 })
  }
}
