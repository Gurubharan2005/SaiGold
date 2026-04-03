import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'

/**
 * ENTERPRISE SIGNED UPLOAD API
 * According to Vercel documentation, for direct client uploads to work securely,
 * we must provide a signed upload URL handshake.
 * This route generates the short-lived, signed token for the browser.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  if (!session?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        /**
         * Step 1: Signed Handshake
         * This creates the unique, time-limited permission for the client.
         */
        return {
          allowedContentTypes: [
            'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/ogg', 
            'audio/webm', 'audio/m4a', 'audio/x-m4a', 'audio/aac', 
            'audio/flac', 'audio/3gpp', 'audio/x-aiff', 'audio/basic', 'audio/mid',
            'video/mp4', 'application/octet-stream'
          ],
          maximumSizeInBytes: 52_428_800, // 50MB
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
             userId: session.id,
             customerPath: pathname
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        /**
         * Step 2: Final Handshake (Server-side Callback)
         * Only called after upload is fully successful to storage.
         */
        console.log('[Upload-Audio] Signed upload finalized successfully:', blob.url)
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error: any) {
    return NextResponse.json(
      { error: `Signed HANDSHAKE failed: ${error.message}` },
      { status: 400 }
    )
  }
}
