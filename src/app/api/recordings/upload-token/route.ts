import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'

/**
 * SECURE CLIENT UPLOAD TOKEN
 * This endpoint allows the customer's browser to upload directly to Vercel's 
 * storage without hitting our 4.5MB serverless limit.
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
        // Generate a token that only allows audio uploads up to 50MB
        return {
          allowedContentTypes: [
            'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 
            'audio/webm', 'audio/m4a', 'audio/x-m4a', 'audio/aac', 
            'audio/flac', 'audio/3gpp', 'video/mp4', 'application/octet-stream'
          ],
          maximumSizeInBytes: 52_428_800, // 50MB limit
          tokenPayload: JSON.stringify({
            userId: session.id,
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This is called by Vercel after the upload is done
        console.log('[Blob] Direct upload completed:', blob.url)
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
}
