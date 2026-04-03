import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'

/**
 * DEEP INVESTIGATION UPLOAD HANDLER
 * Configured specifically for multipart large files (5MB+)
 * includes trace logging and extended timeouts.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  if (!session?.id) {
    console.error('[Token-Gen] Unauthorized access attempt')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as HandleUploadBody
  const traceId = Math.random().toString(36).substring(7)

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        console.log(`[Token-Gen][${traceId}] Generating for ${pathname} (User: ${session.id})`)
        
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
        console.log(`[Token-Gen][${payload.traceId}] Upload to Blob completed: ${blob.url}`)
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error: any) {
    console.error(`[Token-Gen][${traceId}] Critical handler error:`, error.message)
    return NextResponse.json(
      { error: `Handshake Failed: ${error.message}`, traceId },
      { status: 400 }
    )
  }
}
