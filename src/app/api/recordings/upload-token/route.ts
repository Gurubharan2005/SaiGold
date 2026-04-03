import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'

// USE THE EDGE RUNTIME FOR MAXIMUM SPEED AND 60S TIMEOUTS
export const runtime = 'edge'

/**
 * NUCLEAR TOKEN GENERATOR (EDGE)
 * This is the final stable version of the handshake logic.
 * It uses Vercel Edge for zero cold-starts and 60s processing limits.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  if (!session?.id) {
    console.warn('[Edge-Handshake] Unauthorized attempt or stale session')
    return NextResponse.json({ error: 'Session Expired. Please Logout/Login.' }, { status: 401 })
  }

  const body = (await request.json()) as HandleUploadBody
  const traceId = `edge_${Math.random().toString(36).substring(7)}`

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        console.log(`[Edge-Handshake][${traceId}] Handshake for ${pathname}`)
        
        return {
          allowedContentTypes: [
            'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 
            'audio/webm', 'audio/m4a', 'audio/x-m4a', 'audio/aac', 
            'audio/flac', 'audio/3gpp', 'video/mp4', 'application/octet-stream'
          ],
          maximumSizeInBytes: 52_428_800, // 50MB
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            userId: session.id,
            traceId
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload || '{}')
        console.log(`[Edge-Handshake][${payload.traceId}] Final Storage Success: ${blob.url}`)
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error: any) {
    console.error(`[Edge-Handshake][${traceId}] Error:`, error.message)
    return NextResponse.json(
      { error: `Handshake Failed: ${error.message}`, traceId },
      { status: 400 }
    )
  }
}
