import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  if (!session) return new NextResponse('Unauthorized Access', { status: 401 })

  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  
  if (!url) return new NextResponse('Missing Edge Blob URL', { status: 400 })

  try {
    // We act as an Edge Proxy securely authenticating against the Vercel Private S3 Store using our root backend token
    // This allows the img tags to natively fetch private arrays without breaking the Vercel Private Store constraints!
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
      }
    })
    
    if (!res.ok) {
      return new NextResponse('Vercel Edge Fetch failed', { status: res.status })
    }

    const arrayBuffer = await res.arrayBuffer()
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400' // Cache perfectly locally
      }
    })
  } catch (err: any) {
    console.error('Avatar Edge Proxy Crash:', err)
    return new NextResponse(`Proxy Error: ${err.message}`, { status: 500 })
  }
}
