import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'

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

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
      }
    })
    
    if (!res.ok) return new NextResponse('Fetch failed', { status: res.status })

    const arrayBuffer = await res.arrayBuffer()
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400'
      }
    })
  } catch (err: any) {
    return new NextResponse('Proxy Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')

  if (!filename || !request.body) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 })
  }

  try {
    const securePath = `media/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const blob = await put(securePath, request.body, { access: 'private' })
    return NextResponse.json({ url: blob.url }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Upload Failed' }, { status: 500 })
  }
}
